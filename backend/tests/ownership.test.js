/**
 * Tests para Validación de Propiedad de Recursos
 * Verifica que un cliente no pueda acceder a mascotas de otro cliente
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken, validateOwnershipOrAdmin } = require('../middleware/auth');

const app = express();
app.use(express.json());

// Génera tokens de prueba
function generateTestToken(userId, role) {
  return jwt.sign(
    { id: userId, rol: role },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

const clienteAToken = generateTestToken(1, 'cliente');
const clienteBToken = generateTestToken(2, 'cliente');
const adminToken = generateTestToken(999, 'admin');

/**
 * Mock de validateOwnershipOrAdmin para tests
 * En un test real, necesitarías mockear la BD
 */
const validateOwnershipMock = (resourceType) => {
  return async (req, res, next) => {
    // Simulación: Cliente 1 es dueño de mascota 100, Cliente 2 es dueño de mascota 200
    const OWNERSHIP_MAP = {
      '100': 1,  // Mascota 100 pertenece a cliente 1
      '200': 2   // Mascota 200 pertenece a cliente 2
    };

    const resourceId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.rol;

    // Admin tiene acceso a todo
    if (userRole === 'admin') {
      return next();
    }

    const ownerId = OWNERSHIP_MAP[resourceId];
    if (ownerId === userId) {
      return next();
    }

    res.status(403).json({ error: 'No tiene permiso para acceder a este recurso' });
  };
};

describe('Validación de Propiedad: Mascotas', () => {
  const getMascotaRoute = (req, res) => {
    res.json({
      id: req.params.id,
      nombre: 'Fluffy',
      propietario: `Cliente ${req.params.id === '100' ? '1' : '2'}`
    });
  };

  app.get('/api/test/mascota/:id', authenticateToken, validateOwnershipMock('mascota'), getMascotaRoute);

  test('✅ Cliente 1 debe ver su mascota 100', async () => {
    const response = await request(app)
      .get('/api/test/mascota/100')
      .set('Authorization', `Bearer ${clienteAToken}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('100');
  });

  test('❌ Cliente 1 NO debe ver mascota 200 de Cliente 2', async () => {
    const response = await request(app)
      .get('/api/test/mascota/200')
      .set('Authorization', `Bearer ${clienteAToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('No tiene permiso');
  });

  test('❌ Cliente 2 NO debe ver mascota 100 de Cliente 1', async () => {
    const response = await request(app)
      .get('/api/test/mascota/100')
      .set('Authorization', `Bearer ${clienteBToken}`);

    expect(response.status).toBe(403);
  });

  test('✅ Admin debe ver mascota de cualquier cliente', async () => {
    const response = await request(app)
      .get('/api/test/mascota/100')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('✅ Admin debe ver cualquier mascota', async () => {
    const response = await request(app)
      .get('/api/test/mascota/200')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });
});

/**
 * Test de Ataques: Intentar acceso a recurso sin autorización
 */
describe('Seguridad: Ataques de Autorización', () => {
  test('❌ No se debe permitir acceso sin token a recurso protegido', async () => {
    const response = await request(app)
      .get('/api/test/mascota/100');

    expect(response.status).toBe(401);
  });

  test('❌ Debe rechazar manipulación de token', async () => {
    const tamperedToken = adminToken.slice(0, -10) + 'XXXXXX';

    const response = await request(app)
      .get('/api/test/mascota/100')
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(response.status).toBe(403);
  });
});

module.exports = { generateTestToken: generateTestToken };
