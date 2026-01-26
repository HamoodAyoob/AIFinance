from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import logging

from app.core.database import SessionLocal
from app.core.config import settings
from app.core.security import get_user_id_from_token
from app.models.user import User
from app.schemas.user import TokenData

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

logger = logging.getLogger(__name__)


def get_db() -> Generator:
    """
    Dependency to get database session.
    Automatically closes session after request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """
    Dependency to get current authenticated user.

    Args:
        db: Database session
        token: JWT token from Authorization header

    Returns:
        User object if token is valid

    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = get_user_id_from_token(token)
    if user_id is None:
        logger.error(f"Invalid token or user_id not found in token")
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        logger.error(f"User not found with ID: {user_id}")
        raise credentials_exception

    # Force materialization of boolean attributes
    is_active = user.is_active
    if not is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to get current active user.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        User object if active

    Raises:
        HTTPException: If user is inactive
    """
    return current_user


async def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to get current superuser.
    Use this for admin-only endpoints.

    Args:
        current_user: User from get_current_user dependency

    Returns:
        User object if superuser

    Raises:
        HTTPException: If user is not superuser
    """
    # Force materialization of boolean attribute
    is_superuser = current_user.is_superuser
    if not is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges"
        )
    return current_user
