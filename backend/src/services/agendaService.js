const pool = require('../config/database');
const authService = require('./authService');

class AgendaService {
  async getAll(filters = {}, userId, userRole) {
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
             u.id as cliente_usuario_id,
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

    if (filters.cliente_id && userRole === 'admin') {
      query += ' AND c.id = ?';
      params.push(filters.cliente_id);
    }

    if (userRole === 'cliente') {
      query += ' AND u.id = ?';
      params.push(userId);
    } else if (userRole === 'groomer') {
      query += ' AND a.groomer_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY a.fecha_hora';

    const [agenda] = await pool.execute(query, params);
    return agenda;
  }

  async getById(id, userId, userRole) {
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
              u.id as cliente_usuario_id,
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

    const reserva = agenda[0];
    if (userRole === 'cliente' && reserva.cliente_usuario_id !== userId) {
      throw new Error('No autorizado para ver esta reserva');
    }
    if (userRole === 'groomer' && reserva.groomer_id !== userId) {
      throw new Error('No autorizado para ver esta reserva');
    }

    return reserva;
  }

  async create(reservaData, userId, userRole) {
    const { mascota_id, servicio_id, groomer_id, fecha, hora, observaciones, precio_final } = reservaData;

    if (!mascota_id || !servicio_id || !fecha || !hora) {
      throw new Error('Datos incompletos para crear la reserva');
    }

    if (userRole === 'cliente') {
      const [mascotaRows] = await pool.execute(
        `SELECT c.usuario_id FROM MASCOTA m
         JOIN CLIENTE c ON m.cliente_id = c.id
         WHERE m.id = ?`,
        [mascota_id]
      );

      if (mascotaRows.length === 0 || mascotaRows[0].usuario_id !== userId) {
        throw new Error('No puede reservar para esta mascota');
      }
    }

    const { duracionTotal, precioBase, ajusteRazaPct } = await this.calculateAdjustedServiceData(servicio_id, mascota_id);

    const fechaHoraInicio = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(fechaHoraInicio.getTime())) {
      throw new Error('Fecha u hora inválidas');
    }

    const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracionTotal * 60000);
    const startDate = fechaHoraInicio.toISOString().slice(0, 19).replace('T', ' ');
    const endDate = fechaHoraFin.toISOString().slice(0, 19).replace('T', ' ');

    const computedPrecioFinal = Number((precioBase * (1 + ajusteRazaPct / 100)).toFixed(2));
    const precioFinal = precio_final != null && !Number.isNaN(Number(precio_final))
      ? Number(precio_final)
      : computedPrecioFinal;

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
      [asignadoGroomerId, mascota_id, servicio_id, startDate, endDate, precioFinal, 'pendiente', 'web']
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
    const { fecha, hora, estado, observaciones, precio_final } = reservaData;

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

    if (precio_final !== undefined) {
      updateFields.push('precio_final = ?');
      params.push(precio_final);
    }

    if (fecha || hora) {
      const newFecha = fecha || reservaAnterior.fecha;
      const newHora = hora || reservaAnterior.hora;
      const adjusted = await this.calculateAdjustedServiceData(reservaAnterior.servicio_id, reservaAnterior.mascota_id);
      const fechaHoraInicio = new Date(`${newFecha}T${newHora}`);
      if (Number.isNaN(fechaHoraInicio.getTime())) {
        throw new Error('Fecha u hora inválidas');
      }
      const fechaHoraFin = new Date(fechaHoraInicio.getTime() + adjusted.duracionTotal * 60000);
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

  normalizeDateValue(value) {
    if (value instanceof Date) {
      return value;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  async calculateAdjustedServiceData(servicioId, mascotaId) {
    const [servicios] = await pool.execute(
      'SELECT duracion_min, tiempo_limpieza_min, precio_base, ajuste_raza_pct FROM SERVICIO WHERE id = ?',
      [servicioId]
    );

    if (servicios.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    const [mascotas] = await pool.execute(
      'SELECT raza, peso, temperamento FROM MASCOTA WHERE id = ?',
      [mascotaId]
    );

    if (mascotas.length === 0) {
      throw new Error('Mascota no encontrada');
    }

    const { duracion_min, tiempo_limpieza_min, precio_base, ajuste_raza_pct } = servicios[0];
    const { raza, peso, temperamento } = mascotas[0];

    let duracionExtra = 0;
    const pesoNumero = Number(peso);
    if (!Number.isNaN(pesoNumero) && pesoNumero >= 20) {
      duracionExtra += 15;
    }

    const temperamentoTexto = String(temperamento || '').toLowerCase();
    if (temperamentoTexto.match(/\b(ansioso|nervioso|temeroso|miedoso|agresivo|hiperactivo)\b/)) {
      duracionExtra += 10;
    }

    let ajusteRazaPctActual = Number(ajuste_raza_pct || 0);
    if (raza) {
      const [ajustes] = await pool.execute(
        'SELECT porcentaje_extra FROM RAZA_AJUSTE WHERE servicio_id = ? AND raza_nombre = ?',
        [servicioId, raza]
      );
      if (ajustes.length > 0) {
        ajusteRazaPctActual += Number(ajustes[0].porcentaje_extra || 0);
      }
    }

    return {
      duracionMin: Number(duracion_min || 0),
      tiempoLimpiezaMin: Number(tiempo_limpieza_min || 0),
      duracionTotal: Number(duracion_min || 0) + Number(tiempo_limpieza_min || 0) + duracionExtra,
      precioBase: Number(precio_base || 0),
      ajusteRazaPct: ajusteRazaPctActual
    };
  }

  parseDisponibilidadSemanal(disponibilidad) {
    if (!disponibilidad) {
      return null;
    }

    if (typeof disponibilidad === 'string') {
      try {
        return JSON.parse(disponibilidad);
      } catch {
        return null;
      }
    }

    return disponibilidad;
  }

  intervalsOverlap(startA, endA, startB, endB) {
    return !(endA <= startB || startA >= endB);
  }

  isWithinWeeklyAvailability(fechaHoraInicio, fechaHoraFin, disponibilidadSemanal) {
    if (!disponibilidadSemanal) {
      return true;
    }

    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaClave = diasSemana[fechaHoraInicio.getDay()];
    const diaConfig = disponibilidadSemanal[diaClave];

    if (!diaConfig || diaConfig.activo === false) {
      return false;
    }

    if (!diaConfig.inicio || !diaConfig.fin) {
      return true;
    }

    if (fechaHoraInicio.toDateString() !== fechaHoraFin.toDateString()) {
      return false;
    }

    const [inicioH, inicioM] = diaConfig.inicio.split(':').map(Number);
    const [finH, finM] = diaConfig.fin.split(':').map(Number);
    const startMinutes = fechaHoraInicio.getHours() * 60 + fechaHoraInicio.getMinutes();
    const endMinutes = fechaHoraFin.getHours() * 60 + fechaHoraFin.getMinutes();
    const windowStart = inicioH * 60 + inicioM;
    const windowEnd = finH * 60 + finM;

    return startMinutes >= windowStart && endMinutes <= windowEnd;
  }

  async hasBlockingInterval(groomerId, fechaHoraInicio, fechaHoraFin) {
    const [bloqueos] = await pool.execute(
      `SELECT id FROM BLOQUEO_AGENDA
       WHERE groomer_id = ?
         AND NOT (fecha_fin <= ? OR fecha_inicio >= ?)`,
      [groomerId, fechaHoraInicio, fechaHoraFin]
    );

    return bloqueos.length > 0;
  }

  async isGroomerAvailableForInterval(fechaHoraInicio, fechaHoraFin, groomerId, excludeId = null) {
    const fechaInicio = this.normalizeDateValue(fechaHoraInicio);
    const fechaFin = this.normalizeDateValue(fechaHoraFin);
    if (!fechaInicio || !fechaFin) {
      throw new Error('Fechas inválidas para disponibilidad');
    }

    const [groomerRows] = await pool.execute(
      'SELECT id, disponibilidad_semanal FROM GROOMER WHERE id = ? AND activo = TRUE',
      [groomerId]
    );

    if (groomerRows.length === 0) {
      return false;
    }

    const disponibilidad = this.parseDisponibilidadSemanal(groomerRows[0].disponibilidad_semanal);
    if (!this.isWithinWeeklyAvailability(fechaInicio, fechaFin, disponibilidad)) {
      return false;
    }

    if (await this.hasBlockingInterval(groomerId, fechaInicio, fechaFin)) {
      return false;
    }

    const params = [groomerId, fechaInicio, fechaFin];
    let query = `
      SELECT id FROM SLOT_RESERVA
      WHERE groomer_id = ?
        AND NOT (fecha_hora_fin <= ? OR fecha_hora >= ?)
    `;

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [reservas] = await pool.execute(query, params);
    return reservas.length === 0;
  }

  async checkAvailability(fechaHoraInicio, fechaHoraFin, groomerId = null, excludeId = null) {
    const fechaInicio = this.normalizeDateValue(fechaHoraInicio);
    const fechaFin = this.normalizeDateValue(fechaHoraFin);
    if (!fechaInicio || !fechaFin) {
      throw new Error('Fechas inválidas para disponibilidad');
    }

    if (groomerId) {
      return this.isGroomerAvailableForInterval(fechaInicio, fechaFin, groomerId, excludeId);
    }

    const [groomers] = await pool.execute('SELECT id FROM GROOMER WHERE activo = TRUE');
    for (const groomer of groomers) {
      if (await this.isGroomerAvailableForInterval(fechaInicio, fechaFin, groomer.id, excludeId)) {
        return true;
      }
    }

    return false;
  }

  async getHorariosDisponibles(fecha, servicioId, groomerId = null, mascotaId = null) {
    if (!fecha || !servicioId) {
      throw new Error('Fecha y servicio son requeridos');
    }

    const [servicios] = await pool.execute(
      'SELECT duracion_min, tiempo_limpieza_min FROM SERVICIO WHERE id = ?',
      [servicioId]
    );

    if (servicios.length === 0) {
      throw new Error('Servicio no encontrado');
    }

    const { duracion_min, tiempo_limpieza_min } = servicios[0];
    let duracionTotal = duracion_min + (tiempo_limpieza_min || 0);
    if (mascotaId) {
      const adjusted = await this.calculateAdjustedServiceData(servicioId, mascotaId);
      duracionTotal = adjusted.duracionTotal;
    }

    const groomerFilter = groomerId ? 'AND g.id = ?' : '';
    const groomerParams = groomerId ? [groomerId] : [];
    const [groomers] = await pool.execute(
      `SELECT g.id, g.disponibilidad_semanal FROM GROOMER g WHERE g.activo = TRUE ${groomerFilter}`,
      groomerParams
    );

    if (groomers.length === 0) {
      return [];
    }

    const groomerData = groomers.map((g) => ({
      id: g.id,
      disponibilidad_semanal: this.parseDisponibilidadSemanal(g.disponibilidad_semanal)
    }));

    const [reservas] = await pool.execute(
      `SELECT fecha_hora, fecha_hora_fin, groomer_id FROM SLOT_RESERVA
       WHERE DATE(fecha_hora) = ? AND estado != 'cancelada'`,
      [fecha]
    );

    const [bloqueos] = await pool.execute(
      `SELECT groomer_id, fecha_inicio, fecha_fin FROM BLOQUEO_AGENDA
       WHERE NOT (fecha_fin <= ? OR fecha_inicio >= ?)`,
      [`${fecha} 00:00:00`, `${fecha} 23:59:59`]
    );

    const reservasPorGroomer = groomerData.reduce((acc, groomer) => {
      acc[groomer.id] = [];
      return acc;
    }, {});
    reservas.forEach((reserva) => {
      if (reservasPorGroomer[reserva.groomer_id]) {
        reservasPorGroomer[reserva.groomer_id].push(reserva);
      }
    });

    const bloqueosPorGroomer = groomerData.reduce((acc, groomer) => {
      acc[groomer.id] = [];
      return acc;
    }, {});
    bloqueos.forEach((bloqueo) => {
      if (bloqueosPorGroomer[bloqueo.groomer_id]) {
        bloqueosPorGroomer[bloqueo.groomer_id].push(bloqueo);
      }
    });

    const horarios = [];
    const horaApertura = 9;
    const horaCierre = 18;
    const ultimaSalida = new Date(`${fecha}T${horaCierre.toString().padStart(2, '0')}:00:00`);

    const isGroomerFree = (groomer, inicio, fin) => {
      if (!this.isWithinWeeklyAvailability(inicio, fin, groomer.disponibilidad_semanal)) {
        return false;
      }

      if (bloqueosPorGroomer[groomer.id]?.some((bloqueo) => this.intervalsOverlap(new Date(bloqueo.fecha_inicio), new Date(bloqueo.fecha_fin), inicio, fin))) {
        return false;
      }

      if (reservasPorGroomer[groomer.id]?.some((reserva) => this.intervalsOverlap(new Date(reserva.fecha_hora), new Date(reserva.fecha_hora_fin), inicio, fin))) {
        return false;
      }

      return true;
    };

    for (let hora = horaApertura; hora < horaCierre; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const horaStr = `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}:00`;
        const inicio = new Date(`${fecha}T${horaStr}`);
        const fin = new Date(inicio.getTime() + duracionTotal * 60000);
        if (fin > ultimaSalida) {
          continue;
        }

        if (groomerData.some((groomer) => isGroomerFree(groomer, inicio, fin))) {
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