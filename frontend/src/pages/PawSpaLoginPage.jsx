import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PawSpaInputField from '../components/PawSpaInputField';
import PawSpaButton from '../components/PawSpaButton';
import PawSpaLogo from '../components/PawSpaLogo';
import PawSpaCheckbox from '../components/PawSpaCheckbox';
import PawSpaDecorative from '../components/PawSpaDecorative';
import Toast from '../components/Toast';
import useRememberMe from '../hooks/useRememberMe';

export default function PawSpaLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState('');
  const [code2FA, setCode2FA] = useState('');

  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();
  const { savedEmail, rememberMe: hasSavedEmail, saveEmail, clearEmail } = useRememberMe('pawspa_email');

  // Load saved email on mount
  useEffect(() => {
    if (hasSavedEmail && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [hasSavedEmail, savedEmail]);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Por favor ingresa un correo válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login submission
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setToast({ message: 'Por favor completa los campos correctamente', type: 'error' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await login(email, password);
      
      if (result.requires2FA) {
        setUserId(result.userId);
        setShow2FA(true);
        setToast({ message: 'Ingresa tu código 2FA', type: 'info' });
      } else if (result.success) {
        // Save email if remember me is checked
        if (rememberMe) {
          saveEmail(email);
        } else {
          clearEmail();
        }
        
        setToast({ message: '¡Bienvenido de vuelta a PawSpa! 🐾', type: 'success' });
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al iniciar sesión. Intenta de nuevo.';
      setToast({ message: errorMessage, type: 'error' });
      setErrors({ form: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification
  const handle2FASubmit = async (e) => {
    e.preventDefault();
    
    if (!code2FA || code2FA.length !== 6) {
      setToast({ message: 'Por favor ingresa un código válido de 6 dígitos', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      await verify2FA(userId, code2FA);
      setToast({ message: '¡Verificación completada! 🎉', type: 'success' });
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Código incorrecto. Intenta de nuevo.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth (placeholder - implement with actual OAuth providers)
  const handleOAuth = (provider) => {
    setToast({ message: `Login con ${provider} - Próximamente disponible 🚀`, type: 'info' });
    // TODO: Implement actual OAuth integration
  };

  // 2FA View
  if (show2FA) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pawspa-50 via-white to-pawspa-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-slide-in-up">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-pawspa-100">
            <PawSpaLogo size="md" showText={false} />
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mt-6 mb-2 font-poppins">
              Verificación 2FA
            </h2>
            <p className="text-center text-gray-600 mb-6 text-sm">
              Ingresa el código de 6 dígitos de tu autenticador
            </p>

            {errors.form && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {errors.form}
              </div>
            )}

            <form onSubmit={handle2FASubmit}>
              <input
                type="text"
                placeholder="000000"
                value={code2FA}
                onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength="6"
                className="w-full text-center text-4xl font-bold tracking-widest py-4 px-4 rounded-lg border-2 border-pawspa-200 focus:border-pawspa-500 focus:outline-none focus:ring-2 focus:ring-pawspa-100 mb-6"
              />

              <PawSpaButton
                fullWidth
                loading={loading}
                onClick={handle2FASubmit}
              >
                Verificar Código
              </PawSpaButton>
            </form>

            <button
              onClick={() => {
                setShow2FA(false);
                setCode2FA('');
                setErrors({});
              }}
              className="w-full mt-4 text-gray-600 hover:text-pawspa-600 font-medium text-sm transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

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

  // Main Login View
  return (
    <div className="min-h-screen bg-gradient-to-br from-pawspa-50 via-white to-pawspa-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-pawspa-200 to-pawspa-100 rounded-full opacity-20 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pawspa-200 to-pawspa-100 rounded-full opacity-20 blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full relative z-10">
        {/* Left side - Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md animate-slide-in-up">
            {/* Logo */}
            <div className="mb-8">
              <PawSpaLogo size="lg" showText={true} />
              <p className="text-center text-gray-600 text-sm mt-4 font-poppins">
                Diseñado para administrar tu spa canino con estilo
              </p>
            </div>

            {/* Login Card */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-pawspa-100 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-poppins text-center">
                Bienvenido de Vuelta
              </h2>

              {/* Form Error */}
              {errors.form && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <span>⚠</span>
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Email Input */}
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
                  autoComplete="email"
                  icon={() => (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                />

                {/* Password Input */}
                <PawSpaInputField
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  error={errors.password}
                  required
                  eyeIcon
                  autoComplete="current-password"
                  icon={() => (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                />

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <PawSpaCheckbox
                    label="Recuérdame"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <Link
                    to="/forgot-password"
                    className="text-sm text-pawspa-600 hover:text-pawspa-700 font-medium transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {/* Login Button */}
                <PawSpaButton
                  fullWidth
                  size="md"
                  loading={loading}
                  onClick={handleLogin}
                  type="submit"
                >
                  Iniciar Sesión
                </PawSpaButton>
              </form>

              {/* Separator */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-600 font-poppins font-medium">
                    o continuar con
                  </span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {/* Google */}
                <PawSpaButton
                  variant="social"
                  size="sm"
                  onClick={() => handleOAuth('Google')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </PawSpaButton>

                {/* Facebook */}
                <PawSpaButton
                  variant="social"
                  size="sm"
                  onClick={() => handleOAuth('Facebook')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </PawSpaButton>

                {/* Apple */}
                <PawSpaButton
                  variant="social"
                  size="sm"
                  onClick={() => handleOAuth('Apple')}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.08 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.61-2.53 3.44l-.87.07z" />
                  </svg>
                </PawSpaButton>
              </div>

              {/* Sign Up Link */}
              <p className="text-center text-gray-600 text-sm font-poppins">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/register"
                  className="text-pawspa-600 hover:text-pawspa-700 font-bold transition-colors"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>

            {/* Footer Links */}
            <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
              <Link to="#" className="hover:text-pawspa-600 transition-colors">
                Términos de uso
              </Link>
              <span>•</span>
              <Link to="#" className="hover:text-pawspa-600 transition-colors">
                Privacidad
              </Link>
              <span>•</span>
              <Link to="#" className="hover:text-pawspa-600 transition-colors">
                Contacto
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Decorative (Desktop only) */}
        <PawSpaDecorative />
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
