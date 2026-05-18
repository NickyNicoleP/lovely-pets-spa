import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Estados para usuarios
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState('');
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);

  const [userFormData, setUserFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: 'cliente',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Verificar que sea admin
  if (user && user.rol !== 'admin') {
    return <Navigate to="/" />;
  }

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers('');
    try {
      const response = await authAPI.getUsers();
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Error al cargar usuarios';
      setErrorUsers(errorMsg);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!userFormData.nombre || !userFormData.email || !userFormData.password) {
      setFormError('Nombre, email y contraseña son requeridos');
      return;
    }

    setFormLoading(true);
    try {
      await authAPI.createUser(userFormData);
      setShowCreateUserForm(false);
      setUserFormData({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        rol: 'cliente',
        password: ''
      });
      loadUsers();
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Error al crear usuario';
      setFormError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await authAPI.updateUserRole(userId, { rol: newRole });
      loadUsers();
    } catch (error) {
      setErrorUsers(error.response?.data?.error || 'Error actualizando rol');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await authAPI.updateUserStatus(userId, { activo: !currentStatus });
      loadUsers();
    } catch (error) {
      setErrorUsers(error.response?.data?.error || 'Error actualizando estado');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    try {
      await authAPI.deleteUser(userId);
      loadUsers();
    } catch (error) {
      setErrorUsers(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const getRoleColor = (rol) => {
    const colors = {
      'admin': 'bg-red-100 text-red-800',
      'veterinario': 'bg-blue-100 text-blue-800',
      'empleado': 'bg-green-100 text-green-800',
      'groomer': 'bg-purple-100 text-purple-800',
      'cliente': 'bg-slate-100 text-slate-800'
    };
    return colors[rol] || 'bg-slate-100 text-slate-800';
  };

  const roleLabels = {
    'admin': 'Administrador',
    'veterinario': 'Veterinario',
    'empleado': 'Empleado',
    'groomer': 'Groomer',
    'cliente': 'Cliente'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Panel de Administración</h1>
        <p className="text-slate-600 mt-2">Gestión de usuarios y configuración del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 border-b-2 font-medium transition ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 border-b-2 font-medium transition ${
              activeTab === 'settings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Configuración
          </button>
        </nav>
      </div>

      {/* Usuarios Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-900">Gestión de Usuarios</h2>
            <button
              onClick={() => setShowCreateUserForm(true)}
              className="btn btn-primary"
            >
              + Crear Usuario
            </button>
          </div>

          {/* Error */}
          {errorUsers && (
            <ErrorMessage
              message={errorUsers}
              type="error"
              onClose={() => setErrorUsers('')}
            />
          )}

          {/* Formulario de Crear Usuario */}
          {showCreateUserForm && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Crear Nuevo Usuario</h3>

              {formError && (
                <ErrorMessage
                  message={formError}
                  type="error"
                  onClose={() => setFormError('')}
                />
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nombre</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Juan"
                      value={userFormData.nombre}
                      onChange={(e) => setUserFormData({ ...userFormData, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Apellido</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Pérez"
                      value={userFormData.apellido}
                      onChange={(e) => setUserFormData({ ...userFormData, apellido: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="usuario@example.com"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="tel"
                    className="input"
                    placeholder="+54 9 11 1234 5678"
                    value={userFormData.telefono}
                    onChange={(e) => setUserFormData({ ...userFormData, telefono: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Rol</label>
                  <select
                    className="input"
                    value={userFormData.rol}
                    onChange={(e) => setUserFormData({ ...userFormData, rol: e.target.value })}
                  >
                    <option value="cliente">Cliente</option>
                    <option value="empleado">Empleado</option>
                    <option value="groomer">Groomer</option>
                    <option value="veterinario">Veterinario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="label">Contraseña</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn btn-primary flex-1"
                  >
                    {formLoading ? 'Creando...' : 'Crear Usuario'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserForm(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tabla de Usuarios */}
          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-600">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {u.nombre} {u.apellido}
                          </div>
                          {u.telefono && <div className="text-xs text-slate-500">{u.telefono}</div>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {u.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={u.rol}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className={`text-xs px-3 py-1 rounded-full font-medium ${getRoleColor(u.rol)} cursor-pointer`}
                          >
                            {Object.entries(roleLabels).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.activo)}
                            className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                              u.activo
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuración Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Configuración del Sistema</h2>
          <div className="text-slate-600">
            <p>Las opciones de configuración estarán disponibles próximamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}