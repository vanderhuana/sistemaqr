# 🌐 Configuración de Red para Frontend

## Problema

Cuando cambias de red WiFi o cambias entre desarrollo local y dispositivos móviles, necesitas actualizar la URL del backend en las variables de entorno.

## Solución Rápida

### Opción 1: Script Automático (Recomendado)

Ejecuta el script de PowerShell que configurará automáticamente la URL según tu red actual:

```powershell
cd frontend
.\configurar-red-frontend.ps1
```

El script te mostrará un menú con opciones:

1. **HTTP Localhost** → `http://localhost:3000` (desarrollo normal)
2. **HTTPS Localhost** → `https://localhost:3443` (para probar cámara en local)
3. **HTTP Red Local** → `http://TU_IP:3000` (acceso desde móvil sin HTTPS)
4. **HTTPS Red Local** → `https://TU_IP:3443` (acceso desde móvil con cámara)
5. **Personalizado** → Ingresar URL manualmente

### Opción 2: Manual

Edita el archivo `frontend/.env.local` y cambia la URL:

```bash
# Para desarrollo local (PC)
VITE_API_URL=http://localhost:3000

# Para desarrollo local con HTTPS (cámara)
VITE_API_URL=https://localhost:3443

# Para acceso desde móvil HTTP
VITE_API_URL=http://192.168.1.4:3000

# Para acceso desde móvil HTTPS (cámara)
VITE_API_URL=https://192.168.1.4:3443
```

## Puertos del Backend

- **HTTP**: Puerto `3000`
- **HTTPS**: Puerto `3443`

## Después de Cambiar la Configuración

**IMPORTANTE:** Debes reiniciar el servidor de desarrollo:

```powershell
# Detener el servidor (Ctrl + C)
# Luego reiniciar
npm run dev
```

## Prioridad de Archivos .env

Vite carga los archivos en este orden (el último tiene prioridad):

1. `.env` - Base
2. `.env.development` o `.env.production` - Según modo
3. `.env.local` - **TU CONFIGURACIÓN PERSONAL** (este tiene máxima prioridad)

## Archivos de Configuración

- `.env.development` → HTTP localhost:3000 (desarrollo)
- `.env.production.https` → HTTPS con IP de red (producción)
- `.env.local` → **Tu configuración personal** (no se sube a Git)

## Solución al Error CORS

Si ves el error:

```
Solicitud de origen cruzado bloqueada: La política de mismo origen no permite...
```

**Causa:** La URL del frontend no coincide con la URL del backend.

**Solución:**

1. Verifica que el backend esté corriendo:
   ```powershell
   cd backend
   npm start
   ```

2. Asegúrate de que la URL en `.env.local` coincida con la IP/puerto del backend

3. Reinicia el frontend después de cambiar `.env.local`

## Ejemplos de Uso

### Desarrollo Normal (en tu PC)

```powershell
# 1. Ejecutar script
.\configurar-red-frontend.ps1
# 2. Seleccionar opción 1 (HTTP Localhost)
# 3. Reiniciar frontend
```

### Probar desde Móvil con Cámara

```powershell
# 1. Ejecutar script
.\configurar-red-frontend.ps1
# 2. Seleccionar opción 4 (HTTPS Red Local)
# 3. Reiniciar frontend
# 4. Acceder desde móvil a: https://192.168.1.4:5173
```

## Verificar IP Actual

```powershell
# Ver tu IP local
ipconfig | findstr IPv4
```

## Tips

- El archivo `.env.local` NO se sube a Git (está en .gitignore)
- Puedes cambiar la configuración tantas veces como necesites
- El script detecta automáticamente tu IP actual
- Siempre reinicia el frontend después de cambiar la configuración
