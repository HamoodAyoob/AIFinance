from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.budget import Budget, BudgetPeriod
from app.models.transaction import Transaction
from app.schemas.budget import BudgetCreate, BudgetUpdate, Budget as BudgetSchema, BudgetStatus

router = APIRouter()


@router.post("/", response_model=BudgetSchema, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new budget for a category.
    """
    # Check if budget already exists for this category and period
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category,
        Budget.period == budget_in.period
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Budget already exists for category '{budget_in.category}' with period '{budget_in.period}'"
        )
    
    db_budget = Budget(
        **budget_in.dict(),
        user_id=current_user.id
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget


@router.get("/", response_model=List[BudgetSchema])
def list_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all budgets for the current user.
    """
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id
    ).all()
    return budgets


@router.get("/status", response_model=List[BudgetStatus])
def get_budget_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get budget status with current spending for each budget.
    """
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id
    ).all()
    
    status_list = []
    now = datetime.now()
    
    for budget in budgets:
        # Calculate date range based on period
        if budget.period == BudgetPeriod.WEEKLY:
            start_date = (now - timedelta(days=7)).date()
        elif budget.period == BudgetPeriod.MONTHLY:
            start_date = (now - relativedelta(months=1)).date()
        else:  # YEARLY
            start_date = (now - relativedelta(years=1)).date()
        
        # Calculate spent amount
        spent = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == current_user.id,
            Transaction.category == budget.category,
            Transaction.transaction_type == "expense",
            Transaction.transaction_date >= start_date
        ).scalar() or 0.0
        
        remaining = budget.limit_amount - spent
        percentage_used = (spent / budget.limit_amount * 100) if budget.limit_amount > 0 else 0
        alert = percentage_used >= (budget.alert_threshold * 100)
        
        status_list.append({
            "budget": budget,
            "spent": round(spent, 2),
            "remaining": round(remaining, 2),
            "percentage_used": round(percentage_used, 2),
            "alert": alert
        })
    
    return status_list


@router.get("/{budget_id}", response_model=BudgetSchema)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific budget by ID.
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return budget


@router.put("/{budget_id}", response_model=BudgetSchema)
def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a budget.
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    update_data = budget_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(budget, field, value)
    
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a budget.
    """
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    db.delete(budget)
    db.commit()
    
    return None