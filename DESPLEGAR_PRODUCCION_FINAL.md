# 🚀 DESPLIEGUE FINAL A PRODUCCIÓN

## 📋 Cambios que se van a aplicar:

1. ✅ **Servidor HTTP habilitado** en backend (para nginx proxy)
2. ✅ **Usuario samuel agregado** (samuel@gmail.com / Samuel2025!)
3. ✅ **Módulo de backup** completo (backend + frontend)
4. ✅ **Modal de departamentos** en formulario de participantes

---

## 🔧 OPCIÓN 1: Despliegue Automático (Recomendado)

Copia y pega estos comandos **UNO POR UNO** en el servidor:

```bash
# 1. Conectarse al servidor
ssh root@142.93.26.33

# 2. Ir al directorio del proyecto
cd /root/sitemaqrf

# 3. Hacer backup de seguridad
mkdir -p /root/backups
docker-compose exec -T postgres pg_dump -U sisqr6_user sisqr6 > /root/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Descargar últimos cambios
git pull origin master

# 5. Crear directorio de backups
mkdir -p /root/sitemaqrf/backend/backups
chmod 755 /root/sitemaqrf/backend/backups

# 6. Detener servicios
docker-compose down

# 7. Reconstruir backend (cambio importante: HTTP habilitado)
docker-compose build --no-cache backend

# 8. Reconstruir frontend (modal de departamentos)
docker-compose build --no-cache frontend

# 9. Iniciar servicios
docker-compose up -d

# 10. Esperar 15 segundos
sleep 15

# 11. Verificar estado
docker-compose ps

# 12. Ver logs del backend
docker-compose logs --tail=30 backend

# 13. Ver logs del frontend
docker-compose logs --tail=30 frontend
```

---

## ✅ VERIFICACIÓN

Después del despliegue, verifica que todo funcione:

### 1. Verificar contenedores:
```bash
docker-compose ps
```

**Resultado esperado**: Todos los contenedores deben mostrar `Up` y `(healthy)`

### 2. Verificar backend HTTP:
```bash
docker-compose logs backend | grep "Servidor HTTP"
```

**Resultado esperado**: Debe mostrar `🚀 Servidor HTTP corriendo en puerto 3000`

### 3. Probar API:
```bash
curl -k https://fepp.online/api/health
```

**Resultado esperado**: `{"status":"OK","timestamp":"...","uptime":...}`

### 4. Probar desde navegador:
1. Abre: **https://fepp.online**
2. Login con: `admin@feipobol.bo` / `Feipobol2025!`
3. Verifica menú **💾 BACKUP/RESTORE**
4. Ve al formulario de participantes
5. En campo "Zona", selecciona "Otra"
6. Deberías ver modal con 9 departamentos

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### ❌ Backend sigue mostrando "unhealthy"

```bash
# Ver logs completos
docker-compose logs backend

# Verificar que HTTP esté activo (debe mostrar puerto 3000)
docker-compose logs backend | grep "HTTP"

# Si no aparece, verificar que se reconstruyó correctamente
docker-compose build --no-cache backend
docker-compose up -d backend
```

### ❌ Error 502 Bad Gateway

Significa que nginx no puede conectarse al backend.

```bash
# Verificar que nginx esté corriendo
systemctl status nginx

# Verificar configuración de nginx
cat /etc/nginx/sites-available/fepp.online | grep proxy_pass

# Debería mostrar: proxy_pass http://localhost:3000;

# Reiniciar nginx
systemctl restart nginx
```

### ❌ Modal de departamentos no aparece

```bash
# Verificar que el frontend se reconstruyó
docker-compose logs frontend | grep "Building"

# Limpiar caché del navegador
# Presiona: Ctrl + Shift + Delete
# O abre en modo incógnito: Ctrl + Shift + N
```

---

## 📊 RESUMEN DE CAMBIOS

### Backend (`server.js`):
**ANTES**:
```javascript
// Servidor HTTP comentado o deshabilitado
```

**AHORA**:
```javascript
// Servidor HTTP SIEMPRE activo (para nginx proxy)
http.createServer(app).listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor HTTP corriendo en puerto ${PORT}`);
});
```

### Frontend:
- ✅ Componente `BackupManager.vue` agregado
- ✅ Modal de departamentos en `RegistroParticipante.vue`
- ✅ Integración en `DashboardAdmin.vue`

### Base de datos:
- ✅ Usuario `samuel@gmail.com` agregado (admin)

---

## 🔐 CREDENCIALES DE ACCESO

### Usuarios del sistema:
| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| admin | admin@feipobol.bo | Feipobol2025! | admin |
| vendedor | vendedor@feipobol.bo | Vendedor2025! | vendedor |
| control | control@feipobol.bo | Control2025! | control |
| samuel | samuel@gmail.com | Samuel2025! | admin |

---

## 📝 NOTAS IMPORTANTES

1. **NODE_ENV=production**: El backend estará en modo producción (CORS estricto)
2. **Puerto HTTP 3000**: Nginx proxy lo usa internamente
3. **Puerto HTTPS 3443**: Para dispositivos móviles (cámara)
4. **Backups**: Se guardan en `/root/sitemaqrf/backend/backups/`

---

## 🎉 AL TERMINAR

Si todo sale bien, deberías poder:

1. ✅ Acceder a **https://fepp.online** sin errores
2. ✅ Ver el menú **💾 BACKUP/RESTORE** como admin
3. ✅ Exportar/importar backups de la base de datos
4. ✅ Ver modal de departamentos al seleccionar "Otra" en zona
5. ✅ Usar la cámara desde dispositivos móviles (HTTPS)

---

**Fecha**: 2025-11-01  
**Versión**: 1.1.0  
**Commit**: d6e0939
