# PawSpa - Sistema de Gestión

Sistema completo de gestión para mascotas con autenticación JWT, 2FA y auditoría.

## 🚀 Características

- **Autenticación Segura**: JWT + Refresh Tokens con bcrypt
- **2FA**: Autenticación de dos factores con Google Authenticator
- **Bloqueo por Intentos**: 5 intentos fallidos → 15 minutos de bloqueo
- **Auditoría Completa**: Logs de login, acciones y movimientos
- **Gestión de Agenda**: Reservas con cálculo automático de horarios
- **Inventario Automático**: Trigger MySQL para control de stock
- **Frontend Moderno**: React + Tailwind CSS

## 📋 Requisitos

- Node.js 18+
- MySQL 8.0+
- XAMPP (para Windows)

## 🛠️ Instalación

### 1. Base de Datos

```bash
# Iniciar MySQL desde XAMPP
# Crear la base de datos
mysql -u root -p < backend/database.sql
```

O importar el archivo `backend/database.sql` en phpMyAdmin.

### 2. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
# Editar .env con tus credenciales de MySQL
```

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install
```

## ▶️ Ejecución

### Backend

```bash
cd backend
npm run dev
```

El servidor correra en `http://localhost:3000`

### Frontend

```bash
cd frontend
npm run dev
```

La aplicación correra en `http://localhost:5173`

## 🧪 Pruebas

```bash
# Ejecutar pruebas del backend
cd backend
npm test
```

## 📱 Endpoints de API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/verify-2fa` - Verificar 2FA
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/2fa/setup` - Configurar 2FA
- `POST /api/auth/2fa/enable` - Habilitar 2FA
- `POST /api/auth/2fa/disable` - Deshabilitar 2FA

### Clientes
- `GET /api/clientes` - Listar clientes
- `GET /api/clientes/:id` - Obtener cliente
- `POST /api/clientes` - Crear cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente
- `GET /api/clientes/:id/mascotas` - Mascotas del cliente

### Mascotas
- `GET /api/mascotas` - Listar mascotas
- `GET /api/mascotas/:id` - Obtener mascota
- `POST /api/mascotas` - Crear mascota
- `PUT /api/mascotas/:id` - Actualizar mascota
- `DELETE /api/mascotas/:id` - Eliminar mascota

### Servicios
- `GET /api/servicios` - Listar servicios
- `GET /api/servicios/:id` - Obtener servicio
- `POST /api/servicios` - Crear servicio
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Eliminar servicio

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/low-stock` - Productos con stock bajo
- `GET /api/productos/:id` - Obtener producto
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### Agenda
- `GET /api/agenda` - Listar reservas
- `GET /api/agenda/horarios` - Horarios disponibles
- `GET /api/agenda/:id` - Obtener reserva
- `POST /api/agenda` - Crear reserva
- `PUT /api/agenda/:id` - Actualizar reserva
- `DELETE /api/agenda/:id` - Eliminar reserva

### Ficha Grooming
- `GET /api/ficha-grooming` - Listar fichas
- `GET /api/ficha-grooming/estadisticas` - Estadísticas
- `GET /api/ficha-grooming/:id` - Obtener ficha
- `POST /api/ficha-grooming` - Crear ficha
- `POST /api/ficha-grooming/:id/insumo` - Agregar insumo
- `POST /api/ficha-grooming/:id/cerrar` - Cerrar ficha

### Inventario
- `GET /api/inventario` - Listar movimientos
- `GET /api/inventario/:id` - Obtener movimiento
- `POST /api/inventario` - Crear movimiento

### Auditoría
- `GET /api/audit/login` - Logs de login
- `GET /api/audit` - Logs de auditoría

## 🔐 Roles de Usuario

- **admin**: Acceso completo al sistema
- **empleado**: Gestión de agenda, grooming e inventario
- **cliente**: Solo puede ver su información y crear reservas

## 📊 Estructura del Proyecto

```
Pet_Spa_Sist/
├── backend/
│   ├── src/
│   │   ├── config/       # Configuración de base de datos
│   │   ├── controllers/  # Controladores de API
│   │   ├── middleware/  # Middlewares de auth
│   │   ├── routes/      # Rutas de API
│   │   ├── services/    # Lógica de negocio
│   │   └── index.js     # Punto de entrada
│   ├── tests/           # Pruebas Jest
│   ├── database.sql     # Esquema de base de datos
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── context/    # Contextos (Auth)
│   │   ├── pages/      # Páginas
│   │   ├── services/   # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔧 Configuración de Variables de Entorno

### Backend (.env)

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=pawspa

JWT_SECRET=tu_secret_jwt
JWT_REFRESH_SECRET=tu_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
VERIFICATION_TOKEN_EXPIRES=15

TWO_FACTOR_ISSUER=PawSpa

FRONTEND_URL=http://localhost:5173
```

## 📝 Notas

- El trigger `trg_actualizar_stock_after_ficha` se ejecuta automáticamente al cerrar una ficha de grooming
- Los logs de auditoría registran IP y userAgent en cada acción
- El sistema de 2FA usa TOTP (Time-based One-Time Password)

## 📄 Licencia

MIT License