# Sistema de Autenticación - Documentación Completa

## Descripción General
Sistema robusto de autenticación con JWT, 2FA, verificación de email, bloqueo de cuenta y auditoría completa.

---

## Características Implementadas

### 1. Registro de Usuario
**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "SecurePass123!@",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+584121234567",
  "ci": "25123456",
  "direccion": "Calle 1, Casa 123",
  "rol": "cliente"
}
```

**Validaciones:**
- ✅ Contraseña fuerte (mín 8 chars, mayúscula, minúscula, número, símbolo)
- ✅ Email único
- ✅ Rol válido: admin, empleado, veterinario, cliente

**Response (201):**
```json
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "nombre": "Juan",
    "rol": "cliente",
    "verificationToken": "uuid-token-here",
    "verificationExpires": "2024-01-15T10:30:00.000Z"
  },
  "verificationUrl": "/api/auth/verify-email/uuid-token-here"
}
```

**Error - Contraseña Débil (400):**
```json
{
  "error": "Contraseña débil",
  "passwordScore": 33,
  "requirements": [
    "Mínimo 8 caracteres",
    "Al menos una letra mayúscula"
  ]
}
```

---

### 2. Verificación de Email
**Endpoint:** `GET /api/auth/verify-email/:token`

**Response (200):**
```json
{
  "message": "Email verificado correctamente",
  "userId": 1
}
```

**Errores Comunes:**
- Token inválido: `"Token de verificación inválido"`
- Token expirado: `"Token de verificación expirado"`

---

### 3. Reenvío de Verificación
**Endpoint:** `POST /api/auth/resend-verification`

**Alias:** `POST /api/auth/reenviar-verificacion`

**Request:**
```json
{
  "email": "usuario@example.com"
}
```

**Response (200):**
```json
{
  "message": "Token de verificación reenviado",
  "verificationUrl": "/api/auth/verify-email/nuevo-token"
}
```

---

### 3.1 Verificación manual (admin)
**Endpoint:** `POST /api/auth/users/:id/verify-email`

**Descripción:** Permite a un administrador marcar `email_verificado = true` cuando SMTP no está disponible.

**Response (200):**
```json
{
  "message": "Email marcado como verificado manualmente",
  "user": {
    "message": "Email verificado manualmente",
    "userId": 1
  }
}
```

**Verificación directa en la base de datos:**
```sql
UPDATE USUARIO SET email_verificado = TRUE WHERE id = 1;
```

---

### 4. Login (Autenticación)
**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "SecurePass123!@"
}
```

**Validaciones:**
- ✅ Verificar email verificado (excepto admin)
- ✅ Verificar bloqueo de cuenta
- ✅ Verificar credenciales

**Response - Sin 2FA (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "nombre": "Juan",
    "rol": "cliente"
  }
}
```

**Response - Requiere 2FA (200):**
```json
{
  "requires2FA": true,
  "userId": 1,
  "tempToken": "temp-token-for-2fa"
}
```

**Errores:**
- Usuario no encontrado: 401
- Email no verificado: 401 `"Por favor verifica tu correo antes de continuar"`
- Cuenta bloqueada: 401 `"Cuenta bloqueada. Intenta de nuevo en 14 minuto(s)"`
- Credenciales inválidas: 401

---

### 5. Política de Bloqueo de Cuenta
**Activación:** Después de 5 intentos fallidos
**Duración:** 15 minutos
**Reinicio:** Automático tras login exitoso

**Base de datos:**
- `login_attempts`: Contador de intentos fallidos
- `locked_until`: Datetime del desbloqueo automático

---

### 6. Autenticación 2FA (TOTP)

#### Setup 2FA
**Endpoint:** `POST /api/auth/2fa/setup` (protegido)

**Response (200):**
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "manualEntry": "JBSWY3DPEBLW64TMMQ"
}
```

#### Habilitar 2FA
**Endpoint:** `POST /api/auth/2fa/enable` (protegido)

**Request:**
```json
{
  "code": "123456"
}
```

#### Verificar 2FA
**Endpoint:** `POST /api/auth/verify-2fa`

**Request:**
```json
{
  "userId": 1,
  "code": "123456"
}
```

#### Deshabilitar 2FA
**Endpoint:** `POST /api/auth/2fa/disable` (protegido)

**Request:**
```json
{
  "password": "CurrentPassword123!@"
}
```

---

### 7. Gestión de Tokens

#### Refresh Token
**Endpoint:** `POST /api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc..."
}
```

#### Logout
**Endpoint:** `POST /api/auth/logout` (protegido)

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

---

### 8. Cambio de Contraseña
**Endpoint:** `POST /api/auth/change-password` (protegido)

**Request:**
```json
{
  "currentPassword": "CurrentPass123!@",
  "newPassword": "NewSecurePass456!@"
}
```

**Validaciones:**
- Contraseña actual correcta
- Contraseña nueva fuerte

---

### 9. Auditoría

**Tabla:** `AUDITORIA_LOG`

**Campos:**
- `usuario_id`: ID del usuario (NULL si no autenticado)
- `email`: Email del usuario
- `rol`: Rol del usuario
- `accion`: Tipo de acción (login_exitoso, login_fallido, email_verificado, etc.)
- `ip_origen`: Dirección IP
- `user_agent`: Navegador/cliente
- `detalles`: JSON con datos adicionales
- `created_at`: Timestamp

**Acciones Registradas:**
- `login_exitoso`: Login exitoso
- `login_fallido`: Intento fallido (con intento #)
- `logout`: Cierre de sesión
- `email_verificado`: Verificación de email
- `2fa_habilitado`: Activación de 2FA
- `2fa_deshabilitado`: Desactivación de 2FA
- `cambiar_password`: Cambio de contraseña
- `reenviar_verificacion_email`: Reenvío de token

---

## Configuración Variables de Entorno

```env
# JWT
JWT_SECRET=tu_jwt_secret_fuerte
JWT_REFRESH_SECRET=tu_jwt_refresh_secret_fuerte
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pawspa_db

# Seguridad
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
EMAIL_VERIFICATION_EXPIRY_MINUTES=15
```

---

## Requisitos de Contraseña Fuerte

- **Mínimo 8 caracteres**
- **Al menos 1 mayúscula** (A-Z)
- **Al menos 1 minúscula** (a-z)
- **Al menos 1 número** (0-9)
- **Al menos 1 símbolo especial** (!@#$%^&*)

**Ejemplos Válidos:**
- SecurePass123!@
- MyPassword#2024
- Pawspa@123

**Ejemplos Inválidos:**
- password (sin mayúscula, número, símbolo)
- 12345678 (solo números)
- Password123 (sin símbolo)

---

## Flujo de Autenticación Completo

### Nuevo Usuario:
1. Registro → Genera token verificación (válido 15 min)
2. Frontend envía email al usuario con enlace verificación
3. Usuario verifica → `GET /api/auth/verify-email/:token`
4. Login con credenciales
5. Opcionalmente habilita 2FA

### Login Existente:
1. POST /api/auth/login con email/password
2. Si no tiene 2FA → Retorna tokens de acceso y refresh
3. Si tiene 2FA → Retorna requires2FA=true + tempToken
4. Verificar código 2FA → POST /api/auth/verify-2fa
5. Backend genera tokens finales

### Token Timeout:
- **Access Token:** 15 minutos (se expira automáticamente)
- **Refresh Token:** 7 días
- Frontend debe detectar expiración y refrescar o redirigir a login

---

## Roles y Permisos

| Rol | Acceso |
|-----|---------|
| **admin** | Acceso total, no requiere verificación email |
| **empleado** | Gestión de clientes, reservas y grooming |
| **veterinario** | Gestión de consultas y atención médica |
| **cliente** | Ver mascotas, reservas, historial |

---

## Seguridad

✅ Contraseñas hasheadas con bcrypt (10 salts)
✅ JWT con secretos fuertes
✅ Bloqueo de cuenta tras 5 intentos
✅ Tokens de verificación con expiración
✅ Auditoría completa de acciones
✅ Protección CORS
✅ Rate limiting recomendado en producción
✅ HTTPS obligatorio en producción

---

## Próximas Mejoras

- [ ] Integración Google OAuth
- [ ] Integración email service (SendGrid, AWS SES)
- [ ] Rate limiting por IP
- [ ] Notificaciones de login sospechoso
- [ ] Recovery codes para 2FA
- [ ] Single Sign-On (SSO)
- [ ] Autenticación biométrica

---

## Contacto

Para reportar issues o sugerencias sobre el sistema de autenticación, contacta al equipo de desarrollo.
