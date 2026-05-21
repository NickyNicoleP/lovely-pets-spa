-- 📋 Tabla para Checklist de Ficha de Grooming
-- Almacena los ítems del checklist que deben completarse antes de cerrar una ficha

CREATE TABLE IF NOT EXISTS FICHA_GROOMING_CHECKLIST (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ficha_grooming_id INT NOT NULL,
  item_key VARCHAR(50) NOT NULL UNIQUE KEY (ficha_grooming_id, item_key),
  item_nombre VARCHAR(100) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_by INT DEFAULT NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_ficha_checklist 
    FOREIGN KEY (ficha_grooming_id) 
    REFERENCES FICHA_GROOMING(id) 
    ON DELETE CASCADE,
  
  CONSTRAINT fk_completed_by 
    FOREIGN KEY (completed_by) 
    REFERENCES USUARIO(id) 
    ON DELETE SET NULL
);

-- Crear índices para mejorar queries
CREATE INDEX idx_ficha_checklist_id ON FICHA_GROOMING_CHECKLIST(ficha_grooming_id);
CREATE INDEX idx_checklist_completed ON FICHA_GROOMING_CHECKLIST(completed);
