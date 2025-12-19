/**
 * Authentication Context
 * Based on React Context API best practices and JWT authentication patterns
 * Source: React official docs, Reddit r/reactjs, Stack Overflow
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient, type ApiError } from '../utils/api';

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = apiClient.getAccessToken();
      if (token) {
        try {
          // Verify token is still valid by fetching user profile
          const userData = await apiClient.get<{ user: User }>('/api/auth/me');
          setUser(userData.user);
        } catch {
          // Token is invalid, clear it
          apiClient.clearTokens();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        user: User;
        access_token: string;
        refresh_token: string;
      }>('/api/auth/login', { email, password });

      apiClient.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<{
        user: User;
        access_token: string;
        refresh_token: string;
      }>('/api/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName
      });

      apiClient.setTokens(response.access_token, response.refresh_token);
      setUser(response.user);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.clearTokens();
    setUser(null);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

