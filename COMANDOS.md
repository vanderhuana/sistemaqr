# 🛠️ Comandos Útiles - SISQR6

Referencia rápida de comandos para desarrollo, testing y deployment.

## 🏠 Desarrollo Local

### Backend

```bash
# Instalar dependencias
cd backend
npm install

# Desarrollo con hot reload
npm run dev

# Producción
npm start

# Crear usuarios de prueba
npm run seed:users

# Probar generación de QR masiva
node scripts/test-qr-generation.js
```

### Frontend

```bash
# Instalar dependencias
cd frontend
npm install

# Desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

### Base de Datos

```bash
# Conectar a PostgreSQL local
psql -U postgres -d sisqr6_db

# Ver tablas
\dt

# Ver usuarios
SELECT id, username, email, role FROM users;

# Resetear base de datos (¡CUIDADO!)
# En backend/src/config/database.js cambiar sync({ force: true })
```

---

## 🐳 Docker

### Docker Compose (Local Testing)

```bash
# Construir y levantar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs solo del backend
docker-compose logs -f backend

# Ver logs solo del frontend
docker-compose logs -f frontend

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra la DB)
docker-compose down -v

# Reconstruir imágenes
docker-compose build --no-cache

# Reiniciar un servicio específico
docker-compose restart backend

# Ejecutar comando en un contenedor
docker-compose exec backend npm run seed:users

# Ver estado de servicios
docker-compose ps
```

### Docker Commands Directos

```bash
# Listar contenedores corriendo
docker ps

# Listar todas las imágenes
docker images

# Construir imagen del backend
cd backend
docker build -t sisqr6-backend:latest .

# Construir imagen del frontend
cd frontend
docker build -t sisqr6-frontend:latest .

# Ejecutar contenedor del backend
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  sisqr6-backend:latest

# Ver logs de un contenedor
docker logs -f <container_id>

# Entrar a un contenedor
docker exec -it <container_id> /bin/sh

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar todo (¡CUIDADO!)
docker system prune -a --volumes
```

---

## 🚀 DigitalOcean App Platform

### Via CLI (doctl)

```bash
# Instalar doctl
# macOS: brew install doctl
# Windows: scoop install doctl
# Linux: https://docs.digitalocean.com/reference/doctl/how-to/install/

# Autenticar
doctl auth init

# Listar apps
doctl apps list

# Ver detalles de una app
doctl apps get <app_id>

# Ver logs
doctl apps logs <app_id> --type=RUN

# Crear deployment
doctl apps create-deployment <app_id>

# Ver componentes de la app
doctl apps get <app_id> --format json
```

### Via Web Console

```bash
# Acceder a la consola del backend
Apps → sisqr6-backend → Console

# Ejecutar seeds en producción
npm run seed:users

# Ver variables de entorno
printenv

# Ver logs en tiempo real
Apps → Runtime Logs
```

---

## 🗄️ Base de Datos

### Conectar a DigitalOcean Managed DB

```bash
# Desde tu máquina local (requiere conexión segura)
psql "postgresql://doadmin:PASSWORD@host-XXXX.db.ondigitalocean.com:25060/sisqr6?sslmode=require"

# Ver todas las tablas
\dt

# Contar usuarios
SELECT COUNT(*) FROM users;

# Ver últimas ventas
SELECT * FROM tickets ORDER BY "createdAt" DESC LIMIT 10;

# Ver eventos
SELECT id, name, status, "currentSold", "maxCapacity" FROM events;

# Estadísticas de validaciones
SELECT 
  "validationResult", 
  COUNT(*) as total 
FROM "ValidationLogs" 
GROUP BY "validationResult";
```

### Backup y Restore

```bash
# Backup de DigitalOcean Managed DB
pg_dump "postgresql://doadmin:PASSWORD@host.db.ondigitalocean.com:25060/sisqr6?sslmode=require" > backup_$(date +%Y%m%d).sql

# Restore
psql "postgresql://..." < backup_20251024.sql

# Backup solo de datos (sin esquema)
pg_dump --data-only "postgresql://..." > data_backup.sql

# Backup solo de esquema
pg_dump --schema-only "postgresql://..." > schema_backup.sql
```

---

## 🔍 Debugging

### Ver logs del backend

```bash
# Local
npm run dev
# Los logs aparecen en la consola

# Docker
docker-compose logs -f backend

# DigitalOcean
# Apps → Runtime Logs
```

### Debugging de errores comunes

```bash
# Error: Cannot connect to database
# Verificar connection string
echo $DATABASE_URL

# Error: CORS policy
# Verificar que FRONTEND_URL esté correcta
echo $FRONTEND_URL

# Error: JWT invalid
# Verificar que JWT_SECRET sea la misma en todos los ambientes
echo $JWT_SECRET

# Error: Port already in use
# Matar proceso en el puerto
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

---

## 📊 Monitoreo y Métricas

### Estadísticas del sistema

```bash
# Conectar a la DB y ejecutar:

# Total de ventas
SELECT COUNT(*), SUM("salePrice") FROM tickets WHERE status != 'cancelled';

# Ventas por día
SELECT 
  DATE("saleDate") as dia,
  COUNT(*) as ventas,
  SUM("salePrice") as total
FROM tickets 
WHERE status != 'cancelled'
GROUP BY DATE("saleDate")
ORDER BY dia DESC;

# Validaciones de hoy
SELECT COUNT(*) FROM "ValidationLogs" 
WHERE DATE("createdAt") = CURRENT_DATE;

# Eventos activos
SELECT name, status, "currentSold", "maxCapacity" 
FROM events 
WHERE status = 'active';
```

---

## 🔐 Seguridad

### Generar JWT Secret

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### Cambiar contraseña de usuario

```sql
-- Conectar a la base de datos y ejecutar:
-- Primero, encriptar la nueva contraseña en Node.js:
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('NuevaContraseña123', 10))"

UPDATE users 
SET password = '$2a$10$HASH_GENERADO' 
WHERE email = 'admin@feipobol.bo';
```

---

## 🔄 Updates y Deployment

### Actualizar código en producción

```bash
# 1. Hacer cambios locales
git add .
git commit -m "Descripción del cambio"
git push origin main

# 2. DigitalOcean detectará el push y redesplegar automáticamente
# O forzar redeploy:
# Apps → Actions → Force Rebuild & Deploy
```

### Rollback a versión anterior

```bash
# En DigitalOcean App Platform:
# Apps → Settings → Deployment History
# Click en una versión anterior
# Click en "Redeploy"
```

---

## 🧪 Testing

### Probar endpoints del API

```bash
# Health check
curl https://tu-backend.ondigitalocean.app/api/health

# Login
curl -X POST https://tu-backend.ondigitalocean.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"admin@feipobol.bo","password":"Feipobol2025!"}'

# Obtener eventos (requiere token)
curl https://tu-backend.ondigitalocean.app/api/events \
  -H "Authorization: Bearer TU_TOKEN_JWT"
```

### Load testing

```bash
# Instalar artillery
npm install -g artillery

# Crear archivo de test (artillery.yml):
# config:
#   target: 'https://tu-backend.ondigitalocean.app'
# scenarios:
#   - flow:
#     - get:
#         url: "/api/events"

# Ejecutar test
artillery run artillery.yml
```

---

## 📱 Comandos de Git

```bash
# Ver estado
git status

# Ver historial
git log --oneline -10

# Crear branch para feature
git checkout -b feature/nueva-funcionalidad

# Merge feature a main
git checkout main
git merge feature/nueva-funcionalidad

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (borrar cambios)
git reset --hard HEAD~1

# Ver diferencias
git diff
```

---

## 📞 Soporte

Si necesitas ayuda con algún comando:
- Documentación DigitalOcean: https://docs.digitalocean.com/
- Docker docs: https://docs.docker.com/
- PostgreSQL docs: https://www.postgresql.org/docs/

---

**Última actualización**: Octubre 24, 2025
