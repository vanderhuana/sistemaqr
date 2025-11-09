#!/bin/bash
# COMANDOS PARA COPIAR Y PEGAR EN EL SERVIDOR UBUNTU
# Ejecuta esto en tu terminal después de conectarte por SSH

# ============================================
# 🚀 DESPLIEGUE RÁPIDO - OPCIÓN AUTOMÁTICA
# ============================================

# 1. Conectarse al servidor
ssh root@142.93.26.33

# 2. Ir al directorio del proyecto
cd /root/sitemaqrf

# 3. Descargar últimos cambios
git pull origin master

# 4. Dar permisos al script de despliegue
chmod +x deploy-backup-module.sh

# 5. Ejecutar despliegue automático
./deploy-backup-module.sh

# ¡LISTO! El script hará todo automáticamente


# ============================================
# 🔧 DESPLIEGUE MANUAL - SI PREFIERES CONTROL
# ============================================

# Conectarse
ssh root@142.93.26.33

# Ir al proyecto
cd /root/sitemaqrf

# Backup de seguridad IMPORTANTE!
mkdir -p /root/backups
docker-compose exec -T postgres pg_dump -U sisqr sisqr6 > /root/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Descargar cambios
git pull origin master

# Crear directorio de backups
mkdir -p /root/sitemaqrf/backend/backups
chmod 755 /root/sitemaqrf/backend/backups

# Reconstruir backend
docker-compose build --no-cache backend

# Reconstruir frontend
docker-compose build --no-cache frontend

# Reiniciar todo
docker-compose down
docker-compose up -d

# Esperar 10 segundos
sleep 10

# Ver estado
docker-compose ps

# Ver logs
docker-compose logs --tail=30 backend


# ============================================
# ✅ VERIFICACIÓN
# ============================================

# Ver que los contenedores estén corriendo
docker-compose ps

# Probar la API
curl -k https://fepp.online/api/health

# Ver logs del backend
docker-compose logs --tail=50 backend | grep -i backup

# Listar backups existentes
ls -lh /root/sitemaqrf/backend/backups/


# ============================================
# 🧪 PRUEBA COMPLETA
# ============================================

# Después de desplegar:
# 1. Abre https://fepp.online en tu navegador
# 2. Inicia sesión como admin
# 3. Busca el menú "💾 BACKUP/RESTORE"
# 4. Click en "Descargar Backup"
# 5. Verifica que se descargue un archivo .sql


# ============================================
# 🆘 SOLUCIÓN DE PROBLEMAS
# ============================================

# Si algo falla, ver logs completos:
docker-compose logs backend
docker-compose logs frontend

# Reiniciar un servicio específico:
docker-compose restart backend
docker-compose restart frontend

# Verificar espacio en disco:
df -h

# Ver procesos:
docker-compose ps
docker stats --no-stream

# Rollback si es necesario:
git log --oneline -5
git reset --hard HEAD~1
docker-compose restart
