import os

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database

load_dotenv()

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        uri = os.environ["MONGODB_URI"]
        _client = MongoClient(uri)
    return _client


def get_db() -> Database:
    db_name = os.environ.get("MONGODB_DB_NAME", "hi_pando")
    return get_client()[db_name]


def ping() -> bool:
    get_client().admin.command("ping")
    return True
