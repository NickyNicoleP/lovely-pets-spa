const pool = require('../config/database');

class ServicioService {
  async getAll() {
    const [servicios] = await pool.execute(
      `SELECT s.id, s.nombre, s.descripcion, s.duracion_min, s.precio_base, s.tiempo_limpieza_min, s.ajuste_raza_pct
       FROM SERVICIO s
       JOIN (
         SELECT nombre, MIN(precio_base) AS precio_base
         FROM SERVICIO
         GROUP BY nombre
       ) m ON s.nombre = m.nombre AND s.precio_base = m.precio_base
       ORDER BY s.nombre`
    );
    return servicios;
  }
  
  async getById(id) {
    const [servicios] = await pool.execute(
      'SELECT * FROM SERVICIO WHERE id = ?',
      [id]
    );
    if (servicios.length === 0) {
      throw new Error('Servicio no encontrado');
    }
    return servicios[0];
  }
  
  async create(servicioData) {
    const { nombre, descripcion, duracion_min, precio_base, tiempo_limpieza_min, ajuste_raza_pct } = servicioData;
    
    const [result] = await pool.execute(
      `INSERT INTO SERVICIO (nombre, descripcion, duracion_min, precio_base, tiempo_limpieza_min, ajuste_raza_pct) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion, duracion_min || 30, precio_base || 0, tiempo_limpieza_min || 15, ajuste_raza_pct || 0]
    );
    
    return this.getById(result.insertId);
  }
  
  async update(id, servicioData) {
    const { nombre, descripcion, duracion_min, precio_base, tiempo_limpieza_min, ajuste_raza_pct } = servicioData;
    
    await pool.execute(
      `UPDATE SERVICIO SET nombre = ?, descripcion = ?, duracion_min = ?, precio_base = ?, tiempo_limpieza_min = ?, ajuste_raza_pct = ? 
       WHERE id = ?`,
      [nombre, descripcion, duracion_min || 30, precio_base || 0, tiempo_limpieza_min || 15, ajuste_raza_pct || 0, id]
    );
    
    return this.getById(id);
  }
  
  async delete(id) {
    await pool.execute('DELETE FROM SERVICIO WHERE id = ?', [id]);
    
    return { message: 'Servicio eliminado correctamente' };
  }
}

module.exports = new ServicioService();