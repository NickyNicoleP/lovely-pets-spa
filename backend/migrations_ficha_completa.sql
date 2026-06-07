-- Migración: Expandir tabla FICHA_GROOMING con campos completos
-- Fecha: 2026-06-02

-- Agregar campos de estado de ingreso si no existen
ALTER TABLE FICHA_GROOMING 
ADD COLUMN IF NOT EXISTS suciedad_extrema BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mal_olor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS unas_largas BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recomendaciones_dueño TEXT;

-- Actualizar CHECKLIST_ITEM si es necesario (estos ya deberían existir, pero por si acaso)
-- Los items ya se crean automáticamente en _createDefaultChecklist

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_ficha_fecha_cierre ON FICHA_GROOMING(fecha_cierre);
CREATE INDEX IF NOT EXISTS idx_ficha_estado_ingreso ON FICHA_GROOMING(estado_ingreso);
