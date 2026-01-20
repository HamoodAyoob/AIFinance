from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.budget import BudgetPeriod


class BudgetBase(BaseModel):
    """Base budget schema."""
    category: str
    limit_amount: float = Field(..., gt=0)
    period: BudgetPeriod = BudgetPeriod.MONTHLY
    alert_threshold: float = Field(0.8, ge=0, le=1)


class BudgetCreate(BudgetBase):
    """Schema for creating budget."""
    pass


class BudgetUpdate(BaseModel):
    """Schema for updating budget."""
    category: Optional[str] = None
    limit_amount: Optional[float] = Field(None, gt=0)
    period: Optional[BudgetPeriod] = None
    alert_threshold: Optional[float] = Field(None, ge=0, le=1)


class Budget(BudgetBase):
    """Complete budget schema."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class BudgetStatus(BaseModel):
    """Budget status with spending info."""
    budget: Budget
    spent: float
    remaining: float
    percentage_used: float
    alert: bool