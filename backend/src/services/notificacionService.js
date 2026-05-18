const pool = require('../config/database');

class NotificacionService {
  async getByUserId(userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM NOTIFICACION WHERE usuario_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  }

  async markRead(id, userId) {
    const [result] = await pool.execute(
      'UPDATE NOTIFICACION SET leida = TRUE WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error('Notificación no encontrada o no autorizada');
    }

    const [rows] = await pool.execute(
      'SELECT * FROM NOTIFICACION WHERE id = ? AND usuario_id = ?',
      [id, userId]
    );
    return rows[0];
  }

  async createNotification(usuarioId, tipo, canal, titulo, cuerpo) {
    const [result] = await pool.execute(
      `INSERT INTO NOTIFICACION (usuario_id, tipo, canal, titulo, cuerpo) VALUES (?, ?, ?, ?, ?)`,
      [usuarioId, tipo, canal, titulo, cuerpo]
    );

    const [rows] = await pool.execute('SELECT * FROM NOTIFICACION WHERE id = ?', [result.insertId]);
    return rows[0];
  }
}

module.exports = new NotificacionService();
