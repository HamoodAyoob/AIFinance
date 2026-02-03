from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    expires_at: Optional[datetime] = None

class TokenRefresh(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    user_id: int
    email: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: Optional[int] = None