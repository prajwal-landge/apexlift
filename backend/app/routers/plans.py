from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.auth import get_current_user
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api/programs", tags=["programs"])

@router.get("")
def get_programs(current_user: dict = Depends(get_current_user)):
    db = get_db()
    programs = list(db.programs.find({}, {"_id": 0}))
    
    # Enrich exercises in each schedule day
    exercises_map = {e["id"]: e for e in db.exercises.find({}, {"_id": 0})}
    for p in programs:
        for day in p.get("schedule", []):
            enriched = []
            for ex_id in day.get("exercises", []):
                if ex_id in exercises_map:
                    enriched.append(exercises_map[ex_id])
                else:
                    enriched.append({"id": ex_id, "name": ex_id, "category": "General", "stat_tag": "STR"})
            day["exercise_details"] = enriched

    user_prog = db.user_programs.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    return {
        "programs": programs,
        "active_user_program": user_prog
    }

@router.post("/{program_id}/select")
def select_program(program_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    prog = db.programs.find_one({"id": program_id})
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
        
    db.user_programs.delete_many({"user_id": user_id})
    user_prog = {
        "id": f"uprog_{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "program_id": program_id,
        "current_week": 1,
        "current_day": 1,
        "completed_days": [],
        "started_at": datetime.now(timezone.utc).isoformat()
    }
    db.user_programs.insert_one(user_prog)
    
    return {"success": True, "program_id": program_id, "message": f"Activated {prog['title']}"}
