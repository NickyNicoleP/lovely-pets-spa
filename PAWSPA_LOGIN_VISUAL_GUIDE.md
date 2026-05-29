# 🖼️ PawSpa Login - Visual Guide & Screenshots

## Descripción de la Interfaz

### Desktop View (1024px+)
```
┌─────────────────────────────────────────────────────────────────┐
│  FONDO: Gradiente suave rosado (#f5eef4 → blanco)              │
│                                                                 │
│  ┌────────────────────────┐      ┌──────────────────────────┐ │
│  │                        │      │   [Elementos            │ │
│  │   [Logo]               │      │    Decorativos]         │ │
│  │  PawSpa                │      │                         │ │
│  │  Spa para tu mascota   │      │   [Huella de paw]       │ │
│  │                        │      │                         │ │
│  │  [Email Input] ✉       │      │   [Blobs animados]      │ │
│  │  [Password Input] 🔒   │      │                         │ │
│  │                        │      │   [Efectos flotantes]   │ │
│  │  [☑ Recuérdame]        │      │                         │ │
│  │  [¿Olvidaste?]         │      │                         │ │
│  │                        │      │                         │ │
│  │  [INICIAR SESIÓN]      │      │                         │ │
│  │  ___ o continuar ___   │      │                         │ │
│  │  [G] [f] [🍎]          │      │                         │ │
│  │                        │      │                         │ │
│  │  ¿No tienes? REGÍSTRATE│      │                         │ │
│  └────────────────────────┘      └──────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tablet View (768px - 1023px)
```
┌───────────────────────────────┐
│  FONDO: Gradiente rosado      │
│                               │
│  ┌─────────────────────────┐  │
│  │     [Logo]              │  │
│  │    PawSpa               │  │
│  │                         │  │
│  │  [Email Input] ✉        │  │
│  │  [Password Input] 🔒    │  │
│  │                         │  │
│  │  [☑ Recuérdame]         │  │
│  │  [¿Olvidaste?]          │  │
│  │                         │  │
│  │  [INICIAR SESIÓN]       │  │
│  │  ___ o continuar ___    │  │
│  │  [G] [f] [🍎]           │  │
│  │                         │  │
│  │  ¿No tienes? REGÍSTRATE │  │
│  └─────────────────────────┘  │
│                               │
└───────────────────────────────┘
```

### Mobile View (<768px)
```
┌─────────────────┐
│ FONDO: Gradiente│
│                 │
│ ┌─────────────┐ │
│ │  [Logo]     │ │
│ │ PawSpa      │ │
│ │             │ │
│ │[Email] ✉    │ │
│ │[Pass] 🔒    │ │
│ │             │ │
│ │[Recuérdame] │ │
│ │[¿Olvidaste?]│ │
│ │             │ │
│ │[INICIAR]    │ │
│ │___ o ___    │ │
│ │[G][f][🍎]   │ │
│ │             │ │
│ │¿No tienes?  │ │
│ │REGÍSTRATE   │ │
│ └─────────────┘ │
│                 │
└─────────────────┘
```

## Colores Exactos

### Paleta Principal
```
🎨 Rosado Principal:       #e84393 (Botones, acentos)
🎨 Rosado Claro:          #f8d7e8 (Bordes, backgrounds)
🎨 Fondo:                 #f5eef4 (Fondo página)
🎨 Texto Oscuro:          #2d3436 (Textos)
🎨 Gris Suave:            #f0f0f0 (Inputs)
🎨 Rosa Degradada:        #d6307a (Hover botones)
```

### Estados de Inputs
```
🔵 Normal:     Borde #f8d7e8, fondo blanco
🔵 Focus:      Borde #e84393, ring rosado
🔴 Error:      Borde rojo, fondo rojo claro
✅ Valid:      Borde verde, icono ✓
```

## Componentes Visuales

### 1. Logo
```
     🐾
    /  \
   |    |
```
- Icono de paw en un círculo rosado
- Tamaño: 96x96px
- Degradado: #e84393 → #d6307a
- Sombra suave

### 2. Inputs
```
Label: Correo Electrónico *

[✉ tu@email.com                      👁]
└─ Borde redondeado, bordes rosados
```

- Padding: 12px (izq/der), 15px (arr/ab)
- Border-radius: 10px
- Icono izquierda
- Ojo mostrar/ocultar en password
- Validación visual

### 3. Botones

#### Primary (Login)
```
┌─────────────────────────────┐
│  🔄 INICIAR SESIÓN         │  (Loading)
└─────────────────────────────┘
Gradiente: #e84393 → #d6307a
Sombra: shadow-lg
Hover: scale-up, shadow-xl
```

#### Social
```
┌────────┐ ┌────────┐ ┌────────┐
│  [G]   │ │  [f]   │ │  [🍎]  │
└────────┘ └────────┘ └────────┘
Circular, borde gris, hover rosa
```

### 4. Checkbox (Remember Me)
```
☑ Recuérdame
 
Cuando unchecked: □
Cuando checked:   ☑ (con checkmark)
```

### 5. Toast Notification
```
┌─────────────────────────────────────────┐
│ ✓ ¡Bienvenido de vuelta a PawSpa! 🐾   │
└─────────────────────────────────────────┘
Auto-dismiss: 4 segundos
Esquina: top-right
```

## Animaciones Visuales

### Entrance Animation
```
Página carga con fade-in suave
Tarjeta entra desde abajo (slide-up)
Logo tiene bounce suave
```

### Hover Effects
```
Botones: Scale 105% + sombra aumenta
Inputs: Borde color cambia
Social: Escala 110% + color cambia
Links: Color hover suave
```

### Loading State
```
Spinner: Rotación continua
Botón: Opacidad 0.7
Icono + texto "Procesando..."
```

### Floating Elements (Desktop)
```
Blobs: Flotan arriba/abajo lentamente
Huella: Rotada 45°, opacidad 10%
Hearts: Flotan con delay diferente
```

## Interactividad

### Focus Ring
```
El foco se ve así: Círculo punteado 2px #e84393
Offset: 2px desde el elemento
```

### Error Messaging
```
Campo con error:
  ✗ El correo electrónico es inválido
  └─ Texto rojo, icono de error
```

### Success Messaging
```
Toast verde:
  ✓ Código de verificación enviado exitosamente
```

## Typography

### Headings
```
H1: PawSpa
  Font: Poppins
  Weight: 900
  Size: 48px
  Color: #2d3436

H2: Bienvenido de Vuelta
  Font: Poppins
  Weight: 700
  Size: 28px
  Color: #2d3436
```

### Body Text
```
Label: Correo Electrónico *
  Font: Poppins
  Weight: 600
  Size: 14px
  Color: #2d3436

Placeholder: tu@email.com
  Font: Poppins
  Weight: 400
  Size: 16px
  Color: #999
```

### Links
```
¿Olvidaste tu contraseña?
  Font: Poppins
  Weight: 500
  Size: 14px
  Color: #e84393
  Hover: #d6307a
  Decoration: Underline on hover
```

## Spacing

```
Logo a título:            24px
Título a descripción:     12px
Descripción a inputs:     24px
Entre inputs:             20px
Input a botón:            24px
Botón a separador:        24px
Separador a social:       24px
Social a link:            24px
Padding card:             32px
```

## Shadows

```
Card principal:     shadow-2xl (fuerte)
Logo:               shadow-lg (medio)
Botones:            shadow-lg normal, shadow-xl hover
Inputs:             Ninguna (limpio)
Toast:              shadow-lg
```

## Border Radius

```
Card principal:     25px (rounded-3xl)
Inputs:             10px (rounded-lg)
Botones:            10px (rounded-lg) - sociales: 9999px (circular)
Logo:               50% (circular)
Toast:              12px (rounded-xl)
```

## Responsive Breakpoints

```
Mobile:    < 768px   (1 columna, elementos apilados)
Tablet:    768-1023px (1 columna, más espacio)
Desktop:   1024px+   (2 columnas, decoración visible)
```

## Decorative Elements (Desktop Only)

```
Background Blobs:
  - 2 blobs grandes semi-transparentes
  - Posición: esquinas opuestas
  - Movimiento: float lento
  - Color: degradado rosado
  - Blur: 3xl

Paw Icon:
  - Elemento SVG flotante
  - Opacidad: 10%
  - Tamaño: 200x200px
  - Posición: inferior derecha
  
Hearts/Sparkles:
  - Emojis flotantes
  - Opacidad variable
  - Movimiento: float con delay
```

## Accessibility Colors

```
✅ Contraste texto/fondo: > 4.5:1
✅ Contraste botón/fondo: > 4.5:1
✅ Focus ring: Visible y contrastante
✅ Modo oscuro ready: Si se implementa
```

## Dark Mode Ready (Future)

```
Adaptable a tema oscuro:
- Fondo: #1a1a1a
- Card: #2d2d2d
- Textos: #f5f5f5
- Acentos: #ff1493 (más brillante)
```

## Print Styles (Si necesario)

```
- Logo imprime en blanco/negro
- Ocultar decoraciones
- Fuentes print-friendly
- Sin animaciones
```

---

**Visual Design Version:** 1.0
**Last Updated:** 26 de Mayo de 2026
**Status:** ✅ PRODUCTION READY
