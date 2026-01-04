# utils/history.py
from datetime import datetime
from database import db  # must match your project database file
from langdetect import detect
from database import history_collection

chat_collection = db["chat_history"]

async def save_history(user_id: str, user_message: str, bot_response: str):
    if not bot_response:
        bot_response = ""  # Avoid NoneType issues
    await chat_collection.insert_one({
        "user_id": user_id,
        "user_message": user_message,
        "bot_response": bot_response,
        "timestamp": datetime.utcnow()
    })
async def get_history(user_id: str):
    cursor = chat_collection.find({"user_id": user_id}).sort("timestamp", 1)
    history = []
    async for doc in cursor:
        history.append({
            "id": str(doc.get("_id")),
            "user_message": doc.get("user_message"),
            "bot_response": doc.get("bot_response"),
            "timestamp": doc.get("timestamp")
        })
    return history

async def delete_history(user_id: str):
    result = await chat_collection.delete_many({"user_id": user_id})
    return {"deleted_count": result.deleted_count}


async def delete_oldest_history(user_id: str, count: int):
    # Fetch the oldest `count` documents sorted by timestamp ascending
    cursor = chat_collection.find({"user_id": user_id}).sort("timestamp", 1).limit(count)
    ids_to_delete = []
    async for doc in cursor:
        ids_to_delete.append(doc["_id"])

    if ids_to_delete:
        result = await chat_collection.delete_many({"_id": {"$in": ids_to_delete}})
        return {"deleted_count": result.deleted_count}
    else:
        return {"deleted_count": 0}
    

async def get_history_count(user_id: str) -> int:
    return await history_collection.count_documents({"user_id": user_id})
# from datetime import datetime, timedelta
# from database import db  # must match your project database file
# from langdetect import detect

# chat_collection = db["chat_history"]

# # 📝 Save chat with language info
# async def save_history(user_id: str, user_message: str, bot_response: str):
#     if not bot_response:
#         bot_response = ""  # Avoid NoneType issues
    
#     # Auto-detect language of user message
#     try:
#         user_lang = detect(user_message)
#     except:
#         user_lang = "en"  # fallback

#     await chat_collection.insert_one({
#         "user_id": user_id,
#         "user_message": user_message,
#         "bot_response": bot_response,
#         "lang": user_lang,  # Store language
#         "timestamp": datetime.utcnow()
#     })


# # 📜 Get chat history sorted oldest → newest (with language hint for bot)
# async def get_history(user_id: str, include_lang_hint=False):
#     cursor = chat_collection.find({"user_id": user_id}).sort("timestamp", 1)
#     history = []
#     async for doc in cursor:
#         user_msg = doc.get("user_message")
#         bot_msg = doc.get("bot_response")
#         lang = doc.get("lang", "en")

#         if include_lang_hint:
#             history.append({
#                 "role": "user",
#                 "content": f"[Respond in {lang} only] {user_msg}"
#             })
#             history.append({
#                 "role": "assistant",
#                 "content": bot_msg
#             })
#         else:
#             history.append({
#                 "id": str(doc.get("_id")),
#                 "user_message": user_msg,
#                 "bot_response": bot_msg,
#                 "lang": lang,
#                 "timestamp": doc.get("timestamp")
#             })
#     return history


# # ❌ Delete all history for a user
# async def delete_history(user_id: str):
#     result = await chat_collection.delete_many({"user_id": user_id})
#     return {"deleted_count": result.deleted_count}


# # ❌ Delete oldest N messages
# async def delete_oldest_history(user_id: str, count: int):
#     cursor = chat_collection.find({"user_id": user_id}).sort("timestamp", 1).limit(count)
#     ids_to_delete = []
#     async for doc in cursor:
#         ids_to_delete.append(doc["_id"])
#     if ids_to_delete:
#         result = await chat_collection.delete_many({"_id": {"$in": ids_to_delete}})
#         return {"deleted_count": result.deleted_count}
#     else:
#         return {"deleted_count": 0}


# # 🆕 Auto-delete chats older than given days
# async def delete_old_history_by_days(user_id: str, days: int):
#     """Delete messages older than N days for a given user."""
#     cutoff = datetime.utcnow() - timedelta(days=days)
#     result = await chat_collection.delete_many({
#         "user_id": user_id,
#         "timestamp": {"$lt": cutoff}
#     })
#     return {"deleted_count": result.deleted_count}

