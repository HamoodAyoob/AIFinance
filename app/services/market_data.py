"""
Market Data Service - Integration with external financial APIs.
Supports Alpha Vantage for stocks and CoinGecko for cryptocurrency.
"""

import httpx
from typing import Dict, Optional
from functools import lru_cache
from datetime import datetime, timedelta

from app.core.config import settings


class MarketDataService:
    """Service for fetching real-time market data."""
    
    def __init__(self):
        """Initialize the market data service."""
        self.alpha_vantage_base = "https://www.alphavantage.co/query"
        self.coingecko_base = "https://api.coingecko.com/api/v3"
        self.cache_duration = 300  # 5 minutes cache
        self._cache = {}
    
    async def get_stock_price(self, symbol: str) -> Dict[str, any]:
        """
        Get current stock price from Alpha Vantage.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL', 'GOOGL')
            
        Returns:
            Dictionary with stock data
        """
        cache_key = f"stock_{symbol}"
        
        # Check cache
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if datetime.now() - cached_time < timedelta(seconds=self.cache_duration):
                return cached_data
        
        # Check if API key is configured
        if not settings.ALPHA_VANTAGE_API_KEY:
            return {
                "symbol": symbol,
                "error": "Alpha Vantage API key not configured",
                "message": "Please add ALPHA_VANTAGE_API_KEY to your .env file"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol.upper(),
                    "apikey": settings.ALPHA_VANTAGE_API_KEY
                }
                
                response = await client.get(self.alpha_vantage_base, params=params)
                data = response.json()
                
                if "Global Quote" in data and data["Global Quote"]:
                    quote = data["Global Quote"]
                    result = {
                        "symbol": symbol.upper(),
                        "price": float(quote.get("05. price", 0)),
                        "change": float(quote.get("09. change", 0)),
                        "change_percent": quote.get("10. change percent", "0%"),
                        "volume": int(quote.get("06. volume", 0)),
                        "last_updated": quote.get("07. latest trading day"),
                        "source": "Alpha Vantage"
                    }
                    
                    # Cache the result
                    self._cache[cache_key] = (result, datetime.now())
                    return result
                else:
                    return {
                        "symbol": symbol,
                        "error": "Symbol not found or API limit reached",
                        "message": "Check if the symbol is correct or try again later"
                    }
        
        except Exception as e:
            return {
                "symbol": symbol,
                "error": f"Error fetching stock data: {str(e)}"
            }
    
    async def get_crypto_price(self, symbol: str) -> Dict[str, any]:
        """
        Get current cryptocurrency price from CoinGecko.
        
        Args:
            symbol: Crypto symbol (e.g., 'bitcoin', 'ethereum')
            
        Returns:
            Dictionary with crypto data
        """
        cache_key = f"crypto_{symbol}"
        
        # Check cache
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if datetime.now() - cached_time < timedelta(seconds=self.cache_duration):
                return cached_data
        
        try:
            # Map common symbols to CoinGecko IDs
            symbol_map = {
                "btc": "bitcoin",
                "eth": "ethereum",
                "usdt": "tether",
                "bnb": "binancecoin",
                "sol": "solana",
                "ada": "cardano",
                "xrp": "ripple",
                "doge": "dogecoin"
            }
            
            coin_id = symbol_map.get(symbol.lower(), symbol.lower())
            
            async with httpx.AsyncClient() as client:
                url = f"{self.coingecko_base}/simple/price"
                params = {
                    "ids": coin_id,
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_24hr_vol": "true",
                    "include_market_cap": "true"
                }
                
                response = await client.get(url, params=params)
                data = response.json()
                
                if coin_id in data:
                    coin_data = data[coin_id]
                    result = {
                        "symbol": symbol.upper(),
                        "name": coin_id.title(),
                        "price": coin_data.get("usd", 0),
                        "change_24h": coin_data.get("usd_24h_change", 0),
                        "volume_24h": coin_data.get("usd_24h_vol", 0),
                        "market_cap": coin_data.get("usd_market_cap", 0),
                        "last_updated": datetime.now().isoformat(),
                        "source": "CoinGecko"
                    }
                    
                    # Cache the result
                    self._cache[cache_key] = (result, datetime.now())
                    return result
                else:
                    return {
                        "symbol": symbol,
                        "error": "Cryptocurrency not found",
                        "message": "Check if the symbol is correct"
                    }
        
        except Exception as e:
            return {
                "symbol": symbol,
                "error": f"Error fetching crypto data: {str(e)}"
            }
    
    async def get_market_overview(self) -> Dict[str, any]:
        """
        Get overview of major market indices and cryptocurrencies.
        
        Returns:
            Dictionary with market overview data
        """
        try:
            # Get major stocks
            stocks = ["AAPL", "GOOGL", "MSFT"]
            stock_data = []
            
            for symbol in stocks:
                data = await self.get_stock_price(symbol)
                if "error" not in data:
                    stock_data.append(data)
            
            # Get major cryptos
            cryptos = ["bitcoin", "ethereum"]
            crypto_data = []
            
            for symbol in cryptos:
                data = await self.get_crypto_price(symbol)
                if "error" not in data:
                    crypto_data.append(data)
            
            return {
                "stocks": stock_data,
                "cryptocurrencies": crypto_data,
                "timestamp": datetime.now().isoformat()
            }
        
        except Exception as e:
            return {
                "error": f"Error fetching market overview: {str(e)}"
            }


# Global instance
market_service = MarketDataService()