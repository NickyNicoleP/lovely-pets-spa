import { useState, useEffect } from 'react';
import { groomersAPI } from '../../services/api';

export default function GroomerList({ onEdit, onCreate }) {
  const [groomers, setGroomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroomers();
  }, []);

  const loadGroomers = async () => {
    try {
      const response = await groomersAPI.getAll();
      setGroomers(response.data);
    } catch (error) {
      console.error('Error loading groomers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (groomerId, currentStatus) => {
    try {
      await groomersAPI.update(groomerId, { activo: !currentStatus });
      loadGroomers();
    } catch (error) {
      console.error('Error updating groomer status:', error);
    }
  };

  const handleDelete = async (groomerId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este groomer?')) return;
    try {
      await groomersAPI.delete(groomerId);
      loadGroomers();
    } catch (error) {
      console.error('Error deleting groomer:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Lista de Groomers</h3>
          <button
            onClick={onCreate}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 text-sm"
          >
            Agregar Groomer
          </button>
        </div>
      </div>
      
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Groomer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Especialidades
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Turno
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {groomers.map((groomer) => (
            <tr key={groomer.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {groomer.usuario.nombre} {groomer.usuario.apellido}
                </div>
                <div className="text-sm text-gray-500">{groomer.usuario.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {groomer.especialidades || 'Sin especialidades'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {groomer.turno || 'No asignado'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  groomer.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {groomer.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                <button
                  onClick={() => onEdit(groomer)}
                  className="px-3 py-1 rounded text-xs bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleToggleStatus(groomer.id, groomer.activo)}
                  className={`px-3 py-1 rounded text-xs ${
                    groomer.activo
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {groomer.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => handleDelete(groomer.id)}
                  className="px-3 py-1 rounded text-xs bg-gray-100 text-gray-800 hover:bg-gray-200"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {groomers.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No hay groomers registrados
        </div>
      )}
    </div>
  );
}