const pool = require('../config/database');

class ReporteService {
  /**
   * Admin Report: Sales and Revenue
   * Returns daily/weekly/monthly revenue stats
   */
  async getVentasAdmin(filters = {}) {
    const { fecha_inicio, fecha_fin, periodo = 'diario' } = filters;

    let groupBy = 'DATE(pf.fecha)';
    if (periodo === 'semanal') {
      groupBy = 'YEAR(pf.fecha), WEEK(pf.fecha)';
    } else if (periodo === 'mensual') {
      groupBy = 'YEAR(pf.fecha), MONTH(pf.fecha)';
    }

    const query = `
      SELECT
        ${periodo === 'diario' ? 'DATE(pf.fecha)' : 'DATE_FORMAT(pf.fecha, "%Y-%m")'} as periodo,
        COUNT(pf.id) as total_transacciones,
        SUM(pf.monto) as total_ingresos,
        AVG(pf.monto) as promedio_venta,
        COUNT(DISTINCT pf.metodo) as metodos_pago,
        GROUP_CONCAT(DISTINCT pf.metodo) as metodos
      FROM PAGO_FACTURA pf
      WHERE pf.estado = 'pagado'
        ${fecha_inicio ? 'AND DATE(pf.fecha) >= ?' : ''}
        ${fecha_fin ? 'AND DATE(pf.fecha) <= ?' : ''}
      GROUP BY ${groupBy}
      ORDER BY pf.fecha ${periodo === 'diario' ? 'DESC' : 'DESC'}
    `;

    const params = [];
    if (fecha_inicio) params.push(fecha_inicio);
    if (fecha_fin) params.push(fecha_fin);

    const [ventas] = await pool.execute(query, params);
    return ventas;
  }

  /**
   * Reception Report: Daily Schedule
   * Shows all appointments for a specific day
   */
  async getAgendaDiaria(fecha) {
    const query = `
      SELECT
        sr.id,
        sr.fecha,
        sr.hora,
        sr.estado,
        CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
        m.nombre as mascota_nombre,
        m.raza as mascota_raza,
        s.nombre as servicio,
        s.duracion_estimada,
        gr.nombre as groomer_nombre,
        sr.observaciones
      FROM SLOT_RESERVA sr
      JOIN CLIENTE c ON sr.cliente_id = c.id
      JOIN USUARIO u ON c.usuario_id = u.id
      JOIN MASCOTA m ON sr.mascota_id = m.id
      JOIN SERVICIO s ON sr.servicio_id = s.id
      LEFT JOIN GROOMER gr ON sr.groomer_id = gr.id
      WHERE DATE(sr.fecha) = ?
      ORDER BY sr.hora ASC
    `;

    const [agenda] = await pool.execute(query, [fecha]);
    return agenda;
  }

  /**
   * Groomer Report: Service History
   * Shows services completed by a groomer in a date range
   */
  async getHistorialGroomer(groomer_id, filters = {}) {
    const { fecha_inicio, fecha_fin } = filters;

    const query = `
      SELECT
        fg.id as ficha_id,
        fg.fecha_cierre,
        CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
        m.nombre as mascota_nombre,
        s.nombre as servicio,
        s.precio_base as precio_servicio,
        pf.monto as total_pagado,
        pf.metodo,
        fg.observaciones
      FROM FICHA_GROOMING fg
      JOIN SLOT_RESERVA sr ON fg.slot_id = sr.id
      JOIN CLIENTE c ON sr.cliente_id = c.id
      JOIN USUARIO u ON c.usuario_id = u.id
      JOIN MASCOTA m ON sr.mascota_id = m.id
      JOIN SERVICIO s ON sr.servicio_id = s.id
      LEFT JOIN PAGO_FACTURA pf ON pf.reserva_id = sr.id
      WHERE sr.groomer_id = ? AND fg.fecha_cierre IS NOT NULL
        ${fecha_inicio ? 'AND DATE(fg.fecha_cierre) >= ?' : ''}
        ${fecha_fin ? 'AND DATE(fg.fecha_cierre) <= ?' : ''}
      ORDER BY fg.fecha_cierre DESC
    `;

    const params = [groomer_id];
    if (fecha_inicio) params.push(fecha_inicio);
    if (fecha_fin) params.push(fecha_fin);

    const [historial] = await pool.execute(query, params);
    return historial;
  }

  /**
   * Groomer Statistics: Performance metrics
   */
  async getEstadisticasGroomer(groomer_id, filters = {}) {
    const { fecha_inicio, fecha_fin } = filters;

    const query = `
      SELECT
        COUNT(fg.id) as total_servicios,
        COUNT(DISTINCT DATE(fg.fecha_cierre)) as dias_trabajo,
        SUM(pf.monto) as ingresos_totales,
        AVG(pf.monto) as promedio_servicio,
        COUNT(DISTINCT sr.cliente_id) as clientes_atendidos,
        SUM(CASE WHEN pf.monto > 0 THEN 1 ELSE 0 END) as servicios_pagados
      FROM FICHA_GROOMING fg
      JOIN SLOT_RESERVA sr ON fg.slot_id = sr.id
      LEFT JOIN PAGO_FACTURA pf ON pf.reserva_id = sr.id
      WHERE sr.groomer_id = ? AND fg.fecha_cierre IS NOT NULL
        ${fecha_inicio ? 'AND DATE(fg.fecha_cierre) >= ?' : ''}
        ${fecha_fin ? 'AND DATE(fg.fecha_cierre) <= ?' : ''}
    `;

    const params = [groomer_id];
    if (fecha_inicio) params.push(fecha_inicio);
    if (fecha_fin) params.push(fecha_fin);

    const [stats] = await pool.execute(query, params);
    return stats[0] || {};
  }

  /**
   * General Dashboard Stats
   */
  async getEstadisticasGenerales(filters = {}) {
    const { fecha_inicio, fecha_fin } = filters;

    const query = `
      SELECT
        COUNT(DISTINCT pf.id) as total_pagos,
        SUM(pf.monto) as ingresos_totales,
        COUNT(DISTINCT sr.id) as total_citas,
        COUNT(DISTINCT CASE WHEN sr.estado = 'confirmada' THEN sr.id END) as citas_confirmadas,
        COUNT(DISTINCT CASE WHEN sr.estado = 'cancelada' THEN sr.id END) as citas_canceladas,
        COUNT(DISTINCT fg.id) as servicios_completados,
        COUNT(DISTINCT sr.cliente_id) as clientes_unicos
      FROM PAGO_FACTURA pf
      LEFT JOIN SLOT_RESERVA sr ON pf.reserva_id = sr.id
      LEFT JOIN FICHA_GROOMING fg ON fg.slot_id = sr.id AND fg.fecha_cierre IS NOT NULL
      WHERE 1=1
        ${fecha_inicio ? 'AND DATE(pf.fecha) >= ?' : ''}
        ${fecha_fin ? 'AND DATE(pf.fecha) <= ?' : ''}
    `;

    const params = [];
    if (fecha_inicio) params.push(fecha_inicio);
    if (fecha_fin) params.push(fecha_fin);

    const [stats] = await pool.execute(query, params);
    return stats[0] || {};
  }
}

module.exports = new ReporteService();
