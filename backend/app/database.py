import logging
import os
import mongomock
from app.config import MONGO_URI, DATABASE_NAME

logger = logging.getLogger("apexlift.database")

_client = None
_db = None
_is_mock = False

def init_db():
    global _client, _db, _is_mock
    if _db is not None:
        return _db
        
    use_live = os.getenv("USE_LIVE_MONGO", "0") in ("1", "true", "True")
    if use_live:
        try:
            from pymongo import MongoClient
            client = MongoClient(MONGO_URI, connectTimeoutMS=500, serverSelectionTimeoutMS=500)
            client.admin.command("ping")
            _client = client
            _db = _client[DATABASE_NAME]
            _is_mock = False
            logger.info("Connected to live MongoDB at %s", MONGO_URI)
            return _db
        except Exception as e:
            logger.warning("Live MongoDB unavailable: %s. Using MongoMock.", e)

    _client = mongomock.MongoClient()
    _db = _client[DATABASE_NAME]
    _is_mock = True
    return _db

def get_db():
    global _db
    if _db is None:
        init_db()
    return _db

def is_mock_db() -> bool:
    return _is_mock
