const pool = require('../config/database');
const authService = require('./authService');
const notificacionService = require('./notificacionService');

class ProductoService {
  async getAll() {
    const [productos] = await pool.execute(
      `SELECT p.*, c.nombre as categoria_nombre, c.descripcion as categoria_descripcion,
              (SELECT url_imagen FROM FOTO_PRODUCTO fp WHERE fp.producto_id = p.id AND fp.es_principal = TRUE LIMIT 1) AS imagen
       FROM PRODUCTO p
       LEFT JOIN CATEGORIA c ON p.categoria_id = c.id
       WHERE p.activo = TRUE
       ORDER BY p.nombre`
    );
    return productos;
  }
  
  async getById(id) {
    const [productos] = await pool.execute(
      `SELECT p.*, c.nombre as categoria_nombre, c.descripcion as categoria_descripcion,
              (SELECT url_imagen FROM FOTO_PRODUCTO fp WHERE fp.producto_id = p.id AND fp.es_principal = TRUE LIMIT 1) AS imagen
       FROM PRODUCTO p
       LEFT JOIN CATEGORIA c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [id]
    );
    if (productos.length === 0) {
      throw new Error('Producto no encontrado');
    }
    return productos[0];
  }
  
  async create(productoData, userId) {
    const { nombre, categoria_id, descripcion, precio, stock, umbral_alerta, tipo } = productoData;
    
    const [result] = await pool.execute(
      `INSERT INTO PRODUCTO (nombre, categoria_id, descripcion, precio, stock, umbral_alerta, tipo, activo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [nombre, categoria_id || 1, descripcion || null, precio || 0, stock || 0, umbral_alerta || 5, tipo || 'venta']
    );
    
    // Registrar movimiento de inventario inicial
    if (stock > 0) {
      await pool.execute(
        `INSERT INTO MOVIMIENTO_INVENTARIO (producto_id, tipo, cantidad, origen, referencia_id) 
         VALUES (?, 'entrada', ?, ?, ?)`,
        [result.insertId, stock, 'Stock inicial', userId ?? null]
      );
    }
    
    await authService.registrarAudit(userId, null, null, null, 'crear_producto', productoData);
    
    return this.getById(result.insertId);
  }
  
  async update(id, productoData, userId) {
    const productoAnterior = await this.getById(id);
    
    const { nombre, categoria_id, descripcion, precio, stock, umbral_alerta, tipo, activo } = productoData;
    
    await pool.execute(
      `UPDATE PRODUCTO SET nombre = ?, categoria_id = ?, descripcion = ?, precio = ?, stock = ?, umbral_alerta = ?, tipo = ?, activo = ? 
       WHERE id = ?`,
      [nombre, categoria_id || 1, descripcion || null, precio || 0, stock || 0, umbral_alerta || 5, tipo || 'venta', activo ?? true, id]
    );
    
    await authService.registrarAudit(userId, null, null, null, 'actualizar_producto', { anterior: productoAnterior, nuevo: productoData });
    
    const updatedProduct = await this.getById(id);

    if (
      productoAnterior.stock > productoAnterior.umbral_alerta &&
      updatedProduct.stock <= updatedProduct.umbral_alerta
    ) {
      await notificacionService.createNotificationsForRoles(
        ['admin', 'administrador'],
        'inventario',
        'app',
        `Stock bajo: ${updatedProduct.nombre}`,
        `El producto ${updatedProduct.nombre} tiene stock bajo: ${updatedProduct.stock} unidades.`,
        'stock_alert',
        { productoId: updatedProduct.id, stock: updatedProduct.stock }
      );
    }

    return updatedProduct;
  }
  
  async delete(id, userId) {
    await pool.execute('UPDATE PRODUCTO SET activo = FALSE WHERE id = ?', [id]);
    
    await authService.registrarAudit(userId ?? null, null, null, null, 'eliminar_producto', { id });
    
    return { message: 'Producto eliminado correctamente' };
  }
  
  async getLowStock() {
    const [productos] = await pool.execute(
      'SELECT * FROM PRODUCTO WHERE activo = TRUE AND stock <= umbral_alerta ORDER BY stock'
    );
    return productos;
  }

  /**
   * Agregar imagen a un producto
   */
  async agregarImagen(productoId, rutaArchivo, urlImagen, descripcion = null, esPrincipal = false) {
    // Si es principal, desmarcar otros como principales
    if (esPrincipal) {
      await pool.execute(
        'UPDATE FOTO_PRODUCTO SET es_principal = FALSE WHERE producto_id = ?',
        [productoId]
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO FOTO_PRODUCTO (producto_id, ruta_archivo, url_imagen, descripcion, es_principal) 
       VALUES (?, ?, ?, ?, ?)`,
      [productoId, rutaArchivo, urlImagen, descripcion, esPrincipal]
    );

    return result.insertId;
  }

  /**
   * Obtener imágenes de un producto
   */
  async obtenerImagenes(productoId) {
    const [imagenes] = await pool.execute(
      'SELECT * FROM FOTO_PRODUCTO WHERE producto_id = ? ORDER BY es_principal DESC, creado_en DESC',
      [productoId]
    );
    return imagenes;
  }

  /**
   * Obtener imagen principal de un producto
   */
  async obtenerImagenPrincipal(productoId) {
    const [imagenes] = await pool.execute(
      'SELECT * FROM FOTO_PRODUCTO WHERE producto_id = ? AND es_principal = TRUE LIMIT 1',
      [productoId]
    );
    return imagenes.length > 0 ? imagenes[0] : null;
  }

  /**
   * Eliminar imagen de un producto
   */
  async eliminarImagen(imagenId, productoId = null) {
    const [imagen] = await pool.execute(
      'SELECT * FROM FOTO_PRODUCTO WHERE id = ?',
      [imagenId]
    );

    if (imagen.length === 0) {
      throw new Error('Imagen no encontrada');
    }

    await pool.execute(
      'DELETE FROM FOTO_PRODUCTO WHERE id = ?',
      [imagenId]
    );

    return { message: 'Imagen eliminada correctamente' };
  }

  /**
   * Actualizar imagen principal
   */
  async establecerImagenPrincipal(imagenId) {
    const [imagen] = await pool.execute(
      'SELECT * FROM FOTO_PRODUCTO WHERE id = ?',
      [imagenId]
    );

    if (imagen.length === 0) {
      throw new Error('Imagen no encontrada');
    }

    const productoId = imagen[0].producto_id;

    // Desmarcar otros como principales
    await pool.execute(
      'UPDATE FOTO_PRODUCTO SET es_principal = FALSE WHERE producto_id = ?',
      [productoId]
    );

    // Marcar este como principal
    await pool.execute(
      'UPDATE FOTO_PRODUCTO SET es_principal = TRUE WHERE id = ?',
      [imagenId]
    );

    return { message: 'Imagen establecida como principal' };
  }
}

module.exports = new ProductoService();