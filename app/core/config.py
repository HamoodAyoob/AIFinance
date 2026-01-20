from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
import secrets


class Settings(BaseSettings):
    """
    Application settings and configuration.
    All settings can be overridden by environment variables.
    """
    
    # Application
    PROJECT_NAME: str = "AI Finance Manager"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/finance_db"
    
    # Security
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
    ]

    # Logging
    LOG_LEVEL: str = Field(default="INFO")
    
    # External APIs
    ALPHA_VANTAGE_API_KEY: str = ""
    EXCHANGE_RATE_API_KEY: str = ""
    COINGECKO_API_KEY: str = ""
    
    # ML Models
    MODEL_PATH: str = "app/ml_models/saved_models"
    CATEGORIZER_MODEL: str = "categorizer.pkl"
    VECTORIZER_MODEL: str = "vectorizer.pkl"
    
    # Rate Limiting
    API_RATE_LIMIT: int = 100
    API_RATE_LIMIT_PERIOD: int = 60
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()