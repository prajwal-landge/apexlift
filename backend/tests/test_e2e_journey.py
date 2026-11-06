import pytest
from app.database import get_db
from app.seed_data import seed_database
from app.routers.auth import register, format_user_profile
from app.routers.dashboard import get_dashboard_data
from app.routers.workouts import log_workout, get_exercises, get_recent_workouts, get_all_prs
from app.routers.quests import get_all_quests, claim_quest
from app.routers.plans import get_programs, select_program
from app.routers.league import get_league_standings, get_friends_leaderboard, add_friend
from app.routers.settings import get_settings, update_settings, log_daily_checkin
from app.models.schemas import UserRegister, WorkoutCreate, WorkoutSetSchema, CheckinCreate, UserSettingsUpdate
from datetime import datetime, timezone, timedelta

@pytest.fixture(scope="module", autouse=True)
def setup_fresh_db():
    db = get_db()
    seed_database(db)

def test_complete_user_journey_e2e():
    db = get_db()
    
    # 1. Register a new user
    reg_req = UserRegister(
        email="alex.athlete@apexlift.app",
        password="securepassword123",
        full_name="Alex Athlete",
        units="kg",
        weekly_target=4,
        experience_level="Beginner",
        goal="Master the compound lifts"
    )
    auth_res = register(reg_req)
    assert auth_res["token_type"] == "bearer"
    user_data = auth_res["user"]
    user_id = user_data["id"]
    assert user_data["level"] == 1
    assert user_data["total_xp"] == 0
    assert user_data["class_title"] == "Novice"

    # User dict for subsequent calls
    user_doc = db.users.find_one({"id": user_id})
    user_dict = dict(user_doc)
    user_dict.pop("hashed_password", None)

    # 2. Check initial dashboard
    dash = get_dashboard_data(current_user=user_dict)
    assert dash["user"]["level"] == 1
    assert dash["today_checkin"]["completed"] is False
    assert dash["next_action"]["action_type"] == "checkin"

    # 3. Perform Daily Check-in with "Low energy"
    chk_req = CheckinCreate(energy_state="Low energy", sleep_hours=6.0)
    chk_res = log_daily_checkin(chk_req, current_user=user_dict)
    assert chk_res["success"] is True
    assert chk_res["xp_earned"] == 10

    # Refresh user
    user_doc = db.users.find_one({"id": user_id})
    user_dict = dict(user_doc)
    user_dict.pop("hashed_password", None)
    assert user_dict["total_xp"] == 10

    # 4. Log First Workout Ever (Planned Session with Squat & Bench)
    w_req = WorkoutCreate(
        duration_minutes=45,
        is_mini_session=False,
        is_planned_session=True,
        energy_state="Low energy",
        notes="Grit session - showed up tired!",
        sets=[
            WorkoutSetSchema(exercise_id="ex_sq", exercise_name="Barbell Back Squat", set_number=1, reps=5, weight_kg=60.0),
            WorkoutSetSchema(exercise_id="ex_sq", exercise_name="Barbell Back Squat", set_number=2, reps=5, weight_kg=65.0),
            WorkoutSetSchema(exercise_id="ex_bp", exercise_name="Barbell Bench Press", set_number=1, reps=5, weight_kg=50.0)
        ]
    )
    w_res = log_workout(w_req, current_user=user_dict)
    assert w_res["success"] is True
    # Base: 100 * 1.5 (Low energy) + 25 (planned) = 175
    # First workout ever bonus: +200
    # PRs: +100
    # New exercises: +30
    # Total would exceed 300 daily cap, so it must cap at 290 (since 10 already earned today from checkin)
    assert w_res["xp_earned"] == 290
    assert w_res["is_capped"] is True
    assert w_res["level_up"] is True
    assert w_res["new_level"] >= 2

    # Refresh user
    user_doc = db.users.find_one({"id": user_id})
    user_dict = dict(user_doc)
    user_dict.pop("hashed_password", None)
    assert user_dict["total_xp"] == 300 # 10 checkin + 290 workout
    assert user_dict["level"] >= 2

    # 5. Log a Second Session on the same day -> verify 25% multiplier logic and daily cap
    w2_req = WorkoutCreate(
        duration_minutes=20,
        is_mini_session=True,
        is_planned_session=False,
        energy_state="Okay",
        notes="Evening mobility",
        sets=[
            WorkoutSetSchema(exercise_id="ex_hlr", exercise_name="Hanging Leg Raise", set_number=1, reps=10, weight_kg=0.0)
        ]
    )
    w2_res = log_workout(w2_req, current_user=user_dict)
    assert w2_res["multipliers"]["second_session"] == 0.25
    # Since daily cap of 300 is already reached today, additional XP should be 0
    assert w2_res["xp_earned"] == 0

    # 6. Test Program Selection
    progs = get_programs(current_user=user_dict)
    assert len(progs["programs"]) >= 3
    sel_res = select_program("prog_ppl", current_user=user_dict)
    assert sel_res["success"] is True
    progs_after = get_programs(current_user=user_dict)
    assert progs_after["active_user_program"]["program_id"] == "prog_ppl"

    # 7. Test Settings update (Units to lbs, Weekly Target to 5)
    settings_req = UserSettingsUpdate(units="lbs", weekly_target=5, goal="Hit 5 sessions every week")
    set_res = update_settings(settings_req, current_user=user_dict)
    assert set_res["success"] is True
    assert set_res["settings"]["units"] == "lbs"
    assert set_res["settings"]["weekly_target"] == 5

    # 8. Test Quests
    quests = get_all_quests(current_user=user_dict)
    assert len(quests["daily"]) >= 1
    assert quests["weekly"] is not None
    assert quests["boss"] is not None

    # 9. Test League Standings & Adding Friends
    league = get_league_standings(tier="Bronze", current_user=user_dict)
    assert league["current_tier"] == "Bronze"
    assert len(league["participants"]) >= 10

    # Add Jordan Davis as friend
    friend_res = add_friend(data={"username": "jordan_davis"}, current_user=user_dict)
    assert friend_res["success"] is True

    # Friends leaderboard should now show Jordan Davis
    friends_lead = get_friends_leaderboard(current_user=user_dict)
    friend_usernames = [f["username"] for f in friends_lead]
    assert "jordan_davis" in friend_usernames

    # 10. Test PRs list
    prs = get_all_prs(current_user=user_dict)
    assert len(prs) >= 2
    pr_exercises = [p["exercise"] for p in prs]
    assert "Barbell Back Squat" in pr_exercises
    assert "Barbell Bench Press" in pr_exercises
