import { useEffect, useState } from 'react';
import { reportesAPI } from '../../services/api';

const formatCurrency = (value) => 'Bs ' + parseFloat(value || 0).toFixed(2);

export default function Reportes() {
  const [ranking, setRanking] = useState({ servicios: [], productos: [] });
  const [ocupacion, setOcupacion] = useState({});
  const [auditoria, setAuditoria] = useState({ summary: {}, detalle: [] });
  const [nps, setNps] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReportes = async () => {
      try {
        const [rankingRes, ocupacionRes, auditoriaRes, npsRes] = await Promise.all([
          reportesAPI.getRankingRentabilidad(),
          reportesAPI.getOcupacionGlobal(),
          reportesAPI.getAuditoriaInsumos(),
          reportesAPI.getNpsResumen(),
        ]);

        setRanking(rankingRes.data || { servicios: [], productos: [] });
        setOcupacion(ocupacionRes.data || {});
        setAuditoria(auditoriaRes.data || { summary: {}, detalle: [] });
        setNps(npsRes.data || {});
      } catch (error) {
        console.error('Error cargando reportes:', error);
        setRanking({ servicios: [], productos: [] });
        setOcupacion({});
        setAuditoria({ summary: {}, detalle: [] });
        setNps({});
      } finally {
        setIsLoading(false);
      }
    };

    loadReportes();
  }, []);

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Dashboard de reportes</h1>
        <p className="text-sm text-slate-600">Métricas administrativas para rentabilidad, ocupación, insumos y NPS.</p>
      </div>

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

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="bg-white rounded shadow-sm p-6 border border-slate-200 xl:col-span-1">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Ocupación Global</h2>
            <p className="text-sm text-slate-500">Porcentaje de uso frente a capacidad instalada.</p>
          </div>
          <div className="text-slate-500 text-sm mb-2">Período</div>
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
            <p className="mt-2 text-2xl font-semibold">{auditoria.summary?.total_entregados ?? 0}</p>
          </div>
          <div className="rounded bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm text-slate-500">Usados</p>
            <p className="mt-2 text-2xl font-semibold">{auditoria.summary?.total_usados ?? 0}</p>
          </div>
          <div className="rounded bg-slate-50 p-4 border border-slate-200">
            <p className="text-sm text-slate-500">Descontados</p>
            <p className="mt-2 text-2xl font-semibold">{auditoria.summary?.total_descontados ?? 0}</p>
          </div>
        </div>
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Entregados</th>
                <th className="px-3 py-2">Usados</th>
                <th className="px-3 py-2">Descontados</th>
              </tr>
            </thead>
            <tbody>
              {(auditoria.detalle || []).map((item) => (
                <tr key={item.producto_id} className="border-t border-slate-100">
                  <td className="px-3 py-2">{item.producto_nombre}</td>
                  <td className="px-3 py-2">{item.entregados ?? 0}</td>
                  <td className="px-3 py-2">{item.usados ?? 0}</td>
                  <td className="px-3 py-2">{item.descontados ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
