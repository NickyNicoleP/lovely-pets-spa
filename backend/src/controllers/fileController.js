// fileController.js - Manejo de subida de archivos
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const uploadDir = path.join(__dirname, '../../uploads/productos');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${safeName}-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos JPEG, PNG, GIF, WebP o PDF.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  }
});

const uploadProductFile = [
  upload.single('archivo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó archivo' });
      }

      const filePath = `/uploads/productos/${req.file.filename}`;
      res.json({
        success: true,
        filename: req.file.filename,
        path: filePath,
        size: req.file.size,
        mimetype: req.file.mimetype
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
];

const deleteProductFile = async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'No se proporcionó nombre de archivo' });
    }

    const filePath = path.join(uploadDir, filename);
    const realPath = path.resolve(filePath);
    const realUploadDir = path.resolve(uploadDir);

    if (!realPath.startsWith(realUploadDir)) {
      return res.status(400).json({ error: 'Acceso denegado' });
    }

    if (fs.existsSync(realPath)) {
      fs.unlinkSync(realPath);
      return res.json({ success: true, message: 'Archivo eliminado' });
    }

    res.status(404).json({ error: 'Archivo no encontrado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  upload,
  uploadProductFile,
  uploadProductImage: uploadProductFile,
  deleteProductFile,
  deleteProductImage: deleteProductFile
};
