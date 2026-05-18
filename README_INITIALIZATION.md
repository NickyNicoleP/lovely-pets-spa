# Sistema Pet Spa - Guía de Inicialización

## Estado del Sistema

✅ **Backend:** Completamente funcional con autenticación completa
✅ **Base de Datos:** Schema preparado con todas las tablas
⏳ **Inicialización:** Requiere ejecutar scripts SQL

---

## Requisitos Previos

- Node.js v24.14.1+
- MySQL Server
- npm o yarn

---

## Paso 1: Configuración de Base de Datos

### Opción A: Usando phpMyAdmin (Recomendado para XAMPP)

1. Abre phpMyAdmin: `http://localhost/phpmyadmin`
2. Crea una nueva base de datos: `pawspa_db`
3. Selecciona la BD `pawspa_db`
4. Ve a la pestaña "Importar"
5. Selecciona el archivo: `backend/database_init.sql`
6. Haz clic en "Continuar"

### Opción B: Usando MySQL CLI

```bash
# Crear base de datos
mysql -u root -p -e "CREATE DATABASE pawspa_db;"

# Ejecutar el script
mysql -u root -p pawspa_db < c:\xampp\htdocs\Pet_Spa_Sist\backend\database_init.sql
```

### Opción C: Importar desde MySQL Workbench

1. Abre MySQL Workbench
2. Haz clic en "File" → "Run SQL Script"
3. Selecciona `database_init.sql`
4. Ejecuta

---

## Paso 2: Configuración del Backend

### 2.1 Instalar dependencias

```bash
cd c:\xampp\htdocs\Pet_Spa_Sist\backend
npm install
```

### 2.2 Configurar variables de entorno

Crea o actualiza `.env`:

```env
# === BASE DE DATOS ===
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pawspa_db

# === AUTENTICACIÓN JWT ===
JWT_SECRET=tu_secreto_jwt_muy_fuerte_cambiar_en_produccion_123456789
JWT_REFRESH_SECRET=tu_secreto_refresh_muy_fuerte_cambiar_en_produccion_987654321
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# === SEGURIDAD ===
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

# === SERVIDOR ===
PORT=3000
NODE_ENV=development

# === EMAIL (Opcional para producción) ===
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=tu_email@gmail.com
# SMTP_PASS=tu_password_app
```

### 2.3 Ejecutar el servidor

```bash
npm run dev
```

Deberías ver:
```
Servidor ejecutándose en puerto 3000
Conectado a base de datos MySQL
```

---

## Paso 3: Verificación de Endpoints

### Test 1: Verificar servidor activo

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{ "message": "Servidor funcionando" }
```

### Test 2: Crear usuario admin

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "TestPass123!@",
    "nombre": "Admin",
    "apellido": "Test",
    "rol": "admin"
  }'
```

Respuesta esperada:
```json
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id": 2,
    "email": "admin@test.com",
    "nombre": "Admin",
    "rol": "admin",
    "verificationToken": "uuid-token"
  }
}
```

### Test 3: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pawspa.com",
    "password": "Admin123!@"
  }'
```

**Nota:** La contraseña del admin de prueba es `Admin123!@`

Respuesta esperada:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "admin@pawspa.com",
    "nombre": "Administrador"
  }
}
```

---

## Paso 4: Verificación de Base de Datos

Desde MySQL, ejecuta:

```sql
USE pawspa_db;

-- Ver usuarios
SELECT id, nombre, email, rol, email_verificado FROM USUARIO;

-- Ver servicios
SELECT * FROM SERVICIO;

-- Ver categorías
SELECT * FROM CATEGORIA;

-- Ver auditoría
SELECT * FROM AUDITORIA_LOG ORDER BY created_at DESC LIMIT 10;
```

---

## Características Implementadas

### ✅ Autenticación
- [x] Registro con validación de contraseña fuerte
- [x] Login con bloqueo tras 5 intentos fallidos (15 min)
- [x] JWT (15 min) + Refresh Token (7 días)
- [x] Verificación de email (token de 15 min)
- [x] 2FA TOTP (autenticador de Google)
- [x] Cambio de contraseña
- [x] Logout

### ✅ Seguridad
- [x] Contraseñas hasheadas con bcrypt
- [x] Auditoría completa de acciones
- [x] Bloqueo de cuenta tras intentos fallidos
- [x] IP address + User-Agent logging
- [x] Campos de auditoría: email, rol, detalles JSON

### ✅ Base de Datos
- [x] 20 tablas principales
- [x] Relaciones y constraints configurados
- [x] Triggers para cálculos automáticos
- [x] Índices para optimización
- [x] Datos de prueba incluidos

### ⏳ Frontend - Pendiente
- [ ] Interfaz de registro con validador de contraseña
- [ ] Modal de verificación de email
- [ ] Pantalla de 2FA
- [ ] Token auto-refresh (cada 14 minutos)
- [ ] Auto-logout tras 30 minutos inactivo
- [ ] Indicador de fuerza de contraseña

---

## Solución de Problemas

### Error: "Can't connect to database"

```sql
-- Verifica que pawspa_db existe
SHOW DATABASES;

-- Si no existe, crea:
CREATE DATABASE pawspa_db;
```

### Error: "Table doesn't exist"

Asegúrate de ejecutar `database_init.sql`:
```bash
mysql -u root -p pawspa_db < database_init.sql
```

### Error 401 en login

1. Verifica que el usuario existe
2. Verifica credenciales correctas
3. Si NO es admin, verifica que `email_verificado = TRUE`

### Error: "Contraseña débil"

Contraseña debe cumplir:
- ✅ 8+ caracteres
- ✅ 1 mayúscula
- ✅ 1 minúscula
- ✅ 1 número
- ✅ 1 símbolo especial

Ejemplo válido: `TestPass123!@`

---

## API Completa

Ver: `backend/AUTHENTICATION_DOCS.md`

Endpoints principales:
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/verify-email/:token` - Verificar email
- `POST /api/auth/verify-2fa` - Verificar código 2FA
- `POST /api/auth/refresh` - Refrescar access token
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/change-password` - Cambiar contraseña

---

## Próximos Pasos

1. **Frontend:** Implementar interfaz de autenticación
2. **Email Service:** Configurar envío automático de emails
3. **Testing:** Suite de tests unitarios y E2E
4. **Deployment:** Configurar para producción (HTTPS, variables de entorno seguras)
5. **Monitoreo:** Setup de logs y alertas

---

## Contacto

Para preguntas o issues, contacta al equipo de desarrollo.
