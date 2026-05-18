import { useState, useEffect, useMemo } from 'react';
import { fichaGroomingAPI, productosAPI, agendaAPI } from '../services/api';

export default function Grooming() {
const [showEditModal, setShowEditModal] = useState(false);
const [editFicha, setEditFicha] = useState(null);
const [checklist, setChecklist] = useState({
  cepillado: false,
  banio: false,
  corte: false,
  unias: false,
  oidos: false
});
const [fotosAntes, setFotosAntes] = useState([]);
const [fotosDespues, setFotosDespues] = useState([]);
const [tempObservaciones, setTempObservaciones] = useState('');
  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showInsumoModal, setShowInsumoModal] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState(null);
  const [productos, setProductos] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [formData, setFormData] = useState({
    agenda_id: '',
    cliente_id: '',
    mascota_id: '',
    servicio_id: '',
    observaciones: ''
  });
  const [insumoData, setInsumoData] = useState({
    producto_id: '',
    cantidad: 1
  });

  const resumenFichas = useMemo(() => ({
    abiertas: fichas.filter((ficha) => ficha.estado === 'abierta').length,
    cerradas: fichas.filter((ficha) => ficha.estado === 'cerrada').length
  }), [fichas]);

  useEffect(() => {
    loadFichas();
  }, []);

  const loadFichas = async () => {
    try {
      const response = await fichaGroomingAPI.getAll({});
      setFichas(response.data);
    } catch (error) {
      console.error('Error al cargar fichas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductos = async () => {
    try {
      const response = await productosAPI.getAll();
      setProductos(response.data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const loadAgendas = async () => {
    try {
      const response = await agendaAPI.getAll({ estado: 'confirmada' });
      setAgendas(response.data);
    } catch (error) {
      console.error('Error al cargar agendas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fichaGroomingAPI.create(formData);
      setShowModal(false);
      setFormData({ agenda_id: '', cliente_id: '', mascota_id: '', servicio_id: '', observaciones: '' });
      loadFichas();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const handleAddInsumo = async (e) => {
    e.preventDefault();
    try {
      await fichaGroomingAPI.addInsumo(selectedFicha.id, insumoData);
      setShowInsumoModal(false);
      setInsumoData({ producto_id: '', cantidad: 1 });
      loadFichas();
      loadSelectedFicha(selectedFicha.id);
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };
  const handleEditFicha = async (ficha) => {
  // Cargar datos actuales de la ficha (si tiene checklist y fotos)
    await loadSelectedFicha(ficha.id);
    if (selectedFicha) {
      setChecklist(selectedFicha.checklist || checklist);
      setFotosAntes(selectedFicha.fotos_antes || []);
      setFotosDespues(selectedFicha.fotos_despues || []);
      setTempObservaciones(selectedFicha.observaciones || '');
      setEditFicha(selectedFicha);
      setShowEditModal(true);
    } 
  };
  const convertirABase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

const handleSubirFoto = async (e, tipo) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await convertirABase64(file);
    if (tipo === 'antes') {
      setFotosAntes([...fotosAntes, base64]);
    } else {
      setFotosDespues([...fotosDespues, base64]);
    }
  };

  const handleClose = async (id) => {
    if (confirm('¿Estás seguro de cerrar esta ficha? Se registrarán los movimientos de inventario.')) {
      try {
        await fichaGroomingAPI.close(id);
        loadFichas();
      } catch (error) {
        alert(error.response?.data?.error || error.message);
      }
    }
  };

  const loadSelectedFicha = async (id) => {
    try {
      const response = await fichaGroomingAPI.getById(id);
      setSelectedFicha(response.data);
    } catch (error) {
      console.error('Error al cargar ficha:', error);
    }
  };

  const handleOpenDetails = async (ficha) => {
    await loadSelectedFicha(ficha.id);
  };

  const getEstadoColor = (estado) => {
    const colors = {
      abierta: 'bg-blue-100 text-blue-800',
      cerrada: 'bg-green-100 text-green-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grooming</h1>
          <p className="text-sm text-gray-600 mt-1">Controla las fichas de grooming y registra los insumos utilizados.</p>
        </div>
        <button
          onClick={() => {
            loadAgendas();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + Nueva Ficha
        </button>
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Fichas abiertas</p>
          <p className="mt-4 text-3xl font-semibold text-blue-700">{resumenFichas.abiertas}</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Fichas cerradas</p>
          <p className="mt-4 text-3xl font-semibold text-green-700">{resumenFichas.cerradas}</p>
        </div>
      </div>

      {/* Fichas list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : fichas.length === 0 ? (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500">No hay fichas de grooming</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fichas.map((ficha) => (
            <div key={ficha.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(ficha.estado)}`}>
                  {ficha.estado}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(ficha.fecha_hora_inicio).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {ficha.cliente_nombre} {ficha.cliente_apellido}
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                Mascota: {ficha.mascota_nombre}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Servicio: {ficha.servicio_nombre}
              </p>
              {ficha.estado === 'abierta' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedFicha(ficha);
                      loadProductos();
                      setShowInsumoModal(true);
                    }}
                    className="flex-1 btn btn-outline text-sm py-2"
                  >
                    Agregar Insumo
                  </button>
                  <button
                    onClick={() => handleClose(ficha.id)}
                    className="flex-1 btn btn-primary text-sm py-2"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nueva Ficha Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Ficha de Grooming</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="label">Reserva</label>
                <select
                  className="input"
                  value={formData.agenda_id}
                  onChange={(e) => {
                    const agenda = agendas.find(a => a.id === parseInt(e.target.value));
                    setFormData({
                      ...formData,
                      agenda_id: e.target.value,
                      cliente_id: agenda?.cliente_id,
                      mascota_id: agenda?.mascota_id,
                      servicio_id: agenda?.servicio_id
                    });
                  }}
                  required
                >
                  <option value="">Seleccionar reserva</option>
                  {agendas.map((agenda) => (
                    <option key={agenda.id} value={agenda.id}>
                      {agenda.cliente_nombre} - {agenda.mascota_nombre} - {agenda.servicio_nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="label">Observaciones</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Crear Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agregar Insumo Modal */}
      {showInsumoModal && selectedFicha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Agregar Insumo</h2>
            <form onSubmit={handleAddInsumo}>
              <div className="mb-4">
                <label className="label">Producto</label>
                <select
                  className="input"
                  value={insumoData.producto_id}
                  onChange={(e) => setInsumoData({ ...insumoData, producto_id: e.target.value })}
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map((producto) => (
                    <option key={producto.id} value={producto.id} disabled={producto.stock === 0}>
                      {producto.nombre} - Stock: {producto.stock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="label">Cantidad</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  value={insumoData.cantidad}
                  onChange={(e) => setInsumoData({ ...insumoData, cantidad: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInsumoModal(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}