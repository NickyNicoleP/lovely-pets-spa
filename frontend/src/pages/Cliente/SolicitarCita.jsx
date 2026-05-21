import { useEffect, useState } from 'react';
import { mascotasAPI, serviciosAPI, groomersAPI, agendaAPI } from '../../services/api';

export default function SolicitarCita() {
  const [mascotas, setMascotas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [groomers, setGroomers] = useState([]);
  const [selectedMascota, setSelectedMascota] = useState('');
  const [selectedServicio, setSelectedServicio] = useState('');
  const [selectedGroomer, setSelectedGroomer] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [mascRes, servRes, groomRes] = await Promise.all([
        mascotasAPI.getAll(),
        serviciosAPI.getAll(),
        groomersAPI.getAll()
      ]);
      setMascotas(mascRes.data);
      setServicios(servRes.data);
      setGroomers(groomRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const verificarDisponibilidad = async () => {
    if (!selectedGroomer || !selectedServicio || !fecha) return;
    try {
      const { data } = await agendaAPI.getHorarios({ groomer_id: selectedGroomer, servicio_id: selectedServicio, fecha });
      setHorariosDisponibles(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (selectedGroomer && selectedServicio && fecha) verificarDisponibilidad();
  }, [selectedGroomer, selectedServicio, fecha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMascota || !selectedServicio || !selectedGroomer || !fecha || !hora) {
      alert('Completa todos los campos');
      return;
    }
    try {
      await agendaAPI.create({
        mascota_id: selectedMascota,
        servicio_id: selectedServicio,
        groomer_id: selectedGroomer,
        fecha,
        hora
      });
      alert('Cita solicitada con éxito');
      // resetear o redirigir
    } catch (error) {
      console.error(error);
      alert('Error al crear cita');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Solicitar nueva cita</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-lg space-y-5">
        <div>
          <label htmlFor="mascota" className="block font-medium text-slate-700 mb-2">Mascota</label>
          <select id="mascota" value={selectedMascota} onChange={e => setSelectedMascota(e.target.value)} required className="input">
            <option value="">Selecciona una mascota</option>
            {mascotas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="servicio" className="block font-medium text-slate-700 mb-2">Servicio</label>
          <select id="servicio" value={selectedServicio} onChange={e => setSelectedServicio(e.target.value)} required className="input">
            <option value="">Selecciona un servicio</option>
            {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre} - ${s.precio_base}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="groomer" className="block font-medium text-slate-700 mb-2">Groomer</label>
          <select id="groomer" value={selectedGroomer} onChange={e => setSelectedGroomer(e.target.value)} required className="input">
            <option value="">Selecciona un groomer</option>
            {groomers.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="fecha" className="block font-medium text-slate-700 mb-2">Fecha</label>
          <input id="fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} required className="input" />
        </div>
        <div>
          <label htmlFor="hora" className="block font-medium text-slate-700 mb-2">Hora</label>
          <select id="hora" value={hora} onChange={e => setHora(e.target.value)} required className="input" disabled={!horariosDisponibles.length}>
            <option value="">Selecciona una hora</option>
            {horariosDisponibles.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-full py-3">Solicitar cita</button>
      </form>
    </div>
  );
}