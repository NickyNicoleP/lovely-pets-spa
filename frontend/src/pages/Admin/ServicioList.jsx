import { useEffect, useState } from 'react';
import { serviciosAPI } from '../../services/api';

export default function ServicioList() {
  const [servicios, setServicios] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio_base: 0,
    duracion: 60,
    activo: true
  });

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      const { data } = await serviciosAPI.getAll();
      setServicios(data);
    } catch (error) {
      console.error('Error al cargar servicios', error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await serviciosAPI.update(editing, form);
      } else {
        await serviciosAPI.create(form);
      }
      cargarServicios();
      setEditing(null);
      setForm({ nombre: '', descripcion: '', precio_base: 0, duracion: 60, activo: true });
    } catch (error) {
      console.error('Error al guardar', error);
    }
  };

  const handleEdit = (servicio) => {
    setEditing(servicio.id);
    setForm(servicio);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar este servicio?')) {
      try {
        await serviciosAPI.delete(id);
        cargarServicios();
      } catch (error) {
        console.error('Error al eliminar', error);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Servicios</h1>
      
      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required className="border p-2 rounded" />
          <input type="text" name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} className="border p-2 rounded" />
          <input type="number" name="precio_base" placeholder="Precio base" value={form.precio_base} onChange={handleChange} required className="border p-2 rounded" />
          <input type="number" name="duracion" placeholder="Duración (min)" value={form.duracion} onChange={handleChange} required className="border p-2 rounded" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="activo" checked={form.activo} onChange={(e) => setForm({...form, activo: e.target.checked})} />
            Activo
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {editing ? 'Actualizar' : 'Crear'}
          </button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm({ nombre: '', descripcion: '', precio_base: 0, duracion: 60, activo: true }); }} className="bg-gray-500 text-white px-4 py-2 rounded">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border">Nombre</th>
              <th className="py-2 px-4 border">Descripción</th>
              <th className="py-2 px-4 border">Precio</th>
              <th className="py-2 px-4 border">Duración</th>
              <th className="py-2 px-4 border">Estado</th>
              <th className="py-2 px-4 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map(serv => (
              <tr key={serv.id}>
                <td className="py-2 px-4 border">{serv.nombre}</td>
                <td className="py-2 px-4 border">{serv.descripcion}</td>
                <td className="py-2 px-4 border">${serv.precio_base}</td>
                <td className="py-2 px-4 border">{serv.duracion} min</td>
                <td className="py-2 px-4 border">{serv.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="py-2 px-4 border space-x-2">
                  <button onClick={() => handleEdit(serv)} className="text-blue-600 hover:underline">Editar</button>
                  <button onClick={() => handleDelete(serv.id)} className="text-red-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}