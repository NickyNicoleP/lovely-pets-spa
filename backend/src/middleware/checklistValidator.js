/**
 * Validador de Checklist para Ficha de Grooming
 * Asegura que se completen todos los ítems obligatorios antes de cerrar la ficha
 */

const pool = require('../config/database');

/**
 * Items obligatorios del checklist
 */
const REQUIRED_CHECKLIST_ITEMS = [
  {
    id: 'baño',
    nombre: 'Baño',
    descripcion: 'Baño completado',
    required: true
  },
  {
    id: 'secado',
    nombre: 'Secado',
    descripcion: 'Secado completado',
    required: true
  },
  {
    id: 'corte',
    nombre: 'Corte',
    descripcion: 'Corte completado (si aplica)',
    required: true
  },
  {
    id: 'limpieza_oidos',
    nombre: 'Limpieza de Oídos',
    descripcion: 'Oídos limpios',
    required: true
  },
  {
    id: 'corte_unas',
    nombre: 'Corte de Uñas',
    descripcion: 'Uñas cortadas',
    required: true
  },
  {
    id: 'foto_antes',
    nombre: 'Foto Antes',
    descripcion: 'Foto del estado inicial',
    required: true
  },
  {
    id: 'foto_despues',
    nombre: 'Foto Después',
    descripcion: 'Foto del resultado final',
    required: true
  },
  {
    id: 'notas_groomer',
    nombre: 'Notas del Groomer',
    descripcion: 'Observaciones y notas completadas',
    required: true
  },
  {
    id: 'firma_cliente',
    nombre: 'Firma/Aprobación del Cliente',
    descripcion: 'Cliente ha revisado y aprobado',
    required: true
  }
];

/**
 * Obtiene el checklist de una ficha de grooming
 */
async function getChecklistByFichaId(fichaId) {
  const [rows] = await pool.execute(
    `SELECT * FROM FICHA_GROOMING_CHECKLIST WHERE ficha_grooming_id = ? ORDER BY created_at`,
    [fichaId]
  );
  return rows || [];
}

/**
 * Valida que todos los ítems obligatorios estén completados
 * @param {number} fichaId - ID de la ficha de grooming
 * @returns {object} { isValid: boolean, missingItems: array, checklist: array }
 */
async function validateChecklistCompletion(fichaId) {
  const checklist = await getChecklistByFichaId(fichaId);
  
  const missingItems = [];
  const completedItems = {};

  // Mapear ítems completados
  checklist.forEach(item => {
    if (item.completed) {
      completedItems[item.item_key] = true;
    }
  });

  // Verificar ítems obligatorios
  REQUIRED_CHECKLIST_ITEMS.forEach(requiredItem => {
    if (requiredItem.required && !completedItems[requiredItem.id]) {
      missingItems.push(requiredItem);
    }
  });

  return {
    isValid: missingItems.length === 0,
    missingItems,
    checklist,
    totalRequired: REQUIRED_CHECKLIST_ITEMS.length,
    totalCompleted: checklist.filter(c => c.completed).length
  };
}

/**
 * Middleware: Valida checklist antes de cerrar ficha
 */
const validateChecklistBeforeClose = async (req, res, next) => {
  const fichaId = req.params.id;

  if (!fichaId) {
    return res.status(400).json({ error: 'ID de ficha requerido' });
  }

  try {
    const validation = await validateChecklistCompletion(fichaId);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'No se puede cerrar la ficha. Ítems del checklist pendientes:',
        missingItems: validation.missingItems,
        completed: `${validation.totalCompleted}/${validation.totalRequired}`,
        statusCode: 'CHECKLIST_INCOMPLETE'
      });
    }

    // Pasar resultado de validación al siguiente middleware
    req.checklistValidation = validation;
    next();
  } catch (error) {
    console.error('[CHECKLIST] Error validando checklist:', error);
    res.status(500).json({ error: 'Error validando checklist' });
  }
};

/**
 * Agrega ítem al checklist de una ficha
 */
async function addChecklistItem(fichaId, itemKey, itemNombre, completed = false) {
  const [result] = await pool.execute(
    `INSERT INTO FICHA_GROOMING_CHECKLIST (ficha_grooming_id, item_key, item_nombre, completed, created_at)
     VALUES (?, ?, ?, ?, NOW())`,
    [fichaId, itemKey, itemNombre, completed ? 1 : 0]
  );
  return result;
}

/**
 * Actualiza estado de ítem del checklist
 */
async function updateChecklistItem(fichaId, itemKey, completed) {
  const [result] = await pool.execute(
    `UPDATE FICHA_GROOMING_CHECKLIST 
     SET completed = ?, updated_at = NOW()
     WHERE ficha_grooming_id = ? AND item_key = ?`,
    [completed ? 1 : 0, fichaId, itemKey]
  );
  return result;
}

/**
 * Obtiene resumen de estado del checklist
 */
async function getChecklistSummary(fichaId) {
  const validation = await validateChecklistCompletion(fichaId);
  return {
    fichaId,
    totalItems: validation.totalRequired,
    completedItems: validation.totalCompleted,
    percentage: Math.round((validation.totalCompleted / validation.totalRequired) * 100),
    isComplete: validation.isValid,
    pendingItems: validation.missingItems
  };
}

module.exports = {
  REQUIRED_CHECKLIST_ITEMS,
  validateChecklistCompletion,
  validateChecklistBeforeClose,
  getChecklistByFichaId,
  addChecklistItem,
  updateChecklistItem,
  getChecklistSummary
};
