#!/usr/bin/env python3
"""
Test database connection and user setup
"""

import sys

sys.path.insert(0, ".")

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash, verify_password


def test_db_setup():
    """Test database setup and user creation."""

    db = SessionLocal()

    try:
        # Check if user exists
        user = db.query(User).filter(User.email == "hamoodayoob33@gmail.com").first()

        if user:
            print(f"User found: {user}")
            print(f"User ID: {user.id}")
            print(f"Is active: {user.is_active}")
            print(f"Is superuser: {user.is_superuser}")

            # Test password verification
            test_passwords = ["admin", "test", "123456", "password"]
            for pwd in test_passwords:
                try:
                    if verify_password(pwd, user.hashed_password):
                        print(f"Password works: {pwd}")
                        break
                except Exception as e:
                    print(f"Password test error for '{pwd}': {e}")
            else:
                print("No test password worked")

            # Show first few chars of hash for debugging
            print(f"Password hash starts with: {user.hashed_password[:20]}...")

        else:
            print("User not found. Creating test user...")
            # Create a simple test user with admin credentials
            test_password = "admin"
            test_user = User(
                email="test@example.com",
                full_name="Test User",
                hashed_password=get_password_hash(test_password),
                is_active=True,
                is_superuser=True,
            )
            db.add(test_user)
            db.commit()
            print(
                f"Test user created with email: test@example.com, password: {test_password}"
            )

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    test_db_setup()
