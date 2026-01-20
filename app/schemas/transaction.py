from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class TransactionBase(BaseModel):
    """Base transaction schema."""
    amount: float = Field(..., gt=0)
    transaction_type: str  # "income" or "expense"
    category: Optional[str] = None
    description: Optional[str] = None
    transaction_date: date


class TransactionCreate(TransactionBase):
    """Schema for creating transaction."""
    account_id: int


class TransactionUpdate(BaseModel):
    """Schema for updating transaction."""
    amount: Optional[float] = Field(None, gt=0)
    transaction_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    transaction_date: Optional[date] = None


class Transaction(TransactionBase):
    """Complete transaction schema."""
    id: int
    user_id: int
    account_id: int
    category: str
    auto_categorized: int
    category_confidence: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TransactionSummary(BaseModel):
    """Transaction summary schema."""
    total_income: float
    total_expenses: float
    net: float
    by_category: dict