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
    """
    if not symbol or len(symbol) > 10:
        raise HTTPException(status_code=400, detail="Invalid stock symbol")
    
    try:
        result = await market_service.get_stock_price(symbol)
        
        if "error" in result:
            # Return fallback data instead of raising error
            return {
                "symbol": symbol.upper(),
                "price": 100.00,
                "change": 0.00,
                "change_percent": 0.00,
                "volume": 0,
                "last_updated": "N/A",
                "source": "fallback",
                "message": "Using fallback stock data"
            }
        
        return result
    except Exception as e:
        # Return fallback data on any error
        return {
            "symbol": symbol.upper(),
            "price": 100.00,
            "change": 0.00,
            "change_percent": 0.00,
            "volume": 0,
            "last_updated": "N/A",
            "source": "fallback",
            "message": f"Error fetching stock data: {str(e)}"
        }


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
    """
    if not symbol or len(symbol) > 20:
        raise HTTPException(status_code=400, detail="Invalid crypto symbol")
    
    try:
        result = await market_service.get_crypto_price(symbol)
        
        if "error" in result:
            # Return fallback data
            return {
                "symbol": symbol.upper(),
                "name": symbol.title(),
                "price": 1000.00,
                "change_24h": 0.00,
                "volume_24h": 0,
                "market_cap": 0,
                "last_updated": "N/A",
                "source": "fallback",
                "message": "Using fallback crypto data"
            }
        
        return result
    except Exception as e:
        # Return fallback data on any error
        return {
            "symbol": symbol.upper(),
            "name": symbol.title(),
            "price": 1000.00,
            "change_24h": 0.00,
            "volume_24h": 0,
            "market_cap": 0,
            "last_updated": "N/A",
            "source": "fallback",
            "message": f"Error fetching crypto data: {str(e)}"
        }


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
    """
    try:
        result = await market_service.get_market_overview()
        
        if "error" in result:
            # Return fallback data
            return {
                "stocks": [
                    {"symbol": "AAPL", "price": 182.63, "change": 1.24, "change_percent": 0.68, "name": "Apple Inc."},
                    {"symbol": "GOOGL", "price": 145.85, "change": -0.42, "change_percent": -0.29, "name": "Alphabet Inc."},
                    {"symbol": "MSFT", "price": 406.32, "change": 2.15, "change_percent": 0.53, "name": "Microsoft Corp."},
                ],
                "cryptocurrencies": [
                    {"symbol": "BTC", "price": 61423.50, "change_24h": 1250.25, "name": "Bitcoin"},
                    {"symbol": "ETH", "price": 3421.75, "change_24h": 45.30, "name": "Ethereum"},
                    {"symbol": "SOL", "price": 142.60, "change_24h": 8.45, "name": "Solana"},
                ],
                "timestamp": "2024-01-01T00:00:00Z",
                "source": "fallback",
                "message": "Using fallback market data"
            }
        
        return result
    except Exception as e:
        # Return fallback data on any error
        return {
            "stocks": [
                {"symbol": "AAPL", "price": 182.63, "change": 1.24, "change_percent": 0.68, "name": "Apple Inc."},
                {"symbol": "GOOGL", "price": 145.85, "change": -0.42, "change_percent": -0.29, "name": "Alphabet Inc."},
                {"symbol": "MSFT", "price": 406.32, "change": 2.15, "change_percent": 0.53, "name": "Microsoft Corp."},
            ],
            "cryptocurrencies": [
                {"symbol": "BTC", "price": 61423.50, "change_24h": 1250.25, "name": "Bitcoin"},
                {"symbol": "ETH", "price": 3421.75, "change_24h": 45.30, "name": "Ethereum"},
                {"symbol": "SOL", "price": 142.60, "change_24h": 8.45, "name": "Solana"},
            ],
            "timestamp": "2024-01-01T00:00:00Z",
            "source": "fallback",
            "message": f"Error fetching market data: {str(e)}"
        }