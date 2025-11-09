# 🔒 Soluciones para el Problema SSL en Desarrollo

## Problema
Los certificados autofirmados causan errores CORS porque el navegador los rechaza.

## ✅ SOLUCIÓN 1: Certificados Confiables (RECOMENDADO)

Ejecuta este script **una sola vez como Administrador**:

```powershell
.\generar-certificados-confiables.ps1
```

Este script:
- Genera certificados SSL válidos para todas tus IPs
- Los instala en el almacén de confianza de Windows
- Chrome y Edge los aceptarán automáticamente
- Válidos por 1 año
- Compatible con cambios de red

**Después del script:**
1. Reinicia el navegador
2. Listo - no más errores SSL

---

## ✅ SOLUCIÓN 2: Desarrollo HTTP Simple

Si no necesitas cámara (solo QR generados), usa HTTP:

### Backend - Modificar `server.js`:

```javascript
// Descomentar servidor HTTP (línea 245-252)
http.createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor HTTP corriendo en puerto ${PORT}`);
  console.log(`🌐 Red: http://192.168.1.4:${PORT}`);
});
```

### Frontend - Modificar `.env.development`:

```env
VITE_API_URL=http://192.168.1.4:3000
```

**Ventajas:**
- Sin errores SSL
- Más rápido en desarrollo
- Funciona en todas las redes

**Desventajas:**
- Cámara no funciona (necesita HTTPS)

---

## ✅ SOLUCIÓN 3: Proxy Vite con HTTPS (Intermedio)

Usa el proxy de Vite para que maneje HTTPS:

### Frontend - `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/server.crt'))
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Backend en HTTP simple
        changeOrigin: true,
        secure: false
      }
    }
  }
})
```

### Backend - Usar HTTP:

```javascript
// Solo HTTP, sin HTTPS
http.createServer(app).listen(3000, '0.0.0.0', () => {
  console.log('🚀 Servidor HTTP en puerto 3000');
});
```

### Frontend - `.env.development`:

```env
# Vite proxy maneja todo
VITE_API_URL=
```

**Ventajas:**
- Backend simple (HTTP)
- Frontend con HTTPS (para cámara)
- Un solo certificado que aceptar

---

## ✅ SOLUCIÓN 4: Chrome Flags (Temporal - Solo Desarrollo)

**ADVERTENCIA: Solo para desarrollo local, NUNCA en producción**

1. Abre Chrome
2. Visita: `chrome://flags/#allow-insecure-localhost`
3. Activa "Allow invalid certificates for resources loaded from localhost"
4. Reinicia Chrome

Ahora Chrome aceptará certificados autofirmados en localhost y 127.0.0.1

---

## 📊 Comparación de Soluciones

| Solución | Dificultad | Efectividad | Cámara | Cambio Red |
|----------|-----------|-------------|--------|------------|
| Certificados Confiables | Fácil | ⭐⭐⭐⭐⭐ | ✅ | ✅ |
| HTTP Simple | Muy Fácil | ⭐⭐⭐⭐ | ❌ | ✅ |
| Proxy Vite | Media | ⭐⭐⭐⭐ | ✅ | ✅ |
| Chrome Flags | Muy Fácil | ⭐⭐⭐ | ✅ | ✅ |

---

## 🎯 Recomendación

**Para tu caso (sistema QR con cámara):**

1. **Primero:** Ejecuta `generar-certificados-confiables.ps1`
2. **Si falla:** Usa Solución 3 (Proxy Vite)
3. **Última opción:** Chrome Flags

---

## 🔧 Solución de Problemas

### Error: "OpenSSL no encontrado"
```powershell
# Instalar OpenSSL con Chocolatey
choco install openssl

# O descargar de: https://slproweb.com/products/Win32OpenSSL.html
```

### Error: "Access Denied"
```powershell
# Ejecutar PowerShell como Administrador
# Click derecho → Ejecutar como administrador
```

### Certificado no funciona después de cambiar de red
```powershell
# Regenerar con la nueva IP
.\generar-certificados-confiables.ps1 -IP "TU_NUEVA_IP"
```

---

## 📝 Notas Importantes

1. **Firefox:** Usa su propio almacén de certificados - debes aceptar manualmente
2. **Chrome/Edge:** Comparten el almacén de Windows - funcionan automáticamente
3. **Móviles:** Siempre requieren aceptación manual del certificado
4. **Producción:** Usa Let's Encrypt (gratis y automático)

---

## 🚀 Para Producción (fepp.online)

En producción usa Certbot + Let's Encrypt:

```bash
# SSH al servidor
ssh root@142.93.26.33

# Instalar Certbot
apt install certbot python3-certbot-nginx

# Generar certificado (válido 90 días, renovación automática)
certbot --nginx -d fepp.online -d www.fepp.online

# Certificados en: /etc/letsencrypt/live/fepp.online/
```

¡Los navegadores confían automáticamente en Let's Encrypt!
