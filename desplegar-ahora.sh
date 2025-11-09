#!/bin/bash
# Script simplificado para despliegue inmediato
# Copia y pega estos comandos uno por uno en tu terminal

echo "🚀 PASO 1: Conectarse al servidor"
echo "Ejecuta:"
echo "ssh root@142.93.26.33"
echo ""
echo "Presiona Enter cuando estés conectado..."
read

echo "🚀 PASO 2: Ir al directorio del proyecto"
cd /root/sitemaqrf
pwd

echo "🚀 PASO 3: Hacer backup de seguridad de la BD"
mkdir -p /root/backups
docker-compose exec -T postgres pg_dump -U sisqr sisqr6 > /root/backups/backup_antes_modulo_backup_$(date +%Y%m%d_%H%M%S).sql
echo "✅ Backup de seguridad creado"

echo "🚀 PASO 4: Descargar últimos cambios"
git pull origin master

echo "🚀 PASO 5: Crear directorio de backups"
mkdir -p /root/sitemaqrf/backend/backups
chmod 755 /root/sitemaqrf/backend/backups

echo "🚀 PASO 6: Reconstruir backend"
docker-compose build --no-cache backend

echo "🚀 PASO 7: Reconstruir frontend"
docker-compose build --no-cache frontend

echo "🚀 PASO 8: Reiniciar servicios"
docker-compose down
docker-compose up -d

echo "🚀 PASO 9: Esperar a que inicien los servicios"
sleep 15

echo "🚀 PASO 10: Verificar estado"
docker-compose ps

echo "✅ ¡DESPLIEGUE COMPLETADO!"
echo ""
echo "📋 Verifica que todo funcione:"
echo "1. Abre https://fepp.online"
echo "2. Inicia sesión como admin"
echo "3. Busca el menú 💾 BACKUP/RESTORE"
echo "4. Prueba descargar un backup"
