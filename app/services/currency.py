"""
Currency Service using Frankfurter API
Free, no API key required, unlimited requests!
API: https://www.frankfurter.app/
"""

import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta


class CurrencyService:
    """
    Currency conversion service using Frankfurter API.
    
    Frankfurter provides:
    - Current and historical foreign exchange rates
    - Published by the European Central Bank
    - 100% FREE with no rate limits
    - No API key needed
    """
    
    def __init__(self):
        """Initialize currency service."""
        self.base_url = "https://api.frankfurter.app"
        self._cache = {}
        self.cache_duration = 3600  # 1 hour cache (rates don't change that often)
    
    async def get_exchange_rates(self, base_currency: str = "USD") -> Dict:
        """
        Get current exchange rates for a base currency.
        
        Args:
            base_currency: Base currency code (e.g., "USD", "EUR", "GBP")
            
        Returns:
            Dictionary with rates and metadata
            
        Example:
            {
                "base": "USD",
                "date": "2026-01-20",
                "rates": {
                    "EUR": 0.92,
                    "GBP": 0.79,
                    "JPY": 149.50,
                    ...
                }
            }
        """
        cache_key = f"rates_{base_currency}"
        
        # Check cache
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if datetime.now() - cached_time < timedelta(seconds=self.cache_duration):
                return cached_data
        
        try:
            async with httpx.AsyncClient() as client:
                # Get latest rates
                response = await client.get(
                    f"{self.base_url}/latest",
                    params={"from": base_currency.upper()}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    result = {
                        "base": data.get("base"),
                        "date": data.get("date"),
                        "rates": data.get("rates"),
                        "source": "Frankfurter API (European Central Bank)"
                    }
                    
                    # Cache the result
                    self._cache[cache_key] = (result, datetime.now())
                    return result
                else:
                    return {
                        "error": f"API returned status code {response.status_code}",
                        "message": "Could not fetch exchange rates"
                    }
        
        except Exception as e:
            return {
                "error": str(e),
                "message": "Error fetching exchange rates"
            }
    
    async def convert_currency(
        self, 
        amount: float, 
        from_currency: str, 
        to_currency: str
    ) -> Dict:
        """
        Convert amount from one currency to another.
        
        Args:
            amount: Amount to convert
            from_currency: Source currency code
            to_currency: Target currency code
            
        Returns:
            Dictionary with conversion details
            
        Example:
            convert_currency(100, "USD", "EUR")
            {
                "amount": 100,
                "from": "USD",
                "to": "EUR",
                "rate": 0.92,
                "result": 92.0,
                "date": "2026-01-20"
            }
        """
        try:
            async with httpx.AsyncClient() as client:
                # Frankfurter can convert directly
                response = await client.get(
                    f"{self.base_url}/latest",
                    params={
                        "amount": amount,
                        "from": from_currency.upper(),
                        "to": to_currency.upper()
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    converted_amount = data["rates"].get(to_currency.upper(), 0)
                    rate = converted_amount / amount if amount > 0 else 0
                    
                    return {
                        "amount": amount,
                        "from": from_currency.upper(),
                        "to": to_currency.upper(),
                        "rate": round(rate, 6),
                        "result": round(converted_amount, 2),
                        "date": data.get("date"),
                        "source": "Frankfurter API"
                    }
                else:
                    return {
                        "error": "Invalid currency code or API error",
                        "message": f"Status code: {response.status_code}"
                    }
        
        except Exception as e:
            return {
                "error": str(e),
                "message": "Error converting currency"
            }
    
    async def get_historical_rates(
        self, 
        date: str, 
        base_currency: str = "USD"
    ) -> Dict:
        """
        Get historical exchange rates for a specific date.
        
        Args:
            date: Date in YYYY-MM-DD format
            base_currency: Base currency code
            
        Returns:
            Dictionary with historical rates
            
        Example:
            get_historical_rates("2025-12-31", "USD")
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/{date}",
                    params={"from": base_currency.upper()}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "base": data.get("base"),
                        "date": data.get("date"),
                        "rates": data.get("rates"),
                        "source": "Frankfurter API (Historical)"
                    }
                else:
                    return {
                        "error": "Date not available or invalid format",
                        "message": "Use YYYY-MM-DD format for dates"
                    }
        
        except Exception as e:
            return {
                "error": str(e),
                "message": "Error fetching historical rates"
            }
    
    async def get_supported_currencies(self) -> Dict:
        """
        Get list of all supported currencies.
        
        Returns:
            Dictionary with currency codes and names
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/currencies")
                
                if response.status_code == 200:
                    currencies = response.json()
                    return {
                        "currencies": currencies,
                        "count": len(currencies),
                        "source": "Frankfurter API"
                    }
                else:
                    return {"error": "Could not fetch currencies"}
        
        except Exception as e:
            return {"error": str(e)}
    
    async def convert_multiple(
        self, 
        amount: float, 
        from_currency: str, 
        to_currencies: List[str]
    ) -> Dict:
        """
        Convert amount to multiple currencies at once.
        
        Args:
            amount: Amount to convert
            from_currency: Source currency
            to_currencies: List of target currencies
            
        Returns:
            Dictionary with conversions to all target currencies
        """
        try:
            async with httpx.AsyncClient() as client:
                # Join currencies with comma
                to_curr_str = ",".join([c.upper() for c in to_currencies])
                
                response = await client.get(
                    f"{self.base_url}/latest",
                    params={
                        "amount": amount,
                        "from": from_currency.upper(),
                        "to": to_curr_str
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    conversions = {}
                    for currency, value in data["rates"].items():
                        conversions[currency] = {
                            "amount": round(value, 2),
                            "rate": round(value / amount, 6) if amount > 0 else 0
                        }
                    
                    return {
                        "amount": amount,
                        "from": from_currency.upper(),
                        "conversions": conversions,
                        "date": data.get("date")
                    }
                else:
                    return {"error": "Conversion failed"}
        
        except Exception as e:
            return {"error": str(e)}


# Global instance
currency_service = CurrencyService()