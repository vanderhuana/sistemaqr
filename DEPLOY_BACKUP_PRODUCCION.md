# 🚀 Despliegue del Módulo de Backup en Producción

## 📋 Información del Servidor

- **IP:** 142.93.26.33
- **Dominio:** fepp.online
- **Usuario:** root
- **Directorio:** /root/sitemaqrf
- **Base de datos:** PostgreSQL en Docker

---

## ✅ OPCIÓN 1: Despliegue Automático (Recomendado)

### 1. Conectarse al servidor por SSH

```bash
ssh root@142.93.26.33
```

### 2. Ir al directorio del proyecto

```bash
cd /root/sitemaqrf
```

### 3. Descargar el script de despliegue

```bash
curl -o deploy-backup-module.sh https://raw.githubusercontent.com/vanderhuana/sistemaqr/master/deploy-backup-module.sh
chmod +x deploy-backup-module.sh
```

O si ya está en el repo (después del git pull):

```bash
chmod +x deploy-backup-module.sh
```

### 4. Ejecutar el script

```bash
./deploy-backup-module.sh
```

El script automáticamente:
- ✅ Hace backup de seguridad de la BD
- ✅ Descarga últimos cambios (git pull)
- ✅ Reconstruye contenedores
- ✅ Reinicia servicios
- ✅ Verifica que todo funcione

---

## 🔧 OPCIÓN 2: Despliegue Manual

Si prefieres hacer el despliegue paso a paso:

### 1. Conectarse y navegar

```bash
ssh root@142.93.26.33
cd /root/sitemaqrf
```

### 2. Backup de seguridad (IMPORTANTE)

```bash
# Crear directorio para backups si no existe
mkdir -p /root/backups

# Hacer backup de la base de datos actual
docker-compose exec -T postgres pg_dump -U sisqr sisqr6 > /root/backups/backup_$(date +%Y%m%d_%H%M%S).sql

echo "✅ Backup creado"
```

### 3. Descargar cambios del repositorio

```bash
git pull origin master
```

### 4. Crear directorio de backups en el proyecto

```bash
mkdir -p /root/sitemaqrf/backend/backups
chmod 755 /root/sitemaqrf/backend/backups
```

### 5. Reconstruir contenedores

```bash
# Reconstruir backend
docker-compose build --no-cache backend

# Reconstruir frontend
docker-compose build --no-cache frontend
```

### 6. Reiniciar servicios

```bash
docker-compose down
docker-compose up -d
```

### 7. Verificar estado

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs del backend
docker-compose logs --tail=50 backend | grep -i backup

# Ver logs del frontend
docker-compose logs --tail=20 frontend
```

---

## 🧪 Verificación del Módulo

### 1. Verificar que la ruta de backup existe

```bash
curl -k https://fepp.online/api/backup/list
```

Debería responder con error 401 (sin autenticación) o 403 (sin permisos) - **esto es correcto**.

### 2. Verificar en el navegador

1. Abre https://fepp.online
2. Inicia sesión con admin
3. Ve al menú lateral, deberías ver **💾 BACKUP/RESTORE**
4. Click en ese menú
5. Deberías ver la interfaz de backup

### 3. Probar exportar backup

1. En la interfaz de BACKUP/RESTORE
2. Click en **"Descargar Backup"**
3. Debería descargarse un archivo `.sql` con la fecha actual

### 4. Verificar backups en el servidor

```bash
# Ver backups creados
ls -lh /root/sitemaqrf/backend/backups/

# Ver tamaño del último backup
du -h /root/sitemaqrf/backend/backups/*.sql | tail -1
```

---

## 🔍 Solución de Problemas

### Error: "pg_dump not found"

```bash
# Entrar al contenedor de postgres
docker-compose exec postgres bash

# Verificar que pg_dump existe
which pg_dump

# Si no existe, instalar
apt-get update
apt-get install -y postgresql-client
```

### Error: "Permission denied" en directorio backups

```bash
# Dar permisos al directorio
chmod -R 755 /root/sitemaqrf/backend/backups
chown -R root:root /root/sitemaqrf/backend/backups
```

### Ruta de backup no encontrada (404)

```bash
# Verificar que server.js tiene la ruta
docker-compose exec backend grep -n "backup" server.js

# Debería mostrar:
# const backupRoutes = require('./src/routes/backup');
# app.use('/api/backup', backupRoutes);

# Reiniciar backend
docker-compose restart backend
```

### El menú no aparece en el frontend

```bash
# Limpiar cache del navegador
# O forzar reconstrucción del frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Ver logs en tiempo real

```bash
# Backend
docker-compose logs -f backend

# Frontend  
docker-compose logs -f frontend

# Todos
docker-compose logs -f
```

---

## 📊 Monitoreo Post-Despliegue

### Verificar uso de disco

```bash
# Espacio disponible
df -h

# Tamaño de backups
du -sh /root/sitemaqrf/backend/backups
```

### Configurar limpieza automática (Opcional)

Si los backups crecen mucho, puedes agregar un cron job:

```bash
# Editar crontab
crontab -e

# Agregar (eliminar backups de más de 30 días)
0 2 * * * find /root/sitemaqrf/backend/backups -name "*.sql" -mtime +30 -delete
```

---

## 🎯 Checklist Final

Después del despliegue, verifica:

- [ ] Contenedores corriendo: `docker-compose ps` (todos UP)
- [ ] Backend responde: `curl -k https://fepp.online/api/health`
- [ ] Frontend carga: Abrir https://fepp.online en navegador
- [ ] Login funciona: Iniciar sesión como admin
- [ ] Menú de backup visible: Ver 💾 BACKUP/RESTORE en menú lateral
- [ ] Exportar funciona: Descargar un backup de prueba
- [ ] Directorio existe: `ls /root/sitemaqrf/backend/backups`
- [ ] Permisos correctos: `ls -la /root/sitemaqrf/backend/backups`

---

## 🆘 Contacto de Soporte

Si algo falla:

1. **Logs del backend:**
   ```bash
   docker-compose logs --tail=100 backend
   ```

2. **Logs del frontend:**
   ```bash
   docker-compose logs --tail=100 frontend
   ```

3. **Estado de contenedores:**
   ```bash
   docker-compose ps
   docker stats --no-stream
   ```

4. **Rollback si es necesario:**
   ```bash
   git log --oneline -5
   git reset --hard HEAD~1  # Volver al commit anterior
   docker-compose restart
   ```

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, el módulo de backup estará funcionando en producción en https://fepp.online

**Recuerda:** Haz backups regulares antes de operaciones críticas.
