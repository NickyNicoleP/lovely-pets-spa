import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SessionWarningModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const { logout } = useAuth();

  useEffect(() => {
    const handleSessionWarning = () => {
      setIsOpen(true);
      setTimeLeft(60);
    };

    window.addEventListener('sessionWarning', handleSessionWarning);
    
    return () => {
      window.removeEventListener('sessionWarning', handleSessionWarning);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    window.location.href = '/login';
  };

  const handleStayLoggedIn = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="session-warning-title" aria-describedby="session-warning-desc" className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h2 id="session-warning-title" className="text-2xl font-bold text-slate-900 mb-2">Sesión por expirar</h2>
        <p id="session-warning-desc" className="text-slate-600 mb-6">
          Por inactividad, tu sesión se cerrará en <strong>{timeLeft} segundos</strong>. 
          ¿Deseas continuar?
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleStayLoggedIn}
            className="btn btn-primary w-full py-3"
          >
            Continuar sesión
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-secondary w-full py-3"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
