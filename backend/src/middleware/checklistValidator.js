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
    id: 'Baño',
    nombre: 'Baño',
    descripcion: 'Baño completado',
    required: true
  },
  {
    id: 'Secado',
    nombre: 'Secado',
    descripcion: 'Secado completado',
    required: true
  },
  {
    id: 'Corte',
    nombre: 'Corte',
    descripcion: 'Corte completado (si aplica)',
    required: true
  },
  {
    id: 'Limpieza de Oídos',
    nombre: 'Limpieza de Oídos',
    descripcion: 'Oídos limpios',
    required: true
  },
  {
    id: 'Corte de Uñas',
    nombre: 'Corte de Uñas',
    descripcion: 'Uñas cortadas',
    required: true
  },
  {
    id: 'Foto Antes',
    nombre: 'Foto Antes',
    descripcion: 'Foto del estado inicial',
    required: true
  },
  {
    id: 'Foto Después',
    nombre: 'Foto Después',
    descripcion: 'Foto del resultado final',
    required: true
  },
  {
    id: 'Notas del Groomer',
    nombre: 'Notas del Groomer',
    descripcion: 'Observaciones y notas completadas',
    required: true
  },
  {
    id: 'Firma/Aprobación del Cliente',
    nombre: 'Firma/Aprobación del Cliente',
    descripcion: 'Cliente ha revisado y aprobado',
    required: true
  }
];

async function getChecklistByFichaId(fichaId) {
  const [rows] = await pool.execute(
    `SELECT * FROM CHECKLIST_ITEM WHERE ficha_id = ? ORDER BY id`,
    [fichaId]
  );
  return rows || [];
}

function normalizeChecklistName(name) {
  return String(name || '').trim().toLowerCase();
}

async function validateChecklistCompletion(fichaId) {
  const checklist = await getChecklistByFichaId(fichaId);
  const completedItems = new Set();

  checklist.forEach((item) => {
    if (item.realizado) {
      completedItems.add(normalizeChecklistName(item.nombre));
    }
  });

  const missingItems = REQUIRED_CHECKLIST_ITEMS.filter((requiredItem) => {
    return requiredItem.required && !completedItems.has(normalizeChecklistName(requiredItem.nombre));
  });

  return {
    isValid: missingItems.length === 0,
    missingItems,
    checklist,
    totalRequired: REQUIRED_CHECKLIST_ITEMS.length,
    totalCompleted: checklist.filter((c) => c.realizado).length
  };
}

const validateChecklistBeforeClose = async (req, res, next) => {
  const fichaId = req.params.id;

  if (!fichaId) {
    return res.status(400).json({ error: 'ID de ficha requerido' });
  }

  try {
    const validation = await validateChecklistCompletion(fichaId);

    if (!validation.isValid) {
      return res.status(422).json({
        error: 'No se puede cerrar la ficha. Ítems del checklist pendientes.',
        missingItems: validation.missingItems,
        completed: `${validation.totalCompleted}/${validation.totalRequired}`,
        statusCode: 'CHECKLIST_INCOMPLETE'
      });
    }

    req.checklistValidation = validation;
    next();
  } catch (error) {
    console.error('[CHECKLIST] Error validando checklist:', error);
    res.status(500).json({ error: 'Error validando checklist' });
  }
};

async function addChecklistItem(fichaId, nombre, realizado = false, observacion = null) {
  const [result] = await pool.execute(
    `INSERT INTO CHECKLIST_ITEM (ficha_id, nombre, realizado, observacion) VALUES (?, ?, ?, ?)`,
    [fichaId, nombre, realizado ? 1 : 0, observacion]
  );
  return result;
}

async function updateChecklistItem(fichaId, nombre, realizado) {
  const [result] = await pool.execute(
    `UPDATE CHECKLIST_ITEM SET realizado = ?, observacion = NULL WHERE ficha_id = ? AND nombre = ?`,
    [realizado ? 1 : 0, fichaId, nombre]
  );
  return result;
}

async function getChecklistSummary(fichaId) {
  const validation = await validateChecklistCompletion(fichaId);
  return {
    fichaId,
    totalItems: validation.totalRequired,
    completedItems: validation.totalCompleted,
    percentage: validation.totalRequired > 0 ? Math.round((validation.totalCompleted / validation.totalRequired) * 100) : 0,
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
