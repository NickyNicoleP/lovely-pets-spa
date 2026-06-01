const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const http = require('http');
const { initIo } = require('./socket');
const { startReminderScheduler } = require('./services/notificationScheduler');
const { getWhatsAppService } = require('./services/whatsappService');
const { forceHTTPS, securityHeaders } = require('./utils/httpsConfig');
const { sanitizeResponse } = require('./utils/xssSanitizer');
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const clienteRoutes = require('./routes/clientes');
const mascotaRoutes = require('./routes/mascotas');
const servicioRoutes = require('./routes/servicios');
const productoRoutes = require('./routes/productos');
const carritoRoutes = require('./routes/carrito');
const notificacionesRoutes = require('./routes/notificaciones');
const agendaRoutes = require('./routes/agenda');
const groomerRoutes = require('./routes/groomers');
const fichaGroomingRoutes = require('./routes/fichaGrooming');
const inventarioRoutes = require('./routes/inventario');
const pagoRoutes = require('./routes/pagos');
const auditRoutes = require('./routes/audit');
const reporteRoutes = require('./routes/reportes');
const whatsappRoutes = require('./routes/whatsapp');
const { validateCSRF, injectCSRFToken } = require('./middleware/csrfProtection');

const app = express();

// ✅ SEGURIDAD: Forzar HTTPS en producción
app.use(forceHTTPS);

// ✅ SEGURIDAD: Headers de seguridad HTTP
app.use(securityHeaders);

// ✅ SEGURIDAD: Middleware de CORS con credenciales
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeResponse());

// ✅ SEGURIDAD: Middleware para inyectar CSRF token
app.use(injectCSRFToken);

// ✅ SEGURIDAD: Middleware para validar CSRF token
app.use(validateCSRF);

// Servir archivos estáticos (imágenes, etc.)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/mascotas', mascotaRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/groomers', groomerRoutes);
app.use('/api/ficha-grooming', fichaGroomingRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

initIo(server);

server.listen(PORT, () => {
  console.log(`Servidor PawSpa corriendo en puerto ${PORT}`);

  if (process.env.NODE_ENV !== 'test') {
    startReminderScheduler();
    
    // Initialize WhatsApp service
    console.log('Initializing WhatsApp service...');
    getWhatsAppService().then(() => {
      console.log('WhatsApp service initialized');
    }).catch((error) => {
      console.warn('Warning: WhatsApp service initialization failed:', error.message);
      console.log('The system will continue running without WhatsApp integration');
    });
  }
});

module.exports = app;