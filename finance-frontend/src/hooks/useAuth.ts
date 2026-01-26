import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from 'services/api';
import { toast } from 'react-toastify';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  preferred_currency: string;
  created_at: string;
  updated_at: string | null;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
    }
    
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
      return;
    }

    try {
      const response = await apiService.getCurrentUser();
      setState({
        user: response.data,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });
      
      // Store user data in localStorage for quick access
      localStorage.setItem('user_data', JSON.stringify(response.data));
    } catch (error: any) {
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
      }
      setState({ user: null, isLoading: false, isAuthenticated: false, error: 'Session expired' });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const data = await apiService.login(email, password);
      
      if (data.access_token) {
        toast.success('Welcome back! 🎉');
        
        // Check if we need to redirect to a specific page
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        
        await checkAuth(false);
        navigate(from, { replace: true });
        return { success: true };
      }
      
      return { success: false, error: 'No access token received' };
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      toast.error(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [checkAuth, navigate, location]);

  const register = useCallback(async (userData: {
    email: string;
    password: string;
    full_name: string;
    preferred_currency: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await apiService.register(userData);
      toast.success('Account created successfully! 🎉');
      
      const loginResult = await login(userData.email, userData.password);
      return loginResult;
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [login]);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await apiService.logout();
      toast.info('Logged out successfully');
    } catch (error) {
      // Ignore logout errors but still clear local storage
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      });
      navigate('/login');
    }
  }, [navigate]);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const response = await apiService.updateUser(userData);
      setState(prev => ({
        ...prev,
        user: response.data,
      }));
      localStorage.setItem('user_data', JSON.stringify(response.data));
      return { success: true };
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Update failed. Please try again.';
      toast.error(errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }, []);

  const refreshUser = useCallback(() => {
    checkAuth(false);
  }, [checkAuth]);

  useEffect(() => {
    // Check auth on mount
    checkAuth();
    
    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(() => {
      const token = localStorage.getItem('access_token');
      if (token) {
        checkAuth(false);
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkAuth]);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    checkAuth,
  };
};