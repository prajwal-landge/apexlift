import os

SECRET_KEY = os.getenv("JWT_SECRET", "apexlift-rpg-secret-token-key-2026-show-up-level-up")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "apexlift")
