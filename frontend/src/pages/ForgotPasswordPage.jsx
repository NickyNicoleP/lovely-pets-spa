import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import PawSpaInputField from '../components/PawSpaInputField';
import PawSpaButton from '../components/PawSpaButton';
import PawSpaLogo from '../components/PawSpaLogo';
import Toast from '../components/Toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState('email'); // 'email', 'code', 'reset'
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const validateEmail = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Por favor ingresa un correo válido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.password = 'La contraseña es requerida';
    } else if (newPassword.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!validateEmail()) {
      setToast({ message: 'Por favor completa los campos correctamente', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setToast({ message: 'Se envió un código a tu correo electrónico', type: 'success' });
      setStep('code');
      setErrors({});
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al enviar el código. Intenta de nuevo.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!resetCode) {
      setToast({ message: 'Por favor ingresa el código', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/verify-reset-code`, { email, code: resetCode });
      setStep('reset');
      setToast({ message: 'Código verificado. Ingresa tu nueva contraseña.', type: 'success' });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Código incorrecto. Intenta de nuevo.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validatePassword()) {
      setToast({ message: 'Por favor completa los campos correctamente', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        code: resetCode,
        newPassword,
      });
      setToast({ message: 'Contraseña actualizada exitosamente', type: 'success' });
      setTimeout(() => navigate('/pawspa-login'), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al actualizar la contraseña. Intenta de nuevo.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pawspa-50 via-white to-pawspa-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pawspa-200 to-pawspa-100 rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pawspa-200 to-pawspa-100 rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md animate-slide-in-up relative z-10">
        {/* Logo */}
        <div className="mb-8">
          <PawSpaLogo size="lg" showText={true} />
        </div>

        {/* Reset Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-pawspa-100">
          {step === 'email' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-poppins text-center">
                Recuperar Contraseña
              </h2>
              <p className="text-center text-gray-600 text-sm mb-6">
                Ingresa tu correo y te enviaremos un código para reestablecerla
              </p>

              <form onSubmit={handleSendCode} className="space-y-5">
                <PawSpaInputField
                  label="Correo Electrónico"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  error={errors.email}
                  required
                />

                <PawSpaButton
                  fullWidth
                  loading={loading}
                  type="submit"
                >
                  Enviar Código
                </PawSpaButton>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-poppins text-center">
                Verificar Código
              </h2>
              <p className="text-center text-gray-600 text-sm mb-6">
                Ingresa el código que enviamos a tu correo
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-5">
                <input
                  type="text"
                  placeholder="000000"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full text-center text-3xl font-bold tracking-widest py-3 px-4 rounded-lg border-2 border-pawspa-200 focus:border-pawspa-500 focus:outline-none focus:ring-2 focus:ring-pawspa-100"
                />

                <PawSpaButton
                  fullWidth
                  loading={loading}
                  type="submit"
                >
                  Verificar
                </PawSpaButton>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 font-poppins text-center">
                Nueva Contraseña
              </h2>
              <p className="text-center text-gray-600 text-sm mb-6">
                Ingresa tu nueva contraseña
              </p>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <PawSpaInputField
                  label="Nueva Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  error={errors.password}
                  required
                  eyeIcon
                />

                <PawSpaInputField
                  label="Confirmar Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  error={errors.confirmPassword}
                  required
                  eyeIcon
                />

                <PawSpaButton
                  fullWidth
                  loading={loading}
                  type="submit"
                >
                  Actualizar Contraseña
                </PawSpaButton>
              </form>
            </>
          )}

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              to="/pawspa-login"
              className="inline-flex items-center gap-2 text-pawspa-600 hover:text-pawspa-700 font-medium transition-colors"
            >
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
