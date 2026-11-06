from fastapi import APIRouter, Depends
from app.database import get_db
from app.auth import get_current_user
from app.xp_engine import calculate_level_from_total_xp, calculate_streak_multiplier
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("")
def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    
    # 1. User Hero & XP Progress
    total_xp = current_user.get("total_xp", 0)
    if current_user.get("current_level_xp") is not None and current_user.get("level") is not None and current_user.get("xp_needed_next_level") is not None:
        level = current_user.get("level")
        cur_xp = current_user.get("current_level_xp")
        needed_xp = current_user.get("xp_needed_next_level")
    else:
        level, cur_xp, needed_xp = calculate_level_from_total_xp(total_xp)
    streak_weeks = current_user.get("weekly_streak", 0)
    streak_mult = calculate_streak_multiplier(streak_weeks)
    
    # 2. Check today's check-in
    today_checkin = db.checkins.find_one({"user_id": user_id, "date": today_str})
    has_checked_in = today_checkin is not None
    today_energy = today_checkin.get("energy_state") if today_checkin else None

    # 3. Today's workouts
    today_workouts = list(db.workouts.find({"user_id": user_id, "date": today_str}))
    has_worked_out_today = len(today_workouts) > 0

    # 4. Next Best Action recommendation
    if not has_checked_in:
        next_action = {
            "title": "Daily Ready Check",
            "subtitle": "Check in your energy level (+10 XP) before lifting.",
            "cta_label": "Check In Now",
            "action_type": "checkin"
        }
    elif not has_worked_out_today:
        next_action = {
            "title": "Claim The Bar",
            "subtitle": f"Start your planned session to earn +100 Base XP with {streak_mult}x streak multiplier.",
            "cta_label": "Start Workout",
            "action_type": "workout"
        }
    else:
        next_action = {
            "title": "Victory Logged",
            "subtitle": "You showed up today. Rest, recover, and let the adaptation build.",
            "cta_label": "Log Mini Session",
            "action_type": "mini_workout"
        }

    # 5. Quests
    quests = list(db.quests.find({"user_id": user_id}, {"_id": 0}))
    daily_quests = [q for q in quests if q.get("type") == "daily"]
    weekly_quest = next((q for q in quests if q.get("type") == "weekly"), None)
    boss_quest = next((q for q in quests if q.get("type") == "boss"), None)

    # 6. Character Stats & Radar Data + Weakest Stat Hint
    stats = current_user.get("stats", {
        "STR": 50.0,
        "END": 50.0,
        "AGI": 50.0,
        "VIT": 50.0,
        "DISCIPLINE": 50.0
    })
    
    radar_data = [
        {"subject": "STR", "value": stats.get("STR", 50.0), "fullMark": 100},
        {"subject": "END", "value": stats.get("END", 50.0), "fullMark": 100},
        {"subject": "AGI", "value": stats.get("AGI", 50.0), "fullMark": 100},
        {"subject": "VIT", "value": stats.get("VIT", 50.0), "fullMark": 100},
        {"subject": "DISCIPLINE", "value": stats.get("DISCIPLINE", 50.0), "fullMark": 100}
    ]
    
    # Identify weakest stat
    weakest_stat = min(stats.items(), key=lambda x: x[1])
    stat_hints = {
        "STR": "Focus on compound barbell movements (Squat, Deadlift, Bench) to surge your Strength.",
        "END": "Incorporate assault bike intervals or high-rep accessory sets to elevate Endurance.",
        "AGI": "Add unilateral split squats, hanging leg raises, and core rollouts to sharpen Agility.",
        "VIT": "Log daily sleep and prioritize rest days to restore Vitality.",
        "DISCIPLINE": "Protect your weekly workout target to forge unbreakable Discipline."
    }
    weakest_hint = stat_hints.get(weakest_stat[0], "Stay consistent across all training pillars.")

    # 7. Current Goal Card
    goal_text = current_user.get("goal", "Consistent 4x/week lifting & 140kg Deadlift")
    # Check Deadlift PR
    dl_pr = 0.0
    for w in db.workouts.find({"user_id": user_id, "sets.exercise_id": "ex_dl"}):
        for s in w.get("sets", []):
            if s.get("exercise_id") == "ex_dl" and s.get("weight_kg", 0) > dl_pr:
                dl_pr = s.get("weight_kg", 0)
    if dl_pr == 0.0:
        dl_pr = 135.0
        
    goal_target = 140.0
    goal_progress_pct = round(min(100.0, (dl_pr / goal_target) * 100.0), 1)

    # 8. Weekly stats: Volume & Consistency %
    start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_workouts = list(db.workouts.find({
        "user_id": user_id,
        "created_at": {"$gte": start_of_week.isoformat()}
    }))
    
    # Total volume this week (sum of reps * weight_kg)
    weekly_volume_kg = 0.0
    for w in week_workouts:
        for s in w.get("sets", []):
            weekly_volume_kg += (s.get("reps", 0) * s.get("weight_kg", 0))

    weekly_target = current_user.get("weekly_target", 4)
    consistency_pct = round(min(100.0, (len(week_workouts) / max(1, weekly_target)) * 100.0), 1)

    # 9. Recent Workouts Feed (last 4)
    recent_workouts = list(db.workouts.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(4))

    # 10. Top Personal Records
    prs = []
    pr_workouts = db.workouts.find({"user_id": user_id, "sets.is_pr": True})
    pr_dict = {}
    for w in pr_workouts:
        for s in w.get("sets", []):
            if s.get("is_pr"):
                ex_name = s.get("exercise_name")
                wt = s.get("weight_kg", 0)
                if ex_name not in pr_dict or wt > pr_dict[ex_name]["weight"]:
                    pr_dict[ex_name] = {"exercise": ex_name, "weight": wt, "reps": s.get("reps", 1)}
    prs = sorted(list(pr_dict.values()), key=lambda x: x["weight"], reverse=True)[:4]

    # 11. Milestone timeline
    milestones = list(db.milestones.find({"user_id": user_id}, {"_id": 0}).sort("achieved_at", -1).limit(4))

    return {
        "user": {
            "id": user_id,
            "full_name": current_user.get("full_name"),
            "username": current_user.get("username"),
            "avatar_url": current_user.get("avatar_url"),
            "level": level,
            "class_title": current_user.get("class_title", "Berserker"),
            "total_xp": total_xp,
            "current_level_xp": cur_xp,
            "xp_needed_next_level": needed_xp,
            "weekly_streak": streak_weeks,
            "streak_freezes": current_user.get("streak_freezes", 2),
            "streak_mult": streak_mult,
            "weekly_target": weekly_target,
            "units": current_user.get("units", "kg")
        },
        "next_action": next_action,
        "today_checkin": {
            "completed": has_checked_in,
            "energy_state": today_energy
        },
        "daily_quests": daily_quests,
        "weekly_quest": weekly_quest,
        "boss_quest": boss_quest,
        "radar_data": radar_data,
        "weakest_stat": weakest_stat[0],
        "weakest_hint": weakest_hint,
        "current_goal": {
            "title": goal_text,
            "current_weight": dl_pr,
            "target_weight": goal_target,
            "progress_pct": goal_progress_pct
        },
        "weekly_stats": {
            "volume_kg": round(weekly_volume_kg, 1),
            "sessions_count": len(week_workouts),
            "sessions_target": weekly_target,
            "consistency_pct": consistency_pct
        },
        "recent_workouts": recent_workouts,
        "personal_records": prs,
        "milestones": milestones
    }
