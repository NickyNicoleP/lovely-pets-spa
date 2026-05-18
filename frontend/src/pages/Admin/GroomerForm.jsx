import { useState, useEffect } from 'react';
import { groomersAPI, authAPI } from '../../services/api';

export default function GroomerForm({ groomer, onClose, onSave }) {
  const [formData, setFormData] = useState({
    usuario_id: '',
    ci: '',
    direccion: '',
    especialidades: '',
    turno: 'mañana',
    disponibilidad_semanal: {
      lunes: { inicio: '09:00', fin: '17:00', activo: true },
      martes: { inicio: '09:00', fin: '17:00', activo: true },
      miercoles: { inicio: '09:00', fin: '17:00', activo: true },
      jueves: { inicio: '09:00', fin: '17:00', activo: true },
      viernes: { inicio: '09:00', fin: '17:00', activo: true },
      sabado: { inicio: '09:00', fin: '17:00', activo: false },
      domingo: { inicio: '09:00', fin: '17:00', activo: false }
    }
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
    if (groomer) {
      setFormData({
        usuario_id: groomer.usuario_id,
        ci: groomer.ci || '',
        direccion: groomer.direccion || '',
        especialidades: groomer.especialidades || '',
        turno: groomer.turno || 'mañana',
        disponibilidad_semanal: groomer.disponibilidad_semanal ? 
          JSON.parse(groomer.disponibilidad_semanal) : 
          formData.disponibilidad_semanal
      });
    }
  }, [groomer]);

  const loadUsers = async () => {
    try {
      const response = await authAPI.getUsers();
      // Filtrar usuarios con rol 'empleado' que no sean groomers ya
      const empleados = response.data.filter(u => 
        u.rol === 'empleado' && !u.groomer
      );
      setUsers(empleados);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        disponibilidad_semanal: JSON.stringify(formData.disponibilidad_semanal)
      };
      
      if (groomer) {
        await groomersAPI.update(groomer.id, dataToSend);
      } else {
        await groomersAPI.create(dataToSend);
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving groomer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisponibilidadChange = (dia, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      disponibilidad_semanal: {
        ...prev.disponibilidad_semanal,
        [dia]: {
          ...prev.disponibilidad_semanal[dia],
          [campo]: valor
        }
      }
    }));
  };

  const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {groomer ? 'Editar Groomer' : 'Crear Nuevo Groomer'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario Empleado
              </label>
              <select
                required
                value={formData.usuario_id}
                onChange={(e) => setFormData({...formData, usuario_id: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                disabled={!!groomer}
              >
                <option value="">Seleccionar empleado...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nombre} {user.apellido} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Datos personales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">CI</label>
                <input
                  type="text"
                  value={formData.ci}
                  onChange={(e) => setFormData({...formData, ci: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Especialidades y Turno */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Especialidades</label>
                <input
                  type="text"
                  value={formData.especialidades}
                  onChange={(e) => setFormData({...formData, especialidades: e.target.value})}
                  placeholder="ej: Perros grandes, Cortes creativos"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Turno</label>
                <select
                  value={formData.turno}
                  onChange={(e) => setFormData({...formData, turno: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="mañana">Mañana</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                  <option value="completo">Completo</option>
                </select>
              </div>
            </div>

            {/* Disponibilidad Semanal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Disponibilidad Semanal
              </label>
              <div className="space-y-3">
                {dias.map((dia) => (
                  <div key={dia} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 min-w-[120px]">
                      <input
                        type="checkbox"
                        checked={formData.disponibilidad_semanal[dia]?.activo || false}
                        onChange={(e) => handleDisponibilidadChange(dia, 'activo', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium capitalize">{dia}</span>
                    </div>
                    
                    {formData.disponibilidad_semanal[dia]?.activo && (
                      <>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Inicio:</label>
                          <input
                            type="time"
                            value={formData.disponibilidad_semanal[dia]?.inicio || '09:00'}
                            onChange={(e) => handleDisponibilidadChange(dia, 'inicio', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-gray-600">Fin:</label>
                          <input
                            type="time"
                            value={formData.disponibilidad_semanal[dia]?.fin || '17:00'}
                            onChange={(e) => handleDisponibilidadChange(dia, 'fin', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : (groomer ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}