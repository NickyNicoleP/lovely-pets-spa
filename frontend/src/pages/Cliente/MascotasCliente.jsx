import { useEffect, useState } from 'react';
import { mascotasAPI } from '../../services/api';

export default function MascotasCliente() {
  const [mascotas, setMascotas] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', raza: '', edad: 0, peso: 0 });

  useEffect(() => {
    cargarMascotas();
  }, []);

  const cargarMascotas = async () => {
    try {
      const { data } = await mascotasAPI.getAll(); // backend debe filtrar por cliente autenticado
      setMascotas(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await mascotasAPI.update(editing, form);
      } else {
        await mascotasAPI.create(form);
      }
      cargarMascotas();
      setEditing(null);
      setForm({ nombre: '', raza: '', edad: 0, peso: 0 });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (mascota) => {
    setEditing(mascota.id);
    setForm(mascota);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar mascota?')) {
      await mascotasAPI.delete(id);
      cargarMascotas();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mis Mascotas</h1>
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required className="border p-2 rounded" />
          <input type="text" name="raza" placeholder="Raza" value={form.raza} onChange={handleChange} className="border p-2 rounded" />
          <input type="number" name="edad" placeholder="Edad" value={form.edad} onChange={handleChange} className="border p-2 rounded" />
          <input type="number" name="peso" placeholder="Peso (kg)" value={form.peso} onChange={handleChange} className="border p-2 rounded" />
        </div>
        <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">{editing ? 'Actualizar' : 'Crear'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setForm({ nombre: '', raza: '', edad: 0, peso: 0 }); }} className="mt-4 ml-2 bg-gray-500 text-white px-4 py-2 rounded">Cancelar</button>}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mascotas.map(m => (
          <div key={m.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <h3 className="font-bold">{m.nombre}</h3>
              <p className="text-sm">Raza: {m.raza} | Edad: {m.edad} años | Peso: {m.peso} kg</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleEdit(m)} className="text-blue-600">Editar</button>
              <button onClick={() => handleDelete(m.id)} className="text-red-600">Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}