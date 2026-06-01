import { useState, useEffect } from 'react';
import { reportesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Reportes() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('ventas');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin: '',
    periodo: 'diario',
    groomer_id: ''
  });
  const [summary, setSummary] = useState({});

  // Load data based on active tab
  useEffect(() => {
    loadReportData();
  }, [activeTab, filters]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const params = {
        fecha_inicio: filters.fecha_inicio,
        fecha_fin: filters.fecha_fin
      };

      let response;
      switch (activeTab) {
        case 'ventas':
          params.periodo = filters.periodo;
          response = await reportesAPI.getVentas(params);
          break;
        case 'agenda':
          if (!filters.fecha_inicio) {
            const today = new Date().toISOString().split('T')[0];
            response = await reportesAPI.getAgendaDiaria(today);
          } else {
            response = await reportesAPI.getAgendaDiaria(filters.fecha_inicio);
          }
          break;
        case 'groomer':
          if (filters.groomer_id) {
            response = await reportesAPI.getHistorialGroomer(filters.groomer_id, params);
          }
          break;
        default:
          response = { data: [] };
      }

      setData(Array.isArray(response.data) ? response.data : []);
      
      // Load summary stats
      const stats = await reportesAPI.getEstadisticasGenerales(params);
      setSummary(stats.data || {});
    } catch (error) {
      console.error('Error loading report:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Admin Tab: Sales and Revenue
  const VentasReport = () => (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
          <select
            name="periodo"
            value={filters.periodo}
            onChange={handleFilterChange}
            className="input"
          >
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            type="date"
            name="fecha_inicio"
            value={filters.fecha_inicio}
            onChange={handleFilterChange}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            type="date"
            name="fecha_fin"
            value={filters.fecha_fin}
            onChange={handleFilterChange}
            className="input"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 bg-blue-50 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Ingresos Totales</p>
          <p className="text-2xl font-bold text-blue-600">
            Bs {(summary.ingresos_totales || 0).toFixed(2)}
          </p>
        </div>
        <div className="card p-4 bg-green-50 border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Transacciones</p>
          <p className="text-2xl font-bold text-green-600">{summary.total_pagos || 0}</p>
        </div>
        <div className="card p-4 bg-purple-50 border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Promedio/Venta</p>
          <p className="text-2xl font-bold text-purple-600">
            Bs {(summary.promedio_venta || 0).toFixed(2)}
          </p>
        </div>
        <div className="card p-4 bg-orange-50 border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Clientes</p>
          <p className="text-2xl font-bold text-orange-600">{summary.clientes_unicos || 0}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Período</th>
              <th className="px-4 py-3 text-center font-semibold">Transacciones</th>
              <th className="px-4 py-3 text-right font-semibold">Total Ingresos</th>
              <th className="px-4 py-3 text-right font-semibold">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Sin datos</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{row.periodo}</td>
                  <td className="px-4 py-3 text-center">{row.total_transacciones}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    Bs {(row.total_ingresos || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    Bs {(row.promedio_venta || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Reception Tab: Daily Schedule
  const AgendaReport = () => (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Fecha</label>
        <input
          type="date"
          name="fecha_inicio"
          value={filters.fecha_inicio}
          onChange={handleFilterChange}
          className="input"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Hora</th>
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Mascota</th>
              <th className="px-4 py-3 text-left font-semibold">Raza</th>
              <th className="px-4 py-3 text-left font-semibold">Servicio</th>
              <th className="px-4 py-3 text-left font-semibold">Groomer</th>
              <th className="px-4 py-3 text-center font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">Sin citas para esta fecha</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">{row.hora}</td>
                  <td className="px-4 py-3">{row.cliente_nombre}</td>
                  <td className="px-4 py-3">{row.mascota_nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{row.mascota_raza || '-'}</td>
                  <td className="px-4 py-3">{row.servicio}</td>
                  <td className="px-4 py-3">{row.groomer_nombre || 'Sin asignar'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      row.estado === 'confirmada' ? 'bg-green-100 text-green-700' :
                      row.estado === 'cancelada' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {row.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Groomer Tab: Service History
  const GroomerReport = () => (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Groomer</label>
          <input
            type="number"
            name="groomer_id"
            value={filters.groomer_id}
            onChange={handleFilterChange}
            placeholder="Ingrese ID del groomer"
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input
            type="date"
            name="fecha_inicio"
            value={filters.fecha_inicio}
            onChange={handleFilterChange}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input
            type="date"
            name="fecha_fin"
            value={filters.fecha_fin}
            onChange={handleFilterChange}
            className="input"
          />
        </div>
      </div>

      {!filters.groomer_id ? (
        <div className="card p-8 text-center text-gray-500">
          Ingrese el ID de un groomer para ver su historial
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                <th className="px-4 py-3 text-left font-semibold">Mascota</th>
                <th className="px-4 py-3 text-left font-semibold">Servicio</th>
                <th className="px-4 py-3 text-right font-semibold">Monto</th>
                <th className="px-4 py-3 text-left font-semibold">Método</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">Sin servicios registrados</td></tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {row.fecha_cierre ? new Date(row.fecha_cierre).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">{row.cliente_nombre}</td>
                    <td className="px-4 py-3">{row.mascota_nombre}</td>
                    <td className="px-4 py-3">{row.servicio}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      Bs {(row.total_pagado || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">{row.metodo || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-2">Análisis y estadísticas del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {user?.rol === 'admin' || user?.rol === 'administrador' ? (
          <>
            <button
              onClick={() => setActiveTab('ventas')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'ventas'
                  ? 'border-fuchsia-600 text-fuchsia-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Ventas & Ingresos
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'agenda'
                  ? 'border-fuchsia-600 text-fuchsia-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Agenda Diaria
            </button>
          </>
        ) : null}
        {user?.rol === 'groomer' ? (
          <button
            onClick={() => setActiveTab('groomer')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'groomer'
                ? 'border-fuchsia-600 text-fuchsia-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Mi Historial
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('groomer')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'groomer'
                ? 'border-fuchsia-600 text-fuchsia-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Groomer Historial
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'ventas' && <VentasReport />}
      {activeTab === 'agenda' && <AgendaReport />}
      {activeTab === 'groomer' && <GroomerReport />}
    </div>
  );
}
