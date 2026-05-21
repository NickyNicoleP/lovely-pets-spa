# 🔐 INSTALACIÓN Y CONFIGURACIÓN DE SEGURIDAD

## 📦 Paso 1: Instalar Dependencia Nueva

```bash
cd backend
npm install cookie-parser
```

**Dependencias Requeridas** (ya instaladas):
- bcryptjs (contraseñas)
- jsonwebtoken (JWT)
- otplib (2FA)
- qrcode (QR para 2FA)
- mysql2 (BD)
- dotenv (variables de entorno)

---

## 🔑 Paso 2: Configurar Variables de Entorno (.env)

Crear/editar archivo `backend/.env`:

```bash
# ==========================================
# ⚠️ SEGURIDAD - CONFIGURACIÓN CRÍTICA
# ==========================================

# 1. JWT
JWT_SECRET=tu_clave_secreta_muy_larga_minimo_32_caracteres_aleatorios
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# 2. CIFRADO DE DATOS SENSIBLES
# Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# 3. BASE DE DATOS
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pawspa_db
DB_CHARSET=utf8mb4_unicode_ci

# 4. FRONTEND
FRONTEND_URL=http://localhost:5173

# 5. SERVIDOR
NODE_ENV=development
PORT=3000

# 6. PRODUCCIÓN - HTTPS
# NODE_ENV=production
# SSL_KEY_PATH=/etc/ssl/private/server.key
# SSL_CERT_PATH=/etc/ssl/certs/server.crt
# SSL_CA_PATH=/etc/ssl/certs/ca-bundle.crt

# 7. RATE LIMITING
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=900000

# 8. EMAIL (opcional - para recuperación de contraseña)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tu_email@gmail.com
# SMTP_PASS=tu_contraseña_app
```

**⚠️ NOTAS IMPORTANTES:**
1. Nunca compartir `.env` en control de versiones
2. Usar claves diferentes para producción
3. JWT_SECRET mínimo 32 caracteres aleatorios
4. ENCRYPTION_KEY debe ser exactamente 64 caracteres hex (32 bytes)

---

## 🗄️ Paso 3: Crear Tabla de Checklist

```bash
# Desde CLI de MySQL
mysql -u root -p pawspa_db < backend/migrations_checklist.sql

# O conectarse a DB y ejecutar:
source backend/migrations_checklist.sql;
```

---

## 🧪 Paso 4: Ejecutar Tests

```bash
cd backend

# Tests de RBAC y Autenticación
npm test -- auth.rbac.test.js

# Tests de Validación de Propiedad
npm test -- ownership.test.js

# Tests de Checklist
npm test -- checklist.test.js

# Todos los tests con cobertura
npm test -- --coverage
```

---

## ✅ Paso 5: Validar Instalación

### Opción A: Script Bash (Linux/Mac)
```bash
cd backend
bash test-security.sh
```

### Opción B: Script PowerShell (Windows)
```powershell
cd backend
powershell -ExecutionPolicy Bypass -File test-security.ps1
```

### Opción C: Manual con curl

```bash
# Test 1: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!"}'

# Test 2: Acceder a ruta protegida (reemplazar $TOKEN)
curl -X GET http://localhost:3000/api/mascotas \
  -H "Authorization: Bearer $TOKEN"

# Test 3: Sin token (rechazado)
curl -X GET http://localhost:3000/api/mascotas
```

---

## 🚀 Paso 6: Iniciar Servidor en Desarrollo

```bash
cd backend

# Con nodemon (desarrollo)
npm run dev

# O manual
node src/index.js
```

**Esperado:** Servidor en `http://localhost:3000`

---

## 📱 Paso 7: Preparar Frontend para CSRF

En archivo de API del frontend (ej: `src/services/api.js`):

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true  // Importante para cookies CSRF
});

// Interceptor para agregar CSRF token
api.interceptors.request.use((config) => {
  const csrfToken = localStorage.getItem('csrf_token');
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Interceptor para guardar CSRF token del login
api.interceptors.response.use((response) => {
  if (response.data?._csrf) {
    localStorage.setItem('csrf_token', response.data._csrf.token);
    localStorage.setItem('csrf_hash', response.data._csrf.hash);
  }
  return response;
});

export default api;
```

---

## 🔍 Verificación Final

Confirmar que estos archivos existen:

```bash
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.js ✅ (mejorado)
│   │   ├── rateLimiter.js ✅ (nuevo)
│   │   ├── checklistValidator.js ✅ (nuevo)
│   │   └── csrfProtection.js ✅ (nuevo)
│   ├── utils/
│   │   ├── encryption.js ✅ (nuevo)
│   │   ├── encryptionExamples.js ✅ (nuevo)
│   │   └── httpsConfig.js ✅ (nuevo)
│   ├── routes/
│   │   ├── auth.js ✅ (modificado)
│   │   ├── mascotas.js ✅ (modificado)
│   │   └── fichaGrooming.js ✅ (modificado)
│   ├── controllers/
│   │   ├── authController.js ✅ (modificado)
│   │   ├── mascotaController.js ✅ (modificado)
│   │   └── fichaGroomingController.js ✅ (modificado)
│   ├── services/
│   │   └── mascotaService.js ✅ (modificado)
│   └── index.js ✅ (modificado)
├── tests/
│   ├── auth.rbac.test.js ✅ (nuevo)
│   ├── ownership.test.js ✅ (nuevo)
│   └── checklist.test.js ✅ (nuevo)
├── test-security.sh ✅ (nuevo)
├── test-security.ps1 ✅ (nuevo)
├── migrations_checklist.sql ✅ (nuevo)
└── package.json ✅ (actualizar si es necesario)
```

---

## 🐛 Troubleshooting

### Error: "ENCRYPTION_KEY en .env debe tener al menos 32 caracteres"
**Solución:** Generar clave válida:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copiar output a ENCRYPTION_KEY en .env

### Error: "Table 'FICHA_GROOMING_CHECKLIST' doesn't exist"
**Solución:** Ejecutar migration:
```bash
mysql -u root -p pawspa_db < backend/migrations_checklist.sql
```

### Error: "cookie-parser not found"
**Solución:** Instalar dependencia:
```bash
npm install cookie-parser
```

### Error: "CORS error"
**Solución:** Verificar FRONTEND_URL en .env coincida con donde corre React

### Tests fallan
**Solución:** 
1. Asegurar JWT_SECRET está configurado en .env
2. Ejecutar `npm install`
3. Verificar que el servidor no está corriendo en puerto 3000

---

## 📊 Configuración Recomendada por Ambiente

### Desarrollo (`NODE_ENV=development`)
```bash
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-me-in-production
ENCRYPTION_KEY=0102030405060708090a0b0c0d0e0f100102030405060708090a0b0c0d0e0f10
DB_HOST=localhost
FRONTEND_URL=http://localhost:5173
```

### Producción (`NODE_ENV=production`)
```bash
NODE_ENV=production
JWT_SECRET=GENERAR_UNA_CLAVE_ALEATORIA_MUY_LARGA
ENCRYPTION_KEY=GENERAR_CON_OPENSSL_O_NODE
DB_HOST=bd-production.company.com
DB_USER=app_user
DB_PASSWORD=CONTRASEÑA_SEGURA
FRONTEND_URL=https://pawspa.com
SSL_KEY_PATH=/etc/ssl/private/pawspa.key
SSL_CERT_PATH=/etc/ssl/certs/pawspa.crt
PORT=443
```

---

## 🎓 Documentación Adicional

- **SECURITY_GUIDE.md** - Ejemplos detallados de uso y pruebas
- **SECURITY_IMPLEMENTATION.md** - Matriz de cambios y validaciones
- **tests/** - Suite completa de tests de seguridad

---

## ✅ Checklist de Instalación

- [ ] Dependencias instaladas (`npm install cookie-parser`)
- [ ] .env configurado con ENCRYPTION_KEY válido
- [ ] Tabla FICHA_GROOMING_CHECKLIST creada
- [ ] Tests ejecutados correctamente
- [ ] Script de pruebas de seguridad pasado
- [ ] Frontend preparado para CSRF token
- [ ] Servidor iniciado sin errores
- [ ] Documentación leída

---

¡Listo! Tu sistema está seguro y protegido. 🔐🎉
