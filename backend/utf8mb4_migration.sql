-- Migración de base de datos a utf8mb4 y correcciones de texto mojibake.
-- Ejecutar con: mysql --default-character-set=utf8mb4 -u <usuario> -p < backend/utf8mb4_migration.sql

USE pawspa_db;

-- Asegurar que la base de datos use utf8mb4 por defecto.
ALTER DATABASE pawspa_db CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Convertir todas las tablas existentes a utf8mb4.
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE USUARIO CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE CLIENTE CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE GROOMER CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE VETERINARIO CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE MASCOTA CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE SERVICIO CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE RAZA_AJUSTE CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE SLOT_RESERVA CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE FICHA_GROOMING CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE CHECKLIST_ITEM CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE FOTO_SERVICIO CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE CATEGORIA CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE PRODUCTO CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE VARIANTE_PRODUCTO CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE FICHA_INSUMO CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE CARRITO_PEDIDO CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE PAGO_FACTURA CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 1;

-- Corregir textos conocidos con mojibake en la base de datos.
UPDATE SERVICIO
SET nombre = REPLACE(nombre, 'Ba├▒o', 'Baño')
WHERE nombre LIKE '%Ba├▒o%';

UPDATE SERVICIO
SET descripcion = REPLACE(descripcion, 'Ba├▒o', 'Baño')
WHERE descripcion LIKE '%Ba├▒o%';

UPDATE SERVICIO
SET descripcion = REPLACE(descripcion, 'u├▒as', 'uñas')
WHERE descripcion LIKE '%u├▒as%';

UPDATE SERVICIO
SET nombre = REPLACE(nombre, 'Desparasitaci├│n', 'Desparasitación')
WHERE nombre LIKE '%Desparasitaci├│n%';

UPDATE SERVICIO
SET descripcion = REPLACE(descripcion, 'Desparasitaci├│n', 'Desparasitación')
WHERE descripcion LIKE '%Desparasitaci├│n%';

UPDATE PRODUCTO
SET nombre = REPLACE(nombre, 'Ba├▒o', 'Baño')
WHERE nombre LIKE '%Ba├▒o%';

UPDATE PRODUCTO
SET descripcion = REPLACE(descripcion, 'Ba├▒o', 'Baño')
WHERE descripcion LIKE '%Ba├▒o%';

UPDATE PRODUCTO
SET descripcion = REPLACE(descripcion, 'u├▒as', 'uñas')
WHERE descripcion LIKE '%u├▒as%';

UPDATE PRODUCTO
SET descripcion = REPLACE(descripcion, 'Desparasitaci├│n', 'Desparasitación')
WHERE descripcion LIKE '%Desparasitaci├│n%';

UPDATE CATEGORIA
SET nombre = REPLACE(nombre, 'Ba├▒o', 'Baño')
WHERE nombre LIKE '%Ba├▒o%';

UPDATE CATEGORIA
SET descripcion = REPLACE(descripcion, 'Ba├▒o', 'Baño')
WHERE descripcion LIKE '%Ba├▒o%';

-- Verificación: listar filas que aún contienen patrones comunes de mojibake.
SELECT 'Revisar _Ba├▒o_' AS chequeo, nombre, descripcion FROM SERVICIO WHERE nombre LIKE '%Ba├▒o%' OR descripcion LIKE '%Ba├▒o%';
SELECT 'Revisar _u├▒as_' AS chequeo, nombre, descripcion FROM SERVICIO WHERE nombre LIKE '%u├▒as%' OR descripcion LIKE '%u├▒as%';
SELECT 'Revisar _Desparasitaci├│n_' AS chequeo, nombre, descripcion FROM SERVICIO WHERE nombre LIKE '%Desparasitaci├│n%' OR descripcion LIKE '%Desparasitaci├│n%';
