# ⚡ QUICK REFERENCE - Comandos de Seguridad

## 🚀 Inicio Rápido

```bash
# 1. Instalar dependencia
npm install cookie-parser

# 2. Configurar .env (copiar template)
cat > .env << EOF
JWT_SECRET=tu-clave-secreta-cambiar-en-produccion
ENCRYPTION_KEY=0102030405060708090a0b0c0d0e0f100102030405060708090a0b0c0d0e0f10
DB_HOST=localhost
DB_USER=root
DB_NAME=pawspa_db
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
EOF

# 3. Crear tabla de checklist
mysql -u root pawspa_db < migrations_checklist.sql

# 4. Ejecutar tests
npm test

# 5. Iniciar servidor
npm run dev
```

---

## 🧪 Pruebas Rápidas

```bash
# Suite de seguridad (bash)
bash test-security.sh

# Suite de seguridad (PowerShell)
powershell -ExecutionPolicy Bypass -File test-security.ps1

# Tests de RBAC
npm test -- auth.rbac.test.js

# Tests de propiedad
npm test -- ownership.test.js

# Tests de checklist
npm test -- checklist.test.js
```

---

## 🔑 Generar Claves Aleatorias

```bash
# JWT Secret (32+ caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_KEY (exactamente 64 caracteres hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Certificado autofirmado (1 año)
openssl req -x509 -newkey rsa:4096 -keyout private.key \
  -out certificate.crt -days 365 -nodes \
  -subj "/CN=localhost"
```

---

## 📝 curl - Ejemplos Rápidos

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}' \
  | jq -r '.token')

# Usar token
curl -X GET http://localhost:3000/api/mascotas \
  -H "Authorization: Bearer $TOKEN"

# Con CSRF
curl -X POST http://localhost:3000/api/mascotas \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Fluffy","especie":"gato"}'

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Ver headers de seguridad
curl -I http://localhost:3000/api/health
```

---

## 📊 Variables de Entorno

```bash
# Copiar a .env
JWT_SECRET=                    # Generar
JWT_EXPIRY=1h                  # Cambiar si es necesario
ENCRYPTION_KEY=                # Generar
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pawspa_db
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=900000
```

---

## 🔍 Debugging

```bash
# Ver logs con máximo detalle
NODE_ENV=development npm run dev -- --trace-uncaught

# Ejecutar un test con output detallado
npm test -- auth.rbac.test.js --verbose

# Debugger de Node
node --inspect src/index.js
# Luego: chrome://inspect

# Ver estructura de token JWT
echo "token_aqui" | jq -R 'split(".") | .[1] | @base64d | fromjson'
```

---

## 📱 Integración Frontend (React)

```javascript
// 1. Guardar token después de login
const { token, _csrf } = loginResponse;
localStorage.setItem('token', token);
localStorage.setItem('csrf_token', _csrf.token);

// 2. En requests API
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'X-CSRF-Token': localStorage.getItem('csrf_token')
};

// 3. Interceptor Axios
axios.interceptors.request.use(config => {
  config.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  config.headers['X-CSRF-Token'] = localStorage.getItem('csrf_token');
  return config;
});

// 4. Logout
localStorage.removeItem('token');
localStorage.removeItem('csrf_token');
```

---

## 🚨 Validar Seguridad

```bash
# Checklist de activación
echo "✓ JWT" &&
echo "✓ Rate Limiting" &&
echo "✓ RBAC" &&
echo "✓ CSRF" &&
echo "✓ Propiedad de Datos" &&
echo "✓ Checklist Obligatorio" &&
echo "✓ Cifrado" &&
echo "✓ HTTPS Headers"

# Ver que middlewares están activos
grep -r "validateCSRF\|forceHTTPS\|requireRole" src/index.js

# Contar tests
find tests -name "*.test.js" | wc -l
```

---

## 🔒 Producción - Checklist

```bash
# Antes de deployar
NODE_ENV=production

# Generar nuevas claves
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Certificado SSL
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CERT_PATH=/etc/ssl/certs/server.crt

# BD en producción (no localhost)
DB_HOST=bd.production.com
DB_USER=app_user

# Forzar HTTPS
X-Forwarded-Proto: https

# Verificar headers de seguridad
curl -I https://pawspa.com/api/health | grep -i "strict-transport\|x-frame"
```

---

## 📊 Estructura de Carpetas Nuevas

```
backend/
├── src/
│   ├── middleware/
│   │   ├── auth.js (MEJORADO)
│   │   ├── rateLimiter.js (⭐ NUEVO)
│   │   ├── checklistValidator.js (⭐ NUEVO)
│   │   └── csrfProtection.js (⭐ NUEVO)
│   └── utils/
│       ├── encryption.js (⭐ NUEVO)
│       ├── encryptionExamples.js (⭐ NUEVO)
│       └── httpsConfig.js (⭐ NUEVO)
└── tests/
    ├── auth.rbac.test.js (⭐ NUEVO)
    ├── ownership.test.js (⭐ NUEVO)
    └── checklist.test.js (⭐ NUEVO)
```

---

## 🎯 Endpoints Clave

```
POST   /api/auth/login              ← Rate Limited
POST   /api/auth/logout             ← Token Invalidado
GET    /api/mascotas                ← RBAC + Propiedad
GET    /api/mascotas/:id            ← RBAC + Propiedad
POST   /api/ficha-grooming/:id/cerrar ← Checklist Requerido
GET    /api/ficha-grooming/:id/checklist ← Ver estado
PUT    /api/ficha-grooming/:id/checklist/:itemKey ← Actualizar
```

---

## 📚 Documentación

```
├── SECURITY_GUIDE.md              (Guía detallada + ejemplos)
├── SECURITY_IMPLEMENTATION.md     (Matriz de cambios)
├── INSTALLATION_GUIDE.md          (Pasos de instalación)
├── QUICK_REFERENCE.md             (Este archivo)
├── migrations_checklist.sql       (Schema de BD)
├── test-security.sh               (Script bash)
└── test-security.ps1              (Script PowerShell)
```

---

## ⚡ Tips Pro

```bash
# 1. Regenerar todos los tokens
npm run dev

# 2. Limpiar base de datos y tokens
npm test -- --clearCache

# 3. Monitorear cambios
npm run dev -- --watch

# 4. Ejecutar un endpoint específico
npm test -- --testNamePattern="Admin debe acceder"

# 5. Generar reporte de cobertura
npm test -- --coverage --coverageReporters=html

# 6. Ver reporte (abrir en navegador)
open coverage/index.html
```

---

## 🆘 SOS - Soluciones Rápidas

| Problema | Solución |
|----------|----------|
| Token inválido | Regenerar en login |
| Rate limit bloqueado | Esperar 15 min |
| CSRF token faltante | Agregar X-CSRF-Token header |
| Acceso denegado | Verificar rol con `jq` |
| BD no conecta | Verificar .env y `mysql -u root` |
| Tests fallan | `npm install` y `npm test` |
| Servidor no inicia | Puert 3000 en uso: `lsof -i :3000` |

---

¡Listo para el pentesting! 🚀🔒
