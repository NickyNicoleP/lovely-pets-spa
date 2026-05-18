// fileController.js - Manejo de subida de archivos (imágenes)
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuración de multer para subida de archivos
const uploadDir = path.join(__dirname, '../../uploads/productos');

// Crear directorio si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'producto-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para permitir solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, GIF, WebP)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

/**
 * Subir imagen de producto
 */
exports.uploadProductImage = [
  upload.single('imagen'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó archivo' });
      }

      // Ruta relativa para guardar en BD
      const imagePath = `/uploads/productos/${req.file.filename}`;
      
      res.json({
        success: true,
        filename: req.file.filename,
        path: imagePath,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
];

/**
 * Eliminar imagen de producto
 */
exports.deleteProductImage = async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'No se proporcionó nombre de archivo' });
    }

    const filePath = path.join(uploadDir, filename);
    
    // Verificar que el archivo existe y está en el directorio permitido
    const realPath = path.resolve(filePath);
    const realUploadDir = path.resolve(uploadDir);
    
    if (!realPath.startsWith(realUploadDir)) {
      return res.status(400).json({ error: 'Acceso denegado' });
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: 'Imagen eliminada' });
    } else {
      res.status(404).json({ error: 'Archivo no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { upload, ...exports };
