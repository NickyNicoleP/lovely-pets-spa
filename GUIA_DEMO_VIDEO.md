# 📹 Guía Práctica: Demostración en Video

## ✅ Pre-Grabación (Checklist)

### Backend
- [ ] MySQL está corriendo en localhost:3306
- [ ] Node backend está en puerto 3000
- [ ] Base de datos `pawspa_db` creada con script `database_init.sql`
- [ ] Archivo `.env` con credenciales correctas

```bash
# Verificar backend
cd backend
npm start
# Debería decir: "Server running on port 3000"
```

### Frontend
- [ ] Vite frontend en puerto 5173
- [ ] No hay errores en console

```bash
# Terminal nueva
cd frontend
npm run dev
# Debería decir: "Local: http://localhost:5173"
```

### Database
- [ ] phpMyAdmin accesible en http://localhost/phpmyadmin
- [ ] Tablas creadas: USUARIO, CLIENTE, GROOMER, AUDIT_LOG

---

## 🎥 Escenas del Video (Orden Recomendado)

### **ESCENA 1: Registro & Validación de Contraseña (2 min 30 seg)**

**Qué mostrar:**
1. Ir a http://localhost:5173 → "Registrarse"
2. **Intento 1 - Contraseña débil:**
   - Email: `demo.user.1@test.com`
   - Nombre: `Juan`
   - Apellido: `Pérez`
   - Contraseña: `123456` (débil)
   - Narración: "El sistema rechaza contraseñas débiles. Debe tener mayúsculas, números y símbolos"
   - Click Registrarse → Mostrar error
   
3. **Intento 2 - Contraseña válida:**
   - Cambiar a: `Demo@Spa123!`
   - Narración: "Ahora con una contraseña fuerte: 8+ caracteres, mayúsculas, minúsculas, números y símbolos"
   - Responder captcha
   - Click Registrarse
   - Mostrar: "¡Registro exitoso!"
   - Narración: "El usuario se creó exitosamente y es verificable en la base de datos"

---

### **ESCENA 2: Bloqueo por 5 Intentos Fallidos (2 min)**

**Qué mostrar:**
1. Ir a http://localhost:5173/login
2. **Intento 1-4 (contraseña incorrecta):**
   - Email: `admin@pawspa.com`
   - Contraseña: `WrongPassword123!` (x4)
   - Mostrar error: "Credenciales inválidas"
   - Narración: "Cada intento fallido se registra"

3. **Intento 5 - Se bloquea:**
   - 5to intento fallido
   - Error: "Cuenta bloqueada. Intenta de nuevo en 15 minuto(s)"
   - Narración: "Tras 5 intentos fallidos, la cuenta se bloquea por 15 minutos como medida de seguridad"

4. **Mostrar en BD (phpMyAdmin):**
   - Tabla USUARIO → Campo `locked_until` (fecha futura)
   - Campo `login_attempts` = 5

---

### **ESCENA 3: Login Exitoso & 2FA (3 min)**

**Qué mostrar:**
1. **Esperar 15 minutos OU** hacer un UPDATE en BD:
   ```sql
   UPDATE USUARIO SET locked_until = NULL, login_attempts = 0 WHERE email = 'admin@pawspa.com';
   ```

2. **Login normal:**
   - Email: `admin@pawspa.com`
   - Password: `Admin@Spa123!`
   - Narración: "Ingresando con credenciales correctas..."

3. **Pantalla 2FA aparece:**
   - Narración: "El sistema detecta que este admin tiene 2FA habilitado y pide verificación"
   - Mostrar código de 6 dígitos
   - Narración: "Usamos Google Authenticator con TOTP (Time-based One-Time Password)"

4. **Generar código 2FA:**
   - Abrir Google Authenticator en móvil/emulador
   - O si no está configurado, primero Setup 2FA (ver Escena 5)
   - Ingresar código 6 dígitos
   - Narración: "Este código expira en 30 segundos y es único"

5. **Login exitoso:**
   - Mostrar Dashboard
   - Narración: "¡Autenticación exitosa! Bienvenido al sistema"

---

### **ESCENA 4: Sistema de Auditoría (2 min)**

**Qué mostrar:**
1. Abrir http://localhost/phpmyadmin
2. Seleccionar `pawspa_db`
3. Tabla `AUDIT_LOG`
4. **Mostrar los registros:**
   - Columnas: `usuario_id`, `email`, `accion`, `detalles`, `ip_address`, `user_agent`, `created_at`
   - Ejemplos de acciones:
     - `login_exitoso`
     - `login_fallido`
     - `2fa_verificado`
     - `registro_usuario`
   - Narración: "Cada evento registra QUIÉN (usuario_id), CUÁNDO (timestamp), DESDE DÓNDE (IP), y QUÉ HIZO (acción)"

5. **Expandir una fila `detalles`:**
   - Mostrar JSON con info: `{rol: "admin", navegador: "Chrome", ...}`

---

### **ESCENA 5: Cambio de Contraseña en Perfil (1 min 30 seg)**

**Qué mostrar:**
1. Dashboard → Click en usuario (arriba derecha)
2. Ir a "Perfil" o "Configuración"
3. Sección "Seguridad" → "Cambiar Contraseña"
4. Ingresar:
   - Contraseña actual: `Admin@Spa123!`
   - Contraseña nueva: `NewPassword456!`
   - Confirmar: `NewPassword456!`
5. Click "Guardar"
6. Narración: "Nueva contraseña debe cumplir requisitos"
7. Mostrar: "Contraseña actualizada exitosamente"
8. Ir a phpMyAdmin → AUDIT_LOG
9. Mostrar nuevo evento: `cambiar_password`

---

### **ESCENA 6: Resumen de Cumplimiento (1 min)**

**Qué mostrar (Diapositiva o texto en pantalla):**

```
✅ REQUERIMIENTOS CUMPLIDOS:

1. ✓ Validación de Contraseña Fuerte (8+ caracteres, mayús, minús, números, símbolos)
2. ✓ Encriptación con BCrypt
3. ✓ Token de Verificación Email (15 minutos)
4. ✓ Bloqueo por 5 Intentos Fallidos (15 minutos)
5. ✓ 2FA obligatorio para Admin
6. ✓ Sistema de Auditoría Completo (quién, cuándo, desde dónde, qué hizo)
7. ✓ Email Único (no hay duplicados)
8. ✓ Roles RBAC (Admin, Recepción, Groomer, Cliente)

❌ Pendientes:
- OAuth con Google (en desarrollo)
- Sesión timeout 30 min (implementar)
```

---

## 🛠️ Pasos Rápidos Antes de Grabar

### 1. Limpiar Base de Datos (opcional pero recomendado)

```sql
-- En phpMyAdmin, ejecutar:

DELETE FROM AUDIT_LOG;
DELETE FROM USUARIO WHERE email != 'admin@pawspa.com';
DELETE FROM CLIENTE WHERE id > 1;

-- Reset admin para que no esté bloqueado:
UPDATE USUARIO SET locked_until = NULL, login_attempts = 0, email_verificado = TRUE WHERE email = 'admin@pawspa.com';
```

### 2. Credenciales de Prueba

```
ADMIN (con 2FA):
- Email: admin@pawspa.com
- Password: Admin@Spa123!
- 2FA: Debe estar configurado (generar QR si no)

CLIENTE (prueba):
- Email: cliente@test.com
- Password: Cliente@123!
```

### 3. Si 2FA no funciona (Setup)

1. Login como admin
2. Si pide 2FA pero no lo tienes, click "Setup 2FA"
3. Escanear QR con Google Authenticator
4. Guardar el código secreto en lugar seguro

---

## 📹 Recomendaciones de Grabación

1. **Resolución:** 1920x1080 (Full HD)
2. **FPS:** 30 fps (OBS Studio recomendado)
3. **Micrófono:** Claro, sin ruido de fondo
4. **Duración total:** 10-12 minutos
5. **Subtítulos:** En español (recomendado)

**Software gratuito:**
- OBS Studio (descargar en obsproject.com)
- FFmpeg (para procesar video)

---

## 📤 Subir a YouTube

1. Ir a youtube.com → Crear
2. Subir video
3. Título: `"Sistema de Autenticación Pet Spa - Demostración de Seguridad"`
4. Descripción:
```
En este video mostramos cómo nuestro sistema Pet Spa cumple 
con todos los requerimientos de autenticación y seguridad:

✓ Validación de contraseña fuerte
✓ Encriptación BCrypt
✓ 2FA con Google Authenticator
✓ Sistema de Auditoría Completo
✓ Bloqueo por intentos fallidos
✓ Roles RBAC

Tecnologías: Node.js, Express, React, MySQL, JWT

Código fuente: [Link a repositorio]
```
5. Privacidad: "No listado" (si es solo para profesor) o "Público"
6. Publicar

---

## 🐛 Troubleshooting

**"Backend no responde"**
- Verificar: `npm start` en carpeta backend
- Revisar puerto 3000 en uso: `netstat -an | find "3000"`

**"Frontend en error"**
- Borrar node_modules: `rm -r frontend/node_modules`
- Reinstalar: `npm install`
- `npm run dev`

**"2FA no funciona"**
- Verificar que otplib esté instalado: `npm install otplib`
- Generar nuevo QR en Perfil

**"Base de datos vacía"**
- Ejecutar: `mysql -u root pawspa_db < backend/database_init.sql`

---

¡Listo para grabar! 🚀
