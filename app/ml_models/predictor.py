"""
Expense Prediction Model using historical data.
Predicts future expenses based on past spending patterns.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.ml_models.training_data import CATEGORIES


class ExpensePredictor:
    """
    Predicts future expenses based on historical transaction data.
    Uses statistical methods and moving averages.
    """

    def __init__(self):
        """Initialize the predictor."""
        self.min_transactions = 5  # Minimum transactions needed for prediction

    def predict_next_month(
        self, db: Session, user_id: int, months_ahead: int = 1
    ) -> Dict[str, any]:
        """
        Predict expenses for the next N months.

        Args:
            db: Database session
            user_id: User ID
            months_ahead: Number of months to predict

        Returns:
            Dictionary with predictions by category
        """
        # Get historical transactions (last 6 months)
        six_months_ago = datetime.now() - timedelta(days=180)

        transactions = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "expense",
                Transaction.transaction_date >= six_months_ago.date(),
            )
            .all()
        )

        if len(transactions) < self.min_transactions:
            prediction_date = datetime.now().date() + relativedelta(months=months_ahead)
            return {
                "predictions": [],
                "total_predicted": 0.0,
                "confidence": "low",
                "message": f"Need at least {self.min_transactions} transactions for predictions",
                "prediction_date": prediction_date,
            }

        # Convert to DataFrame
        df = pd.DataFrame(
            [
                {"amount": t.amount, "category": t.category, "date": t.transaction_date}
                for t in transactions
            ]
        )

        # Calculate predictions for each category
        predictions = {}
        category_stats = {}

        for category in df["category"].unique():
            category_data = df[df["category"] == category]

            # Calculate statistics
            avg_amount = category_data["amount"].mean()
            std_amount = category_data["amount"].std()
            count = len(category_data)

            # Calculate trend
            monthly_amounts = category_data.groupby(
                pd.to_datetime(category_data["date"]).dt.to_period("M")
            )["amount"].sum()

            if len(monthly_amounts) > 1:
                # Simple linear trend
                trend = (monthly_amounts.iloc[-1] - monthly_amounts.iloc[0]) / len(
                    monthly_amounts
                )
            else:
                trend = 0

            # Predict with trend adjustment
            predicted_amount = avg_amount + (trend * months_ahead)
            predicted_amount = max(0, predicted_amount)  # No negative predictions

            predictions[category] = round(predicted_amount, 2)

            category_stats[category] = {
                "average": round(avg_amount, 2),
                "std": round(std_amount, 2) if not pd.isna(std_amount) else 0,
                "count": count,
                "trend": "increasing"
                if trend > 0
                else "decreasing"
                if trend < 0
                else "stable",
            }

        # Calculate total
        total_predicted = sum(predictions.values())

        # Determine confidence based on data quality
        total_transactions = len(transactions)
        if total_transactions >= 50:
            confidence = "high"
        elif total_transactions >= 20:
            confidence = "medium"
        else:
            confidence = "low"

        # Calculate prediction date
        prediction_date = datetime.now().date() + relativedelta(months=months_ahead)

        return {
            "predictions": [
                predictions
            ],  # Convert to list of dicts as expected by schema
            "total_predicted": round(total_predicted, 2),
            "confidence": confidence,
            "prediction_date": prediction_date,
            "stats": category_stats,
            "data_points": total_transactions,
        }

    def get_spending_trends(
        self, db: Session, user_id: int, months: int = 6
    ) -> List[Dict]:
        """
        Analyze spending trends over time.

        Args:
            db: Database session
            user_id: User ID
            months: Number of months to analyze

        Returns:
            List of trend data by category
        """
        # Get transactions
        start_date = datetime.now() - timedelta(days=months * 30)

        transactions = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "expense",
                Transaction.transaction_date >= start_date.date(),
            )
            .all()
        )

        if not transactions:
            return []

        # Convert to DataFrame
        df = pd.DataFrame(
            [
                {"amount": t.amount, "category": t.category, "date": t.transaction_date}
                for t in transactions
            ]
        )

        df["month"] = pd.to_datetime(df["date"]).dt.to_period("M")

        # Analyze trends
        trends = []

        for category in df["category"].unique():
            category_data = df[df["category"] == category]

            # Group by month
            monthly = category_data.groupby("month")["amount"].sum()

            if len(monthly) >= 2:
                # Calculate percentage change
                first_month = monthly.iloc[0]
                last_month = monthly.iloc[-1]
                avg_monthly = monthly.mean()

                if first_month > 0:
                    percentage_change = ((last_month - first_month) / first_month) * 100
                else:
                    percentage_change = 0

                trend_direction = (
                    "increasing"
                    if percentage_change > 10
                    else "decreasing"
                    if percentage_change < -10
                    else "stable"
                )

                trends.append(
                    {
                        "category": category,
                        "monthly_average": round(avg_monthly, 2),
                        "trend": trend_direction,
                        "percentage_change": round(percentage_change, 2),
                        "last_month_amount": round(last_month, 2),
                    }
                )

        return trends

    def predict_category_for_month(
        self, db: Session, user_id: int, category: str, target_month: datetime
    ) -> Dict[str, any]:
        """
        Predict expenses for a specific category and month.

        Args:
            db: Database session
            user_id: User ID
            category: Category to predict
            target_month: Target month for prediction

        Returns:
            Prediction details for the category
        """
        # Get historical data for this category
        one_year_ago = datetime.now() - timedelta(days=365)

        transactions = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == user_id,
                Transaction.transaction_type == "expense",
                Transaction.category == category,
                Transaction.transaction_date >= one_year_ago.date(),
            )
            .all()
        )

        if len(transactions) < 3:
            return {
                "category": category,
                "predicted_amount": 0.0,
                "confidence": 0.0,
                "message": "Insufficient data for this category",
            }

        # Calculate average
        amounts = [t.amount for t in transactions]
        avg_amount = np.mean(amounts)
        std_amount = np.std(amounts)

        # Confidence based on consistency
        if std_amount > 0:
            coefficient_of_variation = std_amount / avg_amount
            confidence = max(0, 1 - coefficient_of_variation)
        else:
            confidence = 1.0

        return {
            "category": category,
            "predicted_amount": round(avg_amount, 2),
            "confidence": round(confidence, 2),
            "historical_average": round(avg_amount, 2),
            "std_deviation": round(std_amount, 2),
            "transaction_count": len(transactions),
        }


# Global instance
predictor = ExpensePredictor()
