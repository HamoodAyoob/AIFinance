#!/usr/bin/env python3
"""
Test script to validate the ML prediction response format.
"""

from app.ml_models.predictor import predictor
from app.schemas.prediction import PredictionResponse
from datetime import date


def test_prediction_response():
    """Test that the predictor returns the correct response format."""

    # Mock a database session
    class MockDB:
        def query(self, model):
            return MockQuery()

    class MockQuery:
        def filter(self, *args):
            return self

        def all(self):
            # Return empty list to simulate insufficient data
            return []

    # Test with insufficient data
    result = predictor.predict_next_month(MockDB(), user_id=1, months_ahead=1)
    print("Raw predictor result:", result)

    # Try to validate with Pydantic
    try:
        response = PredictionResponse(**result)
        print("✓ Response validation passed:", response)
        return True
    except Exception as e:
        print("✗ Response validation failed:", e)
        return False


if __name__ == "__main__":
    test_prediction_response()
