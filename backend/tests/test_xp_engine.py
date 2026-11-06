import pytest
from app.xp_engine import (
    xp_required_for_next_level,
    calculate_cumulative_xp_for_level,
    calculate_level_from_total_xp,
    calculate_streak_multiplier,
    calculate_session_xp,
    calculate_checkin_xp,
    check_weight_plausibility,
    determine_character_class,
    DAILY_XP_CAP
)

def test_level_curve_progression():
    # round(50 * L^1.5)
    # L=1: 50 * 1 = 50
    assert xp_required_for_next_level(1) == 50
    # L=2: 50 * 2^1.5 = 50 * 2.8284 = 141.42 -> 141
    assert xp_required_for_next_level(2) == 141
    # L=3: 50 * 3^1.5 = 50 * 5.19615 = 259.8 -> 260
    assert xp_required_for_next_level(3) == 260

def test_calculate_level_from_total_xp():
    # 0 XP -> Level 1, 0 progress, 50 needed
    lvl, prog, needed = calculate_level_from_total_xp(0)
    assert lvl == 1
    assert prog == 0
    assert needed == 50

    # 40 XP -> Level 1, 40/50
    lvl, prog, needed = calculate_level_from_total_xp(40)
    assert lvl == 1
    assert prog == 40
    assert needed == 50

    # 50 XP -> Level 2, 0/141
    lvl, prog, needed = calculate_level_from_total_xp(50)
    assert lvl == 2
    assert prog == 0
    assert needed == 141

    # 50 + 141 = 191 XP -> Level 3, 0/260
    lvl, prog, needed = calculate_level_from_total_xp(191)
    assert lvl == 3
    assert prog == 0
    assert needed == 260

def test_streak_multiplier_formula_and_cap():
    # 0 weeks -> 1.0
    assert calculate_streak_multiplier(0) == 1.0
    # 2 weeks -> 1 + 0.10 = 1.10
    assert calculate_streak_multiplier(2) == 1.10
    # 6 weeks -> 1 + 0.30 = 1.30 (Matches Jordan Davis specs!)
    assert calculate_streak_multiplier(6) == 1.30
    # 10 weeks -> 1 + 0.50 = 1.50 (Cap)
    assert calculate_streak_multiplier(10) == 1.50
    # 20 weeks -> still 1.50 (Cap)
    assert calculate_streak_multiplier(20) == 1.50

def test_base_workout_xp():
    # Standard full workout, 0 streak, no bonuses
    res = calculate_session_xp(
        is_full_workout=True,
        is_mini_session=False,
        is_planned_session=False,
        is_first_workout_ever=False,
        new_prs_count=0,
        new_exercises_tried=0,
        weekly_target_hit=False,
        weekly_quest_cleared=False,
        weeks_in_streak=0,
        user_energy_state=None,
        is_comeback_session=False
    )
    assert res["final_xp"] == 100
    assert res["is_capped"] is False

    # Mini session alone: 40 XP
    res_mini = calculate_session_xp(
        is_full_workout=False,
        is_mini_session=True,
        is_planned_session=False,
        is_first_workout_ever=False,
        new_prs_count=0,
        new_exercises_tried=0,
        weekly_target_hit=False,
        weekly_quest_cleared=False,
        weeks_in_streak=0,
        user_energy_state=None,
        is_comeback_session=False
    )
    assert res_mini["final_xp"] == 40

    # Planned session bonus adds +25
    res_planned = calculate_session_xp(
        is_full_workout=True,
        is_mini_session=False,
        is_planned_session=True,
        is_first_workout_ever=False,
        new_prs_count=0,
        new_exercises_tried=0,
        weekly_target_hit=False,
        weekly_quest_cleared=False,
        weeks_in_streak=0,
        user_energy_state=None,
        is_comeback_session=False
    )
    assert res_planned["final_xp"] == 125

def test_low_energy_grit_multiplier():
    # User checked in "Low energy" and still showed up!
    # Base: 100 * 1.5 = 150
    res = calculate_session_xp(
        is_full_workout=True,
        is_mini_session=False,
        is_planned_session=False,
        is_first_workout_ever=False,
        new_prs_count=0,
        new_exercises_tried=0,
        weekly_target_hit=False,
        weekly_quest_cleared=False,
        weeks_in_streak=0,
        user_energy_state="Low energy",
        is_comeback_session=False
    )
    assert res["final_xp"] == 150
    assert res["multipliers"]["state"] == 1.5

def test_bonuses_and_caps():
    # 3 PRs (capped at 2 = +100), 3 new exercises (capped at 2 = +30)
    # Base 100 + 100 + 30 = 230 XP
    res = calculate_session_xp(
        is_full_workout=True,
        is_mini_session=False,
        is_planned_session=False,
        is_first_workout_ever=False,
        new_prs_count=3,
        new_exercises_tried=3,
        weekly_target_hit=False,
        weekly_quest_cleared=False,
        weeks_in_streak=0,
        user_energy_state=None,
        is_comeback_session=False
    )
    assert res["final_xp"] == 230

def test_daily_xp_cap_300():
    # With 2x comeback, first workout ever (+200), full workout (+100)
    # (100 + 200) * 2 = 600 raw XP -> MUST be capped at 300!
    res = calculate_session_xp(
        is_full_workout=True,
        is_mini_session=False,
        is_planned_session=False,
        is_first_workout_ever=True,
        new_prs_count=0,
        new_exercises_tried=0,
        weekly_target_hit=False,
        weekly_quest_cleared=False,
        weeks_in_streak=0,
        user_energy_state=None,
        is_comeback_session=True
    )
    assert res["raw_xp"] == 600
    assert res["final_xp"] == DAILY_XP_CAP
    assert res["is_capped"] is True

def test_second_session_same_day():
    # First session earned 100 XP.
    # Second session: full workout (100) * 0.25 = 25 XP
    res = calculate_session_xp(
        is_full_workout=True,
        is_mini_session=False,
        is_planned_session=False,
        is_first_workout_ever=False,
        new_prs_count=0,
        new_exercises_tried=0,
        weekly_target_hit=False,
        weekly_quest_cleared=False,
        weeks_in_streak=0,
        user_energy_state=None,
        is_comeback_session=False,
        is_second_session_same_day=True,
        current_day_xp_earned=100
    )
    assert res["final_xp"] == 25
    assert res["multipliers"]["second_session"] == 0.25

def test_daily_checkin():
    res = calculate_checkin_xp(current_day_xp_earned=0)
    assert res["final_xp"] == 10
    
    # When already at 295 XP, checkin yields min(10, 5) = 5
    res2 = calculate_checkin_xp(current_day_xp_earned=295)
    assert res2["final_xp"] == 5
    assert res2["is_capped"] is True

def test_weight_plausibility_checks():
    # Normal bench press
    valid, err = check_weight_plausibility("Bench Press", 80.0, 75.0)
    assert valid is True
    assert err is None

    # Negative weight
    valid, err = check_weight_plausibility("Squat", -10.0, None)
    assert valid is False
    assert "cannot be negative" in err

    # Over 600kg
    valid, err = check_weight_plausibility("Deadlift", 650.0, None)
    assert valid is False
    assert "exceeds plausible" in err

    # Impossible jump: from 60kg to 130kg (+70kg, >50%)
    valid, err = check_weight_plausibility("Bench Press", 130.0, 60.0)
    assert valid is False
    assert "Suspicious jump" in err

def test_character_class_assignment():
    # Under 10 workouts -> Novice
    stats = {"STR": 80, "END": 20, "AGI": 20, "VIT": 50, "DISCIPLINE": 60}
    assert determine_character_class(stats, total_workouts=5) == "Novice"

    # 10+ workouts:
    # High STR -> Powerlifter
    assert determine_character_class({"STR": 90, "END": 30, "AGI": 20, "VIT": 40, "DISCIPLINE": 50}, 15) == "Powerlifter"
    # High END -> Ranger
    assert determine_character_class({"STR": 30, "END": 85, "AGI": 20, "VIT": 40, "DISCIPLINE": 50}, 12) == "Ranger"
    # High AGI -> Berserker
    assert determine_character_class({"STR": 30, "END": 40, "AGI": 95, "VIT": 40, "DISCIPLINE": 50}, 10) == "Berserker"
    # High VIT/DISCIPLINE -> Monk
    assert determine_character_class({"STR": 40, "END": 40, "AGI": 30, "VIT": 92, "DISCIPLINE": 70}, 11) == "Monk"
