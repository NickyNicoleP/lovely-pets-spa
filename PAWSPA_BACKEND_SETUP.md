# 🔧 PawSpa Backend Setup - Endpoints Requeridos

## Información General

Este documento describe los endpoints que el backend debe proporcionar para que el nuevo sistema de login de PawSpa funcione completamente.

## 📍 Endpoints de Autenticación

### 1. Login (Ya existe)
```
POST /api/auth/login

Request Body:
{
  "email": "usuario@example.com",
  "password": "password123"
}

Response Success (200):
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "usuario@example.com",
    "nombre": "Nombre Usuario",
    "rol": "cliente"
  },
  "token": "jwt_token_aqui"
}

Response 2FA Required (200):
{
  "success": false,
  "requires2FA": true,
  "userId": "user_id"
}

Response Error (401/400):
{
  "error": "Credenciales inválidas"
}
```

### 2. Verificar 2FA
```
POST /api/auth/verify-2fa

Request Body:
{
  "userId": "user_id",
  "code": "123456"
}

Response Success (200):
{
  "success": true,
  "user": { ... },
  "token": "jwt_token"
}

Response Error (401):
{
  "error": "Código de 2FA inválido"
}
```

### 3. Forgot Password
```
POST /api/auth/forgot-password

Request Body:
{
  "email": "usuario@example.com"
}

Response Success (200):
{
  "success": true,
  "message": "Código enviado a tu email"
}

Response Error (404):
{
  "error": "Usuario no encontrado"
}
```

### 4. Verificar Código de Reset
```
POST /api/auth/verify-reset-code

Request Body:
{
  "email": "usuario@example.com",
  "code": "ABCD1234"
}

Response Success (200):
{
  "success": true,
  "message": "Código verificado"
}

Response Error (400):
{
  "error": "Código inválido o expirado"
}
```

### 5. Reset Password
```
POST /api/auth/reset-password

Request Body:
{
  "email": "usuario@example.com",
  "code": "ABCD1234",
  "newPassword": "newpassword123"
}

Response Success (200):
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}

Response Error (400):
{
  "error": "No se pudo actualizar la contraseña"
}
```

## 🔐 Implementación Recomendada

### Express.js Example

```javascript
// routes/auth.js
import express from 'express';
import { forgotPassword, verifyResetCode, resetPassword } from '../controllers/authController.js';

const router = express.Router();

// Endpoints existentes
router.post('/login', login);
router.post('/verify-2fa', verify2FA);

// Nuevos endpoints para forgot password
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;
```

### Controller Implementation

```javascript
// controllers/authController.js

// Forgot Password
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // Validar email
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }

    // Buscar usuario
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Generar código de reset
    const resetCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Guardar código en DB
    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;
    await user.save();

    // Enviar email con código
    await sendEmail({
      to: email,
      subject: 'PawSpa - Recuperar Contraseña',
      template: 'forgot-password',
      context: {
        name: user.nombre,
        code: resetCode
      }
    });

    res.json({ 
      success: true, 
      message: 'Código enviado a tu email' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Verify Reset Code
export async function verifyResetCode(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código requeridos' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar código
    if (user.resetCode !== code) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    // Verificar expiración
    if (new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ error: 'Código expirado' });
    }

    res.json({ 
      success: true, 
      message: 'Código verificado' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// Reset Password
export async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Validar contraseña
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar código
    if (user.resetCode !== code || new Date() > user.resetCodeExpiry) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetCode = null;
    user.resetCodeExpiry = null;
    await user.save();

    res.json({ 
      success: true, 
      message: 'Contraseña actualizada exitosamente' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
```

## 📧 Email Template Ejemplo

**forgot-password.html**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5eef4; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; }
    .header { text-align: center; color: #e84393; }
    .code { font-size: 32px; font-weight: bold; text-align: center; 
            background: #f8d7e8; padding: 20px; margin: 20px 0; 
            border-radius: 10px; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐾 PawSpa</h1>
      <h2>Recuperar Contraseña</h2>
    </div>
    
    <p>Hola {{name}},</p>
    
    <p>Recibimos una solicitud para recuperar tu contraseña. 
       Usa el siguiente código para continuar:</p>
    
    <div class="code">{{code}}</div>
    
    <p>Este código expirará en 15 minutos.</p>
    
    <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
    
    <div class="footer">
      <p>&copy; 2026 PawSpa. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
```

## 🗄️ Modelo de Usuario (Mongoose)

```javascript
// models/User.js
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  nombre: String,
  rol: {
    type: String,
    default: 'cliente'
  },
  // Campos para reset password
  resetCode: String,
  resetCodeExpiry: Date,
  // Campos para 2FA
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

## 🔑 Variables de Entorno

```env
# Backend .env
JWT_SECRET=tu_secret_key_aqui
JWT_EXPIRY=24h
RESET_CODE_EXPIRY=900000 # 15 minutos en ms

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_app_password
EMAIL_FROM=noreply@pawspa.com

# Frontend URL (para links en emails)
FRONTEND_URL=http://localhost:5173
```

## ✅ Checklist de Implementación

- [ ] Crear endpoints en el backend
- [ ] Configurar envío de emails
- [ ] Crear template HTML para emails
- [ ] Agregar campos a modelo de Usuario
- [ ] Configurar variables de entorno
- [ ] Testear con Postman/Thunder Client
- [ ] Integrar con frontend
- [ ] Testear flujo completo

## 🧪 Testing con Postman

### 1. Forgot Password
```
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "usuario@example.com"
}
```

### 2. Verify Code
```
POST http://localhost:3000/api/auth/verify-reset-code
Content-Type: application/json

{
  "email": "usuario@example.com",
  "code": "ABCD1234"
}
```

### 3. Reset Password
```
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "email": "usuario@example.com",
  "code": "ABCD1234",
  "newPassword": "newpassword123"
}
```

## 🔒 Seguridad

✅ Rate limiting (máximo 5 intentos fallidos)
✅ Código expira en 15 minutos
✅ Email validado antes de enviar
✅ Contraseña hasheada con bcrypt
✅ HTTPS solo en producción
✅ CORS configurado correctamente

## 📝 Logs Esperados

```
[INFO] Reset password code sent to user@example.com
[INFO] Reset code verified for user@example.com
[INFO] Password reset successful for user@example.com
[ERROR] Invalid reset code for user@example.com
[ERROR] Reset code expired for user@example.com
```

## 🚀 Deployment

Asegúrate de:
- [ ] Variables de entorno configuradas
- [ ] Email service habilitado
- [ ] HTTPS habilitado
- [ ] Rate limiting activo
- [ ] Logging habilitado
- [ ] Backups de base de datos

---

**Última actualización:** 26 de Mayo de 2026
**Versión:** 1.0
**Estado:** Ready for Implementation
