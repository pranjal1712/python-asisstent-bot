from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Form
from typing import Optional
from utils.bot import process_input
from utils.history import save_history, get_history_count

from auth_dependency import get_current_user_safe

import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/")
async def chat_with_bot(
    text: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    audio: Optional[UploadFile] = File(None),
    current_user: Optional[dict] = Depends(get_current_user_safe)   # ✅ safe wala
):
    logging.info(f"Decoded user: {current_user}")
    # ✅ Agar login nahi hai toh guest user banao
    if not current_user:
        user_id = "guest"
    else:
        user_id = str(current_user["_id"])

    logging.info(f"📩 New request from user_id: {user_id}")



    if not text and not image and not audio:
        raise HTTPException(status_code=400, detail="You must provide at least one input: text, image, or audio.")

    try:
        # Convert uploads to bytes
        image_bytes = await image.read() if image else None
        audio_bytes = await audio.read() if audio else None

        # Bot processor
        response = await process_input(user_id=user_id, text=text, image=image_bytes, audio=audio_bytes)

        # Save to history
        user_msg = text if text else ("[image uploaded]" if image_bytes else "[audio uploaded]")
        
        # ✅ Always string conversion (avoid None issue)
        resp_text = response.get("text") if isinstance(response, dict) else response
        resp_text = str(resp_text) if resp_text is not None else "No response"

        await save_history(user_id, user_msg, resp_text)
        
        return {"user_id": user_id, "response": response or {"text": "No response"}}

    except Exception as e:
        logging.exception(f"💥 Error during processing for {user_id}")
        raise HTTPException(status_code=500, detail=f"Something went wrong: {str(e)}")
