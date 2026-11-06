import os
import sys

# Ensure backend directory is in Python path for Vercel Serverless Function
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
from app.database import get_db
from app.seed_data import seed_database

# Initialize and seed database if empty on serverless invocation
try:
    db = get_db()
    if db.users.count_documents({}) == 0 or db.exercises.count_documents({}) == 0:
        seed_database(db)
except Exception as e:
    print(f"Serverless init warning: {e}")
