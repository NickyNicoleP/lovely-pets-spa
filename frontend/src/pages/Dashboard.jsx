import { useState, useEffect } from 'react';
import { agendaAPI, fichaGroomingAPI, productosAPI } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    reservasHoy: 0,
    reservasPendientes: 0,
    fichasAbiertas: 0,
    productosStock: 0
  });
  const [loading, setLoading] = useState(true);
  const [reservasRecientes, setReservasRecientes] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [agendaRes, fichasRes, productosRes] = await Promise.all([
        agendaAPI.getAll({ fecha: today }),
        fichaGroomingAPI.getAll({}),
        productosAPI.getAll()
      ]);

      const reservasHoy = agendaRes.data.filter(r => r.estado !== 'cancelada').length;
      const reservasPendientes = agendaRes.data.filter(r => r.estado === 'pendiente').length;
      const fichasAbiertas = fichasRes.data.filter(f => f.estado === 'abierta').length;
      const productosStock = productosRes.data.filter(p => p.stock > 0).length;

      setStats({
        reservasHoy,
        reservasPendientes,
        fichasAbiertas,
        productosStock
      });

      setReservasRecientes(agendaRes.data.slice(0, 5));
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
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Reservas</p>
                <p className="mt-3 text-3xl font-bold">{stats.reservasHoy}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Pendientes</p>
                <p className="mt-3 text-3xl font-bold">{stats.reservasPendientes}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Grooming</p>
                <p className="mt-3 text-3xl font-bold">{stats.fichasAbiertas}</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-100">Productos</p>
                <p className="mt-3 text-3xl font-bold">{stats.productosStock}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Reservas de Hoy</h2>
          {reservasRecientes.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No hay reservas para hoy</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Hora</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Cliente</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Mascota</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Servicio</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservasRecientes.map((reserva) => (
                    <tr key={reserva.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-800">{reserva.hora}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{reserva.cliente_nombre} {reserva.cliente_apellido}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{reserva.mascota_nombre}</td>
                      <td className="py-3 px-4 text-sm text-slate-800">{reserva.servicio_nombre}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getEstadoColor(reserva.estado)}`}>
                          {reserva.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-card space-y-4">
          <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-secondary-500 p-5 text-white shadow-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">Sugerencia del día</p>
            <p className="mt-3 text-lg font-semibold">Revisa las reservas pendientes y confirma clientes con grooming programado.</p>
          </div>
          <div className="space-y-3">
            <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">Consejo</p>
              <p className="mt-2 text-slate-900">Prioriza las reservas con servicios de grooming largo para optimizar tiempos.</p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-sm border border-slate-200">
              <p className="text-sm text-slate-500">Atajos</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                <li>• Consulta agenda y grooming desde el menú lateral.</li>
                <li>• Revisa productos con stock bajo antes de crear nuevas fichas.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}