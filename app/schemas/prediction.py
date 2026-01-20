from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import date, datetime


# Base Prediction Schema
class PredictionBase(BaseModel):
    """Base prediction schema."""
    category: str
    predicted_amount: float
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    prediction_date: date


# Schema for creating prediction
class PredictionCreate(PredictionBase):
    """Schema for creating a prediction."""
    user_id: int


# Schema for prediction in database
class Prediction(PredictionBase):
    """Complete prediction schema."""
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Schema for prediction request
class PredictionRequest(BaseModel):
    """Schema for requesting predictions."""
    months_ahead: int = Field(1, ge=1, le=12, description="Number of months to predict")
    categories: Optional[List[str]] = Field(None, description="Specific categories to predict")


# Schema for prediction response
class PredictionResponse(BaseModel):
    """Schema for prediction API response."""
    predictions: List[Dict[str, float]]  # [{"Food": 450.50, "Transport": 200.00}]
    total_predicted: float
    prediction_date: date
    confidence: str  # "high", "medium", "low"
    message: Optional[str] = None


# Schema for category prediction
class CategoryPrediction(BaseModel):
    """Schema for single category prediction."""
    category: str
    predicted_amount: float
    confidence: float
    historical_average: float
    trend: str  # "increasing", "stable", "decreasing"


# Schema for spending trends
class SpendingTrend(BaseModel):
    """Schema for spending trend analysis."""
    category: str
    monthly_average: float
    trend: str
    percentage_change: float
    last_month_amount: float