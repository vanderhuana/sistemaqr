# Script completo para configurar HTTPS y acceso desde dispositivos móviles
# Ejecutar como Administrador

Write-Host "=== Configuración HTTPS para Cámara QR ===" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Generar certificados SSL
Write-Host "Paso 1: Generando certificados SSL..." -ForegroundColor Yellow
& "$PSScriptRoot\generar-certificados.ps1"

Write-Host ""
Write-Host "Paso 2: Configurando Firewall..." -ForegroundColor Yellow
& "$PSScriptRoot\configurar-firewall-local.ps1"

Write-Host ""
Write-Host "Paso 3: Copiando archivo de configuración HTTPS..." -ForegroundColor Yellow
Copy-Item "$PSScriptRoot\frontend\.env.production.https" "$PSScriptRoot\frontend\.env.production" -Force
Write-Host "✅ Archivo .env.production actualizado para HTTPS" -ForegroundColor Green

Write-Host ""
Write-Host "Paso 4: Reconstruyendo contenedores Docker..." -ForegroundColor Yellow
Set-Location $PSScriptRoot
docker-compose down
docker-compose build --no-cache backend frontend
docker-compose up -d

Write-Host ""
Write-Host "=== Configuración Completada ===" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Para usar la cámara desde dispositivos móviles:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Conecta tu móvil a la misma red WiFi" -ForegroundColor White
Write-Host ""
Write-Host "2. Abre el navegador y ve a:" -ForegroundColor White
Write-Host "   https://192.168.1.4:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Aceptar la advertencia de certificado:" -ForegroundColor White
Write-Host "   - Safari (iOS): Tap 'Continuar' o 'Mostrar detalles' > 'visitar este sitio web'" -ForegroundColor Gray
Write-Host "   - Chrome (Android): Tap 'Opciones avanzadas' > 'Continuar a 192.168.1.4 (no seguro)'" -ForegroundColor Gray
Write-Host "   - Firefox (Android): Tap 'Opciones avanzadas' > 'Aceptar el riesgo y continuar'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. La cámara debería funcionar ahora ✅" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Nota: Es normal ver la advertencia de certificado en HTTPS local" -ForegroundColor Yellow
Write-Host "   El certificado es autofirmado pero la conexión es segura en tu red local" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Verificar estado:" -ForegroundColor Cyan
Write-Host "   docker-compose ps" -ForegroundColor Gray
Write-Host "   docker-compose logs backend" -ForegroundColor Gray
Write-Host ""
