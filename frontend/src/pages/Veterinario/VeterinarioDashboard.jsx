import { useEffect, useState } from 'react';
import { mascotasAPI } from '../../services/api';

export default function VeterinarioDashboard() {
  const [mascotas, setMascotas] = useState([]);
  const [observacion, setObservacion] = useState('');
  const [selectedMascota, setSelectedMascota] = useState(null);

  useEffect(() => {
    mascotasAPI.getAll().then(res => setMascotas(res.data));
  }, []);

  const agregarObservacion = async () => {
    if (!selectedMascota || !observacion) return;
    // Asumiendo endpoint POST /mascotas/:id/observaciones
    try {
      await api.post(`/mascotas/${selectedMascota}/observaciones`, { texto: observacion });
      alert('Observación agregada');
      setObservacion('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Panel Veterinario</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Mascotas</h2>
          <ul>
            {mascotas.map(m => (
              <li key={m.id} className="cursor-pointer hover:bg-gray-100 p-2" onClick={() => setSelectedMascota(m.id)}>
                {m.nombre} ({m.raza})
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Agregar observación médica</h2>
          <textarea value={observacion} onChange={e => setObservacion(e.target.value)} className="w-full border p-2 rounded" rows="4" />
          <button onClick={agregarObservacion} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Guardar</button>
        </div>
      </div>
    </div>
  );
}