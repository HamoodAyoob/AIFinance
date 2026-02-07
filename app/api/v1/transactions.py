"""
Transactions API Router
Handles all transaction-related operations including CRUD, filtering, and ML categorization.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from typing import List, Optional, Dict, Any
from datetime import date, datetime
import logging

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.transaction import Transaction
from app.models.account import Account
from app.schemas.transaction import (
    TransactionCreate, 
    TransactionUpdate, 
    Transaction as TransactionSchema,
)

# Setup logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()


@router.post("/", response_model=TransactionSchema, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new transaction with automatic ML categorization.
    
    If no category is provided and description exists, ML will categorize it.
    Also updates the associated account balance.
    
    Args:
        transaction_in: Transaction creation data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        TransactionSchema: Created transaction
        
    Raises:
        HTTPException: If account not found or transaction creation fails
    """
    try:
        logger.info(f"User {current_user.id} creating transaction for account {transaction_in.account_id}")
        
        # Verify account belongs to user
        account = db.query(Account).filter(
            Account.id == transaction_in.account_id,
            Account.user_id == current_user.id
        ).first()
        
        if not account:
            logger.warning(f"Account {transaction_in.account_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account with ID {transaction_in.account_id} not found"
            )
        
        # Auto-categorize if no category provided
        auto_categorized = 0
        category_confidence = None
        
        if not transaction_in.category and transaction_in.description:
            try:
                from app.ml_models.categorizer import categorizer
                # Use ML to categorize
                category, confidence = categorizer.predict(transaction_in.description)
                transaction_in.category = category
                auto_categorized = 1
                category_confidence = confidence
                logger.info(f"Auto-categorized as '{category}' with confidence {confidence:.2f}")
            except Exception as e:
                logger.warning(f"ML categorization failed: {str(e)}, using default")
                transaction_in.category = "Other"
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
        old_balance = account.balance
        if transaction_in.transaction_type == "income":
            account.balance += transaction_in.amount
        else:  # expense
            account.balance -= transaction_in.amount
        
        logger.info(f"Account {account.id} balance: {old_balance} -> {account.balance}")
        
        # Add and commit
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)
        
        logger.info(f"Transaction {db_transaction.id} created successfully")
        return db_transaction
        
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction data provided"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating transaction: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while creating transaction"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating transaction: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/", response_model=List[TransactionSchema])
def list_transactions(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records to return"),
    category: Optional[str] = Query(None, description="Filter by category"),
    transaction_type: Optional[str] = Query(None, description="Filter by type (income/expense)"),
    start_date: Optional[date] = Query(None, description="Filter by start date"),
    end_date: Optional[date] = Query(None, description="Filter by end date"),
    account_id: Optional[int] = Query(None, description="Filter by account ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List transactions with advanced filtering and pagination.
    
    Args:
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        category: Filter by category
        transaction_type: Filter by type (income or expense)
        start_date: Filter transactions from this date
        end_date: Filter transactions until this date
        account_id: Filter by specific account
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List[TransactionSchema]: List of transactions matching filters
        
    Raises:
        HTTPException: If fetching transactions fails
    """
    try:
        logger.debug(
            f"User {current_user.id} fetching transactions "
            f"(skip={skip}, limit={limit}, category={category}, "
            f"type={transaction_type}, account={account_id})"
        )
        
        # Build base query
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
        if account_id:
            query = query.filter(Transaction.account_id == account_id)
        
        # Order by date descending and paginate
        transactions = query.order_by(
            Transaction.transaction_date.desc()
        ).offset(skip).limit(limit).all()
        
        # Commit to close transaction
        db.commit()
        
        logger.info(f"Retrieved {len(transactions)} transactions for user {current_user.id}")
        return transactions
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error fetching transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching transactions"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error fetching transactions: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/summary")
def get_transaction_summary(
    start_date: Optional[date] = Query(None, description="Start date for summary"),
    end_date: Optional[date] = Query(None, description="End date for summary"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get transaction summary with totals by category.
    
    Returns plain dict instead of Pydantic model to avoid validation issues.
    
    Args:
        start_date: Start date for summary period
        end_date: End date for summary period
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Dict: Summary with income, expenses, and category breakdown
        
    Raises:
        HTTPException: If generating summary fails
    """
    try:
        logger.debug(
            f"User {current_user.id} fetching transaction summary "
            f"(start={start_date}, end={end_date})"
        )
        
        # Build query
        query = db.query(Transaction).filter(
            Transaction.user_id == current_user.id
        )
        
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        
        transactions = query.all()
        
        # Calculate totals
        total_income = sum(
            t.amount for t in transactions 
            if t.transaction_type == "income"
        )
        total_expenses = sum(
            t.amount for t in transactions 
            if t.transaction_type == "expense"
        )
        
        # Group by category
        by_category = {}
        for t in transactions:
            if t.category not in by_category:
                by_category[t.category] = {
                    "total": 0.0,
                    "count": 0,
                    "income": 0.0,
                    "expenses": 0.0
                }
            by_category[t.category]["count"] += 1
            if t.transaction_type == "income":
                by_category[t.category]["income"] += float(t.amount)
                by_category[t.category]["total"] += float(t.amount)
            else:
                by_category[t.category]["expenses"] += float(t.amount)
                by_category[t.category]["total"] += float(t.amount)
        
        # Commit to close transaction
        db.commit()
        
        summary = {
            "total_income": round(float(total_income), 2),
            "total_expenses": round(float(total_expenses), 2),
            "net": round(float(total_income - total_expenses), 2),
            "transaction_count": len(transactions),
            "by_category": by_category
        }
        
        logger.info(f"Transaction summary generated for user {current_user.id}")
        return summary
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error generating summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while generating summary"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error generating summary: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/{transaction_id}", response_model=TransactionSchema)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific transaction by ID.
    
    Args:
        transaction_id: ID of the transaction to retrieve
        db: Database session
        current_user: Authenticated user
        
    Returns:
        TransactionSchema: The requested transaction
        
    Raises:
        HTTPException: If transaction not found or access denied
    """
    try:
        logger.debug(f"User {current_user.id} fetching transaction {transaction_id}")
        
        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        ).first()
        
        if not transaction:
            logger.warning(f"Transaction {transaction_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )
        
        # Commit to close transaction
        db.commit()
        
        logger.info(f"Transaction {transaction_id} retrieved successfully")
        return transaction
        
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error fetching transaction {transaction_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching transaction"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error fetching transaction {transaction_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.put("/{transaction_id}", response_model=TransactionSchema)
def update_transaction(
    transaction_id: int,
    transaction_in: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an existing transaction.
    
    Note: Updating transaction amount will adjust account balance.
    
    Args:
        transaction_id: ID of the transaction to update
        transaction_in: Updated transaction data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        TransactionSchema: Updated transaction
        
    Raises:
        HTTPException: If transaction not found or update fails
    """
    try:
        logger.info(f"User {current_user.id} updating transaction {transaction_id}")
        
        # Fetch transaction
        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        ).first()
        
        if not transaction:
            logger.warning(f"Transaction {transaction_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )
        
        # Get associated account
        account = db.query(Account).filter(
            Account.id == transaction.account_id
        ).first()
        
        # If amount or type changed, adjust account balance
        update_data = transaction_in.dict(exclude_unset=True)
        
        if "amount" in update_data or "transaction_type" in update_data:
            # Reverse old transaction
            if transaction.transaction_type == "income":
                account.balance -= transaction.amount
            else:
                account.balance += transaction.amount
            
            # Apply new transaction
            new_amount = update_data.get("amount", transaction.amount)
            new_type = update_data.get("transaction_type", transaction.transaction_type)
            
            if new_type == "income":
                account.balance += new_amount
            else:
                account.balance -= new_amount
            
            logger.info(f"Account {account.id} balance adjusted")
        
        # Update transaction fields
        for field, value in update_data.items():
            setattr(transaction, field, value)
        
        # Commit changes
        db.commit()
        db.refresh(transaction)
        
        logger.info(f"Transaction {transaction_id} updated successfully")
        return transaction
        
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error updating transaction {transaction_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid data provided for transaction update"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating transaction {transaction_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while updating transaction"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating transaction {transaction_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a transaction and adjust account balance.
    
    Args:
        transaction_id: ID of the transaction to delete
        db: Database session
        current_user: Authenticated user
        
    Returns:
        None (204 No Content)
        
    Raises:
        HTTPException: If transaction not found or deletion fails
    """
    try:
        logger.info(f"User {current_user.id} deleting transaction {transaction_id}")
        
        # Fetch transaction
        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.user_id == current_user.id
        ).first()
        
        if not transaction:
            logger.warning(f"Transaction {transaction_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Transaction with ID {transaction_id} not found"
            )
        
        # Get associated account and reverse transaction
        account = db.query(Account).filter(
            Account.id == transaction.account_id
        ).first()
        
        if account:
            # Reverse the transaction effect on balance
            if transaction.transaction_type == "income":
                account.balance -= transaction.amount
            else:
                account.balance += transaction.amount
            logger.info(f"Account {account.id} balance adjusted after deletion")
        
        # Delete transaction
        db.delete(transaction)
        db.commit()
        
        logger.info(f"Transaction {transaction_id} deleted successfully")
        return None
        
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting transaction {transaction_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while deleting transaction"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting transaction {transaction_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.post("/bulk-categorize")
def bulk_categorize_transactions(
    transaction_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Bulk re-categorize transactions using ML.
    
    Args:
        transaction_ids: List of transaction IDs to re-categorize
        db: Database session
        current_user: Authenticated user
        
    Returns:
        dict: Summary of categorization results
        
    Raises:
        HTTPException: If bulk categorization fails
    """
    try:
        from app.ml_models.categorizer import categorizer
        
        logger.info(f"User {current_user.id} bulk categorizing {len(transaction_ids)} transactions")
        
        updated_count = 0
        failed_count = 0
        
        for txn_id in transaction_ids:
            try:
                transaction = db.query(Transaction).filter(
                    Transaction.id == txn_id,
                    Transaction.user_id == current_user.id
                ).first()
                
                if transaction and transaction.description:
                    category, confidence = categorizer.predict(transaction.description)
                    transaction.category = category
                    transaction.auto_categorized = 1
                    transaction.category_confidence = confidence
                    updated_count += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                logger.warning(f"Failed to categorize transaction {txn_id}: {str(e)}")
                failed_count += 1
        
        db.commit()
        
        result = {
            "updated": updated_count,
            "failed": failed_count,
            "total": len(transaction_ids)
        }
        
        logger.info(f"Bulk categorization complete: {result}")
        return result
        
    except ImportError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="ML categorizer not available"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error in bulk categorization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred during bulk categorization"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error in bulk categorization: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )