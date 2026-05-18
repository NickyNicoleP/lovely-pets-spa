import { useState, useEffect, useMemo } from 'react';
import { agendaAPI, clientesAPI, mascotasAPI, serviciosAPI } from '../services/api';

export default function Agenda() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    cliente_id: '',
    mascota_id: '',
    servicio_id: '',
    hora: '',
    observaciones: ''
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
      const response = await agendaAPI.getHorarios({ fecha: selectedDate, servicio_id: formData.servicio_id });
      setHorariosDisponibles(response.data);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await agendaAPI.create({
        ...formData,
        fecha: selectedDate
      });
      setShowModal(false);
      setFormData({ cliente_id: '', mascota_id: '', servicio_id: '', hora: '', observaciones: '' });
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

      {/* Date selector */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <button
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
        <div className="card text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">No hay reservas para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservas.map((reserva) => (
            <div key={reserva.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600">{reserva.hora.slice(0, 5)}</span>
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
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(reserva.estado)}`}>
                  {reserva.estado}
                </span>
                <button
                  onClick={() => handleDelete(reserva.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Reserva</h2>
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
    </div>
  );
}