const pool = require('../config/database');
const authService = require('./authService');

class MascotaService {
  /**
   * Obtener todas las mascotas
   * - Si userId es admin, devuelve todas
   * - Si userId es cliente, devuelve solo sus mascotas
   * - Si userId es empleado/groomer, devuelve todas (para atenderlas)
   */
  async getAll(userId = null, userRole = null) {
    let query = `SELECT m.*, u.nombre as cliente_nombre, u.apellido as cliente_apellido
                 FROM MASCOTA m
                 JOIN CLIENTE c ON m.cliente_id = c.id
                 JOIN USUARIO u ON c.usuario_id = u.id`;
    let params = [];

    // Si es cliente, filtrar solo sus mascotas
    if (userRole === 'cliente' && userId) {
      query += ` WHERE c.usuario_id = ?`;
      params.push(userId);
    }
    // Si es admin/empleado/groomer, ver todas (para gestión)

    query += ` ORDER BY m.id DESC`;

    const [mascotas] = await pool.execute(query, params);
    return mascotas;
  }

  async getById(id) {
    const [mascotas] = await pool.execute(
      `SELECT m.*, u.nombre as cliente_nombre, u.apellido as cliente_apellido
       FROM MASCOTA m
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE m.id = ?`,
      [id]
    );
    if (mascotas.length === 0) {
      throw new Error('Mascota no encontrada');
    }
    return mascotas[0];
  }

  async create(mascotaData, userId) {
    const {
      cliente_id,
      nombre,
      especie,
      raza,
      edad,
      peso,
      temperamento,
      alergias,
      restricciones_medicas,
      vacunas,
      foto_url
    } = mascotaData;

    const vacunasValue = vacunas ? JSON.stringify(vacunas) : null;

    const [result] = await pool.execute(
      `INSERT INTO MASCOTA (cliente_id, nombre, especie, raza, edad, peso, temperamento, alergias, restricciones_medicas, vacunas, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cliente_id,
        nombre,
        especie,
        raza,
        edad || null,
        peso || null,
        temperamento || null,
        alergias || null,
        restricciones_medicas || null,
        vacunasValue,
        foto_url || null
      ]
    );

    await authService.registrarAudit(userId, null, null, null, 'crear_mascota', mascotaData);
    return this.getById(result.insertId);
  }

  async update(id, mascotaData, userId) {
    const mascotaAnterior = await this.getById(id);
    const {
      nombre,
      especie,
      raza,
      edad,
      peso,
      temperamento,
      alergias,
      restricciones_medicas,
      vacunas,
      foto_url
    } = mascotaData;

    const vacunasValue = vacunas ? JSON.stringify(vacunas) : null;

    await pool.execute(
      `UPDATE MASCOTA SET nombre = ?, especie = ?, raza = ?, edad = ?, peso = ?, temperamento = ?, alergias = ?, restricciones_medicas = ?, vacunas = ?, foto_url = ?
       WHERE id = ?`,
      [
        nombre,
        especie,
        raza,
        edad || null,
        peso || null,
        temperamento || null,
        alergias || null,
        restricciones_medicas || null,
        vacunasValue,
        foto_url || null,
        id
      ]
    );

    await authService.registrarAudit(userId, null, null, null, 'actualizar_mascota', { anterior: mascotaAnterior, nuevo: mascotaData });
    return this.getById(id);
  }

  async delete(id, userId) {
    await pool.execute('DELETE FROM MASCOTA WHERE id = ?', [id]);
    await authService.registrarAudit(userId, null, null, null, 'eliminar_mascota', { id });
    return { message: 'Mascota eliminada correctamente' };
  }
}

module.exports = new MascotaService();