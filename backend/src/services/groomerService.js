const pool = require('../config/database');
const authService = require('./authService');

class GroomerService {
  async getAll() {
    const [groomers] = await pool.execute(
      `SELECT g.id,
              g.ci,
              g.direccion,
              g.especialidades,
              g.turno,
              g.disponibilidad_semanal,
              g.activo,
              u.nombre AS nombre,
              u.apellido AS apellido,
              u.email AS email
       FROM GROOMER g
       JOIN USUARIO u ON g.usuario_id = u.id
       WHERE g.activo = TRUE
       ORDER BY u.nombre, u.apellido`
    );

    return groomers.map((g) => ({
      ...g,
      nombre: `${g.nombre} ${g.apellido}`.trim(),
      disponibilidad_semanal: g.disponibilidad_semanal ? JSON.parse(g.disponibilidad_semanal) : null,
    }));
  }

  async getById(id) {
    const [groomers] = await pool.execute(
      `SELECT g.id,
              g.ci,
              g.direccion,
              g.especialidades,
              g.turno,
              g.disponibilidad_semanal,
              g.activo,
              u.nombre AS nombre,
              u.apellido AS apellido,
              u.email AS email
       FROM GROOMER g
       JOIN USUARIO u ON g.usuario_id = u.id
       WHERE g.id = ?`,
      [id]
    );

    if (groomers.length === 0) {
      throw new Error('Groomer no encontrado');
    }

    const groomer = groomers[0];
    return {
      ...groomer,
      nombre: `${groomer.nombre} ${groomer.apellido}`.trim(),
      disponibilidad_semanal: groomer.disponibilidad_semanal ? JSON.parse(groomer.disponibilidad_semanal) : null,
    };
  }

  async updateDisponibilidad(id, data, userId) {
    const groomerAnterior = await this.getById(id);
    const disponibilidadSemanal = JSON.stringify(data.disponibilidad_semanal || groomerAnterior.disponibilidad_semanal || {});

    await pool.execute(
      'UPDATE GROOMER SET disponibilidad_semanal = ? WHERE id = ?',
      [disponibilidadSemanal, id]
    );

    await authService.registrarAudit(userId, null, null, null, 'actualizar_disponibilidad_groomer', {
      anterior: groomerAnterior,
      nuevo: { disponibilidad_semanal: data.disponibilidad_semanal }
    });

    return this.getById(id);
  }
}

module.exports = new GroomerService();
module.exports.default = module.exports;