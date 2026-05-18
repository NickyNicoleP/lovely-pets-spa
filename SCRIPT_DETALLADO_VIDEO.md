# 🎬 SCRIPT DETALLADO PARA GRABACIÓN - DEMOSTRACIÓN VIDEO

## ANTES DE EMPEZAR (5 MINUTOS)

### 1. Preparar Base de Datos
```
1. Abrir phpMyAdmin: http://localhost/phpmyadmin
2. Seleccionar base de datos: pawspa_db
3. Click en "SQL" (arriba)
4. Copiar contenido de: backend/prepare_demo.sql
5. Pegar en phpMyAdmin
6. Click "Ejecutar"
7. Ver confirmación: ✓ Usuarios creados
```

### 2. Iniciar Servidores

**Terminal 1 - Backend:**
```
cd c:\xampp\htdocs\Pet_Spa_Sist\backend
npm start
```
Esperar: `Server running on port 3000`

**Terminal 2 - Frontend:**
```
cd c:\xampp\htdocs\Pet_Spa_Sist\frontend
npm run dev
```
Esperar: `Local: http://localhost:5173`

### 3. Abrir OBS Studio
- Crear escena nueva
- Capturar ventana del navegador
- Ajustar micrófono
- Click "Iniciar Grabación"

---

## 🎥 ESCENA 1: REGISTRO & VALIDACIÓN (2 min 30 seg)

### Intro Narracion (20 seg):
```
"Hola, bienvenidos. Hoy voy a demostrar cómo nuestro sistema Pet Spa 
implementa seguridad de nivel profesional. Comenzaremos con el registro 
de usuarios y la validación de contraseñas fuertes."
```

### Acción 1.1 - Abrir Página de Registro
```
Acción: 
- Ir a http://localhost:5173
- Click en "¿No tienes cuenta? Regístrate"

Narración:
"Aquí estamos en la página de registro. El sistema requiere información básica."
```

### Acción 1.2 - Intento 1: Contraseña Débil ❌
```
Ingresar datos:
- Nombre: Juan
- Apellido: Pérez
- Email: juan.perez@demo.com
- Contraseña: 123456 (DÉBIL)

Acción:
- Completar captcha
- Click "Registrarse"

Mostrar:
- Error aparece: "Contraseña débil"
- Requisitos mostrados:
  ✗ Mínimo 8 caracteres
  ✗ Al menos una letra mayúscula
  ✗ Al menos una letra minúscula
  ✓ Al menos un número
  ✗ Al menos un símbolo especial

Narración:
"El sistema rechaza esta contraseña porque no cumple los requisitos 
de seguridad. Necesita mayúsculas, minúsculas, números Y símbolos."
```

### Acción 1.3 - Intento 2: Contraseña Válida ✅
```
Cambiar contraseña a: Demo@Spa123!

Mostrar en pantalla:
- Indicador de fuerza: 100% (verde)
- Todos los requisitos en ✓

Narración:
"Ahora con una contraseña fuerte: combina mayúsculas, minúsculas, 
números y símbolos. El sistema lo valida en tiempo real."

Acción:
- Completar captcha
- Click "Registrarse"

Resultado:
- Mostrar: "¡Registro exitoso!"
- Mensaje: "Ya puedes iniciar sesión"
- Redirigir a login

Narración:
"¡Registro completado! El usuario fue creado con éxito en la base de datos."
```

---

## 🎥 ESCENA 2: BLOQUEO POR INTENTOS FALLIDOS (2 minutos)

### Intro Narración (15 seg):
```
"Ahora vamos a demostrar un mecanismo de seguridad crítico: 
el bloqueo de cuenta tras intentos fallidos de login. 
Esto previene ataques de fuerza bruta."
```

### Acción 2.1 - Intentos 1-4: Contraseña Incorrecta
```
Ir a: http://localhost:5173/login

Ingresar (4 veces):
- Email: admin@pawspa.com
- Password: WrongPassword123! (INCORRECTA)

Resultado cada vez:
- Error: "Credenciales inválidas"

Narración (en el intento 3-4):
"Cada intento fallido queda registrado en el sistema. 
Después del quinto intento, la cuenta se bloqueará."
```

### Acción 2.2 - Intento 5: Bloqueo ⛔
```
Intento 5 con contraseña incorrecta:
- Email: admin@pawspa.com
- Password: WrongPassword123!

Resultado:
- Error: "Cuenta bloqueada. Intenta de nuevo en 15 minuto(s)"

Narración:
"¡Cuenta bloqueada! Como medida de seguridad, tras 5 intentos fallidos 
el sistema bloquea la cuenta por 15 minutos para prevenir ataques."

Acción:
- Intento 6: Mostrar mismo error de bloqueo
```

### Acción 2.3 - Mostrar en Base de Datos
```
Acción:
- Ir a phpMyAdmin: http://localhost/phpmyadmin
- Seleccionar: pawspa_db > USUARIO
- Buscar: admin@pawspa.com
- Expandir la fila

Mostrar campos:
- locked_until: 2026-05-07 15:45:30 (fecha futura)
- login_attempts: 5

Narración:
"En la base de datos podemos ver que la cuenta está marcada como bloqueada. 
El campo 'locked_until' contiene la fecha en que se desbloqueará, 
y 'login_attempts' cuenta los intentos fallidos."
```

### Acción 2.4 - Desbloquear Para Continuar
```
En phpMyAdmin SQL:
UPDATE USUARIO SET locked_until = NULL, login_attempts = 0 
WHERE email = 'admin@pawspa.com';

Narración:
"Para continuar con la demostración, desbloqueamos la cuenta. 
En producción, esto sucedería automáticamente tras 15 minutos."
```

---

## 🎥 ESCENA 3: LOGIN & 2FA (3 minutos)

### Intro Narración (20 seg):
```
"Ahora realizaremos un login exitoso con un administrador 
y demostraremos el sistema de 2FA (autenticación de dos factores)."
```

### Acción 3.1 - Login Normal
```
URL: http://localhost:5173/login

Ingresar:
- Email: admin@pawspa.com
- Password: Admin@Spa123!

Narración:
"Ingresando con credenciales correctas del administrador."

Resultado:
- No aparece dashboard aún
- Pantalla de 2FA: "Verificación 2FA"
- Campo: "Código de 6 dígitos"

Narración:
"El sistema detectó que este usuario tiene 2FA habilitado. 
Ahora pide un código único generado por Google Authenticator."
```

### Acción 3.2 - Generar Código 2FA
```
Opción A - Si tienes Google Authenticator configurado:
- Abrir Google Authenticator en tu móvil
- Buscar "PawSpa" o la cuenta configurada
- Ver código TOTP (ej: 123456)
- Anotar mentalmente

Opción B - Si NO está configurado:
- Click "Setup 2FA" (si aparece)
- Mostrar QR Code
- Escanear con Google Authenticator
- Guardar el código secreto
- Esperar a que aparezca el código en la app

Narración:
"Google Authenticator genera códigos basados en tiempo (TOTP). 
Cada código es único y válido solo por 30 segundos."
```

### Acción 3.3 - Ingresar Código
```
Acción:
- En pantalla 2FA, ingresar código de 6 dígitos
- Click "Verificar"

Mostrar progresión:
- Campo se llena con código
- Botón se activa

Resultado:
- Redirige a Dashboard
- Usuario autenticado: "Bienvenido [Nombre]"

Narración:
"¡Verificación exitosa! El usuario está ahora completamente autenticado 
y puede acceder al dashboard."

Mostrar:
- Dashboard con datos (reservas, grooming, productos)
```

### Acción 3.4 - Resumen de Seguridad
```
Narración:
"Lo que acabamos de ver es un flujo de autenticación robusto:
1. Contraseña fuerte (encriptada con BCrypt)
2. Verificación de identidad (tokens)
3. Autenticación de dos factores (2FA con Google Authenticator)

Esto garantiza que incluso si alguien obtiene la contraseña, 
no puede acceder sin el segundo factor."
```

---

## 🎥 ESCENA 4: AUDITORÍA Y LOGS (2 minutos)

### Intro Narración (15 seg):
```
"Ahora vamos a la parte más importante: la auditoría. 
Cada evento del sistema queda registrado con detalles completos."
```

### Acción 4.1 - Navegar a Tabla AUDIT_LOG
```
Acción:
- Ir a phpMyAdmin: http://localhost/phpmyadmin
- BD: pawspa_db
- Tabla: AUDIT_LOG
- Click en "Datos" o "Examinar"

Mostrar columnas:
- id
- usuario_id (quién)
- email
- accion (qué)
- detalles (JSON)
- ip_address (desde dónde)
- user_agent (navegador)
- created_at (cuándo)
```

### Acción 4.2 - Analizar Eventos Recientes
```
Acción:
- Ordenar por: created_at DESC (más recientes primero)

Mostrar eventos:
1. login_exitoso (admin)
2. 2fa_verificado
3. login_fallido (x5)
4. registro_usuario (juan.perez)

Narración:
"Cada evento registra cuatro elementos críticos:
- ¿Quién? El ID del usuario y su email
- ¿Cuándo? Timestamp exacto con hora
- ¿Desde dónde? IP y navegador
- ¿Qué hizo? La acción específica"
```

### Acción 4.3 - Expandir un Evento
```
Acción:
- Click en una fila
- Expandir columna "detalles"

Mostrar JSON:
{
  "rol": "admin",
  "navegador": "Mozilla/5.0 Chrome/...",
  "intentos_totales": 5
}

Narración:
"Los detalles incluyen información contextual adicional. 
Esto es crucial para detectar comportamientos anormales 
o intentos de ataque."
```

### Acción 4.4 - Casos de Uso
```
Narración:
"El sistema de auditoría permite:
1. Compliance: Cumplimiento de regulaciones (RGPD, etc)
2. Seguridad: Detectar accesos no autorizados
3. Debugging: Investigar problemas
4. Trazabilidad: Quién hizo qué y cuándo"

Mostrar múltiples eventos relacionados:
- usuario X intentó login fallido 5 veces en hora Y
- desde IP X
- usando navegador Y
```

---

## 🎥 ESCENA 5: CAMBIO DE CONTRASEÑA (1 min 30 seg)

### Intro Narración (15 seg):
```
"Por último, demostraremos cómo cambiar contraseña de forma segura 
y cómo se registra en auditoría."
```

### Acción 5.1 - Ir a Perfil
```
Ubicación: Dashboard (ya logueado como admin)

Acción:
- Click en avatar/nombre (arriba derecha)
- Click "Perfil" o "Mi Perfil"
- O ir directo a: http://localhost:5173/perfil
```

### Acción 5.2 - Sección Seguridad
```
Acción:
- Buscar sección "Seguridad"
- Click en "Cambiar Contraseña"

Mostrar campos:
- Contraseña actual: ________
- Contraseña nueva: ________
- Confirmar contraseña: ________
```

### Acción 5.3 - Ingr​esar Nueva Contraseña
```
Ingresar:
- Contraseña actual: Admin@Spa123!
- Contraseña nueva: NewSecure456!
- Confirmar: NewSecure456!

Mostrar:
- Validación en tiempo real
- Indicador de fuerza (100% ✓)

Acción:
- Click "Guardar Cambios"

Resultado:
- Mensaje: "Contraseña actualizada exitosamente"
```

### Acción 5.4 - Verificar Auditoría
```
Acción:
- Ir a phpMyAdmin
- Tabla AUDIT_LOG
- Buscar evento más reciente

Mostrar:
- accion: "cambiar_password"
- usuario_id: 1 (admin)
- ip_address: 127.0.0.1
- created_at: [ahora]

Narración:
"El cambio de contraseña quedó registrado en auditoría. 
Si alguien hubiera cambiado la contraseña sin autorización, 
tendríamos evidencia completa del evento."
```

---

## 🎥 ESCENA 6: RESUMEN FINAL (1 minuto)

### Mostrar Diapositiva o Captura:
```
REQUERIMIENTOS CUMPLIDOS ✅

1. ✓ Validación de Contraseña Fuerte
   - 8+ caracteres, mayúsculas, minúsculas, números, símbolos
   - Indicador visual de fuerza

2. ✓ Encriptación con BCrypt
   - Hash de 10 rondas
   - No reversible

3. ✓ Token de Verificación Email
   - 15 minutos de validez
   - Renovable

4. ✓ Bloqueo por 5 Intentos Fallidos
   - 15 minutos de bloqueo
   - Automático y temporal

5. ✓ 2FA Obligatorio para Admin
   - Google Authenticator
   - TOTP (Time-based One-Time Password)

6. ✓ Sistema de Auditoría Completo
   - Quién (usuario_id, email)
   - Cuándo (timestamp exacto)
   - Desde dónde (IP, user-agent)
   - Qué hizo (acción detallada)

7. ✓ Email Único
   - Validación en registro
   - Constraint en BD

8. ✓ Roles RBAC
   - Admin, Recepción, Groomer, Cliente
   - Permisos diferenciados
```

### Narración Final:
```
"Hemos demostrado cómo nuestro sistema Pet Spa implementa 
un módulo de autenticación profesional que cumple con TODOS 
los requerimientos de seguridad especificados.

Cada característica fue diseñada pensando en proteger:
- Datos de clientes
- Información operativa
- Integridad del sistema

La seguridad no es un lujo, es un requisito fundamental 
en cualquier aplicación profesional.

Gracias por ver esta demostración. 

Código disponible en: [tu repositorio]
"
```

### Créditos (5 seg):
```
- Desarrollado por: [Tu nombre]
- Tecnologías: Node.js, Express, React, MySQL, JWT, 2FA
- Proyecto: Sistema Pet Spa
- Fecha: Mayo 2026
```

---

## ⏱️ TIMING TOTAL

- Escena 1 (Registro): 2:30
- Escena 2 (Bloqueo): 2:00
- Escena 3 (Login 2FA): 3:00
- Escena 4 (Auditoría): 2:00
- Escena 5 (Cambio Pass): 1:30
- Escena 6 (Resumen): 1:00

**TOTAL: 12 minutos**

---

## 📤 DESPUÉS DE GRABAR

1. Exportar video de OBS (MP4, H.264, 1920x1080)
2. Editar si es necesario (cortes, transiciones)
3. Subir a YouTube:
   - Título: "Sistema de Autenticación Pet Spa - Demostración de Seguridad"
   - Descripción: [Ver abajo]
   - Privacidad: Público o No listado
   - Tags: #seguridad #autenticación #2FA #nodejs #mysql

### Descripción YouTube:
```
En este video demostramos un sistema completo de autenticación y seguridad 
para una aplicación de gestión de Pet Spa, implementado con tecnologías 
profesionales.

✓ Validación de contraseña fuerte
✓ Encriptación BCrypt
✓ 2FA con Google Authenticator
✓ Sistema de auditoría completo
✓ Bloqueo por intentos fallidos
✓ Roles RBAC

Tecnologías:
- Backend: Node.js, Express, MySQL
- Frontend: React, Vite, Tailwind CSS
- Seguridad: JWT, BCrypt, TOTP, 2FA

Repositorio: [Link]
Contacto: [Email/Redes]

#Seguridad #Autenticación #2FA #NodeJS #React #MySQL
```

---

¡Listo para grabar! 🎬🚀
