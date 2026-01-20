from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any

from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.market_data import market_service

router = APIRouter()


@router.get("/stocks/{symbol}")
async def get_stock(
    symbol: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get current stock price and information.
    
    Args:
        symbol: Stock symbol (e.g., AAPL, GOOGL, MSFT)
        current_user: Current authenticated user
        
    Returns:
        Stock price and details
        
    Example:
        GET /api/v1/market/stocks/AAPL
        
        Response:
        {
            "symbol": "AAPL",
            "price": 150.25,
            "change": 2.50,
            "change_percent": "+1.69%",
            "volume": 75000000,
            "last_updated": "2026-01-20"
        }
    """
    if not symbol or len(symbol) > 10:
        raise HTTPException(status_code=400, detail="Invalid stock symbol")
    
    result = await market_service.get_stock_price(symbol)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.get("/crypto/{symbol}")
async def get_crypto(
    symbol: str,
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get current cryptocurrency price and information.
    
    Args:
        symbol: Crypto symbol (e.g., bitcoin, ethereum, btc, eth)
        current_user: Current authenticated user
        
    Returns:
        Cryptocurrency price and details
        
    Example:
        GET /api/v1/market/crypto/bitcoin
        
        Response:
        {
            "symbol": "BTC",
            "name": "Bitcoin",
            "price": 42000.50,
            "change_24h": 3.5,
            "volume_24h": 28000000000,
            "market_cap": 820000000000
        }
    """
    if not symbol or len(symbol) > 20:
        raise HTTPException(status_code=400, detail="Invalid crypto symbol")
    
    result = await market_service.get_crypto_price(symbol)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return result


@router.get("/overview")
async def get_market_overview(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get overview of major market indices and cryptocurrencies.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Market overview with stocks and crypto data
        
    Example:
        GET /api/v1/market/overview
        
        Response:
        {
            "stocks": [...],
            "cryptocurrencies": [...],
            "timestamp": "2026-01-20T12:00:00"
        }
    """
    result = await market_service.get_market_overview()
    
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])
    
    return result