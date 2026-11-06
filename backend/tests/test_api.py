import pytest
from app.database import get_db
from app.seed_data import seed_database
from app.routers.auth import login_demo_user, get_me
from app.routers.dashboard import get_dashboard_data
from app.routers.workouts import get_exercises, log_workout, get_recent_workouts, get_all_prs
from app.routers.quests import get_all_quests, claim_quest
from app.routers.league import get_league_standings, get_friends_leaderboard
from app.routers.settings import get_settings, update_settings, log_daily_checkin
from app.models.schemas import WorkoutCreate, WorkoutSetSchema, CheckinCreate, UserSettingsUpdate
from fastapi import HTTPException

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    db = get_db()
    seed_database(db)

def get_demo_user_dict():
    db = get_db()
    user = db.users.find_one({"email": "jordan@apexlift.app"})
    user_dict = dict(user)
    user_dict.pop("hashed_password", None)
    return user_dict

def test_demo_login_endpoint():
    res = login_demo_user()
    assert res["token_type"] == "bearer"
    assert len(res["access_token"]) > 20
    user = res["user"]
    assert user["email"] == "jordan@apexlift.app"
    assert user["full_name"] == "Jordan Davis"
    assert user["level"] == 12
    assert user["weekly_streak"] == 6
    assert user["class_title"] == "Berserker"

def test_dashboard_endpoint():
    user = get_demo_user_dict()
    data = get_dashboard_data(current_user=user)
    
    assert data["user"]["full_name"] == "Jordan Davis"
    assert data["user"]["level"] == 12
    assert data["user"]["weekly_streak"] == 6
    assert data["user"]["streak_freezes"] == 2
    assert data["user"]["streak_mult"] == 1.30

    assert "next_action" in data
    assert "cta_label" in data["next_action"]

    assert len(data["daily_quests"]) >= 1
    assert data["weekly_quest"] is not None
    assert data["boss_quest"] is not None

    assert len(data["radar_data"]) == 5
    assert data["weakest_stat"] in ["STR", "END", "AGI", "VIT", "DISCIPLINE"]
    assert len(data["weakest_hint"]) > 0

    assert data["weekly_stats"]["volume_kg"] > 0
    assert data["weekly_stats"]["consistency_pct"] > 0

def test_exercises_endpoint():
    exercises = get_exercises()
    assert len(exercises) >= 40
    stat_tags = set(e["stat_tag"] for e in exercises)
    assert "STR" in stat_tags
    assert "END" in stat_tags
    assert "AGI" in stat_tags

def test_log_workout_endpoint():
    user = get_demo_user_dict()
    req = WorkoutCreate(
        duration_minutes=48,
        is_mini_session=False,
        is_planned_session=True,
        energy_state="Energized",
        notes="Testing workout logging",
        sets=[
            WorkoutSetSchema(exercise_id="ex_sq", exercise_name="Barbell Back Squat", set_number=1, reps=5, weight_kg=90.0),
            WorkoutSetSchema(exercise_id="ex_sq", exercise_name="Barbell Back Squat", set_number=2, reps=5, weight_kg=95.0),
            WorkoutSetSchema(exercise_id="ex_bp", exercise_name="Barbell Bench Press", set_number=1, reps=5, weight_kg=75.0)
        ]
    )
    res = log_workout(req, current_user=user)
    assert res["success"] is True
    assert res["xp_earned"] > 0
    assert len(res["breakdown"]) >= 1
    assert "multipliers" in res

def test_log_workout_rejects_impossible_weight():
    user = get_demo_user_dict()
    req = WorkoutCreate(
        duration_minutes=30,
        sets=[
            WorkoutSetSchema(exercise_id="ex_bp", exercise_name="Barbell Bench Press", set_number=1, reps=5, weight_kg=850.0)
        ]
    )
    with pytest.raises(HTTPException) as excinfo:
        log_workout(req, current_user=user)
    assert excinfo.value.status_code == 400
    assert "exceeds plausible" in excinfo.value.detail

def test_quests_endpoint():
    user = get_demo_user_dict()
    res = get_all_quests(current_user=user)
    assert len(res["daily"]) >= 1
    assert res["weekly"] is not None
    assert res["boss"] is not None

def test_league_standings_endpoint():
    user = get_demo_user_dict()
    data = get_league_standings(tier="Diamond", current_user=user)
    assert data["current_tier"] == "Diamond"
    assert len(data["participants"]) >= 10
    assert data["user_rank"] >= 1
    assert data["participants"][0]["status"] == "promotion"

def test_checkin_endpoint():
    user = get_demo_user_dict()
    req = CheckinCreate(energy_state="Low energy", sleep_hours=7.0)
    res = log_daily_checkin(req, current_user=user)
    assert res["success"] is True

def test_settings_update_endpoint():
    user = get_demo_user_dict()
    req = UserSettingsUpdate(units="lbs", weekly_target=5, goal="Hit 5 days every single week")
    res = update_settings(req, current_user=user)
    assert res["success"] is True
    assert res["settings"]["units"] == "lbs"
    assert res["settings"]["weekly_target"] == 5
