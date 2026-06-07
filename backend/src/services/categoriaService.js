const pool = require('../config/database');

class CategoriaService {
  async getAll() {
    const [categorias] = await pool.execute(
      'SELECT id, nombre, descripcion FROM CATEGORIA ORDER BY nombre'
    );
    return categorias;
  }
}

module.exports = new CategoriaService();
