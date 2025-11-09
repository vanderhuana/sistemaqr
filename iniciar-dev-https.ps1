# Ejecutar frontend y backend localmente con HTTPS
# Esto permite usar la cámara en dispositivos móviles

Write-Host "=== Iniciando Frontend y Backend con HTTPS ===" -ForegroundColor Cyan
Write-Host ""

# Verificar que existan los certificados
if (-not (Test-Path ".\backend\ssl\server.pfx")) {
    Write-Host "❌ No se encontraron certificados SSL" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\generar-certificados.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Certificados SSL encontrados" -ForegroundColor Green

# Configurar firewall
Write-Host ""
Write-Host "Configurando firewall..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "SisQR6 Vite Dev" `
        -Direction Inbound `
        -LocalPort 5173 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction SilentlyContinue
    Write-Host "✅ Puerto 5173 (Vite) permitido" -ForegroundColor Green
} catch {}

try {
    New-NetFirewallRule -DisplayName "SisQR6 Backend HTTPS" `
        -Direction Inbound `
        -LocalPort 3443 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction SilentlyContinue
    Write-Host "✅ Puerto 3443 (Backend HTTPS) permitido" -ForegroundColor Green
} catch {}

Write-Host ""
Write-Host "=== Instrucciones ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Abre DOS VENTANAS de PowerShell" -ForegroundColor White
Write-Host ""
Write-Host "2. En la PRIMERA ventana (Backend):" -ForegroundColor Yellow
Write-Host "   cd D:\sisfipo\sisqr6\backend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. En la SEGUNDA ventana (Frontend):" -ForegroundColor Yellow
Write-Host "   cd D:\sisfipo\sisqr6\frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Desde tu móvil, accede a:" -ForegroundColor Green
Write-Host "   https://192.168.1.4:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Acepta la advertencia de certificado" -ForegroundColor White
Write-Host ""
Write-Host "6. ¡La cámara debería funcionar! ✅" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Nota: Ambos servicios (backend y frontend) deben estar corriendo" -ForegroundColor Yellow
Write-Host ""
