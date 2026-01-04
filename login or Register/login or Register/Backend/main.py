from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, status, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse ,  RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from dotenv import load_dotenv
from bson import ObjectId


# Local imports
from auth import router as auth_router, blacklist_token
from utils.utils import send_reset_email
from auth_dependency import get_current_user


from schemas import (
    UserCreate,
    UserOut,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    RefreshTokenRequest,
)
from config import SECRET_KEY, MONGO_URI

# Chat + History routers
from routers import chat, history


# ------------------ CONFIG ------------------ #
load_dotenv()

client = AsyncIOMotorClient(MONGO_URI)
db: AsyncIOMotorDatabase = client["pythonbot_db"]
users_collection = db["users"]

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="PythonBot API")

# Upload dir for profile images
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ------------------ MIDDLEWARE ------------------ #
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY") or "fallback-secret",
)

FRONTEND_URLS = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # bot frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_URLS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------ INCLUDE ROUTERS ------------------ #
app.include_router(auth_router)     # auth routes
app.include_router(chat.router)     # chat routes
app.include_router(history.router)  # history routes


# ------------------ SECURITY UTILS ------------------ #
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token_local(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token_local(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_user_by_email(email: str):
    return await users_collection.find_one({"email": email})

async def authenticate_user(email: str, password: str):
    user = await get_user_by_email(email)
    if not user or not verify_password(password, user["password"]):
        return False
    return user




# ------------------ ROUTES ------------------ #
@app.get("/")
def root():
    return {"message": "✅ PythonBot backend with Auth + Chat is running!"}

@app.get("/favicon.ico")
async def favicon():
    path = os.path.join("static", "favicon.ico")
    if os.path.exists(path):
        return FileResponse(path)
    return {"message": "favicon not found"}


# ========== AUTH ROUTES (Signup, Login, etc.) ========== #
@app.post("/signup", response_model=UserOut)
async def signup(user: UserCreate):
    existing_user = await get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_pw = hash_password(user.password)
    new_user = {"username": user.username, "email": user.email, "password": hashed_pw}
    result = await users_collection.insert_one(new_user)

    return {
        "id": str(result.inserted_id),
        "username": user.username,
        "email": user.email,
    }




@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token_local({"sub": user["email"]})
    refresh_token = create_refresh_token_local({"sub": user["email"]})

    # ✅ JSON return instead of redirect
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "username": user.get("username", ""),
            "email": user["email"],
            "profile_image": user.get("profile_image"),
        },
    }


@app.get("/users/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    if not current_user:
        raise HTTPException(status_code=401, detail="User not logged in")

    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "profile_image": current_user.get("profile_image")
    }



@app.post("/refresh")
async def refresh_token(data: RefreshTokenRequest):
    try:
        payload = jwt.decode(data.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    new_access_token = create_access_token_local(data={"sub": email})
    return {
        "access_token": new_access_token,
        "refresh_token": data.refresh_token,
        "token_type": "bearer",
    }


@app.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    await blacklist_token(token)
    return {"message": "Logged out successfully"}


@app.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    token = create_access_token_local(
        {"sub": user["email"]}, expires_delta=timedelta(minutes=15)
    )
    background_tasks.add_task(send_reset_email, user["email"], token)
    return {"msg": "Reset password link sent"}


@app.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    try:
        payload = jwt.decode(data.token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    hashed_pw = hash_password(data.new_password)
    await users_collection.update_one({"email": email}, {"$set": {"password": hashed_pw}})
    return {"msg": "Password reset successful"}


# ========== PROFILE IMAGE UPLOAD ========== #
@app.post("/upload-profile-image")
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    file_path = f"{UPLOAD_DIR}/{current_user['_id']}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())

    await users_collection.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": {"profile_image": file_path}}
    )

    return {"profile_image": f"http://localhost:8000/{file_path}"}

@app.patch("/users/me")
async def update_profile(
    username: Optional[str] = None,
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
):
    update_data = {}
    if username:
        update_data["username"] = username
    if file:
        file_path = f"{UPLOAD_DIR}/{current_user['_id']}_{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())
        update_data["profile_image"] = f"http://localhost:8000/{file_path}"

    if update_data:
        await users_collection.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": update_data})

    return {"msg": "Profile updated", "data": update_data}
