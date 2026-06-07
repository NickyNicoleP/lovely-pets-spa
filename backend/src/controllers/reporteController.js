const PDFDocument = require('pdfkit');
const reporteService = require('../services/reporteService');

const buildErrorResponse = (res, error) => {
  console.error(error);
  return res.status(500).json({ error: error.message || 'Error interno del servidor' });
};

const getGroomerIdFromUser = async (user) => {
  const groomerId = await reporteService.getGroomerIdByUsuarioId(user.id);
  if (!groomerId) {
    throw new Error('Usuario groomer no encontrado');
  }
  return groomerId;
};

/**
 * Admin: Sales and Revenue Report
 */
exports.getVentasAdmin = async (req, res) => {
  try {
    if (req.user?.rol !== 'admin' && req.user?.rol !== 'administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { fecha_inicio, fecha_fin, periodo } = req.query;
    const ventas = await reporteService.getVentasAdmin({
      fecha_inicio,
      fecha_fin,
      periodo: periodo || 'diario'
    });

    res.json(ventas);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

/**
 * Reception: Daily Schedule Report
 */
exports.getAgendaDiaria = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: 'Fecha requerida' });
    }

    const agenda = await reporteService.getAgendaDiaria(fecha);
    res.json(agenda);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

/**
 * Reception: Daily Cash Register Report
 */
exports.getCajaDiaria = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      return res.status(400).json({ error: 'Fecha requerida' });
    }

    const caja = await reporteService.getCajaDiaria(fecha);
    res.json(caja);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

/**
 * Groomer: Service History Report
 */
exports.getHistorialGroomer = async (req, res) => {
  try {
    let groomer_id = req.params.groomer_id || req.query.groomer_id;
    if (req.user?.rol === 'groomer') {
      groomer_id = await getGroomerIdFromUser(req.user);
    }

    if (!groomer_id) {
      return res.status(400).json({ error: 'groomer_id requerido' });
    }

    const { fecha_inicio, fecha_fin } = req.query;
    const historial = await reporteService.getHistorialGroomer(groomer_id, {
      fecha_inicio,
      fecha_fin
    });

    res.json(historial);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

/**
 * Groomer: Performance Statistics
 */
exports.getEstadisticasGroomer = async (req, res) => {
  try {
    let groomer_id = req.params.groomer_id || req.query.groomer_id;
    if (req.user?.rol === 'groomer') {
      groomer_id = await getGroomerIdFromUser(req.user);
    }

    if (!groomer_id) {
      return res.status(400).json({ error: 'groomer_id requerido' });
    }

    const { fecha_inicio, fecha_fin } = req.query;
    const stats = await reporteService.getEstadisticasGroomer(groomer_id, {
      fecha_inicio,
      fecha_fin
    });

    res.json(stats);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

/**
 * Client Report
 */
exports.getReporteCliente = async (req, res) => {
  try {
    if (req.user?.rol !== 'cliente') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const reporte = await reporteService.getReporteCliente(req.user.id);
    res.json(reporte);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

/**
 * NPS Summary
 */
exports.getNpsResumen = async (req, res) => {
  try {
    if (req.user?.rol !== 'admin' && req.user?.rol !== 'administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const fecha_inicio = req.query.fecha_inicio?.trim() || undefined;
    const fecha_fin = req.query.fecha_fin?.trim() || undefined;
    const stats = await reporteService.getNpsResumen({ fecha_inicio, fecha_fin });
    res.json(stats);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

exports.getRankingRentabilidad = async (req, res) => {
  try {
    if (req.user?.rol !== 'admin' && req.user?.rol !== 'administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const fecha_inicio = req.query.fecha_inicio?.trim() || undefined;
    const fecha_fin = req.query.fecha_fin?.trim() || undefined;
    const ranking = await reporteService.getRankingRentabilidad({ fecha_inicio, fecha_fin });
    res.json(ranking);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

exports.getOcupacionGlobal = async (req, res) => {
  try {
    if (req.user?.rol !== 'admin' && req.user?.rol !== 'administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const fecha_inicio = req.query.fecha_inicio?.trim() || undefined;
    const fecha_fin = req.query.fecha_fin?.trim() || undefined;
    const ocupacion = await reporteService.getOcupacionGlobal({ fecha_inicio, fecha_fin });
    res.json(ocupacion);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

exports.getAuditoriaInsumos = async (req, res) => {
  try {
    if (req.user?.rol !== 'admin' && req.user?.rol !== 'administrador') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const fecha_inicio = req.query.fecha_inicio?.trim() || undefined;
    const fecha_fin = req.query.fecha_fin?.trim() || undefined;
    const auditoria = await reporteService.getAuditoriaInsumos({ fecha_inicio, fecha_fin });
    res.json(auditoria);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

const createPdfResponse = (res, filename, title, subtitle, headers, rows, summary = {}) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown(0.5);

  if (subtitle) {
    doc.fontSize(10).text(subtitle);
    doc.moveDown(0.5);
  }

  if (Object.keys(summary).length) {
    doc.fontSize(12).text('Resumen', { underline: true });
    doc.moveDown(0.25);
    Object.entries(summary).forEach(([key, value]) => {
      doc.fontSize(10).text(`${key}: ${value}`);
    });
    doc.moveDown(0.5);
  }

  doc.fontSize(12).text('Detalle del reporte');
  doc.moveDown(0.5);

  const tableWidth = 515;
  const colCount = headers.length;
  const colWidth = Math.floor(tableWidth / colCount);
  const positions = headers.map((_, i) => 40 + i * colWidth);

  doc.font('Helvetica-Bold').fontSize(10);
  headers.forEach((header, index) => {
    doc.text(header, positions[index], doc.y, {
      width: colWidth - 5,
      continued: index < headers.length - 1
    });
  });
  doc.text('', { continued: false });
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(9);
  rows.forEach((row) => {
    const currentY = doc.y;
    row.forEach((cell, index) => {
      doc.text(String(cell ?? '-'), positions[index], currentY, {
        width: colWidth - 5,
        continued: index < row.length - 1
      });
    });
    doc.text('', { continued: false });
    doc.moveDown(0.5);
    if (doc.y > 740) {
      doc.addPage();
    }
  });

  doc.end();
};

exports.downloadReportPdf = async (req, res) => {
  try {
    const tipo = req.query.tipo;
    if (!tipo) {
      return res.status(400).json({ error: 'tipo requerido' });
    }

    const fecha_inicio = req.query.fecha_inicio?.trim() || undefined;
    const fecha_fin = req.query.fecha_fin?.trim() || undefined;
    const periodo = req.query.periodo || 'diario';
    const fecha = req.query.fecha?.trim() || undefined;
    let groomer_id = req.query.groomer_id || undefined;

    let title = 'Reporte';
    let subtitle = '';
    let headers = [];
    let rows = [];
    let summary = {};

    if (tipo === 'ventas') {
      if (req.user?.rol !== 'admin' && req.user?.rol !== 'administrador') {
        return res.status(403).json({ error: 'No autorizado' });
      }

      const filters = { fecha_inicio, fecha_fin, periodo };
      const ventas = await reporteService.getVentasAdmin(filters);
      const stats = await reporteService.getEstadisticasGenerales({ fecha_inicio, fecha_fin });

      title = 'Reporte de Ventas';
      subtitle = `Período: ${periodo}${fecha_inicio ? ` | Desde: ${fecha_inicio}` : ''}${fecha_fin ? ` | Hasta: ${fecha_fin}` : ''}`;
      headers = ['Período', 'Transacciones', 'Total Ingresos', 'Promedio'];
      rows = ventas.map((row) => [
        row.periodo,
        row.total_transacciones,
        `Bs ${parseFloat(row.total_ingresos || 0).toFixed(2)}`,
        `Bs ${parseFloat(row.promedio_venta || 0).toFixed(2)}`
      ]);
      summary = {
        'Ingresos totales': `Bs ${parseFloat(stats.ingresos_totales || 0).toFixed(2)}`,
        'Transacciones': stats.total_pagos || 0,
        'Servicios completados': stats.servicios_completados || 0,
        'Clientes únicos': stats.clientes_unicos || 0
      };
    } else if (tipo === 'agenda') {
      const requestedDate = fecha || new Date().toISOString().split('T')[0];
      const agenda = await reporteService.getAgendaDiaria(requestedDate);

      title = 'Reporte de Agenda Diaria';
      subtitle = `Fecha: ${requestedDate}`;
      headers = ['Hora', 'Cliente', 'Mascota', 'Raza', 'Servicio', 'Groomer', 'Estado'];
      rows = agenda.map((row) => [
        row.hora,
        row.cliente_nombre,
        row.mascota_nombre,
        row.mascota_raza || '-',
        row.servicio,
        row.groomer_nombre || 'Sin asignar',
        row.estado
      ]);
      summary = {
        'Citas totales': agenda.length,
        'Confirmadas': agenda.filter((item) => item.estado === 'confirmada').length,
        'Canceladas': agenda.filter((item) => item.estado === 'cancelada').length
      };
    } else if (tipo === 'groomer') {
      if (req.user?.rol === 'groomer') {
        groomer_id = await getGroomerIdFromUser(req.user);
      }

      if (!groomer_id) {
        return res.status(400).json({ error: 'groomer_id requerido' });
      }

      const historial = await reporteService.getHistorialGroomer(groomer_id, {
        fecha_inicio,
        fecha_fin
      });

      title = 'Reporte de Historial Groomer';
      subtitle = `Groomer ID: ${groomer_id}${fecha_inicio ? ` | Desde: ${fecha_inicio}` : ''}${fecha_fin ? ` | Hasta: ${fecha_fin}` : ''}`;
      headers = ['Fecha', 'Cliente', 'Mascota', 'Servicio', 'Monto', 'Método'];
      rows = historial.map((row) => [
        row.fecha_cierre ? new Date(row.fecha_cierre).toLocaleDateString() : '-',
        row.cliente_nombre,
        row.mascota_nombre,
        row.servicio,
        `Bs ${parseFloat(row.total_pagado || 0).toFixed(2)}`,
        row.metodo || '-'
      ]);
      summary = {
        'Total servicios': historial.length,
        'Ingresos totales': `Bs ${historial.reduce((sum, item) => sum + parseFloat(item.total_pagado || 0), 0).toFixed(2)}`
      };
    } else if (tipo === 'cliente') {
      if (req.user?.rol !== 'cliente') {
        return res.status(403).json({ error: 'No autorizado' });
      }
      const clienteReport = await reporteService.getReporteCliente(req.user.id);
      title = 'Reporte de Cliente';
      subtitle = `${clienteReport.cliente.nombre} ${clienteReport.cliente.apellido}`;
      headers = ['Reserva ID', 'Fecha', 'Hora', 'Estado', 'Servicio', 'Monto'];
      rows = clienteReport.historial.map((row) => [
        row.reserva_id,
        row.fecha,
        row.hora,
        row.estado,
        row.servicio,
        `Bs ${parseFloat(row.precio_final || 0).toFixed(2)}`
      ]);
      summary = {
        'Reservas totales': clienteReport.resumen.total_reservas || 0,
        'Servicios completados': clienteReport.resumen.servicios_completados || 0,
        'Total gastado': `Bs ${parseFloat(clienteReport.resumen.total_gastado || 0).toFixed(2)}`,
        'Puntos acumulados': clienteReport.resumen.puntos_acumulados || 0
      };
    } else {
      return res.status(400).json({ error: 'Tipo de reporte inválido' });
    }

    const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    createPdfResponse(res, filename, title, subtitle, headers, rows, summary);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};

/**
 * General Dashboard Statistics
 */
exports.getEstadisticasGenerales = async (req, res) => {
  try {
    const fecha_inicio = req.query.fecha_inicio?.trim() || undefined;
    const fecha_fin = req.query.fecha_fin?.trim() || undefined;
    const role = req.user?.rol;

    if (role === 'cliente') {
      const base = await reporteService.getEstadisticasCliente(req.user.id);
      return res.json(base.resumen || {});
    }

    if (role === 'groomer') {
      const groomer_id = await getGroomerIdFromUser(req.user);
      const stats = await reporteService.getEstadisticasGroomer(groomer_id, {
        fecha_inicio,
        fecha_fin
      });
      return res.json(stats);
    }

    const stats = await reporteService.getEstadisticasGenerales({
      fecha_inicio,
      fecha_fin
    });

    res.json(stats);
  } catch (error) {
    buildErrorResponse(res, error);
  }
};
