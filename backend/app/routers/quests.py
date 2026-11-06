from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.auth import get_current_user
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/api/quests", tags=["quests"])

@router.get("")
def get_all_quests(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    
    quests = list(db.quests.find({"user_id": user_id}, {"_id": 0}))
    
    # Check if user qualifies for Comeback Quest: >5 days inactive
    last_workout = db.workouts.find_one({"user_id": user_id}, sort=[("created_at", -1)])
    is_inactive_5_days = False
    if last_workout:
        last_dt = datetime.fromisoformat(last_workout["created_at"])
        if (now - last_dt).total_seconds() / 86400.0 >= 5.0:
            is_inactive_5_days = True
            
    comeback_quest = next((q for q in quests if q.get("type") == "comeback"), None)
    if is_inactive_5_days and not comeback_quest:
        cb = {
            "id": f"q_cb_{uuid.uuid4().hex[:6]}",
            "user_id": user_id,
            "title": "The Return (2.0x Comeback)",
            "description": "You missed 5+ days. Shake off the inertia with 2x XP for your next 3 sessions.",
            "reward_xp": 200,
            "reward_freeze": 1,
            "type": "comeback",
            "target_value": 3,
            "current_value": 0,
            "is_completed": False,
            "progress_pct": 0.0,
            "expires_at": (now + timedelta(days=7)).isoformat()
        }
        db.quests.insert_one(cb)
        quests.append(cb)

    # Segregate
    daily = [q for q in quests if q.get("type") == "daily"]
    weekly = next((q for q in quests if q.get("type") == "weekly"), None)
    boss = next((q for q in quests if q.get("type") == "boss"), None)
    if not boss:
        boss = {
            "id": f"q_boss_{uuid.uuid4().hex[:6]}",
            "user_id": user_id,
            "title": "Monthly Season Raid: Titan of Inertia",
            "description": "Complete 20 sessions across the 30-day season to topple the Titan.",
            "reward_xp": 300,
            "reward_freeze": 2,
            "type": "boss",
            "target_value": 20,
            "current_value": 0,
            "is_completed": False,
            "progress_pct": 0.0,
            "boss_name": "Titan of Inertia",
            "boss_max_hp": 20,
            "boss_current_hp": 20,
            "expires_at": (now + timedelta(days=30)).isoformat()
        }
        db.quests.insert_one(boss)
        quests.append(boss)

    comeback = next((q for q in quests if q.get("type") == "comeback"), None)

    return {
        "daily": daily,
        "weekly": weekly,
        "boss": boss,
        "comeback": comeback
    }

@router.post("/{quest_id}/claim")
def claim_quest(quest_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    quest = db.quests.find_one({"id": quest_id, "user_id": user_id})
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
        
    if not quest.get("is_completed", False):
        raise HTTPException(status_code=400, detail="Quest requirements not yet completed")
        
    if quest.get("is_claimed", False):
        raise HTTPException(status_code=400, detail="Quest reward already claimed")
        
    reward_xp = quest.get("reward_xp", 0)
    reward_freeze = quest.get("reward_freeze", 0)
    
    # Mark claimed
    db.quests.update_one(
        {"id": quest_id},
        {"$set": {"is_claimed": True}}
    )
    
    # Award freeze & XP
    db.users.update_one(
        {"id": user_id},
        {"$inc": {
            "streak_freezes": reward_freeze,
            "total_xp": reward_xp
        }}
    )
    
    return {
        "success": True,
        "reward_xp": reward_xp,
        "reward_freeze": reward_freeze,
        "message": f"Claimed {reward_xp} XP and {reward_freeze} streak freeze!"
    }
