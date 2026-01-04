# history.py
from fastapi import APIRouter, HTTPException, Depends
from utils.history import get_history, delete_history
from auth_dependency import get_current_user

router = APIRouter(prefix="/history", tags=["History"])

@router.get("/")
async def fetch_history(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    history = await get_history(user_id)
    if not history:
        raise HTTPException(status_code=404, detail="No history found for this user.")
    return {"user_id": user_id, "history": history}

@router.delete("/")
async def clear_history(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    result = await delete_history(user_id)
    if result["deleted_count"] == 0:
        raise HTTPException(status_code=404, detail="No history to delete.")
    return {"message": "History deleted successfully", "deleted_count": result["deleted_count"]}
