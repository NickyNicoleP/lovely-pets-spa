# 🚀 INICIO RÁPIDO: PREPARA TU VIDEO EN 30 MINUTOS

## PASO 1: DESCARGAR HERRAMIENTAS (5 min)

### OBS Studio (Grabadora de pantalla)
```
1. Ir a: https://obsproject.com/
2. Descargar para Windows
3. Instalar
4. Abrir
```

### Google Authenticator (2FA)
```
1. En tu móvil o emulador: Google Play Store
2. Buscar: "Google Authenticator"
3. Instalar
4. Mantenerlo abierto para la demo
```

---

## PASO 2: PREPARAR BD (3 min)

### Ejecutar SQL de Preparación
```
1. Abrir: http://localhost/phpmyadmin
2. Base de datos: pawspa_db
3. Click: "SQL" (arriba)
4. Copiar COMPLETAMENTE: backend/prepare_demo.sql
5. Pegar en phpMyAdmin
6. Click: "Ejecutar"
```

**Credenciales creadas:**
- Admin: `admin@pawspa.com` / `Admin@Spa123!`
- Cliente: `cliente@demo.com` / `Cliente@123!`

---

## PASO 3: INICIAR SERVIDORES (2 min)

### Terminal 1 - Backend
```powershell
cd c:\xampp\htdocs\Pet_Spa_Sist\backend
npm start
```
✓ Esperar: `Server running on port 3000`

### Terminal 2 - Frontend
```powershell
cd c:\xampp\htdocs\Pet_Spa_Sist\frontend
npm run dev
```
✓ Esperar: `Local: http://localhost:5173`

---

## PASO 4: CONFIGURAR OBS (3 min)

### Crear Escena
```
1. OBS abierto
2. Click: "+" en "Escenas" (abajo izq)
3. Nombre: "Pet Spa Demo"
4. Click: "+" en "Fuentes"
5. Seleccionar: "Captura de ventana"
6. Seleccionar ventana del navegador
7. Click OK
```

### Configurar Grabación
```
1. Archivo → Configuración
2. Salida → Modos: "Grabación"
3. Ruta: Desktop
4. Formato: MP4
5. Calidad: 1920x1080, 30 fps
6. Click OK
```

### Configurar Micrófono
```
1. En "Mixer de audio" (abajo)
2. Icono de micrófono
3. Volumen: medio (-6dB)
4. Probar grabando 5 segundos
```

---

## PASO 5: GRABAR VIDEO (12 min)

### Checklist Pre-Grabación
- [ ] Backend corriendo (puerto 3000)
- [ ] Frontend corriendo (puerto 5173)
- [ ] phpMyAdmin abierto con pawspa_db
- [ ] Google Authenticator listo
- [ ] OBS configurado
- [ ] Micrófono funcionando

### Iniciar Grabación
```
1. En OBS: Click "Iniciar Grabación"
2. Seguir el SCRIPT_DETALLADO_VIDEO.md
3. Escenas en orden:
   - Registro (2:30)
   - Bloqueo (2:00)
   - Login 2FA (3:00)
   - Auditoría (2:00)
   - Cambio Pass (1:30)
   - Resumen (1:00)
4. Total: ~12 minutos
5. Click "Detener Grabación"
```

### Archivo Grabado
```
Se guardará en: C:\Users\[TuUsuario]\Desktop\
Nombre: untitled-1.mp4 (o similar)
Tamaño: ~200-400 MB
```

---

## PASO 6: SUBIR A YOUTUBE (5 min)

### Crear Cuenta
```
Si no tienes: https://youtube.com
Hacer login o crear cuenta Google
```

### Subir Video
```
1. YouTube.com → Crear (esquina arriba derecha)
2. "Subir un vídeo"
3. Seleccionar archivo: Desktop/untitled-1.mp4
4. Título: "Sistema de Autenticación Pet Spa - Demostración de Seguridad"
5. Descripción: [ver abajo]
6. Privacidad: "No listado" (solo profesores) o "Público"
7. Agregar tags
8. Publicar
```

### Descripción YouTube (Copiar-Pegar)
```
En este video demostro un sistema completo de autenticación y seguridad 
para aplicaciones profesionales, implementado en Pet Spa.

✓ Validación de contraseña fuerte (8+ caracteres, mayús, minús, números, símbolos)
✓ Encriptación BCrypt
✓ 2FA obligatorio para admin con Google Authenticator
✓ Sistema de auditoría completo (quién, cuándo, desde dónde, qué hizo)
✓ Bloqueo automático tras 5 intentos fallidos
✓ Control de acceso basado en roles (RBAC)

Tecnologías:
- Backend: Node.js + Express + MySQL
- Frontend: React + Vite + Tailwind CSS
- Seguridad: JWT, BCrypt, TOTP, 2FA

Código: [Tu repositorio]
Contacto: [Tu email/redes]

#Seguridad #Autenticación #2FA #NodeJS #React #MySQL
```

---

## ⚠️ PROBLEMAS COMUNES

### "Backend no inicia"
```
1. Verificar puerto 3000 libre:
   netstat -ano | find ":3000"
2. Si está en uso:
   taskkill /PID [PID] /F
3. Intentar npm start nuevamente
```

### "Frontend dice 'conexión rechazada'"
```
1. Verificar backend está en 3000
2. Revisar archivo: frontend/src/services/api.js
3. Debe tener: baseURL: 'http://localhost:3000'
```

### "2FA no funciona"
```
1. Verificar Google Authenticator instalado
2. Si admin no tiene 2FA:
   a. En dashboard → Perfil → Seguridad
   b. Click "Configurar 2FA"
   c. Escanear QR con app
3. Guardar el código secreto (backup)
```

### "phpMyAdmin no muestra datos"
```
1. Verificar MySQL está corriendo
2. Usuario correcto: root / (sin password)
3. BD: pawspa_db debe existir
4. Si no, ejecutar: backend/database_init.sql primero
```

---

## 📋 RESUMEN RÁPIDO

| Paso | Acción | Tiempo |
|------|--------|--------|
| 1 | Descargar OBS + Authenticator | 5 min |
| 2 | Ejecutar prepare_demo.sql | 3 min |
| 3 | Iniciar Backend + Frontend | 2 min |
| 4 | Configurar OBS | 3 min |
| 5 | Grabar 12 min de video | 15 min |
| 6 | Subir a YouTube | 5 min |
| **TOTAL** | | **~33 min** |

---

## 🎬 ESTRUCTURA DEL VIDEO (Cheat Sheet)

```
[INTRO - 20 seg]
"Bienvenidos, hoy demostraré seguridad en Pet Spa..."

[ESCENA 1] Registro (2:30)
- Contraseña débil → Error
- Contraseña fuerte → Éxito

[ESCENA 2] Bloqueo (2:00)
- 5 intentos fallidos
- Cuenta bloqueada ⛔
- Ver BD

[ESCENA 3] Login 2FA (3:00)
- Login correcto
- Pide código 2FA
- Escanear QR
- Ingresar código
- Dashboard ✓

[ESCENA 4] Auditoría (2:00)
- phpMyAdmin → AUDIT_LOG
- Mostrar columnas: quién, cuándo, IP, qué hizo
- Expandir un evento JSON

[ESCENA 5] Cambio Contraseña (1:30)
- Perfil → Seguridad
- Cambiar password
- Verificar en AUDIT_LOG

[RESUMEN - 1 min]
- Diapositiva con requisitos cumplidos ✓

[CRÉDITOS - 5 seg]
```

---

## 🚀 ¡LISTO!

Ahora solo necesitas:

1. **Descargar OBS:** obsproject.com
2. **Ejecutar SQL:** backend/prepare_demo.sql en phpMyAdmin
3. **Iniciar servidores:** npm start (x2 terminales)
4. **Grabar:** Seguir SCRIPT_DETALLADO_VIDEO.md
5. **Subir:** YouTube

**Tiempo total: ~30 minutos**

**Duración video: ~12 minutos**

¿Preguntas? Ver archivos:
- `GUIA_DEMO_VIDEO.md` (completa)
- `SCRIPT_DETALLADO_VIDEO.md` (paso a paso)

¡Buena suerte! 🎬✨
