import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [email, setEmail] = useState('');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      setStatus('success');
      if (response.data.email) {
        setEmail(response.data.email);
      }
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'El token de verificación es inválido o ha expirado'
      );
      setStatus('error');
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;
    
    setResendLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setStatus('resend-sent');
    } catch (err) {
      setError(
        err.response?.data?.error || 
        'Error al reenviar el email de verificación'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.14),transparent_16%)] p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/95 rounded-[2rem] border border-white/70 shadow-2xl p-8 backdrop-blur-xl">
          
          {status === 'verifying' && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Verificando tu email...</h2>
                <p className="text-slate-600">Por favor espera mientras verificamos tu dirección de correo</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Email verificado!</h2>
                <p className="text-slate-600 mb-6">Tu cuenta está lista. Ahora puedes iniciar sesión.</p>
              </div>
              <Link to="/login" className="btn btn-primary w-full py-3 block text-center">
                Ir a Iniciar Sesión
              </Link>
            </>
          )}

          {status === 'resend-sent' && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Email reenviado</h2>
                <p className="text-slate-600 mb-6">Revisa tu bandeja de entrada para el nuevo enlace de verificación.</p>
              </div>
              <Link to="/login" className="btn btn-primary w-full py-3 block text-center">
                Volver al Login
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Error en verificación</h2>
                <p className="text-slate-600 mb-6">{error}</p>
              </div>
              {email && (
                <button
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                  className="btn btn-primary w-full py-3 mb-3"
                >
                  {resendLoading ? 'Reenviando...' : 'Reenviar email de verificación'}
                </button>
              )}
              <Link to="/login" className="btn btn-secondary w-full py-3 block text-center">
                Volver al Login
              </Link>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
