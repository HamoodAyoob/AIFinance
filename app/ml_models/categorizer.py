"""
Expense Categorization Model using NLP.
This model uses TF-IDF and Naive Bayes to categorize expenses.
"""

import os
import pickle
from typing import Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

from app.ml_models.training_data import TRAINING_DATA, CATEGORIES
from app.core.config import settings


class ExpenseCategorizer:
    """
    Expense categorization model using TF-IDF and Naive Bayes.
    """
    
    def __init__(self):
        """Initialize the categorizer."""
        self.model = None
        self.vectorizer = None
        self.pipeline = None
        self.model_path = os.path.join(settings.MODEL_PATH, settings.CATEGORIZER_MODEL)
        self.vectorizer_path = os.path.join(settings.MODEL_PATH, settings.VECTORIZER_MODEL)
    
    def train(self, training_data=None):
        """
        Train the categorization model.
        
        Args:
            training_data: List of tuples (description, category)
                          If None, uses default training data
        """
        if training_data is None:
            training_data = TRAINING_DATA
        
        # Separate descriptions and labels
        descriptions = [item[0] for item in training_data]
        labels = [item[1] for item in training_data]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            descriptions, labels, test_size=0.2, random_state=42
        )
        
        # Create pipeline with TF-IDF and Naive Bayes
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(
                lowercase=True,
                max_features=1000,
                ngram_range=(1, 2),  # Unigrams and bigrams
                stop_words='english'
            )),
            ('clf', MultinomialNB(alpha=0.1))
        ])
        
        # Train model
        self.pipeline.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.pipeline.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"✅ Model trained with accuracy: {accuracy:.2%}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        return accuracy
    
    def predict(self, description: str) -> Tuple[str, float]:
        """
        Predict category for a transaction description.
        
        Args:
            description: Transaction description
            
        Returns:
            Tuple of (predicted_category, confidence)
        """
        if self.pipeline is None:
            self.load_model()
        
        if self.pipeline is None:
            # If model still not loaded, train it
            print("⚠️ Model not found. Training new model...")
            self.train()
            self.save_model()
        
        # Predict
        prediction = self.pipeline.predict([description])[0]
        
        # Get confidence (probability)
        probabilities = self.pipeline.predict_proba([description])[0]
        confidence = max(probabilities)
        
        return prediction, confidence
    
    def predict_batch(self, descriptions: list) -> list:
        """
        Predict categories for multiple descriptions.
        
        Args:
            descriptions: List of transaction descriptions
            
        Returns:
            List of tuples (predicted_category, confidence)
        """
        if self.pipeline is None:
            self.load_model()
        
        predictions = self.pipeline.predict(descriptions)
        probabilities = self.pipeline.predict_proba(descriptions)
        confidences = [max(prob) for prob in probabilities]
        
        return list(zip(predictions, confidences))
    
    def save_model(self):
        """Save the trained model to disk."""
        if self.pipeline is None:
            raise ValueError("No model to save. Train the model first.")
        
        # Create directory if it doesn't exist
        os.makedirs(settings.MODEL_PATH, exist_ok=True)
        
        # Save the entire pipeline
        with open(self.model_path, 'wb') as f:
            pickle.dump(self.pipeline, f)
        
        print(f"✅ Model saved to {self.model_path}")
    
    def load_model(self):
        """Load the trained model from disk."""
        if os.path.exists(self.model_path):
            with open(self.model_path, 'rb') as f:
                self.pipeline = pickle.load(f)
            print(f"✅ Model loaded from {self.model_path}")
            return True
        else:
            print(f"⚠️ Model file not found at {self.model_path}")
            return False
    
    def get_categories(self):
        """Get list of all possible categories."""
        return CATEGORIES


# Global instance
categorizer = ExpenseCategorizer()


# Initialize model on module import
def initialize_model():
    """Initialize the categorization model."""
    if not categorizer.load_model():
        print("📚 Training new categorization model...")
        categorizer.train()
        categorizer.save_model()


# Train model on first import if not exists
if __name__ != "__main__":
    try:
        initialize_model()
    except Exception as e:
        print(f"⚠️ Error initializing model: {e}")
        print("Model will be trained on first prediction request")