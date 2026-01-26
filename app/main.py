"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import time
import logging
import json

# Fix: Import settings from the correct location
try:
    # Try importing from app.core.config (common structure)
    from app.core.config import settings
except ImportError:
    try:
        # Try importing from core.config (if config is in root)
        from core.config import settings
    except ImportError:
        # Fall back to relative import
        from .core.config import settings

# Try to import database and other modules
try:
    from app.core.database import init_db
    from app.api.v1 import auth, users, ml, market, accounts, transactions, budgets, currency
    # Import models to register them with SQLAlchemy
    from app.models import user, prediction, account, transaction, budget
except ImportError as e:
    # Log import errors but continue for now
    print(f"Warning: Could not import some modules: {e}")
    # Create dummy routers for now
    class DummyRouter:
        router = None
    auth = users = ml = market = accounts = transactions = budgets = currency = DummyRouter()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events for the application.
    Runs on startup and shutdown.
    """
    # Startup
    logger.info("🚀 Starting AI Finance Manager API...")
    logger.info(f"📋 Project: {settings.PROJECT_NAME}")
    logger.info(f"📌 Version: {settings.VERSION}")
    
    # Initialize database
    try:
        if 'init_db' in locals():
            init_db()
            logger.info("✅ Database initialized")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
    
    # Initialize ML models
    try:
        from app.ml_models.categorizer import initialize_model
        initialize_model()
        logger.info("✅ ML models initialized")
    except ImportError as e:
        logger.warning(f"⚠️ ML model module not found: {e}")
    except Exception as e:
        logger.warning(f"⚠️ ML model initialization warning: {e}")
    
    logger.info("✅ Application startup complete!")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down application...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Personal Finance Management Platform",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Configure CORS
origins = settings.BACKEND_CORS_ORIGINS

# Handle different origin formats
if isinstance(origins, str):
    try:
        # If it's a string, try to parse it as JSON
        origins = json.loads(origins)
    except json.JSONDecodeError:
        # If not valid JSON, split by comma
        origins = [origin.strip() for origin in origins.split(',')]

# Ensure we have a list
if not isinstance(origins, list):
    origins = []

# Add default origins if empty or not a list
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite dev server
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Combine with defaults if origins is empty
if not origins:
    origins = default_origins
else:
    # Add any missing defaults
    for default in default_origins:
        if default not in origins:
            origins.append(default)

logger.info(f"CORS allowed origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "X-Requested-With",
        "Access-Control-Allow-Origin",
    ],
    expose_headers=["*"],
    max_age=600,
)

# Add trusted host middleware for security
# Fix: Check if ALLOWED_HOSTS exists
if hasattr(settings, 'ALLOWED_HOSTS'):
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )
else:
    logger.warning("⚠️ ALLOWED_HOSTS not found in settings. Skipping TrustedHostMiddleware.")
    # Set default allowed hosts
    settings.ALLOWED_HOSTS = ["*"]

# Middleware to log requests and response times
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    
    # Log slow requests
    if process_time > 1000:  # More than 1 second
        logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}ms")
    
    return response


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
        "version": settings.VERSION,
        "timestamp": time.time()
    }


# Include API routers (only if they exist)
if hasattr(auth, 'router') and auth.router:
    app.include_router(
        auth.router,
        prefix=f"{settings.API_V1_STR}/auth",
        tags=["Authentication"]
    )

if hasattr(users, 'router') and users.router:
    app.include_router(
        users.router,
        prefix=f"{settings.API_V1_STR}/users",
        tags=["Users"]
    )

if hasattr(ml, 'router') and ml.router:
    app.include_router(
        ml.router,
        prefix=f"{settings.API_V1_STR}/ml",
        tags=["Machine Learning"]
    )

if hasattr(market, 'router') and market.router:
    app.include_router(
        market.router,
        prefix=f"{settings.API_V1_STR}/market",
        tags=["Market Data"]
    )

# Person B's routers
if hasattr(accounts, 'router') and accounts.router:
    app.include_router(
        accounts.router,
        prefix=f"{settings.API_V1_STR}/accounts",
        tags=["Accounts"]
    )

if hasattr(transactions, 'router') and transactions.router:
    app.include_router(
        transactions.router,
        prefix=f"{settings.API_V1_STR}/transactions",
        tags=["Transactions"]
    )

if hasattr(budgets, 'router') and budgets.router:
    app.include_router(
        budgets.router,
        prefix=f"{settings.API_V1_STR}/budgets",
        tags=["Budgets"]
    )

if hasattr(currency, 'router') and currency.router:
    app.include_router(
        currency.router,
        prefix=f"{settings.API_V1_STR}/currency",
        tags=["Currency"]
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )