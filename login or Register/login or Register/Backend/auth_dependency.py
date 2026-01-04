from fastapi import Depends, HTTPException

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from config import SECRET_KEY, ALGORITHM
from database import users_collection
from typing import Optional

# HTTP Bearer auth (auto_error=False => guest allowed)
bearer_scheme = HTTPBearer(auto_error=False)

# ✅ Strict version: user login required
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization token missing")

    token = credentials.credentials
    print("✅ Received token:", token)  # ← debug

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("✅ Decoded payload:", payload)  # ← debug

        email = payload.get("sub")   # ✅ sub = email
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await users_collection.find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        print("✅ Found user:", user)  # ← debug
        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Token is invalid or expired")


# ✅ Safe version: guest allowed
async def get_current_user_safe(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)) -> Optional[dict]:
    if not credentials:
        return None  # Guest mode

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            return None
        user = await users_collection.find_one({"email": email})
        return user
    except JWTError:
        return None
