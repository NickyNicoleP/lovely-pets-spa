import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import SessionWarningModal from './components/SessionWarningModal';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthPage from './pages/AuthPage';
import PawSpaLoginPage from './pages/PawSpaLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import Grooming from './pages/Grooming';
import Caja from './pages/Caja';
import GroomingFicha from './pages/GroomingFicha';
import Productos from './pages/Productos';
import Inventario from './pages/Inventario';
import Carrito from './pages/Carrito';
import Notificaciones from './pages/Notificaciones';
import Reportes from './pages/Reportes';
import Perfil from './pages/Perfil';
import Setup2FA from './pages/Setup2FA';
import Admin from './pages/Admin';
import GroomersManagement from './pages/GroomersManagement';
import Layout from './components/Layout';
import MascotaNueva from './pages/Cliente/MascotaNueva';
import MascotasCliente from './pages/Cliente/MascotasCliente';
import MisCitas from './pages/Cliente/MisCitas';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  const isAdmin = user && (user.rol === 'admin' || user.rol === 'administrador');
  return isAdmin ? children : <Navigate to="/" />;
}

function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const normalizedRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const hasAccess = user && normalizedRoles.includes(user.rol);
  return hasAccess ? children : <Navigate to="/" />;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/pawspa-login" element={<PawSpaLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="agenda" element={
          <RoleRoute allowedRoles={['admin', 'administrador', 'empleado', 'veterinario']}>
            <Agenda />
          </RoleRoute>
        } />
        <Route path="caja" element={
          <RoleRoute allowedRoles={['admin', 'administrador', 'empleado']}>
            <Caja />
          </RoleRoute>
        } />
        <Route path="grooming" element={
          <RoleRoute allowedRoles={['admin', 'administrador', 'empleado', 'groomer']}>
            <Grooming />
          </RoleRoute>
        } />
        <Route path="grooming/editar-disponibilidad" element={
          <RoleRoute allowedRoles={['admin', 'administrador', 'empleado']}>
            <GroomersManagement />
          </RoleRoute>
        } />
        <Route path="grooming/ficha/:id" element={
          <RoleRoute allowedRoles={['admin', 'administrador', 'empleado', 'groomer']}>
            <GroomingFicha />
          </RoleRoute>
        } />
        <Route path="mascotas/nueva" element={
          <RoleRoute allowedRoles={['cliente']}>
            <MascotaNueva />
          </RoleRoute>
        } />
        <Route path="mis-mascotas" element={
          <RoleRoute allowedRoles={['cliente']}>
            <MascotasCliente />
          </RoleRoute>
        } />
        <Route path="mis-citas" element={
          <RoleRoute allowedRoles={['cliente']}>
            <MisCitas />
          </RoleRoute>
        } />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={
          <RoleRoute allowedRoles={['admin', 'administrador']}>
            <Inventario />
          </RoleRoute>
        } />
        <Route path="carrito" element={
          <RoleRoute allowedRoles={['cliente']}>
            <Carrito />
          </RoleRoute>
        } />
        <Route path="notificaciones" element={<Notificaciones />} />
        <Route path="reportes" element={
          <RoleRoute allowedRoles={['admin', 'administrador', 'empleado', 'groomer', 'veterinario', 'cliente']}>
            <Reportes />
          </RoleRoute>
        } />
        <Route path="perfil" element={<Perfil />} />
        <Route path="setup-2fa" element={<Setup2FA />} />
        <Route path="admin" element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <SessionWarningModal />
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;