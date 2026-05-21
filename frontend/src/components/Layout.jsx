import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LovelyPetsLogo from './LovelyPetsLogo';
import Toast from './Toast';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', label: 'Dashboard' },
    { path: '/agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Agenda' },
    { path: '/grooming', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', label: 'Grooming' },
    { path: '/productos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', label: 'Productos' },
    { path: '/carrito', icon: 'M3 3h18v2H3V3zm0 6h18v2H3V9zm0 6h18v2H3v-2zm0 6h18v2H3v-2z', label: 'Tienda' },
    { path: '/notificaciones', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1h6z', label: 'Notificaciones' },
    ...(user?.rol === 'admin' ? [{ path: '/admin', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Admin' }] : [])
  ];

  const { toastMessages, removeToast } = useSocket();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-primary-50 to-pink-50 border-r-2 border-primary-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center py-6 border-b-2 border-primary-200">
            <LovelyPetsLogo size="md" />
            <p className="mt-2 text-xs font-semibold text-primary-600 tracking-widest">LOVELY PETS SPA</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-md'
                      : 'text-gray-700 hover:bg-primary-100/50 hover:text-primary-700'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t-2 border-primary-200 bg-gradient-to-b from-pink-50 to-primary-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold">
                  {user?.nombre?.charAt(0)}{user?.apellido?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <NavLink
                to="/perfil"
                className="flex-1 px-3 py-2 text-sm text-center font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
              >
                Perfil
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex-1 px-3 py-2 text-sm text-center font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-gradient-to-r from-primary-500 via-primary-500 to-primary-600 border-b-2 border-primary-700 h-16 shadow-lg">
          <div className="flex items-center justify-between h-full px-4 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-primary-600 text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <span className="text-sm text-white font-medium">
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Toast notifications */}
        <div className="fixed top-24 right-4 z-50 flex w-full max-w-sm flex-col gap-3">
          {toastMessages.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}