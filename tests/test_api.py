#!/usr/bin/env python3
"""
Simple test to check if the API endpoint is working correctly.
"""

import requests
import json


def test_predict_expenses_api():
    """Test the predict expenses API endpoint."""

    url = "http://localhost:8000/api/v1/ml/predict-expenses"
    headers = {
        "Content-Type": "application/json",
    }
    data = {"months_ahead": 1}

    try:
        response = requests.post(url, json=data, headers=headers, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")

        if response.status_code == 200:
            print("API call successful!")
            return True
        else:
            print(f"API call failed with status {response.status_code}")
            return False

    except requests.exceptions.ConnectionError:
        print("Connection failed - server might not be running")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    test_predict_expenses_api()
