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
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode the token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.error(f"No 'sub' claim in token payload: {payload}")
            raise credentials_exception
            
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise credentials_exception
    except Exception as e:
        logger.error(f"Unexpected error decoding token: {str(e)}")
        raise credentials_exception

    # Get user from database
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
    except ValueError:
        logger.error(f"Invalid user_id format: {user_id}")
        raise credentials_exception
        
    if user is None:
        logger.error(f"User not found with ID: {user_id}")
        raise credentials_exception

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Inactive user"
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
