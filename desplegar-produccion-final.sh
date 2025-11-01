#!/bin/bash
# Script de despliegue final a producción
# Ejecutar en el servidor: bash desplegar-produccion-final.sh

echo "🚀 =========================================="
echo "🚀 DESPLIEGUE FINAL A PRODUCCIÓN"
echo "🚀 =========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 1. Verificar que estamos en el directorio correcto
echo -e "${CYAN}📍 Paso 1: Verificando directorio...${NC}"
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ Error: No se encontró docker-compose.yml${NC}"
    echo -e "${YELLOW}Asegúrate de estar en /root/sitemaqrf${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Directorio correcto${NC}"
echo ""

# 2. Hacer backup de seguridad
echo -e "${CYAN}📦 Paso 2: Creando backup de seguridad...${NC}"
mkdir -p /root/backups
BACKUP_FILE="/root/backups/backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose exec -T postgres pg_dump -U sisqr6_user sisqr6 > "$BACKUP_FILE"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup creado: $BACKUP_FILE${NC}"
    ls -lh "$BACKUP_FILE"
else
    echo -e "${RED}❌ Error creando backup${NC}"
    exit 1
fi
echo ""

# 3. Descargar últimos cambios
echo -e "${CYAN}📥 Paso 3: Descargando últimos cambios desde GitHub...${NC}"
git pull origin master
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error descargando cambios de git${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Cambios descargados${NC}"
echo ""

# 4. Mostrar último commit
echo -e "${CYAN}📝 Último commit:${NC}"
git log --oneline -1
echo ""

# 5. Crear directorio de backups
echo -e "${CYAN}📁 Paso 4: Configurando directorio de backups...${NC}"
mkdir -p /root/sitemaqrf/backend/backups
chmod 755 /root/sitemaqrf/backend/backups
echo -e "${GREEN}✅ Directorio configurado${NC}"
echo ""

# 6. Detener servicios
echo -e "${CYAN}🛑 Paso 5: Deteniendo servicios...${NC}"
docker-compose down
echo -e "${GREEN}✅ Servicios detenidos${NC}"
echo ""

# 7. Reconstruir backend
echo -e "${CYAN}🔨 Paso 6: Reconstruyendo backend...${NC}"
docker-compose build --no-cache backend
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error reconstruyendo backend${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Backend reconstruido${NC}"
echo ""

# 8. Reconstruir frontend
echo -e "${CYAN}🔨 Paso 7: Reconstruyendo frontend...${NC}"
docker-compose build --no-cache frontend
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error reconstruyendo frontend${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend reconstruido${NC}"
echo ""

# 9. Iniciar servicios
echo -e "${CYAN}🚀 Paso 8: Iniciando servicios...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error iniciando servicios${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servicios iniciados${NC}"
echo ""

# 10. Esperar a que inicien
echo -e "${CYAN}⏳ Paso 9: Esperando 15 segundos a que inicien los servicios...${NC}"
for i in {15..1}; do
    echo -ne "${YELLOW}$i segundos...${NC}\r"
    sleep 1
done
echo ""
echo ""

# 11. Verificar estado
echo -e "${CYAN}✅ Paso 10: Verificando estado de contenedores...${NC}"
docker-compose ps
echo ""

# 12. Ver logs del backend
echo -e "${CYAN}📋 Logs del backend (últimas 30 líneas):${NC}"
docker-compose logs --tail=30 backend
echo ""

# 13. Verificar que HTTP esté activo
echo -e "${CYAN}🔍 Verificando servidor HTTP del backend...${NC}"
HTTP_LOG=$(docker-compose logs backend | grep "Servidor HTTP corriendo")
if [ -n "$HTTP_LOG" ]; then
    echo -e "${GREEN}✅ Servidor HTTP activo en puerto 3000${NC}"
    echo "$HTTP_LOG"
else
    echo -e "${RED}❌ ADVERTENCIA: No se encontró mensaje de servidor HTTP${NC}"
    echo -e "${YELLOW}Verifica los logs arriba${NC}"
fi
echo ""

# 14. Probar API
echo -e "${CYAN}🌐 Probando API...${NC}"
API_RESPONSE=$(curl -s -k https://fepp.online/api/health)
if [ -n "$API_RESPONSE" ]; then
    echo -e "${GREEN}✅ API respondiendo:${NC}"
    echo "$API_RESPONSE"
else
    echo -e "${RED}❌ ADVERTENCIA: API no responde${NC}"
fi
echo ""

# Resumen final
echo ""
echo -e "${GREEN}=========================================="
echo -e "🎉 DESPLIEGUE COMPLETADO"
echo -e "==========================================${NC}"
echo ""
echo -e "${CYAN}📋 Verificaciones finales:${NC}"
echo ""
echo -e "${YELLOW}1. Abre en tu navegador:${NC} https://fepp.online"
echo -e "${YELLOW}2. Login con:${NC} admin@feipobol.bo / Feipobol2025!"
echo -e "${YELLOW}3. Verifica el menú:${NC} 💾 BACKUP/RESTORE"
echo -e "${YELLOW}4. Prueba el modal de departamentos${NC}"
echo ""
echo -e "${CYAN}📁 Backup guardado en:${NC} $BACKUP_FILE"
echo ""
echo -e "${CYAN}🔍 Comandos útiles:${NC}"
echo -e "  ${YELLOW}Ver estado:${NC} docker-compose ps"
echo -e "  ${YELLOW}Ver logs:${NC} docker-compose logs -f backend"
echo -e "  ${YELLOW}Reiniciar:${NC} docker-compose restart backend"
echo ""
