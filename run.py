import os
import sys
import uvicorn

if __name__ == "__main__":
    # Add backend directory to sys.path
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    sys.path.insert(0, backend_dir)
    
    print("=" * 60)
    print(" ApexLift - Gamified Gym Consistency RPG")
    print(" Show up. Level up.")
    print(" Serving full-stack app at: http://localhost:8000")
    print(" Demo User: jordan@apexlift.app / password123")
    print("=" * 60)

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False, app_dir=backend_dir)
