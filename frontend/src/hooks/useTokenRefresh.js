import { useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const useTokenRefresh = (enabled = true) => {
  const refreshTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Refresh token every 14 minutes (840 seconds)
    // Access token expires in 15 minutes, so refresh before expiry
    const REFRESH_INTERVAL = 14 * 60 * 1000;
    
    // Show warning at 29 minutes inactivity (before 30 min auto-logout)
    const WARNING_INTERVAL = 29 * 60 * 1000;
    
    // Check for inactivity and reset timers on user activity
    const handleUserActivity = () => {
      // Reset refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      refreshTimerRef.current = setInterval(refreshAccessToken, REFRESH_INTERVAL);
      
      // Reset warning timer
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current);
      }
      warningTimerRef.current = setInterval(() => {
        // Show modal warning before logout
        const event = new CustomEvent('sessionWarning');
        window.dispatchEvent(event);
      }, WARNING_INTERVAL);
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });

    // Initial setup
    handleUserActivity();

    // Cleanup
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [enabled, refreshAccessToken]);

  return refreshAccessToken;
};

export default useTokenRefresh;
