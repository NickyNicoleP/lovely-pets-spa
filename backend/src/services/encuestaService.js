const pool = require('../config/database');

class EncuestaService {
  async create(encuestaData, usuario_id) {
    const { puntuacion, comentario } = encuestaData;
    const score = Number(puntuacion);

    if (Number.isNaN(score) || score < 0 || score > 10) {
      throw new Error('Puntuación inválida. Debe ser un número entre 0 y 10.');
    }

    const [result] = await pool.execute(
      `INSERT INTO ENCUESTA (usuario_id, puntuacion, comentario, fecha)
       VALUES (?, ?, ?, UTC_TIMESTAMP())`,
      [usuario_id, score, comentario || null]
    );

    return {
      id: result.insertId,
      usuario_id,
      puntuacion: score,
      comentario: comentario || null,
      fecha: new Date().toISOString()
    };
  }
}

module.exports = new EncuestaService();
