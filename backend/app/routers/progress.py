from fastapi import APIRouter, Depends, Query
from app.database import get_db
from app.auth import get_current_user
from datetime import datetime, timezone, timedelta
from typing import Optional

router = APIRouter(prefix="/api/progress", tags=["progress"])

@router.get("/summary")
def get_progress_summary(
    range_type: str = Query("4w", pattern="^(7d|4w|3m)$"),
    exercise_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    
    # Determine date cutoff
    if range_type == "7d":
        days_back = 7
    elif range_type == "4w":
        days_back = 28
    else: # 3m
        days_back = 90
        
    start_dt = now - timedelta(days=days_back)
    
    workouts = list(db.workouts.find({
        "user_id": user_id,
        "created_at": {"$gte": start_dt.isoformat()}
    }, {"_id": 0}).sort("created_at", 1))

    # 1. Volume Trend (by date or week)
    volume_by_bucket = {}
    consistency_by_bucket = {}
    
    if range_type == "7d":
        # Group by day
        for i in range(7):
            d = (now - timedelta(days=6 - i)).strftime("%a")
            d_key = (now - timedelta(days=6 - i)).strftime("%Y-%m-%d")
            volume_by_bucket[d] = 0.0
            consistency_by_bucket[d] = 0
            for w in workouts:
                if w.get("date") == d_key:
                    consistency_by_bucket[d] += 1
                    for s in w.get("sets", []):
                        volume_by_bucket[d] += (s.get("reps", 0) * s.get("weight_kg", 0))
    elif range_type == "4w":
        # Group by 4 weeks
        for w_idx in range(4, 0, -1):
            lbl = f"Wk {5 - w_idx}"
            volume_by_bucket[lbl] = 0.0
            consistency_by_bucket[lbl] = 0
            
        for w in workouts:
            w_dt = datetime.fromisoformat(w["created_at"])
            days_ago = (now - w_dt).days
            wk_bucket = 4 - (days_ago // 7)
            if 1 <= wk_bucket <= 4:
                lbl = f"Wk {wk_bucket}"
                consistency_by_bucket[lbl] += 1
                for s in w.get("sets", []):
                    volume_by_bucket[lbl] += (s.get("reps", 0) * s.get("weight_kg", 0))
    else: # 3m
        # Group by month or bi-weekly
        for m_idx in range(3, 0, -1):
            lbl = f"M-{m_idx}"
            volume_by_bucket[lbl] = 0.0
            consistency_by_bucket[lbl] = 0
        for w in workouts:
            w_dt = datetime.fromisoformat(w["created_at"])
            days_ago = (now - w_dt).days
            m_bucket = 3 - (days_ago // 30)
            if 1 <= m_bucket <= 3:
                lbl = f"M-{m_bucket}"
                consistency_by_bucket[lbl] += 1
                for s in w.get("sets", []):
                    volume_by_bucket[lbl] += (s.get("reps", 0) * s.get("weight_kg", 0))

    volume_chart = [{"label": k, "volume": round(v, 1)} for k, v in volume_by_bucket.items()]
    
    # Weekly target for consistency reference
    weekly_target = current_user.get("weekly_target", 4)
    consistency_chart = [
        {"label": k, "sessions": v, "target": weekly_target if range_type != "7d" else 1} 
        for k, v in consistency_by_bucket.items()
    ]

    # 2. Lifted Weight Progress per exercise
    target_ex = exercise_id or "ex_dl" # Default to deadlift if not provided
    exercise_doc = db.exercises.find_one({"id": target_ex})
    ex_name = exercise_doc.get("name", "Deadlift") if exercise_doc else "Exercise"
    
    exercise_history = []
    for w in workouts:
        max_wt = 0.0
        found = False
        for s in w.get("sets", []):
            if s.get("exercise_id") == target_ex:
                found = True
                if s.get("weight_kg", 0) > max_wt:
                    max_wt = s.get("weight_kg", 0)
        if found:
            exercise_history.append({
                "date": w.get("date"),
                "max_weight": max_wt,
                "workout_id": w.get("id")
            })

    # 3. All PRs
    prs = []
    pr_workouts = db.workouts.find({"user_id": user_id, "sets.is_pr": True})
    pr_dict = {}
    for w in pr_workouts:
        for s in w.get("sets", []):
            if s.get("is_pr"):
                name = s.get("exercise_name")
                wt = s.get("weight_kg", 0)
                if name not in pr_dict or wt > pr_dict[name]["weight"]:
                    pr_dict[name] = {
                        "exercise": name,
                        "exercise_id": s.get("exercise_id"),
                        "weight": wt,
                        "reps": s.get("reps", 1),
                        "date": w.get("date")
                    }
    prs = sorted(list(pr_dict.values()), key=lambda x: x["weight"], reverse=True)

    return {
        "range": range_type,
        "volume_chart": volume_chart,
        "consistency_chart": consistency_chart,
        "exercise_progress": {
            "exercise_id": target_ex,
            "exercise_name": ex_name,
            "data": exercise_history
        },
        "prs": prs
    }
