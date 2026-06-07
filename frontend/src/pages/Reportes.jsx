import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { productosAPI, reportesAPI } from '../services/api';

const formatCurrency = (value) => `Bs ${parseFloat(value || 0).toFixed(2)}`;
const getLocalTodayString = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().split('T')[0];
};
const todayString = getLocalTodayString();

export default function Reportes() {
  const [ranking, setRanking] = useState({ servicios: [], productos: [] });
  const [ocupacion, setOcupacion] = useState({});
  const [auditoria, setAuditoria] = useState({ summary: {}, detalle: [] });
  const [nps, setNps] = useState({});
  const [ventas, setVentas] = useState({ rows: [], totals: { ingresos_total: 0, ingresos_grooming: 0, ingresos_productos: 0 } });
  const [agenda, setAgenda] = useState([]);
  const [caja, setCaja] = useState({ pagos: [], summary: {} });
  const [inventarioCritico, setInventarioCritico] = useState([]);
  const [fecha, setFecha] = useState(todayString);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin' || user?.rol === 'administrador';
  const isRecepcion = user?.rol === 'empleado' || user?.rol === 'veterinario';

  useEffect(() => {
    const loadReportes = async () => {
      try {
        if (isAdmin) {
          const [rankingRes, ocupacionRes, auditoriaRes, ventasRes] = await Promise.all([
            reportesAPI.getRankingRentabilidad(),
            reportesAPI.getOcupacionGlobal(),
            reportesAPI.getAuditoriaInsumos(),
            reportesAPI.getVentas({ periodo: 'diario' })
          ]);

          setRanking(rankingRes.data || { servicios: [], productos: [] });
          setOcupacion(ocupacionRes.data || {});
          setAuditoria(auditoriaRes.data || { summary: {}, detalle: [] });
          const rows = ventasRes.data || [];
          const totals = rows.reduce(
            (acc, row) => ({
              ingresos_total: acc.ingresos_total + Number(row.total_ingresos || 0),
              ingresos_grooming: acc.ingresos_grooming + Number(row.ingresos_grooming || 0),
              ingresos_productos: acc.ingresos_productos + Number(row.ingresos_productos || 0)
            }),
            { ingresos_total: 0, ingresos_grooming: 0, ingresos_productos: 0 }
          );
          setVentas({ rows, totals });
        }

        if (isRecepcion) {
          const [agendaRes, cajaRes, inventarioRes] = await Promise.all([
            reportesAPI.getAgendaDiaria(fecha),
            reportesAPI.getCajaDiaria(fecha),
            productosAPI.getLowStock()
          ]);

          setAgenda(agendaRes.data || []);
          setCaja(cajaRes.data || { pagos: [], summary: {} });
          setInventarioCritico(inventarioRes.data || []);
        }
      } catch (error) {
        console.error('Error cargando reportes:', error);
        setRanking({ servicios: [], productos: [] });
        setOcupacion({});
        setAuditoria({ summary: {}, detalle: [] });
        setNps({});
        setAgenda([]);
        setCaja({ pagos: [], summary: {} });
        setInventarioCritico([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadReportes();
    }
  }, [user, fecha]);

  const citasCanceladas = agenda.filter(
    (item) => item.estado === 'cancelada' || item.estado === 'no_show' || item.estado === 'no-show'
  );
  const citasPendientes = agenda.filter(
    (item) => item.estado !== 'cancelada' && item.estado !== 'completada'
  );
  const citasHoy = agenda.length;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard de reportes</h1>
        <p className="text-sm text-slate-600">Reportes para administradores y recepción.</p>
      </div>

      {!isAdmin && !isRecepcion && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Reportes disponibles solo para roles de Administrador o Recepción.
        </div>
      )}

      {isRecepcion && (
        <div className="space-y-6">
          <div className="bg-white rounded shadow-sm p-6 border border-slate-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Reportes de recepción</h2>
                <p className="text-sm text-slate-500">Cronograma de citas, inventario crítico y cierre de caja.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-700" htmlFor="report-date">Fecha</label>
                <input
                  id="report-date"
                  type="date"
                  className="rounded border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 mt-6 md:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Citas programadas hoy</div>
                <div className="mt-2 text-2xl font-semibold">{isLoading ? '...' : citasHoy}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Citas canceladas / no-show</div>
                <div className="mt-2 text-2xl font-semibold">{isLoading ? '...' : citasCanceladas.length}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Inventario crítico</div>
                <div className="mt-2 text-2xl font-semibold">{isLoading ? '...' : inventarioCritico.length}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Ingresos del día</div>
                <div className="mt-2 text-2xl font-semibold">{isLoading ? '...' : formatCurrency(caja.summary.ingresos_totales)}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="bg-white rounded shadow-sm p-6 border border-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Cronograma diario</h2>
                  <p className="text-sm text-slate-500">Mascotas por ingresar, servicios y estado de pago.</p>
                </div>
                <div className="text-sm text-slate-500">Fecha: {fecha}</div>
              </div>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Hora</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Mascota</th>
                      <th className="px-3 py-2">Servicio</th>
                      <th className="px-3 py-2">Pago</th>
                      <th className="px-3 py-2">Estado reserva</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agenda.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.hora}</td>
                        <td className="px-3 py-2">{item.cliente_nombre}</td>
                        <td className="px-3 py-2">{item.mascota_nombre}</td>
                        <td className="px-3 py-2">{item.servicio}</td>
                        <td className="px-3 py-2">{item.pago_estado ? `${item.pago_metodo || '-'} / ${item.pago_estado}` : 'Sin pago'}</td>
                        <td className="px-3 py-2">{item.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded shadow-sm p-6 border border-slate-200">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Cierre de caja</h2>
                <p className="text-sm text-slate-500">Resumen de cobros por método.</p>
              </div>
              <div className="grid gap-3 text-sm text-slate-700">
                <div className="rounded bg-slate-50 p-4 border border-slate-200 flex justify-between">
                  <span>Total efectivo</span>
                  <span>{formatCurrency(caja.summary.total_efectivo)}</span>
                </div>
                <div className="rounded bg-slate-50 p-4 border border-slate-200 flex justify-between">
                  <span>Total QR</span>
                  <span>{formatCurrency(caja.summary.total_qr)}</span>
                </div>
                <div className="rounded bg-slate-50 p-4 border border-slate-200 flex justify-between">
                  <span>Total transferencia</span>
                  <span>{formatCurrency(caja.summary.total_transferencia)}</span>
                </div>
                <div className="rounded bg-slate-50 p-4 border border-slate-200 flex justify-between">
                  <span>Total tarjeta</span>
                  <span>{formatCurrency(caja.summary.total_tarjeta)}</span>
                </div>
                <div className="rounded bg-slate-50 p-4 border border-slate-200 flex justify-between">
                  <span>Ingresos totales</span>
                  <span>{formatCurrency(caja.summary.ingresos_totales)}</span>
                </div>
              </div>

              <div className="overflow-x-auto mt-6 rounded border border-slate-200">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Hora</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Mascota</th>
                      <th className="px-3 py-2">Método</th>
                      <th className="px-3 py-2">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                  {(caja.pagos || []).length > 0 ? (
                    (caja.pagos || []).map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.hora}</td>
                        <td className="px-3 py-2">{item.cliente_nombre}</td>
                        <td className="px-3 py-2">{item.mascota_nombre}</td>
                        <td className="px-3 py-2">{item.metodo}</td>
                        <td className="px-3 py-2">{formatCurrency(item.monto)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-3 py-4 text-center text-sm text-slate-500">
                        No se encontraron pagos para esta fecha.
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm p-6 border border-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Inventario crítico</h2>
                <p className="text-sm text-slate-500">Productos e insumos con stock bajo.</p>
              </div>
              <div className="text-sm text-slate-500">Items: {inventarioCritico.length}</div>
            </div>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Producto / Insumo</th>
                    <th className="px-3 py-2">Stock</th>
                    <th className="px-3 py-2">Umbral</th>
                    <th className="px-3 py-2">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarioCritico.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{item.nombre}</td>
                      <td className="px-3 py-2">{item.stock}</td>
                      <td className="px-3 py-2">{item.umbral_alerta ?? '-'}</td>
                      <td className="px-3 py-2">{item.tipo ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {citasCanceladas.length > 0 && (
            <div className="bg-white rounded shadow-sm p-6 border border-slate-200">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Cancelaciones / No-show</h2>
                <p className="text-sm text-slate-500">Registro de citas canceladas o no asistidas.</p>
              </div>
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Hora</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Mascota</th>
                      <th className="px-3 py-2">Servicio</th>
                      <th className="px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasCanceladas.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="px-3 py-2">{item.hora}</td>
                        <td className="px-3 py-2">{item.cliente_nombre}</td>
                        <td className="px-3 py-2">{item.mascota_nombre}</td>
                        <td className="px-3 py-2">{item.servicio}</td>
                        <td className="px-3 py-2">{item.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {isAdmin && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="bg-white rounded shadow-sm p-4 border border-slate-200">
              <div className="text-slate-500 text-sm">NPS promedio</div>
              <div className="text-3xl font-semibold">{isLoading ? '...' : nps.promedio?.toFixed(1) ?? '0.0'}</div>
              <div className="mt-2 text-slate-500">Total encuestas: {isLoading ? '...' : nps.total_encuestas ?? 0}</div>
            </div>
            <div className="bg-white rounded shadow-sm p-4 border border-slate-200">
              <div className="text-slate-500 text-sm">Promotores</div>
              <div className="text-3xl font-semibold">{isLoading ? '...' : nps.promotores ?? 0}</div>
              <div className="mt-2 text-slate-500">Porcentaje: {isLoading ? '...' : nps.total_encuestas ? `${((nps.promotores / nps.total_encuestas) * 100).toFixed(1)}%` : '0.0%'}</div>
            </div>
            <div className="bg-white rounded shadow-sm p-4 border border-slate-200">
              <div className="text-slate-500 text-sm">Pasivos</div>
              <div className="text-3xl font-semibold">{isLoading ? '...' : nps.pasivos ?? 0}</div>
              <div className="mt-2 text-slate-500">Porcentaje: {isLoading ? '...' : nps.total_encuestas ? `${((nps.pasivos / nps.total_encuestas) * 100).toFixed(1)}%` : '0.0%'}</div>
            </div>
            <div className="bg-white rounded shadow-sm p-4 border border-slate-200">
              <div className="text-slate-500 text-sm">Detractores</div>
              <div className="text-3xl font-semibold">{isLoading ? '...' : nps.detractores ?? 0}</div>
              <div className="mt-2 text-slate-500">Porcentaje: {isLoading ? '...' : nps.total_encuestas ? `${((nps.detractores / nps.total_encuestas) * 100).toFixed(1)}%` : '0.0%'}</div>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm p-6 border border-slate-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Ventas y desglose</h2>
                <p className="text-sm text-slate-500">Ingresos por grooming y productos de tienda.</p>
              </div>
              <button
                onClick={async () => {
                  setIsDownloading(true);
                  try {
                    const params = { tipo: 'ventas', periodo: 'diario' };
                    const response = await reportesAPI.downloadPdf(params);
                    const blob = new Blob([response.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `reporte_ventas_${new Date().toISOString().slice(0, 10)}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    console.error('Error descargando reporte de ventas:', error);
                  } finally {
                    setIsDownloading(false);
                  }
                }}
                className="inline-flex items-center justify-center rounded bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
                disabled={isDownloading}
              >
                {isDownloading ? 'Descargando...' : 'Descargar reporte de ventas'}
              </button>
            </div>
            <div className="grid gap-4 mt-6 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Ingresos totales</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(ventas.totals.ingresos_total)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Grooming</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(ventas.totals.ingresos_grooming)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Productos</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(ventas.totals.ingresos_productos)}</p>
              </div>
            </div>
            <div className="overflow-x-auto mt-6 rounded border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Período</th>
                    <th className="px-3 py-2">Transacciones</th>
                    <th className="px-3 py-2">Total ingresos</th>
                    <th className="px-3 py-2">Grooming</th>
                    <th className="px-3 py-2">Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {(ventas.rows || []).map((item, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="px-3 py-2">{item.periodo}</td>
                      <td className="px-3 py-2">{item.total_transacciones}</td>
                      <td className="px-3 py-2">{formatCurrency(item.total_ingresos)}</td>
                      <td className="px-3 py-2">{formatCurrency(item.ingresos_grooming)}</td>
                      <td className="px-3 py-2">{formatCurrency(item.ingresos_productos)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="bg-white rounded shadow-sm p-6 border border-slate-200 xl:col-span-1">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Ocupación Global</h2>
                <p className="text-sm text-slate-500">Porcentaje de uso frente a capacidad instalada.</p>
              </div>
              <div className="text-slate-500 text-sm mb-2">Periodo</div>
              <div className="text-slate-900 font-semibold mb-4">
                {ocupacion.fecha_inicio && ocupacion.fecha_fin ? `${ocupacion.fecha_inicio} → ${ocupacion.fecha_fin}` : 'Últimos 30 días'}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm text-slate-500 mb-1">
                  <span>Capacidad total</span>
                  <span>{ocupacion.capacidad_total ?? '-'}</span>
                </div>
                <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full bg-sky-600" style={{ width: `${ocupacion.porcentaje_ocupacion ?? 0}%` }} />
                </div>
                <div className="mt-2 text-sm text-slate-600">{ocupacion.porcentaje_ocupacion?.toFixed?.(2) ?? '0.00'} % ocupación</div>
              </div>
              <div className="grid gap-2 text-sm text-slate-700">
                <div className="flex justify-between"><span>Reservas ocupadas</span><span>{ocupacion.reservas_ocupadas ?? 0}</span></div>
                <div className="flex justify-between"><span>Reservas pendientes</span><span>{ocupacion.reservas_pendientes ?? 0}</span></div>
                <div className="flex justify-between"><span>Reservas canceladas</span><span>{ocupacion.reservas_canceladas ?? 0}</span></div>
              </div>
            </div>

            <div className="bg-white rounded shadow-sm p-6 border border-slate-200 xl:col-span-2">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Ranking de rentabilidad</h2>
                <p className="text-sm text-slate-500">Servicios y productos con mayor volumen de ventas.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="text-md font-semibold mb-2">Servicios</h3>
                  <div className="overflow-x-auto rounded border border-slate-200">
                    <table className="min-w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Servicio</th>
                          <th className="px-3 py-2">Ventas</th>
                          <th className="px-3 py-2">Ingresos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ranking.servicios || []).map((item) => (
                          <tr key={item.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">{item.nombre}</td>
                            <td className="px-3 py-2">{item.cantidad_servicios ?? 0}</td>
                            <td className="px-3 py-2">{formatCurrency(item.ingresos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-semibold mb-2">Productos</h3>
                  <div className="overflow-x-auto rounded border border-slate-200">
                    <table className="min-w-full text-left text-sm text-slate-700">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Producto</th>
                          <th className="px-3 py-2">Unidades</th>
                          <th className="px-3 py-2">Ingresos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(ranking.productos || []).map((item) => (
                          <tr key={item.id} className="border-t border-slate-100">
                            <td className="px-3 py-2">{item.nombre}</td>
                            <td className="px-3 py-2">{item.cantidad_vendida ?? 0}</td>
                            <td className="px-3 py-2">{formatCurrency(item.ingresos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm p-6 border border-slate-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Auditoría de insumos</h2>
              <p className="text-sm text-slate-500">Comparación de insumos entregados, usados y descontados.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="rounded bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm text-slate-500">Entregados</p>
                <p className="mt-2 text-2xl font-semibold">{auditoria.summary.total_entregados ?? 0}</p>
              </div>
              <div className="rounded bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm text-slate-500">Usados</p>
                <p className="mt-2 text-2xl font-semibold">{auditoria.summary.total_usados ?? 0}</p>
              </div>
              <div className="rounded bg-slate-50 p-4 border border-slate-200">
                <p className="text-sm text-slate-500">Descontados</p>
                <p className="mt-2 text-2xl font-semibold">{auditoria.summary.total_descontados ?? 0}</p>
              </div>
            </div>
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Insumo</th>
                    <th className="px-3 py-2">Entregado</th>
                    <th className="px-3 py-2">Usado</th>
                    <th className="px-3 py-2">Descontado</th>
                  </tr>
                </thead>
                <tbody>
                  {(auditoria.detalle || []).map((item, index) => (
                    <tr key={index} className="border-t border-slate-100">
                      <td className="px-3 py-2">{item.insumo}</td>
                      <td className="px-3 py-2">{item.entregado ?? 0}</td>
                      <td className="px-3 py-2">{item.usado ?? 0}</td>
                      <td className="px-3 py-2">{item.descontado ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


