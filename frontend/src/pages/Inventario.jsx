import { useEffect, useMemo, useState } from 'react';
import { inventarioAPI, productosAPI } from '../services/api';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    producto_id: '',
    tipo: 'salida',
    cantidad: '',
    origen: 'Salida por venta'
  });
  const [filters, setFilters] = useState({
    tipo: 'todos',
    producto_id: '',
    fecha_inicio: '',
    fecha_fin: ''
  });

  useEffect(() => {
    loadProductos();
    loadMovimientos();
  }, []);

  const loadProductos = async () => {
    try {
      const response = await productosAPI.getAll();
      setProductos(response.data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const loadMovimientos = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.tipo !== 'todos') params.tipo = filters.tipo;
      if (filters.producto_id) params.producto_id = filters.producto_id;
      if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
      if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;
      const response = await inventarioAPI.getAll(params);
      setMovimientos(response.data);
    } catch (error) {
      console.error('Error cargando movimientos de inventario:', error);
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.producto_id || !form.cantidad) {
      alert('Seleccione un producto y escriba la cantidad.');
      return;
    }

    try {
      await inventarioAPI.create({
        producto_id: form.producto_id,
        tipo: form.tipo,
        cantidad: Number(form.cantidad),
        motivo: form.origen
      });
      setModalOpen(false);
      setForm({ producto_id: '', tipo: 'salida', cantidad: '', origen: 'Salida por venta' });
      loadProductos();
      loadMovimientos();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const getStockColor = (stock, minimo) => {
    if (stock <= minimo) return 'text-red-700 bg-red-50';
    if (stock <= minimo * 2) return 'text-amber-700 bg-amber-50';
    return 'text-green-700 bg-emerald-50';
  };

  const lowStockCount = useMemo(
    () => productos.filter((producto) => producto.stock <= producto.umbral_alerta).length,
    [productos]
  );

  const totalEntradas = useMemo(
    () => movimientos.filter((m) => m.tipo === 'entrada').reduce((sum, m) => sum + Number(m.cantidad || 0), 0),
    [movimientos]
  );

  const totalSalidas = useMemo(
    () => movimientos.filter((m) => m.tipo === 'salida').reduce((sum, m) => sum + Number(m.cantidad || 0), 0),
    [movimientos]
  );

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-700">Inventario de Insumos</h1>
          <p className="text-sm text-gray-600 mt-1">Registra entradas, salidas, merma y devoluciones con control de stock.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary w-full md:w-auto">
          + Nuevo movimiento
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <div className="glass-card p-5">
          <p className="text-sm uppercase tracking-wide text-gray-500">Productos totales</p>
          <p className="mt-3 text-3xl font-semibold text-primary-700">{productos.length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm uppercase tracking-wide text-gray-500">Stock bajo alerta</p>
          <p className="mt-3 text-3xl font-semibold text-red-700">{lowStockCount}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-sm uppercase tracking-wide text-gray-500">Movimientos del día</p>
          <p className="mt-3 text-3xl font-semibold text-primary-700">{movimientos.length}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3 mb-6">
        <div className="glass-card p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-600">Resumen de inventario</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Entradas</span>
            <span className="font-semibold">{totalEntradas}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Salidas</span>
            <span className="font-semibold">{totalSalidas}</span>
          </div>
        </div>
        <div className="glass-card p-5 col-span-2">
          <p className="text-sm font-semibold text-gray-600 mb-2">Filtrar movimientos</p>
          <div className="grid gap-3 md:grid-cols-4">
            <select
              className="input"
              value={filters.tipo}
              onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
            >
              <option value="todos">Todos</option>
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
            <select
              className="input"
              value={filters.producto_id}
              onChange={(e) => setFilters({ ...filters, producto_id: e.target.value })}
            >
              <option value="">Todos los productos</option>
              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>{producto.nombre}</option>
              ))}
            </select>
            <input
              type="date"
              className="input"
              value={filters.fecha_inicio}
              onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
            />
            <input
              type="date"
              className="input"
              value={filters.fecha_fin}
              onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
            />
          </div>
          <button onClick={loadMovimientos} className="btn btn-secondary mt-3">Aplicar filtros</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        {productos.map((producto) => (
          <div key={producto.id} className="glass-card p-5 border border-primary-100">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-900">{producto.nombre}</p>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStockColor(producto.stock, producto.umbral_alerta)}`}>
                {producto.tipo || 'insumo'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">Stock: <span className="font-semibold">{producto.stock}</span></p>
            <p className="text-sm text-gray-500">Alerta: {producto.umbral_alerta}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Historial de movimientos</h2>
            <p className="text-sm text-gray-500">Últimos movimientos de inventario registrados.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-primary-500"></div>
          </div>
        ) : movimientos.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No se encontraron movimientos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-gray-600">
              <thead>
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Cantidad</th>
                  <th className="p-3">Origen</th>
                  <th className="p-3">Stock actual</th>
                  <th className="p-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((movimiento) => (
                  <tr key={movimiento.id} className="border-t border-gray-200">
                    <td className="p-3 font-medium text-gray-900">{movimiento.producto_nombre}</td>
                    <td className="p-3 capitalize">{movimiento.tipo}</td>
                    <td className="p-3">{movimiento.cantidad}</td>
                    <td className="p-3">{movimiento.origen}</td>
                    <td className="p-3">{movimiento.stock_actual}</td>
                    <td className="p-3">{new Date(movimiento.fecha).toLocaleString('es-AR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Registrar movimiento</h3>
                <p className="text-sm text-gray-500">Registra entradas, salidas, merma o devoluciones.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700">Cerrar</button>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="label">Producto</label>
                <select
                  className="input"
                  value={form.producto_id}
                  onChange={(e) => setForm({ ...form, producto_id: e.target.value })}
                  required
                >
                  <option value="">Selecciona un producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id}>{producto.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    <option value="salida">Salida</option>
                    <option value="entrada">Entrada</option>
                  </select>
                </div>
                <div>
                  <label className="label">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="input"
                    value={form.cantidad}
                    onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Motivo / Origen</label>
                <select
                  className="input"
                  value={form.origen}
                  onChange={(e) => setForm({ ...form, origen: e.target.value })}
                >
                  <option value="Salida por venta">Salida por venta</option>
                  <option value="Merma">Merma</option>
                  <option value="Devolución">Devolución</option>
                  <option value="Ajuste de inventario">Ajuste de inventario</option>
                  <option value="Entrada por compra">Entrada por compra</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-outline flex-1">Cancelar</button>
                <button type="submit" className="btn btn-primary flex-1">Registrar movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
