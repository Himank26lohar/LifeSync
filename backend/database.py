from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "lifesync")

client = MongoClient(
    MONGODB_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=5000,
)
db = client[DATABASE_NAME]

# Collections — one per feature
tasks_collection = db["tasks"]
habits_collection = db["habits"]
wellness_collection = db["wellness"]
journal_collection = db["journal"]
profile_collection = db["profile"]
users_collection = db["users"]

def get_database():
    return db
