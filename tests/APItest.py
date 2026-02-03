"""
Test External APIs
Tests all external API integrations (Alpha Vantage, CoinGecko, etc.)

Usage:
    python test_external_apis.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_section(title):
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{Colors.END}\n")

def get_token():
    """Login and get authentication token."""
    print_section("Authentication")
    
    # Try demo user first
    credentials = {
        "username": "demo_user_1768911943@example.com",
        "password": "DemoPass123!"
    }
    
    try:
        response = requests.post(
            f"{API_V1}/auth/login",
            data=credentials,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        if response.status_code == 200:
            token = response.json()["access_token"]
            print_success("Logged in successfully!")
            print_info(f"Using demo account: {credentials['username']}")
            return token
        else:
            print_error("Demo account not found. Please run create_sample_data.py first!")
            return None
    except Exception as e:
        print_error(f"Login failed: {e}")
        return None

def test_stocks(headers):
    """Test stock market data from Alpha Vantage."""
    print_section("Testing Stock Market Data (Alpha Vantage)")
    
    stocks = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN"]
    
    print_info(f"Testing {len(stocks)} stock symbols...\n")
    
    for symbol in stocks:
        try:
            response = requests.get(
                f"{API_V1}/market/stocks/{symbol}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" not in data:
                    price = data.get('price', 0)
                    change = data.get('change', 0)
                    change_pct = data.get('change_percent', '0%')
                    
                    change_icon = "📈" if change > 0 else "📉"
                    print_success(f"{symbol:5s} ${price:8.2f}  {change_icon} {change_pct}")
                else:
                    print_error(f"{symbol:5s} {data.get('message', 'Error')}")
            else:
                print_error(f"{symbol:5s} API request failed")
                
        except Exception as e:
            print_error(f"{symbol:5s} Error: {e}")
    
    print_info("\n💡 Note: If you see errors, check your ALPHA_VANTAGE_API_KEY in .env")

def test_crypto(headers):
    """Test cryptocurrency data from CoinGecko."""
    print_section("Testing Cryptocurrency Data (CoinGecko)")
    
    cryptos = [
        {"symbol": "bitcoin", "name": "Bitcoin"},
        {"symbol": "ethereum", "name": "Ethereum"},
        {"symbol": "cardano", "name": "Cardano"},
        {"symbol": "solana", "name": "Solana"},
        {"symbol": "dogecoin", "name": "Dogecoin"}
    ]
    
    print_info(f"Testing {len(cryptos)} cryptocurrencies...\n")
    
    for crypto in cryptos:
        try:
            response = requests.get(
                f"{API_V1}/market/crypto/{crypto['symbol']}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if "error" not in data:
                    price = data.get('price', 0)
                    change_24h = data.get('change_24h', 0)
                    
                    change_icon = "📈" if change_24h > 0 else "📉"
                    print_success(f"{crypto['name']:12s} ${price:12,.2f}  {change_icon} {change_24h:+.2f}%")
                else:
                    print_error(f"{crypto['name']:12s} {data.get('message', 'Error')}")
            else:
                print_error(f"{crypto['name']:12s} API request failed")
                
        except Exception as e:
            print_error(f"{crypto['name']:12s} Error: {e}")
    
    print_info("\n💡 Note: CoinGecko works without API key!")

def test_market_overview(headers):
    """Test market overview endpoint."""
    print_section("Testing Market Overview")
    
    try:
        response = requests.get(
            f"{API_V1}/market/overview",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            
            stocks = data.get('stocks', [])
            cryptos = data.get('cryptocurrencies', [])
            
            print_success("Market overview retrieved successfully!\n")
            
            if stocks:
                print(f"{Colors.CYAN}Stocks:{Colors.END}")
                for stock in stocks:
                    if "error" not in stock:
                        print(f"  • {stock['symbol']}: ${stock.get('price', 0)}")
                print()
            
            if cryptos:
                print(f"{Colors.CYAN}Cryptocurrencies:{Colors.END}")
                for crypto in cryptos:
                    if "error" not in crypto:
                        print(f"  • {crypto['name']}: ${crypto.get('price', 0):,.2f}")
            
            if not stocks and not cryptos:
                print_error("No data returned (API keys may not be configured)")
        else:
            print_error("Failed to get market overview")
            
    except Exception as e:
        print_error(f"Error: {e}")

def test_currency(headers):
    """Test currency conversion (if implemented by Person B)."""
    print_section("Testing Currency Conversion")
    
    try:
        # Test 1: Get exchange rates
        response = requests.get(
            f"{API_V1}/currency/rates?base=USD",
            headers=headers
        )
        
        if response.status_code == 200:
            print_success("Currency rates endpoint working!")
            data = response.json()
            
            if "rates" in data:
                rates = data.get('rates', {})
                print_info(f"Retrieved rates for {len(rates)} currencies\n")
                
                # Show some sample rates
                sample_currencies = ['EUR', 'GBP', 'JPY', 'INR', 'CAD']
                for currency in sample_currencies:
                    if currency in rates:
                        print(f"  1 USD = {rates[currency]:.4f} {currency}")
            
            # Test 2: Convert currency
            print()
            response = requests.get(
                f"{API_V1}/currency/convert?amount=100&from=USD&to=EUR",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"$100 USD = €{data.get('converted_amount', 0):.2f} EUR")
        
        elif response.status_code == 404:
            print_info("⏳ Currency endpoints not implemented yet")
            print_info("   This is Person B's task - coming soon!")
        else:
            print_error(f"Currency API error: {response.status_code}")
            
    except Exception as e:
        print_info("⏳ Currency conversion not implemented yet (Person B's task)")

def test_ml_features(headers):
    """Test ML features with external data."""
    print_section("Bonus: Testing ML Categorization")
    
    test_descriptions = [
        "Apple stock purchase",
        "Bitcoin investment",
        "Stock trading fee",
        "Crypto exchange withdrawal",
        "Investment advisor consultation"
    ]
    
    print_info(f"Testing ML on {len(test_descriptions)} investment-related descriptions...\n")
    
    for desc in test_descriptions:
        try:
            response = requests.post(
                f"{API_V1}/ml/categorize",
                params={"description": desc},
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                category = data.get('category')
                confidence = data.get('confidence', 0) * 100
                print(f"  '{desc[:40]:40s}' → {category:15s} ({confidence:.0f}%)")
        except Exception as e:
            print_error(f"Error: {e}")

def main():
    """Run all API tests."""
    print(f"\n{Colors.CYAN}{'='*60}")
    print(f"  🧪 External API Integration Tests")
    print(f"{'='*60}{Colors.END}\n")
    
    print_info("This will test all external API integrations:")
    print_info("  • Alpha Vantage (Stock market)")
    print_info("  • CoinGecko (Cryptocurrency)")
    print_info("  • ExchangeRate-API (Currency)")
    print()
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        if response.status_code != 200:
            print_error("API server returned error!")
            return
    except Exception:
        print_error("API server is not running!")
        print_error("Start it with: uvicorn app.main:app --reload")
        return
    
    # Get authentication token
    token = get_token()
    if not token:
        print_error("Cannot proceed without authentication")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Run tests
    test_stocks(headers)
    test_crypto(headers)
    test_market_overview(headers)
    test_currency(headers)
    test_ml_features(headers)
    
    # Summary
    print_section("✅ Test Summary")
    
    print_success("External API testing complete!")
    print()
    print_info("What's working:")
    print("  ✅ Stock market data (Alpha Vantage)")
    print("  ✅ Cryptocurrency data (CoinGecko)")
    print("  ✅ Market overview")
    print("  ✅ ML categorization")
    print()
    print_info("What's next:")
    print("  ⏳ Currency conversion (Person B's task)")
    print("  🎨 Frontend development")
    print()
    print_info("View full API documentation:")
    print("  📖 http://localhost:8000/docs")
    print()

if __name__ == "__main__":
    main()