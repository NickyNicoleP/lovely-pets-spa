import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fichaGroomingAPI, productosAPI, agendaAPI, groomersAPI } from '../services/api';

export default function Grooming() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEditGroomers = user && ['admin', 'administrador', 'empleado'].includes(user.rol);
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
  const [groomers, setGroomers] = useState([]);
  const [formData, setFormData] = useState({
    agenda_id: '',
    cliente_id: '',
    mascota_id: '',
    servicio_id: '',
    observaciones: '',
    // Estado de ingreso
    nudos_severos: false,
    heridas_lesiones: false,
    pulgas_garrapatas: false,
    suciedad_extrema: false,
    mal_olor: false,
    unas_largas: false,
    // Checklist obligatorio
    banio: false,
    secado: false,
    corte_pelo: false,
    limpieza_oidos: false,
    corte_unas: false,
    limpieza_glandulas: false,
    perfumado: false,
    revision_final: false,
    // Recomendaciones
    recomendaciones_dueño: ''
  });
  const [insumosSeleccionados, setInsumosSeleccionados] = useState([]);
  const [fotosForm, setFotosForm] = useState({
    antes: [],
    despues: []
  });
  const [productoTemporal, setProductoTemporal] = useState({
    producto_id: '',
    cantidad: 1
  });
  const [insumoData, setInsumoData] = useState({
    producto_id: '',
    cantidad: 1
  });

  const resumenFichas = useMemo(() => ({
    abiertas: fichas.filter((ficha) => !ficha.fecha_cierre).length,
    cerradas: fichas.filter((ficha) => !!ficha.fecha_cierre).length
  }), [fichas]);

  const availableAgendas = useMemo(() => {
    const reservaIdsConFicha = new Set(fichas
      .filter((ficha) => ficha.reserva_id != null)
      .map((ficha) => ficha.reserva_id));
    return agendas.filter((agenda) => !reservaIdsConFicha.has(agenda.id));
  }, [agendas, fichas]);

  useEffect(() => {
    loadFichas();
    loadGroomers();
    loadProductos();
  }, []);

  const loadGroomers = async () => {
    try {
      const response = await groomersAPI.getAll();
      setGroomers(response.data || []);
    } catch (error) {
      console.error('Error al cargar groomers:', error);
    }
  };

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
      let response = await agendaAPI.getAll({ estado: 'confirmada' });
      // Si no hay resultados por algún filtro, reintentar sin filtro
      if (!response.data || response.data.length === 0) {
        response = await agendaAPI.getAll();
      }
      setAgendas(response.data);
    } catch (error) {
      console.error('Error al cargar agendas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Contar items del checklist completados
      const checklistCount = [formData.banio, formData.secado, formData.corte_pelo, formData.limpieza_oidos, formData.corte_unas, formData.limpieza_glandulas, formData.perfumado, formData.revision_final].filter(Boolean).length;
      
      if (checklistCount < 4) {
        alert('Se requieren al menos 4 ítems del checklist marcados');
        return;
      }

      // API expects reserva_id, frontend uses agenda_id
      const payload = {
        reserva_id: formData.agenda_id ? parseInt(formData.agenda_id) : null,
        observaciones: formData.observaciones,
        // Estado de ingreso
        nudos: formData.nudos_severos,
        heridas: formData.heridas_lesiones,
        pulgas: formData.pulgas_garrapatas,
        suciedad_extrema: formData.suciedad_extrema,
        mal_olor: formData.mal_olor,
        unas_largas: formData.unas_largas,
        // Recomendaciones
        recomendaciones_dueño: formData.recomendaciones_dueño
      };
      const fichaRes = await fichaGroomingAPI.create(payload);
      const fichaId = fichaRes.data.id;

      // Agregar insumos
      for (const insumo of insumosSeleccionados) {
        await fichaGroomingAPI.addInsumo(fichaId, {
          producto_id: insumo.producto_id,
          cantidad: insumo.cantidad
        });
      }

      // Subir fotos
      for (const fotoBase64 of fotosForm.antes) {
        const blob = await fetch(fotoBase64).then(r => r.blob());
        const formDataFoto = new FormData();
        formDataFoto.append('file', blob);
        formDataFoto.append('tipo', 'antes');
        // Implement file upload if you have an upload endpoint
      }

      for (const fotoBase64 of fotosForm.despues) {
        const blob = await fetch(fotoBase64).then(r => r.blob());
        const formDataFoto = new FormData();
        formDataFoto.append('file', blob);
        formDataFoto.append('tipo', 'despues');
        // Implement file upload if you have an upload endpoint
      }

      setShowModal(false);
      setFormData({
        agenda_id: '',
        cliente_id: '',
        mascota_id: '',
        servicio_id: '',
        observaciones: '',
        nudos_severos: false,
        heridas_lesiones: false,
        pulgas_garrapatas: false,
        suciedad_extrema: false,
        mal_olor: false,
        unas_largas: false,
        banio: false,
        secado: false,
        corte_pelo: false,
        limpieza_oidos: false,
        corte_unas: false,
        limpieza_glandulas: false,
        perfumado: false,
        revision_final: false,
        recomendaciones_dueño: ''
      });
      setInsumosSeleccionados([]);
      setFotosForm({ antes: [], despues: [] });
      setProductoTemporal({ producto_id: '', cantidad: 1 });
      loadFichas();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const handleAddInsumo = async (e) => {
    e.preventDefault();
    try {
      await fichaGroomingAPI.addInsumo(selectedFicha.id, {
        producto_id: Number(insumoData.producto_id),
        cantidad: Number(insumoData.cantidad)
      });
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
        const errorMessage = error.response?.data?.error || error.message;
        const missingItems = error.response?.data?.missingItems;
        const completed = error.response?.data?.completed;

        let message = errorMessage;
        if (completed) {
          message += `\n${completed}`;
        }
        if (Array.isArray(missingItems) && missingItems.length > 0) {
          const missingNames = missingItems.map((item) => item.nombre || item.id).join(', ');
          message += `\nItems pendientes: ${missingNames}`;
        }

        alert(message);
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
            loadProductos();
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

      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Groomers disponibles</h2>
            <p className="text-sm text-gray-600">Ver la lista de groomers activos y su disponibilidad semanal.</p>
          </div>
        </div>

        {groomers.length === 0 ? (
          <div className="rounded-3xl border border-gray-100 bg-white p-6 text-sm text-gray-500">No hay groomers activos disponibles.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groomers.map((groomer) => (
              <div key={groomer.id} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-gray-500">{groomer.nombre}</p>
                <p className="mt-2 text-sm text-gray-700">Especialidades: {groomer.especialidades || 'Sin especialidades'}</p>
                <p className="mt-1 text-sm text-gray-700">Turno: {groomer.turno || 'No asignado'}</p>
                {canEditGroomers && (
                  <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
                    <span>Modificar disponibilidad semanal y horarios</span>
                    <button
                      type="button"
                      onClick={() => navigate('/grooming/editar-disponibilidad')}
                      className="inline-flex items-center justify-center rounded-full border border-primary-600 bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      Ir a editar disponibilidad
                    </button>
                  </div>
                )}
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Disponibilidad semanal</p>
                  {groomer.disponibilidad_semanal ? (
                    Object.entries(groomer.disponibilidad_semanal).map(([dia, disponible]) => {
                      const textoDisponibilidad = disponible && typeof disponible === 'object'
                        ? (disponible.activo ? 'Disponible' : 'No disponible')
                        : (typeof disponible === 'boolean' ? (disponible ? 'Disponible' : 'No disponible') : 'No disponible');

                      return (
                        <div key={dia} className="flex items-center justify-between text-sm text-gray-700">
                          <span className="capitalize">{dia}</span>
                          <span>{textoDisponibilidad}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No hay disponibilidad registrada.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
                {(() => {
                  const estadoFicha = ficha.fecha_cierre ? 'cerrada' : 'abierta';
                  return (
                    <>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(estadoFicha)}`}>
                        {estadoFicha}
                      </span>
                      <span className="text-sm text-gray-500">
                        {ficha.reserva_fecha_hora ? new Date(ficha.reserva_fecha_hora).toLocaleDateString() : '-'}
                      </span>
                    </>
                  );
                })()}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {ficha.cliente_nombre} {ficha.cliente_apellido}
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                Mascota: {ficha.mascota_nombre}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Servicio: {ficha.servicio_nombre}
              </p>
              <Link to={`/grooming/ficha/${ficha.id}`} className="text-sm text-fuchsia-600 hover:text-fuchsia-800 mb-4 inline-block">
                Ver ficha técnica
              </Link>
              {(ficha.fecha_cierre ? 'cerrada' : 'abierta') === 'abierta' && (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ficha Técnica de Grooming</h2>
            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
              
              {/* SECCIÓN 0: RESERVA */}
              <div className="border-b pb-4">
                <div className="mb-4">
                  <label className="label font-semibold">📋 Reserva *</label>
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
                    {availableAgendas.map((agenda) => (
                      <option key={agenda.id} value={agenda.id}>
                        {agenda.cliente_nombre} - {agenda.mascota_nombre} - {agenda.servicio_nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECCIÓN 1: ESTADO DE INGRESO */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">🔍 SECCIÓN 1: Estado de Ingreso</h3>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.nudos_severos} onChange={(e) => setFormData({...formData, nudos_severos: e.target.checked})} className="w-4 h-4" />
                    <span>Nudos severos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.heridas_lesiones} onChange={(e) => setFormData({...formData, heridas_lesiones: e.target.checked})} className="w-4 h-4" />
                    <span>Heridas o lesiones visibles</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.pulgas_garrapatas} onChange={(e) => setFormData({...formData, pulgas_garrapatas: e.target.checked})} className="w-4 h-4" />
                    <span>Presencia de pulgas/garrapatas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.suciedad_extrema} onChange={(e) => setFormData({...formData, suciedad_extrema: e.target.checked})} className="w-4 h-4" />
                    <span>Suciedad extrema</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.mal_olor} onChange={(e) => setFormData({...formData, mal_olor: e.target.checked})} className="w-4 h-4" />
                    <span>Mal olor</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.unas_largas} onChange={(e) => setFormData({...formData, unas_largas: e.target.checked})} className="w-4 h-4" />
                    <span>Uñas muy largas</span>
                  </label>
                </div>
              </div>

              {/* SECCIÓN 2: CHECKLIST OBLIGATORIO */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">✅ SECCIÓN 2: Checklist Obligatorio</h3>
                <p className="text-sm text-gray-600 mb-2">Se requieren al menos 4 ítems marcados para cerrar el servicio</p>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.banio} onChange={(e) => setFormData({...formData, banio: e.target.checked})} className="w-4 h-4" />
                    <span>Baño completo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.secado} onChange={(e) => setFormData({...formData, secado: e.target.checked})} className="w-4 h-4" />
                    <span>Secado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.corte_pelo} onChange={(e) => setFormData({...formData, corte_pelo: e.target.checked})} className="w-4 h-4" />
                    <span>Corte de pelo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.limpieza_oidos} onChange={(e) => setFormData({...formData, limpieza_oidos: e.target.checked})} className="w-4 h-4" />
                    <span>Limpieza de oídos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.corte_unas} onChange={(e) => setFormData({...formData, corte_unas: e.target.checked})} className="w-4 h-4" />
                    <span>Corte de uñas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.limpieza_glandulas} onChange={(e) => setFormData({...formData, limpieza_glandulas: e.target.checked})} className="w-4 h-4" />
                    <span>Limpieza de glándulas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.perfumado} onChange={(e) => setFormData({...formData, perfumado: e.target.checked})} className="w-4 h-4" />
                    <span>Perfumado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.revision_final} onChange={(e) => setFormData({...formData, revision_final: e.target.checked})} className="w-4 h-4" />
                    <span>Revisión final</span>
                  </label>
                </div>
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  Completados: {[formData.banio, formData.secado, formData.corte_pelo, formData.limpieza_oidos, formData.corte_unas, formData.limpieza_glandulas, formData.perfumado, formData.revision_final].filter(Boolean).length}/8
                </div>
              </div>

              {/* SECCIÓN 3: INSUMOS */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">🧴 SECCIÓN 3: Insumos Utilizados</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      className="flex-1 input"
                      value={productoTemporal.producto_id}
                      onChange={(e) => setProductoTemporal({...productoTemporal, producto_id: e.target.value})}
                    >
                      <option value="">Seleccionar producto</option>
                      {productos.filter(p => p.tipo === 'insumo' || p.tipo === 'ambos').map((prod) => (
                        <option key={prod.id} value={prod.id} disabled={prod.stock === 0}>
                          {prod.nombre} {prod.categoria_nombre ? `- ${prod.categoria_nombre}` : ''} (Stock: {prod.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      className="w-20 input"
                      value={productoTemporal.cantidad}
                      onChange={(e) => setProductoTemporal({...productoTemporal, cantidad: parseInt(e.target.value)})}
                      placeholder="Cant"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (productoTemporal.producto_id) {
                          setInsumosSeleccionados([...insumosSeleccionados, {
                            producto_id: parseInt(productoTemporal.producto_id),
                            cantidad: productoTemporal.cantidad,
                            nombre: productos.find(p => p.id === parseInt(productoTemporal.producto_id))?.nombre
                          }]);
                          setProductoTemporal({ producto_id: '', cantidad: 1 });
                        }
                      }}
                      className="btn btn-outline text-sm"
                    >
                      Agregar
                    </button>
                  </div>
                  
                  {insumosSeleccionados.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded space-y-2">
                      {insumosSeleccionados.map((insumo, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                          <span>{insumo.nombre} x {insumo.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => setInsumosSeleccionados(insumosSeleccionados.filter((_, i) => i !== idx))}
                            className="text-red-600 hover:text-red-800"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 4: FOTOS */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">📸 SECCIÓN 4: Fotos de Antes y Después</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label text-sm">Fotos ANTES del servicio</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFotosForm({...fotosForm, antes: [...fotosForm.antes, event.target.result]});
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className="input"
                    />
                    {fotosForm.antes.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {fotosForm.antes.map((foto, idx) => (
                          <div key={idx} className="relative">
                            <img src={foto} alt="antes" className="w-full h-20 object-cover rounded border" />
                            <button
                              type="button"
                              onClick={() => setFotosForm({...fotosForm, antes: fotosForm.antes.filter((_, i) => i !== idx)})}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label text-sm">Fotos DESPUÉS del servicio</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        files.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setFotosForm({...fotosForm, despues: [...fotosForm.despues, event.target.result]});
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                      className="input"
                    />
                    {fotosForm.despues.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {fotosForm.despues.map((foto, idx) => (
                          <div key={idx} className="relative">
                            <img src={foto} alt="despues" className="w-full h-20 object-cover rounded border" />
                            <button
                              type="button"
                              onClick={() => setFotosForm({...fotosForm, despues: fotosForm.despues.filter((_, i) => i !== idx)})}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: RECOMENDACIONES */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg text-gray-800 mb-3">💡 SECCIÓN 5: Recomendaciones para el Dueño</h3>
                <textarea
                  className="input w-full"
                  rows={3}
                  placeholder="Escribe recomendaciones para el dueño de la mascota..."
                  value={formData.recomendaciones_dueño}
                  onChange={(e) => setFormData({ ...formData, recomendaciones_dueño: e.target.value })}
                />
              </div>

              {/* Observaciones */}
              <div className="mb-4">
                <label className="label font-semibold">📝 Observaciones</label>
                <textarea
                  className="input"
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t">
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