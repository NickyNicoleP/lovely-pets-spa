import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import useTokenRefresh from '../hooks/useTokenRefresh';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const tokenRefresh = useTokenRefresh(!!localStorage.getItem('accessToken'));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await api.get('/auth/profile');
        setUser(response.data?.user ?? response.data);
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data.requires2FA) {
      return { requires2FA: true, userId: response.data.userId, tempToken: response.data.tempToken };
    }
    
    const { accessToken, refreshToken, user: userData } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    return { success: true };
  };

  const verify2FA = async (userId, code) => {
    const response = await api.post('/auth/verify-2fa', { userId, code });
    const { accessToken, refreshToken, user: userData } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    return { success: true };
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateProfile = async (userData) => {
    const response = await api.put('/auth/profile', userData);
    const updatedUser = response.data?.user ?? response.data;
    setUser(updatedUser);
    return updatedUser;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2FA, register, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}