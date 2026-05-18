import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      notifications: [],
      clearNotifications: () => {}
    };
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    
    // Solo conectar si hay token
    if (!token) {
      console.log('⚠️ Sin token, Socket.io deshabilitado');
      return;
    }
    
    try {
      // Conectar a Socket.io en el mismo servidor del backend
      const socketURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      console.log(`🔌 Conectando a Socket.io en ${socketURL}`);
      
      const newSocket = io(socketURL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✓ Socket.io conectado');
      });
      newSocket.on('disconnect', () => {
        console.log('✗ Socket.io desconectado');
      });
      newSocket.on('error', (error) => {
        console.error('Socket.io error:', error);
      });

      newSocket.on('nueva_cita', (data) => {
        console.log('📬 Nueva cita:', data);
        setNotifications(prev => [`Nueva cita: ${data.mascota}`, ...prev]);
      });
      newSocket.on('ficha_completada', (data) => {
        console.log('📬 Ficha completada:', data);
        setNotifications(prev => [`Ficha completada para ${data.mascota}`, ...prev]);
      });

      return () => {
        newSocket.disconnect();
      };
    } catch (error) {
      console.warn('⚠️ Error conectando Socket.io:', error);
    }
  }, []);

  const clearNotifications = () => setNotifications([]);

  return (
    <SocketContext.Provider value={{ socket, notifications, clearNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};