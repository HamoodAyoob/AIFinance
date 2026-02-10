"""
Accounts API Router
Handles all account-related operations including CRUD operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from typing import List
import logging

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountUpdate, Account as AccountSchema

# Setup logging
logger = logging.getLogger(__name__)

# Initialize router
router = APIRouter()


@router.post("/", response_model=AccountSchema, status_code=status.HTTP_201_CREATED)
def create_account(
    account_in: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new account for the current user.
    
    Args:
        account_in: Account creation data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        AccountSchema: Created account
        
    Raises:
        HTTPException: If account creation fails
    """
    try:
        logger.info(f"User {current_user.id} creating new account: {account_in.account_name}")
        
        # Create account instance
        db_account = Account(
            **account_in.dict(),
            user_id=current_user.id
        )
        
        # Add to session and commit
        db.add(db_account)
        db.commit()
        db.refresh(db_account)
        
        logger.info(f"Account created successfully with ID: {db_account.id}")
        return db_account
        
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error creating account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this name may already exist or invalid data provided"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while creating account"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating account: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/", response_model=List[AccountSchema])
def list_accounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all accounts for the current user with pagination.
    
    Args:
        skip: Number of records to skip (pagination)
        limit: Maximum number of records to return
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List[AccountSchema]: List of user's accounts
        
    Raises:
        HTTPException: If fetching accounts fails
    """
    try:
        logger.debug(f"User {current_user.id} fetching accounts (skip={skip}, limit={limit})")
        
        # Query accounts with pagination
        accounts = db.query(Account).filter(
            Account.user_id == current_user.id
        ).offset(skip).limit(limit).all()
        
        # Commit to close the transaction properly
        db.commit()
        
        logger.info(f"Retrieved {len(accounts)} accounts for user {current_user.id}")
        return accounts
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error fetching accounts: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching accounts"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error fetching accounts: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/{account_id}", response_model=AccountSchema)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a specific account by ID.
    
    Args:
        account_id: ID of the account to retrieve
        db: Database session
        current_user: Authenticated user
        
    Returns:
        AccountSchema: The requested account
        
    Raises:
        HTTPException: If account not found or access denied
    """
    try:
        logger.debug(f"User {current_user.id} fetching account {account_id}")
        
        # Query account
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == current_user.id
        ).first()
        
        # Check if account exists
        if not account:
            logger.warning(f"Account {account_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account with ID {account_id} not found"
            )
        
        # Commit to close the transaction properly
        db.commit()
        
        logger.info(f"Account {account_id} retrieved successfully")
        return account
        
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error fetching account {account_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching account"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error fetching account {account_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.put("/{account_id}", response_model=AccountSchema)
def update_account(
    account_id: int,
    account_in: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an existing account.
    
    Args:
        account_id: ID of the account to update
        account_in: Updated account data
        db: Database session
        current_user: Authenticated user
        
    Returns:
        AccountSchema: Updated account
        
    Raises:
        HTTPException: If account not found or update fails
    """
    try:
        logger.info(f"User {current_user.id} updating account {account_id}")
        
        # Fetch account
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == current_user.id
        ).first()
        
        # Check if account exists
        if not account:
            logger.warning(f"Account {account_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account with ID {account_id} not found"
            )
        
        # Update account fields
        update_data = account_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(account, field, value)
        
        # Commit changes
        db.commit()
        db.refresh(account)
        
        logger.info(f"Account {account_id} updated successfully")
        return account
        
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Database integrity error updating account {account_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid data provided for account update"
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating account {account_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while updating account"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating account {account_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an account.
    
    Args:
        account_id: ID of the account to delete
        db: Database session
        current_user: Authenticated user
        
    Returns:
        None (204 No Content)
        
    Raises:
        HTTPException: If account not found or deletion fails
    """
    try:
        logger.info(f"User {current_user.id} deleting account {account_id}")
        
        # Fetch account
        account = db.query(Account).filter(
            Account.id == account_id,
            Account.user_id == current_user.id
        ).first()
        
        # Check if account exists
        if not account:
            logger.warning(f"Account {account_id} not found for user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Account with ID {account_id} not found"
            )
        
        # Delete account
        db.delete(account)
        db.commit()
        
        logger.info(f"Account {account_id} deleted successfully")
        return None
        
    except HTTPException:
        db.rollback()
        raise
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Cannot delete account {account_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete account. It may have associated transactions."
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error deleting account {account_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while deleting account"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error deleting account {account_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


@router.get("/summary/balance")
def get_account_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get summary of all accounts including total balance.
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        dict: Account summary with total balance and count
        
    Raises:
        HTTPException: If fetching summary fails
    """
    try:
        logger.debug(f"User {current_user.id} fetching account summary")
        
        # Fetch all accounts
        accounts = db.query(Account).filter(
            Account.user_id == current_user.id
        ).all()
        
        # Calculate totals
        total_balance = sum(account.balance for account in accounts)
        account_count = len(accounts)
        
        # Group by account type
        by_type = {}
        for account in accounts:
            acc_type = account.account_type
            if acc_type not in by_type:
                by_type[acc_type] = {"count": 0, "balance": 0}
            by_type[acc_type]["count"] += 1
            by_type[acc_type]["balance"] += account.balance
        
        # Commit to close transaction
        db.commit()
        
        summary = {
            "total_balance": round(total_balance, 2),
            "account_count": account_count,
            "by_type": by_type,
            "accounts": [
                {
                    "id": acc.id,
                    "name": acc.account_name,
                    "type": acc.account_type,
                    "balance": round(acc.balance, 2),
                    "currency": acc.currency
                }
                for acc in accounts
            ]
        }
        
        logger.info(f"Account summary generated for user {current_user.id}")
        return summary
        
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error fetching account summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error occurred while fetching account summary"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error fetching account summary: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )