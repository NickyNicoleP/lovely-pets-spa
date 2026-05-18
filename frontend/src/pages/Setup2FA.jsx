import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import LovelyPetsLogo from '../components/LovelyPetsLogo';

export default function Setup2FA() {
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: Generar QR, 2: Verificar código

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.setup2FA();
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep(1);
    } catch (err) {
      setError('Error al generar QR: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await authAPI.enable2FA({ code: verificationCode });
      setSuccess(true);
      setStep(3);
    } catch (err) {
      setError('Código inválido: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
        <div className="max-w-md w-full">
          <div className="glass-card text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">¡Configuración Exitosa!</h2>
            <p className="text-gray-600 mb-6">Tu 2FA ha sido configurado correctamente. Tu cuenta está protegida.</p>
            <a href="/" className="btn btn-primary w-full">
              Ir al Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 p-4">
      <div className="max-w-md w-full">
        <div className="glass-card">
          {/* Header */}
          <div className="text-center mb-8">
            <LovelyPetsLogo size="md" />
            <h1 className="text-3xl font-bold text-primary-700 mt-4">Configurar 2FA</h1>
            <p className="text-gray-600 mt-2">Protege tu cuenta con autenticación de dos factores</p>
          </div>

          {/* Step Indicator */}
          <div className="flex gap-2 mb-8">
            <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
            <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Paso 1: Instala una app</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Descarga una aplicación de autenticador en tu teléfono:
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">✅ Google Authenticator</p>
                  <p className="text-xs text-gray-500">✅ Microsoft Authenticator</p>
                  <p className="text-xs text-gray-500">✅ Authy</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Paso 2: Escanea este código QR</h3>
                {qrCode ? (
                  <div className="flex justify-center">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48 border-2 border-primary-200 rounded-lg p-2 bg-white" />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                    <span className="text-gray-500">Generando QR...</span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">O copia este código manualmente:</h3>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm text-center break-all select-all cursor-pointer hover:bg-gray-200 transition-colors">
                  {secret || 'Generando...'}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  (Selecciona y copia si lo necesitas)
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!qrCode || loading}
                className="btn btn-primary w-full"
              >
                Continuaré →
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Paso 3: Verifica el código</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Abre tu aplicación de autenticador y ingresa el código de 6 dígitos que ves:
                </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="label">Código de 6 dígitos</label>
                  <input
                    type="text"
                    className="input text-center text-3xl tracking-[0.35em] font-bold"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || verificationCode.length !== 6}
                  className="btn btn-primary w-full py-3"
                >
                  {loading ? 'Verificando...' : 'Verificar y Activar 2FA'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline w-full"
                >
                  ← Volver atrás
                </button>
              </form>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Importante:</strong> Asegúrate de ingresar el código correcto. Una vez habilitado, necesitarás tu autenticador para acceder.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
