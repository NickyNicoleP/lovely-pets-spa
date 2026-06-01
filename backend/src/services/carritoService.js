const pool = require('../config/database');
const authService = require('./authService');
const notificacionService = require('./notificacionService');
const productoService = require('./productoService');

class CarritoService {
  async getClienteIdForUser(userId) {
    const [clientes] = await pool.execute(
      'SELECT id FROM CLIENTE WHERE usuario_id = ?',
      [userId]
    );

    if (clientes.length === 0) {
      throw new Error('No se encontró el cliente asociado al usuario');
    }

    return clientes[0].id;
  }

  async getOrders(user) {
    if (user.rol === 'cliente') {
      const clienteId = await this.getClienteIdForUser(user.id);
      const [orders] = await pool.execute(
        `SELECT p.*, c.usuario_id, u.nombre AS cliente_nombre, u.apellido AS cliente_apellido
         FROM CARRITO_PEDIDO p
         JOIN CLIENTE c ON p.cliente_id = c.id
         JOIN USUARIO u ON c.usuario_id = u.id
         WHERE p.cliente_id = ?
         ORDER BY p.created_at DESC`,
        [clienteId]
      );
      return orders;
    }

    const [orders] = await pool.execute(
      `SELECT p.*, c.usuario_id, u.nombre AS cliente_nombre, u.apellido AS cliente_apellido
       FROM CARRITO_PEDIDO p
       JOIN CLIENTE c ON p.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       ORDER BY p.created_at DESC`
    );
    return orders;
  }

  async getOrderById(id, user) {
    const [orders] = await pool.execute(
      `SELECT p.*, c.usuario_id, u.nombre AS cliente_nombre, u.apellido AS cliente_apellido
       FROM CARRITO_PEDIDO p
       JOIN CLIENTE c ON p.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (orders.length === 0) {
      throw new Error('Pedido no encontrado');
    }

    const order = orders[0];

    if (user.rol === 'cliente') {
      const clienteId = await this.getClienteIdForUser(user.id);
      if (order.cliente_id !== clienteId) {
        throw new Error('No autorizado para ver este pedido');
      }
    }

    return order;
  }

  async createOrder(userId, orderData) {
    const { items, canal = 'local' } = orderData;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('El carrito debe contener al menos un producto');
    }

    const clienteId = await this.getClienteIdForUser(userId);

    const productIds = items.map((item) => item.producto_id);
    const placeholders = productIds.map(() => '?').join(',');
    const [productos] = await pool.execute(
      `SELECT id, nombre, precio, stock, umbral_alerta FROM PRODUCTO WHERE id IN (${placeholders}) AND activo = TRUE`,
      productIds
    );

    if (productos.length !== productIds.length) {
      throw new Error('Algunos productos no existen o no están disponibles');
    }

    const productMap = new Map(productos.map((product) => [product.id, product]));

    const itemsNormalized = items.map((item) => {
      const product = productMap.get(item.producto_id);
      const cantidad = Number(item.cantidad) || 0;

      if (cantidad <= 0) {
        throw new Error('La cantidad de cada producto debe ser mayor a cero');
      }

      if (product.stock < cantidad) {
        throw new Error(`Stock insuficiente para el producto ${product.nombre}`);
      }

      return {
        producto_id: product.id,
        nombre: product.nombre,
        cantidad,
        precio_unitario: Number(product.precio),
        subtotal: Number((product.precio * cantidad).toFixed(2)),
        stock: Number(product.stock),
        umbral_alerta: Number(product.umbral_alerta)
      };
    });

    const total = itemsNormalized.reduce((sum, item) => sum + item.subtotal, 0);

    const [result] = await pool.execute(
      `INSERT INTO CARRITO_PEDIDO (cliente_id, items, total, canal) VALUES (?, ?, ?, ?)`,
      [clienteId, JSON.stringify(itemsNormalized), total, canal]
    );

    const orderId = result.insertId;

    for (const item of itemsNormalized) {
      await pool.execute(
        'UPDATE PRODUCTO SET stock = stock - ? WHERE id = ?',
        [item.cantidad, item.producto_id]
      );

      const newStock = item.stock - item.cantidad;
      if (item.stock > item.umbral_alerta && newStock <= item.umbral_alerta) {
        await notificacionService.createNotificationsForRoles(
          ['admin', 'administrador'],
          'inventario',
          'app',
          `Stock bajo: ${item.nombre}`,
          `El producto ${item.nombre} quedó con stock bajo: ${newStock} unidades.`,
          'stock_alert',
          { productoId: item.producto_id, stock: newStock }
        );
      }

      await pool.execute(
        `INSERT INTO MOVIMIENTO_INVENTARIO (producto_id, tipo, cantidad, origen, referencia_id) 
         VALUES (?, 'salida', ?, 'pedido', ?)`,
        [item.producto_id, item.cantidad, orderId]
      );
    }

    const [clienteQuery] = await pool.execute(
      `SELECT u.nombre, u.apellido, u.telefono
       FROM CLIENTE c
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE c.id = ?`,
      [clienteId]
    );

    const cliente = clienteQuery[0] || {};

    const shareUrl = this.generateShareUrl(canal, cliente, itemsNormalized, total);

    await notificacionService.createNotification(
      userId,
      'pedido',
      canal === 'local' ? 'email' : canal,
      'Nuevo pedido recibido',
      `Pedido ${orderId} registrado correctamente. Total: Bs ${total.toFixed(2)}`
    );

    const order = await this.getOrderById(orderId, { rol: 'admin', id: userId });
    return { order, shareUrl };
  }

  async updateOrderStatus(id, status, user) {
    const validStatuses = ['pendiente', 'confirmado', 'entregado', 'cancelado'];
    if (!validStatuses.includes(status)) {
      throw new Error('Estado de pedido inválido');
    }

    const order = await this.getOrderById(id, user);

    await pool.execute('UPDATE CARRITO_PEDIDO SET estado = ? WHERE id = ?', [status, id]);

    await authService.registrarAudit(user.id, null, null, null, 'actualizar_pedido', { id, estado: status });

    return this.getOrderById(id, user);
  }

  generateShareUrl(canal, cliente, items, total) {
    if (!['whatsapp', 'telegram'].includes(canal)) {
      return null;
    }

    const lines = items.map((item) => `${item.nombre} x${item.cantidad} - Bs ${item.subtotal.toFixed(2)}`);
    const text = `Pedido PawSpa:\n${lines.join('\n')}\nTotal: Bs ${total.toFixed(2)}\nCliente: ${cliente.nombre || ''} ${cliente.apellido || ''}`;

    if (canal === 'whatsapp') {
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    }

    return `https://t.me/share/url?url=${encodeURIComponent('https://pawspa.example.com')}&text=${encodeURIComponent(text)}`;
  }
}

module.exports = new CarritoService();
