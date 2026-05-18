const pool = require('../config/database');

class AuditService {
  async getLoginLogs(filters = {}) {
    let query = `
      SELECT al.*, u.email as usuario_email, u.nombre as usuario_nombre
      FROM AUDIT_LOG al
      LEFT JOIN USUARIO u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      params.push(filters.user_id);
    }
    
    if (filters.evento) {
      query += ' AND al.evento = ?';
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
      FROM AUDIT_LOG al
      LEFT JOIN USUARIO u ON al.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.user_id) {
      query += ' AND al.user_id = ?';
      params.push(filters.user_id);
    }
    
    if (filters.accion) {
      query += ' AND al.accion = ?';
      params.push(filters.accion);
    }
    
    if (filters.entidad) {
      query += ' AND al.entidad = ?';
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