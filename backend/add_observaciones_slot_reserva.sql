-- Añade columna 'observaciones' a SLOT_RESERVA si no existe
-- Ejecutar con: mysql -u <usuario> -p pawspa_db < backend/add_observaciones_slot_reserva.sql

USE pawspa_db;

ALTER TABLE SLOT_RESERVA
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Verificar
SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'pawspa_db' AND TABLE_NAME = 'SLOT_RESERVA' AND COLUMN_NAME = 'observaciones';
