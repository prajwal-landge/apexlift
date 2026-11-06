from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from app.auth import get_current_user
from app.models.schemas import WorkoutCreate, ExerciseSchema
from app.xp_engine import (
    calculate_session_xp,
    calculate_level_from_total_xp,
    check_weight_plausibility,
    determine_character_class
)
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

router = APIRouter(prefix="/api/workouts", tags=["workouts"])

@router.get("/exercises")
def get_exercises(
    category: Optional[str] = None,
    stat_tag: Optional[str] = None,
    query: Optional[str] = None
):
    db = get_db()
    filters = {}
    if category and category != "All":
        filters["category"] = category
    if stat_tag and stat_tag != "All":
        filters["stat_tag"] = stat_tag
    if query:
        filters["name"] = {"$regex": query, "$options": "i"}
        
    exercises = list(db.exercises.find(filters, {"_id": 0}))
    return exercises

@router.post("")
def log_workout(req: WorkoutCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    
    # Plausibility check on all logged sets
    for s in req.sets:
        # Fetch previous PR for this exercise
        prev_pr_doc = db.workouts.find_one(
            {"user_id": user_id, "sets.exercise_id": s.exercise_id, "sets.is_pr": True},
            sort=[("sets.weight_kg", -1)]
        )
        prev_pr_weight = None
        if prev_pr_doc:
            for past_set in prev_pr_doc.get("sets", []):
                if past_set.get("exercise_id") == s.exercise_id and past_set.get("is_pr"):
                    if prev_pr_weight is None or past_set.get("weight_kg", 0) > prev_pr_weight:
                        prev_pr_weight = past_set.get("weight_kg", 0)
                        
        valid, err_msg = check_weight_plausibility(s.exercise_name, s.weight_kg, prev_pr_weight)
        if not valid:
            raise HTTPException(status_code=400, detail=err_msg)

    # 1. Check workouts already logged today (for 2nd session rule & daily cap)
    today_workouts = list(db.workouts.find({"user_id": user_id, "date": today_str}))
    is_second_session = len(today_workouts) >= 1
    
    # Calculate daily XP earned today from xp_events
    today_events = list(db.xp_events.find({
        "user_id": user_id,
        "timestamp": {"$gte": f"{today_str}T00:00:00"}
    }))
    current_day_xp = sum(e.get("amount", 0) for e in today_events)

    # 2. Check total workouts ever for first workout bonus
    total_past_workouts = db.workouts.count_documents({"user_id": user_id})
    is_first_workout = (total_past_workouts == 0)

    # 3. Check comeback condition: > 5 days inactive
    last_workout = db.workouts.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    is_comeback = False
    if last_workout:
        last_dt = datetime.fromisoformat(last_workout["created_at"])
        days_diff = (now - last_dt).total_seconds() / 86400.0
        if days_diff >= 5.0:
            is_comeback = True

    # 4. Detect new PRs achieved in this workout
    new_prs = []
    processed_sets = []
    exercise_ids_in_session = set()
    
    for s in req.sets:
        exercise_ids_in_session.add(s.exercise_id)
        # Check max weight ever logged for this exercise by user
        max_set = None
        user_workouts_with_ex = db.workouts.find({"user_id": user_id, "sets.exercise_id": s.exercise_id})
        max_wt = 0.0
        for uw in user_workouts_with_ex:
            for uw_set in uw.get("sets", []):
                if uw_set.get("exercise_id") == s.exercise_id:
                    if uw_set.get("weight_kg", 0) > max_wt:
                        max_wt = uw_set.get("weight_kg", 0)
                        
        is_pr = False
        if s.weight_kg > max_wt and s.weight_kg > 0:
            is_pr = True
            if s.exercise_name not in [p["exercise"] for p in new_prs]:
                new_prs.append({"exercise": s.exercise_name, "weight": s.weight_kg, "prev_weight": max_wt})
                
        set_dict = s.model_dump()
        set_dict["is_pr"] = is_pr
        processed_sets.append(set_dict)

    # 5. Check new exercises tried this week
    start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    week_workouts = list(db.workouts.find({
        "user_id": user_id,
        "created_at": {"$gte": start_of_week.isoformat()}
    }))
    exercises_logged_this_week = set()
    for ww in week_workouts:
        for ws in ww.get("sets", []):
            exercises_logged_this_week.add(ws.get("exercise_id"))
            
    new_exercises_count = 0
    for eid in exercise_ids_in_session:
        # Check if user ever logged this exercise before this week
        ever_logged = db.workouts.find_one({"user_id": user_id, "sets.exercise_id": eid, "created_at": {"$lt": start_of_week.isoformat()}})
        if not ever_logged and eid not in exercises_logged_this_week:
            new_exercises_count += 1

    # 6. Check weekly target progress
    weekly_target = current_user.get("weekly_target", 4)
    sessions_this_week = len(week_workouts) + 1
    weekly_target_hit = (sessions_this_week == weekly_target)
    
    # 7. Check weekly quest cleared
    weekly_quest = db.quests.find_one({"user_id": user_id, "type": "weekly"})
    weekly_quest_cleared = False
    if weekly_quest and not weekly_quest.get("is_completed", False):
        if sessions_this_week >= weekly_target:
            weekly_quest_cleared = True

    # 8. Compute XP through Engine
    is_full = (not req.is_mini_session) and (req.duration_minutes >= 15 or len(req.sets) >= 3)
    is_mini = req.is_mini_session or (not is_full and len(req.sets) >= 1)

    xp_result = calculate_session_xp(
        is_full_workout=is_full,
        is_mini_session=is_mini,
        is_planned_session=req.is_planned_session,
        is_first_workout_ever=is_first_workout,
        new_prs_count=len(new_prs),
        new_exercises_tried=new_exercises_count,
        weekly_target_hit=weekly_target_hit,
        weekly_quest_cleared=weekly_quest_cleared,
        weeks_in_streak=current_user.get("weekly_streak", 0),
        user_energy_state=req.energy_state,
        is_comeback_session=is_comeback,
        is_second_session_same_day=is_second_session,
        current_day_xp_earned=current_day_xp
    )
    
    earned_xp = xp_result["final_xp"]
    workout_id = f"w_{uuid.uuid4().hex[:10]}"
    
    # 9. Save workout record
    workout_doc = {
        "id": workout_id,
        "user_id": user_id,
        "date": today_str,
        "duration_minutes": req.duration_minutes,
        "is_mini_session": is_mini,
        "is_planned_session": req.is_planned_session,
        "program_day_id": req.program_day_id,
        "notes": req.notes or "",
        "energy_state": req.energy_state or "Okay",
        "xp_earned": earned_xp,
        "prs_achieved": len(new_prs),
        "sets": processed_sets,
        "created_at": now.isoformat()
    }
    db.workouts.insert_one(workout_doc)

    # 10. Record XP Event
    db.xp_events.insert_one({
        "id": f"xpe_{uuid.uuid4().hex[:10]}",
        "user_id": user_id,
        "type": "workout_completed",
        "amount": earned_xp,
        "raw_amount": xp_result["raw_xp"],
        "multipliers": xp_result["multipliers"],
        "workout_id": workout_id,
        "timestamp": now.isoformat()
    })

    # 11. Update character stats
    current_stats = current_user.get("stats", {"STR": 50.0, "END": 50.0, "AGI": 50.0, "VIT": 50.0, "DISCIPLINE": 50.0})
    stat_deltas = {"STR": 0.0, "END": 0.0, "AGI": 0.0, "VIT": 0.0, "DISCIPLINE": 0.5}
    for s in processed_sets:
        ex_doc = db.exercises.find_one({"id": s["exercise_id"]})
        stat_tag = ex_doc.get("stat_tag", "STR") if ex_doc else "STR"
        if stat_tag == "STR":
            stat_deltas["STR"] += 0.4
        elif stat_tag == "END":
            stat_deltas["END"] += 0.4
        elif stat_tag == "AGI":
            stat_deltas["AGI"] += 0.4

    if weekly_target_hit:
        stat_deltas["DISCIPLINE"] += 2.0

    updated_stats = {}
    for k, v in current_stats.items():
        updated_stats[k] = round(min(100.0, v + stat_deltas.get(k, 0.0)), 1)

    # 12. Update User level & streak
    old_level = current_user.get("level", 1)
    new_total_xp = current_user.get("total_xp", 0) + earned_xp
    new_level, cur_xp, needed_xp = calculate_level_from_total_xp(new_total_xp)
    level_up = new_level > old_level

    new_total_workouts = total_past_workouts + 1
    new_class = determine_character_class(updated_stats, new_total_workouts)

    streak_increase = 0
    if weekly_target_hit:
        streak_increase = 1

    db.users.update_one(
        {"id": user_id},
        {"$set": {
            "total_xp": new_total_xp,
            "level": new_level,
            "current_level_xp": cur_xp,
            "xp_needed_next_level": needed_xp,
            "class_title": new_class,
            "weekly_streak": current_user.get("weekly_streak", 0) + streak_increase,
            "stats": updated_stats,
            "last_active_at": now.isoformat()
        }}
    )

    # 13. Update Quests
    # Daily workout quest
    daily_w_quest = db.quests.find_one({"user_id": user_id, "type": "daily", "is_completed": False, "target_value": 1})
    if daily_w_quest:
        db.quests.update_one(
            {"_id": daily_w_quest["_id"]},
            {"$set": {"current_value": 1, "is_completed": True, "progress_pct": 100.0}}
        )

    # Weekly quest
    if weekly_quest:
        new_val = min(weekly_quest["target_value"], weekly_quest.get("current_value", 0) + 1)
        is_comp = new_val >= weekly_quest["target_value"]
        db.quests.update_one(
            {"_id": weekly_quest["_id"]},
            {"$set": {
                "current_value": new_val,
                "is_completed": is_comp,
                "progress_pct": round((new_val / weekly_quest["target_value"]) * 100, 1)
            }}
        )

    # Monthly boss raid quest
    boss_quest = db.quests.find_one({"user_id": user_id, "type": "boss"})
    if boss_quest:
        b_cur = boss_quest.get("current_value", 0) + 1
        b_target = boss_quest.get("target_value", 20)
        b_hp = max(0, boss_quest.get("boss_current_hp", b_target) - 1)
        db.quests.update_one(
            {"_id": boss_quest["_id"]},
            {"$set": {
                "current_value": b_cur,
                "boss_current_hp": b_hp,
                "progress_pct": round(min(100.0, (b_cur / b_target) * 100), 1),
                "is_completed": b_cur >= b_target
            }}
        )

    # Return structured animation payload
    return {
        "success": True,
        "workout_id": workout_id,
        "xp_earned": earned_xp,
        "raw_xp": xp_result["raw_xp"],
        "breakdown": xp_result["breakdown"],
        "multipliers": xp_result["multipliers"],
        "is_capped": xp_result["is_capped"],
        "level_up": level_up,
        "new_level": new_level,
        "new_class": new_class,
        "current_level_xp": cur_xp,
        "xp_needed_next_level": needed_xp,
        "prs_achieved": new_prs,
        "streak_weeks": current_user.get("weekly_streak", 0) + streak_increase,
        "message": "Session logged. Consistency secured."
    }

@router.get("/recent")
def get_recent_workouts(limit: int = 10, current_user: dict = Depends(get_current_user)):
    db = get_db()
    workouts = list(db.workouts.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit))
    return workouts

@router.get("/prs")
def get_all_prs(current_user: dict = Depends(get_current_user)):
    db = get_db()
    workouts = db.workouts.find({"user_id": current_user["id"], "sets.is_pr": True})
    pr_map = {}
    for w in workouts:
        for s in w.get("sets", []):
            if s.get("is_pr"):
                ex_name = s.get("exercise_name")
                wt = s.get("weight_kg", 0)
                if ex_name not in pr_map or wt > pr_map[ex_name]["weight"]:
                    pr_map[ex_name] = {
                        "exercise": ex_name,
                        "weight": wt,
                        "reps": s.get("reps"),
                        "date": w.get("date")
                    }
    return sorted(list(pr_map.values()), key=lambda x: x["weight"], reverse=True)
