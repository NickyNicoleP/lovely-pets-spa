import { useState, useEffect } from 'react';
import { whatsappAPI } from '../services/api';

export default function WhatsAppSection() {
  const [status, setStatus] = useState({
    isConnected: false,
    hasQrCode: false,
    messageCount: 0
  });
  const [qrCode, setQrCode] = useState(null);
  const [messageHistory, setMessageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWhatsAppStatus();
    // Refresh status every 5 seconds
    const interval = setInterval(loadWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadWhatsAppStatus = async () => {
    try {
      const statusRes = await whatsappAPI.getStatus();
      setStatus(statusRes.data);
      setError(null);

      // If disconnected, try to get QR code
      if (!statusRes.data.isConnected && statusRes.data.hasQrCode) {
        const qrRes = await whatsappAPI.getQrCode();
        setQrCode(qrRes.data.qrCode);
      } else {
        setQrCode(null);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading WhatsApp status:', err);
      setError(err.response?.data?.error || 'Error loading WhatsApp status');
      setLoading(false);
    }
  };

  const loadMessageHistory = async () => {
    try {
      const historyRes = await whatsappAPI.getMessageHistory(100);
      setMessageHistory(historyRes.data.messages);
    } catch (err) {
      console.error('Error loading message history:', err);
    }
  };

  const handleShowHistory = async () => {
    if (!showHistory) {
      await loadMessageHistory();
    }
    setShowHistory(!showHistory);
  };

  const handleReconnect = async () => {
    try {
      setLoading(true);
      await whatsappAPI.reconnect();
      // Wait a bit and reload status
      setTimeout(loadWhatsAppStatus, 2000);
    } catch (err) {
      console.error('Error reconnecting:', err);
      setError(err.response?.data?.error || 'Error reconnecting');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Estás seguro de que deseas desconectar WhatsApp?')) {
      return;
    }

    try {
      setLoading(true);
      await whatsappAPI.disconnect();
      setTimeout(loadWhatsAppStatus, 1000);
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(err.response?.data?.error || 'Error disconnecting');
      setLoading(false);
    }
  };

  if (loading && Object.keys(status).length === 0) {
    return <div className="text-center py-8">Cargando estado de WhatsApp...</div>;
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">WhatsApp Integration</h2>
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full ${
                status.isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className={status.isConnected ? 'text-green-600' : 'text-red-600'}>
              {status.isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* QR Code Section */}
        {qrCode && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="mb-4 font-semibold text-gray-700">
              📱 Escanea este código QR con tu teléfono WhatsApp para conectar:
            </p>
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-lg">
                <svg
                  width="200"
                  height="200"
                  viewBox={`0 0 ${200} ${200}`}
                  className="border-2 border-gray-300"
                >
                  <text
                    x="100"
                    y="100"
                    textAnchor="middle"
                    dy=".3em"
                    className="text-xs fill-gray-500"
                  >
                    QR Code
                  </text>
                </svg>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              El código será generado en la terminal del servidor. Comprueba la consola para ver la imagen QR.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleReconnect}
            disabled={status.isConnected || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Procesando...' : 'Reconectar'}
          </button>

          <button
            onClick={handleDisconnect}
            disabled={!status.isConnected || loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Procesando...' : 'Desconectar'}
          </button>

          <button
            onClick={handleShowHistory}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            {showHistory ? 'Ocultar' : 'Ver'} Historial ({status.messageCount})
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Estado de Conexión</p>
            <p className="text-2xl font-bold text-gray-800">
              {status.isConnected ? '✅ Activa' : '❌ Inactiva'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Mensajes Enviados</p>
            <p className="text-2xl font-bold text-gray-800">{status.messageCount}</p>
          </div>
        </div>

        {/* Message History */}
        {showHistory && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Historial de Mensajes</h3>
            {messageHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay mensajes aún</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messageHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded border border-gray-200 text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-800">{msg.to}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          msg.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{msg.message}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(msg.timestamp).toLocaleString('es-BO')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>📝 Nota:</strong> Los mensajes de WhatsApp se envían automáticamente cuando:
        </p>
        <ul className="text-sm text-gray-700 ml-4 mt-2 list-disc">
          <li>Se confirma una nueva cita</li>
          <li>Se completa una ficha de grooming y la mascota está lista para recoger</li>
          <li>Se alcanza un nivel crítico de stock en inventario (alerta admin)</li>
        </ul>
      </div>
    </div>
  );
}
