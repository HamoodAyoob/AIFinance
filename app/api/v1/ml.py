from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.ml_models.categorizer import categorizer
from app.ml_models.predictor import predictor
from app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    CategoryPrediction,
    SpendingTrend
)

router = APIRouter()


@router.post("/categorize")
def categorize_expense(
    description: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Categorize an expense based on its description using ML.
    
    Args:
        description: Transaction description
        current_user: Current authenticated user
        
    Returns:
        Predicted category and confidence score
        
    Example:
        POST /api/v1/ml/categorize?description=Coffee at Starbucks
        
        Response:
        {
            "category": "Food",
            "confidence": 0.87,
            "description": "Coffee at Starbucks"
        }
    """
    if not description or len(description.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description cannot be empty"
        )
    
    try:
        category, confidence = categorizer.predict(description)
        
        return {
            "category": category,
            "confidence": round(confidence, 3),
            "description": description
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error categorizing expense: {str(e)}"
        )


@router.post("/categorize-batch")
def categorize_batch(
    descriptions: List[str],
    current_user: User = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    Categorize multiple expenses at once.
    
    Args:
        descriptions: List of transaction descriptions
        current_user: Current authenticated user
        
    Returns:
        List of predictions with categories and confidence scores
    """
    if not descriptions or len(descriptions) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Descriptions list cannot be empty"
        )
    
    if len(descriptions) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 100 descriptions allowed per request"
        )
    
    try:
        predictions = categorizer.predict_batch(descriptions)
        
        results = []
        for desc, (category, confidence) in zip(descriptions, predictions):
            results.append({
                "description": desc,
                "category": category,
                "confidence": round(confidence, 3)
            })
        
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in batch categorization: {str(e)}"
        )


@router.get("/categories")
def get_categories(current_user: User = Depends(get_current_active_user)) -> List[str]:
    """
    Get list of all available expense categories.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        List of category names
    """
    return categorizer.get_categories()


@router.post("/predict-expenses", response_model=PredictionResponse)
def predict_expenses(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Predict future expenses based on historical data.
    
    Args:
        request: Prediction request with months_ahead parameter
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        Predictions by category and total
        
    Example:
        POST /api/v1/ml/predict-expenses
        {
            "months_ahead": 1
        }
        
        Response:
        {
            "predictions": {
                "Food": 450.50,
                "Transport": 200.00,
                "Entertainment": 100.00
            },
            "total": 750.50,
            "confidence": "medium",
            "prediction_date": "2026-02-20"
        }
    """
    try:
        result = predictor.predict_next_month(
            db=db,
            user_id=current_user.id,
            months_ahead=request.months_ahead
        )
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error predicting expenses: {str(e)}"
        )


@router.get("/spending-trends", response_model=List[SpendingTrend])
def get_spending_trends(
    months: int = 6,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get spending trends and patterns over time.
    
    Args:
        months: Number of months to analyze (default: 6)
        db: Database session
        current_user: Current authenticated user
        
    Returns:
        List of spending trends by category
        
    Example:
        GET /api/v1/ml/spending-trends?months=6
        
        Response:
        [
            {
                "category": "Food",
                "monthly_average": 425.50,
                "trend": "increasing",
                "percentage_change": 15.5,
                "last_month_amount": 480.00
            }
        ]
    """
    if months < 1 or months > 24:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Months parameter must be between 1 and 24"
        )
    
    try:
        trends = predictor.get_spending_trends(
            db=db,
            user_id=current_user.id,
            months=months
        )
        
        return trends
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing trends: {str(e)}"
        )


@router.get("/model-info")
def get_model_info(current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    """
    Get information about the ML models.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Model information and statistics
    """
    return {
        "categorizer": {
            "type": "TF-IDF + Naive Bayes",
            "categories": categorizer.get_categories(),
            "status": "loaded" if categorizer.pipeline is not None else "not loaded"
        },
        "predictor": {
            "type": "Statistical Prediction",
            "min_transactions": predictor.min_transactions,
            "status": "active"
        }
    }