const pool = require('../config/database');

class InventarioService {
  async getAll(filters = {}) {
    let query = `
      SELECT mi.*, p.nombre as producto_nombre, p.stock as stock_actual, p.stock_minimo,
             u.nombre as usuario_nombre
      FROM movimiento_inventario mi
      JOIN PRODUCTO p ON mi.producto_id = p.id
      LEFT JOIN USUARIO u ON mi.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.producto_id) {
      query += ' AND mi.producto_id = ?';
      params.push(filters.producto_id);
    }
    
    if (filters.tipo) {
      query += ' AND mi.tipo = ?';
      params.push(filters.tipo);
    }
    
    if (filters.fecha_inicio) {
      query += ' AND DATE(mi.created_at) >= ?';
      params.push(filters.fecha_inicio);
    }
    
    if (filters.fecha_fin) {
      query += ' AND DATE(mi.created_at) <= ?';
      params.push(filters.fecha_fin);
    }
    
    query += ' ORDER BY mi.created_at DESC';
    
    const [movimientos] = await pool.execute(query, params);
    return movimientos;
  }
  
  async create(movimientoData, userId) {
    const { producto_id, tipo, cantidad, motivo } = movimientoData;
    
    // Verificar stock para salidas
    if (tipo === 'salida') {
      const [productos] = await pool.execute(
        'SELECT stock FROM PRODUCTO WHERE id = ?',
        [producto_id]
      );
      
      if (productos.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      if (productos[0].stock < cantidad) {
        throw new Error('Stock insuficiente');
      }
    }
    
    const [result] = await pool.execute(
      `INSERT INTO movimiento_inventario (producto_id, tipo, cantidad, motivo, usuario_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [producto_id, tipo, cantidad, motivo, userId]
    );
    
    // Actualizar stock del producto
    const cambioStock = tipo === 'entrada' ? cantidad : -cantidad;
    await pool.execute(
      'UPDATE PRODUCTO SET stock = stock + ? WHERE id = ?',
      [cambioStock, producto_id]
    );
    
    return this.getById(result.insertId);
  }
  
  async getById(id) {
    const [movimientos] = await pool.execute(
      `SELECT mi.*, p.nombre as producto_nombre, u.nombre as usuario_nombre
       FROM movimiento_inventario mi
       JOIN PRODUCTO p ON mi.producto_id = p.id
       LEFT JOIN USUARIO u ON mi.usuario_id = u.id
       WHERE mi.id = ?`,
      [id]
    );
    
    if (movimientos.length === 0) {
      throw new Error('Movimiento no encontrado');
    }
    
    return movimientos[0];
  }
}

module.exports = new InventarioService();