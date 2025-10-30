#!/bin/bash
# Script para instalar certificados SSL con Let's Encrypt
# Sistema: sitemaqrf en DigitalOcean Ubuntu
# Ejecutar DESPUÉS de setup-nginx.sh

set -e

echo "🔒 Instalando certificados SSL para fepp.online..."

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Instalar Certbot
echo -e "${YELLOW}📦 Instalando Certbot...${NC}"
apt update
apt install certbot python3-certbot-nginx -y

# 2. Verificar que el dominio apunta correctamente
echo -e "${YELLOW}🔍 Verificando DNS...${NC}"
echo "fepp.online debe apuntar a:"
curl -s ifconfig.me
echo ""
nslookup fepp.online || dig +short fepp.online

# 3. Solicitar correo electrónico para Let's Encrypt
echo ""
echo -e "${YELLOW}📧 Ingresa tu email para notificaciones de Let's Encrypt:${NC}"
read -p "Email: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}❌ Email requerido${NC}"
    exit 1
fi

# 4. Obtener certificados SSL
echo -e "${YELLOW}🔐 Obteniendo certificados SSL...${NC}"
certbot --nginx \
    -d fepp.online \
    -d www.fepp.online \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --redirect

# 5. Verificar renovación automática
echo -e "${YELLOW}🔄 Configurando renovación automática...${NC}"
systemctl status certbot.timer --no-pager || true

# Test de renovación (dry-run)
certbot renew --dry-run

# 6. Verificar certificados
echo -e "${YELLOW}📜 Certificados instalados:${NC}"
certbot certificates

# 7. Verificar configuración de Nginx
echo -e "${YELLOW}🔍 Verificando Nginx...${NC}"
nginx -t

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ SSL Configurado correctamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}🌐 Tu sitio ahora está en:${NC}"
echo "   https://fepp.online"
echo "   https://www.fepp.online"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "1. Actualizar .env.production del frontend (usar rutas relativas)"
echo "2. Rebuild del frontend en el servidor"
echo "3. Probar todas las funcionalidades"
echo ""
echo -e "${YELLOW}💡 Verificar SSL:${NC}"
echo "   curl -I https://fepp.online"
echo "   openssl s_client -connect fepp.online:443 -servername fepp.online"
