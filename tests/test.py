"""
API Testing Script for Person A's Implementation
Run this to verify all endpoints are working correctly.

Usage:
    python test_api.py
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")

def print_section(message):
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"{message}")
    print(f"{'='*60}{Colors.END}\n")


class APITester:
    def __init__(self):
        self.token = None
        self.user_email = f"test_{datetime.now().timestamp()}@example.com"
        self.user_password = "TestPassword123!"
    
    def test_health_check(self):
        """Test health check endpoint."""
        print_section("Testing Health Check")
        try:
            response = requests.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                print_success(f"Health check passed: {response.json()}")
                return True
            else:
                print_error(f"Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Health check error: {e}")
            return False
    
    def test_register(self):
        """Test user registration."""
        print_section("Testing User Registration")
        try:
            data = {
                "email": self.user_email,
                "password": self.user_password,
                "full_name": "Test User",
                "preferred_currency": "USD"
            }
            response = requests.post(f"{API_V1}/auth/register", json=data)
            
            if response.status_code == 201:
                user_data = response.json()
                print_success(f"User registered successfully!")
                print_info(f"Email: {user_data['email']}")
                print_info(f"User ID: {user_data['id']}")
                return True
            else:
                print_error(f"Registration failed: {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
        except Exception as e:
            print_error(f"Registration error: {e}")
            return False
    
    def test_login(self):
        """Test user login."""
        print_section("Testing User Login")
        try:
            data = {
                "username": self.user_email,  # OAuth2 uses 'username' field
                "password": self.user_password
            }
            response = requests.post(
                f"{API_V1}/auth/login",
                data=data,  # form data, not json
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.token = token_data["access_token"]
                print_success("Login successful!")
                print_info(f"Token: {self.token[:30]}...")
                return True
            else:
                print_error(f"Login failed: {response.status_code}")
                print_error(f"Response: {response.text}")
                return False
        except Exception as e:
            print_error(f"Login error: {e}")
            return False
    
    def test_get_current_user(self):
        """Test getting current user."""
        print_section("Testing Get Current User")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{API_V1}/users/me", headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                print_success("Retrieved current user!")
                print_info(f"Email: {user_data['email']}")
                print_info(f"Name: {user_data['full_name']}")
                return True
            else:
                print_error(f"Get user failed: {response.status_code}")
                return False
        except Exception as e:
            print_error(f"Get user error: {e}")
            return False
    
    def test_categorization(self):
        """Test ML categorization."""
        print_section("Testing ML Expense Categorization")
        
        test_cases = [
            "Coffee at Starbucks",
            "Uber ride to office",
            "Netflix subscription",
            "Grocery shopping at Walmart",
            "Dentist appointment"
        ]
        
        headers = {"Authorization": f"Bearer {self.token}"}
        success_count = 0
        
        for description in test_cases:
            try:
                response = requests.post(
                    f"{API_V1}/ml/categorize",
                    params={"description": description},
                    headers=headers
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print_success(
                        f"'{description}' → {result['category']} "
                        f"(confidence: {result['confidence']:.2f})"
                    )
                    success_count += 1
                else:
                    print_error(f"Categorization failed for: {description}")
            except Exception as e:
                print_error(f"Error: {e}")
        
        return success_count == len(test_cases)
    
    def test_get_categories(self):
        """Test getting all categories."""
        print_section("Testing Get Categories")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{API_V1}/ml/categories", headers=headers)
            
            if response.status_code == 200:
                categories = response.json()
                print_success(f"Retrieved {len(categories)} categories:")
                for cat in categories:
                    print(f"  • {cat}")
                return True
            else:
                print_error("Get categories failed")
                return False
        except Exception as e:
            print_error(f"Error: {e}")
            return False
    
    def test_predict_expenses(self):
        """Test expense prediction."""
        print_section("Testing Expense Prediction")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            data = {"months_ahead": 1}
            response = requests.post(
                f"{API_V1}/ml/predict-expenses",
                json=data,
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                print_info(f"Confidence: {result['confidence']}")
                print_info(f"Message: {result.get('message', 'N/A')}")
                
                if result['predictions']:
                    print_success("Predictions generated:")
                    for category, amount in result['predictions'].items():
                        print(f"  • {category}: ${amount:.2f}")
                else:
                    print_info("No predictions (need more transaction data)")
                return True
            else:
                print_error("Prediction failed")
                return False
        except Exception as e:
            print_error(f"Error: {e}")
            return False
    
    def test_market_data(self):
        """Test market data endpoints."""
        print_section("Testing Market Data")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test stock data
        try:
            print_info("Testing stock data (AAPL)...")
            response = requests.get(
                f"{API_V1}/market/stocks/AAPL",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "error" not in data:
                    print_success(f"Stock: {data.get('symbol')} - ${data.get('price', 'N/A')}")
                else:
                    print_info(f"Note: {data.get('message', 'API key not configured')}")
            else:
                print_error("Stock data request failed")
        except Exception as e:
            print_error(f"Stock data error: {e}")
        
        # Test crypto data
        try:
            print_info("Testing crypto data (bitcoin)...")
            response = requests.get(
                f"{API_V1}/market/crypto/bitcoin",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if "error" not in data:
                    print_success(f"Crypto: {data.get('name')} - ${data.get('price', 'N/A')}")
                else:
                    print_info(f"Note: {data.get('message', 'N/A')}")
            else:
                print_error("Crypto data request failed")
        except Exception as e:
            print_error(f"Crypto data error: {e}")
        
        return True
    
    def test_model_info(self):
        """Test ML model info endpoint."""
        print_section("Testing ML Model Info")
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(f"{API_V1}/ml/model-info", headers=headers)
            
            if response.status_code == 200:
                info = response.json()
                print_success("Model information retrieved:")
                print(json.dumps(info, indent=2))
                return True
            else:
                print_error("Model info request failed")
                return False
        except Exception as e:
            print_error(f"Error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all tests."""
        print(f"\n{Colors.BLUE}{'='*60}")
        print("🧪 API Testing Suite")
        print(f"{'='*60}{Colors.END}\n")
        
        print_info(f"Testing API at: {BASE_URL}")
        print_info(f"Starting tests at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        results = []
        
        # Run tests in sequence
        results.append(("Health Check", self.test_health_check()))
        results.append(("User Registration", self.test_register()))
        results.append(("User Login", self.test_login()))
        
        if self.token:
            results.append(("Get Current User", self.test_get_current_user()))
            results.append(("ML Categorization", self.test_categorization()))
            results.append(("Get Categories", self.test_get_categories()))
            results.append(("Expense Prediction", self.test_predict_expenses()))
            results.append(("Market Data", self.test_market_data()))
            results.append(("Model Info", self.test_model_info()))
        
        # Print summary
        print_section("Test Summary")
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✓ PASS" if result else "✗ FAIL"
            color = Colors.GREEN if result else Colors.RED
            print(f"{color}{status}{Colors.END} - {test_name}")
        
        print(f"\n{Colors.BLUE}{'='*60}")
        print(f"Results: {passed}/{total} tests passed")
        print(f"{'='*60}{Colors.END}\n")
        
        if passed == total:
            print_success("🎉 All tests passed! Person A's implementation is working correctly!")
        else:
            print_error(f"⚠️ {total - passed} test(s) failed. Please check the errors above.")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("Make sure the API server is running:")
    print("  uvicorn app.main:app --reload")
    print("="*60 + "\n")
    
    input("Press Enter to start testing...")
    
    tester = APITester()
    tester.run_all_tests()