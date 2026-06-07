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

  async update(id, data, userId) {
    const groomerAnterior = await this.getById(id);
    const fields = {};

    if (data.ci !== undefined) {
      fields.ci = data.ci || null;
    }
    if (data.direccion !== undefined) {
      fields.direccion = data.direccion || null;
    }
    if (data.especialidades !== undefined) {
      fields.especialidades = data.especialidades || null;
    }
    if (data.turno !== undefined) {
      fields.turno = data.turno || null;
    }
    if (data.activo !== undefined) {
      fields.activo = data.activo ? 1 : 0;
    }
    if (data.disponibilidad_semanal !== undefined) {
      fields.disponibilidad_semanal = JSON.stringify(data.disponibilidad_semanal || {});
    }

    if (Object.keys(fields).length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    const setClause = Object.keys(fields).map((field) => `${field} = ?`).join(', ');
    const params = [...Object.values(fields), id];

    await pool.execute(
      `UPDATE GROOMER SET ${setClause} WHERE id = ?`,
      params
    );

    await authService.registrarAudit(userId, null, null, null, 'actualizar_groomer', {
      anterior: groomerAnterior,
      nuevo: {
        ci: data.ci !== undefined ? data.ci : groomerAnterior.ci,
        direccion: data.direccion !== undefined ? data.direccion : groomerAnterior.direccion,
        especialidades: data.especialidades !== undefined ? data.especialidades : groomerAnterior.especialidades,
        turno: data.turno !== undefined ? data.turno : groomerAnterior.turno,
        activo: data.activo !== undefined ? data.activo : groomerAnterior.activo,
        disponibilidad_semanal: data.disponibilidad_semanal !== undefined ? data.disponibilidad_semanal : groomerAnterior.disponibilidad_semanal
      }
    });

    return this.getById(id);
  }
}

module.exports = new GroomerService();
module.exports.default = module.exports;