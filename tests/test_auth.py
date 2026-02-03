#!/usr/bin/env python3
"""
Test authentication flow
"""

import requests
import json


def test_auth_flow():
    """Test the complete authentication flow."""

    base_url = "http://localhost:8000"

    # Test login (form data for OAuth2)
    login_data = {
        "username": "test@domain.com",
        "password": "admin",  # Use our test user credentials
    }

    try:
        # Login request with form data
        login_response = requests.post(f"{base_url}/api/v1/auth/login", data=login_data)
        print(f"Login Status: {login_response.status_code}")

        if login_response.status_code == 200:
            login_result = login_response.json()
            print("Login successful!")
            print("Access token:", login_result.get("access_token", "Not found"))

            # Test protected endpoint with token
            headers = {
                "Authorization": f"Bearer {login_result.get('access_token')}",
                "Content-Type": "application/json",
            }

            # Test users/me endpoint
            me_response = requests.get(f"{base_url}/api/v1/users/me", headers=headers)
            print(f"Users/me Status: {me_response.status_code}")
            if me_response.status_code == 200:
                print("User data:", me_response.json())
            else:
                print("User data failed:", me_response.text)

            # Test ML prediction endpoint
            ml_data = {"months_ahead": 1}
            ml_response = requests.post(
                f"{base_url}/api/v1/ml/predict-expenses", json=ml_data, headers=headers
            )
            print(f"ML Prediction Status: {ml_response.status_code}")
            if ml_response.status_code == 200:
                print("ML Prediction result:", ml_response.json())
            else:
                print("ML Prediction failed:", ml_response.text)
        else:
            print("Login failed:", login_response.text)

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    test_auth_flow()
