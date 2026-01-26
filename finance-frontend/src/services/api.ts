import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

// Use environment variable or fallback to localhost:8000
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
}

export interface ApiError {
  message: string;
  status: number;
  data?: any;
}

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // Increased timeout to 30 seconds
      withCredentials: false, // IMPORTANT: Set to false for CORS with JWT
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request start time for performance tracking
        (config as any).metadata = { startTime: Date.now() };
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const startTime = (response.config as any).metadata?.startTime;
        if (startTime) {
          const duration = endTime - startTime;
          if (duration > 1000) {
            console.warn(`Slow API call: ${response.config.url} took ${duration}ms`);
          }
        }
        
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Handle network/CORS errors
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          console.error('Network/CORS Error:', {
            message: error.message,
            code: error.code,
            url: originalRequest?.url
          });
          
          // Only show toast if it's not a CORS preflight
          if (originalRequest?.url && !originalRequest.url.includes('/health')) {
            toast.error('Cannot connect to server. Please check if backend is running on port 8000.');
          }
          return Promise.reject(error);
        }
        
        // Handle 401 Unauthorized
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              console.log('Attempting token refresh...');
              
              // Use FormData for refresh token endpoint (compatible with FastAPI)
              const formData = new FormData();
              formData.append('refresh_token', refreshToken);
              
              const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              });
              
              const { access_token, refresh_token } = response.data;
              
              if (access_token) {
                localStorage.setItem('access_token', access_token);
                if (refresh_token) {
                  localStorage.setItem('refresh_token', refresh_token);
                }
                
                console.log('Token refresh successful');
                
                // Retry original request with new token
                originalRequest.headers = {
                  ...originalRequest.headers,
                  Authorization: `Bearer ${access_token}`,
                };
                
                return this.axiosInstance(originalRequest);
              }
            }
          } catch (refreshError: any) {
            console.error('Token refresh failed:', refreshError);
            // Clear tokens and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            
            toast.error('Session expired. Please login again.');
            
            // Redirect to login page
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }
        }
        
        // Handle other errors
        if (error.response) {
          const { status, data } = error.response as any;
          
          // Don't show toast for 0 status (CORS preflight) or 401 (handled above)
          if (status !== 0 && status !== 401) {
            const errorMessage = this.getErrorMessage(status, data);
            toast.error(errorMessage);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private getErrorMessage(status: number, data: any): string {
    switch (status) {
      case 400:
        return data?.detail || 'Invalid request. Please check your input.';
      case 401:
        return 'Please login to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        if (data?.detail && Array.isArray(data.detail)) {
          return data.detail.map((err: any) => err.msg || err.message).join(', ');
        }
        return data?.detail || 'Validation error. Please check your input.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  // Auth endpoints - FIXED: Use proper login format
  async login(email: string, password: string) {
    try {
      // Use FormData as required by FastAPI OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', email);  // FastAPI expects 'username' field
      formData.append('password', password);
      
      const response = await this.axiosInstance.post('/api/v1/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
        toast.success('Login successful! 🎉');
      }
      
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(errorMsg);
      throw error;
    }
  }

  // FIXED: Add missing refresh token method
  async refreshToken(refreshToken: string) {
    try {
      const formData = new FormData();
      formData.append('refresh_token', refreshToken);
      
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData: {
    email: string;
    password: string;
    full_name: string;
    preferred_currency: string;
  }) {
    try {
      const response = await this.axiosInstance.post('/api/v1/auth/register', userData);
      toast.success('Registration successful! 🎉');
      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      throw error;
    }
  }

  async logout() {
    try {
      await this.axiosInstance.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.axiosInstance.get('/api/v1/users/me');
      // Store user data in localStorage for quick access
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      // If unauthorized, clear tokens
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
      throw error;
    }
  }

  // ML endpoints with better error handling
  async categorizeExpense(description: string) {
    try {
      const response = await this.axiosInstance.post(`/api/v1/ml/categorize?description=${encodeURIComponent(description)}`);
      return response.data;
    } catch (error) {
      console.warn('Categorization service unavailable, using fallback');
      return {
        category: 'Other',
        confidence: 0.5,
        description: description,
        fallback: true
      };
    }
  }

  async categorizeBatch(descriptions: string[]) {
    try {
      const response = await this.axiosInstance.post('/api/v1/ml/categorize-batch', { descriptions });
      return response.data;
    } catch (error) {
      console.warn('Batch categorization service unavailable, using fallback');
      return descriptions.map(desc => ({
        description: desc,
        category: 'Other',
        confidence: 0.5,
        fallback: true
      }));
    }
  }

  async predictExpenses(monthsAhead: number = 1) {
    try {
      const response = await this.axiosInstance.post('/api/v1/ml/predict-expenses', { 
        months_ahead: monthsAhead 
      }, {
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      console.warn('ML prediction service unavailable, returning mock data');
      // Return mock data with realistic values
      return {
        predictions: {
          'Food': 600.00,
          'Transport': 300.00,
          'Entertainment': 400.00,
          'Shopping': 500.00,
          'Bills': 700.00
        },
        total: 2500.00,
        confidence: 'low',
        prediction_date: new Date().toISOString().split('T')[0],
        fallback: true,
        message: 'Using mock prediction data'
      };
    }
  }

  async getSpendingTrends(months: number = 6) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/ml/spending-trends?months=${months}`);
      return response.data;
    } catch (error) {
      console.warn('Spending trends service unavailable');
      return [];
    }
  }

  async getCategories() {
    try {
      const response = await this.axiosInstance.get('/api/v1/ml/categories');
      return response.data;
    } catch (error) {
      console.warn('Categories service unavailable');
      return ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Other'];
    }
  }

  // Market endpoints with fallbacks
  async getStockPrice(symbol: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/market/stocks/${symbol}`);
      return response.data;
    } catch (error) {
      console.warn(`Stock price for ${symbol} unavailable, using fallback`);
      return {
        symbol: symbol.toUpperCase(),
        price: 100.00,
        change: 0.00,
        change_percent: 0.00,
        volume: 0,
        last_updated: 'N/A',
        source: 'fallback',
        fallback: true
      };
    }
  }

  async getCryptoPrice(symbol: string) {
    try {
      const response = await this.axiosInstance.get(`/api/v1/market/crypto/${symbol}`);
      return response.data;
    } catch (error) {
      console.warn(`Crypto price for ${symbol} unavailable, using fallback`);
      return {
        symbol: symbol.toUpperCase(),
        price: 1000.00,
        change_24h: 0.00,
        volume_24h: 0,
        market_cap: 0,
        last_updated: 'N/A',
        source: 'fallback',
        fallback: true
      };
    }
  }

  async getMarketOverview() {
    try {
      const response = await this.axiosInstance.get('/api/v1/market/overview', {
        timeout: 15000,
      });
      return response.data;
    } catch (error) {
      console.warn('Market data service unavailable, returning mock data');
      return {
        stocks: [
          {symbol: 'AAPL', price: 182.63, change: 1.24, change_percent: 0.68, name: 'Apple Inc.'},
          {symbol: 'GOOGL', price: 145.85, change: -0.42, change_percent: -0.29, name: 'Alphabet Inc.'},
          {symbol: 'MSFT', price: 406.32, change: 2.15, change_percent: 0.53, name: 'Microsoft Corp.'},
        ],
        cryptocurrencies: [
          {symbol: 'BTC', price: 61423.50, change_24h: 1250.25, name: 'Bitcoin'},
          {symbol: 'ETH', price: 3421.75, change_24h: 45.30, name: 'Ethereum'},
          {symbol: 'SOL', price: 142.60, change_24h: 8.45, name: 'Solana'},
        ],
        timestamp: new Date().toISOString(),
        source: 'fallback',
        fallback: true
      };
    }
  }

  // Account endpoints
  async getAccounts() {
    return this.axiosInstance.get('/api/v1/accounts');
  }

  async createAccount(accountData: any) {
    return this.axiosInstance.post('/api/v1/accounts', accountData);
  }

  async updateAccount(id: number, accountData: any) {
    return this.axiosInstance.put(`/api/v1/accounts/${id}`, accountData);
  }

  async deleteAccount(id: number) {
    return this.axiosInstance.delete(`/api/v1/accounts/${id}`);
  }

  // Transaction endpoints
  async getTransactions(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
  }) {
    return this.axiosInstance.get('/api/v1/transactions', { params });
  }

  async createTransaction(transactionData: any) {
    return this.axiosInstance.post('/api/v1/transactions', transactionData);
  }

  async updateTransaction(id: number, transactionData: any) {
    return this.axiosInstance.put(`/api/v1/transactions/${id}`, transactionData);
  }

  async deleteTransaction(id: number) {
    return this.axiosInstance.delete(`/api/v1/transactions/${id}`);
  }

  async getTransactionSummary(params?: {
    start_date?: string;
    end_date?: string;
  }) {
    return this.axiosInstance.get('/api/v1/transactions/summary', { params });
  }

  // Budget endpoints
  async getBudgets() {
    return this.axiosInstance.get('/api/v1/budgets');
  }

  async createBudget(budgetData: any) {
    return this.axiosInstance.post('/api/v1/budgets', budgetData);
  }

  async updateBudget(id: number, budgetData: any) {
    return this.axiosInstance.put(`/api/v1/budgets/${id}`, budgetData);
  }

  async deleteBudget(id: number) {
    return this.axiosInstance.delete(`/api/v1/budgets/${id}`);
  }

  async getBudgetStatus() {
    return this.axiosInstance.get('/api/v1/budgets/status');
  }

  // Currency endpoints
  async getExchangeRates(base: string = 'USD') {
    return this.axiosInstance.get(`/api/v1/currency/rates?base=${base}`);
  }

  async convertCurrency(amount: number, from: string, to: string) {
    return this.axiosInstance.get(`/api/v1/currency/convert?amount=${amount}&from=${from}&to=${to}`);
  }

  async convertMultipleCurrencies(amount: number, from: string, to: string[]) {
    const toParam = to.join(',');
    return this.axiosInstance.get(`/api/v1/currency/convert-multiple?amount=${amount}&from=${from}&to=${toParam}`);
  }

  async getHistoricalRates(date: string, base: string = 'USD') {
    return this.axiosInstance.get(`/api/v1/currency/historical/${date}?base=${base}`);
  }

  async getSupportedCurrencies() {
    return this.axiosInstance.get('/api/v1/currency/currencies');
  }

  async getPopularCurrencies(base: string = 'USD') {
    return this.axiosInstance.get(`/api/v1/currency/popular?base=${base}`);
  }

  // User endpoints
  async updateUser(userData: any) {
    return this.axiosInstance.put('/api/v1/users/me', userData);
  }

  async deleteUser() {
    return this.axiosInstance.delete('/api/v1/users/me');
  }

  // Analytics endpoints
  async getMonthlyAnalytics(year?: number) {
    const params = year ? { year } : {};
    return this.axiosInstance.get('/api/v1/analytics/monthly', { params });
  }

  async getYearlyAnalytics() {
    return this.axiosInstance.get('/api/v1/analytics/yearly');
  }

  async getCategoryAnalytics(startDate?: string, endDate?: string) {
    const params = { start_date: startDate, end_date: endDate };
    return this.axiosInstance.get('/api/v1/analytics/categories', { params });
  }
}

export const apiService = new ApiService();
export default apiService;