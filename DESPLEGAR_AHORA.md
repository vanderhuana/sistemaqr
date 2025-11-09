# 🚀 DESPLIEGUE A PRODUCCIÓN - DigitalOcean

## ✅ COMPATIBILIDAD VERIFICADA
- **Servidor**: DigitalOcean Droplet Ubuntu
- **IP**: 142.93.26.33
- **Dominio**: fepp.online
- **SSL**: Let's Encrypt (ya configurado)
- **Nginx**: Proxy inverso (ya configurado)

---

## 📦 PASOS PARA DESPLEGAR

### 1️⃣ Conectarse al servidor

```bash
ssh root@142.93.26.33
```

### 2️⃣ Ir al directorio del proyecto

```bash
cd /root/sitemaqrf
# O si está en: cd /root/sistemaqr
```

### 3️⃣ Hacer backup (IMPORTANTE)

```bash
# Backup del código
tar -czf ~/backup-sisqr-$(date +%Y%m%d-%H%M%S).tar.gz .

# Backup de la base de datos
docker exec sisqr6-postgres pg_dump -U sisqr6_user sisqr6 > ~/backup-db-$(date +%Y%m%d-%H%M%S).sql
```

### 4️⃣ Actualizar código desde GitHub

```bash
git pull origin master
```

**Deberías ver**:
```
remote: Enumerating objects...
Updating abc123..9927d08
Fast-forward
 frontend/.env.production | 6 +++---
 ...
 12 files changed, 1025 insertions(+), 15 deletions(-)
```

### 5️⃣ Reconstruir contenedores

```bash
# Detener contenedores actuales
docker-compose down

# Limpiar cache de Docker
docker builder prune -af

# Reconstruir SIN CACHE (importante para ver cambios)
docker-compose build --no-cache frontend backend

# Iniciar contenedores
docker-compose up -d
```

### 6️⃣ Verificar que todo funcione

```bash
# Ver estado de contenedores (todos deben estar "Up" y "healthy")
docker-compose ps

# Ver logs del frontend
docker-compose logs -f frontend

# Presionar Ctrl+C para salir

# Ver logs del backend
docker-compose logs -f backend

# Presionar Ctrl+C para salir
```

**Deberías ver**:
```
NAME                IMAGE              STATUS
sisqr6-backend      sisqr6-backend     Up (healthy)
sisqr6-frontend     sisqr6-frontend    Up (healthy)
sisqr6-postgres     postgres:15-alpine Up (healthy)
```

### 7️⃣ Probar desde el navegador

1. Abrir: **https://fepp.online**
2. Limpiar caché: `Ctrl + Shift + R` (forzar recarga)
3. Probar login con credenciales:
   - **Admin**: `admin@feipobol.bo` / `Feipobol2025!`
   - **Vendedor**: `vendedor@feipobol.bo` / `Vendedor2025!`
   - **Control**: `control@feipobol.bo` / `Control2025!`

### 8️⃣ Probar cámara en móvil

1. Abrir desde celular: **https://fepp.online**
2. Login con usuario **control**
3. Ir al scanner QR
4. **La cámara debería funcionar** (HTTPS habilitado)

---

## 🔍 VERIFICACIONES IMPORTANTES

### ✅ Contenedores corriendo
```bash
docker-compose ps
```
Todos deben mostrar `Up` y `(healthy)`

### ✅ Nginx funcionando
```bash
systemctl status nginx
```
Debe mostrar `active (running)`

### ✅ SSL válido
```bash
curl -I https://fepp.online
```
Debe retornar `HTTP/2 200` sin errores de SSL

### ✅ Backend respondiendo
```bash
curl https://fepp.online/api/health
```
Debe retornar: `{"status":"ok","timestamp":"..."}`

### ✅ Frontend cargando
```bash
curl -I https://fepp.online
```
Debe retornar: `HTTP/2 200` con `content-type: text/html`

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ Los cambios no aparecen

**Causa**: Caché de Nginx o navegador

**Solución en servidor**:
```bash
# Limpiar cache de Docker y rebuild
docker-compose down
docker builder prune -af
docker-compose build --no-cache frontend
docker-compose up -d

# Reiniciar Nginx
systemctl restart nginx
```

**Solución en cliente**:
- Vaciar caché del navegador: `Ctrl + Shift + Delete`
- Hard refresh: `Ctrl + Shift + R`
- Modo incógnito: `Ctrl + Shift + N`

### ❌ Error de conexión a base de datos

```bash
# Verificar que postgres esté corriendo
docker-compose ps sisqr6-postgres

# Ver logs de postgres
docker-compose logs postgres

# Reiniciar postgres
docker-compose restart postgres
```

### ❌ Error 502 Bad Gateway

```bash
# Ver logs del backend
docker-compose logs backend

# Verificar que backend esté escuchando
docker exec sisqr6-backend netstat -tlnp | grep 3000

# Reiniciar backend
docker-compose restart backend
```

### ❌ Cámara no funciona en móvil

1. Verificar que se accede por **HTTPS**: `https://fepp.online`
2. Verificar permisos de cámara en el navegador móvil
3. Verificar SSL válido (sin advertencias)
4. Probar en modo incógnito

---

## 📊 CONFIGURACIÓN ACTUAL

### Docker Compose
- **Frontend**: Puerto 8080 (HTTP), 8443 (HTTPS local)
- **Backend**: Puerto 3001 (HTTP), 3443 (HTTPS local)
- **PostgreSQL**: Puerto 5432

### Nginx (Producción)
- **Puerto 80**: Redirige a HTTPS
- **Puerto 443**: HTTPS con Let's Encrypt
- **Proxy /api/***: → Backend (localhost:3001)
- **Proxy /**: → Frontend (localhost:8080)

### SSL Certificados
- **Producción**: Let's Encrypt para fepp.online
- **Local**: Self-signed para 192.168.1.4 (solo desarrollo)

### Base de Datos
- **Host**: sisqr6-postgres
- **Puerto**: 5432
- **Usuario**: sisqr6_user
- **Password**: postgres123
- **Database**: sisqr6

---

## 🎯 RESUMEN DE CAMBIOS

### Nuevas funcionalidades:
1. ✅ HTTPS habilitado (para cámara en móvil)
2. ✅ Configuración de Nginx optimizada
3. ✅ CORS actualizado para HTTPS
4. ✅ Solución "ya ingresó" documentada
5. ✅ Scripts de automatización creados

### Archivos modificados:
- `frontend/.env.production` → API URL vacía (usa proxy Nginx)
- `backend/server.js` → CORS con orígenes HTTPS
- `docker-compose.yml` → Puertos HTTPS agregados
- `frontend/Dockerfile` → Soporte para SSL
- `backend/Dockerfile` → Soporte para SSL
- `frontend/nginx-https.conf` → Configuración SSL

### Documentación nueva:
- `NGINX_SETUP.md` → Guía de configuración Nginx
- `HTTPS_LISTO.md` → Instrucciones HTTPS completas
- `SOLUCION_YA_INGRESO.md` → Solución control de acceso
- `CONFIGURAR_HTTPS_CAMARA.md` → Setup HTTPS para cámara
- `setup-nginx.sh` → Script automatización Nginx
- `setup-ssl.sh` → Script automatización SSL

---

## 📞 CONTACTO Y SOPORTE

Si hay problemas durante el despliegue:
1. Revisar logs: `docker-compose logs -f`
2. Verificar estado: `docker-compose ps`
3. Revisar Nginx: `systemctl status nginx`
4. Consultar esta guía de solución de problemas

---

**Última actualización**: $(date)
**Versión**: 1.0.0
**Estado**: ✅ Listo para producción
