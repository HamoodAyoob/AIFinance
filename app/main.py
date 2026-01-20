"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.v1 import auth, users, ml, market, accounts, transactions, budgets

# Import models to register them with SQLAlchemy
from app.models import user, prediction, account, transaction, budget


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for the application.
    Runs on startup and shutdown.
    """
    # Startup
    print("🚀 Starting AI Finance Manager API...")
    print(f"📋 Project: {settings.PROJECT_NAME}")
    print(f"📌 Version: {settings.VERSION}")
    
    # Initialize database
    init_db()
    
    # Initialize ML models
    try:
        from app.ml_models.categorizer import initialize_model
        initialize_model()
    except Exception as e:
        print(f"⚠️ ML model initialization warning: {e}")
    
    print("✅ Application startup complete!")
    
    yield
    
    # Shutdown
    print("👋 Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Personal Finance Management Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root endpoint
@app.get("/")
def root():
    """
    Root endpoint - API information.
    """
    return {
        "message": "AI Finance Manager API",
        "version": settings.VERSION,
        "status": "running",
        "docs": "/docs",
        "redoc": "/redoc"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "healthy",
        "version": settings.VERSION
    }


# Include API routers
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["Authentication"]
)

app.include_router(
    users.router,
    prefix=f"{settings.API_V1_STR}/users",
    tags=["Users"]
)

app.include_router(
    ml.router,
    prefix=f"{settings.API_V1_STR}/ml",
    tags=["Machine Learning"]
)

app.include_router(
    market.router,
    prefix=f"{settings.API_V1_STR}/market",
    tags=["Market Data"]
)


# Person B's routers
app.include_router(
    accounts.router,
    prefix=f"{settings.API_V1_STR}/accounts",
    tags=["Accounts"]
)

app.include_router(
    transactions.router,
    prefix=f"{settings.API_V1_STR}/transactions",
    tags=["Transactions"]
)

app.include_router(
    budgets.router,
    prefix=f"{settings.API_V1_STR}/budgets",
    tags=["Budgets"]
)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )