# Script para configurar automáticamente la URL del backend según la IP actual
# Uso: .\configurar-red-frontend.ps1

Write-Host "🌐 Configurador de Red para Frontend SISQR6" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Obtener la IP local actual
$ipLocal = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like "192.168.*" } | Select-Object -First 1).IPAddress

if ($ipLocal) {
    Write-Host "✅ IP Local detectada: $ipLocal" -ForegroundColor Green
} else {
    Write-Host "⚠️  No se detectó IP local, usando localhost" -ForegroundColor Yellow
    $ipLocal = "localhost"
}

Write-Host ""
Write-Host "Selecciona el modo de conexión:" -ForegroundColor Yellow
Write-Host "1. HTTP Localhost (http://localhost:3000)" -ForegroundColor White
Write-Host "2. HTTPS Localhost (https://localhost:3443)" -ForegroundColor White
Write-Host "3. HTTP Red Local (http://$ipLocal:3000)" -ForegroundColor White
Write-Host "4. HTTPS Red Local (https://$ipLocal:3443)" -ForegroundColor White
Write-Host "5. Personalizado" -ForegroundColor White
Write-Host ""

$opcion = Read-Host "Opción (1-5)"

switch ($opcion) {
    "1" {
        $apiUrl = "http://localhost:3000"
        $modo = "HTTP Localhost"
    }
    "2" {
        $apiUrl = "https://localhost:3443"
        $modo = "HTTPS Localhost"
    }
    "3" {
        $apiUrl = "http://${ipLocal}:3000"
        $modo = "HTTP Red Local"
    }
    "4" {
        $apiUrl = "https://${ipLocal}:3443"
        $modo = "HTTPS Red Local"
    }
    "5" {
        $apiUrl = Read-Host "Ingresa la URL completa del backend"
        $modo = "Personalizado"
    }
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

# Crear archivo .env.local
$envContent = @"
# Variables de entorno LOCALES
# Generado automáticamente el $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Modo: $modo

VITE_API_URL=$apiUrl
"@

$envPath = Join-Path (Get-Location) ".env.local"
$envContent | Out-File -FilePath $envPath -Encoding UTF8

Write-Host ""
Write-Host "✅ Configuración actualizada exitosamente" -ForegroundColor Green
Write-Host "📁 Archivo: .env.local" -ForegroundColor Cyan
Write-Host "🌐 Backend URL: $apiUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔄 Recuerda reiniciar el servidor de desarrollo (npm run dev)" -ForegroundColor Yellow
Write-Host ""

# Mostrar contenido del archivo
Write-Host "📄 Contenido de .env.local:" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Gray
Get-Content $envPath | ForEach-Object { Write-Host $_ -ForegroundColor White }
Write-Host "----------------------------" -ForegroundColor Gray
