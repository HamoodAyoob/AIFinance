#!/usr/bin/env python3
"""
Create test user for authentication
"""

import sys

sys.path.insert(0, ".")

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash, verify_password


def create_test_user():
    """Create a test user for authentication."""

    db = SessionLocal()

    try:
        # Check if test user exists
        existing_user = db.query(User).filter(User.email == "test@domain.com").first()

        if existing_user:
            print("Test user already exists")
            return

        # Create test user
        test_password = "admin"
        test_user = User(
            email="test@domain.com",
            full_name="Test User",
            hashed_password=get_password_hash(test_password),
            is_active=True,
            is_superuser=True,
        )
        db.add(test_user)
        db.commit()
        print(f"Test user created: test@domain.com / {test_password}")

        # Verify password
        if verify_password(test_password, test_user.hashed_password):
            print("Password verification successful!")
        else:
            print("Password verification failed!")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_test_user()
