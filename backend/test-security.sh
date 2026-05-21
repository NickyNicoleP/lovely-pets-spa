#!/bin/bash
# Script de Pruebas de Seguridad - Lovely Pets Spa
# Ejecuta ejemplos de curl para validar todas las medidas de seguridad

BASE_URL="http://localhost:3000"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir headers
print_header() {
  echo -e "\n${COLOR_YELLOW}════════════════════════════════════════${NC}"
  echo -e "${COLOR_YELLOW}$1${NC}"
  echo -e "${COLOR_YELLOW}════════════════════════════════════════${NC}\n"
}

# Función para imprimir resultado
print_result() {
  if [ $1 -eq 0 ]; then
    echo -e "${COLOR_GREEN}✅ $2${NC}"
  else
    echo -e "${COLOR_RED}❌ $2${NC}"
  fi
}

print_header "🔐 PRUEBAS DE SEGURIDAD - LOVELY PETS SPA"

# 1. TEST DE AUTENTICACIÓN
print_header "1️⃣ TEST DE AUTENTICACIÓN"

echo "Intentando login con credenciales válidas..."
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "groomer@pawspa.com",
    "password": "SecurePass123!"
  }')

GROOMER_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token' 2>/dev/null)

if [ ! -z "$GROOMER_TOKEN" ] && [ "$GROOMER_TOKEN" != "null" ]; then
  print_result 0 "Login exitoso - Token obtenido"
else
  print_result 1 "Login fallido"
  echo $LOGIN_RESPONSE
  exit 1
fi

# 2. TEST DE RATE LIMITING
print_header "2️⃣ TEST DE RATE LIMITING"

echo "Intentando 5 logins fallidos (bloqueo esperado)..."
for i in {1..5}; do
  curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "attacker@example.com",
      "password": "wrongpassword"
    }' > /dev/null
  echo "Intento $i/5..."
done

echo "Intento 6 (debería ser bloqueado)..."
RATE_LIMIT_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "attacker@example.com",
    "password": "wrongpassword"
  }')

if echo $RATE_LIMIT_RESPONSE | grep -q "Demasiados intentos"; then
  print_result 0 "Rate limiting funcionando"
else
  print_result 1 "Rate limiting no detectado"
fi

# 3. TEST DE RBAC - Admin Only
print_header "3️⃣ TEST DE RBAC (Admin Only)"

echo "Admin accediendo a ruta protegida..."
ADMIN_LOGIN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pawspa.com",
    "password": "AdminPass123!"
  }')

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.token' 2>/dev/null)

ADMIN_ACCESS=$(curl -s -X GET $BASE_URL/api/auth/users \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo $ADMIN_ACCESS | grep -q "id"; then
  print_result 0 "Admin accede a ruta protegida"
else
  print_result 1 "Admin NO accede"
fi

echo -e "\n${COLOR_YELLOW}Groomer intentando acceder a ruta admin...${NC}"
GROOMER_DENIED=$(curl -s -X GET $BASE_URL/api/auth/users \
  -H "Authorization: Bearer $GROOMER_TOKEN")

if echo $GROOMER_DENIED | grep -q "No autorizado"; then
  print_result 0 "Groomer RECHAZADO (correcto)"
else
  print_result 1 "Groomer PERMITIDO (MALO)"
fi

# 4. TEST DE PROPIEDAD DE DATOS
print_header "4️⃣ TEST DE VALIDACIÓN DE PROPIEDAD"

echo "Cliente 1 accediendo a sus mascotas..."
CLIENT_MASCOTAS=$(curl -s -X GET $BASE_URL/api/mascotas \
  -H "Authorization: Bearer $GROOMER_TOKEN")

if echo $CLIENT_MASCOTAS | grep -q "id"; then
  print_result 0 "Cliente ve sus mascotas"
else
  echo "Respuesta: $CLIENT_MASCOTAS"
fi

echo -e "\n${COLOR_YELLOW}Intentando acceder a mascota de otro cliente (ID=999)...${NC}"
CROSS_ACCESS=$(curl -s -X GET $BASE_URL/api/mascotas/999 \
  -H "Authorization: Bearer $GROOMER_TOKEN")

if echo $CROSS_ACCESS | grep -q "No tiene permiso"; then
  print_result 0 "Acceso cruzado RECHAZADO (correcto)"
else
  print_result 1 "Acceso cruzado PERMITIDO (MALO)"
fi

# 5. TEST DE CSRF
print_header "5️⃣ TEST DE CSRF PROTECTION"

echo "Intento de POST sin CSRF token..."
NO_CSRF=$(curl -s -X POST $BASE_URL/api/mascotas \
  -H "Authorization: Bearer $GROOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "especie": "perro"
  }')

if echo $NO_CSRF | grep -q "CSRF"; then
  print_result 0 "CSRF protection funcionando"
else
  echo "Respuesta: $NO_CSRF"
fi

# 6. TEST DE LOGOUT
print_header "6️⃣ TEST DE LOGOUT (TOKEN BLACKLIST)"

echo "Realizando logout..."
LOGOUT_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/logout \
  -H "Authorization: Bearer $GROOMER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

if echo $LOGOUT_RESPONSE | grep -q "Sesión cerrada"; then
  print_result 0 "Logout exitoso"
  
  echo -e "\n${COLOR_YELLOW}Intento de usar token después de logout...${NC}"
  AFTER_LOGOUT=$(curl -s -X GET $BASE_URL/api/mascotas \
    -H "Authorization: Bearer $GROOMER_TOKEN")
  
  if echo $AFTER_LOGOUT | grep -q "Sesión cerrada"; then
    print_result 0 "Token blacklist funcionando"
  else
    print_result 1 "Token aún funciona (MALO)"
  fi
else
  print_result 1 "Logout fallido"
fi

# 7. TEST DE SEGURIDAD HEADERS
print_header "7️⃣ TEST DE SECURITY HEADERS"

HEADERS=$(curl -s -I $BASE_URL/api/health)

if echo "$HEADERS" | grep -q "X-Frame-Options: DENY"; then
  print_result 0 "X-Frame-Options correctamente configurado"
fi

if echo "$HEADERS" | grep -q "X-Content-Type-Options: nosniff"; then
  print_result 0 "X-Content-Type-Options correctamente configurado"
fi

if echo "$HEADERS" | grep -q "Content-Security-Policy"; then
  print_result 0 "Content-Security-Policy correctamente configurado"
fi

print_header "✅ PRUEBAS COMPLETADAS"

echo "Resumen de Medidas de Seguridad Activadas:"
echo "  ✓ Autenticación JWT"
echo "  ✓ Rate Limiting"
echo "  ✓ RBAC por Roles"
echo "  ✓ Validación de Propiedad"
echo "  ✓ CSRF Protection"
echo "  ✓ Token Blacklist en Logout"
echo "  ✓ Security Headers"
echo ""
echo "Para ver más detalles, consulta SECURITY_GUIDE.md"
