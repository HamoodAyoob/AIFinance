from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.account import Account
from app.schemas.transaction import (
    TransactionCreate, 
    TransactionUpdate, 
    Transaction as TransactionSchema,
    TransactionSummary
)
from app.ml_models.categorizer import categorizer

router = APIRouter()


@router.post("/", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new transaction with automatic categorization.
    If no category is provided and description exists, ML will categorize it.
    """
    # Verify account belongs to user
    account = db.query(Account).filter(
        Account.id == transaction_in.account_id,
        Account.user_id == current_user.id
    ).first()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Auto-categorize if no category provided
    auto_categorized = 0
    category_confidence = None
    
    if not transaction_in.category and transaction_in.description:
        # Use ML to categorize
        category, confidence = categorizer.predict(transaction_in.description)
        transaction_in.category = category
        auto_categorized = 1
        category_confidence = confidence
    elif not transaction_in.category:
        # Default category if no description
        transaction_in.category = "Other"
    
    # Create transaction
    db_transaction = Transaction(
        **transaction_in.dict(),
        user_id=current_user.id,
        auto_categorized=auto_categorized,
        category_confidence=category_confidence
    )
    
    # Update account balance
    if transaction_in.transaction_type == "income":
        account.balance += transaction_in.amount
    else:  # expense
        account.balance -= transaction_in.amount
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction


@router.get("/", response_model=List[TransactionSchema])
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List transactions with filtering and pagination.
    """
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    )
    
    # Apply filters
    if category:
        query = query.filter(Transaction.category == category)
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    # Order by date descending and paginate
    query = query.order_by(Transaction.transaction_date.desc())
    transactions = query.offset(skip).limit(limit).all()
    
    return transactions


@router.get("/summary", response_model=TransactionSummary)
def get_transaction_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get transaction summary with totals by category.
    """
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    )
    
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)
    
    transactions = query.all()
    
    # Calculate totals
    total_income = sum(t.amount for t in transactions if t.transaction_type == "income")
    total_expenses = sum(t.amount for t in transactions if t.transaction_type == "expense")
    
    # Group by category
    by_category = {}
    for t in transactions:
        if t.category not in by_category:
            by_category[t.category] = 0
        by_category[t.category] += t.amount
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net": total_income - total_expenses,
        "by_category": by_category
    }


@router.get("/{transaction_id}", response_model=TransactionSchema)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific transaction by ID.
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction


@router.put("/{transaction_id}", response_model=TransactionSchema)
def update_transaction(
    transaction_id: int,
    transaction_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update a transaction.
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    update_data = transaction_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(transaction, field, value)
    
    db.commit()
    db.refresh(transaction)
    
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a transaction.
    """
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    db.delete(transaction)
    db.commit()
    
    return None