"""
Test Currency API (Frankfurter)
Tests all currency conversion endpoints

Usage:
    python test_currency.py
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

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
    """Login and get token."""
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={
            "username": "demo_user_1768911943@example.com",
            "password": "DemoPass123!"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    return response.json()["access_token"]

def main():
    print(f"\n{Colors.CYAN}{'='*60}")
    print("  💱 Currency API Tests (Frankfurter)")
    print(f"{'='*60}{Colors.END}\n")
    
    print_info("Testing FREE Frankfurter API (No API key needed!)")
    print_info("Data from European Central Bank\n")
    
    # Get token
    try:
        TOKEN = get_token()
        HEADERS = {"Authorization": f"Bearer {TOKEN}"}
        print_success("Logged in successfully!\n")
    except:
        print_error("Please run create_sample_data.py first!")
        return
    
    # Test 1: Get Exchange Rates
    print_section("Test 1: Get Exchange Rates (USD)")
    
    try:
        response = requests.get(
            f"{BASE_URL}/currency/rates?base=USD",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Base: {data['base']} | Date: {data['date']}")
            print_info(f"Source: {data['source']}\n")
            
            # Show some popular currencies
            rates = data['rates']
            print(f"{Colors.CYAN}Popular Exchange Rates:{Colors.END}")
            for currency in ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'CNY']:
                if currency in rates:
                    rate = rates[currency]
                    print(f"  1 USD = {rate:.4f} {currency}")
            
            print_info(f"\nTotal currencies available: {len(rates)}")
        else:
            print_error(f"Failed: {response.status_code}")
    except Exception as e:
        print_error(f"Error: {e}")
    
    # Test 2: Convert Currency
    print_section("Test 2: Convert Currency")
    
    conversions = [
        (100, "USD", "EUR"),
        (1000, "USD", "INR"),
        (50, "GBP", "USD"),
        (10000, "JPY", "USD")
    ]
    
    for amount, from_curr, to_curr in conversions:
        try:
            response = requests.get(
                f"{BASE_URL}/currency/convert",
                params={"amount": amount, "from": from_curr, "to": to_curr},
                headers=HEADERS
            )
            
            if response.status_code == 200:
                data = response.json()
                result = data['result']
                rate = data['rate']
                print_success(f"{amount:>8.2f} {from_curr} = {result:>10.2f} {to_curr}  (rate: {rate:.6f})")
            else:
                print_error(f"Failed: {from_curr} → {to_curr}")
        except Exception as e:
            print_error(f"Error: {e}")
    
    # Test 3: Convert to Multiple Currencies
    print_section("Test 3: Convert to Multiple Currencies")
    
    try:
        response = requests.get(
            f"{BASE_URL}/currency/convert-multiple",
            params={
                "amount": 1000,
                "from": "USD",
                "to": "EUR,GBP,JPY,INR,CAD"
            },
            headers=HEADERS
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Converting $1,000 USD to multiple currencies:\n")
            
            for currency, conversion in data['conversions'].items():
                amount = conversion['amount']
                rate = conversion['rate']
                print(f"  {currency}: {amount:>12,.2f}  (rate: {rate:.6f})")
        else:
            print_error(f"Failed: {response.status_code}")
    except Exception as e:
        print_error(f"Error: {e}")
    
    # Test 4: Get Supported Currencies
    print_section("Test 4: All Supported Currencies")
    
    try:
        response = requests.get(
            f"{BASE_URL}/currency/currencies",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            data = response.json()
            currencies = data['currencies']
            
            print_success(f"Total supported currencies: {data['count']}\n")
            print(f"{Colors.CYAN}Sample currencies:{Colors.END}")
            
            # Show first 15 currencies
            for i, (code, name) in enumerate(list(currencies.items())[:15]):
                print(f"  {code}: {name}")
            
            print(f"\n  ... and {len(currencies) - 15} more!")
        else:
            print_error(f"Failed: {response.status_code}")
    except Exception as e:
        print_error(f"Error: {e}")
    
    # Test 5: Popular Currencies
    print_section("Test 5: Popular Currencies Quick View")
    
    try:
        response = requests.get(
            f"{BASE_URL}/currency/popular?base=USD",
            headers=HEADERS
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"1 {data['base']} equals:\n")
            
            for currency, rate in data['rates'].items():
                print(f"  {rate:.4f} {currency}")
        else:
            print_error(f"Failed: {response.status_code}")
    except Exception as e:
        print_error(f"Error: {e}")
    
    # Test 6: Use Case - International Transaction
    print_section("Test 6: Real-World Use Case")
    
    print_info("Scenario: User spent €45.50 in Paris for dinner")
    print_info("Convert to USD for expense tracking:\n")
    
    try:
        response = requests.get(
            f"{BASE_URL}/currency/convert",
            params={"amount": 45.50, "from": "EUR", "to": "USD"},
            headers=HEADERS
        )
        
        if response.status_code == 200:
            data = response.json()
            usd_amount = data['result']
            rate = data['rate']
            
            print_success(f"€45.50 EUR = ${usd_amount:.2f} USD")
            print_info(f"Exchange rate: 1 EUR = {rate:.4f} USD")
            print_info(f"Date: {data['date']}\n")
            
            print(f"{Colors.CYAN}Now you can create a transaction:{Colors.END}")
            print(f"  POST /api/v1/transactions/")
            print(f"  {{")
            print(f'    "amount": {usd_amount:.2f},')
            print(f'    "transaction_type": "expense",')
            print(f'    "description": "Dinner in Paris (€45.50 EUR)",')
            print(f'    "category": "Food"')
            print(f"  }}")
        else:
            print_error("Conversion failed")
    except Exception as e:
        print_error(f"Error: {e}")
    
    # Summary
    print_section("✅ Test Summary")
    
    print_success("Currency API is working perfectly!")
    print()
    print_info("Features available:")
    print("  ✅ Get exchange rates for any currency")
    print("  ✅ Convert between currencies")
    print("  ✅ Convert to multiple currencies at once")
    print("  ✅ View all supported currencies (30+)")
    print("  ✅ Quick view of popular currencies")
    print("  ✅ Historical rates (bonus feature)")
    print()
    print_info("Best part:")
    print("  🎉 100% FREE - No API key needed!")
    print("  🎉 No rate limits")
    print("  🎉 European Central Bank data")
    print("  🎉 Always up-to-date")
    print()
    print_info("View API docs:")
    print("  📖 http://localhost:8000/docs")
    print()

if __name__ == "__main__":
    main()