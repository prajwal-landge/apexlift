import uuid
from datetime import datetime, timezone, timedelta
from app.auth import hash_password
from app.xp_engine import calculate_cumulative_xp_for_level, xp_required_for_next_level

# 40 Seeded Exercises tagged by stat
EXERCISES = [
    # Compound & Strength (STR)
    {
        "id": "ex_sq",
        "name": "Barbell Back Squat",
        "category": "Legs",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "King of lower-body compounds. Builds quad, glute, and core foundation."
    },
    {
        "id": "ex_dl",
        "name": "Barbell Deadlift",
        "category": "Back",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "Full-body posterior chain power. High neurological recruitment."
    },
    {
        "id": "ex_bp",
        "name": "Barbell Bench Press",
        "category": "Chest",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "Essential upper-body horizontal press for chest, triceps, and delts."
    },
    {
        "id": "ex_ohp",
        "name": "Overhead Press",
        "category": "Shoulders",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "Strict standing press building boulder shoulders and core stability."
    },
    {
        "id": "ex_rdl",
        "name": "Romanian Deadlift",
        "category": "Legs",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "Hip-hinge targeting hamstrings and glutes with controlled eccentric."
    },
    {
        "id": "ex_bor",
        "name": "Barbell Bent-Over Row",
        "category": "Back",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "Heavy horizontal pull developing upper back thickness and lats."
    },
    {
        "id": "ex_idb",
        "name": "Incline Dumbbell Press",
        "category": "Chest",
        "stat_tag": "STR",
        "equipment": "Dumbbell",
        "is_compound": True,
        "description": "Targets the clavicular head (upper chest) and front delts."
    },
    {
        "id": "ex_fs",
        "name": "Front Squat",
        "category": "Legs",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "Upright squat prioritizing quad development and thoracic extension."
    },
    {
        "id": "ex_hip",
        "name": "Barbell Hip Thrust",
        "category": "Legs",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "Glute powerhouse exercise with peak tension at lockout."
    },
    {
        "id": "ex_cgbp",
        "name": "Close-Grip Bench Press",
        "category": "Arms",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": True,
        "description": "Compound pressing variation overloading the triceps."
    },

    # Pull & Hypertrophy (STR / END)
    {
        "id": "ex_pu",
        "name": "Pull-Up",
        "category": "Back",
        "stat_tag": "STR",
        "equipment": "Bodyweight",
        "is_compound": True,
        "description": "Gold standard vertical pulling movement for wide lats and grip."
    },
    {
        "id": "ex_cu",
        "name": "Chin-Up",
        "category": "Back",
        "stat_tag": "STR",
        "equipment": "Bodyweight",
        "is_compound": True,
        "description": "Supinated grip pull emphasizing biceps and lower lats."
    },
    {
        "id": "ex_lpd",
        "name": "Lat Pulldown",
        "category": "Back",
        "stat_tag": "STR",
        "equipment": "Cable",
        "is_compound": False,
        "description": "Controlled vertical cable pull targeting lat width and mind-muscle connection."
    },
    {
        "id": "ex_scr",
        "name": "Seated Cable Row",
        "category": "Back",
        "stat_tag": "STR",
        "equipment": "Cable",
        "is_compound": False,
        "description": "Horizontal mid-back pull targeting rhomboids and middle traps."
    },
    {
        "id": "ex_fp",
        "name": "Face Pull",
        "category": "Shoulders",
        "stat_tag": "AGI",
        "equipment": "Cable",
        "is_compound": False,
        "description": "Essential shoulder prehab targeting rear delts and external rotators."
    },
    {
        "id": "ex_hc",
        "name": "Dumbbell Hammer Curl",
        "category": "Arms",
        "stat_tag": "STR",
        "equipment": "Dumbbell",
        "is_compound": False,
        "description": "Neutral grip curl hitting brachialis and forearm thickness."
    },
    {
        "id": "ex_ibc",
        "name": "Incline Dumbbell Curl",
        "category": "Arms",
        "stat_tag": "STR",
        "equipment": "Dumbbell",
        "is_compound": False,
        "description": "Deep stretch on the long head of the biceps."
    },
    {
        "id": "ex_bbc",
        "name": "Barbell Bicep Curl",
        "category": "Arms",
        "stat_tag": "STR",
        "equipment": "Barbell",
        "is_compound": False,
        "description": "Direct biceps loading for peak mass and arm strength."
    },
    {
        "id": "ex_shrug",
        "name": "Dumbbell Shrug",
        "category": "Back",
        "stat_tag": "STR",
        "equipment": "Dumbbell",
        "is_compound": False,
        "description": "Upper trapezius isolation for neck and shoulder girdle stability."
    },

    # Push, Delts & Triceps (STR / AGI)
    {
        "id": "ex_lr",
        "name": "Dumbbell Lateral Raise",
        "category": "Shoulders",
        "stat_tag": "AGI",
        "equipment": "Dumbbell",
        "is_compound": False,
        "description": "Lateral deltoid builder creating athletic upper-body width."
    },
    {
        "id": "ex_trp",
        "name": "Tricep Rope Pushdown",
        "category": "Arms",
        "stat_tag": "END",
        "equipment": "Cable",
        "is_compound": False,
        "description": "Cable triceps isolation with flared contraction at lockout."
    },
    {
        "id": "ex_ote",
        "name": "Overhead Tricep Extension",
        "category": "Arms",
        "stat_tag": "STR",
        "equipment": "Cable",
        "is_compound": False,
        "description": "Loaded stretch on the long head of the triceps."
    },
    {
        "id": "ex_dips",
        "name": "Chest Dips",
        "category": "Chest",
        "stat_tag": "STR",
        "equipment": "Bodyweight",
        "is_compound": True,
        "description": "Bodyweight mass builder for lower chest and triceps."
    },
    {
        "id": "ex_ccf",
        "name": "Cable Chest Flye",
        "category": "Chest",
        "stat_tag": "END",
        "equipment": "Cable",
        "is_compound": False,
        "description": "Continuous pectoral tension with deep stretch and squeeze."
    },
    {
        "id": "ex_pushup",
        "name": "Push-Up",
        "category": "Chest",
        "stat_tag": "END",
        "equipment": "Bodyweight",
        "is_compound": True,
        "description": "Foundational calisthenic pressing pattern."
    },
    {
        "id": "ex_ap",
        "name": "Arnold Press",
        "category": "Shoulders",
        "stat_tag": "AGI",
        "equipment": "Dumbbell",
        "is_compound": True,
        "description": "Rotational dumbbell press recruiting all three deltoid heads."
    },
    {
        "id": "ex_rpd",
        "name": "Reverse Pec Deck",
        "category": "Shoulders",
        "stat_tag": "AGI",
        "equipment": "Machine",
        "is_compound": False,
        "description": "Strict isolation for posterior deltoid and scapular retractors."
    },

    # Lower Body & Accessories (STR / END)
    {
        "id": "ex_bss",
        "name": "Bulgarian Split Squat",
        "category": "Legs",
        "stat_tag": "STR",
        "equipment": "Dumbbell",
        "is_compound": True,
        "description": "Unilateral leg builder addressing imbalances and building quad/glute grit."
    },
    {
        "id": "ex_lp",
        "name": "Leg Press 45-Degree",
        "category": "Legs",
        "stat_tag": "STR",
        "equipment": "Machine",
        "is_compound": True,
        "description": "High-load leg training without axial spinal fatigue."
    },
    {
        "id": "ex_wl",
        "name": "Walking Dumbbell Lunge",
        "category": "Legs",
        "stat_tag": "END",
        "equipment": "Dumbbell",
        "is_compound": True,
        "description": "Functional dynamic unilateral exercise demanding stamina and balance."
    },
    {
        "id": "ex_le",
        "name": "Leg Extension",
        "category": "Legs",
        "stat_tag": "END",
        "equipment": "Machine",
        "is_compound": False,
        "description": "Direct quadriceps rectus femoris isolation with controlled contraction."
    },
    {
        "id": "ex_lc",
        "name": "Hamstring Leg Curl",
        "category": "Legs",
        "stat_tag": "END",
        "equipment": "Machine",
        "is_compound": False,
        "description": "Direct knee-flexion targeting all hamstring bellies."
    },
    {
        "id": "ex_cr",
        "name": "Standing Calf Raise",
        "category": "Legs",
        "stat_tag": "END",
        "equipment": "Machine",
        "is_compound": False,
        "description": "Gastrocnemius isolation with complete stretch and pause at peak."
    },
    {
        "id": "ex_gs",
        "name": "Goblet Squat",
        "category": "Legs",
        "stat_tag": "STR",
        "equipment": "Dumbbell",
        "is_compound": True,
        "description": "Anterior loaded squat perfecting hip mobility and quad engagement."
    },

    # Agility & Core (AGI)
    {
        "id": "ex_hlr",
        "name": "Hanging Leg Raise",
        "category": "Core",
        "stat_tag": "AGI",
        "equipment": "Bodyweight",
        "is_compound": False,
        "description": "High-level abdominal and hip flexor movement with grip demand."
    },
    {
        "id": "ex_plank",
        "name": "Plank Hold",
        "category": "Core",
        "stat_tag": "AGI",
        "equipment": "Bodyweight",
        "is_compound": False,
        "description": "Isometric anterior core stabilization resisting spinal extension."
    },
    {
        "id": "ex_cwc",
        "name": "Cable Woodchopper",
        "category": "Core",
        "stat_tag": "AGI",
        "equipment": "Cable",
        "is_compound": False,
        "description": "Rotational core power connecting hips, obliques, and shoulders."
    },
    {
        "id": "ex_abw",
        "name": "Ab Wheel Rollout",
        "category": "Core",
        "stat_tag": "AGI",
        "equipment": "Bodyweight",
        "is_compound": False,
        "description": "Intense anti-extension exercise requiring total midsection bracing."
    },
    {
        "id": "ex_fc",
        "name": "Farmer's Carry",
        "category": "Core",
        "stat_tag": "AGI",
        "equipment": "Dumbbell",
        "is_compound": True,
        "description": "Loaded walking building ruthless grip, traps, and lateral core integrity."
    },
    {
        "id": "ex_box",
        "name": "Box Jump",
        "category": "Legs",
        "stat_tag": "AGI",
        "equipment": "Bodyweight",
        "is_compound": True,
        "description": "Explosive triple-extension plyometric building reactive power."
    },

    # Endurance & Conditioning (END)
    {
        "id": "ex_abike",
        "name": "Assault Bike Sprint",
        "category": "Cardio",
        "stat_tag": "END",
        "equipment": "Machine",
        "is_compound": True,
        "description": "High-intensity full-body cardiovascular output testing pure work capacity."
    },
    {
        "id": "ex_rower",
        "name": "Rowing Machine Interval",
        "category": "Cardio",
        "stat_tag": "END",
        "equipment": "Machine",
        "is_compound": True,
        "description": "Total-body rhythmic endurance exercise building aerobic capacity."
    },
    {
        "id": "ex_kbs",
        "name": "Kettlebell Swing",
        "category": "Legs",
        "stat_tag": "END",
        "equipment": "Kettlebell",
        "is_compound": True,
        "description": "Ballistic posterior chain hip-hinge conditioning."
    }
]

PROGRAMS = [
    {
        "id": "prog_starter_strength",
        "title": "Starter Strength (8 Weeks)",
        "subtitle": "Linear Foundation Protocol",
        "duration_weeks": 8,
        "sessions_per_week": 3,
        "difficulty": "Novice / Intermediate",
        "description": "Master the compound lifts through structured progressive frequency. Perfect for locking in the 3x/week habit.",
        "schedule": [
            {
                "day_id": "day_a",
                "name": "Day A: Squat & Upper Push",
                "exercises": ["ex_sq", "ex_bp", "ex_bor", "ex_plank"]
            },
            {
                "day_id": "day_b",
                "name": "Day B: Deadlift & Overhead",
                "exercises": ["ex_dl", "ex_ohp", "ex_pu", "ex_hlr"]
            },
            {
                "day_id": "day_c",
                "name": "Day C: Volume & Core",
                "exercises": ["ex_sq", "ex_idb", "ex_scr", "ex_fc"]
            }
        ]
    },
    {
        "id": "prog_ppl",
        "title": "Push / Pull / Legs",
        "subtitle": "Hypertrophy & Power Split",
        "duration_weeks": 10,
        "sessions_per_week": 4,
        "difficulty": "Intermediate / Advanced",
        "description": "Classic muscle-building split optimizing recovery between pushing, pulling, and lower body demands.",
        "schedule": [
            {
                "day_id": "ppl_push",
                "name": "Push: Chest, Delts & Triceps",
                "exercises": ["ex_bp", "ex_ohp", "ex_idb", "ex_lr", "ex_trp"]
            },
            {
                "day_id": "ppl_pull",
                "name": "Pull: Back, Rear Delts & Biceps",
                "exercises": ["ex_dl", "ex_pu", "ex_bor", "ex_fp", "ex_hc"]
            },
            {
                "day_id": "ppl_legs",
                "name": "Legs: Quads, Hamstrings & Calves",
                "exercises": ["ex_sq", "ex_rdl", "ex_bss", "ex_lc", "ex_cr"]
            },
            {
                "day_id": "ppl_upper",
                "name": "Upper Body Dynamic",
                "exercises": ["ex_idb", "ex_scr", "ex_dips", "ex_ap", "ex_bbc"]
            }
        ]
    },
    {
        "id": "prog_full_body",
        "title": "Full Body 3-Day Protocol",
        "subtitle": "High Efficiency & Habit Locking",
        "duration_weeks": 6,
        "sessions_per_week": 3,
        "difficulty": "All Levels",
        "description": "Maximum stimulus in minimal time. Every workout stimulates your entire system, rewarding steady showing up.",
        "schedule": [
            {
                "day_id": "fb_1",
                "name": "Session 1: Heavy Hinge & Press",
                "exercises": ["ex_dl", "ex_bp", "ex_lpd", "ex_bss"]
            },
            {
                "day_id": "fb_2",
                "name": "Session 2: Squat & Vertical Pull",
                "exercises": ["ex_sq", "ex_ohp", "ex_pu", "ex_abw"]
            },
            {
                "day_id": "fb_3",
                "name": "Session 3: Posterior & Conditioning",
                "exercises": ["ex_fs", "ex_bor", "ex_dips", "ex_rower"]
            }
        ]
    }
]

OTHER_USERS = [
    {"username": "elena_r", "full_name": "Elena Rostova", "class_title": "Monk", "tier": "Diamond", "streak": 8, "consistency": 96, "sessions": 5, "xp": 1150},
    {"username": "marcus_v", "full_name": "Marcus Vance", "class_title": "Powerlifter", "tier": "Diamond", "streak": 5, "consistency": 92, "sessions": 4, "xp": 980},
    {"username": "chloe_b", "full_name": "Chloe Bennett", "class_title": "Ranger", "tier": "Diamond", "streak": 4, "consistency": 88, "sessions": 4, "xp": 910},
    {"username": "david_k", "full_name": "David Kim", "class_title": "Berserker", "tier": "Diamond", "streak": 6, "consistency": 85, "sessions": 4, "xp": 890},
    {"username": "samantha_b", "full_name": "Samantha Brooks", "class_title": "Ranger", "tier": "Diamond", "streak": 7, "consistency": 84, "sessions": 3, "xp": 780},
    {"username": "alex_r", "full_name": "Alex Rivera", "class_title": "Powerlifter", "tier": "Diamond", "streak": 3, "consistency": 80, "sessions": 3, "xp": 720},
    {"username": "liam_oc", "full_name": "Liam O'Connor", "class_title": "Berserker", "tier": "Diamond", "streak": 5, "consistency": 79, "sessions": 3, "xp": 690},
    {"username": "maya_p", "full_name": "Maya Patel", "class_title": "Monk", "tier": "Diamond", "streak": 9, "consistency": 78, "sessions": 3, "xp": 670},
    {"username": "noah_c", "full_name": "Noah Chen", "class_title": "Powerlifter", "tier": "Diamond", "streak": 2, "consistency": 75, "sessions": 3, "xp": 640},
    {"username": "sophia_m", "full_name": "Sophia Martinez", "class_title": "Ranger", "tier": "Diamond", "streak": 4, "consistency": 72, "sessions": 2, "xp": 510},
    {"username": "lucas_w", "full_name": "Lucas Wright", "class_title": "Berserker", "tier": "Diamond", "streak": 1, "consistency": 68, "sessions": 2, "xp": 460},
    {"username": "emma_w", "full_name": "Emma Watson", "class_title": "Monk", "tier": "Platinum", "streak": 6, "consistency": 82, "sessions": 4, "xp": 850},
    {"username": "tyler_h", "full_name": "Tyler Hayes", "class_title": "Powerlifter", "tier": "Platinum", "streak": 3, "consistency": 74, "sessions": 3, "xp": 620},
    {"username": "olivia_t", "full_name": "Olivia Taylor", "class_title": "Ranger", "tier": "Gold", "streak": 2, "consistency": 70, "sessions": 2, "xp": 480},
    {"username": "ethan_c", "full_name": "Ethan Cole", "class_title": "Novice", "tier": "Gold", "streak": 1, "consistency": 55, "sessions": 2, "xp": 390}
]

_CACHED_PWD_HASH = None
def get_default_password_hash():
    global _CACHED_PWD_HASH
    if _CACHED_PWD_HASH is None:
        _CACHED_PWD_HASH = hash_password("password123")
    return _CACHED_PWD_HASH

def seed_database(db):
    """Seed exercises, programs, demo user Jordan Davis, sample workouts, quests, and leagues."""
    # 1. Exercises
    db.exercises.delete_many({})
    db.exercises.insert_many(EXERCISES)
    
    # 2. Programs
    db.programs.delete_many({})
    db.programs.insert_many(PROGRAMS)
    
    # 3. Demo User: Jordan Davis
    # Calculate Jordan's total XP: Level 12 with 2,840 / 3,300 XP
    base_xp_lvl12 = calculate_cumulative_xp_for_level(12)
    jordan_total_xp = base_xp_lvl12 + 2840
    
    hashed_pwd = get_default_password_hash()
    
    demo_user = {
        "id": "usr_jordan_davis",
        "email": "jordan@apexlift.app",
        "username": "jordan_davis",
        "hashed_password": hashed_pwd,
        "full_name": "Jordan Davis",
        "level": 12,
        "total_xp": jordan_total_xp,
        "current_level_xp": 2840,
        "xp_needed_next_level": 3300,
        "class_title": "Berserker",
        "weekly_streak": 6,
        "streak_freezes": 2,
        "weekly_target": 4,
        "units": "kg",
        "goal": "Consistent 4x/week lifting & 140kg Deadlift",
        "experience_level": "Intermediate",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "stats": {
            "STR": 78.0,
            "END": 62.0,
            "AGI": 84.0,
            "VIT": 70.0,
            "DISCIPLINE": 88.0
        },
        "created_at": (datetime.now(timezone.utc) - timedelta(days=45)).isoformat(),
        "last_active_at": datetime.now(timezone.utc).isoformat()
    }
    
    db.users.delete_many({"email": "jordan@apexlift.app"})
    db.users.insert_one(demo_user)
    
    # 4. Seed other 15 users
    for u in OTHER_USERS:
        u_id = f"usr_{u['username']}"
        db.users.delete_many({"username": u["username"]})
        user_doc = {
            "id": u_id,
            "email": f"{u['username']}@apexlift.app",
            "username": u["username"],
            "hashed_password": hashed_pwd,
            "full_name": u["full_name"],
            "level": max(5, int(u["consistency"] / 7)),
            "total_xp": u["xp"] * 4,
            "class_title": u["class_title"],
            "weekly_streak": u["streak"],
            "streak_freezes": 1,
            "weekly_target": 4,
            "units": "kg",
            "goal": "Crush weekly sessions",
            "experience_level": "Intermediate",
            "avatar_url": f"https://api.dicebear.com/7.x/bottts/svg?seed={u['username']}",
            "stats": {
                "STR": 60.0 + (u["consistency"] % 25),
                "END": 55.0 + (u["consistency"] % 30),
                "AGI": 50.0 + (u["consistency"] % 20),
                "VIT": 65.0,
                "DISCIPLINE": float(u["consistency"])
            },
            "created_at": (datetime.now(timezone.utc) - timedelta(days=60)).isoformat(),
            "last_active_at": datetime.now(timezone.utc).isoformat()
        }
        db.users.insert_one(user_doc)

    # 5. Friendships for Jordan (e.g., friends with Elena, Marcus, Chloe, David)
    db.friendships.delete_many({"user_id": "usr_jordan_davis"})
    friends = ["usr_elena_r", "usr_marcus_v", "usr_chloe_b", "usr_david_k"]
    for f_id in friends:
        db.friendships.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": "usr_jordan_davis",
            "friend_id": f_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
    # 6. Active Program for Jordan: Starter Strength Week 3
    db.user_programs.delete_many({"user_id": "usr_jordan_davis"})
    db.user_programs.insert_one({
        "id": "uprog_jordan",
        "user_id": "usr_jordan_davis",
        "program_id": "prog_starter_strength",
        "current_week": 3,
        "current_day": 2,
        "completed_days": ["w1_d1", "w1_d2", "w1_d3", "w2_d1", "w2_d2", "w2_d3", "w3_d1"],
        "started_at": (datetime.now(timezone.utc) - timedelta(days=21)).isoformat()
    })
    
    # 7. 3 Weeks of Realistic Workout History for Jordan Davis
    db.workouts.delete_many({"user_id": "usr_jordan_davis"})
    db.xp_events.delete_many({"user_id": "usr_jordan_davis"})
    
    # Past 21 days: 4 workouts/week
    now = datetime.now(timezone.utc)
    sample_workout_specs = [
        {"days_ago": 19, "name": "Heavy Squat & Core", "dur": 52, "xp": 140, "ex": [("ex_sq", 85.0, 5, 4), ("ex_bp", 70.0, 5, 3), ("ex_plank", 0, 60, 3)]},
        {"days_ago": 17, "name": "Deadlift Pull Session", "dur": 48, "xp": 150, "ex": [("ex_dl", 125.0, 5, 3), ("ex_ohp", 45.0, 5, 3), ("ex_pu", 0, 8, 3)]},
        {"days_ago": 15, "name": "Hypertrophy Push", "dur": 55, "xp": 130, "ex": [("ex_idb", 24.0, 10, 3), ("ex_lr", 12.0, 15, 4), ("ex_dips", 0, 10, 3)]},
        {"days_ago": 13, "name": "Weekly Target Hit Session", "dur": 45, "xp": 280, "ex": [("ex_fs", 65.0, 6, 3), ("ex_bor", 60.0, 8, 3), ("ex_fc", 28.0, 40, 3)]},
        
        {"days_ago": 11, "name": "Squat Foundation & Power", "dur": 50, "xp": 140, "ex": [("ex_sq", 90.0, 5, 4), ("ex_bp", 72.5, 5, 3), ("ex_hlr", 0, 12, 3)]},
        {"days_ago": 9, "name": "Posterior Chain Volume", "dur": 46, "xp": 135, "ex": [("ex_dl", 130.0, 5, 3), ("ex_rdl", 80.0, 8, 3), ("ex_cu", 0, 8, 3)]},
        {"days_ago": 8, "name": "Mini Consistency Session", "dur": 18, "xp": 52, "mini": True, "ex": [("ex_pu", 0, 10, 3), ("ex_pushup", 0, 20, 2)]},
        {"days_ago": 6, "name": "Speed & Upper Strength", "dur": 54, "xp": 160, "ex": [("ex_ohp", 47.5, 5, 3), ("ex_bor", 65.0, 6, 3), ("ex_bss", 20.0, 8, 3)]},
        
        {"days_ago": 4, "name": "Squats & Bench PR", "dur": 58, "xp": 195, "pr": True, "ex": [("ex_sq", 95.0, 5, 4), ("ex_bp", 75.0, 5, 3), ("ex_cwc", 25.0, 12, 3)]},
        {"days_ago": 2, "name": "Deadlift Milestone 135kg", "dur": 52, "xp": 210, "pr": True, "ex": [("ex_dl", 135.0, 5, 3), ("ex_pu", 0, 9, 3), ("ex_fp", 35.0, 15, 3)]},
        {"days_ago": 1, "name": "Accessory & Agility", "dur": 44, "xp": 130, "ex": [("ex_idb", 26.0, 8, 3), ("ex_bss", 22.0, 8, 3), ("ex_abw", 0, 10, 3)]}
    ]
    
    for item in sample_workout_specs:
        w_date = now - timedelta(days=item["days_ago"])
        w_id = f"w_{uuid.uuid4().hex[:10]}"
        sets = []
        for ex_id, wt, reps, num_sets in item["ex"]:
            # lookup name
            ex_obj = next((e for e in EXERCISES if e["id"] == ex_id), None)
            ex_name = ex_obj["name"] if ex_obj else ex_id
            for s_idx in range(1, num_sets + 1):
                sets.append({
                    "exercise_id": ex_id,
                    "exercise_name": ex_name,
                    "set_number": s_idx,
                    "reps": reps,
                    "weight_kg": float(wt),
                    "rpe": 8.0,
                    "is_pr": item.get("pr", False) and s_idx == num_sets,
                    "notes": ""
                })
                
        workout_doc = {
            "id": w_id,
            "user_id": "usr_jordan_davis",
            "date": w_date.strftime("%Y-%m-%d"),
            "duration_minutes": item["dur"],
            "is_mini_session": item.get("mini", False),
            "is_planned_session": True,
            "program_day_id": "starter_str",
            "notes": "Focused tempo, clean bar path. Felt great.",
            "energy_state": "Energized",
            "xp_earned": item["xp"],
            "prs_achieved": 1 if item.get("pr") else 0,
            "sets": sets,
            "created_at": w_date.isoformat()
        }
        db.workouts.insert_one(workout_doc)
        
        # XP event
        db.xp_events.insert_one({
            "id": f"xpe_{uuid.uuid4().hex[:10]}",
            "user_id": "usr_jordan_davis",
            "type": "workout_completed",
            "amount": item["xp"],
            "raw_amount": item["xp"],
            "multipliers": {"streak": 1.3},
            "workout_id": w_id,
            "timestamp": w_date.isoformat()
        })

    # 8. Today's Quests & Weekly Boss
    db.quests.delete_many({"user_id": "usr_jordan_davis"})
    sample_quests = [
        {
            "id": "q_daily_checkin",
            "user_id": "usr_jordan_davis",
            "title": "Daily Ready Check",
            "description": "Log your energy state before training to earn ready XP.",
            "reward_xp": 10,
            "reward_freeze": 0,
            "type": "daily",
            "target_value": 1,
            "current_value": 0,
            "is_completed": False,
            "progress_pct": 0.0,
            "expires_at": (now + timedelta(hours=14)).isoformat()
        },
        {
            "id": "q_daily_workout",
            "user_id": "usr_jordan_davis",
            "title": "Claim The Bar",
            "description": "Complete any workout session (mini or full).",
            "reward_xp": 100,
            "reward_freeze": 0,
            "type": "daily",
            "target_value": 1,
            "current_value": 0,
            "is_completed": False,
            "progress_pct": 0.0,
            "expires_at": (now + timedelta(hours=14)).isoformat()
        },
        {
            "id": "q_daily_new_ex",
            "user_id": "usr_jordan_davis",
            "title": "Uncharted Territory",
            "description": "Log 1 set of an exercise you haven't touched this week.",
            "reward_xp": 15,
            "reward_freeze": 0,
            "type": "daily",
            "target_value": 1,
            "current_value": 0,
            "is_completed": False,
            "progress_pct": 0.0,
            "expires_at": (now + timedelta(hours=14)).isoformat()
        },
        {
            "id": "q_weekly_target",
            "user_id": "usr_jordan_davis",
            "title": "Weekly Iron Discipline",
            "description": "Hit 4 sessions this week to safeguard your 6-week streak.",
            "reward_xp": 150,
            "reward_freeze": 1,
            "type": "weekly",
            "target_value": 4,
            "current_value": 3,
            "is_completed": False,
            "progress_pct": 75.0,
            "expires_at": (now + timedelta(days=2)).isoformat()
        },
        {
            "id": "q_monthly_boss",
            "user_id": "usr_jordan_davis",
            "title": "Monthly Raid: The Colossus",
            "description": "Complete 20 sessions across the 30-day season to topple the Colossus.",
            "reward_xp": 300,
            "reward_freeze": 2,
            "type": "boss",
            "target_value": 20,
            "current_value": 14,
            "is_completed": False,
            "progress_pct": 70.0,
            "boss_name": "Titan of Inertia",
            "boss_max_hp": 20,
            "boss_current_hp": 6,
            "expires_at": (now + timedelta(days=12)).isoformat()
        }
    ]
    db.quests.insert_many(sample_quests)
    
    # 9. Milestones for Jordan
    db.milestones.delete_many({"user_id": "usr_jordan_davis"})
    sample_milestones = [
        {"id": "m1", "user_id": "usr_jordan_davis", "title": "First Step on the Summit", "description": "Completed your first workout on ApexLift.", "category": "Consistency", "achieved_at": (now - timedelta(days=42)).isoformat()},
        {"id": "m2", "user_id": "usr_jordan_davis", "title": "Habit Ignited (4-Week Streak)", "description": "Protected momentum for a whole month.", "category": "Streak", "achieved_at": (now - timedelta(days=14)).isoformat()},
        {"id": "m3", "user_id": "usr_jordan_davis", "title": "Class Awakening: Berserker", "description": "Unlocked specialized agility and raw power class.", "category": "Level", "achieved_at": (now - timedelta(days=7)).isoformat()},
        {"id": "m4", "user_id": "usr_jordan_davis", "title": "Century Mark (100 Sets)", "description": "Accumulated over 100 completed work sets.", "category": "Volume", "achieved_at": (now - timedelta(days=3)).isoformat()}
    ]
    db.milestones.insert_many(sample_milestones)

    # 10. Check-ins
    db.checkins.delete_many({"user_id": "usr_jordan_davis"})
    for i in range(1, 8):
        db.checkins.insert_one({
            "id": f"chk_{i}",
            "user_id": "usr_jordan_davis",
            "date": (now - timedelta(days=i)).strftime("%Y-%m-%d"),
            "energy_state": "Energized" if i % 2 == 0 else "Okay",
            "sleep_hours": 7.5,
            "xp_earned": 10,
            "timestamp": (now - timedelta(days=i)).isoformat()
        })

    print("ApexLift database seeded successfully!")
