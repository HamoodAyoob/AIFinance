from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Date,
    Text,
    Index,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Transaction(Base):
    """Transaction model for income and expenses."""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String, nullable=False)  # "income" or "expense"
    category = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    transaction_date = Column(Date, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Composite indexes for common query patterns
    __table_args__ = (
        Index("idx_user_transaction_date", "user_id", "transaction_date"),
        Index("idx_user_category_date", "user_id", "category", "transaction_date"),
    )

    # ML-related fields
    auto_categorized = Column(Integer, default=0)  # 0=manual, 1=auto
    category_confidence = Column(Float, nullable=True)

    # Relationships
    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction(id={self.id}, amount={self.amount}, category={self.category})>"
