from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    units: str = "kg"
    weekly_target: int = 4
    experience_level: str = "Intermediate"
    goal: str = "Build consistency and hit 140kg deadlift"

class UserSettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    units: Optional[str] = None # "kg" or "lbs"
    weekly_target: Optional[int] = Field(default=None, ge=2, le=6)
    experience_level: Optional[str] = None
    goal: Optional[str] = None

class ExerciseSchema(BaseModel):
    id: str
    name: str
    category: str # "Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio"
    stat_tag: str # "STR", "END", "AGI"
    equipment: str # "Barbell", "Dumbbell", "Bodyweight", "Machine", "Cable"
    is_compound: bool = False
    description: str = ""

class WorkoutSetSchema(BaseModel):
    exercise_id: str
    exercise_name: str
    set_number: int
    reps: int
    weight_kg: float
    rpe: Optional[float] = None
    is_pr: bool = False
    notes: Optional[str] = None

class WorkoutCreate(BaseModel):
    duration_minutes: int = 45
    is_mini_session: bool = False
    is_planned_session: bool = False
    program_day_id: Optional[str] = None
    notes: Optional[str] = None
    energy_state: Optional[str] = None # "Energized", "Okay", "Low energy"
    sets: List[WorkoutSetSchema] = []

class CheckinCreate(BaseModel):
    energy_state: str # "Energized", "Okay", "Low energy"
    sleep_hours: Optional[float] = 7.5
    notes: Optional[str] = None

class QuestSchema(BaseModel):
    id: str
    title: str
    description: str
    reward_xp: int
    reward_freeze: int = 0
    type: str # "daily", "weekly", "boss", "comeback"
    target_value: int
    current_value: int
    is_completed: bool
    progress_pct: float
    expires_at: Optional[str] = None
    boss_name: Optional[str] = None
    boss_max_hp: Optional[int] = None
    boss_current_hp: Optional[int] = None
