# Script para iniciar desarrollo local con IP automática
# Detecta tu IP local y muestra las URLs de acceso

Write-Host "🚀 Iniciando Sistema QR - Desarrollo Local" -ForegroundColor Cyan
Write-Host "=========================================`n" -ForegroundColor Cyan

# Detectar IP local
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" } | 
    Select-Object -First 1).IPAddress

if ($localIP) {
    Write-Host "🌐 IP Local detectada: $localIP" -ForegroundColor Green
} else {
    $localIP = "localhost"
    Write-Host "⚠️  No se detectó IP local, usando: $localIP" -ForegroundColor Yellow
}

Write-Host "`n📍 URLs de acceso:" -ForegroundColor Cyan
Write-Host "   Frontend (PC):        https://localhost:5173/" -ForegroundColor White
Write-Host "   Frontend (Móvil):     https://${localIP}:5173/" -ForegroundColor Yellow
Write-Host "   Backend (API):        https://${localIP}:3443/api" -ForegroundColor White
Write-Host ""

# Verificar si PostgreSQL está corriendo
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Cyan
$postgres = Get-Process postgres -ErrorAction SilentlyContinue
if ($postgres) {
    Write-Host "✅ PostgreSQL está corriendo" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL NO está corriendo - Inicia PostgreSQL primero" -ForegroundColor Red
    Write-Host "   Puedes iniciarlo desde pgAdmin o servicios de Windows" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "`n📦 Iniciando servidores...`n" -ForegroundColor Cyan

# Crear dos ventanas de terminal nuevas
# 1. Backend
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; Write-Host '🔧 Backend - https://$localIP:3443' -ForegroundColor Cyan; npm run dev"

# Esperar 3 segundos para que el backend inicie
Start-Sleep -Seconds 3

# 2. Frontend
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '🎨 Frontend - https://$localIP:5173' -ForegroundColor Cyan; npm run dev"

Write-Host "`n✅ Servidores iniciados en ventanas separadas" -ForegroundColor Green
Write-Host "`n📱 Para probar desde tu móvil:" -ForegroundColor Yellow
Write-Host "   1. Asegúrate de estar en la misma red WiFi" -ForegroundColor White
Write-Host "   2. Abre en el navegador: https://${localIP}:5173/" -ForegroundColor White
Write-Host "   3. Acepta el certificado autofirmado (Avanzado > Continuar)" -ForegroundColor White
Write-Host ""

pause
