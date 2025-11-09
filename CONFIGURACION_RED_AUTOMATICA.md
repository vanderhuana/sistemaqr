# 🌐 Configuración Automática de Red Local

## Problema que resuelve

Cuando cambias de red WiFi (casa, oficina, etc.), la IP local de tu computadora cambia y necesitas actualizar manualmente la configuración para probar desde dispositivos móviles.

## Solución Implementada

El sistema ahora **detecta automáticamente tu IP local** al iniciar el servidor de desarrollo.

### ✅ Características

- 🔍 Detección automática de IP local (192.168.x.x o 10.x.x.x)
- 🔄 Proxy automático configurado en Vite
- 📱 Acceso desde cualquier dispositivo en tu red local
- 🚀 Script de inicio rápido

## 🎯 Uso Rápido

### Opción 1: Script Automático (Recomendado)

```powershell
.\iniciar-dev-local.ps1
```

Este script:
1. Detecta tu IP local actual
2. Muestra las URLs de acceso (PC y móvil)
3. Verifica que PostgreSQL esté corriendo
4. Inicia backend y frontend en ventanas separadas

### Opción 2: Manual

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 📱 Acceso desde Dispositivos Móviles

1. Asegúrate de estar en la **misma red WiFi**
2. Ejecuta el script o inicia los servidores manualmente
3. Busca en la consola la línea que dice:
   ```
   ➜  Network: https://192.168.X.X:5173/
   ```
4. Abre esa URL en tu móvil
5. **Acepta el certificado autofirmado:**
   - Chrome: "Avanzado" → "Continuar al sitio"
   - Safari: "Mostrar detalles" → "Visitar este sitio web"
   - O escribe `thisisunsafe` en Chrome

## 🔧 Configuración Técnica

### Frontend (`vite.config.js`)

```javascript
// Detecta automáticamente la IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  // Busca 192.168.x.x o 10.x.x.x
  // Retorna 'localhost' si no encuentra
}

// Configura el proxy automáticamente
proxy: {
  '/api': {
    target: `https://${localIP}:3443`,
    changeOrigin: true,
    secure: false
  }
}
```

### Variables de Entorno (`.env.local`)

```bash
# Dejar vacío para usar detección automática
# VITE_API_URL=

# Solo descomentar si necesitas forzar una URL
# VITE_API_URL=https://192.168.100.17:3443
```

## 🐛 Solución de Problemas

### Error "No se puede conectar al servidor"

1. Verifica que PostgreSQL esté corriendo
2. Verifica que el backend se haya iniciado correctamente (puerto 3443)
3. Comprueba el firewall de Windows:
   ```powershell
   # Ver reglas actuales
   Get-NetFirewallRule | Where-Object DisplayName -like "*Node*"
   
   # Crear regla si es necesario
   New-NetFirewallRule -DisplayName "Node.js Backend" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3443
   ```

### El móvil no puede acceder

1. **Misma red WiFi:** PC y móvil deben estar en la misma red
2. **Firewall:** Puede estar bloqueando el puerto 5173
3. **Certificado:** Debes aceptar el certificado autofirmado en el móvil
4. **IP correcta:** Verifica que uses la IP que muestra Vite en "Network"

### Cambié de red y no funciona

1. **Cierra los servidores** (Ctrl+C en ambas terminales)
2. **Vuelve a ejecutar** `.\iniciar-dev-local.ps1`
3. El sistema detectará automáticamente la nueva IP

## 📋 Puertos Utilizados

| Servicio | Puerto | Protocolo | Acceso |
|----------|--------|-----------|--------|
| Frontend | 5173 | HTTPS | Local + Red |
| Backend API | 3443 | HTTPS | Local + Red |
| Backend HTTP | 3000 | HTTP | Solo local |
| PostgreSQL | 5432 | TCP | Solo local |

## 🔐 Certificados SSL

Los certificados autofirmados están en `backend/ssl/`:
- `server.pfx` - Certificado combinado (preferido)
- `server.crt` + `server.key` - Certificado separado

El frontend comparte los mismos certificados para HTTPS.

## 💡 Recomendaciones

1. **Usa el script:** `.\iniciar-dev-local.ps1` para inicio rápido
2. **Primera vez en móvil:** Acepta el certificado y añade excepción de seguridad
3. **Desarrollo continuo:** Mantén las terminales abiertas, Vite recarga automáticamente
4. **Cambio de red:** Solo reinicia los servidores, no toques archivos

## 📚 Archivos Relacionados

- `iniciar-dev-local.ps1` - Script de inicio automático
- `frontend/vite.config.js` - Configuración de proxy y detección de IP
- `frontend/.env.local` - Variables de entorno locales
- `backend/server.js` - Servidor backend HTTPS

---

**Última actualización:** Noviembre 2025  
**Sistema:** SISQR6 - Generador de QR para Eventos
