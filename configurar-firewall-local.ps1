# Configurar Firewall de Windows para acceso desde red local
# Ejecutar como Administrador

Write-Host "Configurando Firewall de Windows para SisQR6..." -ForegroundColor Cyan

# Permitir puerto 8080 (Frontend)
try {
    New-NetFirewallRule -DisplayName "SisQR6 Frontend" `
        -Direction Inbound `
        -LocalPort 8080 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction Stop
    Write-Host "✅ Puerto 8080 (Frontend) permitido" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Regla para puerto 8080 ya existe o error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Permitir puerto 8443 (Frontend HTTPS)
try {
    New-NetFirewallRule -DisplayName "SisQR6 Frontend HTTPS" `
        -Direction Inbound `
        -LocalPort 8443 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction Stop
    Write-Host "✅ Puerto 8443 (Frontend HTTPS) permitido" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Regla para puerto 8443 ya existe o error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Permitir puerto 3001 (Backend API)
try {
    New-NetFirewallRule -DisplayName "SisQR6 Backend API" `
        -Direction Inbound `
        -LocalPort 3001 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction Stop
    Write-Host "✅ Puerto 3001 (Backend) permitido" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Regla para puerto 3001 ya existe o error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Permitir puerto 3443 (Backend HTTPS)
try {
    New-NetFirewallRule -DisplayName "SisQR6 Backend HTTPS" `
        -Direction Inbound `
        -LocalPort 3443 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction Stop
    Write-Host "✅ Puerto 3443 (Backend HTTPS) permitido" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Regla para puerto 3443 ya existe o error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Permitir puerto 5432 (PostgreSQL) - Opcional, solo si necesitas acceso directo
try {
    New-NetFirewallRule -DisplayName "SisQR6 PostgreSQL" `
        -Direction Inbound `
        -LocalPort 5432 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction Stop
    Write-Host "✅ Puerto 5432 (PostgreSQL) permitido" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Regla para puerto 5432 ya existe o error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n📋 Resumen de configuración:" -ForegroundColor Cyan
Write-Host "Frontend HTTP:  http://192.168.1.4:8080" -ForegroundColor White
Write-Host "Frontend HTTPS: https://192.168.1.4:8443" -ForegroundColor Green
Write-Host "Backend HTTP:   http://192.168.1.4:3001" -ForegroundColor White
Write-Host "Backend HTTPS:  https://192.168.1.4:3443" -ForegroundColor Green
Write-Host "PostgreSQL:     192.168.1.4:5432" -ForegroundColor White

Write-Host "`n🔍 Verificando reglas creadas:" -ForegroundColor Cyan
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "SisQR6*" } | Format-Table DisplayName, Enabled, Direction, Action

Write-Host "`n✅ Configuración completada!" -ForegroundColor Green
Write-Host "Ahora otros dispositivos en tu red pueden acceder a:" -ForegroundColor White
Write-Host "  HTTP:  http://192.168.1.4:8080" -ForegroundColor Yellow
Write-Host "  HTTPS: https://192.168.1.4:8443 (para cámara)" -ForegroundColor Green
Write-Host "`n⚠️  Para usar la cámara, debes acceder por HTTPS y aceptar el certificado" -ForegroundColor Yellow
