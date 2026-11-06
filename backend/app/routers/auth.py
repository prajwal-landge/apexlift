from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models.schemas import UserRegister, UserLogin, TokenResponse
from app.xp_engine import calculate_level_from_total_xp, calculate_cumulative_xp_for_level
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/api/auth", tags=["auth"])

def format_user_profile(user: dict) -> dict:
    total_xp = user.get("total_xp", 0)
    if user.get("current_level_xp") is not None and user.get("level") is not None and user.get("xp_needed_next_level") is not None:
        level = user.get("level")
        cur_xp = user.get("current_level_xp")
        needed_xp = user.get("xp_needed_next_level")
    else:
        level, cur_xp, needed_xp = calculate_level_from_total_xp(total_xp)
    
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "username": user.get("username", user.get("email", "").split("@")[0]),
        "full_name": user.get("full_name"),
        "level": level,
        "total_xp": total_xp,
        "current_level_xp": cur_xp,
        "xp_needed_next_level": needed_xp,
        "class_title": user.get("class_title", "Novice"),
        "weekly_streak": user.get("weekly_streak", 0),
        "streak_freezes": user.get("streak_freezes", 0),
        "weekly_target": user.get("weekly_target", 4),
        "units": user.get("units", "kg"),
        "goal": user.get("goal", "Build consistency"),
        "experience_level": user.get("experience_level", "Beginner"),
        "avatar_url": user.get("avatar_url", ""),
        "stats": user.get("stats", {
            "STR": 50.0,
            "END": 50.0,
            "AGI": 50.0,
            "VIT": 50.0,
            "DISCIPLINE": 50.0
        })
    }

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegister):
    db = get_db()
    existing = db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    username = req.email.split("@")[0]
    
    user_doc = {
        "id": user_id,
        "email": req.email.lower(),
        "username": username,
        "hashed_password": hash_password(req.password),
        "full_name": req.full_name,
        "level": 1,
        "total_xp": 0,
        "current_level_xp": 0,
        "xp_needed_next_level": 50,
        "class_title": "Novice",
        "weekly_streak": 0,
        "streak_freezes": 1,
        "weekly_target": req.weekly_target,
        "units": req.units,
        "goal": req.goal,
        "experience_level": req.experience_level,
        "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={username}",
        "stats": {
            "STR": 30.0,
            "END": 30.0,
            "AGI": 30.0,
            "VIT": 40.0,
            "DISCIPLINE": 20.0
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_active_at": datetime.now(timezone.utc).isoformat()
    }
    db.users.insert_one(user_doc)
    
    # Assign default Starter Strength program
    db.user_programs.insert_one({
        "id": f"uprog_{uuid.uuid4().hex[:8]}",
        "user_id": user_id,
        "program_id": "prog_starter_strength",
        "current_week": 1,
        "current_day": 1,
        "completed_days": [],
        "started_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Generate initial daily quests
    now = datetime.now(timezone.utc)
    initial_quests = [
        {
            "id": f"q_chk_{uuid.uuid4().hex[:6]}",
            "user_id": user_id,
            "title": "Daily Ready Check",
            "description": "Log your energy state before training.",
            "reward_xp": 10,
            "reward_freeze": 0,
            "type": "daily",
            "target_value": 1,
            "current_value": 0,
            "is_completed": False,
            "progress_pct": 0.0,
            "expires_at": (now + datetime.resolution).isoformat()
        },
        {
            "id": f"q_wko_{uuid.uuid4().hex[:6]}",
            "user_id": user_id,
            "title": "First Step on the Summit",
            "description": "Log your very first workout to claim +200 bonus XP.",
            "reward_xp": 200,
            "reward_freeze": 0,
            "type": "daily",
            "target_value": 1,
            "current_value": 0,
            "is_completed": False,
            "progress_pct": 0.0,
            "expires_at": (now + datetime.resolution).isoformat()
        },
        {
            "id": f"q_week_{uuid.uuid4().hex[:6]}",
            "user_id": user_id,
            "title": f"Target: {req.weekly_target} Sessions",
            "description": f"Hit {req.weekly_target} workouts this week to spark your streak.",
            "reward_xp": 150,
            "reward_freeze": 1,
            "type": "weekly",
            "target_value": req.weekly_target,
            "current_value": 0,
            "is_completed": False,
            "progress_pct": 0.0
        }
    ]
    db.quests.insert_many(initial_quests)
    
    token = create_access_token({"sub": user_id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_profile(user_doc)
    }

@router.post("/login", response_model=TokenResponse)
def login_json(req: UserLogin):
    db = get_db()
    user = db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
        
    token = create_access_token({"sub": user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_profile(user)
    }

@router.post("/token")
def login_oauth2(form_data: OAuth2PasswordRequestForm = Depends()):
    db = get_db()
    user = db.users.find_one({"email": form_data.username.lower()})
    if not user or not verify_password(form_data.password, user.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
        
    token = create_access_token({"sub": user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/demo", response_model=TokenResponse)
def login_demo_user():
    db = get_db()
    user = db.users.find_one({"email": "jordan@apexlift.app"})
    if not user:
        from app.seed_data import seed_database
        seed_database(db)
        user = db.users.find_one({"email": "jordan@apexlift.app"})
        
    token = create_access_token({"sub": user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": format_user_profile(user)
    }

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return format_user_profile(current_user)
