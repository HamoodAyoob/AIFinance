from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
from datetime import date

from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.currency import currency_service

router = APIRouter()


@router.get("/rates")
async def get_exchange_rates(
    base: str = Query("USD", description="Base currency code (e.g., USD, EUR, GBP)"),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get current exchange rates for a base currency.
    
    Uses Frankfurter API (European Central Bank data).
    100% FREE - No API key needed!
    
    Example:
        GET /api/v1/currency/rates?base=USD
        
    Response:
        {
            "base": "USD",
            "date": "2026-01-20",
            "rates": {
                "EUR": 0.92,
                "GBP": 0.79,
                "JPY": 149.50,
                ...
            },
            "source": "Frankfurter API (European Central Bank)"
        }
    """
    result = await currency_service.get_exchange_rates(base)
    
    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Error fetching rates")
        )
    
    return result


@router.get("/convert")
async def convert_currency(
    amount: float = Query(..., gt=0, description="Amount to convert"),
    from_currency: str = Query(..., alias="from", description="Source currency (e.g., USD)"),
    to_currency: str = Query(..., alias="to", description="Target currency (e.g., EUR)"),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Convert amount from one currency to another.
    
    Example:
        GET /api/v1/currency/convert?amount=100&from=USD&to=EUR
        
    Response:
        {
            "amount": 100,
            "from": "USD",
            "to": "EUR",
            "rate": 0.92,
            "result": 92.0,
            "date": "2026-01-20"
        }
    """
    result = await currency_service.convert_currency(amount, from_currency, to_currency)
    
    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Error converting currency")
        )
    
    return result


@router.get("/convert-multiple")
async def convert_multiple_currencies(
    amount: float = Query(..., gt=0, description="Amount to convert"),
    from_currency: str = Query(..., alias="from", description="Source currency"),
    to_currencies: str = Query(..., alias="to", description="Target currencies (comma-separated, e.g., EUR,GBP,JPY)"),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Convert amount to multiple currencies at once.
    
    Example:
        GET /api/v1/currency/convert-multiple?amount=100&from=USD&to=EUR,GBP,JPY
        
    Response:
        {
            "amount": 100,
            "from": "USD",
            "conversions": {
                "EUR": {"amount": 92.0, "rate": 0.92},
                "GBP": {"amount": 79.0, "rate": 0.79},
                "JPY": {"amount": 14950.0, "rate": 149.50}
            },
            "date": "2026-01-20"
        }
    """
    # Parse comma-separated currencies
    currencies_list = [c.strip() for c in to_currencies.split(",")]
    
    if len(currencies_list) > 10:
        raise HTTPException(
            status_code=400,
            detail="Maximum 10 currencies allowed per request"
        )
    
    result = await currency_service.convert_multiple(amount, from_currency, currencies_list)
    
    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Error converting currencies")
        )
    
    return result


@router.get("/historical/{date}")
async def get_historical_rates(
    date: str,
    base: str = Query("USD", description="Base currency code"),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get historical exchange rates for a specific date.
    
    Example:
        GET /api/v1/currency/historical/2025-12-31?base=USD
        
    Response:
        {
            "base": "USD",
            "date": "2025-12-31",
            "rates": {
                "EUR": 0.91,
                "GBP": 0.78,
                ...
            }
        }
    """
    result = await currency_service.get_historical_rates(date, base)
    
    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail=result.get("message", "Error fetching historical rates")
        )
    
    return result


@router.get("/currencies")
async def get_supported_currencies(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get list of all supported currencies.
    
    Example:
        GET /api/v1/currency/currencies
        
    Response:
        {
            "currencies": {
                "USD": "United States Dollar",
                "EUR": "Euro",
                "GBP": "British Pound Sterling",
                ...
            },
            "count": 30,
            "source": "Frankfurter API"
        }
    """
    result = await currency_service.get_supported_currencies()
    
    if "error" in result:
        raise HTTPException(
            status_code=500,
            detail="Error fetching currencies"
        )
    
    return result


@router.get("/popular")
async def get_popular_currencies(
    base: str = Query("USD", description="Base currency"),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get exchange rates for popular currencies only.
    
    Returns rates for: EUR, GBP, JPY, CNY, CAD, AUD, INR
    
    Example:
        GET /api/v1/currency/popular?base=USD
    """
    popular_currencies = ["EUR", "GBP", "JPY", "CNY", "CAD", "AUD", "INR"]
    
    result = await currency_service.convert_multiple(1, base, popular_currencies)
    
    if "error" in result:
        raise HTTPException(
            status_code=400,
            detail="Error fetching popular currencies"
        )
    
    # Format for easier display
    formatted = {
        "base": base,
        "date": result.get("date"),
        "rates": {}
    }
    
    for currency, data in result.get("conversions", {}).items():
        formatted["rates"][currency] = data["rate"]
    
    return formatted