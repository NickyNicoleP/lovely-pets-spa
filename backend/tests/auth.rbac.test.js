/**
 * Tests de Autenticación y RBAC
 * Verifica que los roles funcionen correctamente y un groomer no pueda acceder a rutas de admin
 */

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole, validateOwnershipOrAdmin } = require('../middleware/auth');

// Crear app de prueba
const app = express();
app.use(express.json());

// Variables globales para tests
let adminToken, gromerToken, clienteToken, invalidToken;

const mockUserId = 1;
const mockAdminId = 2;
const mockGromerId = 3;

/**
 * Génera tokens JWT de prueba
 */
function generateTestToken(userId, role) {
  return jwt.sign(
    { id: userId, rol: role, email: `test_${role}@example.com` },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
}

// Configurar tokens antes de los tests
beforeAll(() => {
  adminToken = generateTestToken(mockAdminId, 'admin');
  gromerToken = generateTestToken(mockGromerId, 'groomer');
  clienteToken = generateTestToken(mockUserId, 'cliente');
  invalidToken = 'invalid.token.here';
});

/**
 * TEST 1: Middleware authenticateToken
 */
describe('Middleware: authenticateToken', () => {
  const protectedRoute = (req, res) => {
    res.json({ userId: req.user.id, rol: req.user.rol });
  };

  app.get('/api/test/protected', authenticateToken, protectedRoute);

  test('✅ Debe permitir acceso con token válido', async () => {
    const response = await request(app)
      .get('/api/test/protected')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(mockAdminId);
    expect(response.body.rol).toBe('admin');
  });

  test('❌ Debe rechazar sin token', async () => {
    const response = await request(app)
      .get('/api/test/protected');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Token de acceso requerido');
  });

  test('❌ Debe rechazar con token inválido', async () => {
    const response = await request(app)
      .get('/api/test/protected')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('Token inválido');
  });
});

/**
 * TEST 2: Middleware requireRole
 */
describe('Middleware: requireRole', () => {
  const adminRoute = (req, res) => {
    res.json({ message: 'Admin access granted', rol: req.user.rol });
  };

  app.post('/api/test/admin-only', authenticateToken, requireRole('admin'), adminRoute);
  app.post('/api/test/groomer-only', authenticateToken, requireRole('groomer'), adminRoute);

  test('✅ Admin debe acceder a ruta de admin', async () => {
    const response = await request(app)
      .post('/api/test/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('granted');
  });

  test('❌ Groomer NO debe acceder a ruta de admin', async () => {
    const response = await request(app)
      .post('/api/test/admin-only')
      .set('Authorization', `Bearer ${gromerToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('No autorizado');
    expect(response.body.userRole).toBe('groomer');
  });

  test('❌ Cliente NO debe acceder a ruta de groomer', async () => {
    const response = await request(app)
      .post('/api/test/groomer-only')
      .set('Authorization', `Bearer ${clienteToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('No autorizado');
  });

  test('✅ Groomer debe acceder a ruta de groomer', async () => {
    const response = await request(app)
      .post('/api/test/groomer-only')
      .set('Authorization', `Bearer ${gromerToken}`);

    expect(response.status).toBe(200);
  });
});

/**
 * TEST 3: Validación de roles múltiples
 */
describe('RBAC: Roles múltiples', () => {
  const multiRoleRoute = (req, res) => {
    res.json({ message: 'Access granted' });
  };

  app.delete('/api/test/admin-empleado', authenticateToken, requireRole(['admin', 'empleado']), multiRoleRoute);

  test('✅ Admin debe acceder a ruta admin/empleado', async () => {
    const response = await request(app)
      .delete('/api/test/admin-empleado')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test('❌ Groomer NO debe acceder a ruta admin/empleado', async () => {
    const response = await request(app)
      .delete('/api/test/admin-empleado')
      .set('Authorization', `Bearer ${gromerToken}`);

    expect(response.status).toBe(403);
  });
});

module.exports = { generateTestToken };
