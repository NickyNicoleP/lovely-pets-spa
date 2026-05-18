import { useEffect, useMemo, useState } from 'react';
import { carritoAPI, productosAPI } from '../services/api';

export default function Carrito() {
  const [productos, setProductos] = useState([]);
  const [cart, setCart] = useState([]);
  const [canal, setCanal] = useState('local');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      const response = await productosAPI.getAll();
      setProductos(response.data);
    } catch (error) {
      console.error('Error al cargar el catálogo:', error);
    }
  };

  const addToCart = (producto) => {
    setCart((current) => {
      const existing = current.find((item) => item.producto_id === producto.id);
      if (existing) {
        return current.map((item) =>
          item.producto_id === producto.id
            ? { ...item, cantidad: Math.min(item.cantidad + 1, producto.stock || 999) }
            : item
        );
      }
      return [...current, { producto_id: producto.id, nombre: producto.nombre, precio_unitario: Number(producto.precio), cantidad: 1, stock: producto.stock }];
    });
  };

  const updateQuantity = (productoId, cantidad) => {
    if (cantidad < 1) return;
    setCart((current) => current.map((item) => item.producto_id === productoId ? { ...item, cantidad } : item));
  };

  const removeFromCart = (productoId) => {
    setCart((current) => current.filter((item) => item.producto_id !== productoId));
  };

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.precio_unitario * item.cantidad, 0),
    [cart]
  );

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Agrega productos al carrito antes de continuar.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setShareUrl(null);

    try {
      const response = await carritoAPI.create({ items: cart, canal });
      setMessage({ type: 'success', text: 'Pedido creado correctamente.' });
      setShareUrl(response.data.shareUrl);
      setCart([]);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Tienda PawSpa</h1>
          <p className="text-sm text-gray-600 mt-1">Selecciona productos y realiza pedidos por WhatsApp o Telegram.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-primary-50 p-4">
              <p className="text-sm text-gray-500">Total items</p>
              <p className="mt-2 text-2xl font-semibold text-primary-700">{cart.length}</p>
            </div>
            <div className="rounded-3xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Canal</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900 capitalize">{canal}</p>
            </div>
            <div className="rounded-3xl bg-green-50 p-4">
              <p className="text-sm text-gray-500">Total</p>
              <p className="mt-2 text-2xl font-semibold text-green-700">Bs {total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Resumen del pedido</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Productos</span>
              <span>{cart.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Método</span>
              <span className="capitalize">{canal}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>Bs {total.toFixed(2)}</span>
            </div>
            <div>
              <label className="label">Canal de pedido</label>
              <select className="input w-full" value={canal} onChange={(e) => setCanal(e.target.value)}>
                <option value="local">Local</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="telegram">Telegram</option>
              </select>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? 'Procesando pedido...' : 'Confirmar pedido'}
            </button>
            {shareUrl && (
              <a href={shareUrl} target="_blank" rel="noreferrer" className="btn btn-secondary w-full py-3">
                Completar en {canal === 'whatsapp' ? 'WhatsApp' : 'Telegram'}
              </a>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div className={`rounded-2xl p-4 ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-6">
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Catálogo</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {productos.map((producto) => (
                <div key={producto.id} className="rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-50 text-primary-700 font-semibold">
                        {producto.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{producto.nombre}</h3>
                        <p className="text-sm text-gray-500 mt-1">{producto.descripcion || 'Sin descripción'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">Bs {Number(producto.precio).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                    <span>Stock: {producto.stock}</span>
                    <span className={producto.stock === 0 ? 'text-red-600' : 'text-green-600'}>
                      {producto.stock === 0 ? 'Agotado' : 'Disponible'}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(producto)}
                    disabled={producto.stock === 0}
                    className="btn btn-outline w-full py-2"
                  >
                    Añadir al carrito
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Carrito</h2>
            {cart.length === 0 ? (
              <p className="text-gray-600">No hay productos en el carrito.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.producto_id} className="rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
                        <p className="text-sm text-gray-500">Bs {item.precio_unitario.toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.producto_id)} className="text-red-600 text-sm">Eliminar</button>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <label className="text-sm text-gray-600">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        max={item.stock || 999}
                        value={item.cantidad}
                        onChange={(e) => updateQuantity(item.producto_id, Number(e.target.value))}
                        className="input w-24"
                      />
                      <span className="text-sm text-gray-500">Subtotal: Bs {(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
