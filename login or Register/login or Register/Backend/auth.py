# auth.py
from typing import cast, Any, Optional
from authlib.integrations.base_client import OAuthError
from authlib.integrations.starlette_client.apps import StarletteOAuth2App as OAuthClient

from starlette.config import Config
import os
from datetime import datetime, timedelta

from jose import jwt
from fastapi import HTTPException, APIRouter, Request
from starlette.responses import RedirectResponse
from dotenv import load_dotenv

from database import blacklist_collection, users_collection
from config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
)
from oauth import oauth

router = APIRouter()
load_dotenv()

# ---------------- JWT Token Helpers ---------------- #
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def blacklist_token(token: str):
    await blacklist_collection.insert_one({"token": token})

async def is_token_blacklisted(token: str):
    return await blacklist_collection.find_one({"token": token}) is not None

# ---------------- Google OAuth ---------------- #
@router.get("/auth/google")
async def login_with_google(request: Request):
    google = cast(OAuthClient, oauth.create_client('google'))
    redirect_uri = request.url_for("google_callback")
    return await google.authorize_redirect(request, redirect_uri)

@router.get("/auth/google/callback", name="google_callback")
async def google_callback(request: Request):
    google = cast(OAuthClient, oauth.create_client('google'))
    try:
        token = await google.authorize_access_token(request)
        user_info = await google.parse_id_token(request, token)
    except OAuthError as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {e.error}")

    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to retrieve user info from Google")

    # user data
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")

    # Check if user exists in MongoDB
    user = await users_collection.find_one({"email": email})

    if not user:
        new_user = {
            "username": name,
            "email": email,
            "profile_image": picture,
            "provider": "google",
            "created_at": datetime.utcnow()
        }
        result = await users_collection.insert_one(new_user)
        user_id = result.inserted_id
    else:
        user_id = user["_id"]

    # jwt token generate
    access_token = create_access_token(data={"sub": email})
    refresh_token = create_refresh_token(data={"sub": email})

    # ✅ Redirect frontend ke URL par tokens ke sath
    response = RedirectResponse(
        url=f"http://127.0.0.1:3000/success?access_token={access_token}&refresh_token={refresh_token}"
    )
    return response
