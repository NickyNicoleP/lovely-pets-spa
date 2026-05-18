import { useState, useEffect } from 'react';
import { productosAPI } from '../services/api';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGaleria, setShowGaleria] = useState(false);
  const [selectedProductoId, setSelectedProductoId] = useState(null);
  const [editingProducto, setEditingProducto] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    umbral_alerta: ''
  });

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      const response = await productosAPI.getAll();
      setProductos(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadImagenes = async (productoId) => {
    try {
      const response = await productosAPI.getImagenes(productoId);
      setImagenes(response.data);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProducto) {
        await productosAPI.update(editingProducto.id, formData);
      } else {
        await productosAPI.create(formData);
      }
      setShowModal(false);
      setEditingProducto(null);
      setFormData({ nombre: '', descripcion: '', precio: '', stock: '', umbral_alerta: '' });
      loadProductos();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const handleEdit = (producto) => {
    setEditingProducto(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      stock: producto.stock,
      umbral_alerta: producto.umbral_alerta
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productosAPI.delete(id);
        loadProductos();
      } catch (error) {
        alert(error.response?.data?.error || error.message);
      }
    }
  };

  const handleUploadImage = async (e, productoId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formDataFile = new FormData();
      formDataFile.append('imagen', file);

      // Subir archivo
      const uploadResponse = await productosAPI.uploadImage(formDataFile);

      // Guardar referencia en BD
      await productosAPI.agregarImagen({
        productoId,
        rutaArchivo: uploadResponse.data.path,
        urlImagen: uploadResponse.data.path,
        esPrincipal: imagenes.length === 0
      });

      await loadImagenes(productoId);
      await loadProductos();
    } catch (error) {
      alert('Error al subir imagen: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imagenId) => {
    if (confirm('¿Eliminar esta imagen?')) {
      try {
        await productosAPI.deleteImage(imagenId);
        await loadImagenes(selectedProductoId);
        await loadProductos();
      } catch (error) {
        alert(error.response?.data?.error || error.message);
      }
    }
  };

  const handleSetMainImage = async (imagenId) => {
    try {
      await productosAPI.setMainImage(imagenId);
      await loadImagenes(selectedProductoId);
      await loadProductos();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const getStockColor = (stock, minimo) => {
    if (stock <= minimo) return 'text-red-600 bg-red-50';
    if (stock <= minimo * 2) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const openGaleria = (productoId) => {
    setSelectedProductoId(productoId);
    setShowGaleria(true);
    loadImagenes(productoId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary-700">Productos 📦</h1>
        <button
          onClick={() => {
            setEditingProducto(null);
            setFormData({ nombre: '', descripcion: '', precio: '', stock: '', umbral_alerta: '' });
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + Nuevo Producto
        </button>
      </div>

      {/* Productos list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500"></div>
        </div>
      ) : productos.length === 0 ? (
        <div className="glass-card text-center py-12">
          <svg className="w-16 h-16 text-primary-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-primary-600 font-semibold">No hay productos aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto) => (
            <div key={producto.id} className="glass-card hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Imagen del producto */}
              <div className="relative h-48 bg-gradient-to-br from-primary-100 to-pink-100 flex items-center justify-center mb-4 rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => openGaleria(producto.id)}>
                {producto.imagen ? (
                  <img 
                    src={producto.imagen}
                    alt={producto.nombre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center">
                    <svg className="w-12 h-12 text-primary-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-primary-500">Sin foto</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{producto.nombre}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{producto.descripcion}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-primary-200">
                <p className="text-lg font-bold text-primary-600">Bs {producto.precio}</p>
                <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getStockColor(producto.stock, producto.umbral_alerta)}`}>
                  Stock: {producto.stock}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openGaleria(producto.id)}
                  className="flex-1 px-2 py-2 text-xs font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Fotos
                </button>
                <button
                  onClick={() => handleEdit(producto)}
                  className="flex-1 px-2 py-2 text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  ✎ Editar
                </button>
                <button
                  onClick={() => handleDelete(producto.id)}
                  className="flex-1 px-2 py-2 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                >
                  🗑️ Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-primary-700 mb-4">
              {editingProducto ? '✎ Editar Producto' : '+ Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Nombre *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea
                  className="input"
                  rows={2}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el producto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Precio *</label>
                  <input
                    type="number"
                    className="input"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="label">Stock *</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="label">Umbral de Alerta</label>
                <input
                  type="number"
                  className="input"
                  value={formData.umbral_alerta}
                  onChange={(e) => setFormData({ ...formData, umbral_alerta: e.target.value })}
                  placeholder="5"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  {editingProducto ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Galería de Imágenes */}
      {showGaleria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-primary-700 mb-6">Fotos del Producto</h2>
            
            {/* Subir imagen */}
            <div className="mb-6">
              <label className="block">
                <div className="border-2 border-dashed border-primary-300 rounded-xl p-6 text-center cursor-pointer hover:bg-primary-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUploadImage(e, selectedProductoId)}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <svg className="w-10 h-10 text-primary-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="font-semibold text-primary-700">
                    {uploadingImage ? 'Subiendo...' : 'Click para subir imagen'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF (máx 5MB)</p>
                </div>
              </label>
            </div>

            {/* Galería */}
            {imagenes.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-primary-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500">Sin imágenes aún</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {imagenes.map((imagen) => (
                  <div key={imagen.id} className="relative group">
                    <img
                      src={imagen.url_imagen}
                      alt="Producto"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {imagen.es_principal && (
                      <div className="absolute top-2 left-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-bold">
                        ⭐ Principal
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 rounded-lg transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {!imagen.es_principal && (
                        <button
                          onClick={() => handleSetMainImage(imagen.id)}
                          className="bg-primary-500 hover:bg-primary-600 text-white p-2 rounded"
                          title="Establecer como principal"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(imagen.id)}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGaleria(false)}
                className="flex-1 btn btn-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}