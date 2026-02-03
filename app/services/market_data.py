"""
Market Data Service - Integration with external financial APIs.
Supports Alpha Vantage for stocks and CoinGecko for cryptocurrency.
"""

import httpx
import asyncio
from typing import Dict, Optional, Any
from functools import lru_cache
from datetime import datetime, timedelta
import json

from app.core.config import settings


class MarketDataService:
    """Service for fetching real-time market data."""

    def __init__(self):
        """Initialize the market data service."""
        self.alpha_vantage_base = "https://www.alphavantage.co/query"
        self.coingecko_base = "https://api.coingecko.com/api/v3"
        self.cache_duration = 300  # 5 minutes cache
        self._cache = {}
        # Enhanced caching with longer duration for overview (15 minutes)
        self.overview_cache_duration = 900  # 15 minutes

    async def get_stock_price(self, symbol: str) -> Dict[str, Any]:
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
                "message": "Please add ALPHA_VANTAGE_API_KEY to your .env file",
            }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                params = {
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol.upper(),
                    "apikey": settings.ALPHA_VANTAGE_API_KEY,
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
                        "source": "Alpha Vantage",
                    }

                    # Cache the result
                    self._cache[cache_key] = (result, datetime.now())
                    return result
                else:
                    return {
                        "symbol": symbol,
                        "error": "Symbol not found or API limit reached",
                        "message": "Check if the symbol is correct or try again later",
                    }

        except Exception as e:
            return {"symbol": symbol, "error": f"Error fetching stock data: {str(e)}"}

    async def get_crypto_price(self, symbol: str) -> Dict[str, Any]:
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
                "doge": "dogecoin",
            }

            coin_id = symbol_map.get(symbol.lower(), symbol.lower())

            async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.coingecko_base}/simple/price"
                params = {
                    "ids": coin_id,
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                    "include_24hr_vol": "true",
                    "include_market_cap": "true",
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
                        "source": "CoinGecko",
                    }

                    # Cache the result
                    self._cache[cache_key] = (result, datetime.now())
                    return result
                else:
                    return {
                        "symbol": symbol,
                        "error": "Cryptocurrency not found",
                        "message": "Check if the symbol is correct",
                    }

        except Exception as e:
            return {"symbol": symbol, "error": f"Error fetching crypto data: {str(e)}"}

    async def get_market_overview(self) -> Dict[str, Any]:
        """
        Get overview of major market indices and cryptocurrencies.
        Uses parallel requests for faster response.

        Returns:
            Dictionary with market overview data
        """
        cache_key = "market_overview"

        # Check enhanced cache first (15 minutes for overview)
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if datetime.now() - cached_time < timedelta(
                seconds=self.overview_cache_duration
            ):
                return cached_data

        try:
            # Get major stocks and cryptos in parallel
            stocks = ["AAPL", "GOOGL", "MSFT"]
            cryptos = ["bitcoin", "ethereum"]

            # Create tasks for parallel execution
            stock_tasks = [self.get_stock_price(symbol) for symbol in stocks]
            crypto_tasks = [self.get_crypto_price(symbol) for symbol in cryptos]

            # Execute all requests in parallel with shorter timeout
            try:
                stock_results = await asyncio.wait_for(
                    asyncio.gather(*stock_tasks, return_exceptions=True),
                    timeout=3.0,  # 3 second timeout for all stock requests
                )
                crypto_results = await asyncio.wait_for(
                    asyncio.gather(*crypto_tasks, return_exceptions=True),
                    timeout=3.0,  # 3 second timeout for all crypto requests
                )
            except asyncio.TimeoutError:
                # If timeout, use fallback data
                return {
                    "stocks": self._get_fallback_stocks(),
                    "cryptocurrencies": self._get_fallback_cryptos(),
                    "timestamp": datetime.now().isoformat(),
                    "message": "Using fallback data - API timeout",
                }

            # Filter out errors and exceptions
            stock_data = [
                s
                for s in stock_results
                if s and isinstance(s, dict) and "error" not in s
            ]
            crypto_data = [
                c
                for c in crypto_results
                if c and isinstance(c, dict) and "error" not in c
            ]

            # If we got some data, return it; otherwise use fallback
            if stock_data or crypto_data:
                result = {
                    "stocks": stock_data if stock_data else self._get_fallback_stocks(),
                    "cryptocurrencies": crypto_data
                    if crypto_data
                    else self._get_fallback_cryptos(),
                    "timestamp": datetime.now().isoformat(),
                }
                # Cache the successful result
                self._cache[cache_key] = (result, datetime.now())
                return result
            else:
                result = {
                    "stocks": self._get_fallback_stocks(),
                    "cryptocurrencies": self._get_fallback_cryptos(),
                    "timestamp": datetime.now().isoformat(),
                    "message": "Using fallback data - API error",
                }
                # Cache fallback result for shorter time
                self._cache[cache_key] = (result, datetime.now())
                return result

        except Exception as e:
            result = {
                "stocks": self._get_fallback_stocks(),
                "cryptocurrencies": self._get_fallback_cryptos(),
                "timestamp": datetime.now().isoformat(),
                "error": f"Error fetching market overview: {str(e)}",
                "message": "Using fallback data",
            }
            # Cache fallback result for shorter time
            self._cache[cache_key] = (result, datetime.now())
            return result

    def _get_fallback_stocks(self) -> list:
        """Return fallback stock data."""
        return [
            {
                "symbol": "AAPL",
                "price": 182.63,
                "change": 1.24,
                "change_percent": "0.68%",
                "volume": 0,
                "last_updated": datetime.now().isoformat(),
                "source": "fallback",
            },
            {
                "symbol": "GOOGL",
                "price": 145.85,
                "change": -0.42,
                "change_percent": "-0.29%",
                "volume": 0,
                "last_updated": datetime.now().isoformat(),
                "source": "fallback",
            },
            {
                "symbol": "MSFT",
                "price": 406.32,
                "change": 2.15,
                "change_percent": "0.53%",
                "volume": 0,
                "last_updated": datetime.now().isoformat(),
                "source": "fallback",
            },
        ]

    def _get_fallback_cryptos(self) -> list:
        """Return fallback cryptocurrency data."""
        return [
            {
                "symbol": "BTC",
                "price": 61423.50,
                "change_24h": 1250.25,
                "name": "Bitcoin",
                "source": "fallback",
            },
            {
                "symbol": "ETH",
                "price": 3421.75,
                "change_24h": 45.30,
                "name": "Ethereum",
                "source": "fallback",
            },
            {
                "symbol": "SOL",
                "price": 142.60,
                "change_24h": 8.45,
                "name": "Solana",
                "source": "fallback",
            },
        ]


# Global instance
market_service = MarketDataService()
