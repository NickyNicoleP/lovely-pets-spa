import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Perfil() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [perfilData, setPerfilData] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    telefono: user?.telefono || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [twoFAData, setTwoFAData] = useState({
    secret: '',
    qrCode: '',
    code: ''
  });

  const handlePerfilSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await updateProfile(perfilData);
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Contraseña cambiada correctamente' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      const response = await authAPI.setup2FA();
      setTwoFAData({
        ...twoFAData,
        secret: response.data.secret,
        qrCode: response.data.qrCode
      });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  const handleEnable2FA = async (e) => {
    e.preventDefault();
    try {
      await authAPI.enable2FA({ code: twoFAData.code });
      setMessage({ type: 'success', text: '2FA habilitado correctamente' });
      setTwoFAData({ ...twoFAData, code: '', secret: '', qrCode: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Ingresa tu contraseña para deshabilitar 2FA:');
    if (!password) return;
    
    try {
      await authAPI.disable2FA({ password });
      setMessage({ type: 'success', text: '2FA deshabilitado correctamente' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    }
  };

  return (
    <div>
      <div className="grid gap-4 mb-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-sm text-gray-600 mt-1">Actualiza tu información y gestiona la seguridad de tu cuenta.</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-500">Estado de seguridad</p>
            <p className="mt-3 text-lg font-semibold text-gray-900">{user?.two_factor_enabled ? '2FA habilitado' : '2FA deshabilitado'}</p>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {user?.two_factor_enabled
              ? 'Tus inicios de sesión están protegidos con código adicional.'
              : 'Activa 2FA para mayor protección de tu cuenta.'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('perfil')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'perfil'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Información Personal
        </button>
        <button
          onClick={() => setActiveTab('seguridad')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'seguridad'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Seguridad
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Perfil Tab */}
      {activeTab === 'perfil' && (
        <div className="card max-w-2xl">
          <form onSubmit={handlePerfilSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  className="input"
                  value={perfilData.nombre}
                  onChange={(e) => setPerfilData({ ...perfilData, nombre: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Apellido</label>
                <input
                  type="text"
                  className="input"
                  value={perfilData.apellido}
                  onChange={(e) => setPerfilData({ ...perfilData, apellido: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Email</label>
              <input
                type="email"
                className="input bg-gray-50"
                value={user?.email || ''}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
            </div>

            <div className="mb-4">
              <label className="label">Teléfono</label>
              <input
                type="tel"
                className="input"
                value={perfilData.telefono}
                onChange={(e) => setPerfilData({ ...perfilData, telefono: e.target.value })}
              />
            </div>

            <div className="mb-4">
              <label className="label">Rol</label>
              <input
                type="text"
                className="input bg-gray-50"
                value={user?.rol || ''}
                disabled
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      )}

      {/* Seguridad Tab */}
      {activeTab === 'seguridad' && (
        <div className="space-y-6 max-w-2xl">
          {/* Cambiar Contraseña */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Contraseña</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="label">Contraseña Actual</label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Nueva Contraseña</label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="label">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  className="input"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          </div>

          {/* 2FA */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Autenticación de Dos Factores (2FA)</h2>
            
            {user?.two_factor_enabled ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">2FA Habilitado</p>
                    <p className="text-sm text-gray-500">Tu cuenta está protegida con autenticación de dos factores</p>
                  </div>
                </div>
                <button
                  onClick={handleDisable2FA}
                  className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50"
                >
                  Deshabilitar
                </button>
              </div>
            ) : twoFAData.qrCode ? (
              <div>
                <div className="flex justify-center mb-4">
                  <img src={twoFAData.qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Escanea este código con tu aplicación autenticadora (Google Authenticator, Authy, etc.)
                </p>
                <p className="text-xs text-gray-400 mb-4 text-center">
                  Clave secreta: {twoFAData.secret}
                </p>
                <form onSubmit={handleEnable2FA}>
                  <div className="mb-4">
                    <label className="label">Código de verificación</label>
                    <input
                      type="text"
                      className="input text-center text-xl tracking-widest"
                      placeholder="000000"
                      value={twoFAData.code}
                      onChange={(e) => setTwoFAData({ ...twoFAData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      maxLength={6}
                      required
                    />
                  </div>
                  <button type="submit" disabled={twoFAData.code.length !== 6} className="btn btn-primary w-full">
                    Habilitar 2FA
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">2FA Deshabilitado</p>
                    <p className="text-sm text-gray-500">Agrega una capa extra de seguridad a tu cuenta</p>
                  </div>
                </div>
                <button onClick={() => navigate('/setup-2fa')} className="btn btn-primary">
                  Configurar 2FA
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}