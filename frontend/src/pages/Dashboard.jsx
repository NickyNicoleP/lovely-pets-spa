import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { agendaAPI, mascotasAPI, productosAPI } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ingresosDia: 0,
    ocupacionDia: 0,
    canceladasHoy: 0,
    stockBajo: 0,
    reservasHoy: 0,
    reservasPendientes: 0
  });
  const [loading, setLoading] = useState(true);
  const [reservasHoy, setReservasHoy] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [mascotaModalOpen, setMascotaModalOpen] = useState(false);
  const [selectedMascota, setSelectedMascota] = useState(null);
  const [selectedReservaFicha, setSelectedReservaFicha] = useState(null);
  const [reprogramarModalOpen, setReprogramarModalOpen] = useState(false);
  const [reservaReprogramar, setReservaReprogramar] = useState(null);
  const [reprogramData, setReprogramData] = useState({ fecha: '', hora: '' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      const [agendaRes, lowStockRes] = await Promise.all([
        agendaAPI.getAll({ fecha: today }),
        productosAPI.getLowStock()
      ]);

      const reservas = agendaRes.data || [];
      const reservasPendientes = reservas.filter((r) => r.estado === 'pendiente').length;
      const canceladasHoy = reservas.filter((r) => r.estado === 'cancelada').length;
      const reservasConfirmadas = reservas.filter((r) => ['confirmada', 'completada'].includes(r.estado)).length;
      const ingresosDia = reservas.reduce(
        (total, reserva) => total + Number(reserva.precio_final ?? reserva.precio_servicio ?? 0),
        0
      );
      const ocupacionDia = reservas.length > 0
        ? Math.round((reservasConfirmadas / reservas.length) * 100)
        : 0;
      const stockBajo = lowStockRes.data?.length || 0;

      setStats({
        ingresosDia,
        ocupacionDia,
        canceladasHoy,
        stockBajo,
        reservasHoy: reservas.length,
        reservasPendientes
      });
      setReservasHoy(reservas);

      const currentAlerts = [];
      if (stockBajo > 0) {
        currentAlerts.push({
          type: 'danger',
          message: `Hay ${stockBajo} productos con stock bajo.`
        });
      }
      if (canceladasHoy > 0) {
        currentAlerts.push({
          type: 'warning',
          message: `${canceladasHoy} citas han sido canceladas hoy.`
        });
      }
      if (reservasPendientes > 0) {
        currentAlerts.push({
          type: 'info',
          message: `${reservasPendientes} citas pendientes requieren atención.`
        });
      }
      if (reservas.length === 0) {
        currentAlerts.push({
          type: 'success',
          message: 'No hay reservas programadas para hoy.'
        });
      }
      if (reservas.length > 0 && ocupacionDia <= 50) {
        currentAlerts.push({
          type: 'info',
          message: `Ocupación de agenda al ${ocupacionDia}% para hoy.`
        });
      }

      setAlerts(currentAlerts);
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmada: 'bg-blue-100 text-blue-800',
      completada: 'bg-green-100 text-green-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const formateaBs = (valor) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(valor);
  };

  const handleConfirm = async (reserva) => {
    try {
      await agendaAPI.update(reserva.id, { estado: 'confirmada' });
      await loadDashboardData();
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
    }
  };

  const handleCancel = async (reserva) => {
    try {
      await agendaAPI.update(reserva.id, { estado: 'cancelada' });
      await loadDashboardData();
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
    }
  };

  const openReprogramar = (reserva) => {
    setReservaReprogramar(reserva);
    setReprogramData({ fecha: reserva.fecha || '', hora: reserva.hora || '' });
    setReprogramarModalOpen(true);
  };

  const handleReprogramar = async () => {
    if (!reservaReprogramar) return;

    try {
      await agendaAPI.update(reservaReprogramar.id, {
        fecha: reprogramData.fecha,
        hora: reprogramData.hora
      });
      setReprogramarModalOpen(false);
      setReservaReprogramar(null);
      await loadDashboardData();
    } catch (error) {
      console.error('Error al reprogramar reserva:', error);
    }
  };

  const handleOpenMascotaModal = async (reserva) => {
    setSelectedReservaFicha(reserva);
    setMascotaModalOpen(true);
    setSelectedMascota(null);

    try {
      const response = await mascotasAPI.getById(reserva.mascota_id);
      setSelectedMascota(response.data);
    } catch (error) {
      console.error('Error al cargar los datos de la mascota:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] overflow-hidden bg-gradient-to-r from-primary-600 via-sky-600 to-secondary-600 text-white shadow-2xl">
        <div className="p-8 sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-100">Panel ejecutivo</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">Bienvenido a PawSpa</h1>
              <p className="mt-4 text-base text-cyan-100/90">Gestiona reservas, grooming y stock con una experiencia visual más clara y eficiente.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Ingresos del día</p>
                <p className="mt-3 text-3xl font-bold">{formateaBs(stats.ingresosDia)}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Ocupación del día</p>
                <p className="mt-3 text-3xl font-bold">{stats.ocupacionDia}%</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Citas canceladas</p>
                <p className="mt-3 text-3xl font-bold">{stats.canceladasHoy}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Stock bajo</p>
                    <p className="mt-3 text-3xl font-bold">{stats.stockBajo}</p>
                  </div>
                  {stats.stockBajo > 0 ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-600 text-white">Alerta</span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">OK</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Reservas de Hoy</h2>
          {reservasHoy.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No hay reservas para hoy</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Hora</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Cliente</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Mascota</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Estado</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasHoy.map((reserva) => (
                    <tr key={reserva.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-800">{reserva.hora}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{reserva.cliente_nombre} {reserva.cliente_apellido}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{reserva.mascota_nombre}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getEstadoColor(reserva.estado)}`}>
                          {reserva.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-800">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition"
                            onClick={() => handleConfirm(reserva)}
                          >
                            Confirmar
                          </button>
                          <button
                            className="rounded-full bg-amber-400 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-amber-500 transition"
                            onClick={() => openReprogramar(reserva)}
                          >
                            Reprogramar
                          </button>
                          <button
                            className="rounded-full bg-red-500 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-600 transition"
                            onClick={() => handleCancel(reserva)}
                          >
                            Cancelar
                          </button>
                          <button
                            className="rounded-full bg-fuchsia-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-fuchsia-700 transition"
                            onClick={() => handleOpenMascotaModal(reserva)}
                          >
                            Ver ficha
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-card space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-fuchsia-500 to-pink-500 p-5 text-white shadow-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">Alertas dinámicas</p>
            <div className="mt-4 space-y-3">
              {alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`rounded-2xl p-4 text-sm font-medium ${
                    alert.type === 'danger' ? 'bg-red-50 text-red-700' :
                    alert.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                    alert.type === 'info' ? 'bg-sky-50 text-sky-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {alert.message}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Accesos rápidos</p>
                <p className="mt-2 text-base font-semibold text-slate-900">Agenda y stock bajo</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <button
                className="w-full rounded-2xl bg-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-fuchsia-700 transition"
                onClick={() => navigate('/agenda')}
              >
                Ir a agenda
              </button>
              <button
                className="w-full rounded-2xl border border-fuchsia-500 bg-white px-4 py-3 text-sm font-semibold text-fuchsia-700 shadow-sm hover:bg-fuchsia-50 transition"
                onClick={() => navigate('/productos')}
              >
                Ver stock bajo
              </button>
            </div>
          </div>
        </div>
      </div>

      {mascotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Ficha de mascota</h2>
                <p className="mt-1 text-sm text-slate-500">{selectedReservaFicha?.mascota_nombre || 'Mascota'}</p>
              </div>
              <button
                className="rounded-full bg-slate-100 px-3 py-2 text-slate-800 hover:bg-slate-200"
                onClick={() => setMascotaModalOpen(false)}
              >Cerrar</button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Nombre</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedMascota?.nombre || selectedReservaFicha?.mascota_nombre || 'N/D'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Dueño</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedMascota?.cliente_nombre} {selectedMascota?.cliente_apellido}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Raza</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedMascota?.raza || 'N/D'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Edad</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedMascota?.edad || 'N/D'}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Notas</p>
              <p className="mt-2 text-slate-700">{selectedMascota?.observaciones || 'No hay notas adicionales.'}</p>
            </div>
          </div>
        </div>
      )}

      {reprogramarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Reprogramar cita</h2>
                <p className="mt-1 text-sm text-slate-500">Actualiza fecha y hora para la reserva seleccionada.</p>
              </div>
              <button
                className="rounded-full bg-slate-100 px-3 py-2 text-slate-800 hover:bg-slate-200"
                onClick={() => setReprogramarModalOpen(false)}
              >Cerrar</button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Fecha</span>
                <input
                  type="date"
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
                  value={reprogramData.fecha}
                  onChange={(e) => setReprogramData((prev) => ({ ...prev, fecha: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Hora</span>
                <input
                  type="time"
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900"
                  value={reprogramData.hora}
                  onChange={(e) => setReprogramData((prev) => ({ ...prev, hora: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                onClick={() => setReprogramarModalOpen(false)}
              >Cancelar</button>
              <button
                className="rounded-3xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white hover:bg-fuchsia-700 transition"
                onClick={handleReprogramar}
              >Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
