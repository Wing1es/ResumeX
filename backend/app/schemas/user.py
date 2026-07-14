from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

from pydantic import Field

class UserCreate(UserBase):
    password: str = Field(..., max_length=70, description="Password must be less than 72 bytes for bcrypt")

class UserResponse(UserBase):
    id: int
    is_active: bool
    subscription_tier: str
    usage_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
