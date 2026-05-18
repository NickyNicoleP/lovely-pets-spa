import { useEffect, useState } from 'react';
import { notificacionesAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function Notificaciones() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read

  const { notifications: socketNotifications } = useSocket();

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    // Recargar cuando hay nuevas notificaciones por socket
    if (socketNotifications && socketNotifications.length > 0) {
      loadNotifications();
    }
  }, [socketNotifications]);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await notificacionesAPI.getAll();
      setNotifications(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError(err.response?.data?.error || 'Error al cargar notificaciones');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await notificacionesAPI.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error('Error marcando como leída:', err);
      setError(err.response?.data?.error || 'Error al marcar como leída');
    }
  };

  const markAllRead = async () => {
    try {
      // Marcar todos como leídos
      const unreadNotifications = filteredNotifications.filter(n => !n.leida);
      await Promise.all(unreadNotifications.map(n => notificacionesAPI.markRead(n.id)));
      loadNotifications();
    } catch (err) {
      console.error('Error marcando todos como leídos:', err);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.leida;
    if (filter === 'read') return n.leida;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notificaciones</h1>
          <p className="text-slate-600 mt-2">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todos los mensajes leídos'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={loadNotifications}
            className="btn btn-secondary flex-1 sm:flex-none"
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="btn btn-outline flex-1 sm:flex-none"
            >
              Marcar todo como leído
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 border-b border-slate-200">
        {['all', 'unread', 'read'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 border-b-2 transition ${
              filter === f
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {f === 'all' && 'Todas'}
            {f === 'unread' && `Sin leer (${unreadCount})`}
            {f === 'read' && `Leídas (${notifications.filter(n => n.leida).length})`}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="inline-flex animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
          <p className="mt-4 text-slate-600">Cargando notificaciones...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="text-lg font-medium text-slate-900 mb-1">
            {filter === 'unread' ? 'Sin notificaciones sin leer' : 'Sin notificaciones'}
          </h3>
          <p className="text-slate-600">
            {filter === 'unread' 
              ? 'Excelente, estás al día con todo' 
              : 'No hay notificaciones que mostrar'}
          </p>
        </div>
      )}

      {/* Notificaciones */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border p-4 transition-all ${
                notification.leida
                  ? 'border-slate-200 bg-white hover:border-slate-300'
                  : 'border-primary-200 bg-primary-50 hover:border-primary-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${
                      notification.leida ? 'text-slate-900' : 'text-primary-900'
                    }`}>
                      {notification.titulo}
                    </p>
                    {!notification.leida && (
                      <span className="inline-block w-2 h-2 bg-primary-500 rounded-full" />
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    notification.leida ? 'text-slate-600' : 'text-primary-800'
                  }`}>
                    {notification.cuerpo}
                  </p>
                  {notification.canal && (
                    <p className="text-xs text-slate-500 mt-2 capitalize">
                      {notification.canal}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">
                    {new Date(notification.created_at).toLocaleString('es-AR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {!notification.leida && (
                    <button
                      onClick={() => markRead(notification.id)}
                      className="mt-2 text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 transition"
                    >
                      Marcar leída
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
