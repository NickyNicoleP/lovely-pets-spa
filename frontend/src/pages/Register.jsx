import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    rol: 'cliente'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(true);
  const [captchaError, setCaptchaError] = useState('');
  
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!captchaAnswer.trim()) {
      setError('Responde al captcha antes de continuar');
      return;
    }

    setLoading(true);

    try {
      await register({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        password: formData.password,
        rol: formData.rol,
        captchaToken,
        captchaAnswer
      });
      setSuccess(true);
    } catch (err) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      if (message.toLowerCase().includes('captcha')) {
        loadCaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCaptcha = async () => {
    setCaptchaLoading(true);
    setCaptchaError('');
    try {
      const response = await api.get('/auth/captcha');
      setCaptchaQuestion(response.data.question);
      setCaptchaToken(response.data.captchaToken);
      setCaptchaAnswer('');
    } catch (err) {
      console.error('Error cargando captcha:', err);
      setCaptchaError('No se pudo cargar el captcha. Intenta recargar.');
      setCaptchaQuestion('Captcha');
      setCaptchaToken('');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.14),transparent_16%)] p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/95 rounded-[2rem] border border-white/70 shadow-2xl p-8 text-center backdrop-blur-xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Registro exitoso!</h2>
            <p className="text-slate-600 mb-6">Tu cuenta se creó correctamente y ya puedes iniciar sesión.</p>
            <Link to="/login" className="btn btn-primary w-full py-3">
              Ir a Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.14),transparent_16%)] p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/95 rounded-[2rem] border border-white/70 shadow-2xl p-8 backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Crear Cuenta</h1>
            <p className="text-slate-600 mt-2">Únete a PawSpa y gestiona tu negocio con estilo.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="label">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  className="input"
                  placeholder="Juan"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="label">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  className="input"
                  placeholder="Pérez"
                  value={formData.apellido}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                className="input"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-4">
              <label className="label">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                className="input"
                placeholder="+54 9 11 1234 5678"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="label">Tipo de cuenta</label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                Cliente
              </div>
            </div>

            <div className="mb-4">
              <label className="label">{captchaQuestion || 'Captcha'}</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="Respuesta"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  required
                  disabled={captchaLoading}
                />
                <button
                  type="button"
                  onClick={loadCaptcha}
                  className="btn btn-outline w-full sm:w-auto"
                >
                  Recargar
                </button>
              </div>
              {captchaLoading && (
                <p className="text-xs text-gray-500 mt-2">Cargando captcha...</p>
              )}
              {captchaError && (
                <p className="text-xs text-red-600 mt-2">{captchaError}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="label">Contraseña</label>
              <input
                type="password"
                name="password"
                className="input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <PasswordStrengthIndicator password={formData.password} showCriteria={true} />
            </div>

            <div className="mb-6">
              <label className="label">Confirmar Contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                className="input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || captchaLoading || !captchaToken}
              className="btn btn-primary w-full py-3"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}