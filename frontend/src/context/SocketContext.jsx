import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      notifications: [],
      toastMessages: [],
      clearNotifications: () => {},
      removeToast: () => {},
    };
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [toastMessages, setToastMessages] = useState([]);

  const addToast = (message, title = 'Notificación', type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast = { id, title, message, type };
    setToastMessages((prev) => [newToast, ...prev]);

    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  };

  const removeToast = (toastId) => {
    setToastMessages((prev) => prev.filter((toast) => toast.id !== toastId));
  };

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
        setNotifications(prev => [data, ...prev]);
        addToast('Se ha creado una nueva reserva', 'Nueva cita', 'success');
      });
      newSocket.on('ficha_completada', (data) => {
        console.log('📬 Ficha completada:', data);
        setNotifications(prev => [data, ...prev]);
        addToast('Se completó una ficha de grooming', 'Grooming finalizado', 'success');
      });
      newSocket.on('recordatorio_cita', (data) => {
        console.log('⏰ Recordatorio de cita:', data);
        setNotifications(prev => [data, ...prev]);
        addToast(data.cuerpo || 'Te recordamos que tienes una cita pronto', data.titulo || 'Recordatorio de cita', 'info');
      });
      newSocket.on('stock_alert', (data) => {
        console.log('⚠️ Alerta de stock:', data);
        setNotifications(prev => [data, ...prev]);
        addToast(data.cuerpo || 'Stock bajo en un producto', data.titulo || 'Alerta de inventario', 'warning');
      });
      newSocket.on('new_notification', (data) => {
        console.log('🔔 Nueva notificación:', data);
        setNotifications(prev => [data, ...prev]);
        addToast(data.cuerpo || 'Tienes una nueva notificación', data.titulo || 'Notificación', 'info');
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
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        toastMessages,
        clearNotifications,
        removeToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};