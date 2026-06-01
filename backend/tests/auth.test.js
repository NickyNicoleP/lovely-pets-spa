const request = require('supertest');
const jwt = require('jsonwebtoken');

// Mock de la base de datos
jest.mock('../src/config/database', () => ({
  execute: jest.fn()
}));

const pool = require('../src/config/database');

// Mock de bcrypt
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn()
}));

// Mock de jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock_token'),
  verify: jest.fn()
}));

// Mock de otplib
jest.mock('otplib', () => ({
  authenticator: {
    generateSecret: jest.fn().mockReturnValue('mock_secret'),
    keyuri: jest.fn().mockReturnValue('otpauth://mock'),
    verify: jest.fn().mockReturnValue(true)
  }
}));

// Mock de QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock')
}));

// Mock de uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid')
}));

// Mock del validador de contraseña
jest.mock('../src/utils/passwordValidator', () => ({
  validatePasswordStrength: jest.fn().mockReturnValue({
    isValid: true,
    score: 4,
    errors: []
  })
}));

// Mock de dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Auth Service - Pruebas de Autenticación', () => {
  let authService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear el mock de la base de datos
    pool.execute.mockReset();
  });

  describe('Registro de Usuario', () => {
    it('debería crear un nuevo usuario correctamente', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        nombre: 'Test',
        apellido: 'User',
        telefono: '1234567890',
        captchaToken: 'mock_captcha_token',
        captchaAnswer: '5'
      };
      
      pool.execute
        .mockResolvedValueOnce([[]]) // Verificar email no existe
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insertar usuario
        .mockResolvedValueOnce([{ insertId: 1 }]); // Crear cliente
      
      // Importar después de los mocks
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Mock captcha validation
      authService.validateCaptcha = jest.fn().mockReturnValue(true);
      
      // Act
      const result = await authService.register(userData);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
      expect(result).toHaveProperty('verificationToken');
    });

    it('debería fallar si el email ya existe', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        nombre: 'Test',
        apellido: 'User',
        captchaToken: 'mock_captcha_token',
        captchaAnswer: '5'
      };
      
      pool.execute.mockResolvedValueOnce([[{ id: 1 }]]); // Email existe
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Mock captcha validation
      authService.validateCaptcha = jest.fn().mockReturnValue(true);
      
      // Act & Assert
      await expect(authService.register(userData)).rejects.toThrow('El email ya está registrado');
    });
  });

  describe('Login', () => {
    it('debería iniciar sesión correctamente con credenciales válidas', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const ipAddress = '127.0.0.1';
      const userAgent = 'Mozilla/5.0';
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        nombre: 'Test',
        apellido: 'User',
        rol: 'cliente',
        intentos_login: 0,
        locked_until: null,
        two_factor_enabled: false,
        email_verificado: true,
        activo: true
      };
      
      pool.execute
        .mockResolvedValueOnce([[mockUser]]) // Buscar usuario
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Resetear intentos
        .mockResolvedValueOnce([{ insertId: 1 }]) // Generar refresh token
        .mockResolvedValueOnce([{ insertId: 1 }]); // Audit login
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Act
      const result = await authService.login(email, password, ipAddress, userAgent);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('email', email);
    });

    it('debería fallar con credenciales inválidas', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong_password';
      const ipAddress = '127.0.0.1';
      const userAgent = 'Mozilla/5.0';
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        intentos_login: 0,
        locked_until: null,
        email_verificado: true,
        activo: true,
        rol: 'cliente'
      };
      
      pool.execute
        .mockResolvedValueOnce([[mockUser]]) // Buscar usuario
        .mockResolvedValueOnce([[mockUser]]) // Obtener rol para audit
        .mockResolvedValueOnce([{ insertId: 1 }]); // Registrar audit de login fallido
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Act & Assert
      await expect(authService.login(email, password, ipAddress, userAgent)).rejects.toThrow('Credenciales inválidas');
    });

    it('debería bloquear después de 5 intentos fallidos', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong_password';
      const ipAddress = '127.0.0.1';
      const userAgent = 'Mozilla/5.0';
      
      const futureDate = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos en el futuro
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        intentos_login: 5,
        locked_until: futureDate,
        email_verificado: true,
        activo: true
      };
      
      pool.execute.mockResolvedValueOnce([[mockUser]]);
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Act & Assert
      await expect(authService.login(email, password, ipAddress, userAgent)).rejects.toThrow(/Cuenta bloqueada|bloqueada/);
    });

    it('debería requerir 2FA si está habilitado', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const ipAddress = '127.0.0.1';
      const userAgent = 'Mozilla/5.0';
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        nombre: 'Test',
        apellido: 'User',
        rol: 'admin',
        intentos_login: 0,
        locked_until: null,
        twofa_secret: 'mock_secret',
        email_verificado: true,
        activo: true
      };
      
      pool.execute.mockResolvedValueOnce([[mockUser]]);
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Act
      const result = await authService.login(email, password, ipAddress, userAgent);
      
      // Assert
      expect(result.requires2FA).toBe(true);
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('tempToken');
    });
  });

  describe('Verificación 2FA', () => {
    it('debería verificar código 2FA correctamente', async () => {
      // Arrange
      const userId = 1;
      const code = '123456';
      const ipAddress = '127.0.0.1';
      const userAgent = 'Mozilla/5.0';
      
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        nombre: 'Test',
        apellido: 'User',
        rol: 'admin',
        twofa_secret: 'mock_secret',
        intentos_login: 0,
        locked_until: null,
        email_verificado: true,
        activo: true
      };
      
      pool.execute
        .mockResolvedValueOnce([[mockUser]]) // Buscar usuario
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Actualizar ultimo login
        .mockResolvedValueOnce([[mockUser]]) // Obtener rol para audit
        .mockResolvedValueOnce([{ insertId: 1 }]); // Registrar audit de login exitoso
      
      const otplib = require('otplib');
      otplib.authenticator.verify.mockReturnValue(true);
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Act
      const result = await authService.verify2FA(userId, code, ipAddress, userAgent);
      
      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('debería fallar con código 2FA inválido', async () => {
      // Arrange
      const userId = 1;
      const code = '000000';
      const ipAddress = '127.0.0.1';
      const userAgent = 'Mozilla/5.0';
      
      const mockUser = {
        id: 1,
        twofa_secret: 'mock_secret'
      };
      
      pool.execute.mockResolvedValueOnce([[mockUser]]);
      
      const otplib = require('otplib');
      otplib.authenticator.verify.mockReturnValue(false);
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Act & Assert
      await expect(authService.verify2FA(userId, code, ipAddress, userAgent)).rejects.toThrow('Código 2FA inválido');
    });
  });

  describe('Cambio de Contraseña', () => {
    it('debería cambiar contraseña correctamente', async () => {
      // Arrange
      const userId = 1;
      const currentPassword = 'old_password';
      const newPassword = 'new_password';
      
      const mockUser = {
        id: 1,
        password_hash: 'hashed_old_password'
      };
      
      pool.execute
        .mockResolvedValueOnce([[mockUser]]) // Buscar usuario
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Actualizar contraseña
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Invalidar refresh tokens
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Act
      const result = await authService.changePassword(userId, currentPassword, newPassword);
      
      // Assert
      expect(result.message).toBe('Contraseña cambiada correctamente');
    });

    it('debería fallar con contraseña actual incorrecta', async () => {
      // Arrange
      const userId = 1;
      const currentPassword = 'wrong_password';
      const newPassword = 'new_password';
      
      const mockUser = {
        id: 1,
        password_hash: 'hashed_old_password'
      };
      
      pool.execute.mockResolvedValueOnce([[mockUser]]);
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);
      
      const { default: authServiceModule } = require('../src/services/authService');
      authService = authServiceModule;
      
      // Act & Assert
      await expect(authService.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('Contraseña actual incorrecta');
    });
  });
});

describe('Agenda Service - Pruebas de Reservas', () => {
  let agendaService;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Crear Reserva', () => {
    it('debería crear una reserva correctamente', async () => {
      // Arrange
      const reservaData = {
        cliente_id: 1,
        mascota_id: 1,
        servicio_id: 1,
        fecha: '2024-01-15',
        hora: '10:00:00',
        observaciones: 'Test reservation'
      };
      const userId = 1;
      
      const mockServicio = [[{ duracion_min: 60, precio_base: 50000, tiempo_limpieza_min: 10 }]];
      const mockMascota = [[{ peso: 15, raza_id: 1, temperamento: 'tranquilo' }]];
      
      pool.execute
        .mockResolvedValueOnce(mockServicio) // Obtener duración servicio
        .mockResolvedValueOnce(mockMascota) // Obtener datos mascota
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insertar reserva (groomer_id = null)
        .mockResolvedValueOnce([{ insertId: 1 }]); // Audit log
      
      const { default: agendaServiceModule } = require('../src/services/agendaService');
      agendaService = agendaServiceModule;
      
      // Act
      const result = await agendaService.create(reservaData, userId);
      
      // Assert
      expect(result).toHaveProperty('id');
      expect(result.cliente_id).toBe(reservaData.cliente_id);
    });

    it('debería fallar si el horario no está disponible', async () => {
      // Arrange
      const reservaData = {
        cliente_id: 1,
        mascota_id: 1,
        servicio_id: 1,
        fecha: '2024-01-15',
        hora: '10:00:00'
      };
      const userId = 1;
      
      const mockServicio = [[{ duracion_min: 60, precio_base: 50000, tiempo_limpieza_min: 10 }]];
      const mockMascota = [[{ peso: 15, raza_id: 1, temperamento: 'tranquilo' }]];
      
      // Simular fallo de inserción (groomer_id NOT NULL violation)
      pool.execute
        .mockResolvedValueOnce(mockServicio)
        .mockResolvedValueOnce(mockMascota)
        .mockResolvedValueOnce(null); // Error al insertar
      
      const { default: agendaServiceModule } = require('../src/services/agendaService');
      agendaService = agendaServiceModule;
      
      // Act & Assert
      await expect(agendaService.create(reservaData, userId)).rejects.toThrow('El horario no está disponible');
    });
  });

  describe('Horarios Disponibles', () => {
    it('debería obtener horarios disponibles correctamente', async () => {
      // Arrange
      const fecha = '2024-01-15';
      const servicioId = 1;
      
      const mockServicio = [[{ duracion_min: 60, precio_base: 50000, tiempo_limpieza_min: 10 }]];
      const mockReservas = [[{ count: 0 }]];
      
      pool.execute
        .mockResolvedValueOnce(mockServicio)
        .mockResolvedValueOnce(mockReservas);
      
      const { default: agendaServiceModule } = require('../src/services/agendaService');
      agendaService = agendaServiceModule;
      
      // Act
      const result = await agendaService.getHorariosDisponibles(fecha, servicioId);
      
      // Assert
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('Ficha Grooming Service - Pruebas de Inventario', () => {
  let fichaGroomingService;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cerrar Ficha', () => {
    it('debería cerrar ficha y registrar movimientos de inventario', async () => {
      // Arrange
      const fichaId = 1;
      const userId = 1;
      
      const mockFicha = [[{
        id: 1,
        reserva_id: 1,
        estado_ingreso: 'abierta',
        fecha_cierre: null,
        nudos: 0,
        pulgas: 0,
        heridas: 0,
        tiempo_real_min: 30,
        observaciones: 'Test ficha'
      }]];
      
      pool.execute
        .mockResolvedValueOnce(mockFicha) // Buscar ficha
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Cerrar ficha
        .mockResolvedValueOnce([{ affectedRows: 1 }]) // Actualizar estado reserva
        .mockResolvedValueOnce(mockFicha) // getById - SELECT ficha
        .mockResolvedValueOnce([[]]); // getById - SELECT insumos
      
      const { default: fichaGroomingServiceModule } = require('../src/services/fichaGroomingService');
      fichaGroomingService = fichaGroomingServiceModule;
      
      // Act
      const result = await fichaGroomingService.close(fichaId, userId);
      
      // Assert
      expect(result.estado).toBe('cerrada');
      expect(result).toHaveProperty('insumos');
    });

    it('debería fallar si la ficha ya está cerrada', async () => {
      // Arrange
      const fichaId = 1;
      const userId = 1;
      
      const mockFicha = [[{
        id: 1,
        reserva_id: 1,
        estado_ingreso: 'cerrada',
        fecha_cierre: new Date()
      }]];
      
      pool.execute.mockResolvedValueOnce(mockFicha);
      
      const { default: fichaGroomingServiceModule } = require('../src/services/fichaGroomingService');
      fichaGroomingService = fichaGroomingServiceModule;
      
      // Act & Assert
      await expect(fichaGroomingService.close(fichaId, userId)).rejects.toThrow('Ficha no encontrada o ya cerrada');
    });
  });

  describe('Agregar Insumo', () => {
    it('debería agregar insumo y reducir stock', async () => {
      // Arrange
      const fichaId = 1;
      const insumoData = {
        producto_id: 1,
        cantidad: 2
      };
      const userId = 1;
      
      const mockFicha = [[{
        id: 1,
        reserva_id: 1,
        estado_ingreso: 'abierta'
      }]];
      const mockProducto = [[{
        id: 1,
        stock: 10,
        nome: 'Shampoo'
      }]];
      
      pool.execute
        .mockResolvedValueOnce(mockFicha) // Buscar ficha
        .mockResolvedValueOnce(mockProducto) // Verificar producto
        .mockResolvedValueOnce([{ insertId: 1 }]) // Insertar insumo
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Reducir stock
      
      const { default: fichaGroomingServiceModule } = require('../src/services/fichaGroomingService');
      fichaGroomingService = fichaGroomingServiceModule;
      
      // Act
      const result = await fichaGroomingService.addInsumo(fichaId, insumoData, userId);
      
      // Assert
      expect(result.message).toBe('Insumo agregado correctamente');
    });

    it('debería fallar si no hay stock suficiente', async () => {
      // Arrange
      const fichaId = 1;
      const insumoData = {
        producto_id: 1,
        cantidad: 15
      };
      const userId = 1;
      
      const mockFicha = [[{ id: 1, estado: 'abierta' }]];
      const mockProducto = [[{ id: 1, stock: 5, nome: 'Shampoo' }]];
      
      pool.execute
        .mockResolvedValueOnce(mockFicha)
        .mockResolvedValueOnce(mockProducto);
      
      const { default: fichaGroomingServiceModule } = require('../src/services/fichaGroomingService');
      fichaGroomingService = fichaGroomingServiceModule;
      
      // Act & Assert
      await expect(fichaGroomingService.addInsumo(fichaId, insumoData, userId)).rejects.toThrow('Stock insuficiente');
    });
  });
});

describe('Middleware de Autenticación', () => {
  const { authenticateToken, requireRole } = require('../src/middleware/auth');
  
  describe('authenticateToken', () => {
    it('debería permitir acceso con token válido', () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Bearer valid_token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 1, email: 'test@example.com', rol: 'admin' });
      });
      
      // Act
      authenticateToken(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
      expect(req.user).toHaveProperty('id');
    });

    it('debería denegar acceso sin token', () => {
      // Arrange
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      // Act
      authenticateToken(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token de acceso requerido' });
    });

    it('debería denegar acceso con token inválido', () => {
      // Arrange
      const req = {
        headers: {
          authorization: 'Bearer invalid_token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });
      
      // Act
      authenticateToken(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('requireRole', () => {
    it('debería permitir acceso con rol correcto', () => {
      // Arrange
      const req = {
        user: { rol: 'admin' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      const middleware = requireRole('admin', 'empleado');
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(next).toHaveBeenCalled();
    });

    it('debería denegar acceso con rol incorrecto', () => {
      // Arrange
      const req = {
        user: { rol: 'cliente' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      const middleware = requireRole('admin');
      
      // Act
      middleware(req, res, next);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});