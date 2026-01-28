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
    console.log('🔍 Checking authentication...');

    if (showLoading) {
      setState(prev => ({ ...prev, isLoading: true }));
    }

    const token = localStorage.getItem('access_token');

    if (!token) {
      console.log('❌ No token found');
      setState({ user: null, isLoading: false, isAuthenticated: false, error: null });
      return;
    }

    try {
      console.log('📡 Fetching user with token...');
      const response = await apiService.getCurrentUser();

      // CRITICAL FIX: Make sure we have the actual data
      const userData = response.data;

      console.log('✅ User data received:', userData);
      console.log('👤 Full name:', userData?.full_name);
      console.log('📧 Email:', userData?.email);

      if (!userData) {
        throw new Error('No user data in response');
      }

      setState({
        user: userData,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      });

      console.log('✅ Auth state updated');
    } catch (error: any) {
      console.error('❌ Failed to load user:', error);

      if (error.response?.status === 401) {
        console.log('🔒 Token expired, clearing...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
      }
      setState({ user: null, isLoading: false, isAuthenticated: false, error: 'Session expired' });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    console.log('🔐 Starting login for:', email);
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await apiService.login(email, password);

      console.log('📥 Login data:', data);

      if (data.access_token) {
        console.log('✅ Login successful, loading user data...');
        toast.success('Welcome back! 🎉');

        // CRITICAL: Wait for user data to load
        await checkAuth(false);

        // Verify user data loaded
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        console.log('✅ Verified user data:', userData);

        if (!userData.full_name) {
          console.warn('⚠️ User data loaded but no full_name!');
        }

        // Check if we need to redirect to a specific page
        const from = (location.state as any)?.from?.pathname || '/dashboard';

        navigate(from, { replace: true });
        return { success: true };
      }

      return { success: false, error: 'No access token received' };
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Login failed. Please check your credentials.';
      console.error('❌ Login failed:', errorMsg);
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