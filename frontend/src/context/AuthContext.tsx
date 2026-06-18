import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { User, UserRegister, UserLogin, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (data: UserRegister) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session from LocalStorage
  useEffect(() => {
    const fetchMe = async () => {
      const savedToken = localStorage.getItem('predictwise_token');
      if (savedToken) {
        try {
          setToken(savedToken);
          const response = await api.get<User>('/auth/me');
          setUser(response.data);
          localStorage.setItem('predictwise_user', JSON.stringify(response.data));
        } catch (error) {
          console.error("Failed to load user profile", error);
          logout();
        }
      }
      setLoading(false);
    };

    fetchMe();

    // Listen to global logout event triggered by API interceptor
    const handleLogout = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('predictwise_token');
      localStorage.removeItem('predictwise_user');
    };
    window.addEventListener('auth_logout', handleLogout);
    return () => window.removeEventListener('auth_logout', handleLogout);
  }, []);

  const login = async (credentials: UserLogin) => {
    setLoading(true);
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      const { access_token, user: loggedUser } = response.data;
      
      setToken(access_token);
      setUser(loggedUser);
      localStorage.setItem('predictwise_token', access_token);
      localStorage.setItem('predictwise_user', JSON.stringify(loggedUser));
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: UserRegister) => {
    setLoading(true);
    try {
      await api.post<User>('/auth/register', data);
      // After registration, automatically login
      await login({ email: data.email, password: data.password });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('predictwise_token');
    localStorage.removeItem('predictwise_user');
  };

  const isAdmin = user?.role === 'Admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
