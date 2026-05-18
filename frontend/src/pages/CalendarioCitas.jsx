import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { agendaAPI } from '../services/api';

export default function CalendarioCitas() {
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      const { data } = await agendaAPI.getAll();
      const mapped = data.map(cita => ({
        id: cita.id,
        title: `${cita.mascota?.nombre} - ${cita.servicio?.nombre}`,
        start: cita.fecha_hora,
        extendedProps: { groomer: cita.groomer?.nombre }
      }));
      setEventos(mapped);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDateClick = (info) => {
    alert(`Fecha seleccionada: ${info.dateStr}\nAquí podrías abrir modal para crear cita.`);
  };

  const handleEventDrop = async (info) => {
    const { id, start } = info.event;
    try {
      await agendaAPI.update(id, { fecha_hora: start.toISOString() });
      alert('Cita reagendada');
    } catch (error) {
      console.error(error);
      info.revert();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Calendario de Citas</h1>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={eventos}
        dateClick={handleDateClick}
        editable={true}
        eventDrop={handleEventDrop}
        locale="es"
      />
    </div>
  );
}