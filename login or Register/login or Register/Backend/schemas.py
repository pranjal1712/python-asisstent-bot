from pydantic import BaseModel, EmailStr, Field
from typing import Optional
# ==== Shared Base Schema ====
class UserBase(BaseModel):
    username: str
    email: EmailStr
    profile_image: Optional[str] = "/static/default-avatar.png"

# ==== Signup/Create Schema ====
class UserCreate(UserBase):
    password: str

# ==== Response Schema (e.g., /users/me, /signup) ====
class UserOut(UserBase):
    id: str  # MongoDB ObjectId returned as string

    class Config:
        orm_mode = True

# ==== Token Schema (JWT Only) ====
class Token(BaseModel):
    access_token: str
    token_type: str = Field(default="bearer")

# ==== Token Schema with User Info (Optional Use) ====
class TokenWithUser(BaseModel):
    access_token: str
    token_type: str = Field(default="bearer")
    user: UserOut


class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserUpdate(BaseModel):
    username: Optional[str]
    profile_image: Optional[str]


