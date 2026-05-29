const pool = require('../config/database');
const authService = require('./authService');
const checklistValidator = require('../middleware/checklistValidator');

class FichaGroomingService {
  async getAll(filters = {}) {
    let query = `
      SELECT fg.id,
             fg.slot_id as reserva_id,
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
             m.peso as mascota_peso,
             m.temperamento as mascota_temperamento,
             c.id as cliente_id,
             u.id as cliente_usuario_id,
             u.nombre as cliente_nombre,
             u.apellido as cliente_apellido,
             s.id as servicio_id,
             s.nombre as servicio_nombre,
             s.precio_base as servicio_precio
      FROM FICHA_GROOMING fg
      JOIN SLOT_RESERVA sr ON fg.slot_id = sr.id
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
      // Allow filtering by estado_ingreso or by closed/open based on fecha_cierre
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
              fg.slot_id as reserva_id,
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
              m.peso as mascota_peso,
              m.temperamento as mascota_temperamento,
              c.id as cliente_id,
              u.id as cliente_usuario_id,
              u.nombre as cliente_nombre,
              u.apellido as cliente_apellido,
              s.id as servicio_id,
              s.nombre as servicio_nombre,
              s.precio_base as servicio_precio
      FROM FICHA_GROOMING fg
      JOIN SLOT_RESERVA sr ON fg.slot_id = sr.id
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
       WHERE fi.ficha_id = ?`,
      [id]
    );

    const [checklist] = await pool.execute(
      `SELECT nombre, realizado FROM CHECKLIST_ITEM WHERE ficha_id = ? ORDER BY id`,
      [id]
    );

    const [fotos] = await pool.execute(
      `SELECT id, url, tipo FROM FOTO_SERVICIO WHERE ficha_id = ?`,
      [id]
    );

    const ficha = fichas[0];
    ficha.insumos = insumos;
    ficha.total_insumos = insumos.reduce((sum, insumo) => sum + (insumo.cantidad * insumo.producto_precio), 0);
    ficha.checklist = checklist;
    ficha.fotos_antes = fotos.filter((foto) => foto.tipo === 'antes');
    ficha.fotos_despues = fotos.filter((foto) => foto.tipo === 'despues');

    try {
      ficha.estado_ingreso = ficha.estado_ingreso ? JSON.parse(ficha.estado_ingreso) : null;
    } catch (error) {
      ficha.estado_ingreso = ficha.estado_ingreso || null;
    }

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
      'SELECT id FROM FICHA_GROOMING WHERE slot_id = ?',
      [reserva_id]
    );

    if (existentes.length > 0) {
      throw new Error('Ya existe una ficha para esta reserva');
    }

    const [result] = await pool.execute(
      `INSERT INTO FICHA_GROOMING (slot_id, estado_ingreso, nudos, pulgas, heridas, tiempo_real_min, observaciones)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reserva_id,
        estado_ingreso ? JSON.stringify(estado_ingreso) : null,
        nudos ? 1 : 0,
        pulgas ? 1 : 0,
        heridas ? 1 : 0,
        tiempo_real_min || null,
        observaciones || null
      ]
    );

    await this._createDefaultChecklist(result.insertId);

    await pool.execute(
      'UPDATE SLOT_RESERVA SET estado = ? WHERE id = ?',
      ['en_proceso', reserva_id]
    );

    await authService.registrarAudit(userId, null, null, null, 'crear_ficha_grooming', fichaData);
    return this.getById(result.insertId);
  }

  async _createDefaultChecklist(fichaId) {
    const promises = checklistValidator.REQUIRED_CHECKLIST_ITEMS.map((item) =>
      checklistValidator.addChecklistItem(fichaId, item.nombre, false, null)
    );
    await Promise.all(promises);
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
      'INSERT INTO FICHA_INSUMO (ficha_id, producto_id, cantidad) VALUES (?, ?, ?)',
      [fichaId, producto_id, cantidad]
    );

    await pool.execute(
      'UPDATE PRODUCTO SET stock = stock - ? WHERE id = ?',
      [cantidad, producto_id]
    );

    await authService.registrarAudit(userId, null, null, null, 'agregar_insumo', insumoData);
    return { message: 'Insumo agregado correctamente' };
  }

  async update(fichaId, fichaData, userId) {
    const {
      estado_ingreso,
      nudos,
      pulgas,
      heridas,
      observaciones
    } = fichaData;

    const estadoIngresoValue = typeof estado_ingreso === 'object'
      ? JSON.stringify(estado_ingreso)
      : estado_ingreso || null;

    await pool.execute(
      `UPDATE FICHA_GROOMING SET estado_ingreso = ?, nudos = ?, pulgas = ?, heridas = ?, observaciones = ?
       WHERE id = ?`,
      [
        estadoIngresoValue,
        nudos ? 1 : 0,
        pulgas ? 1 : 0,
        heridas ? 1 : 0,
        observaciones || null,
        fichaId
      ]
    );

    await authService.registrarAudit(userId, null, null, null, 'actualizar_ficha_grooming', {
      id: fichaId,
      data: fichaData
    });

    return this.getById(fichaId);
  }

  async close(fichaId, userId) {
    const [fichas] = await pool.execute(
      'SELECT fg.*, sr.id as reserva_id FROM FICHA_GROOMING fg JOIN SLOT_RESERVA sr ON fg.slot_id = sr.id WHERE fg.id = ?',
      [fichaId]
    );

    if (fichas.length === 0) {
      throw new Error('Ficha no encontrada');
    }

    const fichaAnterior = fichas[0];

    // Validar checklist: debe existir y todos los items deben estar realizados
    const [checklistItems] = await pool.execute(
      'SELECT * FROM CHECKLIST_ITEM WHERE ficha_id = ?',
      [fichaId]
    );
    if (!checklistItems || checklistItems.length === 0) {
      const error = new Error('Checklist vacío: complete los items antes de cerrar la ficha');
      error.statusCode = 'CHECKLIST_INCOMPLETE';
      throw error;
    }
    const incomplete = checklistItems.find((it) => it.realizado === 0 || it.realizado === false);
    if (incomplete) {
      const error = new Error('Checklist incompleto: marque todos los items como realizados antes de cerrar');
      error.statusCode = 'CHECKLIST_INCOMPLETE';
      throw error;
    }

    // Validar que existan fotos de evidencia (al menos una)
    const [fotos] = await pool.execute(
      'SELECT * FROM FOTO_SERVICIO WHERE ficha_id = ?',
      [fichaId]
    );
    if (!fotos || fotos.length === 0) {
      const error = new Error('Faltan fotos de evidencia: suba al menos una foto antes de cerrar');
      error.statusCode = 'CHECKLIST_INCOMPLETE';
      throw error;
    }

    // Validar insumos registrados y stock (si hay insumos registrados)
    const [insumos] = await pool.execute(
      `SELECT fi.*, p.stock as producto_stock, p.nombre as producto_nombre
       FROM FICHA_INSUMO fi JOIN PRODUCTO p ON fi.producto_id = p.id
       WHERE fi.ficha_id = ?`,
      [fichaId]
    );
    if (insumos && insumos.length > 0) {
      const negative = insumos.find((i) => i.producto_stock < 0);
      if (negative) {
        throw new Error(`Stock insuficiente para el insumo ${negative.producto_nombre}`);
      }
    }

    await pool.execute(
      'UPDATE FICHA_GROOMING SET fecha_cierre = NOW() WHERE id = ?',
      [fichaId]
    );

    // Mantener estado 'completada' compatible con frontend; emite notificación como 'finalizada'
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
        COUNT(DISTINCT slot_id) as reservas_atendidas,
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