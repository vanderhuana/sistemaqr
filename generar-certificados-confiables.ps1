# Script para generar certificados SSL autofirmados confiables
# Ejecutar como Administrador: .\generar-certificados-confiables.ps1

param(
    [string]$IP = "192.168.1.4",
    [int]$DiasValidez = 365
)

Write-Host "🔒 Generando certificados SSL confiables..." -ForegroundColor Cyan

# Crear directorio ssl si no existe
$backendSsl = ".\backend\ssl"
$frontendSsl = ".\frontend\ssl"

if (!(Test-Path $backendSsl)) {
    New-Item -ItemType Directory -Path $backendSsl -Force | Out-Null
}
if (!(Test-Path $frontendSsl)) {
    New-Item -ItemType Directory -Path $frontendSsl -Force | Out-Null
}

# Archivo de configuración OpenSSL
$configContent = @"
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = BO
ST = La Paz
L = La Paz
O = SISFIPO
OU = Desarrollo
CN = $IP

[v3_req]
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
IP.3 = $IP
IP.4 = 192.168.1.4
IP.5 = 192.168.15.245
"@

$configPath = ".\ssl-config.cnf"
$configContent | Out-File -FilePath $configPath -Encoding UTF8

try {
    # Generar certificado con OpenSSL (si está instalado)
    if (Get-Command openssl -ErrorAction SilentlyContinue) {
        Write-Host "✓ Usando OpenSSL..." -ForegroundColor Green
        
        # Generar clave privada
        openssl genrsa -out "$backendSsl\server.key" 2048 2>&1 | Out-Null
        
        # Generar certificado
        openssl req -new -x509 -key "$backendSsl\server.key" -out "$backendSsl\server.crt" -days $DiasValidez -config $configPath
        
        # Generar PFX para Node.js
        openssl pkcs12 -export -out "$backendSsl\server.pfx" -inkey "$backendSsl\server.key" -in "$backendSsl\server.crt" -password pass:sisfipo2024
        
        # Copiar al frontend
        Copy-Item "$backendSsl\server.pfx" "$frontendSsl\server.pfx" -Force
        Copy-Item "$backendSsl\server.crt" "$frontendSsl\server.crt" -Force
        Copy-Item "$backendSsl\server.key" "$frontendSsl\server.key" -Force
        
        Write-Host "✅ Certificados generados con OpenSSL" -ForegroundColor Green
        
        # Intentar instalar el certificado en el almacén de confianza de Windows
        Write-Host "`n🔐 Instalando certificado en almacén de confianza..." -ForegroundColor Cyan
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("$backendSsl\server.crt")
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
        $store.Open("ReadWrite")
        $store.Add($cert)
        $store.Close()
        
        Write-Host "✅ Certificado instalado en el almacén de confianza" -ForegroundColor Green
        Write-Host "ℹ️  Puede que necesites reiniciar el navegador para que tome efecto" -ForegroundColor Yellow
        
    } else {
        # Fallback: usar New-SelfSignedCertificate de PowerShell
        Write-Host "⚠️  OpenSSL no encontrado, usando PowerShell..." -ForegroundColor Yellow
        
        $cert = New-SelfSignedCertificate `
            -DnsName @("localhost", $IP, "192.168.1.4", "192.168.15.245") `
            -CertStoreLocation "Cert:\CurrentUser\My" `
            -KeyExportPolicy Exportable `
            -KeySpec KeyExchange `
            -KeyLength 2048 `
            -KeyAlgorithm RSA `
            -HashAlgorithm SHA256 `
            -NotAfter (Get-Date).AddDays($DiasValidez) `
            -Subject "CN=$IP" `
            -FriendlyName "SISFIPO SSL Certificate"
        
        # Exportar a PFX
        $pwd = ConvertTo-SecureString -String "sisfipo2024" -Force -AsPlainText
        Export-PfxCertificate -Cert $cert -FilePath "$backendSsl\server.pfx" -Password $pwd | Out-Null
        
        # Copiar al frontend
        Copy-Item "$backendSsl\server.pfx" "$frontendSsl\server.pfx" -Force
        
        # Mover a almacén de confianza
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
        $store.Open("ReadWrite")
        $store.Add($cert)
        $store.Close()
        
        # Limpiar del almacén personal
        Remove-Item -Path "Cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
        
        Write-Host "✅ Certificado generado e instalado" -ForegroundColor Green
    }
    
    # Limpiar archivo temporal
    if (Test-Path $configPath) {
        Remove-Item $configPath -Force
    }
    
    Write-Host "`n📋 Resumen:" -ForegroundColor Cyan
    Write-Host "   Backend: $backendSsl\server.pfx" -ForegroundColor White
    Write-Host "   Frontend: $frontendSsl\server.pfx" -ForegroundColor White
    Write-Host "   Password: sisfipo2024" -ForegroundColor White
    Write-Host "   Validez: $DiasValidez días" -ForegroundColor White
    Write-Host "   IPs: localhost, $IP, 192.168.1.4, 192.168.15.245" -ForegroundColor White
    Write-Host "`n✅ Certificado instalado en el sistema - Chrome/Edge lo aceptarán automáticamente" -ForegroundColor Green
    Write-Host "ℹ️  Firefox usa su propio almacén - tendrás que aceptar manualmente en ese navegador" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Error generando certificados: $_" -ForegroundColor Red
    exit 1
}
