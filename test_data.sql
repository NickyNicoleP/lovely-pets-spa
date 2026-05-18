INSERT INTO categoria (nombre, descripcion) VALUES
('Accesorios', 'Accesorios para mascotas'),
('Alimentos', 'Alimentos y premios'),
('Higiene', 'Productos de higiene'),
('Juguetes', 'Juguetes y entretenimiento');

INSERT INTO producto (nombre, categoria_id, precio, stock, tipo, descripcion, activo) VALUES
('Shampoo Premium', 3, 12.50, 20, 'venta', 'Shampoo para perros sensibles', TRUE),
('Acondicionador', 3, 10.00, 15, 'venta', 'Acondicionador hidratante', TRUE),
('Collar Anti-pulgas', 1, 8.99, 30, 'venta', 'Collar repelente de insectos', TRUE),
('Juguete Kong', 4, 11.99, 25, 'venta', 'Juguete de goma resistente', TRUE),
('Correa Extensible', 1, 14.99, 18, 'venta', 'Correa de 5 metros', TRUE);

SELECT COUNT(*) as categorias FROM categoria;
SELECT COUNT(*) as servicios FROM servicio;
SELECT COUNT(*) as productos FROM producto;
