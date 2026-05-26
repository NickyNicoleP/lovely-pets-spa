import { useState, useEffect, useMemo } from 'react';
import { agendaAPI, clientesAPI, mascotasAPI, serviciosAPI } from '../services/api';

export default function Agenda() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const getLocalIsoDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [selectedDate, setSelectedDate] = useState(getLocalIsoDate());
  const [formData, setFormData] = useState({
    cliente_id: '',
    mascota_id: '',
    servicio_id: '',
    hora: '',
    observaciones: '',
    promoCode: ''
  });
  const [clientes, setClientes] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [showPetForm, setShowPetForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  const [newPetData, setNewPetData] = useState({
    nombre: '',
    especie: '',
    raza: '',
    edad: '',
    peso: '',
    observaciones: ''
  });
  const [promociones] = useState([
    { codigo: 'BIENVENIDA', descuento: 15, descripcion: '15% de descuento en la primera reserva' },
    { codigo: 'SPA20', descuento: 20, descripcion: '20% de descuento para grooming completo' },
    { codigo: 'FIEL', descuento: 10, descripcion: '10% de descuento para clientes frecuentes' }
  ]);
  const sampleReservas = [
    {
      id: 'demo-1',
      cliente_nombre: 'María',
      cliente_apellido: 'Pérez',
      mascota_nombre: 'Luna',
      servicio_nombre: 'Baño Completo',
      hora: '09:30',
      precio_final: 45.0,
      estado: 'confirmada',
      canal_reserva: 'web',
      observaciones: 'Demostración de agenda con reserva activa'
    },
    {
      id: 'demo-2',
      cliente_nombre: 'Carlos',
      cliente_apellido: 'Ramírez',
      mascota_nombre: 'Kira',
      servicio_nombre: 'Corte de Pelo',
      hora: '11:00',
      precio_final: 50.0,
      estado: 'pendiente',
      canal_reserva: 'whatsapp',
      observaciones: 'Ejemplo de cita para mostrar funcionalidad'
    }
  ];
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedReservaPago, setSelectedReservaPago] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [selectedPromoCode, setSelectedPromoCode] = useState('');

  const resumenReservas = useMemo(() => {
    const estados = { pendiente: 0, confirmada: 0, completada: 0, cancelada: 0 };
    reservas.forEach((reserva) => {
      estados[reserva.estado] = (estados[reserva.estado] || 0) + 1;
    });
    return estados;
  }, [reservas]);

  useEffect(() => {
    loadReservas();
    loadServicios();
  }, [selectedDate]);

  useEffect(() => {
    if (formData.cliente_id) {
      loadMascotas(formData.cliente_id);
    }
  }, [formData.cliente_id]);

  useEffect(() => {
    if (formData.servicio_id && selectedDate) {
      loadHorarios();
    }
  }, [formData.servicio_id, selectedDate]);

  const loadReservas = async () => {
    try {
      const response = await agendaAPI.getAll({ fecha: selectedDate });
      setReservas(response.data);
    } catch (error) {
      console.error('Error al cargar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServicios = async () => {
    try {
      const response = await serviciosAPI.getAll();
      setServicios(response.data);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    }
  };

  const loadClientes = async () => {
    try {
      const response = await clientesAPI.getAll();
      setClientes(response.data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const response = await clientesAPI.create(newClientData);
      const cliente = response.data;
      await loadClientes();
      setShowClientForm(false);
      setFormData({ ...formData, cliente_id: cliente.id, mascota_id: '' });
      setNewClientData({ nombre: '', apellido: '', email: '', telefono: '', direccion: '' });
      setShowPetForm(false);
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const handleCreatePet = async (e) => {
    e.preventDefault();
    if (!formData.cliente_id) {
      return alert('Primero selecciona o crea un cliente para asociar la mascota.');
    }

    try {
      const response = await mascotasAPI.create({
        cliente_id: formData.cliente_id,
        ...newPetData
      });
      const mascota = response.data;
      await loadMascotas(formData.cliente_id);
      setShowPetForm(false);
      setFormData({ ...formData, mascota_id: mascota.id });
      setNewPetData({ nombre: '', especie: '', raza: '', edad: '', peso: '', observaciones: '' });
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const loadMascotas = async (clienteId) => {
    try {
      const response = await clientesAPI.getMascotas(clienteId);
      setMascotas(response.data);
    } catch (error) {
      console.error('Error al cargar mascotas:', error);
    }
  };

  const loadHorarios = async () => {
    try {
      const params = {
        fecha: selectedDate,
        servicio_id: formData.servicio_id
      };
      if (formData.mascota_id) {
        params.mascota_id = formData.mascota_id;
      }
      const response = await agendaAPI.getHorarios(params);
      setHorariosDisponibles(response.data);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    }
  };

  const selectedService = servicios.find((servicio) => servicio.id === Number(formData.servicio_id));

  const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(selectedDate));

  const calcularPrecioConPromo = (precio, promoCode) => {
    const promo = promociones.find((p) => p.codigo === promoCode);
    if (!promo) return Number(precio || 0);
    return Number((precio * (1 - promo.descuento / 100)).toFixed(2));
  };

  const handleOpenPaymentModal = (reserva) => {
    setSelectedReservaPago(reserva);
    setSelectedPromoCode('');
    setPaymentMethod('efectivo');
    setPaymentModalOpen(true);
  };

  const handleConfirmarPago = async () => {
    if (!selectedReservaPago) return;

    const precioBase = selectedReservaPago.precio_final || selectedReservaPago.precio_servicio || 0;
    const precioCalculado = calcularPrecioConPromo(precioBase, selectedPromoCode);
    const observacionesPago = `Pago ${paymentMethod}${selectedPromoCode ? ` con promo ${selectedPromoCode}` : ''}`;

    try {
      await agendaAPI.update(selectedReservaPago.id, {
        estado: 'completada',
        observaciones: observacionesPago,
        precio_final: precioCalculado
      });
      setPaymentModalOpen(false);
      setSelectedReservaPago(null);
      setSelectedPromoCode('');
      loadReservas();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const precioBase = selectedService?.precio || 0;
    const precioCalculado = calcularPrecioConPromo(precioBase, formData.promoCode);

    try {
      await agendaAPI.create({
        ...formData,
        fecha: selectedDate,
        precio_final: precioCalculado
      });
      setShowModal(false);
      setFormData({ cliente_id: '', mascota_id: '', servicio_id: '', hora: '', observaciones: '', promoCode: '' });
      loadReservas();
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta reserva?')) {
      try {
        await agendaAPI.delete(id);
        loadReservas();
      } catch (error) {
        alert(error.response?.data?.error || error.message);
      }
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

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-600 mt-1">Gestiona reservas y elige horarios disponibles para tu spa canino.</p>
        </div>
        <button
          onClick={() => {
            loadClientes();
            setShowModal(true);
          }}
          className="btn btn-primary"
        >
          + Nueva Reserva
        </button>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm mb-6">
        <p className="text-sm font-semibold text-primary-700 uppercase tracking-[0.2em]">{fechaFormateada}</p>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">Módulo de recepción</h2>
        <p className="mt-3 text-gray-600 max-w-2xl">
          Calendario maestro, gestión de citas, clientes, pagos y promociones. Aquí puedes crear reservas, ver clientes y mascotas, registrar pagos y mostrar el avance funcional del módulo.
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {['Citas', 'Clientes', 'Pagos', 'Promociones'].map((item) => (
            <div key={item} className="rounded-3xl border border-gray-100 bg-gray-50 px-4 py-3 shadow-sm">
              <p className="text-sm text-gray-500">{item}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">Funciona</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-4">
        {[
          { label: 'Reservas', value: reservas.length, accent: 'bg-primary-50 text-primary-700' },
          { label: 'Pendientes', value: resumenReservas.pendiente, accent: 'bg-yellow-50 text-yellow-700' },
          { label: 'Confirmadas', value: resumenReservas.confirmada, accent: 'bg-blue-50 text-blue-700' },
          { label: 'Completadas', value: resumenReservas.completada, accent: 'bg-green-50 text-green-700' }
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{item.label}</p>
            <p className={`mt-4 text-3xl font-semibold ${item.accent}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 mb-6 md:grid-cols-3">
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total ingresado</p>
          <p className="mt-4 text-3xl font-semibold text-green-700">
            Bs {reservas.filter((r) => r.estado === 'completada').reduce((sum, r) => sum + Number(r.precio_final || r.precio_servicio || 0), 0).toFixed(2)}
          </p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pagos pendientes</p>
          <p className="mt-4 text-3xl font-semibold text-yellow-700">{resumenReservas.pendiente}</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Promociones activas</p>
          <p className="mt-4 text-3xl font-semibold text-primary-700">{promociones.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Promociones disponibles</h2>
        <div className="grid gap-3 mt-4 sm:grid-cols-3">
          {promociones.map((promo) => (
            <div key={promo.codigo} className="rounded-3xl border border-primary-100 bg-primary-50 p-4">
              <p className="text-sm font-semibold text-primary-700">{promo.codigo}</p>
              <p className="text-sm text-gray-600 mt-2">{promo.descripcion}</p>
              <p className="mt-3 text-sm font-medium text-primary-700">{promo.descuento}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Date selector */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Fecha anterior"
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() - 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input max-w-xs"
          />
          <button
            type="button"
            aria-label="Fecha siguiente"
            onClick={() => {
              const date = new Date(selectedDate);
              date.setDate(date.getDate() + 1);
              setSelectedDate(date.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Reservas list */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : reservas.length === 0 ? (
        <div className="space-y-4">
          <div className="card p-6 bg-primary-50 border-primary-100 text-primary-900">
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">Reservas de demostración</p>
            <p className="mt-3 text-gray-700">No hay reservas reales para esta fecha, pero aquí tienes ejemplos de cómo se verían las citas activas.</p>
          </div>
          {sampleReservas.map((reserva) => (
            <div key={reserva.id} className="card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-600">{reserva.hora}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{reserva.cliente_nombre} {reserva.cliente_apellido}</p>
                    <p className="text-sm text-gray-500">{reserva.mascota_nombre} - {reserva.servicio_nombre}</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(reserva.estado)}`}>
                    {reserva.estado}
                  </span>
                  <p className="text-sm text-gray-500">Monto: Bs {reserva.precio_final.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Canal</p>
                  <p className="mt-2 font-medium text-gray-900">{reserva.canal_reserva}</p>
                </div>
                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Detalle</p>
                  <p className="mt-2 text-sm text-gray-700">{reserva.observaciones}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map((reserva) => {
            const precio = reserva.precio_final || reserva.precio_servicio || 0;
            return (
              <div key={reserva.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center">
                      <span className="text-lg font-bold text-primary-600">{reserva.hora?.slice(0, 5) ?? '--:--'}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {reserva.cliente_nombre} {reserva.cliente_apellido}
                      </p>
                      <p className="text-sm text-gray-500">
                        {reserva.mascota_nombre} - {reserva.servicio_nombre}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(reserva.estado)}`}>
                      {reserva.estado}
                    </span>
                    <p className="text-sm text-gray-500">Monto: Bs {Number(precio).toFixed(2)}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Canal</p>
                    <p className="mt-2 font-medium text-gray-900">{reserva.canal_reserva || 'web'}</p>
                  </div>
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Detalle</p>
                    <p className="mt-2 text-sm text-gray-700">{reserva.observaciones || 'Sin observaciones'}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {reserva.estado !== 'completada' && (
                    <button
                      type="button"
                      onClick={() => handleOpenPaymentModal(reserva)}
                      className="btn btn-secondary"
                    >
                      Registrar pago
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(reserva.id)}
                    className="btn btn-danger"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="agenda-modal-title" className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 id="agenda-modal-title" className="text-xl font-bold text-gray-900 mb-4">Nueva Reserva</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="label">Cliente</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="input flex-1"
                    value={formData.cliente_id}
                    onChange={(e) => {
                      setFormData({ ...formData, cliente_id: e.target.value, mascota_id: '' });
                      setShowPetForm(false);
                    }}
                    required
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nombre} {cliente.apellido}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setShowClientForm(!showClientForm);
                      setShowPetForm(false);
                    }}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    {showClientForm ? 'Cancelar' : '+ Nuevo cliente'}
                  </button>
                </div>
              </div>

              {showClientForm && (
                <div className="mb-4 border rounded-xl border-gray-200 p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3">Registrar cliente</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="input"
                      placeholder="Nombre"
                      value={newClientData.nombre}
                      onChange={(e) => setNewClientData({ ...newClientData, nombre: e.target.value })}
                      required
                    />
                    <input
                      className="input"
                      placeholder="Apellido"
                      value={newClientData.apellido}
                      onChange={(e) => setNewClientData({ ...newClientData, apellido: e.target.value })}
                      required
                    />
                    <input
                      type="email"
                      className="input"
                      placeholder="Email"
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      required
                    />
                    <input
                      className="input"
                      placeholder="Teléfono"
                      value={newClientData.telefono}
                      onChange={(e) => setNewClientData({ ...newClientData, telefono: e.target.value })}
                    />
                    <textarea
                      className="input col-span-full"
                      rows={2}
                      placeholder="Dirección"
                      value={newClientData.direccion}
                      onChange={(e) => setNewClientData({ ...newClientData, direccion: e.target.value })}
                    />
                  </div>
                  <div className="mt-3 text-right">
                    <button type="button" onClick={handleCreateClient} className="btn btn-primary">
                      Guardar cliente
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="label">Mascota</label>
                <div className="flex gap-2 items-center">
                  <select
                    className="input flex-1"
                    value={formData.mascota_id}
                    onChange={(e) => setFormData({ ...formData, mascota_id: e.target.value })}
                    required
                    disabled={!formData.cliente_id}
                  >
                    <option value="">Seleccionar mascota</option>
                    {mascotas.map((mascota) => (
                      <option key={mascota.id} value={mascota.id}>
                        {mascota.nombre} ({mascota.especie})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowPetForm(!showPetForm)}
                    className="btn btn-secondary whitespace-nowrap"
                    disabled={!formData.cliente_id}
                  >
                    {showPetForm ? 'Cancelar' : '+ Nueva mascota'}
                  </button>
                </div>
              </div>

              {showPetForm && (
                <div className="mb-4 border rounded-xl border-gray-200 p-4 bg-gray-50">
                  <h3 className="font-semibold mb-3">Registrar mascota</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className="input"
                      placeholder="Nombre"
                      value={newPetData.nombre}
                      onChange={(e) => setNewPetData({ ...newPetData, nombre: e.target.value })}
                      required
                    />
                    <input
                      className="input"
                      placeholder="Especie"
                      value={newPetData.especie}
                      onChange={(e) => setNewPetData({ ...newPetData, especie: e.target.value })}
                      required
                    />
                    <input
                      className="input"
                      placeholder="Raza"
                      value={newPetData.raza}
                      onChange={(e) => setNewPetData({ ...newPetData, raza: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Edad"
                      value={newPetData.edad}
                      onChange={(e) => setNewPetData({ ...newPetData, edad: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Peso"
                      value={newPetData.peso}
                      onChange={(e) => setNewPetData({ ...newPetData, peso: e.target.value })}
                    />
                    <textarea
                      className="input col-span-full"
                      rows={2}
                      placeholder="Observaciones"
                      value={newPetData.observaciones}
                      onChange={(e) => setNewPetData({ ...newPetData, observaciones: e.target.value })}
                    />
                  </div>
                  <div className="mt-3 text-right">
                    <button type="button" onClick={handleCreatePet} className="btn btn-primary">
                      Guardar mascota
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="label">Servicio</label>
                <select
                  className="input"
                  value={formData.servicio_id}
                  onChange={(e) => setFormData({ ...formData, servicio_id: e.target.value, hora: '' })}
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  {servicios.map((servicio) => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre} - Bs {servicio.precio} ({servicio.duracion_minutos} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="label">Promoción</label>
                <select
                  className="input"
                  value={formData.promoCode || ''}
                  onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                >
                  <option value="">Ninguna</option>
                  {promociones.map((promo) => (
                    <option key={promo.codigo} value={promo.codigo}>
                      {promo.codigo} - {promo.descuento}%
                    </option>
                  ))}
                </select>
                {selectedService && formData.promoCode && (
                  <p className="text-sm text-green-600 mt-2">
                    Precio con promo: Bs {calcularPrecioConPromo(selectedService.precio, formData.promoCode).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="label">Horario</label>
                <select
                  className="input"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  required
                  disabled={horariosDisponibles.length === 0}
                >
                  <option value="">Seleccionar horario</option>
                  {horariosDisponibles.map((horario) => (
                    <option key={horario} value={horario}>
                      {horario.slice(0, 5)}
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
                  Crear Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentModalOpen && selectedReservaPago && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="payment-modal-title" className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 id="payment-modal-title" className="text-xl font-bold text-gray-900 mb-4">Registrar pago</h2>
            <div className="space-y-4">
              <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Reserva</p>
                <p className="font-medium text-gray-900 mt-2">{selectedReservaPago.cliente_nombre} - {selectedReservaPago.mascota_nombre}</p>
                <p className="text-sm text-gray-600">Servicio: {selectedReservaPago.servicio_nombre}</p>
                <p className="text-sm text-gray-600">Hora: {selectedReservaPago.hora?.slice(0, 5) ?? '--:--'}</p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="label">Método de pago</label>
                  <select
                    className="input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="qr">QR</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="link_pago">Link de pago</option>
                  </select>
                </div>

                <div>
                  <label className="label">Promoción</label>
                  <select
                    className="input"
                    value={selectedPromoCode}
                    onChange={(e) => setSelectedPromoCode(e.target.value)}
                  >
                    <option value="">Ninguna</option>
                    {promociones.map((promo) => (
                      <option key={promo.codigo} value={promo.codigo}>
                        {promo.codigo} - {promo.descuento}%
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Total a pagar</p>
                  <p className="mt-2 text-xl font-semibold text-gray-900">
                    Bs {calcularPrecioConPromo(selectedReservaPago.precio_final || selectedReservaPago.precio_servicio || 0, selectedPromoCode).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarPago}
                  className="flex-1 btn btn-primary"
                >
                  Confirmar pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}