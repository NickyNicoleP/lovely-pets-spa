const fichaGroomingService = require('../services/fichaGroomingService');
const notificacionService = require('../services/notificacionService');
const { getWhatsAppService } = require('../services/whatsappService');
const checklistValidator = require('../middleware/checklistValidator');
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { emitToUser } = require('../socket');

exports.getAll = async (req, res) => {
  try {
    const filters = {
      estado: req.query.estado,
      fecha: req.query.fecha
    };
    const fichas = await fichaGroomingService.getAll(filters);
    res.json(fichas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const ficha = await fichaGroomingService.getById(req.params.id);
    res.json(ficha);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ficha = await fichaGroomingService.create(req.body, userId);
    res.status(201).json(ficha);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addInsumo = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const responsable = req.user ? req.user.nombre : null;
    const result = await fichaGroomingService.addInsumo(req.params.id, { ...req.body, responsable }, userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateInsumo = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const { id: fichaId, insumoId } = req.params;
    const { estado, responsable } = req.body;

    const updatedInsumo = await fichaGroomingService.updateInsumo(fichaId, insumoId, { estado, responsable }, userId);
    res.json(updatedInsumo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ficha = await fichaGroomingService.update(req.params.id, req.body, userId);
    res.json(ficha);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.uploadFoto = async (req, res) => {
  try {
    const fichaId = req.params.id;
    const { tipo } = req.body;

    if (!['antes', 'despues'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de foto inválido. Debe ser antes o despues.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó archivo' });
    }

    const url = `/uploads/grooming/${req.file.filename}`;
    await pool.execute(
      'INSERT INTO FOTO_SERVICIO (ficha_id, url, tipo) VALUES (?, ?, ?)',
      [fichaId, url, tipo]
    );

    const ficha = await fichaGroomingService.getById(fichaId);
    res.json({ url, tipo, ficha });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.close = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const ficha = await fichaGroomingService.close(req.params.id, userId);

    const [usuarioRows] = await pool.execute(
      `SELECT u.id, u.nombre, u.telefono FROM FICHA_GROOMING fg
       JOIN SLOT_RESERVA sr ON fg.reserva_id = sr.id
       JOIN MASCOTA m ON sr.mascota_id = m.id
       JOIN CLIENTE c ON m.cliente_id = c.id
       JOIN USUARIO u ON c.usuario_id = u.id
       WHERE fg.id = ?`,
      [req.params.id]
    );
    const usuarioData = usuarioRows?.[0];
    if (usuarioData) {
      const { id: usuarioId, nombre: clienteName, telefono: clientePhone } = usuarioData;
      
      // In-app notification
      await notificacionService.createNotification(
        usuarioId,
        'grooming',
        'app',
        '🐾 Tu mascota está lista para recoger',
        `¡La atención de ${ficha.mascota_nombre} ha sido finalizada! Puedes recoger a tu mascota en nuestro local.`
      );
      
      // Real-time notification
      emitToUser(usuarioId, 'ficha_completada', {
        id: ficha.id,
        mascota: ficha.mascota_nombre,
        servicio: ficha.servicio_nombre,
        fecha: ficha.reserva_fecha_hora,
        estado: 'finalizada'
      });

      // WhatsApp notification
      if (clientePhone) {
        try {
          const whatsappService = await getWhatsAppService();
          if (whatsappService.isConnected) {
            await whatsappService.sendReadyForPickup(
              clientePhone,
              clienteName,
              ficha.mascota_nombre
            );
          }
        } catch (whatsappError) {
          console.log('[FICHA CLOSE] WhatsApp notification skipped:', whatsappError.message);
        }
      }

      const [lowStockProductos] = await pool.execute(
        `SELECT DISTINCT p.id, p.nombre, p.stock, p.umbral_alerta
         FROM FICHA_INSUMO fi
         JOIN PRODUCTO p ON fi.producto_id = p.id
         WHERE fi.ficha_id = ? AND p.stock <= p.umbral_alerta`,
        [req.params.id]
      );

      for (const producto of lowStockProductos) {
        await notificacionService.createNotificationsForRoles(
          ['admin', 'administrador'],
          'inventario',
          'app',
          `Stock bajo tras grooming: ${producto.nombre}`,
          `El producto ${producto.nombre} quedó con stock bajo: ${producto.stock} unidades tras cerrar la ficha.`,
          'stock_alert',
          { productoId: producto.id, stock: producto.stock }
        );
      }
    }

    res.json(ficha);
  } catch (error) {
    const status = error.statusCode === 'CHECKLIST_INCOMPLETE' ? 422 : 400;
    res.status(status).json({ error: error.message });
  }
};

exports.getEstadisticas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const stats = await fichaGroomingService.getEstadisticas(fecha_inicio, fecha_fin);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ SEGURIDAD: Obtener checklist de la ficha
exports.getChecklist = async (req, res) => {
  try {
    const fichaId = req.params.id;
    const checklistSummary = await checklistValidator.getChecklistSummary(fichaId);
    res.json(checklistSummary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ SEGURIDAD: Actualizar ítem del checklist
exports.updateChecklistItem = async (req, res) => {
  try {
    const { id: fichaId, itemKey } = req.params;
    const { completed } = req.body;
    const userId = req.user.id;

    if (completed === undefined) {
      return res.status(400).json({ error: 'Estado del ítem (completed) es requerido' });
    }

    // Actualizar ítem
    await checklistValidator.updateChecklistItem(fichaId, itemKey, completed);

    // Obtener resumen actualizado
    const checklistSummary = await checklistValidator.getChecklistSummary(fichaId);

    // Registrar en auditoría
    console.log(`[CHECKLIST] Usuario ${userId} actualizó ítem ${itemKey} en ficha ${fichaId} a ${completed}`);

    res.json({
      message: 'Ítem del checklist actualizado',
      itemKey,
      completed,
      checklistSummary
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};