# ✅ HTTPS COMPLETAMENTE CONFIGURADO EN DOCKER

## 🎉 Configuración exitosa

Tu aplicación ahora está corriendo con HTTPS completo en Docker:
- ✅ Frontend HTTPS en puerto 8443
- ✅ Backend HTTPS en puerto 3443
- ✅ Certificados SSL autofirmados instalados
- ✅ Nginx configurado para HTTP y HTTPS
- ✅ CORS configurado para permitir conexiones HTTPS

## 📱 CÓMO USAR LA CÁMARA DESDE TU MÓVIL

### Paso 1: Configurar Firewall (SOLO UNA VEZ)

Abre PowerShell como **Administrador**:
```powershell
cd D:\sisfipo\sisqr6
.\configurar-firewall-local.ps1
```

### Paso 2: Aceptar certificados (IMPORTANTE)

**En tu PC o móvil**, PRIMERO acepta los certificados SSL:

1. **Abre el backend:** `https://192.168.1.4:3443/health`
   - Aparecerá advertencia de certificado
   - Acepta y continúa (verás `{"status":"OK"...}`)

2. **Luego abre el frontend:** `https://192.168.1.4:8443`
   - Aparecerá advertencia de certificado
   - Acepta y continúa
   - La aplicación cargará correctamente

### Paso 3: Usar la aplicación

1. **Conecta tu móvil** a la misma WiFi que tu PC
2. **Repite el Paso 2** desde el móvil (aceptar certificados)
3. **¡La cámara funcionará!** ✅

## 🌐 URLs de acceso

**Desde cualquier dispositivo en tu red:**
- Frontend HTTPS (cámara): `https://192.168.1.4:8443` ✅
- Frontend HTTP: `http://192.168.1.4:8080`
- Backend HTTPS: `https://192.168.1.4:3443`
- Backend HTTP: `http://192.168.1.4:3001`

## ⚠️ Solución de problemas

### Error CORS o conexión bloqueada:

**Causa:** No has aceptado el certificado del backend.

**Solución:**
1. Abre `https://192.168.1.4:3443/health` en una pestaña nueva
2. Acepta el certificado
3. Refresca la aplicación en `https://192.168.1.4:8443`

### La cámara no se activa:

**Causa:** Estás usando HTTP en lugar de HTTPS.

**Solución:**
- Usa `https://192.168.1.4:8443` (con 's')
- NO uses `http://192.168.1.4:8080` (sin 's')

## 🔧 Comandos útiles

```powershell
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Reiniciar
docker-compose restart

# Detener todo
docker-compose down

# Iniciar todo
docker-compose up -d
```

## ✅ ¡Listo para usar!

La configuración está completa. Solo necesitas:
1. Ejecutar el script de firewall (como Administrador)
2. Aceptar los certificados en tu navegador/móvil
3. ¡Disfrutar de la cámara funcionando!
