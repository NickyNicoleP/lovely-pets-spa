const pool = require('../config/database');

class AuditService {
  async logAction(userId, accion, ipOrigen = null, userAgent = null, detalles = {}) {
    let email = null;
    let rol = null;

    if (userId) {
      const [users] = await pool.execute(
        'SELECT email, rol FROM USUARIO WHERE id = ? LIMIT 1',
        [userId]
      );
      if (users.length > 0) {
        email = users[0].email;
        rol = users[0].rol;
      }
    }

    const detallesJson = detalles && typeof detalles === 'object' ? JSON.stringify(detalles) : null;

    await pool.execute(
      `INSERT INTO AUDITORIA_LOG (usuario_id, email, rol, accion, ip_origen, user_agent, detalles)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId || null, email, rol, accion, ipOrigen, userAgent, detallesJson]
    );
  }

  async getLoginLogs(filters = {}) {
    let query = `
      SELECT al.*, u.email as usuario_email, u.nombre as usuario_nombre
      FROM AUDITORIA_LOG al
      LEFT JOIN USUARIO u ON al.usuario_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.user_id) {
      query += ' AND al.usuario_id = ?';
      params.push(filters.user_id);
    }

    if (filters.evento) {
      query += ' AND al.accion = ?';
      params.push(filters.evento);
    }

    if (filters.fecha_inicio) {
      query += ' AND DATE(al.created_at) >= ?';
      params.push(filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      query += ' AND DATE(al.created_at) <= ?';
      params.push(filters.fecha_fin);
    }

    query += ' ORDER BY al.created_at DESC LIMIT 100';

    const [logs] = await pool.execute(query, params);
    return logs;
  }

  async getAuditLogs(filters = {}) {
    let query = `
      SELECT al.*, u.email as usuario_email, u.nombre as usuario_nombre
      FROM AUDITORIA_LOG al
      LEFT JOIN USUARIO u ON al.usuario_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.user_id) {
      query += ' AND al.usuario_id = ?';
      params.push(filters.user_id);
    }

    if (filters.accion) {
      query += ' AND al.accion = ?';
      params.push(filters.accion);
    }

    if (filters.entidad) {
      query += ' AND JSON_SEARCH(al.detalles, "one", ?) IS NOT NULL';
      params.push(filters.entidad);
    }

    if (filters.fecha_inicio) {
      query += ' AND DATE(al.created_at) >= ?';
      params.push(filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      query += ' AND DATE(al.created_at) <= ?';
      params.push(filters.fecha_fin);
    }

    query += ' ORDER BY al.created_at DESC LIMIT 100';

    const [logs] = await pool.execute(query, params);
    return logs;
  }
}

module.exports = new AuditService();