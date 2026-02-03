#!/usr/bin/env python3
"""
Test script to validate the ML prediction response format.
"""


def test_response_format():
    """Test the expected response format."""
    from datetime import date
    from app.schemas.prediction import PredictionResponse

    # Test case 1: Insufficient data response
    insufficient_data_response = {
        "predictions": [],
        "total_predicted": 0.0,
        "confidence": "low",
        "message": "Need at least 5 transactions for predictions",
        "prediction_date": date(2026, 2, 26),
    }

    # Test case 2: Normal prediction response
    normal_response = {
        "predictions": [{"Food": 450.50, "Transport": 200.00}],
        "total_predicted": 650.50,
        "confidence": "medium",
        "prediction_date": date(2026, 2, 26),
    }

    try:
        response1 = PredictionResponse(**insufficient_data_response)
        print("PASS: Insufficient data validation passed")
    except Exception as e:
        print("FAIL: Insufficient data validation failed:", e)
        return False

    try:
        response2 = PredictionResponse(**normal_response)
        print("PASS: Normal prediction validation passed")
    except Exception as e:
        print("FAIL: Normal prediction validation failed:", e)
        return False

    print("All response format tests passed!")
    return True


if __name__ == "__main__":
    test_response_format()
