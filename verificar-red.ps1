# Script para verificar la conectividad de red de SISQR6
# No requiere privilegios de administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación de Conectividad SISQR6" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Obtener IP de red
Write-Host "🔍 Obteniendo información de red..." -ForegroundColor Yellow
$networkIP = Get-NetIPAddress -AddressFamily IPv4 | 
             Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254.*" } |
             Select-Object -First 1

if ($networkIP) {
    Write-Host "✅ IP de red: $($networkIP.IPAddress)" -ForegroundColor Green
    Write-Host "   Interfaz: $($networkIP.InterfaceAlias)`n" -ForegroundColor White
} else {
    Write-Host "❌ No se pudo detectar la IP de red`n" -ForegroundColor Red
    exit 1
}

# Verificar reglas de firewall
Write-Host "🔍 Verificando reglas de firewall..." -ForegroundColor Yellow
$rules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "SISQR6*" }

if ($rules.Count -gt 0) {
    Write-Host "✅ Reglas de firewall encontradas:`n" -ForegroundColor Green
    foreach ($rule in $rules) {
        $ports = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $rule
        Write-Host "   • $($rule.DisplayName)" -ForegroundColor White
        Write-Host "     Estado: $($rule.Enabled)" -ForegroundColor Gray
        Write-Host "     Puerto: $($ports.LocalPort)" -ForegroundColor Gray
        Write-Host "     Acción: $($rule.Action)`n" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  No se encontraron reglas de firewall para SISQR6" -ForegroundColor Yellow
    Write-Host "   Ejecuta 'configurar-firewall.ps1' como Administrador`n" -ForegroundColor Yellow
}

# Verificar puertos
Write-Host "🔍 Verificando puertos..." -ForegroundColor Yellow

# Puerto 3000 (Backend)
Write-Host "   • Puerto 3000 (Backend): " -NoNewline
$test3000 = Test-NetConnection -ComputerName $networkIP.IPAddress -Port 3000 -WarningAction SilentlyContinue -InformationLevel Quiet
if ($test3000) {
    Write-Host "✅ ABIERTO" -ForegroundColor Green
} else {
    Write-Host "❌ CERRADO o servidor no corriendo" -ForegroundColor Red
}

# Puerto 5173 (Frontend)
Write-Host "   • Puerto 5173 (Frontend): " -NoNewline
$test5173 = Test-NetConnection -ComputerName $networkIP.IPAddress -Port 5173 -WarningAction SilentlyContinue -InformationLevel Quiet
if ($test5173) {
    Write-Host "✅ ABIERTO`n" -ForegroundColor Green
} else {
    Write-Host "❌ CERRADO o servidor no corriendo`n" -ForegroundColor Red
}

# Verificar procesos
Write-Host "🔍 Verificando procesos en ejecución..." -ForegroundColor Yellow

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Node.js está corriendo ($($nodeProcesses.Count) proceso(s))" -ForegroundColor Green
    foreach ($proc in $nodeProcesses) {
        $connections = Get-NetTCPConnection -OwningProcess $proc.Id -ErrorAction SilentlyContinue | 
                       Where-Object { $_.LocalPort -in @(3000, 5173) }
        if ($connections) {
            foreach ($conn in $connections) {
                Write-Host "   • PID $($proc.Id) escuchando en puerto $($conn.LocalPort)" -ForegroundColor White
            }
        }
    }
    Write-Host ""
} else {
    Write-Host "⚠️  No se detectaron procesos de Node.js corriendo" -ForegroundColor Yellow
    Write-Host "   Inicia los servidores primero`n" -ForegroundColor Yellow
}

# URLs de acceso
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "URLs de Acceso" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📱 Desde esta máquina:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "   Backend:  http://localhost:3000`n" -ForegroundColor Green

Write-Host "📱 Desde otros dispositivos en la red:" -ForegroundColor White
Write-Host "   Frontend: http://$($networkIP.IPAddress):5173" -ForegroundColor Green
Write-Host "   Backend:  http://$($networkIP.IPAddress):3000`n" -ForegroundColor Green

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resumen" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allGood = $true

if ($rules.Count -eq 0) {
    Write-Host "❌ Falta configurar el firewall" -ForegroundColor Red
    $allGood = $false
}

if (-not $test3000 -or -not $test5173) {
    Write-Host "❌ Los servidores no están respondiendo en los puertos" -ForegroundColor Red
    $allGood = $false
}

if (-not $nodeProcesses) {
    Write-Host "❌ Los servidores no están corriendo" -ForegroundColor Red
    $allGood = $false
}

if ($allGood) {
    Write-Host "✅ Todo está configurado correctamente!" -ForegroundColor Green
    Write-Host "   Los dispositivos en tu red pueden acceder al sistema`n" -ForegroundColor Green
} else {
    Write-Host "`n📋 Acciones necesarias:" -ForegroundColor Yellow
    
    if ($rules.Count -eq 0) {
        Write-Host "   1. Ejecutar 'configurar-firewall.ps1' como Administrador" -ForegroundColor White
    }
    
    if (-not $nodeProcesses) {
        Write-Host "   2. Iniciar el backend: cd backend && node server.js" -ForegroundColor White
        Write-Host "   3. Iniciar el frontend: cd frontend && npm run dev" -ForegroundColor White
    }
    
    Write-Host ""
}

# Información adicional
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Información Adicional" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Para probar la conectividad desde otro dispositivo:" -ForegroundColor Yellow
Write-Host "   curl http://$($networkIP.IPAddress):3000/api" -ForegroundColor White
Write-Host ""
Write-Host "O abre en el navegador:" -ForegroundColor Yellow
Write-Host "   http://$($networkIP.IPAddress):5173`n" -ForegroundColor White

Read-Host "Presiona Enter para salir"
