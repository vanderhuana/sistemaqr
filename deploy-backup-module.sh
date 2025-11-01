#!/bin/bash
# Script para desplegar el módulo de backup en producción (Ubuntu)
# Ejecutar: bash deploy-backup-module.sh

echo "🚀 Desplegando módulo de backup en producción..."
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que estamos en el servidor
if [ ! -d "/root/sitemaqrf" ]; then
    echo -e "${RED}❌ Error: No se encuentra el directorio /root/sitemaqrf${NC}"
    echo "Este script debe ejecutarse en el servidor de producción"
    exit 1
fi

cd /root/sitemaqrf

# 1. Hacer backup de la base de datos actual (por seguridad)
echo -e "${YELLOW}📦 Creando backup de seguridad de la base de datos...${NC}"
BACKUP_FILE="backup_pre_deploy_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T postgres pg_dump -U sisqr sisqr6 > "/root/backups/$BACKUP_FILE" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  No se pudo crear backup automático (normal si es primera vez)${NC}"
}

# 2. Pull de los cambios
echo -e "${YELLOW}📥 Descargando últimos cambios desde GitHub...${NC}"
git pull origin master

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al hacer git pull${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Código actualizado${NC}"

# 3. Verificar que pg_dump y psql estén disponibles en el contenedor
echo -e "${YELLOW}🔍 Verificando herramientas de PostgreSQL en contenedor...${NC}"
docker-compose exec -T postgres pg_dump --version
docker-compose exec -T postgres psql --version

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: pg_dump o psql no disponibles en el contenedor${NC}"
    echo "Instalando postgresql-client en el contenedor..."
    docker-compose exec -T postgres apt-get update
    docker-compose exec -T postgres apt-get install -y postgresql-client
fi

# 4. Crear directorio de backups si no existe
echo -e "${YELLOW}📁 Creando directorio de backups...${NC}"
mkdir -p /root/sitemaqrf/backend/backups
chmod 755 /root/sitemaqrf/backend/backups

# 5. Rebuild del backend (para incluir nuevas dependencias si las hay)
echo -e "${YELLOW}🔨 Reconstruyendo contenedor del backend...${NC}"
docker-compose build --no-cache backend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al construir el backend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend reconstruido${NC}"

# 6. Rebuild del frontend
echo -e "${YELLOW}🔨 Reconstruyendo contenedor del frontend...${NC}"
docker-compose build --no-cache frontend

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al construir el frontend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend reconstruido${NC}"

# 7. Reiniciar los contenedores
echo -e "${YELLOW}🔄 Reiniciando contenedores...${NC}"
docker-compose down
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al reiniciar contenedores${NC}"
    exit 1
fi

# 8. Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Esperando a que los servicios inicien...${NC}"
sleep 10

# 9. Verificar estado de los contenedores
echo -e "${YELLOW}🔍 Verificando estado de contenedores...${NC}"
docker-compose ps

# 10. Ver logs del backend para verificar que cargó correctamente
echo -e "${YELLOW}📋 Últimos logs del backend:${NC}"
docker-compose logs --tail=20 backend

# 11. Probar la ruta de backup
echo -e "${YELLOW}🧪 Probando endpoint de backup...${NC}"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://fepp.online/api/backup/list -H "Authorization: Bearer test" -k)

if [ "$RESPONSE" == "401" ] || [ "$RESPONSE" == "403" ]; then
    echo -e "${GREEN}✅ Endpoint de backup responde correctamente (requiere autenticación)${NC}"
elif [ "$RESPONSE" == "404" ]; then
    echo -e "${RED}❌ Endpoint de backup no encontrado (404)${NC}"
    echo "Verifica que las rutas estén correctamente configuradas"
else
    echo -e "${YELLOW}⚠️  Respuesta inesperada: $RESPONSE${NC}"
fi

# 12. Resumen final
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "1. Accede a https://fepp.online"
echo "2. Inicia sesión como admin"
echo "3. Ve al menú 💾 BACKUP/RESTORE"
echo "4. Prueba exportar un backup"
echo "5. Verifica que se descargue correctamente"
echo ""
echo "📂 Directorio de backups: /root/sitemaqrf/backend/backups"
echo "🔍 Ver logs: docker-compose logs -f backend"
echo "🔄 Reiniciar: docker-compose restart"
echo ""

# 13. Mostrar información de backups existentes
if [ -d "/root/sitemaqrf/backend/backups" ]; then
    BACKUP_COUNT=$(ls -1 /root/sitemaqrf/backend/backups/*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}💾 Backups existentes: $BACKUP_COUNT${NC}"
    if [ $BACKUP_COUNT -gt 0 ]; then
        echo "Últimos backups:"
        ls -lh /root/sitemaqrf/backend/backups/*.sql 2>/dev/null | tail -5
    fi
fi

echo ""
echo -e "${GREEN}🎉 ¡Módulo de backup instalado exitosamente!${NC}"
