#!/bin/bash
# ============================================================
# CHECKLIST PRE-GRABACIÓN - SISTEMA PET SPA
# ============================================================
# Ejecutar esta lista antes de grabar el video

echo "🎬 CHECKLIST PRE-GRABACIÓN"
echo "=================================="

# 1. VERIFICAR MYSQL
echo ""
echo "1️⃣  Verificar MySQL..."
echo "   ✓ Abrir phpMyAdmin: http://localhost/phpmyadmin"
echo "   ✓ Ejecutar archivo: backend/prepare_demo.sql"
echo "   ✓ Verificar credenciales creadas"
read -p "¿MySQL está listo? (s/n) " mysql_ok

# 2. VERIFICAR BACKEND
echo ""
echo "2️⃣  Verificar Backend Node.js..."
echo "   Comando:"
echo "   cd backend && npm start"
echo ""
read -p "¿Backend está corriendo en puerto 3000? (s/n) " backend_ok

# 3. VERIFICAR FRONTEND
echo ""
echo "3️⃣  Verificar Frontend Vite..."
echo "   Comando (en terminal nueva):"
echo "   cd frontend && npm run dev"
echo ""
read -p "¿Frontend está corriendo en puerto 5173? (s/n) " frontend_ok

# 4. PROBAR LOGIN
echo ""
echo "4️⃣  Probar Login..."
echo "   URL: http://localhost:5173/login"
echo "   Email: admin@pawspa.com"
echo "   Password: Admin@Spa123!"
echo ""
read -p "¿Login funciona? (s/n) " login_ok

# 5. PREPARAR OBS
echo ""
echo "5️⃣  Preparar OBS Studio..."
echo "   ✓ Descargar: https://obsproject.com/"
echo "   ✓ Crear nueva escena"
echo "   ✓ Captura de pantalla/ventana"
echo "   ✓ Ajustar micrófono"
echo "   ✓ Resolución: 1920x1080"
echo "   ✓ FPS: 30"
echo ""
read -p "¿OBS Studio está configurado? (s/n) " obs_ok

# 6. RESUMEN
echo ""
echo "=================================="
if [ "$mysql_ok" = "s" ] && [ "$backend_ok" = "s" ] && [ "$frontend_ok" = "s" ] && [ "$login_ok" = "s" ] && [ "$obs_ok" = "s" ]; then
    echo "✅ ¡TODO LISTO PARA GRABAR!"
    echo ""
    echo "📺 ORDEN DE ESCENAS:"
    echo "1. Registro & Validación (2:30 min)"
    echo "2. Bloqueo por intentos fallidos (2 min)"
    echo "3. Login & 2FA (3 min)"
    echo "4. Auditoría en BD (2 min)"
    echo "5. Cambio de contraseña (1:30 min)"
    echo "6. Resumen (1 min)"
    echo ""
    echo "⏱️  DURACIÓN TOTAL: 10-12 minutos"
else
    echo "❌ Por favor, completa los pasos pendientes"
fi

echo ""
echo "=================================="
echo "Ver guía completa en: GUIA_DEMO_VIDEO.md"
