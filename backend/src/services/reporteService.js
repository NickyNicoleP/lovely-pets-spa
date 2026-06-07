const pool = require('../config/database');

class ReporteService {
  /**
   * Admin Report: Sales and Revenue
   * Returns daily/weekly/monthly revenue stats
   */
  async getVentasAdmin(filters = {}) {
    const { fecha_inicio, fecha_fin, periodo = 'diario' } = filters;

    let periodoSeleccion = "DATE_FORMAT(pf.fecha, '%Y-%m-%d')";
    let groupBy = 'DATE(pf.fecha)';
    if (periodo === 'semanal') {
      periodoSeleccion = "CONCAT(YEAR(pf.fecha), '-W', WEEK(pf.fecha))";
      groupBy = 'YEAR(pf.fecha), WEEK(pf.fecha)';
    } else if (periodo === 'mensual') {
      periodoSeleccion = "DATE_FORMAT(pf.fecha, '%Y-%m')";
      groupBy = 'YEAR(pf.fecha), MONTH(pf.fecha)';
    }

    const query = `
      SELECT
        ${periodoSeleccion} as periodo,
        COUNT(pf.id) as total_transacciones,
        SUM(pf.monto) as total_ingresos,
        AVG(pf.monto) as promedio_venta,
        SUM(CASE WHEN pf.reserva_id IS NOT NULL THEN pf.monto ELSE 0 END) as ingresos_grooming,
        SUM(CASE WHEN pf.pedido_id IS NOT NULL THEN pf.monto ELSE 0 END) as ingresos_productos,
        COUNT(DISTINCT pf.metodo) as metodos_pago,
        GROUP_CONCAT(DISTINCT pf.metodo) as metodos
      FROM PAGO_FACTURA pf
      WHERE pf.estado = 'pagado'
        ${fecha_inicio ? 'AND DATE(pf.fecha) >= ?' : ''}
        ${fecha_fin ? 'AND DATE(pf.fecha) <= ?' : ''}
      GROUP BY ${groupBy}
      ORDER BY periodo DESC
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
        DATE(CONVERT_TZ(sr.fecha_hora, '+00:00', '-04:00')) as fecha,
        TIME(CONVERT_TZ(sr.fecha_hora, '+00:00', '-04:00')) as hora,
        sr.estado,
        CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
        m.nombre as mascota_nombre,
        m.raza as mascota_raza,
        s.nombre as servicio,
        s.duracion_min as duracion_min,
        CONCAT(ug.nombre, ' ', ug.apellido) as groomer_nombre,
        pf.estado as pago_estado,
        pf.metodo as pago_metodo,
        pf.monto as pago_monto
      FROM SLOT_RESERVA sr
      JOIN MASCOTA m ON sr.mascota_id = m.id
      JOIN CLIENTE c ON m.cliente_id = c.id
      JOIN USUARIO u ON c.usuario_id = u.id
      JOIN SERVICIO s ON sr.servicio_id = s.id
      LEFT JOIN GROOMER gr ON sr.groomer_id = gr.id
      LEFT JOIN USUARIO ug ON gr.usuario_id = ug.id
      LEFT JOIN (
        SELECT reserva_id, MAX(id) as ultimo_pago_id
        FROM PAGO_FACTURA
        GROUP BY reserva_id
      ) ultimo_pago ON ultimo_pago.reserva_id = sr.id
      LEFT JOIN PAGO_FACTURA pf ON pf.id = ultimo_pago.ultimo_pago_id
      WHERE DATE(CONVERT_TZ(sr.fecha_hora, '+00:00', '-04:00')) = ?
      ORDER BY CONVERT_TZ(sr.fecha_hora, '+00:00', '-04:00') ASC
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
      JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id
      JOIN MASCOTA m ON sr.mascota_id = m.id
      JOIN CLIENTE c ON m.cliente_id = c.id
      JOIN USUARIO u ON c.usuario_id = u.id
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
        COUNT(DISTINCT m.cliente_id) as clientes_atendidos,
        SUM(CASE WHEN pf.monto > 0 THEN 1 ELSE 0 END) as servicios_pagados
      FROM FICHA_GROOMING fg
      JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id
      JOIN MASCOTA m ON sr.mascota_id = m.id
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

  async getEstadisticasCliente(usuario_id) {
    const clienteQuery = `
      SELECT c.id as cliente_id,
             c.nivel_fidelidad,
             c.puntos_acumulados,
             u.nombre,
             u.apellido,
             u.email,
             u.telefono
      FROM CLIENTE c
      JOIN USUARIO u ON c.usuario_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `;

    const [clienteRows] = await pool.execute(clienteQuery, [usuario_id]);
    if (!clienteRows || clienteRows.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    const clienteId = clienteRows[0].cliente_id;
    const resumenQuery = `
      SELECT
        COUNT(sr.id) as total_reservas,
        SUM(CASE WHEN fg.fecha_cierre IS NOT NULL THEN 1 ELSE 0 END) as servicios_completados,
        SUM(sr.precio_final) as total_gastado,
        SUM(CASE WHEN sr.fecha_hora >= UTC_TIMESTAMP() AND sr.estado NOT IN ('cancelada') THEN 1 ELSE 0 END) as proximas_citas
      FROM SLOT_RESERVA sr
      LEFT JOIN FICHA_GROOMING fg ON fg.reserva_id = sr.id
      WHERE sr.mascota_id IN (SELECT id FROM MASCOTA WHERE cliente_id = ?)
    `;

    const [resumenRows] = await pool.execute(resumenQuery, [clienteId]);
    const resumen = resumenRows?.[0] || {};

    return {
      cliente: clienteRows[0],
      resumen: {
        ...resumen,
        puntos_acumulados: clienteRows[0].puntos_acumulados,
        nivel_fidelidad: clienteRows[0].nivel_fidelidad
      }
    };
  }

  async getReporteCliente(usuario_id) {
    const clienteQuery = `
      SELECT c.id as cliente_id,
             c.nivel_fidelidad,
             c.puntos_acumulados,
             u.nombre,
             u.apellido,
             u.email,
             u.telefono
      FROM CLIENTE c
      JOIN USUARIO u ON c.usuario_id = u.id
      WHERE u.id = ?
      LIMIT 1
    `;

    const [clienteRows] = await pool.execute(clienteQuery, [usuario_id]);
    if (!clienteRows || clienteRows.length === 0) {
      throw new Error('Cliente no encontrado');
    }

    const cliente = clienteRows[0];
    const [mascotas] = await pool.execute(
      `SELECT id, nombre, especie, raza FROM MASCOTA WHERE cliente_id = ? ORDER BY nombre ASC`,
      [cliente.cliente_id]
    );

    const [historialRows] = await pool.execute(
      `SELECT
         sr.id as reserva_id,
         DATE(CONVERT_TZ(sr.fecha_hora, '+00:00', '-04:00')) as fecha,
         TIME(CONVERT_TZ(sr.fecha_hora, '+00:00', '-04:00')) as hora,
         sr.estado,
         s.nombre as servicio,
         sr.precio_final,
         fg.fecha_cierre
       FROM SLOT_RESERVA sr
       JOIN MASCOTA m ON sr.mascota_id = m.id
       LEFT JOIN SERVICIO s ON sr.servicio_id = s.id
       LEFT JOIN FICHA_GROOMING fg ON fg.reserva_id = sr.id
       WHERE m.cliente_id = ?
       ORDER BY sr.fecha_hora DESC
       LIMIT 20`,
      [cliente.cliente_id]
    );

    const [fotos] = await pool.execute(
      `SELECT sr.id as reserva_id, fs.url, fs.tipo
       FROM FOTO_SERVICIO fs
       JOIN FICHA_GROOMING fg ON fg.id = fs.ficha_id
       JOIN SLOT_RESERVA sr ON sr.id = fg.reserva_id
       JOIN MASCOTA m ON sr.mascota_id = m.id
       WHERE m.cliente_id = ?`,
      [cliente.cliente_id]
    );

    const photosByReserva = (fotos || []).reduce((acc, foto) => {
      const reservaId = foto.reserva_id;
      if (!acc[reservaId]) {
        acc[reservaId] = { antes: [], despues: [] };
      }
      if (foto.tipo === 'antes') {
        acc[reservaId].antes.push(foto.url);
      } else if (foto.tipo === 'despues') {
        acc[reservaId].despues.push(foto.url);
      }
      return acc;
    }, {});

    const historial = (historialRows || []).map((row) => {
      const photos = photosByReserva[row.reserva_id] || { antes: [], despues: [] };
      return {
        ...row,
        fotos_antes: photos.antes,
        fotos_despues: photos.despues
      };
    });

    const [resumenRows] = await pool.execute(
      `SELECT
         COUNT(sr.id) as total_reservas,
         SUM(CASE WHEN fg.fecha_cierre IS NOT NULL THEN 1 ELSE 0 END) as servicios_completados,
         SUM(sr.precio_final) as total_gastado,
         SUM(CASE WHEN sr.fecha_hora >= UTC_TIMESTAMP() AND sr.estado NOT IN ('cancelada') THEN 1 ELSE 0 END) as proximas_citas
       FROM SLOT_RESERVA sr
       LEFT JOIN FICHA_GROOMING fg ON fg.reserva_id = sr.id
       WHERE sr.mascota_id IN (SELECT id FROM MASCOTA WHERE cliente_id = ?)
      `,
      [cliente.cliente_id]
    );

    const resumen = resumenRows?.[0] || {};

    return {
      cliente,
      mascotas,
      historial,
      resumen: {
        ...resumen,
        puntos_acumulados: cliente.puntos_acumulados,
        nivel_fidelidad: cliente.nivel_fidelidad
      }
    };
  }

  async getCajaDiaria(fecha) {
    const pagosQuery = `
      SELECT
        pf.id,
        pf.reserva_id,
        pf.pedido_id,
        pf.monto,
        pf.metodo,
        pf.estado,
        pf.referencia,
        DATE(CONVERT_TZ(pf.fecha, '+00:00', '-04:00')) as fecha,
        TIME(CONVERT_TZ(pf.fecha, '+00:00', '-04:00')) as hora,
        sr.estado as reserva_estado,
        CONCAT(u.nombre, ' ', u.apellido) as cliente_nombre,
        m.nombre as mascota_nombre,
        s.nombre as servicio
      FROM PAGO_FACTURA pf
      LEFT JOIN SLOT_RESERVA sr ON pf.reserva_id = sr.id
      LEFT JOIN MASCOTA m ON sr.mascota_id = m.id
      LEFT JOIN CLIENTE c ON m.cliente_id = c.id
      LEFT JOIN USUARIO u ON c.usuario_id = u.id
      LEFT JOIN SERVICIO s ON sr.servicio_id = s.id
      WHERE DATE(CONVERT_TZ(pf.fecha, '+00:00', '-04:00')) = ?
      ORDER BY pf.fecha DESC
    `;

    const [pagos] = await pool.execute(pagosQuery, [fecha]);

    const [summaryRows] = await pool.execute(
      `SELECT
         COUNT(*) as total_pagos,
         SUM(pf.monto) as ingresos_totales,
         SUM(CASE WHEN pf.estado != 'pagado' THEN pf.monto ELSE 0 END) as total_pendiente,
         SUM(CASE WHEN pf.metodo = 'efectivo' THEN pf.monto ELSE 0 END) as total_efectivo,
         SUM(CASE WHEN pf.metodo = 'qr' THEN pf.monto ELSE 0 END) as total_qr,
         SUM(CASE WHEN pf.metodo = 'tarjeta' THEN pf.monto ELSE 0 END) as total_tarjeta,
         SUM(CASE WHEN pf.metodo = 'transferencia' THEN pf.monto ELSE 0 END) as total_transferencia
       FROM PAGO_FACTURA pf
       WHERE DATE(CONVERT_TZ(pf.fecha, '+00:00', '-04:00')) = ?
      `,
      [fecha]
    );

    const summary = summaryRows?.[0] || {};
    return { pagos, summary };
  }

  async getNpsResumen(filters = {}) {
    const { fecha_inicio, fecha_fin } = filters;
    const query = `
      SELECT
        COUNT(*) as total_encuestas,
        AVG(puntuacion) as promedio,
        SUM(CASE WHEN puntuacion >= 9 THEN 1 ELSE 0 END) as promotores,
        SUM(CASE WHEN puntuacion BETWEEN 7 AND 8 THEN 1 ELSE 0 END) as pasivos,
        SUM(CASE WHEN puntuacion <= 6 THEN 1 ELSE 0 END) as detractores
      FROM ENCUESTA
      WHERE 1=1
        ${fecha_inicio ? 'AND DATE(fecha) >= ?' : ''}
        ${fecha_fin ? 'AND DATE(fecha) <= ?' : ''}
    `;

    const params = [];
    if (fecha_inicio) params.push(fecha_inicio);
    if (fecha_fin) params.push(fecha_fin);

    const [stats] = await pool.execute(query, params);
    return stats[0] || {};
  }

  async getRankingRentabilidad(filters = {}) {
    const { fecha_inicio, fecha_fin } = filters;
    const queryFechaServicios = [];
    const paramsServicios = [];

    if (fecha_inicio) {
      queryFechaServicios.push('AND DATE(sr.fecha_hora) >= ?');
      paramsServicios.push(fecha_inicio);
    }
    if (fecha_fin) {
      queryFechaServicios.push('AND DATE(sr.fecha_hora) <= ?');
      paramsServicios.push(fecha_fin);
    }

    const [servicios] = await pool.execute(
      `SELECT
         s.id,
         s.nombre,
         COUNT(sr.id) as cantidad_servicios,
         SUM(sr.precio_final) as ingresos
       FROM SLOT_RESERVA sr
       JOIN SERVICIO s ON sr.servicio_id = s.id
       WHERE sr.estado IN ('confirmada', 'completada')
         ${queryFechaServicios.length ? queryFechaServicios.join(' ') : ''}
       GROUP BY s.id
       ORDER BY ingresos DESC, cantidad_servicios DESC
       LIMIT 10`,
      paramsServicios
    );

    const queryFechaProductos = [];
    const paramsProductos = [];
    if (fecha_inicio) {
      queryFechaProductos.push('AND DATE(mi.fecha) >= ?');
      paramsProductos.push(fecha_inicio);
    }
    if (fecha_fin) {
      queryFechaProductos.push('AND DATE(mi.fecha) <= ?');
      paramsProductos.push(fecha_fin);
    }

    const [productos] = await pool.execute(
      `SELECT
         p.id,
         p.nombre,
         SUM(mi.cantidad) as cantidad_vendida,
         SUM(mi.cantidad * p.precio) as ingresos
       FROM MOVIMIENTO_INVENTARIO mi
       JOIN PRODUCTO p ON mi.producto_id = p.id
       WHERE mi.tipo = 'salida'
         AND mi.origen NOT LIKE '%ajuste%'
         ${queryFechaProductos.length ? queryFechaProductos.join(' ') : ''}
       GROUP BY p.id
       ORDER BY ingresos DESC, cantidad_vendida DESC
       LIMIT 10`,
      paramsProductos
    );

    return {
      servicios,
      productos
    };
  }

  async getOcupacionGlobal(filters = {}) {
    const { fecha_inicio, fecha_fin } = filters;
    const [configRows] = await pool.execute('SELECT capacidad_diaria FROM CONFIGURACION ORDER BY id DESC LIMIT 1');
    const capacidadDiaria = configRows?.[0]?.capacidad_diaria || 0;

    let fechaInicio = fecha_inicio;
    let fechaFin = fecha_fin;
    if (!fechaFin) {
      fechaFin = new Date().toISOString().slice(0, 10);
    }
    if (!fechaInicio) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 29);
      fechaInicio = fecha.toISOString().slice(0, 10);
    }

    const query = `
      SELECT
        COUNT(*) as reservas_totales,
        SUM(CASE WHEN sr.estado IN ('confirmada', 'completada') THEN 1 ELSE 0 END) as reservas_ocupadas,
        SUM(CASE WHEN sr.estado = 'pendiente' THEN 1 ELSE 0 END) as reservas_pendientes,
        SUM(CASE WHEN sr.estado = 'cancelada' THEN 1 ELSE 0 END) as reservas_canceladas
      FROM SLOT_RESERVA sr
      WHERE DATE(sr.fecha_hora) BETWEEN ? AND ?
    `;

    const [statsRows] = await pool.execute(query, [fechaInicio, fechaFin]);
    const stats = statsRows?.[0] || {};

    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);
    const diffTime = Math.max(0, fechaFinObj.getTime() - fechaInicioObj.getTime());
    const diasPeriodo = Math.max(Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1, 1);
    const capacidadTotal = capacidadDiaria * diasPeriodo;
    const porcentajeOcupacion = capacidadTotal > 0
      ? parseFloat(((stats.reservas_ocupadas || 0) / capacidadTotal * 100).toFixed(2))
      : 0;

    return {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      dias_periodo: diasPeriodo,
      capacidad_diaria: capacidadDiaria,
      capacidad_total: capacidadTotal,
      reservas_totales: stats.reservas_totales || 0,
      reservas_ocupadas: stats.reservas_ocupadas || 0,
      reservas_pendientes: stats.reservas_pendientes || 0,
      reservas_canceladas: stats.reservas_canceladas || 0,
      porcentaje_ocupacion: porcentajeOcupacion
    };
  }

  async getAuditoriaInsumos(filters = {}) {
    const { fecha_inicio, fecha_fin } = filters;
    const conditions = [];
    const params = [];

    if (fecha_inicio) {
      conditions.push('AND DATE(fg.fecha_cierre) >= ?');
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      conditions.push('AND DATE(fg.fecha_cierre) <= ?');
      params.push(fecha_fin);
    }

    const [summaryRows] = await pool.execute(
      `SELECT
         COALESCE(SUM(fi.cantidad), 0) as total_entregados,
         COALESCE(SUM(CASE WHEN fi.estado = 'usado' THEN fi.cantidad ELSE 0 END), 0) as total_usados,
         COALESCE(SUM(CASE WHEN fi.estado IN ('usado', 'merma') THEN fi.cantidad ELSE 0 END), 0) as total_descontados
       FROM FICHA_INSUMO fi
       JOIN FICHA_GROOMING fg ON fi.ficha_id = fg.id
       WHERE 1=1
         ${conditions.length ? conditions.join('\n         ') : ''}`,
      params
    );

    const [detalle] = await pool.execute(
      `SELECT
         p.id as producto_id,
         p.nombre as producto_nombre,
         COALESCE(SUM(fi.cantidad), 0) as entregados,
         COALESCE(SUM(CASE WHEN fi.estado = 'usado' THEN fi.cantidad ELSE 0 END), 0) as usados,
         COALESCE(SUM(CASE WHEN fi.estado IN ('usado', 'merma') THEN fi.cantidad ELSE 0 END), 0) as descontados
       FROM FICHA_INSUMO fi
       JOIN PRODUCTO p ON fi.producto_id = p.id
       JOIN FICHA_GROOMING fg ON fi.ficha_id = fg.id
       WHERE 1=1
         ${conditions.length ? conditions.join('\n         ') : ''}
       GROUP BY p.id
       ORDER BY entregados DESC
       LIMIT 15`,
      params
    );

    return {
      summary: summaryRows?.[0] || {
        total_entregados: 0,
        total_usados: 0,
        total_descontados: 0
      },
      detalle
    };
  }

  async getGroomerIdByUsuarioId(usuarioId) {
    const [rows] = await pool.execute(
      'SELECT id FROM GROOMER WHERE usuario_id = ? AND activo = TRUE LIMIT 1',
      [usuarioId]
    );
    if (!rows || rows.length === 0) {
      return null;
    }
    return rows[0].id;
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
        COUNT(DISTINCT m.cliente_id) as clientes_unicos
      FROM PAGO_FACTURA pf
      LEFT JOIN SLOT_RESERVA sr ON pf.reserva_id = sr.id
      LEFT JOIN MASCOTA m ON sr.mascota_id = m.id
      LEFT JOIN FICHA_GROOMING fg ON fg.reserva_id = sr.id AND fg.fecha_cierre IS NOT NULL
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
