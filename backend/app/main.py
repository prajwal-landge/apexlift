import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import get_db, init_db
from app.seed_data import seed_database
from app.routers import auth, dashboard, workouts, quests, plans, progress, league, settings

app = FastAPI(
    title="ApexLift API",
    description="Full-stack gamified gym-consistency RPG backend. Show up. Level up.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(workouts.router)
app.include_router(quests.router)
app.include_router(plans.router)
app.include_router(progress.router)
app.include_router(league.router)
app.include_router(settings.router)

@app.on_event("startup")
def startup_event():
    db = get_db()
    # Check if demo user or exercises seeded
    if db.users.count_documents({}) == 0 or db.exercises.count_documents({}) == 0:
        print("Seeding ApexLift initial database...")
        seed_database(db)
    else:
        print("ApexLift database ready.")

@app.get("/health")
def health():
    return {"status": "ok", "app": "ApexLift", "version": "1.0.0"}

# Mount frontend dist static files if they exist
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
