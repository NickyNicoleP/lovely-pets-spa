import { useEffect, useState } from 'react';
import { agendaAPI } from '../../services/api';

export default function MisCitas() {
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      const { data } = await agendaAPI.getAll({}); // backend filtra por cliente
      setCitas(Array.isArray(data) ? data : []);
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
        {citas.map((cita) => (
          <div key={cita.id} className="bg-white p-4 rounded shadow flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
            <div className="space-y-1">
              <p><strong>Mascota:</strong> {cita.mascota_nombre || 'N/D'}</p>
              <p><strong>Servicio:</strong> {cita.servicio_nombre || 'N/D'}</p>
              <p><strong>Groomer:</strong> {cita.groomer_id ? `ID ${cita.groomer_id}` : 'Sin asignar'}</p>
              <p><strong>Fecha y hora:</strong> {cita.fecha && cita.hora ? `${cita.fecha} ${cita.hora}` : cita.fecha_hora ? new Date(cita.fecha_hora).toLocaleString() : 'N/D'}</p>
              <p><strong>Estado:</strong> {cita.estado}</p>
            </div>
            <button
              onClick={() => cancelarCita(cita.id)}
              className="self-start sm:self-auto bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition"
            >
              Cancelar
            </button>
          </div>
        ))}
        {citas.length === 0 && <p>No tienes citas programadas.</p>}
      </div>
    </div>
  );
}