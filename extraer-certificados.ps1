# Script para extraer certificados CRT y KEY del archivo PFX
# Necesario para Nginx en Docker

Write-Host "=== Extrayendo certificados del archivo PFX ===" -ForegroundColor Cyan
Write-Host ""

$pfxPath = ".\backend\ssl\server.pfx"
$certPath = ".\backend\ssl\server.crt"
$keyPath = ".\backend\ssl\server.key"
$password = "sisfipo2024"

if (-not (Test-Path $pfxPath)) {
    Write-Host "❌ No se encontró el archivo PFX: $pfxPath" -ForegroundColor Red
    Write-Host "Ejecuta primero: .\generar-certificados.ps1" -ForegroundColor Yellow
    exit 1
}

# Cargar el certificado PFX
$pfx = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
$pfx.Import($pfxPath, $password, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)

# Exportar el certificado público (CRT)
$certBytes = $pfx.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
[System.IO.File]::WriteAllBytes($certPath, $certBytes)
Write-Host "✅ Certificado público exportado: $certPath" -ForegroundColor Green

# Exportar la clave privada (KEY) - necesita más trabajo
$privateKey = $pfx.PrivateKey
if ($null -eq $privateKey) {
    Write-Host "❌ No se pudo extraer la clave privada" -ForegroundColor Red
    exit 1
}

# Exportar la clave privada en formato PEM
$rsa = [System.Security.Cryptography.RSA]::Create()
$rsa = $privateKey

# Exportar en formato PEM manualmente
$keyPem = "-----BEGIN PRIVATE KEY-----`n"
$keyBytes = $rsa.ExportPkcs8PrivateKey()
$keyBase64 = [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
$keyPem += $keyBase64
$keyPem += "`n-----END PRIVATE KEY-----`n"

[System.IO.File]::WriteAllText($keyPath, $keyPem)
Write-Host "✅ Clave privada exportada: $keyPath" -ForegroundColor Green

# También exportar el certificado en formato PEM
$certPem = "-----BEGIN CERTIFICATE-----`n"
$certBase64 = [System.Convert]::ToBase64String($pfx.RawData, [System.Base64FormattingOptions]::InsertLineBreaks)
$certPem += $certBase64
$certPem += "`n-----END CERTIFICATE-----`n"

[System.IO.File]::WriteAllText($certPath, $certPem)
Write-Host "✅ Certificado en formato PEM: $certPath" -ForegroundColor Green

Write-Host ""
Write-Host "=== Certificados extraídos exitosamente ===" -ForegroundColor Green
Write-Host ""
Write-Host "Archivos generados:" -ForegroundColor Cyan
Write-Host "  - $certPath (Certificado público PEM)" -ForegroundColor White
Write-Host "  - $keyPath (Clave privada PEM)" -ForegroundColor White
Write-Host ""
