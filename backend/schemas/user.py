# pyre-ignore-all-errors
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    age: int

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    device_type: Optional[str] = "desktop"

class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr] = None
    status: Optional[str] = None
    age: int
    bio: Optional[str] = None
    passion: Optional[str] = None
    profile_song: Optional[str] = None

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    status: Optional[str] = None
    bio: Optional[str] = None
    passion: Optional[str] = None
    profile_song: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LinkAccount(BaseModel):
    email: EmailStr
    password: str
