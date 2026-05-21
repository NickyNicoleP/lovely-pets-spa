const pool = require('../config/database');
const authService = require('./authService');

class FichaGroomingService {
  async getAll(filters = {}) {
    let query = `
      SELECT fg.id,
             fg.reserva_id,
             fg.estado_ingreso,
             fg.nudos,
             fg.pulgas,
             fg.heridas,
             fg.tiempo_real_min,
             fg.observaciones,
             fg.fecha_cierre,
             sr.fecha_hora as reserva_fecha_hora,
             sr.estado as reserva_estado,
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
             s.precio_base as servicio_precio
      FROM FICHA_GROOMING fg
      JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id
      JOIN MASCOTA m ON sr.mascota_id = m.id
      JOIN CLIENTE c ON m.cliente_id = c.id
      JOIN USUARIO u ON c.usuario_id = u.id
      JOIN SERVICIO s ON sr.servicio_id = s.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.fecha) {
      query += ' AND DATE(sr.fecha_hora) = ?';
      params.push(filters.fecha);
    }

    if (filters.estado) {
      query += ' AND fg.estado_ingreso = ?';
      params.push(filters.estado);
    }

    query += ' ORDER BY sr.fecha_hora DESC';

    const [fichas] = await pool.execute(query, params);
    return fichas;
  }

  async getById(id) {
    const [fichas] = await pool.execute(
      `SELECT fg.id,
              fg.reserva_id,
              fg.estado_ingreso,
              fg.nudos,
              fg.pulgas,
              fg.heridas,
              fg.tiempo_real_min,
              fg.observaciones,
              fg.fecha_cierre,
              sr.fecha_hora as reserva_fecha_hora,
              sr.estado as reserva_estado,
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
              s.precio_base as servicio_precio
       FROM FICHA_GROOMING fg
       JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id
       JOIN MASCOTA m ON sr.mascota_id = m.id
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       JOIN SERVICIO s ON sr.servicio_id = s.id
       WHERE fg.id = ?`,
      [id]
    );

    if (fichas.length === 0) {
      throw new Error('Ficha no encontrada');
    }

    const [insumos] = await pool.execute(
      `SELECT fi.*, p.nombre as producto_nombre, p.precio as producto_precio
       FROM FICHA_INSUMO fi
       JOIN PRODUCTO p ON fi.producto_id = p.id
       WHERE fi.ficha_grooming_id = ?`,
      [id]
    );

    const ficha = fichas[0];
    ficha.insumos = insumos;
    ficha.total_insumos = insumos.reduce((sum, insumo) => sum + (insumo.cantidad * insumo.producto_precio), 0);

    return ficha;
  }

  async create(fichaData, userId) {
    const {
      reserva_id,
      estado_ingreso,
      nudos = false,
      pulgas = false,
      heridas = false,
      tiempo_real_min,
      observaciones
    } = fichaData;

    if (!reserva_id) {
      throw new Error('Se requiere reserva_id para crear la ficha');
    }

    const [reservas] = await pool.execute('SELECT * FROM SLOT_RESERVA WHERE id = ?', [reserva_id]);
    if (reservas.length === 0) {
      throw new Error('Reserva no encontrada');
    }

    const [existentes] = await pool.execute(
      'SELECT id FROM FICHA_GROOMING WHERE reserva_id = ?',
      [reserva_id]
    );

    if (existentes.length > 0) {
      throw new Error('Ya existe una ficha para esta reserva');
    }

    const [result] = await pool.execute(
      `INSERT INTO FICHA_GROOMING (reserva_id, estado_ingreso, nudos, pulgas, heridas, tiempo_real_min, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reserva_id,
        estado_ingreso || null,
        nudos ? 1 : 0,
        pulgas ? 1 : 0,
        heridas ? 1 : 0,
        tiempo_real_min || null,
        observaciones || null
      ]
    );

    await pool.execute(
      'UPDATE SLOT_RESERVA SET estado = ? WHERE id = ?',
      ['en_proceso', reserva_id]
    );

    await authService.registrarAudit(userId, null, null, null, 'crear_ficha_grooming', fichaData);
    return this.getById(result.insertId);
  }

  async addInsumo(fichaId, insumoData, userId) {
    const { producto_id, cantidad } = insumoData;

    const [fichas] = await pool.execute(
      'SELECT * FROM FICHA_GROOMING WHERE id = ?',
      [fichaId]
    );

    if (fichas.length === 0) {
      throw new Error('Ficha no encontrada');
    }

    const [productos] = await pool.execute(
      'SELECT * FROM PRODUCTO WHERE id = ?',
      [producto_id]
    );

    if (productos.length === 0) {
      throw new Error('Producto no encontrado');
    }

    if (productos[0].stock < cantidad) {
      throw new Error('Stock insuficiente');
    }

    await pool.execute(
      'INSERT INTO FICHA_INSUMO (ficha_grooming_id, producto_id, cantidad) VALUES (?, ?, ?)',
      [fichaId, producto_id, cantidad]
    );

    await pool.execute(
      'UPDATE PRODUCTO SET stock = stock - ? WHERE id = ?',
      [cantidad, producto_id]
    );

    await authService.registrarAudit(userId, null, null, null, 'agregar_insumo', insumoData);
    return { message: 'Insumo agregado correctamente' };
  }

  async close(fichaId, userId) {
    const [fichas] = await pool.execute(
      'SELECT fg.*, sr.id as reserva_id FROM FICHA_GROOMING fg JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id WHERE fg.id = ?',
      [fichaId]
    );

    if (fichas.length === 0) {
      throw new Error('Ficha no encontrada');
    }

    const fichaAnterior = fichas[0];

    await pool.execute(
      'UPDATE FICHA_GROOMING SET fecha_cierre = NOW() WHERE id = ?',
      [fichaId]
    );

    await pool.execute(
      'UPDATE SLOT_RESERVA SET estado = ? WHERE id = ?',
      ['completada', fichaAnterior.reserva_id]
    );

    const fichaCerrada = await this.getById(fichaId);
    await authService.registrarAudit(userId, null, null, null, 'cerrar_ficha_grooming', {
      fecha_cierre: fichaCerrada.fecha_cierre,
      insumos: fichaCerrada.insumos,
      total_insumos: fichaCerrada.total_insumos
    });

    return fichaCerrada;
  }

  async getEstadisticas(fechaInicio, fechaFin) {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_fichas,
        SUM(CASE WHEN fecha_cierre IS NOT NULL THEN 1 ELSE 0 END) as fichas_cerradas,
        SUM(CASE WHEN fecha_cierre IS NULL THEN 1 ELSE 0 END) as fichas_abiertas,
        COUNT(DISTINCT reserva_id) as reservas_atendidas,
        COUNT(DISTINCT DATE(fecha_cierre)) as dias_atencion
       FROM FICHA_GROOMING
       WHERE fecha_cierre BETWEEN ? AND ?`,
      [fechaInicio, fechaFin]
    );

    return stats[0];
  }
}

const fichaGroomingServiceInstance = new FichaGroomingService();
module.exports = fichaGroomingServiceInstance;
module.exports.default = fichaGroomingServiceInstance;