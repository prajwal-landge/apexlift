from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.auth import get_current_user
from app.models.schemas import UserSettingsUpdate, CheckinCreate
from app.xp_engine import calculate_checkin_xp, calculate_level_from_total_xp
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/api", tags=["settings_and_checkins"])

@router.get("/settings")
def get_settings(current_user: dict = Depends(get_current_user)):
    return {
        "full_name": current_user.get("full_name"),
        "username": current_user.get("username"),
        "email": current_user.get("email"),
        "units": current_user.get("units", "kg"),
        "weekly_target": current_user.get("weekly_target", 4),
        "experience_level": current_user.get("experience_level", "Intermediate"),
        "goal": current_user.get("goal", "Consistent 4x/week lifting & 140kg Deadlift"),
        "streak_freezes": current_user.get("streak_freezes", 2),
        "weekly_streak": current_user.get("weekly_streak", 0)
    }

@router.patch("/settings")
def update_settings(req: UserSettingsUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    
    update_fields = {}
    if req.full_name is not None:
        update_fields["full_name"] = req.full_name
    if req.units is not None:
        if req.units not in ["kg", "lbs"]:
            raise HTTPException(status_code=400, detail="Units must be 'kg' or 'lbs'")
        update_fields["units"] = req.units
    if req.weekly_target is not None:
        if not (2 <= req.weekly_target <= 6):
            raise HTTPException(status_code=400, detail="Weekly target must be between 2 and 6")
        update_fields["weekly_target"] = req.weekly_target
    if req.experience_level is not None:
        update_fields["experience_level"] = req.experience_level
    if req.goal is not None:
        update_fields["goal"] = req.goal

    if update_fields:
        db.users.update_one({"id": user_id}, {"$set": update_fields})
        
    updated_user = db.users.find_one({"id": user_id}, {"_id": 0, "hashed_password": 0})
    return {"success": True, "settings": updated_user}

@router.post("/checkins")
def log_daily_checkin(req: CheckinCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    
    # Check if already checked in today
    existing = db.checkins.find_one({"user_id": user_id, "date": today_str})
    if existing:
        return {
            "success": True,
            "message": "Already checked in today.",
            "checkin": existing,
            "xp_earned": 0
        }
        
    # XP calculation for daily checkin
    today_events = list(db.xp_events.find({
        "user_id": user_id,
        "timestamp": {"$gte": f"{today_str}T00:00:00"}
    }))
    current_day_xp = sum(e.get("amount", 0) for e in today_events)
    
    xp_res = calculate_checkin_xp(current_day_xp_earned=current_day_xp)
    earned_xp = xp_res["final_xp"]

    checkin_doc = {
        "id": f"chk_{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "date": today_str,
        "energy_state": req.energy_state,
        "sleep_hours": req.sleep_hours,
        "notes": req.notes or "",
        "xp_earned": earned_xp,
        "timestamp": now.isoformat()
    }
    db.checkins.insert_one(checkin_doc)

    if earned_xp > 0:
        db.xp_events.insert_one({
            "id": f"xpe_{uuid.uuid4().hex[:10]}",
            "user_id": user_id,
            "type": "daily_checkin",
            "amount": earned_xp,
            "raw_amount": xp_res["raw_xp"],
            "multipliers": {},
            "timestamp": now.isoformat()
        })
        
        new_total_xp = current_user.get("total_xp", 0) + earned_xp
        lvl, cur_xp, needed_xp = calculate_level_from_total_xp(new_total_xp)
        
        # Boost VIT stat
        db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "total_xp": new_total_xp,
                    "level": lvl,
                    "current_level_xp": cur_xp,
                    "xp_needed_next_level": needed_xp
                },
                "$inc": {"stats.VIT": 0.5}
            }
        )

    # Mark daily checkin quest complete
    chk_quest = db.quests.find_one({"user_id": user_id, "type": "daily", "title": {"$regex": "Ready Check", "$options": "i"}})
    if chk_quest:
        db.quests.update_one(
            {"_id": chk_quest["_id"]},
            {"$set": {"current_value": 1, "is_completed": True, "progress_pct": 100.0}}
        )

    return {
        "success": True,
        "xp_earned": earned_xp,
        "energy_state": req.energy_state,
        "message": f"Ready check logged ({req.energy_state}). +{earned_xp} XP gained!"
    }
