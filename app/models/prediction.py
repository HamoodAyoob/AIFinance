from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Prediction(Base):
    """
    Prediction model for storing ML-generated expense predictions.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User
        category: Expense category
        predicted_amount: Predicted expense amount
        confidence: Model confidence score (0-1)
        month: Month for which prediction is made
        year: Year for which prediction is made
        created_at: When prediction was generated
    """
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False, index=True)
    predicted_amount = Column(Float, nullable=False)
    confidence = Column(Float, nullable=True)  # 0.0 to 1.0
    prediction_date = Column(Date, nullable=False)  # Date for which prediction is made
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="predictions")
    
    def __repr__(self):
        return f"<Prediction(id={self.id}, category={self.category}, amount={self.predicted_amount})>"