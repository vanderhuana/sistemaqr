# Script para generar certificados SSL autofirmados
# Ejecutar como Administrador

Write-Host "=== Generando Certificados SSL para Red Local ===" -ForegroundColor Cyan
Write-Host ""

$certPath = ".\backend\ssl"
$ipAddress = "192.168.1.4"
$dnsNames = @("localhost", "192.168.1.4", $env:COMPUTERNAME)

# Crear directorio para certificados
if (-not (Test-Path $certPath)) {
    New-Item -ItemType Directory -Path $certPath -Force | Out-Null
    Write-Host "✓ Directorio SSL creado: $certPath" -ForegroundColor Green
}

# Generar certificado autofirmado
$cert = New-SelfSignedCertificate `
    -DnsName $dnsNames `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(2) `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1") `
    -FriendlyName "SisQR6 Development Certificate"

Write-Host "✓ Certificado generado: $($cert.Thumbprint)" -ForegroundColor Green

# Exportar certificado y clave privada
$certPassword = ConvertTo-SecureString -String "sisfipo2024" -Force -AsPlainText
$pfxPath = Join-Path $certPath "server.pfx"
$certPath_cert = Join-Path $certPath "server.crt"
$keyPath = Join-Path $certPath "server.key"

# Exportar como PFX
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $certPassword | Out-Null
Write-Host "✓ Certificado PFX exportado: $pfxPath" -ForegroundColor Green

# Extraer CRT y KEY usando OpenSSL (si está disponible)
if (Get-Command openssl -ErrorAction SilentlyContinue) {
    $env:OPENSSL_CONF = ""
    openssl pkcs12 -in $pfxPath -clcerts -nokeys -out $certPath_cert -passin pass:sisfipo2024 -passout pass:sisfipo2024
    openssl pkcs12 -in $pfxPath -nocerts -nodes -out $keyPath -passin pass:sisfipo2024
    Write-Host "✓ Archivos CRT y KEY generados" -ForegroundColor Green
} else {
    Write-Host "! OpenSSL no encontrado. Solo se generó el archivo PFX" -ForegroundColor Yellow
    Write-Host "  Puedes usar el archivo PFX directamente en Node.js" -ForegroundColor Yellow
}

# Confiar en el certificado (agregar a autoridades de confianza)
Write-Host ""
Write-Host "¿Deseas agregar este certificado a las autoridades de confianza?" -ForegroundColor Yellow
Write-Host "Esto evitará advertencias de seguridad en el navegador local." -ForegroundColor Yellow
$response = Read-Host "(S/N)"

if ($response -eq "S" -or $response -eq "s") {
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    Write-Host "✓ Certificado agregado a autoridades de confianza" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Certificados Generados Exitosamente ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ubicación: $certPath" -ForegroundColor Cyan
Write-Host "Password PFX: sisfipo2024" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para dispositivos móviles:" -ForegroundColor Yellow
Write-Host "1. Los dispositivos verán una advertencia de certificado no confiable" -ForegroundColor White
Write-Host "2. Deben aceptar y continuar de todas formas" -ForegroundColor White
Write-Host "3. O puedes instalar el certificado server.crt en cada dispositivo" -ForegroundColor White
Write-Host ""
