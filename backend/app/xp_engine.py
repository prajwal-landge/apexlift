"""
XP Engine for ApexLift.
Core rule: XP rewards SHOWING UP, never lifting heavier. No XP is ever tied to the weight lifted.

XP per day formula:
XP per day = min( (Base + Bonuses) x StreakMult x StateMult x ComebackMult, 300 )

Base (once per day):
- Full workout (15+ minutes or gym check-in): 100
- Mini session (at least 1 set): 40
- Daily check-in: +10
- Completed a planned session from program: +25

Bonuses:
- New personal record: +50 (max 2 per session)
- New exercise tried: +15 (max 2 per week)
- Weekly session target hit: +150 (once per week)
- Weekly quest cleared: +100 (once per week)
- First workout ever: +200 one-time

Multipliers:
- StreakMult = min(1 + 0.05 * weeks_in_streak, 1.5)
- StateMult = 1.5 applied to Base if user checked in "Low energy" and still trained, else 1.0
- ComebackMult = 2 for first 3 sessions after 5+ days inactive, else 1.0

Rules:
- A second session on the same day earns only 25% XP.
- Plausibility checks on logged weights (flag impossible jumps).
- Max level 50. XP needed from level L to L+1 = round(50 * L^1.5).
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone, timedelta
import math

MAX_LEVEL = 50
DAILY_XP_CAP = 300

def xp_required_for_next_level(level: int) -> int:
    """XP needed to advance from level L to L+1 = round(50 * L^1.5)."""
    if level >= MAX_LEVEL:
        return 0
    return round(50.0 * (level ** 1.5))

def calculate_cumulative_xp_for_level(level: int) -> int:
    """Total XP required to reach level L from level 1."""
    if level <= 1:
        return 0
    total = 0
    for l in range(1, level):
        total += xp_required_for_next_level(l)
    return total

def calculate_level_from_total_xp(total_xp: int) -> Tuple[int, int, int]:
    """
    Given total accumulated XP, returns:
    (current_level, current_level_xp, xp_for_next_level)
    """
    if total_xp <= 0:
        return 1, 0, xp_required_for_next_level(1)
    
    current_level = 1
    remaining_xp = total_xp
    
    while current_level < MAX_LEVEL:
        needed = xp_required_for_next_level(current_level)
        if remaining_xp >= needed:
            remaining_xp -= needed
            current_level += 1
        else:
            break
            
    if current_level >= MAX_LEVEL:
        return MAX_LEVEL, remaining_xp, 0
        
    return current_level, remaining_xp, xp_required_for_next_level(current_level)

def calculate_streak_multiplier(weeks_in_streak: int) -> float:
    """StreakMult = 1 + 0.05 x weeks_in_streak, capped at 1.5."""
    mult = 1.0 + (0.05 * max(0, weeks_in_streak))
    return round(min(mult, 1.5), 3)

def check_weight_plausibility(
    exercise_name: str, 
    new_weight: float, 
    previous_pr: Optional[float]
) -> Tuple[bool, Optional[str]]:
    """
    Plausibility check on logged weights (flag impossible jumps).
    Weight cannot be negative or absurdly high (e.g. > 600kg / 1320lbs).
    Also flags jump > 50% or +50kg in a single jump from previous PR.
    """
    if new_weight < 0:
        return False, "Weight cannot be negative."
    if new_weight > 600:
        return False, f"Weight of {new_weight} exceeds plausible world-record limits (600kg)."
    
    if previous_pr and previous_pr > 20:
        jump_pct = (new_weight - previous_pr) / previous_pr
        jump_abs = new_weight - previous_pr
        if jump_abs > 50 and jump_pct > 0.50:
            return False, f"Suspicious jump of +{jump_abs:.1f}kg (+{jump_pct*100:.0f}%) from previous PR {previous_pr:.1f}kg. Please verify."
            
    return True, None

def calculate_session_xp(
    is_full_workout: bool,
    is_mini_session: bool,
    is_planned_session: bool,
    is_first_workout_ever: bool,
    new_prs_count: int,
    new_exercises_tried: int,
    weekly_target_hit: bool,
    weekly_quest_cleared: bool,
    weeks_in_streak: int,
    user_energy_state: Optional[str],
    is_comeback_session: bool,
    is_second_session_same_day: bool = False,
    current_day_xp_earned: int = 0
) -> Dict[str, Any]:
    """
    Calculates XP for a workout session with exact breakdown.
    
    Formula:
    Base = (WorkoutBase [100 or 40] * StateMult) + (25 if planned else 0)
    Note: StateMult = 1.5 applied to Base if user checked in "Low energy" and still trained.
    Bonuses = PRs (50 ea, max 2) + New Exercises (15 ea, max 2) + Target hit (150) + Weekly quest (100) + First ever (200)
    
    Total before cap = (Base + Bonuses) x StreakMult x ComebackMult
    If second session today: * 0.25
    Daily XP earned cannot push day total over DAILY_XP_CAP (300).
    """
    breakdown: List[Dict[str, Any]] = []
    
    # 1. Base determination
    raw_workout_base = 0
    if is_full_workout:
        raw_workout_base = 100
        breakdown.append({"type": "full_workout", "label": "Full Workout (15+ min)", "amount": 100})
    elif is_mini_session:
        raw_workout_base = 40
        breakdown.append({"type": "mini_session", "label": "Mini Session (Consistency Win)", "amount": 40})
        
    state_mult = 1.5 if (user_energy_state and user_energy_state.lower() == "low energy") else 1.0
    workout_base = raw_workout_base * state_mult
    if state_mult > 1.0:
        breakdown.append({
            "type": "state_mult", 
            "label": "Low Energy Grit Bonus (1.5x Base)", 
            "amount": int(raw_workout_base * 0.5)
        })

    planned_base = 0
    if is_planned_session:
        planned_base = 25
        breakdown.append({"type": "planned_session", "label": "Planned Program Session", "amount": 25})
        
    base_total = workout_base + planned_base
    
    # 2. Bonuses
    bonuses_total = 0
    
    # PRs capped at max 2 per session
    valid_prs = min(max(0, new_prs_count), 2)
    if valid_prs > 0:
        pr_amount = valid_prs * 50
        bonuses_total += pr_amount
        breakdown.append({"type": "pr_bonus", "label": f"New PR Milestone ({valid_prs}x)", "amount": pr_amount})
        
    # New exercise tried capped at 2
    valid_new_ex = min(max(0, new_exercises_tried), 2)
    if valid_new_ex > 0:
        ex_amount = valid_new_ex * 15
        bonuses_total += ex_amount
        breakdown.append({"type": "new_exercise", "label": f"Exploration Bonus ({valid_new_ex}x)", "amount": ex_amount})
        
    if weekly_target_hit:
        bonuses_total += 150
        breakdown.append({"type": "weekly_target_hit", "label": "Weekly Target Crushed", "amount": 150})
        
    if weekly_quest_cleared:
        bonuses_total += 100
        breakdown.append({"type": "weekly_quest_cleared", "label": "Weekly Quest Complete", "amount": 100})
        
    if is_first_workout_ever:
        bonuses_total += 200
        breakdown.append({"type": "first_workout", "label": "First Step on the Summit", "amount": 200})
        
    # 3. Multipliers
    streak_mult = calculate_streak_multiplier(weeks_in_streak)
    comeback_mult = 2.0 if is_comeback_session else 1.0
    
    subtotal = (base_total + bonuses_total) * streak_mult * comeback_mult
    
    if streak_mult > 1.0:
        breakdown.append({"type": "streak_multiplier", "label": f"{weeks_in_streak}w Streak Multiplier", "multiplier": streak_mult})
    if comeback_mult > 1.0:
        breakdown.append({"type": "comeback_multiplier", "label": "The Return (2.0x Comeback)", "multiplier": comeback_mult})

    # Second session on same day earns only 25% XP
    if is_second_session_same_day:
        subtotal *= 0.25
        breakdown.append({"type": "second_session_reduction", "label": "2nd Session Today (25%)", "multiplier": 0.25})

    raw_xp = round(subtotal)
    
    # Apply daily cap
    available_daily_xp = max(0, DAILY_XP_CAP - current_day_xp_earned)
    final_xp = min(raw_xp, available_daily_xp)
    
    is_capped = final_xp < raw_xp
    
    return {
        "final_xp": final_xp,
        "raw_xp": raw_xp,
        "is_capped": is_capped,
        "daily_cap_remaining": max(0, available_daily_xp - final_xp),
        "breakdown": breakdown,
        "multipliers": {
            "streak": streak_mult,
            "state": state_mult,
            "comeback": comeback_mult,
            "second_session": 0.25 if is_second_session_same_day else 1.0
        }
    }

def calculate_checkin_xp(current_day_xp_earned: int = 0) -> Dict[str, Any]:
    """Daily check-in earns +10 XP, subject to daily cap."""
    raw_xp = 10
    available = max(0, DAILY_XP_CAP - current_day_xp_earned)
    final_xp = min(raw_xp, available)
    return {
        "final_xp": final_xp,
        "raw_xp": raw_xp,
        "is_capped": final_xp < raw_xp,
        "breakdown": [{"type": "daily_checkin", "label": "Daily Ready Check", "amount": 10}]
    }

def determine_character_class(stats: Dict[str, float], total_workouts: int) -> str:
    """
    Assign a class after 10 workouts based on the highest stat:
    - STR -> Powerlifter
    - END -> Ranger
    - AGI -> Berserker
    - VIT or DISCIPLINE -> Monk (or balanced/disciplined)
    Before 10 workouts: 'Novice'
    """
    if total_workouts < 10:
        return "Novice"
        
    # Compare key stats
    stat_mapping = {
        "STR": "Powerlifter",
        "END": "Ranger",
        "AGI": "Berserker",
        "VIT": "Monk",
        "DISCIPLINE": "Monk"
    }
    
    highest_stat = max(stats.items(), key=lambda x: x[1])[0]
    return stat_mapping.get(highest_stat, "Berserker")
