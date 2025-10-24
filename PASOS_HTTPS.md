# 🔒 Pasos para Habilitar HTTPS y Usar Cámara en Móviles

## ⚠️ IMPORTANTE
Los navegadores en móviles **requieren HTTPS** para acceder a la cámara. Sigue estos pasos EN ORDEN.

---

## 📋 Paso 1: Generar Certificados SSL (PowerShell como Administrador)

1. **Abre PowerShell como Administrador:**
   - Haz clic derecho en el menú Inicio → "Windows PowerShell (Administrador)" o "Terminal (Administrador)"

2. **Ejecuta estos comandos:**

```powershell
cd d:\sisfipo\sisqr6
.\generar-certificados.ps1
```

3. **Cuando pregunte si deseas agregar el certificado a autoridades de confianza:**
   - Escribe `S` y presiona Enter (esto evitará advertencias en TU computadora)

4. **Verifica que se crearon los archivos:**
```powershell
dir backend\ssl
```

Deberías ver:
- `server.pfx` (certificado con clave privada)
- `server.crt` (certificado público - opcional)
- `server.key` (clave privada - opcional)

---

## 🔥 Paso 2: Abrir Puertos en el Firewall (PowerShell como Administrador)

**Ejecuta estos comandos en el mismo PowerShell de Administrador:**

```powershell
# Puerto 3443 para Backend HTTPS
New-NetFirewallRule -DisplayName "SISQR6 Backend HTTPS" -Direction Inbound -LocalPort 3443 -Protocol TCP -Action Allow

# Puerto 5173 para Frontend HTTPS (si no lo abriste antes)
New-NetFirewallRule -DisplayName "SISQR6 Frontend HTTPS" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Verificar que se crearon las reglas
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*SISQR6*" }
```

---

## 🚀 Paso 3: Reiniciar Backend con HTTPS

1. **Detén el backend actual** (Ctrl+C en la terminal donde corre)

2. **Abre una nueva terminal PowerShell normal (no hace falta Administrador):**

```powershell
cd d:\sisfipo\sisqr6\backend
node server.js
```

3. **Deberías ver algo como:**
```
🔒 Certificado SSL (PFX) cargado
🚀 Servidor HTTP corriendo en puerto 3000
🌐 Local: http://localhost:3000
🌐 Red: http://192.168.1.3:3000
🔒 Servidor HTTPS corriendo en puerto 3443
🌐 Local: https://localhost:3443
🌐 Red: https://192.168.1.3:3443
📱 Dispositivos móviles pueden acceder a: https://192.168.1.3:3443
⚠️  Los dispositivos verán advertencia de certificado - aceptar para continuar
```

**✅ Si NO ves el mensaje de HTTPS:**
- Verifica que exista `backend\ssl\server.pfx`
- Revisa la contraseña en `.env` (debe ser `SSL_PASSPHRASE=sisfipo2024`)

---

## 🎨 Paso 4: Reiniciar Frontend con HTTPS

1. **Detén el frontend actual** (Ctrl+C en la terminal donde corre)

2. **Abre una nueva terminal PowerShell normal:**

```powershell
cd d:\sisfipo\sisqr6\frontend
npm run dev
```

3. **Deberías ver algo como:**
```
Vite: usando PFX para HTTPS -> d:\sisfipo\sisqr6\backend\ssl\server.pfx

  VITE v5.x.x  ready in xxx ms

  ➜  Local:   https://localhost:5173/
  ➜  Network: https://192.168.1.3:5173/
```

**✅ Si ves `http://` en lugar de `https://`:**
- Verifica que exista `backend\ssl\server.pfx`
- Revisa la consola por errores al cargar certificados

---

## 📱 Paso 5: Probar desde el Móvil

### 5A. En tu computadora (para probar primero):

1. Abre el navegador y ve a: `https://192.168.1.3:5173`
2. Si ves advertencia de seguridad, haz clic en "Avanzado" → "Continuar de todas formas"
3. Deberías ver la aplicación normalmente

### 5B. En tu móvil (Android/iPhone):

1. **Conecta el móvil a la misma red WiFi** que tu computadora

2. **Abre el navegador del móvil** (Chrome, Safari, etc.)

3. **Navega a:** `https://192.168.1.3:5173`

4. **Verás una advertencia de seguridad** (certificado no confiable):
   - **Android Chrome:** Haz clic en "Avanzado" → "Continuar a 192.168.1.3 (no seguro)"
   - **iOS Safari:** Haz clic en "Mostrar detalles" → "Visitar este sitio web"

5. **Inicia sesión** como administrador

6. **Ve al escáner QR** y haz clic en "Iniciar Escáner"

7. **El navegador pedirá permiso para usar la cámara** - Acepta/Permite

8. **¡La cámara debería funcionar!** 🎉

---

## 🔧 Solución de Problemas

### ❌ "Tu navegador no soporta acceso a la cámara"

**Causa:** No estás usando HTTPS o el móvil no confía en el certificado

**Solución:**
1. Verifica que la URL sea `https://` (no `http://`)
2. Acepta la advertencia de seguridad del navegador
3. Si el problema persiste, instala el certificado en el móvil (ver abajo)

---

### ❌ "No se pudo acceder a la cámara"

**Causa:** No diste permiso o el navegador no lo pidió

**Solución:**
1. En el móvil, toca el ícono de candado/información en la barra de direcciones
2. Busca "Cámara" y cámbialo a "Permitir"
3. Recarga la página

---

### 📥 Instalar Certificado en el Móvil (Opcional - elimina advertencias)

#### Android:

1. Copia el archivo `d:\sisfipo\sisqr6\backend\ssl\server.crt` a tu móvil (por USB, correo, o Drive)
2. En Android, ve a: **Ajustes → Seguridad → Cifrado y credenciales → Instalar un certificado**
3. Selecciona **"Certificado CA"**
4. Navega y selecciona el archivo `server.crt`
5. Asigna un nombre (ej: "SISQR6 Dev")
6. Confirma con tu PIN/huella

#### iOS:

1. Envía el archivo `server.crt` por correo o súbelo a iCloud
2. Abre el archivo en el iPhone/iPad
3. Ve a **Ajustes → General → VPN y administración de dispositivos**
4. Toca el perfil instalado y presiona "Instalar"
5. Ve a **Ajustes → General → Información → Configuración de certificados**
6. Activa el certificado instalado

---

## ✅ Checklist Final

Antes de probar en el móvil, verifica que TODO esté ✓:

- [ ] Los certificados SSL existen en `backend\ssl\`
- [ ] El firewall permite puertos 3443 y 5173
- [ ] Backend muestra "🔒 Servidor HTTPS corriendo en puerto 3443"
- [ ] Frontend muestra "https://192.168.1.3:5173" (no http)
- [ ] Puedes abrir `https://192.168.1.3:5173` en TU navegador de escritorio
- [ ] El móvil está en la misma WiFi que la computadora
- [ ] Abriste `https://192.168.1.3:5173` en el móvil (no http)
- [ ] Aceptaste la advertencia de seguridad del navegador móvil

---

## 🎯 Comandos Rápidos de Referencia

```powershell
# Ver si los puertos están escuchando
netstat -ano | findstr "3000 3443 5173"

# Probar conectividad desde esta máquina
Test-NetConnection -ComputerName 192.168.1.3 -Port 3443
Test-NetConnection -ComputerName 192.168.1.3 -Port 5173

# Ver reglas del firewall
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*SISQR6*" }

# Reiniciar backend
cd d:\sisfipo\sisqr6\backend
node server.js

# Reiniciar frontend
cd d:\sisfipo\sisqr6\frontend
npm run dev
```

---

## 📞 Necesitas Ayuda?

Si después de seguir todos los pasos aún tienes problemas:
1. Verifica los logs del backend y frontend
2. Prueba abrir `https://192.168.1.3:3443/api` directamente en el móvil
3. Revisa la consola del navegador (F12 en PC, inspeccionar en móvil)
4. Asegúrate de que PostgreSQL esté corriendo
