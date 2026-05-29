import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [userId, setUserId] = useState('');
  const [code2FA, setCode2FA] = useState('');
  
  const { login, register, verify2FA } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);
      
      if (result.requires2FA) {
        setUserId(result.userId);
        setShow2FA(true);
      } else if (result.success) {
        setSuccess('¡Bienvenido de vuelta!');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error en el login. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await register(signupUsername, signupEmail, signupPassword);
      setSuccess('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => navigate('/verify-email'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Error en el registro. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2FA(userId, code2FA);
      setSuccess('¡Verificación exitosa!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Código incorrecto.');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Verification screen
  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 via-pink-100 to-orange-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/30">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-900">¡Seguridad Confirmada!</h2>
              <p className="text-slate-600 mt-2 text-sm">Ingresa el código de 6 dígitos de tu autenticador</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-2xl text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-2xl text-green-700 text-sm font-medium">
                {success}
              </div>
            )}

            <form onSubmit={handle2FASubmit}>
              <div className="mb-6">
                <input
                  type="text"
                  className="w-full text-center text-4xl tracking-[0.5em] font-bold py-4 px-4 rounded-2xl border-2 border-rose-200 bg-rose-50/50 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 transition-all"
                  placeholder="000000"
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || code2FA.length !== 6}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold py-3 px-6 rounded-full hover:from-rose-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>
            </form>

            <button
              onClick={() => {
                setShow2FA(false);
                setCode2FA('');
                setError('');
              }}
              className="w-full mt-4 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-200 via-pink-100 to-orange-100 p-4">
      <div className="w-full max-w-5xl">
        {/* Main Auth Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-xl border border-white/30">
          
          {/* LEFT PANEL - "OMG, Hi!" Login CTA */}
          <div 
            className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-rose-500 to-rose-700 relative overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)',
              backgroundBlendMode: 'overlay'
            }}
          >
            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/5 rounded-full"></div>

            <div className="relative z-10 text-center max-w-sm">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
                ¡Hola!
              </h2>
              <p className="text-lg md:text-xl text-white/90 font-medium leading-relaxed mb-8 drop-shadow">
                Únete a nuestro spa de mascotas y descubre el mejor cuidado para tu peludo
              </p>
              
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="inline-block px-8 py-3 bg-white text-rose-600 font-bold rounded-full hover:bg-rose-50 transition-all duration-300 hover:shadow-lg transform hover:scale-105 border-2 border-white"
              >
                {isLogin ? 'REGISTRARSE' : 'INICIAR SESIÓN'}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL - Login/Signup Form */}
          <div className="p-8 md:p-12 lg:p-12 flex flex-col justify-center">
            {/* Mobile toggle */}
            <div className="lg:hidden flex justify-center gap-4 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  isLogin 
                    ? 'bg-rose-600 text-white shadow-lg' 
                    : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                }`}
              >
                INICIAR SESIÓN
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  !isLogin 
                    ? 'bg-rose-600 text-white shadow-lg' 
                    : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                }`}
              >
                REGISTRARSE
              </button>
            </div>

            {isLogin ? (
              /* LOGIN FORM */
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
                  BIENVENIDO
                </h1>
                <p className="text-slate-500 mb-8 font-medium">Inicia sesión con tu cuenta</p>

                {error && (
                  <div className="mb-4 p-4 bg-red-100 border-2 border-red-300 rounded-2xl text-red-700 font-medium text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-100 border-2 border-green-300 rounded-2xl text-green-700 font-medium text-sm">
                    {success}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div className="mb-5">
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-rose-50 border-2 border-rose-200 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100 placeholder-slate-400 font-medium text-slate-700 transition-all"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-rose-50 border-2 border-rose-200 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100 placeholder-slate-400 font-medium text-slate-700 transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold py-4 px-6 rounded-full hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-lg"
                  >
                    {loading ? 'Ingresando...' : 'INICIAR SESIÓN'}
                  </button>
                </form>

                <div className="mt-6 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-rose-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-slate-600 font-semibold">O</span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-center text-slate-600 font-medium mb-4">Conecta con tu cuenta</p>
                  <div className="flex justify-center gap-4">
                    {/* Apple */}
                    <button className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-all hover:scale-110 shadow-md">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.08 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.61-2.53 3.44l-.87.07z"/>
                      </svg>
                    </button>

                    {/* Google */}
                    <button className="w-12 h-12 rounded-full bg-white border-2 border-rose-300 text-rose-600 flex items-center justify-center hover:bg-rose-50 transition-all hover:scale-110 shadow-md font-bold text-lg">
                      G
                    </button>

                    {/* LinkedIn */}
                    <button className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 shadow-md">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.814 0-9.737h3.554v1.378c.43-.664 1.195-1.61 2.905-1.61 2.121 0 3.71 1.385 3.71 4.362v5.607zM5.337 8.855c-1.144 0-1.915-.762-1.915-1.715 0-.955.77-1.715 1.959-1.715 1.188 0 1.915.76 1.932 1.715 0 .953-.744 1.715-1.976 1.715zm1.946 11.597H3.392v-9.737h3.891v9.737zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-center text-slate-600 mt-6 font-medium">
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-rose-600 font-bold hover:text-rose-700 underline"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            ) : (
              /* SIGNUP FORM */
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2">
                  REGISTRARSE
                </h1>
                <p className="text-slate-500 mb-8 font-medium">Crea tu cuenta para comenzar</p>

                {error && (
                  <div className="mb-4 p-4 bg-red-100 border-2 border-red-300 rounded-2xl text-red-700 font-medium text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-100 border-2 border-green-300 rounded-2xl text-green-700 font-medium text-sm">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSignup}>
                  <div className="mb-5">
                    <input
                      type="text"
                      placeholder="Usuario"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-rose-50 border-2 border-rose-200 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100 placeholder-slate-400 font-medium text-slate-700 transition-all"
                      required
                    />
                  </div>

                  <div className="mb-5">
                    <input
                      type="email"
                      placeholder="Correo electrónico"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-rose-50 border-2 border-rose-200 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100 placeholder-slate-400 font-medium text-slate-700 transition-all"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <input
                      type="password"
                      placeholder="Contraseña"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl bg-rose-50 border-2 border-rose-200 focus:border-rose-400 focus:outline-none focus:ring-4 focus:ring-rose-100 placeholder-slate-400 font-medium text-slate-700 transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold py-4 px-6 rounded-full hover:from-rose-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-lg"
                  >
                    {loading ? 'Registrando...' : 'REGISTRARSE'}
                  </button>
                </form>

                <div className="mt-6 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-rose-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-white text-slate-600 font-semibold">O</span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-center text-slate-600 font-medium mb-4">Conecta con tu cuenta</p>
                  <div className="flex justify-center gap-4">
                    {/* Apple */}
                    <button className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-900 transition-all hover:scale-110 shadow-md">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.08 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.61-2.53 3.44l-.87.07z"/>
                      </svg>
                    </button>

                    {/* Google */}
                    <button className="w-12 h-12 rounded-full bg-white border-2 border-rose-300 text-rose-600 flex items-center justify-center hover:bg-rose-50 transition-all hover:scale-110 shadow-md font-bold text-lg">
                      G
                    </button>

                    {/* LinkedIn */}
                    <button className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-110 shadow-md">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.722-2.004 1.418-.103.249-.129.597-.129.946v5.441h-3.554s.05-8.814 0-9.737h3.554v1.378c.43-.664 1.195-1.61 2.905-1.61 2.121 0 3.71 1.385 3.71 4.362v5.607zM5.337 8.855c-1.144 0-1.915-.762-1.915-1.715 0-.955.77-1.715 1.959-1.715 1.188 0 1.915.76 1.932 1.715 0 .953-.744 1.715-1.976 1.715zm1.946 11.597H3.392v-9.737h3.891v9.737zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-center text-slate-600 mt-6 font-medium">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-rose-600 font-bold hover:text-rose-700 underline"
                  >
                    Inicia sesión aquí
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
