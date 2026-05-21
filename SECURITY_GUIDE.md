# 📋 GUÍA COMPLETA DE SEGURIDAD - Lovely Pets Spa

## 🔐 Medidas de Seguridad Implementadas

### 1. ✅ AUTENTICACIÓN Y AUTORIZACIÓN

#### Login con Rate Limiting
```bash
# ✅ Login exitoso
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "groomer@pawspa.com",
    "password": "SecurePass123!"
  }'

# Respuesta:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 3,
    "email": "groomer@pawspa.com",
    "rol": "groomer"
  }
}

# ❌ 5 intentos fallidos bloqueados por 15 minutos
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attacker@example.com",
    "password": "wrongpassword"
  }'

# Respuesta tras 5 intentos:
{
  "error": "Demasiados intentos de login fallidos. Por favor, intente más tarde.",
  "retryAfter": 900
}
```

#### Logout (Invalidar Token)
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "$REFRESH_TOKEN"}'

# Respuesta:
{
  "message": "Sesión cerrada correctamente"
}

# Después de logout, el token anterior NO funciona:
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $OLD_TOKEN"

# Respuesta:
{
  "error": "Sesión cerrada. Por favor, inicie sesión de nuevo."
}
```

---

### 2. ✅ CONTROL DE ACCESO POR ROLES (RBAC)

#### Admin accede a admin-only endpoint
```bash
# Generar token ADMIN
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pawspa.com",
    "password": "AdminPass123!"
  }' | jq -r '.token')

# ✅ Admin puede obtener todos los usuarios
curl -X GET http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Respuesta: [lista de usuarios]
```

#### Groomer intenta acceder (DEBERÍA SER RECHAZADO)
```bash
# Generar token GROOMER
GROOMER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "groomer@pawspa.com",
    "password": "GroomerPass123!"
  }' | jq -r '.token')

# ❌ Groomer NO puede obtener usuarios
curl -X GET http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer $GROOMER_TOKEN" \
  -H "Content-Type: application/json"

# Respuesta:
{
  "error": "No autorizado para esta acción",
  "userRole": "groomer",
  "requiredRoles": ["admin"]
}
```

#### Cliente intenta acceder a ruta de admin
```bash
# Generar token CLIENTE
CLIENT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "ClientPass123!"
  }' | jq -r '.token')

# ❌ Cliente NO puede crear usuarios
curl -X POST http://localhost:3000/api/auth/users \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "NewPass123!",
    "rol": "admin"
  }'

# Respuesta:
{
  "error": "No autorizado para esta acción",
  "userRole": "cliente",
  "requiredRoles": ["admin"]
}
```

---

### 3. ✅ VALIDACIÓN DE PROPIEDAD DE DATOS

#### Cliente 1 ve solo sus mascotas
```bash
# Cliente 1 obtiene sus mascotas
curl -X GET http://localhost:3000/api/mascotas \
  -H "Authorization: Bearer $CLIENT1_TOKEN" \
  -H "Content-Type: application/json"

# Respuesta: Solo mascotas del Cliente 1
[
  {
    "id": 100,
    "nombre": "Fluffy",
    "cliente_nombre": "Juan"
  }
]

# ✅ Cliente 1 obtiene mascota específica
curl -X GET http://localhost:3000/api/mascotas/100 \
  -H "Authorization: Bearer $CLIENT1_TOKEN"

# Respuesta: Mascota 100
{
  "id": 100,
  "nombre": "Fluffy",
  "especie": "gato"
}
```

#### Cliente 1 intenta acceder a mascota de Cliente 2 (RECHAZADO)
```bash
# ❌ Cliente 1 NO puede acceder a mascota 200 (de Cliente 2)
curl -X GET http://localhost:3000/api/mascotas/200 \
  -H "Authorization: Bearer $CLIENT1_TOKEN"

# Respuesta:
{
  "error": "No tiene permiso para acceder a este recurso"
}
```

#### Admin PUEDE acceder a cualquier mascota
```bash
# ✅ Admin accede a mascota de cualquier cliente
curl -X GET http://localhost:3000/api/mascotas/200 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Respuesta: Mascota 200
{
  "id": 200,
  "nombre": "Max",
  "especie": "perro"
}
```

---

### 4. ✅ VALIDACIÓN DE CHECKLIST ANTES DE CERRAR FICHA

#### Groomer obtiene checklist incompleto
```bash
# Ver checklist actual de ficha
curl -X GET http://localhost:3000/api/ficha-grooming/1/checklist \
  -H "Authorization: Bearer $GROOMER_TOKEN"

# Respuesta:
{
  "fichaId": 1,
  "totalItems": 9,
  "completedItems": 6,
  "percentage": 67,
  "isComplete": false,
  "pendingItems": [
    { "id": "foto_despues", "nombre": "Foto Después" },
    { "id": "notas_groomer", "nombre": "Notas del Groomer" },
    { "id": "firma_cliente", "nombre": "Firma/Aprobación del Cliente" }
  ]
}
```

#### Intenta cerrar ficha CON CHECKLIST INCOMPLETO (RECHAZADO)
```bash
# ❌ Intento de cerrar sin completar checklist
curl -X POST http://localhost:3000/api/ficha-grooming/1/cerrar \
  -H "Authorization: Bearer $GROOMER_TOKEN" \
  -H "Content-Type: application/json"

# Respuesta:
{
  "error": "No se puede cerrar la ficha. Ítems del checklist pendientes:",
  "missingItems": [
    { "id": "foto_despues", "nombre": "Foto Después" },
    { "id": "notas_groomer", "nombre": "Notas del Groomer" },
    { "id": "firma_cliente", "nombre": "Firma/Aprobación del Cliente" }
  ],
  "completed": "6/9",
  "statusCode": "CHECKLIST_INCOMPLETE"
}
```

#### Completa ítems del checklist
```bash
# Completar ítem: foto_despues
curl -X PUT http://localhost:3000/api/ficha-grooming/1/checklist/foto_despues \
  -H "Authorization: Bearer $GROOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Respuesta:
{
  "message": "Ítem del checklist actualizado",
  "itemKey": "foto_despues",
  "completed": true,
  "checklistSummary": {
    "fichaId": 1,
    "totalItems": 9,
    "completedItems": 7,
    "percentage": 78,
    "isComplete": false
  }
}

# Repetir para todos los ítems restantes...
```

#### ✅ Cierra ficha CON CHECKLIST COMPLETO
```bash
# Después de completar todos los ítems:
# Ver checklist al 100%
curl -X GET http://localhost:3000/api/ficha-grooming/1/checklist \
  -H "Authorization: Bearer $GROOMER_TOKEN"

# Respuesta:
{
  "fichaId": 1,
  "totalItems": 9,
  "completedItems": 9,
  "percentage": 100,
  "isComplete": true,
  "pendingItems": []
}

# ✅ AHORA SÍ se puede cerrar la ficha
curl -X POST http://localhost:3000/api/ficha-grooming/1/cerrar \
  -H "Authorization: Bearer $GROOMER_TOKEN" \
  -H "Content-Type: application/json"

# Respuesta:
{
  "id": 1,
  "estado": "finalizada",
  "fecha_cierre": "2026-05-21T14:30:00Z",
  "message": "Ficha de grooming cerrada exitosamente"
}
```

---

### 5. ✅ CSRF PROTECTION

#### Obtener CSRF token
```bash
# Al hacer login, recibirás CSRF token en la respuesta
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@pawspa.com",
    "password": "Pass123!"
  }'

# La respuesta incluye:
{
  "token": "...",
  "user": {...},
  "_csrf": {
    "token": "a1b2c3d4e5f6g7h8...",
    "hash": "abc123def456..."
  }
}
```

#### Usar CSRF token en operaciones de modificación
```bash
# Guardar cookie (contiene csrf_hash)
curl -X POST http://localhost:3000/api/mascotas \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-CSRF-Token: a1b2c3d4e5f6g7h8..." \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "nombre": "Bella",
    "especie": "perro",
    "raza": "Golden Retriever"
  }'

# Respuesta:
{
  "id": 101,
  "nombre": "Bella",
  "especie": "perro",
  "raza": "Golden Retriever"
}
```

#### ❌ Intento sin CSRF token (RECHAZADO)
```bash
# Sin header X-CSRF-Token
curl -X POST http://localhost:3000/api/mascotas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Bella",
    "especie": "perro"
  }'

# Respuesta:
{
  "error": "CSRF token faltante. Headers requerido: X-CSRF-Token",
  "statusCode": "CSRF_TOKEN_MISSING"
}
```

---

### 6. ✅ CONFIGURACIÓN DE SEGURIDAD EN HEADERS

Todos los endpoints retornan headers de seguridad:

```bash
curl -I http://localhost:3000/api/health

# Respuesta includes:
X-Frame-Options: DENY                    # Previene clickjacking
X-Content-Type-Options: nosniff          # Previene MIME sniffing
X-XSS-Protection: 1; mode=block          # Protección XSS
Content-Security-Policy: default-src 'self'  # CSP
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000  # HSTS (producción)
```

---

## 🧪 EJECUTAR TESTS

```bash
# Instalar dependencias si no lo hiciste
npm install

# Ejecutar todos los tests
npm test

# Ejecutar tests específicos
npm test -- auth.rbac.test.js
npm test -- ownership.test.js
npm test -- checklist.test.js

# Ejecutar con cobertura
npm test -- --coverage

# Watch mode (reejecutar al cambiar archivos)
npm test -- --watch
```

---

## 📝 EJEMPLO: FLOW COMPLETO CON POSTMAN

### 1. Crear Colección en Postman

```json
{
  "info": {
    "name": "Lovely Pets Spa - Seguridad",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth - Login",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.environment.set('token', pm.response.json().token)",
              "pm.environment.set('refreshToken', pm.response.json().refreshToken)",
              "pm.test('Status is 200', function() { pm.response.to.have.status(200); })"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "raw",
          "raw": "{\"email\":\"groomer@pawspa.com\",\"password\":\"SecurePass123!\"}"
        },
        "url": {
          "raw": "{{base_url}}/api/auth/login",
          "host": ["{{base_url}}"],
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "Mascotas - Obtener Mis Mascotas",
      "request": {
        "auth": {
          "type": "bearer",
          "bearer": [
            {"key": "token", "value": "{{token}}", "type": "string"}
          ]
        },
        "method": "GET",
        "url": {
          "raw": "{{base_url}}/api/mascotas",
          "host": ["{{base_url}}"],
          "path": ["api", "mascotas"]
        }
      }
    },
    {
      "name": "Ficha Grooming - Ver Checklist",
      "request": {
        "auth": {"type": "bearer", "bearer": [{"key": "token", "value": "{{token}}"}]},
        "method": "GET",
        "url": {"raw": "{{base_url}}/api/ficha-grooming/1/checklist"}
      }
    }
  ]
}
```

### 2. Configurar Variables en Postman
- `base_url`: `http://localhost:3000`
- `token`: (se obtiene automáticamente del login)
- `csrf_token`: (se obtiene de la respuesta del login)

---

## 🚨 ATAQUES COMUNES Y CÓMO SE PREVIENEN

| Ataque | Prevención | Verificación |
|--------|-----------|---------------|
| **SQL Injection** | Queries preparadas con placeholders `?` | Ver `src/services/` - todas usan `pool.execute()` |
| **Fuerza Bruta** | Rate limiting: 5 intentos = bloqueo 15min | Hacer 5 logins fallidos, 6to es rechazado |
| **Token Forgery** | JWT con firma criptográfica | Token sin validación es rechazado |
| **CSRF** | CSRF tokens únicos por sesión | POST sin X-CSRF-Token retorna 403 |
| **XSS** | CSP headers + sanitización | Headers tienen Content-Security-Policy |
| **Acceso Cruzado** | Validación de propiedad de datos | Cliente A no ve mascotas de Cliente B |
| **Escalamiento Privs** | RBAC strict en cada endpoint | Groomer no accede a rutas admin |
| **Checklist bypass** | Validación obligatoria antes de cerrar | Sin completar checklist, cierre rechazado |

---

## 🔧 CONFIGURACIÓN NECESARIA EN .env

```bash
# Autenticación
JWT_SECRET=tu_clave_secreta_muy_larga_minimo_32_caracteres
JWT_EXPIRY=1h

# Encriptación de datos sensibles
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Base de datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pawspa_db

# Frontend
FRONTEND_URL=http://localhost:5173

# Producción HTTPS
NODE_ENV=production
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt
SSL_CA_PATH=/path/to/ca-bundle.crt

# Rate limiting
RATE_LIMIT_MAX_ATTEMPTS=5
RATE_LIMIT_WINDOW_MS=900000
```

---

## 📊 DIAGRAMA DE FLUJO DE AUTENTICACIÓN

```
┌─────────────────┐
│   Cliente       │
└────────┬────────┘
         │ Login (email + password)
         ▼
┌─────────────────────┐
│ Rate Limit Check    │ ◄── Si > 5 intentos fallidos: BLOQUEADO
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│ Validar Credenciales│
└────────┬────────────┘
         │ OK
         ▼
┌─────────────────────┐
│ Generar JWT Token   │
│ + CSRF Token        │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐ ◄── Cada request PROTEGIDO
│ Request a Endpoint  │
│ Headers:            │
│ - Authorization     │
│ - X-CSRF-Token      │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│ Middleware Validation:   │
│ 1. Validar JWT           │
│ 2. Validar CSRF          │
│ 3. Validar RBAC          │
│ 4. Validar Propiedad     │
└────────┬─────────────────┘
         │ OK
         ▼
┌──────────────────────┐
│ Ejecutar Endpoint    │
└──────────────────────┘
```

---

## ✅ CHECKLIST DE SEGURIDAD COMPLETADO

- [x] Autenticación con JWT
- [x] Hash de contraseñas con bcrypt
- [x] 2FA con otplib
- [x] Rate limiting en login
- [x] Token blacklist en logout
- [x] RBAC por rol
- [x] Validación de propiedad de datos
- [x] CSRF protection
- [x] Validación obligatoria de checklist
- [x] Cifrado de datos sensibles
- [x] HTTPS forzado en producción
- [x] Security headers (X-Frame-Options, CSP, etc.)
- [x] Tests unitarios
- [x] Documentación con ejemplos

---

## 📞 SOPORTE

Para reportar vulnerabilidades: security@pawspa.com

¡Gracias por mantener Lovely Pets Spa seguro! 🔒
