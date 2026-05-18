-- ======================================================
-- MIGRACIÓN: Agregar soporte de imágenes a productos
-- ======================================================

-- Agregar columna de imagen a la tabla PRODUCTO
ALTER TABLE PRODUCTO ADD COLUMN IF NOT EXISTS imagen VARCHAR(255);
ALTER TABLE PRODUCTO ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Crear tabla separada para múltiples imágenes por producto (opcional, para futuro)
CREATE TABLE IF NOT EXISTS FOTO_PRODUCTO (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    ruta_archivo VARCHAR(255) NOT NULL,
    url_imagen TEXT,
    descripcion VARCHAR(255),
    es_principal BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_id) REFERENCES PRODUCTO(id) ON DELETE CASCADE
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_foto_producto_id ON FOTO_PRODUCTO(producto_id);
CREATE INDEX idx_foto_principal ON FOTO_PRODUCTO(producto_id, es_principal);
