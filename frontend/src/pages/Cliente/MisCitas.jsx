import { useEffect, useState } from 'react';
import { agendaAPI } from '../../services/api';

export default function MisCitas() {
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      const { data } = await agendaAPI.getAll({}); // backend debe filtrar por cliente
      setCitas(data);
    } catch (error) {
      console.error(error);
    }
  };

  const cancelarCita = async (id) => {
    if (confirm('¿Cancelar esta cita?')) {
      try {
        await agendaAPI.delete(id);
        cargarCitas();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Mis Citas</h1>
      <div className="space-y-4">
        {citas.map(cita => (
          <div key={cita.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <p><strong>Mascota:</strong> {cita.mascota?.nombre}</p>
              <p><strong>Servicio:</strong> {cita.servicio?.nombre}</p>
              <p><strong>Groomer:</strong> {cita.groomer?.nombre}</p>
              <p><strong>Fecha y hora:</strong> {new Date(cita.fecha_hora).toLocaleString()}</p>
              <p><strong>Estado:</strong> {cita.estado}</p>
            </div>
            <button onClick={() => cancelarCita(cita.id)} className="bg-red-600 text-white px-3 py-1 rounded">Cancelar</button>
          </div>
        ))}
        {citas.length === 0 && <p>No tienes citas programadas.</p>}
      </div>
    </div>
  );
}