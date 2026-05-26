-- ============================================================
-- SCRIPT DE PREPARACIÓN PARA GRABACIÓN DE VIDEO DEMOSTRATIVO
-- ============================================================
-- Ejecutar en phpMyAdmin o MySQL antes de grabar

USE pawspa_db;

-- Asegurar valores de rol y tablas necesarias en caso de esquema parcial
ALTER TABLE USUARIO
  MODIFY COLUMN rol ENUM('admin', 'administrador', 'empleado', 'veterinario', 'cliente', 'groomer') NOT NULL;

CREATE TABLE IF NOT EXISTS VETERINARIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE NOT NULL,
    ci VARCHAR(20),
    direccion TEXT,
    especialidad VARCHAR(200),
    turno VARCHAR(50),
    disponibilidad_semanal JSON,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BLOQUEO_AGENDA (
    id INT PRIMARY KEY AUTO_INCREMENT,
    groomer_id INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    motivo VARCHAR(150),
    FOREIGN KEY (groomer_id) REFERENCES GROOMER(id) ON DELETE CASCADE
);

-- 1. LIMPIAR AUDITORÍA PREVIA (opcional)
DELETE FROM auditoria_log;

-- 2. LIMPIAR USUARIOS DE PRUEBA (mantener admin)
DELETE FROM USUARIO WHERE email != 'admin@pawspa.com' AND rol NOT IN ('admin', 'administrador');
DELETE FROM CLIENTE WHERE usuario_id NOT IN (SELECT id FROM USUARIO WHERE rol IN ('admin', 'administrador'));
DELETE FROM GROOMER WHERE usuario_id NOT IN (SELECT id FROM USUARIO WHERE rol = 'empleado');
DELETE FROM VETERINARIO WHERE usuario_id NOT IN (SELECT id FROM USUARIO WHERE rol = 'veterinario');

-- 3. CREAR ADMIN SI NO EXISTE
INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, email_verificado, activo, ultimo_login)
VALUES (
    'Admin',
    'PawSpa',
    'admin@pawspa.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36p4rWG', -- password: "Admin@Spa123!" (pre-hashed)
    'admin',
    '+54 911 1234567',
    '12345678',
    'Admin Address',
    TRUE,
    TRUE,
    NOW()
)
ON DUPLICATE KEY UPDATE locked_until = NULL, login_attempts = 0, email_verificado = TRUE;

-- 4. CREAR CLIENTE DE PRUEBA (opcional)
-- Si quieres un cliente preexistente para demo
INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, email_verificado, activo) 
VALUES (
    'Cliente',
    'Demo',
    'cliente@demo.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36p4rWG', -- password: "Cliente@123!" (pre-hashed)
    'cliente',
    '+54 911 2345678',
    '12345678',
    'Calle Demo 123, Buenos Aires',
    TRUE,
    TRUE
)
ON DUPLICATE KEY UPDATE locked_until = NULL, login_attempts = 0;

INSERT IGNORE INTO CLIENTE (usuario_id, ci, direccion, preferencias, nivel_fidelidad, puntos_acumulados)
SELECT id, ci, direccion, JSON_OBJECT(), 'bronze', 0
FROM USUARIO
WHERE email = 'cliente@demo.com';

-- 5. CREAR EMPLEADO GROOMER DE PRUEBA (opcional)
INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, email_verificado, activo) 
VALUES (
    'Groomer',
    'Demo',
    'groomer@demo.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36p4rWG', -- password: "Groomer@123!" (pre-hashed)
    'empleado',
    '+54 911 3456789',
    '87654321',
    'Calle Grooming 456, Buenos Aires',
    TRUE,
    TRUE
)
ON DUPLICATE KEY UPDATE locked_until = NULL, login_attempts = 0;

INSERT IGNORE INTO GROOMER (usuario_id, ci, direccion, especialidades, turno, disponibilidad_semanal, activo)
SELECT id, ci, direccion, 'corte básico', 'rotativo', '{"lunes": true, "martes": true, "miercoles": true, "jueves": true, "viernes": true, "sabado": false, "domingo": false}', TRUE
FROM USUARIO
WHERE email = 'groomer@demo.com';

-- Groomers adicionales para cubrir más disponibilidad y cambios de turno
INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, email_verificado, activo)
VALUES
    (
      'Mariana',
      'Rivas',
      'mariana.groomer@demo.com',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36p4rWG', -- password: "Groomer@123!"
      'empleado',
      '+54 911 5678901',
      '20987654',
      'Av. Mascotas 321, Buenos Aires',
      TRUE,
      TRUE
    ),
    (
      'Santiago',
      'Molina',
      'santiago.groomer@demo.com',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36p4rWG', -- password: "Groomer@123!"
      'empleado',
      '+54 911 6789012',
      '20987655',
      'Calle Peludos 789, Buenos Aires',
      TRUE,
      TRUE
    ),
    (
      'Carla',
      'Fernandez',
      'carla.groomer@demo.com',
      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36p4rWG', -- password: "Groomer@123!"
      'empleado',
      '+54 911 7890123',
      '20987656',
      'Calle Peluda 101, Buenos Aires',
      TRUE,
      TRUE
    )
ON DUPLICATE KEY UPDATE locked_until = NULL, login_attempts = 0;

INSERT IGNORE INTO GROOMER (usuario_id, ci, direccion, especialidades, turno, disponibilidad_semanal, activo)
SELECT id, ci, direccion,
       CASE email
         WHEN 'mariana.groomer@demo.com' THEN 'baño medicado, corte avanzado'
         WHEN 'santiago.groomer@demo.com' THEN 'peluquería canina, corte de raza'
         WHEN 'carla.groomer@demo.com' THEN 'manicura, baño premium'
         ELSE 'corte básico'
       END,
       CASE email
         WHEN 'mariana.groomer@demo.com' THEN 'mañana'
         WHEN 'santiago.groomer@demo.com' THEN 'tarde'
         WHEN 'carla.groomer@demo.com' THEN 'rotativo'
         ELSE 'rotativo'
       END,
       CASE email
         WHEN 'mariana.groomer@demo.com' THEN '{"lunes": true, "martes": true, "miercoles": true, "jueves": true, "viernes": true, "sabado": false, "domingo": false}'
         WHEN 'santiago.groomer@demo.com' THEN '{"lunes": true, "martes": true, "miercoles": false, "jueves": true, "viernes": true, "sabado": true, "domingo": false}'
         WHEN 'carla.groomer@demo.com' THEN '{"lunes": false, "martes": true, "miercoles": true, "jueves": true, "viernes": true, "sabado": true, "domingo": false}'
         ELSE '{"lunes": true, "martes": true, "miercoles": true, "jueves": true, "viernes": true, "sabado": false, "domingo": false}'
       END,
       TRUE
FROM USUARIO
WHERE email IN ('mariana.groomer@demo.com', 'santiago.groomer@demo.com', 'carla.groomer@demo.com');

-- Bloqueos de agenda / feriados / ausencias para los groomers
INSERT INTO BLOQUEO_AGENDA (groomer_id, fecha_inicio, fecha_fin, motivo)
SELECT g.id, '2026-05-18 09:00:00', '2026-05-18 18:00:00', 'Feriado nacional - no hay turnos'
FROM GROOMER g
JOIN USUARIO u ON g.usuario_id = u.id
WHERE u.email = 'groomer@demo.com'
  AND NOT EXISTS (
    SELECT 1 FROM BLOQUEO_AGENDA b
    WHERE b.groomer_id = g.id
      AND b.fecha_inicio = '2026-05-18 09:00:00'
      AND b.fecha_fin = '2026-05-18 18:00:00'
  );

INSERT INTO BLOQUEO_AGENDA (groomer_id, fecha_inicio, fecha_fin, motivo)
SELECT g.id, '2026-06-01 09:00:00', '2026-06-01 18:00:00', 'Mantenimiento de salón'
FROM GROOMER g
JOIN USUARIO u ON g.usuario_id = u.id
WHERE u.email = 'mariana.groomer@demo.com'
  AND NOT EXISTS (
    SELECT 1 FROM BLOQUEO_AGENDA b
    WHERE b.groomer_id = g.id
      AND b.fecha_inicio = '2026-06-01 09:00:00'
      AND b.fecha_fin = '2026-06-01 18:00:00'
  );

INSERT INTO BLOQUEO_AGENDA (groomer_id, fecha_inicio, fecha_fin, motivo)
SELECT g.id, '2026-06-20 12:00:00', '2026-06-20 14:00:00', 'Almuerzo extendido'
FROM GROOMER g
JOIN USUARIO u ON g.usuario_id = u.id
WHERE u.email = 'santiago.groomer@demo.com'
  AND NOT EXISTS (
    SELECT 1 FROM BLOQUEO_AGENDA b
    WHERE b.groomer_id = g.id
      AND b.fecha_inicio = '2026-06-20 12:00:00'
      AND b.fecha_fin = '2026-06-20 14:00:00'
  );

-- Servicios adicionales y ajustes por raza
INSERT IGNORE INTO SERVICIO (nombre, descripcion, precio_base, duracion_min, tiempo_limpieza_min, ajuste_raza_pct, allow_double_booking, categoria)
VALUES
    ('Baño Completo', 'Baño con shampoo, secado y revisión de piel', 390.00, 45, 15, 0, FALSE, 'grooming'),
    ('Corte de Pelo', 'Corte personalizado según raza y estilo', 520.00, 60, 20, 0, FALSE, 'grooming'),
    ('Manicura', 'Corte de uñas y cuidado de almohadillas', 180.00, 20, 10, 0, FALSE, 'grooming'),
    ('Desparasitación', 'Tratamiento antiparasitario completo', 260.00, 30, 15, 0, FALSE, 'grooming'),
    ('Hidratación Premium', 'Hidratación profunda para piel seca', 420.00, 40, 15, 0, FALSE, 'grooming');

INSERT IGNORE INTO RAZA_AJUSTE (servicio_id, raza_nombre, porcentaje_extra)
SELECT s.id, 'Labrador', 15
FROM SERVICIO s WHERE s.nombre = 'Baño Completo'
UNION ALL
SELECT s.id, 'Poodle', 20
FROM SERVICIO s WHERE s.nombre = 'Corte de Pelo'
UNION ALL
SELECT s.id, 'Bulldog', 25
FROM SERVICIO s WHERE s.nombre = 'Hidratación Premium';

-- Categorías y productos / insumos para grooming
INSERT IGNORE INTO CATEGORIA (nombre, descripcion)
VALUES
    ('Insumos', 'Productos usados para el cuidado y servicios de grooming'),
    ('Productos', 'Artículos de venta para mascotas');

INSERT IGNORE INTO PRODUCTO (nombre, categoria_id, precio, stock, umbral_alerta, tipo, descripcion, activo)
SELECT 'Shampoo Premium', c.id, 220.00, 25, 5, 'insumo', 'Shampoo profesional para piel sensible', TRUE
FROM CATEGORIA c WHERE c.nombre = 'Insumos'
UNION ALL
SELECT 'Acondicionador Botánico', c.id, 180.00, 20, 5, 'insumo', 'Acondicionador natural para pelaje brillante', TRUE
FROM CATEGORIA c WHERE c.nombre = 'Insumos'
UNION ALL
SELECT 'Cepillo Antiestático', c.id, 150.00, 15, 3, 'ambos', 'Cepillo para eliminar pelo muerto y desenredar', TRUE
FROM CATEGORIA c WHERE c.nombre = 'Insumos';

-- 6. CREAR VETERINARIO DE PRUEBA (opcional)
INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, telefono, ci, direccion, email_verificado, activo) 
VALUES (
    'Veterinario',
    'Demo',
    'veterinario@demo.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36p4rWG', -- password: "Veterinario@123!" (pre-hashed)
    'veterinario',
    '+54 911 4567890',
    '87654322',
    'Calle Veterinaria 789, Buenos Aires',
    TRUE,
    TRUE
)
ON DUPLICATE KEY UPDATE locked_until = NULL, login_attempts = 0;

INSERT IGNORE INTO VETERINARIO (usuario_id, ci, direccion, especialidad, turno, disponibilidad_semanal, activo)
SELECT id, ci, direccion, 'general', 'rotativo', '{"lunes": true, "martes": true, "miercoles": true, "jueves": true, "viernes": true, "sabado": false, "domingo": false}', TRUE
FROM USUARIO
WHERE email = 'veterinario@demo.com';

-- 7. VERIFICAR USUARIO DEMO
UPDATE USUARIO SET email_verificado = TRUE, locked_until = NULL, login_attempts = 0 WHERE email = 'demo.user.1@test.com';

-- 7. VERIFICAR DATOS
SELECT 'USUARIOS PARA DEMO:' AS Info;
SELECT id, nombre, apellido, email, rol, email_verificado, locked_until, login_attempts FROM USUARIO;

SELECT '' AS '';
SELECT 'TABLAS PRINCIPALES LISTAS:' AS Info;
SELECT COUNT(*) as total_usuarios FROM USUARIO;
SELECT COUNT(*) as total_audits FROM auditoria_log;

-- ============================================================
-- CREDENCIALES PARA LA DEMO:
-- ============================================================
-- Admin: admin@pawspa.com / Admin@Spa123!
-- Cliente: cliente@demo.com / Cliente@123!
-- Empleado Groomer: groomer@demo.com / Groomer@123!
-- Demo User: demo.user.1@test.com / [la que tenía]
-- ============================================================
