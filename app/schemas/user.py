from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Base User Schema
class UserBase(BaseModel):
    """Base user schema with common attributes."""
    email: EmailStr
    full_name: Optional[str] = None
    preferred_currency: str = "USD"


# Schema for creating a new user
class UserCreate(UserBase):
    """Schema for user registration."""
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


# Schema for updating user
class UserUpdate(BaseModel):
    """Schema for updating user information."""
    full_name: Optional[str] = None
    preferred_currency: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)


# Schema for user in database (response)
class User(UserBase):
    """Complete user schema returned from API."""
    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  # Allows creation from ORM models


# Schema for user in token
class UserInToken(BaseModel):
    """User data stored in JWT token."""
    id: int
    email: str


# Schema for login
class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


# Schema for token response
class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


# Schema for token data
class TokenData(BaseModel):
    """Data extracted from JWT token."""
    user_id: Optional[int] = None