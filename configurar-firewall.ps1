# Script para configurar el Firewall de Windows para SISQR6
# DEBE EJECUTARSE COMO ADMINISTRADOR

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Configurando Firewall para SISQR6" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar si se está ejecutando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "`nPara ejecutar como administrador:" -ForegroundColor Yellow
    Write-Host "1. Clic derecho en PowerShell" -ForegroundColor White
    Write-Host "2. Selecciona 'Ejecutar como Administrador'" -ForegroundColor White
    Write-Host "3. Navega a esta carpeta y ejecuta: .\configurar-firewall.ps1`n" -ForegroundColor White
    
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✅ Ejecutando con privilegios de Administrador`n" -ForegroundColor Green

# Eliminar reglas existentes si las hay
Write-Host "🔍 Verificando reglas existentes..." -ForegroundColor Yellow
$existingRules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "SISQR6*" }
if ($existingRules) {
    Write-Host "   Eliminando reglas antiguas..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "SISQR6*" -ErrorAction SilentlyContinue
    Write-Host "   ✓ Reglas antiguas eliminadas`n" -ForegroundColor Green
}

# Crear regla para el Backend (Puerto 3000)
Write-Host "📡 Configurando puerto 3000 (Backend)..." -ForegroundColor Cyan
try {
    New-NetFirewallRule -DisplayName "SISQR6 Backend" `
                        -Description "Permite tráfico entrante al servidor backend de SISQR6 en puerto 3000" `
                        -Direction Inbound `
                        -LocalPort 3000 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Domain,Private,Public `
                        -Enabled True | Out-Null
    Write-Host "   ✅ Puerto 3000 configurado correctamente" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error configurando puerto 3000: $_" -ForegroundColor Red
    exit 1
}

# Crear regla para el Frontend (Puerto 5173)
Write-Host "📡 Configurando puerto 5173 (Frontend Vite)..." -ForegroundColor Cyan
try {
    New-NetFirewallRule -DisplayName "SISQR6 Frontend" `
                        -Description "Permite tráfico entrante al servidor frontend de SISQR6 (Vite) en puerto 5173" `
                        -Direction Inbound `
                        -LocalPort 5173 `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Domain,Private,Public `
                        -Enabled True | Out-Null
    Write-Host "   ✅ Puerto 5173 configurado correctamente`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error configurando puerto 5173: $_" -ForegroundColor Red
    exit 1
}

# Verificar las reglas creadas
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificando configuración..." -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$rules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "SISQR6*" }
foreach ($rule in $rules) {
    Write-Host "✓ Regla: $($rule.DisplayName)" -ForegroundColor Green
    Write-Host "  Estado: $($rule.Enabled)" -ForegroundColor White
    Write-Host "  Dirección: $($rule.Direction)" -ForegroundColor White
    Write-Host "  Acción: $($rule.Action)`n" -ForegroundColor White
}

# Información de red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Información de Red" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$networkIP = Get-NetIPAddress -AddressFamily IPv4 | 
             Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } |
             Select-Object -First 1

Write-Host "📍 Tu IP de red: $($networkIP.IPAddress)" -ForegroundColor Yellow
Write-Host "📍 Interfaz: $($networkIP.InterfaceAlias)`n" -ForegroundColor Yellow

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "URLs de Acceso" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Desde esta máquina:" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "  Backend:  http://localhost:3000`n" -ForegroundColor Green

Write-Host "Desde otros dispositivos en la red:" -ForegroundColor White
Write-Host "  Frontend: http://$($networkIP.IPAddress):5173" -ForegroundColor Green
Write-Host "  Backend:  http://$($networkIP.IPAddress):3000`n" -ForegroundColor Green

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Configuración completada exitosamente!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Pasos siguientes:" -ForegroundColor Yellow
Write-Host "1. Inicia el backend: cd backend && node server.js" -ForegroundColor White
Write-Host "2. Inicia el frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "3. Accede desde cualquier dispositivo usando las URLs de arriba`n" -ForegroundColor White

Read-Host "Presiona Enter para salir"
