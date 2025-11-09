# 🐳 Despliegue con Docker - SISQR6

## 📋 Requisitos Previos

- Docker 20.10 o superior
- Docker Compose 2.0 o superior
- Certificados SSL (server.pfx) en `frontend/ssl/`

## 🚀 Despliegue Rápido

### 1. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
# Copiar desde ejemplo
cp .env.example .env

# Editar con valores seguros
nano .env
```

Variables críticas a configurar:
```bash
# Base de datos - CAMBIAR EN PRODUCCIÓN
DB_PASSWORD=tu_password_seguro_aqui

# JWT - CAMBIAR EN PRODUCCIÓN (mínimo 32 caracteres)
JWT_SECRET=genera-un-secret-super-seguro-de-al-menos-32-caracteres

# Frontend URL para CORS
FRONTEND_URL=https://tu-dominio.com
```

### 2. Verificar Certificados SSL

```bash
# Los certificados deben estar en:
ls -la frontend/ssl/server.pfx

# El Dockerfile extrae automáticamente:
# - /etc/nginx/ssl/server.crt
# - /etc/nginx/ssl/server.key
```

### 3. Build y Deploy

```bash
# Build de todas las imágenes
docker-compose build

# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 4. Verificar Servicios

```bash
# Verificar estado de contenedores
docker-compose ps

# Verificar healthchecks
docker inspect sisqr6-backend --format='{{.State.Health.Status}}'
docker inspect sisqr6-frontend --format='{{.State.Health.Status}}'
docker inspect sisqr6-postgres --format='{{.State.Health.Status}}'

# Probar endpoints
curl http://localhost:8080/health      # Frontend
curl http://localhost:3001/health      # Backend HTTP
curl https://localhost:8443/health     # Frontend HTTPS
```

## 🔧 Arquitectura Docker

### Comunicación entre Contenedores

```
┌─────────────────────────────────────────────────────────┐
│  Navegador / Cliente                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTPS (Puerto 8443)
                  │ HTTP  (Puerto 8080)
                  ▼
┌─────────────────────────────────────────────────────────┐
│  NGINX (Frontend Container)                             │
│  - Sirve archivos estáticos (Vue build)                 │
│  - Terminación SSL/TLS                                  │
│  - Proxy reverso para /api/*                            │
│                                                          │
│  Certificados SSL:                                      │
│  /etc/nginx/ssl/server.crt                              │
│  /etc/nginx/ssl/server.key                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTP (Red interna Docker)
                  │ http://sisqr6-backend:3000
                  ▼
┌─────────────────────────────────────────────────────────┐
│  Node.js (Backend Container)                            │
│  - Express API                                          │
│  - Solo HTTP en Docker (seguro en red interna)          │
│  - Puerto 3000 (interno)                                │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ PostgreSQL Protocol
                  │ postgres://sisqr6-backend:5432
                  ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL 15 (Database Container)                     │
│  - Puerto 5432                                          │
│  - Volumen persistente: postgres_data                   │
└─────────────────────────────────────────────────────────┘
```

### Puertos Expuestos

| Servicio  | Puerto Interno | Puerto Externo | Protocolo | Uso                    |
|-----------|---------------|----------------|-----------|------------------------|
| Frontend  | 80            | 8080           | HTTP      | Desarrollo/Testing     |
| Frontend  | 443           | 8443           | HTTPS     | Producción             |
| Backend   | 3000          | 3001           | HTTP      | API (desarrollo)       |
| PostgreSQL| 5432          | 5432           | TCP       | Base de datos          |

**Nota:** En producción, el backend NO necesita HTTPS porque:
1. Nginx (frontend) hace la terminación SSL
2. La comunicación interna (Nginx ↔ Backend) es HTTP pero segura (red Docker privada)
3. Solo el punto de entrada (Nginx) expone HTTPS al exterior

## 📦 Volúmenes Persistentes

```bash
# Ver volúmenes
docker volume ls | grep sisqr6

# Volúmenes creados:
# - sisqr6_postgres_data     -> Base de datos PostgreSQL
# - sisqr6_backend_uploads   -> Archivos subidos (QR, premios, etc.)
```

### Backup de Datos

```bash
# Backup de base de datos
docker-compose exec postgres pg_dump -U sisqr6_user sisqr6 > backup_$(date +%Y%m%d).sql

# Backup de uploads
docker run --rm -v sisqr6_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /data

# Restaurar base de datos
docker-compose exec -T postgres psql -U sisqr6_user sisqr6 < backup_20250107.sql
```

## 🔄 Actualizaciones y Mantenimiento

### Actualizar Código

```bash
# 1. Pull cambios de Git
git pull origin master

# 2. Rebuild imágenes
docker-compose build

# 3. Recrear contenedores (sin perder datos)
docker-compose up -d

# 4. Verificar logs
docker-compose logs -f
```

### Reiniciar Servicios

```bash
# Reiniciar todos
docker-compose restart

# Reiniciar servicio específico
docker-compose restart backend
docker-compose restart frontend

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (⚠️ PÉRDIDA DE DATOS)
docker-compose down -v
```

### Limpiar Sistema

```bash
# Eliminar imágenes no usadas
docker image prune -a

# Eliminar contenedores detenidos
docker container prune

# Limpieza completa (⚠️ CUIDADO)
docker system prune -a --volumes
```

## 🐛 Troubleshooting

### Backend no se conecta a PostgreSQL

```bash
# Ver logs del backend
docker-compose logs backend

# Verificar que PostgreSQL esté healthy
docker-compose ps
docker inspect sisqr6-postgres --format='{{.State.Health.Status}}'

# Conectar manualmente a PostgreSQL
docker-compose exec postgres psql -U sisqr6_user -d sisqr6
```

### Frontend no puede hacer proxy a Backend

```bash
# Ver logs de Nginx
docker-compose logs frontend

# Verificar configuración de Nginx dentro del contenedor
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Probar conexión desde frontend a backend
docker-compose exec frontend wget -O- http://sisqr6-backend:3000/health
```

### Certificados SSL no funcionan

```bash
# Verificar que los certificados existen en el contenedor frontend
docker-compose exec frontend ls -la /etc/nginx/ssl/

# Ver logs de extracción de certificados durante build
docker-compose logs frontend | grep openssl

# Rebuild forzado del frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Base de datos no inicializa

```bash
# Ver logs de PostgreSQL
docker-compose logs postgres

# Verificar scripts de inicialización
docker-compose exec postgres ls -la /docker-entrypoint-initdb.d/

# Si necesitas reinicializar (⚠️ PÉRDIDA DE DATOS):
docker-compose down -v
docker volume rm sisqr6_postgres_data
docker-compose up -d
```

## 🔒 Seguridad

### Mejores Prácticas

1. **Variables de Entorno:**
   - ✅ NO commitear archivo `.env` a Git
   - ✅ Usar contraseñas fuertes (DB_PASSWORD, JWT_SECRET)
   - ✅ Generar JWT_SECRET único por instalación

2. **Certificados SSL:**
   - ✅ Usar certificados válidos en producción (Let's Encrypt)
   - ✅ Renovar certificados antes de expiración
   - ✅ NO commitear certificados privados a Git

3. **Red Docker:**
   - ✅ Backend NO expuesto directamente (solo a través de Nginx)
   - ✅ PostgreSQL solo accesible desde red interna
   - ✅ Frontend hace terminación SSL

4. **Actualizaciones:**
   - ✅ Mantener imágenes base actualizadas
   - ✅ Revisar logs regularmente
   - ✅ Backups automáticos de base de datos

## 📊 Monitoreo

```bash
# Ver recursos utilizados
docker stats

# Ver logs en tiempo real
docker-compose logs -f --tail=100

# Ver logs de errores únicamente
docker-compose logs | grep -i error

# Exportar logs
docker-compose logs > logs_$(date +%Y%m%d_%H%M%S).txt
```

## 🌐 Producción en DigitalOcean

### Configuración Adicional

1. **Firewall:**
```bash
# Abrir puertos necesarios
ufw allow 8080/tcp   # HTTP
ufw allow 8443/tcp   # HTTPS
ufw allow 22/tcp     # SSH
ufw enable
```

2. **Dominio y SSL:**
```bash
# Usar certbot para Let's Encrypt (recomendado)
# O copiar certificados existentes a frontend/ssl/server.pfx
```

3. **Variables de Entorno:**
```bash
# En producción, configurar:
NODE_ENV=production
FRONTEND_URL=https://tu-dominio.com
DB_PASSWORD=password_super_seguro
JWT_SECRET=secret_de_64_caracteres_minimo
```

## ✅ Checklist de Despliegue

- [ ] Archivo `.env` configurado con valores seguros
- [ ] Certificados SSL en `frontend/ssl/server.pfx`
- [ ] Docker y Docker Compose instalados
- [ ] Puertos 8080, 8443 disponibles
- [ ] Build exitoso: `docker-compose build`
- [ ] Servicios corriendo: `docker-compose ps`
- [ ] Healthchecks pasando: verificar con `docker inspect`
- [ ] Frontend accesible: `https://localhost:8443`
- [ ] Backend API respondiendo: `curl http://localhost:3001/health`
- [ ] Base de datos inicializada: logs sin errores
- [ ] Backup configurado

## 📞 Soporte

Si encuentras problemas:
1. Revisar logs: `docker-compose logs -f`
2. Verificar healthchecks
3. Consultar sección Troubleshooting
4. Verificar configuración de red Docker
