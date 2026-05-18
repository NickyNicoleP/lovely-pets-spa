const pool = require('../config/database');
const authService = require('./authService');

class MascotaService {
  async getAll() {
    const [mascotas] = await pool.execute(
      `SELECT m.*, u.nombre as cliente_nombre, u.apellido as cliente_apellido
       FROM MASCOTA m
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       ORDER BY m.id DESC`
    );
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
    const { cliente_id, nombre, especie, raza, edad, peso, observaciones } = mascotaData;

    const [result] = await pool.execute(
      `INSERT INTO MASCOTA (cliente_id, nombre, especie, raza, edad, peso, temperamento, alergias, restricciones_medicas, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [
        cliente_id,
        nombre,
        especie,
        raza,
        edad || null,
        peso || null,
        observaciones || null,
        null,
        null
      ]
    );

    await authService.registrarAudit(userId, null, null, null, 'crear_mascota', mascotaData);
    return this.getById(result.insertId);
  }

  async update(id, mascotaData, userId) {
    const mascotaAnterior = await this.getById(id);
    const { nombre, especie, raza, edad, peso, observaciones } = mascotaData;

    await pool.execute(
      `UPDATE MASCOTA SET nombre = ?, especie = ?, raza = ?, edad = ?, peso = ?, temperamento = ?
       WHERE id = ?`,
      [nombre, especie, raza, edad || null, peso || null, observaciones || null, id]
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