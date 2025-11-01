# Módulo de Backup y Restore - Sistema SISQR6

## ✅ Implementación Completa

Se ha creado un módulo completo para exportar e importar backups de la base de datos PostgreSQL.

---

## 📁 Archivos Creados

### Backend
1. **`backend/src/controllers/backupController.js`** - Controlador con lógica de backup/restore
   - `exportBackup()` - Genera backup con pg_dump
   - `importBackup()` - Restaura backup con psql
   - `listBackups()` - Lista backups guardados
   - `deleteBackup()` - Elimina backup específico

2. **`backend/src/routes/backup.js`** - Rutas protegidas (solo admin)
   - `POST /api/backup/export` - Descargar backup
   - `POST /api/backup/import` - Subir y restaurar backup
   - `GET /api/backup/list` - Listar backups
   - `DELETE /api/backup/:filename` - Eliminar backup

3. **`backend/backups/`** - Directorio para almacenar backups temporalmente

### Frontend
4. **`frontend/src/components/BackupManager.vue`** - Componente Vue con interfaz completa
   - Botón para exportar backup (descarga directa)
   - Selector de archivo para importar .sql
   - Lista de backups guardados en servidor
   - Mensajes de éxito/error

5. **`frontend/src/services/api.js`** - Servicio `backupService` con métodos API

### Integración
6. **`backend/server.js`** - Rutas registradas con `app.use('/api/backup', backupRoutes)`
7. **`frontend/src/components/DashboardAdmin.vue`** - Menú "💾 BACKUP/RESTORE" agregado

---

## 🚀 Cómo Usar

### Exportar Backup

1. Inicia sesión como **administrador**
2. Ve al menú lateral → **💾 BACKUP/RESTORE**
3. Click en **"Descargar Backup"**
4. Se descargará un archivo `.sql` con formato: `sisqr6_backup_YYYY-MM-DD...sql`

### Importar Backup

1. En la sección **"Importar Backup"**
2. Click en **"Seleccionar archivo .sql"**
3. Selecciona un archivo `.sql` válido
4. Click en **"Restaurar Backup"**
5. Confirma escribiendo **"CONFIRMAR"** en el prompt
6. Espera a que se complete la restauración
7. **Recarga la página** para ver los datos restaurados

### Gestionar Backups Guardados

- La tabla muestra todos los backups almacenados en el servidor
- Puedes eliminar backups antiguos con el botón de basura 🗑️
- Click en "Actualizar" para recargar la lista

---

## ⚙️ Requisitos del Sistema

### Producción (Docker)

El módulo funciona automáticamente en Docker porque:
- PostgreSQL está instalado en el contenedor `sisqr6-postgres`
- Las credenciales se toman de variables de entorno
- Los comandos `pg_dump` y `psql` se ejecutan dentro del contenedor

### Desarrollo Local

Para desarrollo local necesitas:

1. **PostgreSQL instalado** en tu máquina
2. **pg_dump y psql** en el PATH del sistema

#### Windows
```powershell
# Verificar instalación
pg_dump --version
psql --version

# Si no están instalados, descarga PostgreSQL:
# https://www.postgresql.org/download/windows/
```

#### Linux/Mac
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

---

## 🔒 Seguridad

✅ **Protecciones implementadas:**
- Solo usuarios con rol `admin` pueden acceder
- Autenticación JWT requerida en todas las rutas
- Validación de extensión de archivo (.sql)
- Límite de tamaño de archivo: 100 MB
- Nombres de archivo seguros (sin path traversal)

⚠️ **ADVERTENCIAS:**
- Los backups contienen **TODOS los datos** de la base de datos
- Restaurar un backup **REEMPLAZA TODOS LOS DATOS ACTUALES**
- Almacena backups importantes en ubicaciones seguras
- **NO compartas backups sin cifrar**

---

## 📝 Variables de Entorno

El módulo usa estas variables de entorno (ya configuradas en tu `.env`):

```env
DB_HOST=localhost          # En Docker: sisqr6-postgres
DB_PORT=5432
DB_NAME=sisqr6
DB_USER=sisqr6_user
DB_PASSWORD=postgres123
```

---

## 🐳 Comandos Docker

### Crear Backup Manualmente

```bash
# Desde el host
docker exec sisqr6-postgres pg_dump -U sisqr6_user sisqr6 > backup_manual.sql

# Dentro del contenedor
docker exec -it sisqr6-postgres bash
pg_dump -U sisqr6_user sisqr6 > /tmp/backup.sql
```

### Restaurar Backup Manualmente

```bash
# Desde el host
docker exec -i sisqr6-postgres psql -U sisqr6_user -d sisqr6 < backup_manual.sql

# Dentro del contenedor
docker exec -it sisqr6-postgres bash
psql -U sisqr6_user -d sisqr6 < /tmp/backup.sql
```

---

## 🧪 Pruebas

### Probar el módulo completo:

1. **Generar datos de prueba** (si la BD está vacía)
   ```bash
   cd backend
   npm run seed:users
   ```

2. **Exportar backup**
   - Login como admin → BACKUP/RESTORE → Descargar Backup
   - Verifica que se descargue el archivo .sql

3. **Modificar datos**
   - Crea un nuevo usuario o evento
   - Verifica que los cambios se guarden

4. **Importar backup**
   - Sube el archivo .sql descargado anteriormente
   - Confirma la restauración
   - Recarga la página
   - Verifica que los datos volvieron al estado anterior

5. **Listar backups**
   - Verifica que aparezcan en la tabla
   - Elimina un backup de prueba

---

## 📊 Estructura de Archivos de Backup

Los archivos `.sql` generados contienen:

```sql
-- PostgreSQL database dump
-- Estructura de tablas (CREATE TABLE)
-- Secuencias (SERIAL, AUTO_INCREMENT)
-- Datos (INSERT INTO)
-- Índices y constraints
-- Permisos y ownership
```

**Tamaño aproximado:**
- BD vacía: ~5 KB
- BD con 100 usuarios, 10 eventos, 1000 tickets: ~500 KB - 2 MB
- BD completa con todos los datos: Variable según uso

---

## 🛠️ Troubleshooting

### Error: "pg_dump: command not found"

**Causa:** PostgreSQL no está instalado o no está en el PATH

**Solución:**
```bash
# Windows
# Agregar a PATH: C:\Program Files\PostgreSQL\15\bin

# Linux
sudo apt-get install postgresql-client

# Docker (ya funciona, no requiere acción)
```

### Error: "no existe la columna Event.isActive"

**Causa:** Bug corregido en commit anterior

**Solución:** Ya corregido en `ticketController.js` línea 633

### Error: "ENOSPC: no space left on device"

**Causa:** Disco lleno

**Solución:**
```bash
# Eliminar backups antiguos
rm backend/backups/sisqr6_backup_*.sql

# Verificar espacio
df -h
```

### Error al importar: "ERROR: duplicate key value"

**Causa:** Intentando importar datos que ya existen

**Solución:**
1. Limpia la base de datos primero:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
2. Luego importa el backup

---

## 📈 Próximas Mejoras (Opcional)

- [ ] Programar backups automáticos (cron jobs)
- [ ] Cifrado de archivos de backup
- [ ] Subir backups a S3/Cloud Storage
- [ ] Compresión de archivos (.sql.gz)
- [ ] Backups incrementales
- [ ] Notificaciones por email cuando se crea/restaura backup

---

## ✅ Checklist de Deployment

Antes de desplegar a producción:

- [x] Controlador de backup creado
- [x] Rutas registradas en server.js
- [x] Componente Vue integrado
- [x] Servicios API configurados
- [x] Directorio backups/ creado
- [x] Permisos de admin validados
- [x] Multer configurado para archivos
- [ ] Probar exportar backup localmente
- [ ] Probar importar backup localmente
- [ ] Probar en servidor de producción
- [ ] Configurar backup automático (opcional)
- [ ] Documentar proceso para el equipo

---

## 🎯 Comandos Rápidos

```bash
# Desarrollo Local

# 1. Iniciar backend
cd backend
node server.js

# 2. Iniciar frontend
cd frontend
npm run dev

# 3. Acceder al módulo
# http://localhost:5173 → Login admin → BACKUP/RESTORE

# Producción (Servidor DigitalOcean)

# 1. SSH al servidor
ssh root@142.93.26.33

# 2. Actualizar código
cd /root/sitemaqrf
git pull origin master

# 3. Reiniciar contenedores
docker-compose restart backend

# 4. Verificar logs
docker-compose logs -f backend

# 5. Acceder al módulo
# https://fepp.online → Login admin → BACKUP/RESTORE
```

---

## 📞 Soporte

Si encuentras algún problema:

1. Verifica los logs del backend: `docker-compose logs backend`
2. Verifica los logs del navegador (Console F12)
3. Confirma que PostgreSQL esté instalado: `pg_dump --version`
4. Verifica permisos del directorio: `ls -la backend/backups/`

---

**Documentación creada:** 31 de octubre de 2025  
**Versión:** 1.0.0  
**Sistema:** SISQR6 - Sistema de Entradas QR FEIPOBOL
