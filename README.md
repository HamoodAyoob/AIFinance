# AI Finance Manager 💰🤖

An intelligent personal finance management platform powered by AI and machine learning. Track expenses, manage budgets, predict future spending, and get real-time market data - all in one place.

![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### 🔐 User Management

- Secure user registration and authentication with JWT tokens
- Password hashing with bcrypt
- User profile management with preferred currency settings

### 💳 Account Management

- Multiple account types: Checking, Savings, Credit Card, Investment, Cash
- Real-time balance tracking
- Multi-currency support

### 📊 Transaction Tracking

- **AI-Powered Auto-Categorization**: Transactions are automatically categorized using machine learning (TF-IDF + Naive Bayes)
- Manual categorization option with 10+ predefined categories
- Detailed transaction history with filtering and pagination
- Transaction summaries and analytics

### 🎯 Budget Management

- Set spending limits by category
- Weekly, monthly, or yearly budget periods
- Customizable alert thresholds (e.g., warn at 80% of limit)
- Real-time budget status tracking with spent/remaining amounts

### 🤖 Machine Learning

- **Expense Categorization**: Automatically categorize transactions based on description
- **Spending Predictions**: Predict future expenses using historical data
- **Trend Analysis**: Identify spending patterns and trends over time
- Batch categorization for multiple transactions
- Confidence scores for all ML predictions

### 💱 Currency Exchange

- Real-time exchange rates from European Central Bank (via Frankfurter API)
- Convert between 30+ currencies
- Historical exchange rate data
- Multi-currency conversion in a single request
- **100% FREE** - No API key required!

### 📈 Market Data

- Real-time stock prices (via Alpha Vantage)
- Cryptocurrency prices (via CoinGecko)
- Market overview with major indices
- 5-minute data caching for performance

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- PostgreSQL database
- pip (Python package manager)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ai-finance-manager.git
cd ai-finance-manager
```

1. **Create virtual environment**

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

1. **Install dependencies**

```bash
pip install -r requirements.txt
```

1. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` file with your settings:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_db

# Security (generate a secure secret key!)
SECRET_KEY=your-secret-key-here-change-in-production-min-32-chars

# Optional: External API Keys (for market data)
ALPHA_VANTAGE_API_KEY=your_key_here  # For stock prices
COINGECKO_API_KEY=your_key_here      # For crypto prices
```

1. **Set up the database**

```bash
# Create PostgreSQL database
createdb finance_db

# The tables will be created automatically on first run
```

1. **Run the application**

```bash
# Development mode with auto-reload
python app/main.py

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

1. **Access the API**

- API Documentation: <http://localhost:8000/docs>
- Alternative Docs: <http://localhost:8000/redoc>
- API Endpoint: <http://localhost:8000/api/v1>

## 📖 API Documentation

### Authentication

#### Register a new user

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepass123",
  "full_name": "John Doe",
  "preferred_currency": "USD"
}
```

#### Login

```bash
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=securepass123
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Accounts

#### Create an account

```bash
POST /api/v1/accounts
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_name": "Main Checking",
  "account_type": "checking",
  "balance": 5000.00,
  "currency": "USD"
}
```

#### List all accounts

```bash
GET /api/v1/accounts
Authorization: Bearer {token}
```

### Transactions

#### Create a transaction (with auto-categorization)

```bash
POST /api/v1/transactions
Authorization: Bearer {token}
Content-Type: application/json

{
  "account_id": 1,
  "amount": 45.50,
  "transaction_type": "expense",
  "description": "Coffee at Starbucks",
  "transaction_date": "2026-01-25"
}
```

The ML model will automatically categorize this as "Food" based on the description!

#### Get transaction summary

```bash
GET /api/v1/transactions/summary?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer {token}
```

### Budgets

#### Create a budget

```bash
POST /api/v1/budgets
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "Food",
  "limit_amount": 500.00,
  "period": "monthly",
  "alert_threshold": 0.8
}
```

#### Get budget status

```bash
GET /api/v1/budgets/status
Authorization: Bearer {token}
```

Response:

```json
[
  {
    "budget": {
      "id": 1,
      "category": "Food",
      "limit_amount": 500.00,
      "period": "monthly"
    },
    "spent": 387.50,
    "remaining": 112.50,
    "percentage_used": 77.50,
    "alert": false
  }
]
```

### Machine Learning

#### Categorize a transaction

```bash
POST /api/v1/ml/categorize?description=Uber ride to airport
Authorization: Bearer {token}
```

Response:

```json
{
  "category": "Transport",
  "confidence": 0.95,
  "description": "Uber ride to airport"
}
```

#### Predict future expenses

```bash
POST /api/v1/ml/predict-expenses
Authorization: Bearer {token}
Content-Type: application/json

{
  "months_ahead": 1
}
```

#### Get spending trends

```bash
GET /api/v1/ml/spending-trends?months=6
Authorization: Bearer {token}
```

### Currency Exchange

#### Get exchange rates

```bash
GET /api/v1/currency/rates?base=USD
Authorization: Bearer {token}
```

#### Convert currency

```bash
GET /api/v1/currency/convert?amount=100&from=USD&to=EUR
Authorization: Bearer {token}
```

### Market Data

#### Get stock price

```bash
GET /api/v1/market/stocks/AAPL
Authorization: Bearer {token}
```

#### Get crypto price

```bash
GET /api/v1/market/crypto/bitcoin
Authorization: Bearer {token}
```

## 🏗️ Project Structure

```
ai-finance-manager/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── users.py         # User management
│   │   │   ├── accounts.py      # Account endpoints
│   │   │   ├── transactions.py  # Transaction endpoints
│   │   │   ├── budgets.py       # Budget endpoints
│   │   │   ├── currency.py      # Currency exchange
│   │   │   ├── market.py        # Market data
│   │   │   └── ml.py            # Machine learning endpoints
│   │   └── deps.py              # Dependencies
│   ├── core/
│   │   ├── config.py            # Configuration settings
│   │   ├── database.py          # Database setup
│   │   └── security.py          # Security utilities
│   ├── models/
│   │   ├── user.py              # User model
│   │   ├── account.py           # Account model
│   │   ├── transaction.py       # Transaction model
│   │   ├── budget.py            # Budget model
│   │   └── prediction.py        # Prediction model
│   ├── schemas/
│   │   ├── user.py              # User schemas
│   │   ├── account.py           # Account schemas
│   │   ├── transaction.py       # Transaction schemas
│   │   ├── budget.py            # Budget schemas
│   │   └── prediction.py        # Prediction schemas
│   ├── ml_models/
│   │   ├── categorizer.py       # Expense categorization model
│   │   ├── predictor.py         # Expense prediction model
│   │   ├── training_data.py     # Training dataset
│   │   └── saved_models/        # Saved ML models
│   ├── services/
│   │   ├── currency.py          # Currency service
│   │   └── market_data.py       # Market data service
│   └── main.py                  # Application entry point
├── tests/                       # Test files
├── .env.example                 # Example environment variables
├── .gitignore                   # Git ignore file
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## 🧪 Testing

Run tests with pytest:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_auth.py
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | Yes |
| `SECRET_KEY` | JWT secret key (min 32 chars) | - | Yes |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | 30 | No |
| `ALPHA_VANTAGE_API_KEY` | Stock data API key | - | No |
| `COINGECKO_API_KEY` | Crypto data API key | - | No |
| `DEBUG` | Enable debug mode | True | No |

### Categories

The system supports the following expense categories:

- Food
- Transport
- Entertainment
- Shopping
- Bills
- Healthcare
- Education
- Personal Care
- Travel
- Other

## 🤖 Machine Learning Models

### Expense Categorization

- **Algorithm**: TF-IDF + Multinomial Naive Bayes
- **Training Data**: 200+ labeled transactions
- **Accuracy**: ~85-90% on test data
- **Features**: Unigrams and bigrams from transaction descriptions

### Expense Prediction

- **Algorithm**: Statistical prediction with trend analysis
- **Method**: Moving averages + linear trend projection
- **Minimum Data**: 5 transactions required
- **Confidence Levels**: High (50+ transactions), Medium (20-49), Low (<20)

## 🔒 Security

- Passwords hashed with bcrypt (cost factor: 12)
- JWT tokens for authentication
- Token expiration (default: 30 minutes)
- CORS protection
- SQL injection protection via SQLAlchemy ORM
- Input validation with Pydantic

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts
- `accounts` - Financial accounts
- `transactions` - Income/expense transactions
- `budgets` - Budget limits
- `predictions` - ML predictions

All tables include timestamps (`created_at`, `updated_at`) and proper foreign key relationships.

## 🌐 External APIs

### Free APIs (No Key Required)

- **Frankfurter API**: Currency exchange rates from European Central Bank

### APIs Requiring Keys

- **Alpha Vantage**: Stock market data (free tier: 5 requests/minute)
- **CoinGecko**: Cryptocurrency data (free tier available)

## 🚀 Deployment

### Using Gunicorn (Production)

```bash
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- Scikit-learn for machine learning capabilities
- Frankfurter API for free currency exchange data
- Alpha Vantage and CoinGecko for market data

---

**Made with ❤️ and AI**
