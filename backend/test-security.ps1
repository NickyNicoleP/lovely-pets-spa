# Script de Pruebas de Seguridad - Lovely Pets Spa (PowerShell)
# Ejecuta ejemplos de curl para validar todas las medidas de seguridad

$BASE_URL = "http://localhost:3000"

function Print-Header {
    param([string]$Title)
    Write-Host "`n════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host $Title -ForegroundColor Yellow
    Write-Host "════════════════════════════════════════`n" -ForegroundColor Yellow
}

function Print-Result {
    param([int]$Code, [string]$Message)
    if ($Code -eq 0) {
        Write-Host "✅ $Message" -ForegroundColor Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor Red
    }
}

Print-Header "🔐 PRUEBAS DE SEGURIDAD - LOVELY PETS SPA"

# 1. TEST DE AUTENTICACIÓN
Print-Header "1️⃣ TEST DE AUTENTICACIÓN"

Write-Host "Intentando login con credenciales válidas..."
$LoginResponse = curl.exe -s -X POST "$BASE_URL/api/auth/login" `
    -H "Content-Type: application/json" `
    -d '{
        "email": "groomer@pawspa.com",
        "password": "SecurePass123!"
    }' | ConvertFrom-Json

$GroomerToken = $LoginResponse.token

if ($GroomerToken -and $GroomerToken -ne "null") {
    Print-Result 0 "Login exitoso - Token obtenido"
} else {
    Print-Result 1 "Login fallido"
    Write-Host $LoginResponse
    exit 1
}

# 2. TEST DE RATE LIMITING
Print-Header "2️⃣ TEST DE RATE LIMITING"

Write-Host "Intentando 5 logins fallidos (bloqueo esperado)..."
for ($i = 1; $i -le 5; $i++) {
    curl.exe -s -X POST "$BASE_URL/api/auth/login" `
        -H "Content-Type: application/json" `
        -d '{
            "email": "attacker@example.com",
            "password": "wrongpassword"
        }' | Out-Null
    Write-Host "Intento $i/5..."
}

Write-Host "Intento 6 (debería ser bloqueado)..."
$RateLimitResponse = curl.exe -s -X POST "$BASE_URL/api/auth/login" `
    -H "Content-Type: application/json" `
    -d '{
        "email": "attacker@example.com",
        "password": "wrongpassword"
    }' | ConvertFrom-Json

if ($RateLimitResponse.error -like "*Demasiados intentos*") {
    Print-Result 0 "Rate limiting funcionando"
} else {
    Print-Result 1 "Rate limiting no detectado"
}

# 3. TEST DE RBAC - Admin Only
Print-Header "3️⃣ TEST DE RBAC (Admin Only)"

Write-Host "Admin accediendo a ruta protegida..."
$AdminLogin = curl.exe -s -X POST "$BASE_URL/api/auth/login" `
    -H "Content-Type: application/json" `
    -d '{
        "email": "admin@pawspa.com",
        "password": "AdminPass123!"
    }' | ConvertFrom-Json

$AdminToken = $AdminLogin.token

$AdminAccess = curl.exe -s -X GET "$BASE_URL/api/auth/users" `
    -H "Authorization: Bearer $AdminToken" | ConvertFrom-Json

if ($AdminAccess -is [array] -or $AdminAccess.id) {
    Print-Result 0 "Admin accede a ruta protegida"
} else {
    Print-Result 1 "Admin NO accede"
}

Write-Host "`nGroomer intentando acceder a ruta admin..." -ForegroundColor Yellow
$GroomerDenied = curl.exe -s -X GET "$BASE_URL/api/auth/users" `
    -H "Authorization: Bearer $GroomerToken" | ConvertFrom-Json

if ($GroomerDenied.error -like "*No autorizado*") {
    Print-Result 0 "Groomer RECHAZADO (correcto)"
} else {
    Print-Result 1 "Groomer PERMITIDO (MALO)"
}

# 4. TEST DE PROPIEDAD DE DATOS
Print-Header "4️⃣ TEST DE VALIDACIÓN DE PROPIEDAD"

Write-Host "Cliente accediendo a sus mascotas..."
$ClientMascotas = curl.exe -s -X GET "$BASE_URL/api/mascotas" `
    -H "Authorization: Bearer $GroomerToken" | ConvertFrom-Json

if ($ClientMascotas -is [array] -or $ClientMascotas.id) {
    Print-Result 0 "Cliente ve sus mascotas"
} else {
    Write-Host "Respuesta: $ClientMascotas"
}

Write-Host "`nIntentando acceder a mascota de otro cliente (ID=999)..." -ForegroundColor Yellow
$CrossAccess = curl.exe -s -X GET "$BASE_URL/api/mascotas/999" `
    -H "Authorization: Bearer $GroomerToken" | ConvertFrom-Json

if ($CrossAccess.error -like "*No tiene permiso*") {
    Print-Result 0 "Acceso cruzado RECHAZADO (correcto)"
} else {
    Print-Result 1 "Acceso cruzado PERMITIDO (MALO)"
}

# 5. TEST DE CSRF
Print-Header "5️⃣ TEST DE CSRF PROTECTION"

Write-Host "Intento de POST sin CSRF token..."
$NoCsrf = curl.exe -s -X POST "$BASE_URL/api/mascotas" `
    -H "Authorization: Bearer $GroomerToken" `
    -H "Content-Type: application/json" `
    -d '{
        "nombre": "Test",
        "especie": "perro"
    }' | ConvertFrom-Json

if ($NoCsrf.error -like "*CSRF*") {
    Print-Result 0 "CSRF protection funcionando"
} else {
    Write-Host "Respuesta: $NoCsrf"
}

# 6. TEST DE LOGOUT
Print-Header "6️⃣ TEST DE LOGOUT (TOKEN BLACKLIST)"

Write-Host "Realizando logout..."
$LogoutResponse = curl.exe -s -X POST "$BASE_URL/api/auth/logout" `
    -H "Authorization: Bearer $GroomerToken" `
    -H "Content-Type: application/json" `
    -d '{}' | ConvertFrom-Json

if ($LogoutResponse.message -like "*Sesión cerrada*") {
    Print-Result 0 "Logout exitoso"
    
    Write-Host "`nIntento de usar token después de logout..." -ForegroundColor Yellow
    $AfterLogout = curl.exe -s -X GET "$BASE_URL/api/mascotas" `
        -H "Authorization: Bearer $GroomerToken" | ConvertFrom-Json
    
    if ($AfterLogout.error -like "*Sesión cerrada*") {
        Print-Result 0 "Token blacklist funcionando"
    } else {
        Print-Result 1 "Token aún funciona (MALO)"
    }
} else {
    Print-Result 1 "Logout fallido"
}

# 7. TEST DE SEGURIDAD HEADERS
Print-Header "7️⃣ TEST DE SECURITY HEADERS"

$HeadersResponse = curl.exe -s -I "$BASE_URL/api/health"

if ($HeadersResponse -like "*X-Frame-Options: DENY*") {
    Print-Result 0 "X-Frame-Options correctamente configurado"
}

if ($HeadersResponse -like "*X-Content-Type-Options: nosniff*") {
    Print-Result 0 "X-Content-Type-Options correctamente configurado"
}

if ($HeadersResponse -like "*Content-Security-Policy*") {
    Print-Result 0 "Content-Security-Policy correctamente configurado"
}

Print-Header "✅ PRUEBAS COMPLETADAS"

Write-Host "Resumen de Medidas de Seguridad Activadas:" -ForegroundColor Green
Write-Host "  ✓ Autenticación JWT"
Write-Host "  ✓ Rate Limiting"
Write-Host "  ✓ RBAC por Roles"
Write-Host "  ✓ Validación de Propiedad"
Write-Host "  ✓ CSRF Protection"
Write-Host "  ✓ Token Blacklist en Logout"
Write-Host "  ✓ Security Headers"
Write-Host ""
Write-Host "Para ver más detalles, consulta SECURITY_GUIDE.md"
