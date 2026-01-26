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
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
               "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",  # Vite default
        "http://localhost:5174",  # Vite alternate
        "http://localhost:3001",  # Alternate port
    ]
    
    # Allowed Hosts (Added this)
    ALLOWED_HOSTS: List[str] = [
        "localhost",
        "0.0.0.0",
        "127.0.0.1",
         "localhost:3000",
        "localhost:8000",
        "127.0.0.1:3000",
        "127.0.0.1:8000",
        "0.0.0.0:8000",
        "0.0.0.0:3000",
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