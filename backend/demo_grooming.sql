-- Demo data para Módulo de Grooming
-- Ejecutar con: mysql -u <usuario> -p pawspa_db < backend/demo_grooming.sql

USE pawspa_db;

-- 1) Crear usuario groomer (si no existe)
INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, direccion, activo)
SELECT 'Mariana', 'González', 'mariana.groomer@demo.com', 'demo-hash', 'empleado', '70000000', 'Sucursal Demo', TRUE
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM USUARIO WHERE email = 'mariana.groomer@demo.com');

-- 2) Crear registro en GROOMER vinculado al usuario
INSERT INTO GROOMER (usuario_id, ci, direccion, especialidades, turno, disponibilidad_semanal, activo)
SELECT u.id, 'V-1234567', 'Sucursal Demo', 'baño,corte,manicura', 'mañana', JSON_ARRAY(), TRUE
FROM USUARIO u
WHERE u.email = 'mariana.groomer@demo.com' AND NOT EXISTS (SELECT 1 FROM GROOMER g WHERE g.usuario_id = u.id);

-- 3) Crear cliente demo
INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, direccion, activo)
SELECT 'Carlos', 'Ramírez', 'carlos.cliente@demo.com', 'demo-hash', 'cliente', '70001111', 'Dirección demo', TRUE
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM USUARIO WHERE email = 'carlos.cliente@demo.com');

INSERT INTO CLIENTE (usuario_id, ci, direccion, preferencias, nivel_fidelidad, puntos_acumulados)
SELECT u.id, 'V-7654321', 'Casa cliente demo', JSON_OBJECT(), 'normal', 0
FROM USUARIO u
WHERE u.email = 'carlos.cliente@demo.com' AND NOT EXISTS (SELECT 1 FROM CLIENTE WHERE usuario_id = u.id);

-- 4) Crear mascota
INSERT INTO MASCOTA (cliente_id, nombre, especie, raza, edad, peso, temperamento)
SELECT c.id, 'Kira', 'Perro', 'Labrador', 4, 18.5, 'calmo'
FROM CLIENTE c JOIN USUARIO u ON c.usuario_id = u.id
WHERE u.email = 'carlos.cliente@demo.com' AND NOT EXISTS (SELECT 1 FROM MASCOTA m WHERE m.cliente_id = c.id AND m.nombre = 'Kira');

-- 5) Asegurar servicios básicos (Baño, Corte)
INSERT INTO SERVICIO (nombre, descripcion, precio_base, duracion_min, tiempo_limpieza_min, ajuste_raza_pct, allow_double_booking, categoria)
SELECT 'Baño Completo', 'Baño con shampoo y secado', 45.00, 45, 15, 0, FALSE, 'grooming' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM SERVICIO WHERE nombre = 'Baño Completo');

INSERT INTO SERVICIO (nombre, descripcion, precio_base, duracion_min, tiempo_limpieza_min, ajuste_raza_pct, allow_double_booking, categoria)
SELECT 'Corte de Pelo', 'Corte y estilizado', 50.00, 60, 15, 0, FALSE, 'grooming' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM SERVICIO WHERE nombre = 'Corte de Pelo');

-- 6) Crear citas (SLOT_RESERVA) para la fecha de demostración (hoy y mañana)
SET @fecha_hoy = CURDATE();
SET @hora1 = CONCAT(@fecha_hoy, ' 09:30:00');
SET @hora2 = CONCAT(@fecha_hoy, ' 11:00:00');

-- Obtener ids necesarios
SET @groomer_id = (SELECT g.id FROM GROOMER g JOIN USUARIO u ON g.usuario_id = u.id WHERE u.email = 'mariana.groomer@demo.com' LIMIT 1);
SET @cliente_id = (SELECT c.id FROM CLIENTE c JOIN USUARIO u ON c.usuario_id = u.id WHERE u.email = 'carlos.cliente@demo.com' LIMIT 1);
SET @mascota_id = (SELECT m.id FROM MASCOTA m WHERE m.cliente_id = @cliente_id LIMIT 1);
SET @serv_bano = (SELECT id FROM SERVICIO WHERE nombre = 'Baño Completo' LIMIT 1);
SET @serv_corte = (SELECT id FROM SERVICIO WHERE nombre = 'Corte de Pelo' LIMIT 1);

-- Insertar reserva 1
INSERT INTO SLOT_RESERVA (groomer_id, mascota_id, servicio_id, fecha_hora, fecha_hora_fin, estado, precio_final, canal_reserva, created_at)
SELECT @groomer_id, @mascota_id, @serv_bano, @hora1, DATE_ADD(@hora1, INTERVAL 45 MINUTE), 'confirmada', 45.00, 'web', NOW()
FROM DUAL WHERE @groomer_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM SLOT_RESERVA sr WHERE sr.groomer_id = @groomer_id AND sr.fecha_hora = @hora1
);

-- Insertar reserva 2
INSERT INTO SLOT_RESERVA (groomer_id, mascota_id, servicio_id, fecha_hora, fecha_hora_fin, estado, precio_final, canal_reserva, created_at)
SELECT @groomer_id, @mascota_id, @serv_corte, @hora2, DATE_ADD(@hora2, INTERVAL 60 MINUTE), 'pendiente', 50.00, 'whatsapp', NOW()
FROM DUAL WHERE @groomer_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM SLOT_RESERVA sr WHERE sr.groomer_id = @groomer_id AND sr.fecha_hora = @hora2
);

-- 7) Crear ficha de grooming para la reserva confirmada (si no existe)
SET @reserva_id = (SELECT id FROM SLOT_RESERVA WHERE fecha_hora = @hora1 AND groomer_id = @groomer_id LIMIT 1);
INSERT INTO FICHA_GROOMING (reserva_id, estado_ingreso, nudos, pulgas, heridas, tiempo_real_min, observaciones)
SELECT @reserva_id, 'Nudos leves, sin heridas', FALSE, FALSE, FALSE, NULL, 'Ficha de demo - ingreso' FROM DUAL
WHERE @reserva_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM FICHA_GROOMING fg WHERE fg.reserva_id = @reserva_id);

-- 8) Preparar insumos de ejemplo (PRODUCTO)
INSERT INTO CATEGORIA (id, nombre, descripcion)
SELECT 9999, 'Demo Insumos', 'Categoría para insumos de demostración' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM CATEGORIA WHERE id = 9999);

INSERT INTO PRODUCTO (nombre, categoria_id, precio, stock, umbral_alerta, tipo, descripcion, activo)
SELECT 'Shampoo Demo', 9999, 2.50, 50, 5, 'insumo', 'Shampoo para demo', TRUE
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM PRODUCTO WHERE nombre = 'Shampoo Demo');

SET @producto_shampoo = (SELECT id FROM PRODUCTO WHERE nombre = 'Shampoo Demo' LIMIT 1);

-- 9) Añadir insumo usado a la ficha (ejemplo)
SET @ficha_id = (SELECT id FROM FICHA_GROOMING WHERE reserva_id = @reserva_id LIMIT 1);
INSERT INTO FICHA_INSUMO (ficha_id, producto_id, cantidad)
SELECT @ficha_id, @producto_shampoo, 1 FROM DUAL
WHERE @ficha_id IS NOT NULL AND @producto_shampoo IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM FICHA_INSUMO fi WHERE fi.ficha_id = @ficha_id AND fi.producto_id = @producto_shampoo
);

-- 10) Añadir checklist completo (marcado como realizado) para la ficha de demo
INSERT INTO CHECKLIST_ITEM (ficha_id, nombre, realizado, observacion)
SELECT @ficha_id, 'Uñas', TRUE, 'Cortadas y pulidas' FROM DUAL
WHERE @ficha_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHECKLIST_ITEM ci WHERE ci.ficha_id = @ficha_id AND ci.nombre = 'Uñas');

INSERT INTO CHECKLIST_ITEM (ficha_id, nombre, realizado, observacion)
SELECT @ficha_id, 'Oídos', TRUE, 'Limpios' FROM DUAL
WHERE @ficha_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHECKLIST_ITEM ci WHERE ci.ficha_id = @ficha_id AND ci.nombre = 'Oídos');

INSERT INTO CHECKLIST_ITEM (ficha_id, nombre, realizado, observacion)
SELECT @ficha_id, 'Glándulas', TRUE, 'Revisadas' FROM DUAL
WHERE @ficha_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHECKLIST_ITEM ci WHERE ci.ficha_id = @ficha_id AND ci.nombre = 'Glándulas');

INSERT INTO CHECKLIST_ITEM (ficha_id, nombre, realizado, observacion)
SELECT @ficha_id, 'Corte', TRUE, 'Estilizado según indicaciones' FROM DUAL
WHERE @ficha_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHECKLIST_ITEM ci WHERE ci.ficha_id = @ficha_id AND ci.nombre = 'Corte');

INSERT INTO CHECKLIST_ITEM (ficha_id, nombre, realizado, observacion)
SELECT @ficha_id, 'Baño', TRUE, 'Shampoo aplicado y enjuague' FROM DUAL
WHERE @ficha_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHECKLIST_ITEM ci WHERE ci.ficha_id = @ficha_id AND ci.nombre = 'Baño');

INSERT INTO CHECKLIST_ITEM (ficha_id, nombre, realizado, observacion)
SELECT @ficha_id, 'Perfume', TRUE, 'Aroma suave' FROM DUAL
WHERE @ficha_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM CHECKLIST_ITEM ci WHERE ci.ficha_id = @ficha_id AND ci.nombre = 'Perfume');

-- 11) Añadir fotos de evidencia (antes y después) para la ficha demo
INSERT INTO FOTO_SERVICIO (ficha_id, url, tipo)
SELECT @ficha_id, '/demo/photos/luna_antes.jpg', 'antes' FROM DUAL
WHERE @ficha_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM FOTO_SERVICIO fs WHERE fs.ficha_id = @ficha_id AND fs.tipo = 'antes');

INSERT INTO FOTO_SERVICIO (ficha_id, url, tipo)
SELECT @ficha_id, '/demo/photos/luna_despues.jpg', 'despues' FROM DUAL
WHERE @ficha_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM FOTO_SERVICIO fs WHERE fs.ficha_id = @ficha_id AND fs.tipo = 'despues');

-- Fin del script demo
SELECT 'Demo data instalada';
