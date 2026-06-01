const pool = require('../config/database');
const notificacionService = require('./notificacionService');

class InventarioService {
  async getAll(filters = {}) {
    let query = `
      SELECT mi.*, p.nombre as producto_nombre, p.stock as stock_actual, p.umbral_alerta as stock_minimo
      FROM movimiento_inventario mi
      JOIN PRODUCTO p ON mi.producto_id = p.id
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
      query += ' AND DATE(mi.fecha) >= ?';
      params.push(filters.fecha_inicio);
    }
    
    if (filters.fecha_fin) {
      query += ' AND DATE(mi.fecha) <= ?';
      params.push(filters.fecha_fin);
    }
    
    query += ' ORDER BY mi.fecha DESC';
    
    const [movimientos] = await pool.execute(query, params);
    return movimientos;
  }
  
  async getById(id) {
    const [movimientos] = await pool.execute(
      'SELECT mi.*, p.nombre as producto_nombre FROM movimiento_inventario mi JOIN PRODUCTO p ON mi.producto_id = p.id WHERE mi.id = ?',
      [id]
    );

    if (movimientos.length === 0) {
      throw new Error('Movimiento no encontrado');
    }

    return movimientos[0];
  }
  
  async create(movimientoData, userId) {
    const { producto_id, tipo, cantidad, motivo } = movimientoData;
    
    const [productRows] = await pool.execute(
      'SELECT stock, umbral_alerta, nombre FROM PRODUCTO WHERE id = ?',
      [producto_id]
    );

    if (productRows.length === 0) {
      throw new Error('Producto no encontrado');
    }

    const producto = productRows[0];

    if (tipo === 'salida' && producto.stock < cantidad) {
      throw new Error('Stock insuficiente');
    }
    
    const [result] = await pool.execute(
      `INSERT INTO movimiento_inventario (producto_id, tipo, cantidad, origen, referencia_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [producto_id, tipo, cantidad, motivo || 'Manual', userId || null]
    );
    
    // Actualizar stock del producto
    const cambioStock = tipo === 'entrada' ? cantidad : -cantidad;
    const newStock = producto.stock + cambioStock;
    await pool.execute(
      'UPDATE PRODUCTO SET stock = stock + ? WHERE id = ?',
      [cambioStock, producto_id]
    );

    if (
      tipo === 'salida' &&
      producto.stock > producto.umbral_alerta &&
      newStock <= producto.umbral_alerta
    ) {
      const notificacionService = require('./notificacionService');
      await notificacionService.createNotificationsForRoles(
        ['admin', 'administrador'],
        'inventario',
        'app',
        `Stock bajo: ${producto.nombre}`,
        `El producto ${producto.nombre} quedó con stock bajo: ${newStock} unidades tras registro de movimiento.`,
        'stock_alert',
        { productoId: producto_id, stock: newStock }
      );
    }
    
    return this.getById(result.insertId);
  }
}

module.exports = new InventarioService();