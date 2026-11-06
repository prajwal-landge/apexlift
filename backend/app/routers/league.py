from fastapi import APIRouter, Depends, HTTPException, Body
from app.database import get_db
from app.auth import get_current_user
from datetime import datetime, timezone, timedelta
import uuid

router = APIRouter(prefix="/api/league", tags=["league"])

TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Apex"]

@router.get("")
def get_league_standings(tier: str = "Diamond", current_user: dict = Depends(get_current_user)):
    db = get_db()
    now = datetime.now(timezone.utc)
    user_id = current_user["id"]
    
    # Calculate user's current week consistency score
    start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    user_workouts = list(db.workouts.find({
        "user_id": user_id,
        "created_at": {"$gte": start_of_week.isoformat()}
    }))
    user_sessions = len(user_workouts)
    user_xp = sum(w.get("xp_earned", 0) for w in user_workouts)
    # Consistency score: (sessions * 200) + xp
    user_score = (user_sessions * 200) + user_xp
    
    # Query seeded users in this tier or general participants
    all_users = list(db.users.find({}, {"_id": 0}))
    
    participants = []
    # Include current user
    participants.append({
        "user_id": user_id,
        "username": current_user.get("username", "jordan_davis"),
        "full_name": current_user.get("full_name", "Jordan Davis"),
        "avatar_url": current_user.get("avatar_url"),
        "class_title": current_user.get("class_title", "Berserker"),
        "weekly_streak": current_user.get("weekly_streak", 6),
        "sessions_count": user_sessions if user_sessions > 0 else 3,
        "xp_earned": user_xp if user_xp > 0 else 720,
        "consistency_score": user_score if user_score > 0 else (3 * 200 + 720),
        "is_current_user": True
    })

    # Include other users
    for u in all_users:
        if u.get("id") == user_id:
            continue
        # Only take up to 14 other participants for a 15-player pool
        if len(participants) < 15:
            cons = u.get("stats", {}).get("DISCIPLINE", 75.0)
            sim_sessions = max(1, int(cons / 20))
            sim_xp = int(cons * 10)
            score = (sim_sessions * 200) + sim_xp
            participants.append({
                "user_id": u.get("id"),
                "username": u.get("username"),
                "full_name": u.get("full_name"),
                "avatar_url": u.get("avatar_url"),
                "class_title": u.get("class_title", "Novice"),
                "weekly_streak": u.get("weekly_streak", 3),
                "sessions_count": sim_sessions,
                "xp_earned": sim_xp,
                "consistency_score": score,
                "is_current_user": False
            })

    # Sort participants by consistency score descending
    participants.sort(key=lambda x: x["consistency_score"], reverse=True)
    
    # Assign ranks and promotion / demotion zones
    total_count = len(participants)
    user_rank = 1
    for idx, p in enumerate(participants):
        p["rank"] = idx + 1
        if p["is_current_user"]:
            user_rank = idx + 1
            
        if idx < 3:
            p["status"] = "promotion"
        elif idx >= total_count - 3 and total_count >= 6:
            p["status"] = "demotion"
        else:
            p["status"] = "safe"

    return {
        "current_tier": tier,
        "all_tiers": TIERS,
        "season_week": 3,
        "season_total_weeks": 4,
        "days_remaining_in_week": max(1, 6 - now.weekday()),
        "user_rank": user_rank,
        "participants": participants
    }

@router.get("/friends")
def get_friends_leaderboard(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["id"]
    friendships = list(db.friendships.find({"user_id": user_id}))
    friend_ids = [f["friend_id"] for f in friendships]
    
    friends_list = []
    # Include current user
    friends_list.append({
        "user_id": user_id,
        "username": current_user.get("username", "jordan_davis"),
        "full_name": current_user.get("full_name", "Jordan Davis"),
        "avatar_url": current_user.get("avatar_url"),
        "class_title": current_user.get("class_title", "Berserker"),
        "weekly_streak": current_user.get("weekly_streak", 6),
        "consistency_score": 1320,
        "is_current_user": True
    })
    
    for f_id in friend_ids:
        u = db.users.find_one({"id": f_id})
        if u:
            friends_list.append({
                "user_id": u["id"],
                "username": u.get("username"),
                "full_name": u.get("full_name"),
                "avatar_url": u.get("avatar_url"),
                "class_title": u.get("class_title"),
                "weekly_streak": u.get("weekly_streak", 0),
                "consistency_score": int(u.get("stats", {}).get("DISCIPLINE", 75) * 15),
                "is_current_user": False
            })

    friends_list.sort(key=lambda x: x["consistency_score"], reverse=True)
    for idx, f in enumerate(friends_list):
        f["rank"] = idx + 1
        
    return friends_list

@router.post("/friends/add")
def add_friend(data: dict = Body(...), current_user: dict = Depends(get_current_user)):
    target_username = data.get("username", "").strip()
    if not target_username:
        raise HTTPException(status_code=400, detail="Username is required")
        
    db = get_db()
    target_user = db.users.find_one({"username": {"$regex": f"^{target_username}$", "$options": "i"}})
    if not target_user:
        raise HTTPException(status_code=404, detail=f"User @{target_username} not found")
        
    if target_user["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a friend")
        
    existing = db.friendships.find_one({"user_id": current_user["id"], "friend_id": target_user["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Already in your friends list")
        
    db.friendships.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "friend_id": target_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "message": f"Added @{target_user['username']} to friends list"}
