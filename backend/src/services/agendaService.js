const pool = require('../config/database');
const authService = require('./authService');

class AgendaService {
  async getAll(filters = {}) {
    let query = `
      SELECT a.id,
             a.groomer_id,
             DATE(a.fecha_hora) as fecha,
             TIME(a.fecha_hora) as hora,
             a.estado,
             a.precio_final,
             a.canal_reserva,
             m.id as mascota_id,
             m.nombre as mascota_nombre,
             m.especie as mascota_especie,
             m.raza as mascota_raza,
             c.id as cliente_id,
             u.nombre as cliente_nombre,
             u.apellido as cliente_apellido,
             s.id as servicio_id,
             s.nombre as servicio_nombre,
             s.duracion_min as duracion_servicio,
             s.precio_base as precio_servicio
      FROM SLOT_RESERVA a
      JOIN MASCOTA m ON a.mascota_id = m.id
      JOIN CLIENTE c ON m.cliente_id = c.id
      JOIN USUARIO u ON c.usuario_id = u.id
      JOIN SERVICIO s ON a.servicio_id = s.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.fecha) {
      query += ' AND DATE(a.fecha_hora) = ?';
      params.push(filters.fecha);
    }

    if (filters.estado) {
      query += ' AND a.estado = ?';
      params.push(filters.estado);
    }

    if (filters.cliente_id) {
      query += ' AND c.id = ?';
      params.push(filters.cliente_id);
    }

    query += ' ORDER BY a.fecha_hora';

    const [agenda] = await pool.execute(query, params);
    return agenda;
  }

  async getById(id) {
    const [agenda] = await pool.execute(
      `SELECT a.id,
              a.groomer_id,
              DATE(a.fecha_hora) as fecha,
              TIME(a.fecha_hora) as hora,
              a.estado,
              a.precio_final,
              a.canal_reserva,
              m.id as mascota_id,
              m.nombre as mascota_nombre,
              m.especie as mascota_especie,
              m.raza as mascota_raza,
              c.id as cliente_id,
              u.nombre as cliente_nombre,
              u.apellido as cliente_apellido,
              s.id as servicio_id,
              s.nombre as servicio_nombre,
              s.duracion_min as duracion_servicio,
              s.precio_base as precio_servicio
       FROM SLOT_RESERVA a
       JOIN MASCOTA m ON a.mascota_id = m.id
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       JOIN SERVICIO s ON a.servicio_id = s.id
       WHERE a.id = ?`,
      [id]
    );

    if (agenda.length === 0) {
      throw new Error('Reserva no encontrada');
    }

    return agenda[0];
  }

  async create(reservaData, userId) {
    const { mascota_id, servicio_id, groomer_id, fecha, hora, observaciones } = reservaData;

    if (!mascota_id || !servicio_id || !fecha || !hora) {
      throw new Error('Datos incompletos para crear la reserva');
    }

    const [servicios] = await pool.execute(
      'SELECT duracion_min, precio_base, tiempo_limpieza_min FROM SERVICIO WHERE id = ?',
      [servicio_id]
    );

    if (servicios.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    const { duracion_min, precio_base, tiempo_limpieza_min } = servicios[0];
    const duracionTotal = duracion_min + (tiempo_limpieza_min || 0);

    const fechaHoraInicio = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(fechaHoraInicio.getTime())) {
      throw new Error('Fecha u hora inválidas');
    }

    const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracionTotal * 60000);
    const startDate = fechaHoraInicio.toISOString().slice(0, 19).replace('T', ' ');
    const endDate = fechaHoraFin.toISOString().slice(0, 19).replace('T', ' ');

    let asignadoGroomerId = null;
    if (groomer_id) {
      const [groomerExists] = await pool.execute('SELECT id FROM GROOMER WHERE id = ?', [groomer_id]);
      if (groomerExists.length === 0) {
        throw new Error('Groomer seleccionado no existe');
      }
      const disponible = await this.checkAvailability(startDate, endDate, groomer_id);
      if (!disponible) {
        throw new Error('El groomer seleccionado no está disponible en ese horario');
      }
      asignadoGroomerId = groomer_id;
    } else {
      asignadoGroomerId = await this.findAvailableGroomer(startDate, endDate);
      if (!asignadoGroomerId) {
        throw new Error('No hay groomers disponibles en ese horario');
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO SLOT_RESERVA (groomer_id, mascota_id, servicio_id, fecha_hora, fecha_hora_fin, precio_final, estado, canal_reserva)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [asignadoGroomerId, mascota_id, servicio_id, startDate, endDate, precio_base, 'pendiente', 'web']
    );

    await authService.registrarAudit(userId, null, null, null, 'crear_reserva', reservaData);

    return this.getById(result.insertId);
  }

  async findAvailableGroomer(fechaHoraInicio, fechaHoraFin, excludeId = null) {
    const [groomers] = await pool.execute('SELECT id FROM GROOMER WHERE activo = TRUE ORDER BY id');
    if (groomers.length === 0) {
      return null;
    }

    for (const groomer of groomers) {
      const disponible = await this.checkAvailability(fechaHoraInicio, fechaHoraFin, groomer.id, excludeId);
      if (disponible) {
        return groomer.id;
      }
    }

    return null;
  }

  async update(id, reservaData, userId) {
    const reservaAnterior = await this.getById(id);
    const { fecha, hora, estado, observaciones } = reservaData;

    let updateFields = [];
    let params = [];

    if (estado !== undefined) {
      updateFields.push('estado = ?');
      params.push(estado);
    }

    if (observaciones !== undefined) {
      updateFields.push('observaciones = ?');
      params.push(observaciones);
    }

    if (fecha || hora) {
      const newFecha = fecha || reservaAnterior.fecha;
      const newHora = hora || reservaAnterior.hora;
      const [servicios] = await pool.execute('SELECT duracion_min, tiempo_limpieza_min FROM SERVICIO WHERE id = ?', [reservaAnterior.servicio_id]);
      if (servicios.length === 0) {
        throw new Error('Servicio no encontrado');
      }
      const { duracion_min, tiempo_limpieza_min } = servicios[0];
      const duracionTotal = duracion_min + (tiempo_limpieza_min || 0);
      const fechaHoraInicio = new Date(`${newFecha}T${newHora}`);
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracionTotal * 60000);
      const startDate = fechaHoraInicio.toISOString().slice(0, 19).replace('T', ' ');
      const endDate = fechaHoraFin.toISOString().slice(0, 19).replace('T', ' ');

      const disponibilidad = await this.checkAvailability(startDate, endDate, reservaAnterior.groomer_id, id);
      if (!disponibilidad) {
        throw new Error('El horario no está disponible');
      }

      updateFields.push('fecha_hora = ?');
      updateFields.push('fecha_hora_fin = ?');
      params.push(startDate, endDate);
    }

    if (updateFields.length === 0) {
      return this.getById(id);
    }

    const query = `UPDATE SLOT_RESERVA SET ${updateFields.join(', ')} WHERE id = ?`;
    params.push(id);

    await pool.execute(query, params);
    await authService.registrarAudit(userId, null, null, null, 'actualizar_reserva', { anterior: reservaAnterior, nuevo: reservaData });
    return this.getById(id);
  }

  async delete(id, userId) {
    const reserva = await this.getById(id);
    await pool.execute('DELETE FROM SLOT_RESERVA WHERE id = ?', [id]);
    await authService.registrarAudit(userId, null, null, null, 'eliminar_reserva', reserva);
    return { message: 'Reserva eliminada correctamente' };
  }

  async checkAvailability(fechaHoraInicio, fechaHoraFin, groomerId = null, excludeId = null) {
    const params = [fechaHoraInicio, fechaHoraFin];
    let query = `
      SELECT groomer_id FROM SLOT_RESERVA
      WHERE NOT (fecha_hora_fin <= ? OR fecha_hora >= ?)
    `;

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    if (groomerId) {
      query += ' AND groomer_id = ?';
      params.push(groomerId);
    }

    const [result] = await pool.execute(query, params);

    if (groomerId) {
      return result.length === 0;
    }

    const [groomers] = await pool.execute('SELECT id FROM GROOMER WHERE activo = TRUE');
    const busyGroomerIds = new Set(result.map((row) => row.groomer_id));
    return groomers.some((groomer) => !busyGroomerIds.has(groomer.id));
  }

  async getHorariosDisponibles(fecha, servicioId, groomerId = null) {
    const [servicios] = await pool.execute(
      'SELECT duracion_min, tiempo_limpieza_min FROM SERVICIO WHERE id = ?',
      [servicioId]
    );

    if (servicios.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    const { duracion_min, tiempo_limpieza_min } = servicios[0];
    const duracionTotal = duracion_min + (tiempo_limpieza_min || 0);

    const horarios = [];
    const horaApertura = 9;
    const horaCierre = 18;

    const groomerFilter = groomerId ? 'AND groomer_id = ?' : '';
    const queryParams = groomerId ? [fecha, groomerId] : [fecha];
    const [reservas] = await pool.execute(
      `SELECT fecha_hora, fecha_hora_fin, groomer_id FROM SLOT_RESERVA
       WHERE DATE(fecha_hora) = ? AND estado != 'cancelada' ${groomerFilter}`,
      queryParams
    );

    const [groomers] = await pool.execute('SELECT id FROM GROOMER WHERE activo = TRUE');
    const groomerCount = groomers.length;
    if (groomerCount === 0) {
      return [];
    }

    const reservasPorGroomer = groomers.reduce((acc, groomer) => {
      acc[groomer.id] = [];
      return acc;
    }, {});

    reservas.forEach((reserva) => {
      const id = reserva.groomer_id;
      if (!reservasPorGroomer[id]) {
        reservasPorGroomer[id] = [];
      }
      reservasPorGroomer[id].push(reserva);
    });

    for (let hora = horaApertura; hora < horaCierre; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:00`;
        const intentoInicio = new Date(`${fecha}T${horaStr}`);
        const intentoFin = new Date(intentoInicio.getTime() + duracionTotal * 60000);

        if (intentoFin.getHours() > horaCierre || (intentoFin.getHours() === horaCierre && intentoFin.getMinutes() > 0)) {
          continue;
        }

        const slotDisponible = groomerId
          ? !reservas.some((reserva) => reserva.groomer_id === Number(groomerId) && intentoInicio < new Date(reserva.fecha_hora_fin) && intentoFin > new Date(reserva.fecha_hora))
          : Object.values(reservasPorGroomer).some((lista) =>
              !lista.some((reserva) => intentoInicio < new Date(reserva.fecha_hora_fin) && intentoFin > new Date(reserva.fecha_hora))
            );

        if (slotDisponible) {
          horarios.push(horaStr);
        }
      }
    }

    return horarios;
  }
}

const agendaServiceInstance = new AgendaService();
module.exports = agendaServiceInstance;
module.exports.default = agendaServiceInstance;