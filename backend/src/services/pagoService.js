const pool = require('../config/database');

class PagoService {
  async getAll(filters = {}) {
    let query = `
      SELECT pf.id, pf.pedido_id, pf.reserva_id, pf.monto, pf.metodo, pf.estado, pf.referencia, pf.fecha,
             sr.id AS reserva_id_alt, m.nombre AS mascota_nombre, u.nombre AS cliente_nombre,
             u.apellido AS cliente_apellido, s.nombre AS servicio_nombre
      FROM PAGO_FACTURA pf
      LEFT JOIN SLOT_RESERVA sr ON pf.reserva_id = sr.id
      LEFT JOIN MASCOTA m ON sr.mascota_id = m.id
      LEFT JOIN CLIENTE c ON m.cliente_id = c.id
      LEFT JOIN USUARIO u ON c.usuario_id = u.id
      LEFT JOIN SERVICIO s ON sr.servicio_id = s.id
      WHERE 1=1
    `;

    const params = [];

    if (filters.reserva_id) {
      query += ' AND pf.reserva_id = ?';
      params.push(filters.reserva_id);
    }

    if (filters.pedido_id) {
      query += ' AND pf.pedido_id = ?';
      params.push(filters.pedido_id);
    }

    if (filters.metodo) {
      query += ' AND pf.metodo = ?';
      params.push(filters.metodo);
    }

    if (filters.fecha_inicio) {
      query += ' AND DATE(pf.fecha) >= ?';
      params.push(filters.fecha_inicio);
    }

    if (filters.fecha_fin) {
      query += ' AND DATE(pf.fecha) <= ?';
      params.push(filters.fecha_fin);
    }

    query += ' ORDER BY pf.fecha DESC';

    const [pagos] = await pool.execute(query, params);
    return pagos;
  }

  async getById(id) {
    const [pagos] = await pool.execute(
      `
      SELECT pf.id, pf.pedido_id, pf.reserva_id, pf.monto, pf.metodo, pf.estado, pf.referencia, pf.fecha,
             sr.id AS reserva_id_alt, m.nombre AS mascota_nombre, u.nombre AS cliente_nombre,
             u.apellido AS cliente_apellido, s.nombre AS servicio_nombre
      FROM PAGO_FACTURA pf
      LEFT JOIN SLOT_RESERVA sr ON pf.reserva_id = sr.id
      LEFT JOIN MASCOTA m ON sr.mascota_id = m.id
      LEFT JOIN CLIENTE c ON m.cliente_id = c.id
      LEFT JOIN USUARIO u ON c.usuario_id = u.id
      LEFT JOIN SERVICIO s ON sr.servicio_id = s.id
      WHERE pf.id = ?
      `,
      [id]
    );

    if (pagos.length === 0) {
      throw new Error('Pago no encontrado');
    }

    return pagos[0];
  }

  async create(paymentData, userId) {
    const { pedido_id, reserva_id, monto, metodo, estado, referencia } = paymentData;

    const montoValue = Number(monto);
    if (Number.isNaN(montoValue) || montoValue <= 0) {
      throw new Error('Monto inválido');
    }

    if (!pedido_id && !reserva_id) {
      throw new Error('Pedido o reserva son requeridos');
    }

    const allowedMethods = ['efectivo', 'qr', 'tarjeta', 'link_pago'];
    if (!allowedMethods.includes(metodo)) {
      throw new Error('Método de pago inválido');
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      if (reserva_id) {
        const [reservas] = await connection.execute(
          'SELECT id FROM SLOT_RESERVA WHERE id = ?',
          [reserva_id]
        );

        if (reservas.length === 0) {
          throw new Error('Reserva no encontrada');
        }

        await connection.execute(
          'UPDATE SLOT_RESERVA SET estado = ?, precio_final = ? WHERE id = ?',
          ['completada', montoValue, reserva_id]
        );
      }

      const [result] = await connection.execute(
        `INSERT INTO PAGO_FACTURA
         (pedido_id, reserva_id, monto, metodo, estado, referencia)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pedido_id || null, reserva_id || null, montoValue, metodo, estado || 'pagado', referencia || null]
      );

      await connection.commit();
      return this.getById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new PagoService();
