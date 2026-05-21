# 🐾 Lovely Pets Spa - Sistema de Gestión Veterinaria

Sistema completo y **seguro** de gestión para spa de mascotas con autenticación JWT, 2FA, control de acceso por roles, validación de propiedad de datos y protecciones contra ataques web.

> **Versión 2.0 con 9+ Medidas de Seguridad Implementadas** 🔐

---

## 🚀 Características Principales

### ✅ Seguridad Avanzada
- **🔐 Autenticación JWT** + Blacklist en logout
- **🔑 2FA** con Google Authenticator (TOTP)
- **🛡️ Rate Limiting** - Bloqueo 15 min después de 5 intentos fallidos
- **👥 RBAC** - Control de acceso por roles (admin, empleado, groomer, cliente, veterinario)
- **🔒 Validación de Propiedad** - Cliente A no ve datos de Cliente B
- **✔️ Checklist Obligatorio** - 9 ítems antes de cerrar ficha de grooming
- **🌐 Protección CSRF** - Tokens únicos por sesión
- **🔓 Cifrado AES-256-GCM** - Para PII y datos de pagos
- **🔗 HTTPS Forzado** - En producción con headers de seguridad

### 📋 Funcionalidades
- **Gestión de Mascotas** - Perfiles con fotos, historial médico
- **Agenda Inteligente** - Reservas con cálculo automático de horarios
- **Ficha de Grooming** - Checklist obligatorio con 9 ítems de validación
- **Inventario Automático** - Trigger MySQL para control de stock
- **Auditoría Completa** - Logs de login, acciones y movimientos
- **Carrito de Compras** - Para productos y servicios
- **Notificaciones** - En tiempo real vía WebSocket

---

## 📋 Requisitos

- **Node.js** 18+
- **MySQL** 8.0+
- **XAMPP** (recomendado para Windows)
- **npm** 9+

---

## 🛠️ Instalación Rápida

### 1. Instalar Dependencia Nueva

```bash
cd backend
npm install cookie-parser
```

### 2. Configurar Variables de Entorno

Crear archivo `backend/.env`:

```bash
# JWT
JWT_SECRET=tu_clave_secreta_muy_larga_minimo_32_caracteres
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# CIFRADO (Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pawspa_db
DB_CHARSET=utf8mb4_unicode_ci

# Frontend
FRONTEND_URL=http://localhost:5173

# Servidor
NODE_ENV=development
PORT=3000
```

> Ver **INSTALLATION_GUIDE.md** para configuración completa

### 3. Base de Datos

```bash
# Crear BD principal
mysql -u root pawspa_db < backend/database.sql

# Crear tabla de checklist
mysql -u root pawspa_db < backend/migrations_checklist.sql
```

### 4. Frontend

```bash
cd frontend
npm install
```

---

## ▶️ Ejecución

### Backend

```bash
cd backend
npm run dev
```
**URL**: `http://localhost:3000`

### Frontend

```bash
cd frontend
npm run dev
```
**URL**: `http://localhost:5173`

---

## 🧪 Tests y Validación

```bash
cd backend

# Ejecutar suite completa
npm test

# Tests específicos
npm test -- auth.rbac.test.js        # RBAC y autenticación
npm test -- ownership.test.js        # Validación de propiedad
npm test -- checklist.test.js        # Checklist obligatorio

# Script de seguridad (Windows)
powershell -ExecutionPolicy Bypass -File test-security.ps1

# Script de seguridad (Linux/Mac)
bash test-security.sh
```

---

## 📱 Endpoints de API

### Autenticación
```
POST   /api/auth/register           - Registrar usuario
POST   /api/auth/login              - Iniciar sesión (Rate Limited)
POST   /api/auth/verify-2fa         - Verificar 2FA
POST   /api/auth/refresh            - Refresh token
POST   /api/auth/logout             - Cerrar sesión (Invalida token)
GET    /api/auth/profile            - Obtener perfil
PUT    /api/auth/profile            - Actualizar perfil
POST   /api/auth/2fa/setup          - Configurar 2FA
POST   /api/auth/2fa/enable         - Habilitar 2FA
POST   /api/auth/2fa/disable        - Deshabilitar 2FA
```

### Clientes
```
GET    /api/clientes                - Listar (admin solo)
GET    /api/clientes/:id            - Obtener (admin o dueño)
POST   /api/clientes                - Crear (admin)
PUT    /api/clientes/:id            - Actualizar (admin o dueño)
DELETE /api/clientes/:id            - Eliminar (admin)
```

### Mascotas (con validación de propiedad)
```
GET    /api/mascotas                - Listar (filtra por usuario)
GET    /api/mascotas/:id            - Obtener (owner o admin)
POST   /api/mascotas                - Crear (admin/empleado)
PUT    /api/mascotas/:id            - Actualizar (owner o admin)
DELETE /api/mascotas/:id            - Eliminar (admin)
```

### Ficha Grooming (con checklist)
```
GET    /api/ficha-grooming          - Listar
GET    /api/ficha-grooming/:id      - Obtener
POST   /api/ficha-grooming          - Crear
GET    /api/ficha-grooming/:id/checklist           - Ver estado checklist
PUT    /api/ficha-grooming/:id/checklist/:itemKey  - Actualizar item
POST   /api/ficha-grooming/:id/cerrar              - Cerrar (requiere 100% checklist)
```

### Servicios
```
GET    /api/servicios               - Listar
GET    /api/servicios/:id           - Obtener
POST   /api/servicios               - Crear (admin)
PUT    /api/servicios/:id           - Actualizar (admin)
DELETE /api/servicios/:id           - Eliminar (admin)
```

### Productos
```
GET    /api/productos               - Listar
GET    /api/productos/low-stock     - Bajo stock
GET    /api/productos/:id           - Obtener
POST   /api/productos               - Crear (admin)
PUT    /api/productos/:id           - Actualizar (admin)
DELETE /api/productos/:id           - Eliminar (admin)
```

### Agenda
```
GET    /api/agenda                  - Listar reservas
GET    /api/agenda/horarios         - Horarios disponibles
GET    /api/agenda/:id              - Obtener reserva
POST   /api/agenda                  - Crear reserva
PUT    /api/agenda/:id              - Actualizar reserva
DELETE /api/agenda/:id              - Eliminar reserva
```

### Auditoría
```
GET    /api/audit/login             - Logs de login
GET    /api/audit                   - Logs completos
```

---

## 🔐 Roles de Usuario

| Rol | Permisos |
|-----|----------|
| **admin** | Acceso completo, gestión de usuarios, configuración |
| **empleado** | Agenda, grooming, inventario, clientes |
| **groomer** | Solo su agenda de grooming y fichas asignadas |
| **cliente** | Ve sus mascotas, crea reservas, ve historial |
| **veterinario** | Acceso a historiales médicos (opcional) |

---

## 🛡️ Ejemplos de Seguridad

### Rate Limiting (5 intentos = 15 min bloqueado)
```bash
# Intento 6 devuelve:
{
  "error": "Demasiados intentos. Intente en 900 segundos",
  "retryAfter": 900
}
```

### Validación de Propiedad
```bash
# Cliente A intenta acceder a mascota de Cliente B
curl -X GET http://localhost:3000/api/mascotas/999 \
  -H "Authorization: Bearer $TOKEN_CLIENTE_A"

# Respuesta:
{
  "error": "Acceso denegado",
  "statusCode": 403
}
```

### Checklist Obligatorio
```bash
# Intenta cerrar ficha sin completar checklist
curl -X POST http://localhost:3000/api/ficha-grooming/1/cerrar \
  -H "Authorization: Bearer $TOKEN"

# Respuesta:
{
  "error": "Checklist incompleto",
  "missingItems": ["baño", "secado", "foto_despues"],
  "completion": "66%"
}
```

### CSRF Protection
```bash
# Sin X-CSRF-Token header en POST/PUT/DELETE
curl -X POST http://localhost:3000/api/mascotas \
  -H "Authorization: Bearer $TOKEN"

# Respuesta:
{
  "error": "CSRF token inválido o faltante",
  "statusCode": 403
}
```

---

## 📊 Estructura del Proyecto

```
Pet_Spa_Sist/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuración
│   │   ├── controllers/      # Controladores
│   │   ├── middleware/       # Middlewares de seguridad
│   │   │   ├── auth.js       # JWT + RBAC + Propiedad
│   │   │   ├── rateLimiter.js        # Rate limiting
│   │   │   ├── checklistValidator.js # Checklist
│   │   │   └── csrfProtection.js     # CSRF tokens
│   │   ├── routes/           # Rutas
│   │   ├── services/         # Lógica de negocio
│   │   ├── utils/            # Utilidades
│   │   │   ├── encryption.js        # AES-256-GCM
│   │   │   └── httpsConfig.js       # HTTPS + headers
│   │   └── index.js          # Punto de entrada
│   ├── tests/                # Tests de seguridad
│   ├── database.sql          # Schema principal
│   ├── migrations_checklist.sql
│   ├── test-security.sh
│   ├── test-security.ps1
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## 📚 Documentación

- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Pasos de instalación detallados
- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Guía de seguridad con ejemplos
- **[SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md)** - Detalles técnicos
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Comandos rápidos

---

## 🧪 CI/CD y Tests

```bash
# Ejecutar todos los tests
npm test

# Con cobertura
npm test -- --coverage

# Tests en modo watch
npm test -- --watch
```

---

## 🚀 Deployment a Producción

### Configuración de .env (Producción)

```bash
NODE_ENV=production
JWT_SECRET=generar_clave_aleatoria_segura
ENCRYPTION_KEY=generar_clave_aleatoria_segura
DB_HOST=db.production.com
DB_USER=app_user
DB_PASSWORD=contraseña_segura
FRONTEND_URL=https://pawspa.com
SSL_KEY_PATH=/etc/ssl/private/server.key
SSL_CERT_PATH=/etc/ssl/certs/server.crt
PORT=443
```

### Build y Deploy

```bash
# Instalar dependencias de producción
npm install --production

# Ejecutar tests
npm test

# Iniciar servidor
npm start
```

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| `ENCRYPTION_KEY en .env debe tener al menos 32 caracteres` | Generar: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `Table 'FICHA_GROOMING_CHECKLIST' doesn't exist` | Ejecutar: `mysql -u root pawspa_db < backend/migrations_checklist.sql` |
| `cookie-parser not found` | Ejecutar: `npm install cookie-parser` |
| Tests fallan | Ejecutar: `npm install` y verificar .env |
| CORS error | Verificar FRONTEND_URL en .env |
| Rate limit bloqueado | Esperar 15 minutos o reiniciar servidor |

---

## 🔐 Matriz de Seguridad

| Ataque | Prevención | Validación |
|--------|-----------|------------|
| **Fuerza Bruta** | Rate limiting (5 intentos/15 min) | `test-security.ps1` |
| **SQL Injection** | Queries preparadas | All services |
| **XSS** | CSP headers | Security headers |
| **CSRF** | Tokens únicos por sesión | X-CSRF-Token requerido |
| **Escalamiento de Privilegios** | RBAC por endpoint | Tests/ownership |
| **Acceso Cruzado** | Validación de propiedad | Cliente A ≠ datos Cliente B |
| **Operaciones Incompletas** | Checklist obligatorio | 9/9 ítems requeridos |
| **Token Hijacking** | Blacklist en logout | Token inválido post-logout |

---

## 📝 Notas

- El sistema usa **prepared statements** para prevenir SQL injection
- 2FA implementa **TOTP** (Time-based One-Time Password)
- Logs de auditoría registran **IP y userAgent** en cada acción
- Checklist tiene **9 ítems obligatorios** antes de cerrar ficha
- Rate limiting usa **memoria en desarrollo** (Redis recomendado en producción)

---

## 📄 Licencia

MIT License

---

**¿Preguntas?** Consulta la documentación en `SECURITY_GUIDE.md` o ejecuta los tests para validar la instalación. 🔐
