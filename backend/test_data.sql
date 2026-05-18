INSERT INTO servicio (nombre, descripcion, duracion_minutos, precio, activo) VALUES
('Baño Completo', 'Baño con shampoo y secado', 45, 35.00, TRUE),
('Corte de Pelo', 'Corte completo personalizado', 60, 50.00, TRUE),
('Manicura', 'Corte de uñas', 20, 15.00, TRUE),
('Cuidado Dental', 'Limpieza dental básica', 30, 40.00, TRUE),
('Desparasitación', 'Tratamiento antiparasitario', 15, 25.00, TRUE);

INSERT INTO producto (nombre, descripcion, precio_compra, precio_venta, stock, activo) VALUES
('Shampoo Premium', 'Shampoo para perros sensibles', 5.00, 12.50, 20, TRUE),
('Acondicionador', 'Acondicionador hidratante', 4.00, 10.00, 15, TRUE),
('Collar Anti-pulgas', 'Collar repelente de insectos', 3.50, 8.99, 30, TRUE),
('Juguete Kong', 'Juguete de goma resistente', 4.50, 11.99, 25, TRUE),
('Correa Extensible', 'Correa de 5 metros', 6.00, 14.99, 18, TRUE);

SELECT 'Servicios creados:'; SELECT COUNT(*) as cantidad FROM servicio;
SELECT 'Productos creados:'; SELECT COUNT(*) as cantidad FROM producto;
