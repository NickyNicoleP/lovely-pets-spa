-- ====================================================================
-- Script de Inicialización de Base de Datos PawSpa
-- ====================================================================
-- 
-- Este script crea toda la estructura de base de datos necesaria
-- para el sistema de Pet Spa con autenticación y gestión completa.
--
-- INSTRUCCIONES:
-- 1. Abre MySQL (o phpMyAdmin)
-- 2. Crea la base de datos primero: CREATE DATABASE pawspa_db;
-- 3. Selecciona la BD: USE pawspa_db;
-- 4. Ejecuta este script completo
--
-- O desde terminal:
-- mysql -u root -p < database.sql
-- mysql -u root -p pawspa_db < database.sql
--
-- ====================================================================

USE pawspa_db;

-- ====================================================================
-- TABLAS DEL SISTEMA
-- ====================================================================

-- 1. USUARIO
CREATE TABLE USUARIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(80) NOT NULL,
    apellido VARCHAR(80) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'empleado', 'veterinario', 'cliente') NOT NULL,
    telefono VARCHAR(20),
    ci VARCHAR(20),
    direccion TEXT,
    twofa_secret VARCHAR(100),
    email_verificado BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_expires DATETIME,
    login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLIENTE
CREATE TABLE CLIENTE (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE NOT NULL,
    ci VARCHAR(20),
    direccion TEXT,
    preferencias JSON,
    nivel_fidelidad VARCHAR(20),
    puntos_acumulados INT DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id) ON DELETE CASCADE
);

-- 3. GROOMER
CREATE TABLE GROOMER (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT UNIQUE NOT NULL,
    ci VARCHAR(20),
    direccion TEXT,
    especialidades VARCHAR(200),
    turno VARCHAR(50),
    disponibilidad_semanal JSON,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id) ON DELETE CASCADE
);

-- 4. VETERINARIO
CREATE TABLE VETERINARIO (
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

-- 5. RAZA_AJUSTE (ajuste de precio por raza)
CREATE TABLE RAZA_AJUSTE (
    id INT PRIMARY KEY AUTO_INCREMENT,
    servicio_id INT NOT NULL,
    raza_nombre VARCHAR(60) NOT NULL,
    porcentaje_extra INT NOT NULL,
    FOREIGN KEY (servicio_id) REFERENCES SERVICIO(id)
);

-- 5. SERVICIO
CREATE TABLE SERVICIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    duracion_min INT NOT NULL,
    tiempo_limpieza_min INT DEFAULT 10,
    precio_base DECIMAL(10,2) NOT NULL,
    ajuste_raza_pct INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE
);

-- 6. MASCOTA
CREATE TABLE MASCOTA (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    especie VARCHAR(40) NOT NULL,
    raza VARCHAR(60),
    edad INT,
    peso DECIMAL(5,2),
    temperamento VARCHAR(100),
    alergias TEXT,
    restricciones_medicas TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES CLIENTE(id) ON DELETE CASCADE
);

-- 7. SLOT_RESERVA
CREATE TABLE SLOT_RESERVA (
    id INT PRIMARY KEY AUTO_INCREMENT,
    groomer_id INT NOT NULL,
    mascota_id INT NOT NULL,
    servicio_id INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    fecha_hora_fin DATETIME,
    precio_final DECIMAL(10,2),
    estado ENUM('pendiente','confirmada','en_progreso','completada','cancelada') DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (groomer_id) REFERENCES GROOMER(id) ON DELETE RESTRICT,
    FOREIGN KEY (mascota_id) REFERENCES MASCOTA(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES SERVICIO(id) ON DELETE RESTRICT
);

-- 8. FICHA_GROOMING
CREATE TABLE FICHA_GROOMING (
    id INT PRIMARY KEY AUTO_INCREMENT,
    slot_id INT NOT NULL,
    estado_entrada TEXT,
    estado_salida TEXT,
    productos_usados JSON,
    observaciones TEXT,
    fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre DATETIME,
    FOREIGN KEY (slot_id) REFERENCES SLOT_RESERVA(id) ON DELETE CASCADE
);

-- 9. TAREA_FICHA
CREATE TABLE TAREA_FICHA (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(60) NOT NULL,
    realizado BOOLEAN DEFAULT FALSE,
    observacion TEXT,
    FOREIGN KEY (ficha_id) REFERENCES FICHA_GROOMING(id) ON DELETE CASCADE
);

-- 10. FOTO_SERVICIO
CREATE TABLE FOTO_SERVICIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ficha_id INT NOT NULL,
    url VARCHAR(400) NOT NULL,
    tipo ENUM('antes', 'despues') NOT NULL,
    fecha_carga TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ficha_id) REFERENCES FICHA_GROOMING(id) ON DELETE CASCADE
);

-- 11. CATEGORIA
CREATE TABLE CATEGORIA (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT
);

-- 12. PRODUCTO (con tipo: venta, insumo, ambos)
CREATE TABLE PRODUCTO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(150) NOT NULL,
    categoria_id INT NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    umbral_alerta INT DEFAULT 0,
    tipo ENUM('venta', 'insumo', 'ambos') NOT NULL DEFAULT 'venta',
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (categoria_id) REFERENCES CATEGORIA(id)
);

-- 13. VARIANTE_PRODUCTO
CREATE TABLE VARIANTE_PRODUCTO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    precio_adicional DECIMAL(10,2) DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    sku VARCHAR(60) UNIQUE NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(id) ON DELETE CASCADE
);

-- 14. FICHA_INSUMO
CREATE TABLE FICHA_INSUMO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ficha_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    FOREIGN KEY (ficha_id) REFERENCES FICHA_GROOMING(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(id)
);

-- 15. CARRITO_PEDIDO
CREATE TABLE CARRITO_PEDIDO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    items JSON NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('pendiente','confirmado','entregado','cancelado') DEFAULT 'pendiente',
    canal ENUM('local','whatsapp','telegram') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES CLIENTE(id)
);

-- 16. PAGO_FACTURA
CREATE TABLE PAGO_FACTURA (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pedido_id INT NULL,
    reserva_id INT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo ENUM('efectivo','qr','tarjeta','link_pago') NOT NULL,
    estado ENUM('pendiente','pagado','rechazado','reembolsado') DEFAULT 'pendiente',
    referencia VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES CARRITO_PEDIDO(id) ON DELETE SET NULL,
    FOREIGN KEY (reserva_id) REFERENCES SLOT_RESERVA(id) ON DELETE SET NULL,
    CHECK (pedido_id IS NOT NULL OR reserva_id IS NOT NULL)
);

-- 17. BLOQUEO_AGENDA
CREATE TABLE BLOQUEO_AGENDA (
    id INT PRIMARY KEY AUTO_INCREMENT,
    groomer_id INT NOT NULL,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    motivo VARCHAR(150),
    FOREIGN KEY (groomer_id) REFERENCES GROOMER(id) ON DELETE CASCADE
);

-- 18. NOTIFICACION
CREATE TABLE NOTIFICACION (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    canal ENUM('push','email','whatsapp','sms','telegram') NOT NULL,
    titulo VARCHAR(150),
    cuerpo TEXT,
    leida BOOLEAN DEFAULT FALSE,
    estado_entrega ENUM('enviada','entregada','fallida') DEFAULT 'enviada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id) ON DELETE CASCADE
);

-- 19. MOVIMIENTO_INVENTARIO
CREATE TABLE MOVIMIENTO_INVENTARIO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    variante_id INT NULL,
    tipo ENUM('entrada','salida') NOT NULL,
    cantidad INT NOT NULL,
    origen VARCHAR(60) NOT NULL,
    referencia_id INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(id),
    FOREIGN KEY (variante_id) REFERENCES VARIANTE_PRODUCTO(id) ON DELETE SET NULL
);

-- 20. AUDITORIA_LOG
CREATE TABLE AUDITORIA_LOG (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NULL,
    email VARCHAR(120),
    rol VARCHAR(50),
    accion VARCHAR(255) NOT NULL,
    ip_origen VARCHAR(45),
    user_agent TEXT,
    detalles JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES USUARIO(id) ON DELETE SET NULL
);

-- ======================================================
-- TRIGGERS
-- ======================================================
DROP TRIGGER IF EXISTS trg_calcular_fin_y_precio;
DROP TRIGGER IF EXISTS trg_descontar_insumos;

DELIMITER //

CREATE TRIGGER trg_calcular_fin_y_precio
BEFORE INSERT ON SLOT_RESERVA
FOR EACH ROW
BEGIN
    DECLARE v_duracion_ajustada INT;
    DECLARE v_ajuste INT;
    DECLARE v_precio_base DECIMAL(10,2);
    DECLARE v_duracion_base INT;
    DECLARE v_limpieza INT;
    DECLARE v_raza_mascota VARCHAR(60);
    
    SELECT duracion_min, precio_base, tiempo_limpieza_min
    INTO v_duracion_base, v_precio_base, v_limpieza
    FROM SERVICIO WHERE id = NEW.servicio_id;
    
    SELECT raza INTO v_raza_mascota
    FROM MASCOTA WHERE id = NEW.mascota_id;
    
    SELECT porcentaje_extra INTO v_ajuste
    FROM RAZA_AJUSTE
    WHERE servicio_id = NEW.servicio_id AND raza_nombre = v_raza_mascota
    LIMIT 1;
    
    IF v_ajuste IS NULL THEN
        SELECT ajuste_raza_pct INTO v_ajuste
        FROM SERVICIO WHERE id = NEW.servicio_id;
    END IF;
    
    SET v_duracion_ajustada = v_duracion_base + (v_duracion_base * v_ajuste / 100);
    SET NEW.fecha_hora_fin = DATE_ADD(NEW.fecha_hora, INTERVAL (v_duracion_ajustada + v_limpieza) MINUTE);
    SET NEW.precio_final = v_precio_base + (v_precio_base * v_ajuste / 100);
END//

CREATE TRIGGER trg_descontar_insumos
AFTER UPDATE ON FICHA_GROOMING
FOR EACH ROW
BEGIN
    IF NEW.fecha_cierre IS NOT NULL AND OLD.fecha_cierre IS NULL THEN
        UPDATE PRODUCTO p
        INNER JOIN FICHA_INSUMO fi ON fi.producto_id = p.id
        SET p.stock = p.stock - fi.cantidad
        WHERE fi.ficha_id = NEW.id;
        
        INSERT INTO MOVIMIENTO_INVENTARIO 
            (producto_id, variante_id, tipo, cantidad, origen, referencia_id, fecha)
        SELECT fi.producto_id, NULL, 'salida', fi.cantidad, 'grooming', NEW.id, NOW()
        FROM FICHA_INSUMO fi
        WHERE fi.ficha_id = NEW.id;
    END IF;
END//

DELIMITER ;

-- ======================================================
-- ÍNDICES ADICIONALES
-- ======================================================
CREATE INDEX idx_slot_fecha ON SLOT_RESERVA(fecha_hora);
CREATE INDEX idx_slot_estado ON SLOT_RESERVA(estado);
CREATE INDEX idx_slot_groomer_estado ON SLOT_RESERVA(groomer_id, estado);
CREATE INDEX idx_usuario_email ON USUARIO(email);
CREATE INDEX idx_usuario_rol ON USUARIO(rol);
CREATE INDEX idx_auditoria_usuario ON AUDITORIA_LOG(usuario_id);
CREATE INDEX idx_auditoria_fecha ON AUDITORIA_LOG(created_at);
CREATE INDEX idx_mascota_cliente ON MASCOTA(cliente_id);
CREATE INDEX idx_ficha_slot ON FICHA_GROOMING(slot_id);
CREATE INDEX idx_producto_categoria ON PRODUCTO(categoria_id);
CREATE INDEX idx_movimiento_producto ON MOVIMIENTO_INVENTARIO(producto_id);

-- ======================================================
-- DATOS DE PRUEBA (Opcional)
-- ======================================================

-- Crear usuario admin de prueba (password: Admin123!@)
INSERT INTO USUARIO (nombre, apellido, email, password_hash, rol, email_verificado, activo)
VALUES (
    'Administrador',
    'Sistema',
    'admin@pawspa.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoXyeIGWwbvuNfOh.4F8LzZ9YbZx3Toa2Wgm',
    'admin',
    TRUE,
    TRUE
);

-- Crear categorías
INSERT INTO CATEGORIA (nombre, descripcion) VALUES
('Champús', 'Champús especializados para diferentes tipos de pelaje'),
('Acondicionadores', 'Acondicionadores y tratamientos'),
('Toallas y Secadores', 'Toallas microfiber y secadores'),
('Herramientas', 'Cepillos, peines y cortauñas');

-- Crear servicios básicos
INSERT INTO SERVICIO (nombre, descripcion, duracion_min, tiempo_limpieza_min, precio_base, activo)
VALUES
('Baño Simple', 'Baño básico con champú y acondicionador', 30, 10, 25.00, TRUE),
('Baño y Corte', 'Baño completo con corte de pelaje', 60, 15, 45.00, TRUE),
('Corte de Uñas', 'Corte y limpieza de uñas', 15, 5, 10.00, TRUE);

-- ======================================================
-- VERIFICACIÓN
-- ======================================================
SELECT 'Base de datos inicializada correctamente' AS status;
SELECT COUNT(*) as usuarios FROM USUARIO;
SELECT COUNT(*) as servicios FROM SERVICIO;
SELECT COUNT(*) as categorias FROM CATEGORIA;
