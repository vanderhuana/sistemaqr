# INSTRUCCIONES PARA CONFIGURAR HTTPS Y CÁMARA

## 🎯 Objetivo
Configurar HTTPS para que la cámara funcione desde dispositivos móviles en la red local.

## 📋 Pasos a seguir

### 1. Ejecutar como Administrador
```powershell
# Clic derecho en PowerShell → "Ejecutar como administrador"
cd D:\sisfipo\sisqr6
.\configurar-https-camara.ps1
```

### 2. Durante la ejecución
- Cuando pregunte si agregar certificado a autoridades: Presiona **S** (Sí)
- Espera a que Docker reconstruya los contenedores

### 3. Verificar que todo funciona
```powershell
# Ver estado de contenedores
docker-compose ps

# Ver logs del backend
docker-compose logs backend | Select-String "HTTPS"
```

Deberías ver:
```
🔒 Servidor HTTPS corriendo en puerto 3443
🌐 Red: https://192.168.1.4:3443
```

### 4. Probar desde el móvil

**a) Conecta tu móvil a la misma WiFi que tu PC**

**b) Abre el navegador móvil y ve a:**
```
https://192.168.1.4:8080
```

**c) Aceptar advertencia de certificado:**

- **Safari (iOS):**
  1. Aparece "Este sitio web no es seguro"
  2. Tap en "Mostrar detalles"
  3. Tap en "visitar este sitio web"
  4. Confirmar

- **Chrome (Android):**
  1. Aparece "Tu conexión no es privada"
  2. Tap en "Opciones avanzadas"
  3. Tap en "Continuar a 192.168.1.4 (no seguro)"

- **Firefox (Android):**
  1. Aparece "Advertencia: Riesgo potencial de seguridad"
  2. Tap en "Opciones avanzadas"
  3. Tap en "Aceptar el riesgo y continuar"

**d) La aplicación debería cargar y la cámara funcionar ✅**

### 5. Solución de problemas

#### No puedo acceder desde el móvil
```powershell
# Verificar que el móvil está en la misma red
# En el móvil, verificar que la IP WiFi sea 192.168.1.X

# Verificar reglas de firewall
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "SisQR6*" }
```

#### La cámara no se activa
- Verifica que estás usando **HTTPS** (no HTTP)
- Acepta todos los permisos de cámara que pida el navegador
- Intenta con otro navegador móvil

#### Certificado inválido
- Es normal en red local
- Solo debes aceptar la advertencia una vez por dispositivo
- El sitio es seguro dentro de tu red local

## 🔧 Configuración manual (si el script falla)

### Generar certificados
```powershell
.\generar-certificados.ps1
```

### Configurar firewall
```powershell
.\configurar-firewall-local.ps1
```

### Actualizar .env.production
```powershell
Copy-Item .\frontend\.env.production.https .\frontend\.env.production -Force
```

### Reconstruir contenedores
```powershell
docker-compose down
docker-compose build --no-cache backend frontend
docker-compose up -d
```

## 📱 URLs de acceso

- **HTTP (sin cámara):** http://192.168.1.4:8080
- **HTTPS (con cámara):** https://192.168.1.4:8080
- **Backend HTTPS:** https://192.168.1.4:3443
- **Backend HTTP:** http://192.168.1.4:3001

## ✅ Verificación final

1. Acceso desde PC: https://192.168.1.4:8080 ✅
2. Acceso desde móvil: https://192.168.1.4:8080 ✅
3. Cámara funciona en móvil ✅
4. QR se valida correctamente ✅
