"""
Sample Data Generator for Finance Manager
Creates realistic test data with 50+ transactions across multiple months.

Usage:
    python create_sample_data.py

This will:
1. Register a test user (or use existing)
2. Create 3 sample accounts
3. Create 60+ transactions (auto-categorized by ML!)
4. Create budgets for main categories
5. Show predictions (now with enough data!)
6. Display comprehensive summary
"""

import requests
import json
from datetime import datetime, timedelta
import random

BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
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

# Sample transactions (will be auto-categorized!)
TRANSACTIONS = [
    # Food & Dining
    {"desc": "Starbucks coffee morning", "amt": 5.50, "days_ago": 2},
    {"desc": "McDonald's lunch combo", "amt": 12.99, "days_ago": 5},
    {"desc": "Grocery shopping at Walmart", "amt": 87.45, "days_ago": 7},
    {"desc": "Pizza Hut delivery dinner", "amt": 28.75, "days_ago": 10},
    {"desc": "Subway sandwich", "amt": 8.50, "days_ago": 12},
    {"desc": "Dunkin Donuts breakfast", "amt": 6.25, "days_ago": 15},
    {"desc": "Restaurant dinner date", "amt": 65.00, "days_ago": 18},
    {"desc": "Zomato food delivery", "amt": 18.99, "days_ago": 20},
    {"desc": "Cafe latte and pastry", "amt": 9.75, "days_ago": 22},
    {"desc": "Chipotle burrito bowl", "amt": 11.50, "days_ago": 25},
    {"desc": "Grocery store weekly shopping", "amt": 95.30, "days_ago": 28},
    {"desc": "KFC family meal", "amt": 32.00, "days_ago": 30},
    {"desc": "Starbucks afternoon coffee", "amt": 6.00, "days_ago": 35},
    {"desc": "Pizza delivery", "amt": 24.50, "days_ago": 40},
    {"desc": "Restaurant lunch", "amt": 45.00, "days_ago": 45},
    
    # Transport
    {"desc": "Uber ride to office", "amt": 15.50, "days_ago": 1},
    {"desc": "Gas station fuel fillup", "amt": 45.00, "days_ago": 4},
    {"desc": "Metro card monthly pass", "amt": 120.00, "days_ago": 8},
    {"desc": "Parking fee downtown", "amt": 12.00, "days_ago": 11},
    {"desc": "Lyft to airport", "amt": 35.75, "days_ago": 14},
    {"desc": "Auto rickshaw fare", "amt": 5.00, "days_ago": 17},
    {"desc": "Gas station refill", "amt": 48.00, "days_ago": 21},
    {"desc": "Uber ride home", "amt": 18.50, "days_ago": 24},
    {"desc": "Car wash service", "amt": 15.00, "days_ago": 27},
    {"desc": "Toll charges highway", "amt": 8.00, "days_ago": 31},
    {"desc": "Parking meter", "amt": 5.50, "days_ago": 36},
    {"desc": "Gas station", "amt": 50.00, "days_ago": 42},
    
    # Entertainment
    {"desc": "Netflix monthly subscription", "amt": 15.99, "days_ago": 3},
    {"desc": "Movie tickets AMC theater", "amt": 24.00, "days_ago": 9},
    {"desc": "Spotify premium subscription", "amt": 9.99, "days_ago": 13},
    {"desc": "PlayStation game purchase", "amt": 59.99, "days_ago": 16},
    {"desc": "Concert tickets", "amt": 85.00, "days_ago": 19},
    {"desc": "YouTube Premium subscription", "amt": 11.99, "days_ago": 23},
    {"desc": "Disney Plus subscription", "amt": 7.99, "days_ago": 33},
    {"desc": "Movie streaming rental", "amt": 5.99, "days_ago": 38},
    
    # Shopping
    {"desc": "Amazon Prime shopping electronics", "amt": 125.50, "days_ago": 6},
    {"desc": "Nike running shoes", "amt": 89.99, "days_ago": 26},
    {"desc": "Best Buy laptop accessories", "amt": 249.99, "days_ago": 29},
    {"desc": "Clothing store new jeans", "amt": 65.00, "days_ago": 32},
    {"desc": "Book store novels", "amt": 32.50, "days_ago": 37},
    {"desc": "Target household items", "amt": 78.25, "days_ago": 41},
    {"desc": "Online shopping clothes", "amt": 95.00, "days_ago": 44},
    
    # Bills & Utilities
    {"desc": "Internet bill monthly payment", "amt": 59.99, "days_ago": 1},
    {"desc": "Electricity bill", "amt": 95.00, "days_ago": 2},
    {"desc": "Phone bill Verizon", "amt": 75.00, "days_ago": 3},
    {"desc": "Water utility bill", "amt": 35.00, "days_ago": 15},
    {"desc": "Insurance premium payment", "amt": 150.00, "days_ago": 30},
    {"desc": "Gym membership monthly", "amt": 45.00, "days_ago": 31},
    
    # Healthcare
    {"desc": "Pharmacy CVS prescription", "amt": 28.50, "days_ago": 8},
    {"desc": "Doctor visit copay", "amt": 30.00, "days_ago": 34},
    {"desc": "Dental checkup cleaning", "amt": 80.00, "days_ago": 39},
    {"desc": "Pharmacy vitamins", "amt": 22.00, "days_ago": 43},
    
    # Education
    {"desc": "Online course Udemy", "amt": 49.99, "days_ago": 20},
    {"desc": "Book store textbooks", "amt": 85.00, "days_ago": 46},
    
    # Personal Care
    {"desc": "Haircut barbershop", "amt": 25.00, "days_ago": 14},
    {"desc": "Spa massage treatment", "amt": 80.00, "days_ago": 35},
    
    # Income transactions
    {"desc": "Monthly salary deposit", "amt": 5000.00, "days_ago": 30, "type": "income"},
    {"desc": "Freelance project payment", "amt": 800.00, "days_ago": 15, "type": "income"},
    {"desc": "Investment dividend", "amt": 150.00, "days_ago": 25, "type": "income"},
]

class SampleDataGenerator:
    def __init__(self):
        self.token = None
        self.user_email = f"demo_user_{int(datetime.now().timestamp())}@example.com"
        self.user_password = "DemoPass123!"
        self.accounts = []
        self.transactions = []
        self.budgets = []
    
    def register_user(self):
        """Register a new user."""
        print_section("Step 1: User Registration")
        
        try:
            data = {
                "email": self.user_email,
                "password": self.user_password,
                "full_name": "Demo User",
                "preferred_currency": "USD"
            }
            response = requests.post(f"{API_V1}/auth/register", json=data)
            
            if response.status_code == 201:
                user_data = response.json()
                print_success(f"User registered: {user_data['email']}")
                print_info(f"User ID: {user_data['id']}")
                return True
            else:
                print_error(f"Registration failed: {response.text}")
                return False
        except Exception as e:
            print_error(f"Error: {e}")
            return False
    
    def login(self):
        """Login and get token."""
        print_section("Step 2: User Login")
        
        try:
            data = {
                "username": self.user_email,
                "password": self.user_password
            }
            response = requests.post(
                f"{API_V1}/auth/login",
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.token = token_data["access_token"]
                print_success("Login successful!")
                print_info(f"Token: {self.token[:30]}...")
                return True
            else:
                print_error(f"Login failed: {response.text}")
                return False
        except Exception as e:
            print_error(f"Error: {e}")
            return False
    
    def create_accounts(self):
        """Create sample accounts."""
        print_section("Step 3: Creating Sample Accounts")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        sample_accounts = [
            {
                "account_name": "Primary Checking",
                "account_type": "checking",
                "balance": 5000.00,
                "currency": "USD"
            },
            {
                "account_name": "Savings Account",
                "account_type": "savings",
                "balance": 10000.00,
                "currency": "USD"
            },
            {
                "account_name": "Credit Card",
                "account_type": "credit_card",
                "balance": -500.00,
                "currency": "USD"
            }
        ]
        
        for acc_data in sample_accounts:
            try:
                response = requests.post(
                    f"{API_V1}/accounts/",
                    json=acc_data,
                    headers=headers
                )
                
                if response.status_code == 201:
                    account = response.json()
                    self.accounts.append(account)
                    print_success(f"Created: {account['account_name']} (Balance: ${account['balance']})")
                else:
                    print_error(f"Failed to create account: {acc_data['account_name']}")
            except Exception as e:
                print_error(f"Error creating account: {e}")
        
        print_info(f"Total accounts created: {len(self.accounts)}")
    
    def create_transactions(self):
        """Create sample transactions."""
        print_section("Step 4: Creating Sample Transactions")
        
        if not self.accounts:
            print_error("No accounts available!")
            return
        
        headers = {"Authorization": f"Bearer {self.token}"}
        primary_account = self.accounts[0]['id']
        
        print_info(f"Creating {len(TRANSACTIONS)} transactions...")
        print_info("(ML will auto-categorize each one!)\n")
        
        categorized_count = 0
        
        for i, trans_data in enumerate(TRANSACTIONS, 1):
            try:
                # Calculate transaction date
                trans_date = (datetime.now() - timedelta(days=trans_data['days_ago'])).date()
                
                transaction = {
                    "account_id": primary_account,
                    "amount": trans_data['amt'],
                    "transaction_type": trans_data.get('type', 'expense'),
                    "description": trans_data['desc'],
                    "transaction_date": trans_date.isoformat()
                }
                
                response = requests.post(
                    f"{API_V1}/transactions/",
                    json=transaction,
                    headers=headers
                )
                
                if response.status_code == 201:
                    created_trans = response.json()
                    self.transactions.append(created_trans)
                    
                    # Show auto-categorization
                    if created_trans['auto_categorized'] == 1:
                        categorized_count += 1
                        confidence = created_trans.get('category_confidence', 0) * 100
                        print(f"  {i:2d}. ${trans_data['amt']:7.2f} - {created_trans['category']:15s} "
                              f"({confidence:.0f}% confidence) - {trans_data['desc'][:35]}")
                
                # Show progress every 10 transactions
                if i % 10 == 0:
                    print_info(f"Progress: {i}/{len(TRANSACTIONS)} transactions created...")
                    
            except Exception as e:
                print_error(f"Error creating transaction: {e}")
        
        print()
        print_success(f"Created {len(self.transactions)} transactions!")
        print_success(f"ML auto-categorized {categorized_count} transactions!")
    
    def create_budgets(self):
        """Create sample budgets."""
        print_section("Step 5: Creating Budgets")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        sample_budgets = [
            {"category": "Food", "limit_amount": 500.00, "period": "monthly", "alert_threshold": 0.8},
            {"category": "Transport", "limit_amount": 300.00, "period": "monthly", "alert_threshold": 0.8},
            {"category": "Entertainment", "limit_amount": 200.00, "period": "monthly", "alert_threshold": 0.75},
            {"category": "Shopping", "limit_amount": 400.00, "period": "monthly", "alert_threshold": 0.8},
            {"category": "Bills", "limit_amount": 600.00, "period": "monthly", "alert_threshold": 0.9},
        ]
        
        for budget_data in sample_budgets:
            try:
                response = requests.post(
                    f"{API_V1}/budgets/",
                    json=budget_data,
                    headers=headers
                )
                
                if response.status_code == 201:
                    budget = response.json()
                    self.budgets.append(budget)
                    print_success(f"Budget: {budget['category']:15s} - ${budget['limit_amount']:.2f}/{budget['period']}")
            except Exception as e:
                print_error(f"Error creating budget: {e}")
        
        print_info(f"Total budgets created: {len(self.budgets)}")
    
    def show_predictions(self):
        """Get and display expense predictions."""
        print_section("Step 6: Expense Predictions (ML)")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.post(
                f"{API_V1}/ml/predict-expenses",
                json={"months_ahead": 1},
                headers=headers
            )
            
            if response.status_code == 200:
                predictions = response.json()
                
                print_success("Next month's predicted expenses:")
                print()
                
                if predictions.get('predictions'):
                    for category, amount in sorted(predictions['predictions'].items(), key=lambda x: x[1], reverse=True):
                        print(f"  {category:15s}: ${amount:8.2f}")
                    
                    print(f"\n  {'TOTAL':15s}: ${predictions['total']:8.2f}")
                    print(f"\n  Confidence: {predictions['confidence'].upper()}")
                    print(f"  Based on: {predictions['data_points']} transactions")
                else:
                    print_info(predictions.get('message', 'Not enough data'))
            else:
                print_error("Failed to get predictions")
        except Exception as e:
            print_error(f"Error: {e}")
    
    def show_budget_status(self):
        """Show current budget status."""
        print_section("Step 7: Budget Status & Alerts")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(
                f"{API_V1}/budgets/status",
                headers=headers
            )
            
            if response.status_code == 200:
                statuses = response.json()
                
                for status in statuses:
                    budget = status['budget']
                    spent = status['spent']
                    remaining = status['remaining']
                    percentage = status['percentage_used']
                    alert = status['alert']
                    
                    alert_icon = "🚨" if alert else "✅"
                    
                    print(f"{alert_icon} {budget['category']:15s}: ${spent:7.2f} / ${budget['limit_amount']:7.2f} "
                          f"({percentage:5.1f}%) - Remaining: ${remaining:7.2f}")
            else:
                print_error("Failed to get budget status")
        except Exception as e:
            print_error(f"Error: {e}")
    
    def show_summary(self):
        """Show comprehensive summary."""
        print_section("Step 8: Summary")
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = requests.get(
                f"{API_V1}/transactions/summary",
                headers=headers
            )
            
            if response.status_code == 200:
                summary = response.json()
                
                print(f"{Colors.CYAN}Financial Summary:{Colors.END}\n")
                print(f"  Total Income:    ${summary['total_income']:10.2f}")
                print(f"  Total Expenses:  ${summary['total_expenses']:10.2f}")
                print(f"  {'─' * 35}")
                print(f"  Net:             ${summary['net']:10.2f}")
                
                print(f"\n{Colors.CYAN}Spending by Category:{Colors.END}\n")
                for category, amount in sorted(summary['by_category'].items(), key=lambda x: x[1], reverse=True):
                    print(f"  {category:15s}: ${amount:8.2f}")
            else:
                print_error("Failed to get summary")
        except Exception as e:
            print_error(f"Error: {e}")
    
    def run(self):
        """Run the complete data generation process."""
        print(f"\n{Colors.MAGENTA}{'='*60}")
        print(f"  🎬 Sample Data Generator for Finance Manager")
        print(f"{'='*60}{Colors.END}\n")
        
        print_info("This will create a complete demo dataset with:")
        print_info("  - 1 demo user")
        print_info("  - 3 accounts")
        print_info(f"  - {len(TRANSACTIONS)} transactions (auto-categorized!)")
        print_info("  - 5 budgets")
        print_info("  - Predictions and analysis\n")
        
        input("Press Enter to continue...")
        
        # Execute steps
        if not self.register_user():
            return
        
        if not self.login():
            return
        
        self.create_accounts()
        self.create_transactions()
        self.create_budgets()
        self.show_predictions()
        self.show_budget_status()
        self.show_summary()
        
        # Final message
        print_section("🎉 Success!")
        
        print_success("Sample data created successfully!")
        print()
        print_info("You can now:")
        print_info("  1. Visit http://localhost:8000/docs to explore the API")
        print_info("  2. Login with:")
        print(f"     Email: {self.user_email}")
        print(f"     Password: {self.user_password}")
        print_info("  3. Test all endpoints with real data")
        print_info("  4. See ML predictions working with enough data!")
        print()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("Make sure the API server is running:")
    print("  uvicorn app.main:app --reload")
    print("="*60 + "\n")
    
    try:
        # Quick health check
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        if response.status_code == 200:
            print_success("✓ API server is running!")
        else:
            print_error("API server returned error")
            exit(1)
    except Exception as e:
        print_error("API server is not running!")
        print_error("Start it with: uvicorn app.main:app --reload")
        exit(1)
    
    generator = SampleDataGenerator()
    generator.run()