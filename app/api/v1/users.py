from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserSchema)
def read_current_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    try:
        db.commit()  # ✅ Commit to close transaction
        return current_user
    except Exception as e:
        db.rollback()
        raise HTTPException(...)


@router.put("/me", response_model=UserSchema)
def update_current_user(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user information.
    
    Args:
        user_in: Updated user data
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Updated user object
    """
    # Update fields if provided
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    
    if user_in.preferred_currency is not None:
        current_user.preferred_currency = user_in.preferred_currency
    
    if user_in.password is not None:
        current_user.hashed_password = get_password_hash(user_in.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete current user account.
    
    Args:
        db: Database session
        current_user: Current authenticated user
    """
    db.delete(current_user)
    db.commit()
    
    return None


@router.get("/{user_id}", response_model=UserSchema)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user by ID.
    Users can only view their own profile.
    
    Args:
        user_id: User ID to retrieve
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        User object
        
    Raises:
        HTTPException: If trying to access another user's profile
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this user's information"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user