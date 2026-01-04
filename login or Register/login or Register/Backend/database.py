from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.collection import Collection
from motor.motor_asyncio import AsyncIOMotorCollection 
from dotenv import load_dotenv
from bson import ObjectId

import os

load_dotenv()
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = AsyncIOMotorClient(MONGO_URL)
db = client["pythonbot_db"]

# Users collection
users_collection = db["users"]

# Blacklist collection
blacklist_collection = db["blacklist"]

# ✅ New Chat History collection
history_collection = db["chat_history"]


def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "profile_image": user.get("profile_image", "/static/default-avatar.png"),
    }
