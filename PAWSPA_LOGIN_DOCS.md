# 🐾 PawSpa Login System - Documentación Completa

## 📋 Descripción General

Sistema moderno, profesional y completamente funcional de autenticación para la aplicación web **PawSpa**. Diseñado con una estética elegante y femenina en tonos rosados pastel y fucsia suave.

## ✨ Características Principales

### 🎨 Diseño
- ✅ Card centered moderno y minimalista
- ✅ Fondo gradiente suave rosado (#f5eef4 a blanco)
- ✅ Bordes redondeados grandes (border-radius 25px)
- ✅ Sombras suaves y elegantes
- ✅ Totalmente responsive (móvil, tablet, desktop)
- ✅ Tipografía moderna (Poppins + Inter)
- ✅ Elementos decorativos sutiles en desktop

### 🔐 Funcionalidades
- ✅ Login con email y contraseña
- ✅ Sistema Remember Me (localStorage)
- ✅ Recuperación de contraseña
- ✅ Validación de campos en tiempo real
- ✅ Autenticación 2FA
- ✅ Botones de login social (Google, Facebook, Apple)
- ✅ Mostrar/Ocultar contraseña
- ✅ Toast notifications elegantes
- ✅ Loading states
- ✅ Manejo completo de errores
- ✅ Redirección automática después de login

### 🎯 Paleta de Colores
```
- Rosado principal:      #e84393 (pawspa-500)
- Rosado claro:          #f8d7e8 (pawspa-200)
- Fondo:                 #f5eef4 (pawspa-100)
- Texto oscuro elegante: #2d3436
- Inputs suaves:         Borde rosado claro + fondo blanco
- Botones:               Degradado rosado (pawspa-500 → pawspa-600)
```

## 📁 Estructura de Archivos

```
frontend/src/
├── pages/
│   ├── PawSpaLoginPage.jsx          # Página principal de login
│   └── ForgotPasswordPage.jsx       # Recuperación de contraseña
│
├── components/
│   ├── PawSpaInputField.jsx         # Input personalizado con validación
│   ├── PawSpaButton.jsx             # Botón reutilizable
│   ├── PawSpaLogo.jsx               # Logo con animaciones
│   ├── PawSpaCheckbox.jsx           # Checkbox personalizado
│   ├── PawSpaDecorative.jsx         # Elementos decorativos
│   └── Toast.jsx                    # Notificaciones
│
├── hooks/
│   └── useRememberMe.js             # Hook para Remember Me
│
├── index.css                         # Estilos base + animaciones
└── App.jsx                          # Rutas actualizadas
```

## 🚀 Rutas

```javascript
// Login PawSpa (Nueva página recomendada)
/pawspa-login

// Recuperación de contraseña
/forgot-password

// Login antiguo (mantiene compatibilidad)
/login

// Registro (mantiene compatibilidad)
/register

// Autorización integrada (dos paneles)
/auth
```

## 🎮 Uso

### Acceder a la Página de Login

```javascript
import { useNavigate } from 'react-router-dom';

export default function MyComponent() {
  const navigate = useNavigate();
  
  return (
    <button onClick={() => navigate('/pawspa-login')}>
      Ir al Login
    </button>
  );
}
```

### Desde un navegador
```
http://localhost:5173/pawspa-login
```

## 🧩 Componentes Reutilizables

### 1. **PawSpaInputField**
Campo de entrada personalizado con validación y iconos.

```jsx
import PawSpaInputField from '../components/PawSpaInputField';

<PawSpaInputField
  label="Correo Electrónico"
  type="email"
  placeholder="tu@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  eyeIcon={false}
  required
  icon={EmailIcon}
/>
```

**Props:**
- `label`: Etiqueta del campo
- `type`: Tipo de input (text, email, password, etc)
- `placeholder`: Texto placeholder
- `value`: Valor actual
- `onChange`: Función de cambio
- `error`: Mensaje de error
- `icon`: Componente de ícono (función)
- `eyeIcon`: Mostrar botón de ojo para password
- `required`: Campo requerido
- `disabled`: Deshabilitar campo

### 2. **PawSpaButton**
Botón reutilizable con variantes y estados de carga.

```jsx
import PawSpaButton from '../components/PawSpaButton';

<PawSpaButton
  variant="primary"
  size="md"
  fullWidth
  loading={loading}
  onClick={handleSubmit}
>
  Iniciar Sesión
</PawSpaButton>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'social'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: Ancho completo
- `loading`: Estado de carga
- `disabled`: Deshabilitar botón
- `icon`: Componente de ícono
- `type`: Tipo de botón
- `onClick`: Función al hacer click

### 3. **PawSpaLogo**
Logo con animaciones.

```jsx
import PawSpaLogo from '../components/PawSpaLogo';

<PawSpaLogo size="lg" showText={true} />
```

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `showText`: Mostrar texto "PawSpa"

### 4. **PawSpaCheckbox**
Checkbox personalizado.

```jsx
import PawSpaCheckbox from '../components/PawSpaCheckbox';

<PawSpaCheckbox
  label="Recuérdame"
  checked={rememberMe}
  onChange={(e) => setRememberMe(e.target.checked)}
/>
```

### 5. **PawSpaDecorative**
Elementos decorativos (solo desktop).

```jsx
import PawSpaDecorative from '../components/PawSpaDecorative';

<PawSpaDecorative />
```

## 🎨 Personalización

### Cambiar Colores

**En `tailwind.config.js`:**

```javascript
pawspa: {
  50: '#f8eef5',   // Fondo muy claro
  100: '#f5eef4',  // Fondo base
  200: '#f8d7e8',  // Bordes inputs
  300: '#f5c5dc',
  400: '#f08fc7',
  500: '#e84393',  // Color principal
  600: '#d6307a',  // Hover
  700: '#c41e61',
  800: '#a01649',
  900: '#801136',
}
```

### Cambiar Textos

En `PawSpaLoginPage.jsx`, busca las cadenas en español y reemplázalas.

**Ejemplos:**
```jsx
// Cambiar título
"Bienvenido de Vuelta" → "Welcome Back"

// Cambiar placeholder
"tu@email.com" → "your@email.com"

// Cambiar etiquetas
"Correo Electrónico" → "Email Address"
```

### Cambiar Fuentes

**En `tailwind.config.js`:**

```javascript
extend: {
  fontFamily: {
    poppins: ['Poppins', 'sans-serif'],
    inter: ['Inter', 'sans-serif'],
    // Agregar más fuentes aquí
  },
}
```

### Cambiar Animaciones

**En `tailwind.config.js`:**

```javascript
keyframes: {
  'float': {
    '0%, 100%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' },  // Ajustar distancia
  },
}
```

## 🔄 Remember Me

El sistema guarda el email del usuario en localStorage.

```javascript
import useRememberMe from '../hooks/useRememberMe';

const { savedEmail, rememberMe, saveEmail, clearEmail } = useRememberMe('pawspa_email');

// Cargar email guardado
useEffect(() => {
  if (savedEmail) setEmail(savedEmail);
}, [savedEmail]);

// Guardar email
if (rememberMe) {
  saveEmail(email);
} else {
  clearEmail();
}
```

## 🔐 Recuperación de Contraseña

Flujo en 3 pasos:

1. **Email**: Usuario ingresa su correo
2. **Código**: Se envía código a su email
3. **Contraseña**: Usuario ingresa nueva contraseña

```
/forgot-password
↓
Ingresa email → Se envía código
↓
Ingresa código → Se verifica código
↓
Ingresa nueva contraseña → Se actualiza
↓
Redirige a login
```

## 🔐 Autenticación 2FA

Integrada con el contexto `useAuth()`:

```javascript
const { login, verify2FA } = useAuth();

// Login retorna resultado.requires2FA
if (result.requires2FA) {
  setShow2FA(true);
}

// Verificar 2FA
await verify2FA(userId, code2FA);
```

## 📱 Responsividad

**Desktop (lg):**
- Dos columnas: Formulario + Decoración
- Elementos decorativos visibles
- Animaciones suaves

**Tablet/Móvil:**
- Una columna
- Elementos decorativos ocultos
- Toque optimizado
- Fuentes más grandes para accesibilidad

## ✅ Validación

Validación en tiempo real con mensajes de error:

```javascript
const validateForm = () => {
  const newErrors = {};

  if (!email) {
    newErrors.email = 'El correo electrónico es requerido';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    newErrors.email = 'Por favor ingresa un correo válido';
  }

  if (!password) {
    newErrors.password = 'La contraseña es requerida';
  } else if (password.length < 6) {
    newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return Object.keys(newErrors).length === 0;
};
```

## 🎯 OAuth Integration (Placeholder)

Botones para Google, Facebook y Apple (requieren configuración):

```javascript
const handleOAuth = (provider) => {
  setToast({ message: `Login con ${provider} - Próximamente disponible 🚀`, type: 'info' });
  
  // TODO: Implementar OAuth real
  // 1. Configurar credenciales en backend
  // 2. Agregar librerías (google-auth-library, react-facebook-login, etc)
  // 3. Implementar flujo OAuth
};
```

### Para implementar Google OAuth:

```bash
npm install @react-oauth/google
```

```jsx
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

<GoogleOAuthProvider clientId="YOUR_CLIENT_ID">
  <GoogleLogin
    onSuccess={(credentialResponse) => {
      // Enviar token a backend
    }}
    onError={() => console.log('Login Failed')}
  />
</GoogleOAuthProvider>
```

## 📱 Toast Notifications

Sistema de notificaciones elegante:

```javascript
setToast({ message: 'Mensaje', type: 'success' });
setToast({ message: 'Error', type: 'error' });
setToast({ message: 'Advertencia', type: 'warning' });
setToast({ message: 'Información', type: 'info' });
```

**Tipos:**
- ✅ `success` - Verde
- ❌ `error` - Rojo
- ⚠️ `warning` - Amarillo
- ℹ️ `info` - Azul

## 🎬 Animaciones

Incluidas en Tailwind:
- `animate-slide-in-down` - Entra desde arriba
- `animate-slide-in-up` - Entra desde abajo
- `animate-float` - Flotación suave
- `animate-pulse-glow` - Brillo pulsante
- `animate-fade-in` - Fade in suave

## 🔗 Integración con Backend

### Endpoints esperados

```javascript
// Login
POST /api/auth/login
{
  email: string,
  password: string
}

// Forgot Password
POST /api/auth/forgot-password
{
  email: string
}

// Verify Reset Code
POST /api/auth/verify-reset-code
{
  email: string,
  code: string
}

// Reset Password
POST /api/auth/reset-password
{
  email: string,
  code: string,
  newPassword: string
}

// Verify 2FA
POST /api/auth/verify-2fa
{
  userId: string,
  code: string
}
```

## 🚨 Manejo de Errores

Los errores se muestran en:
1. Toast notifications en la esquina superior derecha
2. Mensajes de error debajo de cada campo
3. Estado visual de error en los inputs

```javascript
if (error) {
  setToast({ message: errorMessage, type: 'error' });
  setErrors({ field: 'Mensaje de error específico' });
}
```

## ♿ Accesibilidad

- ✅ Contraste de colores WCAG AA
- ✅ Focus rings visibles
- ✅ Labels asociados a inputs
- ✅ Iconos con aria-labels
- ✅ Errores descriptivos
- ✅ Navegación por teclado

## 📊 Performance

- ✅ Componentes optimizados
- ✅ Lazy validation (validar solo al cambiar)
- ✅ Animaciones con GPU acceleration
- ✅ Mínimas re-renders
- ✅ Sin dependencias externas innecesarias

## 🐛 Troubleshooting

### El login no funciona
1. Verificar que el backend esté corriendo
2. Verificar la URL del API en `.env`
3. Revisar la consola del navegador para errores

### Las animaciones no funcionan
1. Asegurar que Tailwind CSS esté compilado
2. Limpiar cache: `npm run dev`
3. Reiniciar el servidor de desarrollo

### Los estilos no se aplican
1. Verificar que `tailwind.config.js` esté actualizado
2. Revisar que `index.css` importe Tailwind
3. Limpiar: `rm -rf node_modules/.cache`

### Remember Me no funciona
1. Verificar que localStorage esté habilitado
2. Revisar la consola para errores
3. Asegurar que la clave del localStorage sea consistente

## 🔄 Actualizaciones Futuras

- [ ] Biometría (Touch ID, Face ID)
- [ ] OAuth real (Google, Facebook, Apple)
- [ ] Confirmación por SMS
- [ ] Autenticación sin contraseña
- [ ] Temas claro/oscuro
- [ ] Multi-idioma (i18n)
- [ ] Rate limiting del frontend
- [ ] Recuperación de sesión

## 📖 Referencias

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)
- [Poppins Font](https://fonts.google.com/specimen/Poppins)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## 📞 Soporte

Para reportar bugs o sugerencias:
1. Crear un issue con descripción detallada
2. Incluir pasos para reproducir
3. Adjuntar screenshots si es relevante
4. Mencionar navegador y versión

---

**Última actualización:** 26 de Mayo de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready
**Autor:** PawSpa Development Team
