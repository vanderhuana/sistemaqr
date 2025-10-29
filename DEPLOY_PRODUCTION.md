# 🚀 GUÍA DE DESPLIEGUE A PRODUCCIÓN

## 📋 Comandos Completos de Despliegue

### 1️⃣ Hacer Backup (SIEMPRE PRIMERO)

```bash
ssh root@142.93.26.33

# Crear directorio de backups
mkdir -p /root/backups

# Backup del código
cd /root
tar -czf backups/sistemaqr-backup-$(date +%Y%m%d-%H%M%S).tar.gz sistemaqr/

# Backup de la base de datos
docker exec sistemaqr-postgres-1 pg_dump -U postgres sisqr > /root/backups/sisqr-db-backup-$(date +%Y%m%d-%H%M%S).sql
gzip /root/backups/sisqr-db-backup-*.sql

# Verificar backups
ls -lh /root/backups/
```

### 2️⃣ Despliegue con Limpieza de Caché

```bash
ssh root@142.93.26.33

cd /root/sistemaqr

# Obtener últimos cambios
git pull origin master

# Detener contenedores
docker-compose down

# IMPORTANTE: Limpiar caché de Docker para forzar rebuild
docker builder prune -af

# Reconstruir frontend SIN CACHE (fuerza nuevo build con hash)
docker-compose build --no-cache frontend

# Opcional: Reconstruir backend si hay cambios
# docker-compose build --no-cache backend

# Limpiar volúmenes de Nginx (caché residual)
docker volume ls | grep nginx && docker volume prune -f

# Iniciar contenedores
docker-compose up -d

# Verificar que estén corriendo
docker-compose ps

# Ver logs del frontend
docker-compose logs -f frontend

# Presiona Ctrl+C para salir de los logs
```

### 3️⃣ Verificar Despliegue

```bash
# Ver todos los contenedores
docker-compose ps

# Verificar logs del frontend
docker-compose logs --tail=50 frontend

# Verificar logs del backend
docker-compose logs --tail=50 backend

# Verificar logs de postgres
docker-compose logs --tail=20 postgres

# Test de salud
curl http://localhost:8080/
curl http://localhost:3000/health
```

### 4️⃣ Limpiar Caché del Navegador (CLIENTE)

**Después de desplegar, los usuarios deben:**

1. Abrir https://fepp.online
2. **Hard Refresh**: `Ctrl + Shift + R` (Chrome/Firefox)
3. **O vaciar caché manualmente**:
   - Chrome: `Ctrl + Shift + Delete` → Marcar "Imágenes y archivos en caché" → Limpiar
   - Firefox: `Ctrl + Shift + Delete` → Marcar "Caché" → Limpiar
4. **Modo incógnito** (para verificar sin caché): `Ctrl + Shift + N`

---

## 🔧 Solución de Problemas

### ❌ Los cambios NO aparecen después de desplegar

**Problema**: Nginx o navegador están cacheando archivos viejos

**Solución**:
```bash
ssh root@142.93.26.33
cd /root/sistemaqr

# 1. Detener todo
docker-compose down

# 2. Limpiar TODA la caché de Docker
docker system prune -af --volumes

# 3. Rebuild completo
docker-compose build --no-cache

# 4. Iniciar
docker-compose up -d

# 5. Entrar al contenedor de Nginx y verificar archivos
docker exec -it sistemaqr-frontend-1 ls -lh /usr/share/nginx/html/assets/

# Deberías ver archivos con HASH en el nombre, ejemplo:
# index-a1b2c3d4.js
# main-e5f6g7h8.css
```

**En el navegador (cliente)**:
- Hard Refresh: `Ctrl + Shift + R`
- Modo incógnito: `Ctrl + Shift + N`
- Vaciar caché completo

### ❌ Error "Container already exists"

```bash
docker-compose down --remove-orphans
docker-compose up -d
```

### ❌ Puertos ocupados

```bash
# Ver qué está usando el puerto 8080
netstat -tulpn | grep 8080

# Matar proceso si es necesario
kill -9 <PID>
```

### ❌ Base de datos no conecta

```bash
# Verificar que postgres esté corriendo
docker-compose ps postgres

# Ver logs de postgres
docker-compose logs postgres

# Reiniciar solo postgres
docker-compose restart postgres
```

---

## 📦 Verificar Versión Desplegada

### Ver hash de archivos generados por Vite

```bash
ssh root@142.93.26.33

# Entrar al contenedor frontend
docker exec -it sistemaqr-frontend-1 /bin/sh

# Ver archivos compilados
ls -lh /usr/share/nginx/html/assets/

# Salir del contenedor
exit
```

**Los archivos deben tener hash**, ejemplo:
```
index-8a7f9e2d.js      <- ✅ BIEN (tiene hash)
main-f4d3c2b1.css      <- ✅ BIEN (tiene hash)
logo-a1b2c3d4.png      <- ✅ BIEN (tiene hash)
```

Si ves archivos SIN hash, el build no se hizo correctamente.

### Ver última actualización de index.html

```bash
docker exec sistemaqr-frontend-1 stat /usr/share/nginx/html/index.html

# Debe mostrar la fecha/hora del último build
```

---

## 🎯 Checklist de Despliegue

- [ ] Backup de código creado
- [ ] Backup de base de datos creado
- [ ] `git pull origin master` ejecutado
- [ ] `docker-compose down` ejecutado
- [ ] `docker builder prune -af` ejecutado (limpia caché)
- [ ] `docker-compose build --no-cache frontend` ejecutado
- [ ] `docker-compose up -d` ejecutado
- [ ] Contenedores corriendo (`docker-compose ps`)
- [ ] Logs del frontend sin errores
- [ ] Archivos en `/usr/share/nginx/html/assets/` tienen hash
- [ ] Hard refresh en navegador (`Ctrl + Shift + R`)
- [ ] Cambios visibles en https://fepp.online
- [ ] Modo responsive funciona (F12 → Ctrl + Shift + M)
- [ ] Formulario participante responsive persiste (no se "desconfigura")

---

## 🔐 Comandos de Emergencia

### Restaurar desde Backup

```bash
ssh root@142.93.26.33

# Ver backups disponibles
ls -lh /root/backups/

# Restaurar código
cd /root
docker-compose down
rm -rf sistemaqr
tar -xzf backups/sistemaqr-backup-FECHA.tar.gz
cd sistemaqr
docker-compose up -d

# Restaurar base de datos
gunzip /root/backups/sisqr-db-backup-FECHA.sql.gz
docker exec -i sistemaqr-postgres-1 psql -U postgres sisqr < /root/backups/sisqr-db-backup-FECHA.sql
```

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose logs -f

# Solo frontend
docker-compose logs -f frontend

# Solo backend
docker-compose logs -f backend

# Últimas 100 líneas
docker-compose logs --tail=100 frontend
```

### Reiniciar servicios individualmente

```bash
# Solo frontend
docker-compose restart frontend

# Solo backend
docker-compose restart backend

# Solo postgres
docker-compose restart postgres
```

---

## 📊 Monitoreo Post-Despliegue

### Verificar recursos

```bash
# Ver uso de CPU/RAM
docker stats

# Ver espacio en disco
df -h

# Ver tamaño de imágenes Docker
docker images
```

### Verificar conectividad

```bash
# Desde el servidor
curl http://localhost:8080/
curl http://localhost:3000/health
curl http://localhost:3000/db-status

# Desde Internet
curl https://fepp.online/
```

---

## 🚨 Notas Importantes

1. **SIEMPRE hacer backup antes de desplegar**
2. **Usar `--no-cache` para forzar rebuild completo**
3. **Limpiar caché de Docker con `docker builder prune -af`**
4. **Verificar que archivos tengan hash en el nombre**
5. **Hard refresh en navegador después de desplegar**
6. **Probar en modo incógnito para confirmar sin caché**
7. **Nginx ahora NO cachea HTML ni JS/CSS sin hash**
8. **Solo assets con hash (generados por Vite) se cachean**

---

## 📅 Última Actualización

- **Fecha**: 29 de Octubre, 2025
- **Commits Importantes**:
  - `e159196` - Fix cacheo agresivo (Vite hash + Nginx no-cache)
  - `7d40527` - Mejora responsive participantes
  - `e11962d` - Fix !important en media queries
  - `cf67924` - Responsive inicial con 4 breakpoints
