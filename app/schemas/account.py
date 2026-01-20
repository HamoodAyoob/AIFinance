from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.account import AccountType


class AccountBase(BaseModel):
    """Base account schema."""
    account_name: str
    account_type: AccountType
    balance: float = 0.0
    currency: str = "USD"


class AccountCreate(AccountBase):
    """Schema for creating account."""
    pass


class AccountUpdate(BaseModel):
    """Schema for updating account."""
    account_name: Optional[str] = None
    account_type: Optional[AccountType] = None
    balance: Optional[float] = None
    currency: Optional[str] = None


class Account(AccountBase):
    """Complete account schema."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True