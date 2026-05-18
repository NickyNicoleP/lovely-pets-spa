const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const authService = require('./authService');

class ClienteService {
  async getAll() {
    const [clientes] = await pool.execute(
      `SELECT c.id,
              c.usuario_id,
              u.nombre,
              u.apellido,
              u.email,
              u.telefono,
              c.ci,
              c.direccion,
              c.preferencias,
              c.nivel_fidelidad,
              c.puntos_acumulados
       FROM CLIENTE c
       JOIN USUARIO u ON c.usuario_id = u.id
       ORDER BY c.id DESC`
    );
    return clientes;
  }

  async getById(id) {
    const [clientes] = await pool.execute(
      `SELECT c.id,
              c.usuario_id,
              u.nombre,
              u.apellido,
              u.email,
              u.telefono,
              c.ci,
              c.direccion,
              c.preferencias,
              c.nivel_fidelidad,
              c.puntos_acumulados
       FROM CLIENTE c
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (clientes.length === 0) {
      throw new Error('Cliente no encontrado');
    }
    return clientes[0];
  }

  async getByUsuarioId(usuarioId) {
    const [clientes] = await pool.execute(
      `SELECT c.id,
              c.usuario_id,
              u.nombre,
              u.apellido,
              u.email,
              u.telefono,
              c.ci,
              c.direccion,
              c.preferencias,
              c.nivel_fidelidad,
              c.puntos_acumulados
       FROM CLIENTE c
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE c.usuario_id = ?`,
      [usuarioId]
    );

    if (clientes.length === 0) {
      throw new Error('Cliente no encontrado');
    }
    return clientes[0];
  }

  async create(clienteData, userId) {
    const { nombre, apellido, email, telefono, direccion } = clienteData;

    const randomPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const [userResult] = await pool.execute(
      `INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, direccion, email_verificado)
       VALUES (?, ?, ?, ?, 'cliente', ?, ?, TRUE)`,
      [nombre, apellido, email, passwordHash, telefono || null, direccion || null]
    );

    const [result] = await pool.execute(
      `INSERT INTO CLIENTE (usuario_id, ci, direccion, nivel_fidelidad, puntos_acumulados)
       VALUES (?, NULL, ?, 'bronze', 0)`,
      [userResult.insertId, direccion || null]
    );

    await authService.registrarAudit(userId, null, null, null, 'crear_cliente', clienteData);
    return this.getById(result.insertId);
  }

  async update(id, clienteData, userId) {
    const clienteAnterior = await this.getById(id);
    const { nombre, apellido, email, telefono, direccion } = clienteData;

    await pool.execute(
      `UPDATE USUARIO SET nombre = ?, apellido = ?, email = ?, telefono = ?, direccion = ?
       WHERE id = ?`,
      [nombre, apellido, email, telefono || null, direccion || null, clienteAnterior.usuario_id]
    );

    await pool.execute(
      `UPDATE CLIENTE SET direccion = ?
       WHERE id = ?`,
      [direccion || null, id]
    );

    await authService.registrarAudit(userId, null, null, null, 'actualizar_cliente', { anterior: clienteAnterior, nuevo: clienteData });
    return this.getById(id);
  }

  async delete(id, userId) {
    const cliente = await this.getById(id);

    await pool.execute('DELETE FROM CLIENTE WHERE id = ?', [id]);
    await pool.execute('DELETE FROM USUARIO WHERE id = ?', [cliente.usuario_id]);

    await authService.registrarAudit(userId, null, null, null, 'eliminar_cliente', { id });
    return { message: 'Cliente eliminado correctamente' };
  }

  async getMascotas(clienteId) {
    const [mascotas] = await pool.execute(
      'SELECT * FROM MASCOTA WHERE cliente_id = ?',
      [clienteId]
    );
    return mascotas;
  }
}

module.exports = new ClienteService();