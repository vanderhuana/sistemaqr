#!/bin/bash
# Script de instalación y configuración de Nginx para fepp.online
# Sistema: sitemaqrf en DigitalOcean Ubuntu
# Ejecutar como root: bash setup-nginx.sh

set -e  # Salir si hay errores

echo "🚀 Iniciando configuración de Nginx para fepp.online..."

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar que estamos en el servidor correcto
echo -e "${YELLOW}📍 Verificando servidor...${NC}"
hostname
ip addr show | grep "inet " | grep -v 127.0.0.1

# 2. Actualizar sistema e instalar Nginx
echo -e "${YELLOW}📦 Instalando Nginx...${NC}"
apt update
apt install nginx -y

# 3. Verificar instalación
nginx -v
systemctl status nginx --no-pager || true

# 4. Crear configuración de Nginx para fepp.online
echo -e "${YELLOW}⚙️  Creando configuración de Nginx...${NC}"
cat > /etc/nginx/sites-available/fepp.online << 'EOF'
# Configuración Nginx para fepp.online
# Frontend Vue3 en puerto 8080 (Docker)
# Backend Express API en puerto 3001 (Docker)

server {
    listen 80;
    listen [::]:80;
    server_name fepp.online www.fepp.online;

    # Logs específicos para este dominio
    access_log /var/log/nginx/fepp.online.access.log;
    error_log /var/log/nginx/fepp.online.error.log;

    # Aumentar tamaño máximo de body para uploads
    client_max_body_size 10M;

    # Permitir validación de Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy para API Backend
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        
        # Headers necesarios para el proxy
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # WebSocket support (si es necesario)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para operaciones largas (QR generation, etc)
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
        
        # Buffers
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Proxy para Frontend Vue3
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support para hot reload (desarrollo)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        
        # Cache control para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://localhost:8080;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Health check endpoint
    location /nginx-health {
        access_log off;
        return 200 "Nginx OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

echo -e "${GREEN}✅ Configuración de Nginx creada${NC}"

# 5. Activar el sitio
echo -e "${YELLOW}🔗 Activando sitio...${NC}"
ln -sf /etc/nginx/sites-available/fepp.online /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 6. Verificar configuración
echo -e "${YELLOW}🔍 Verificando configuración de Nginx...${NC}"
nginx -t

# 7. Reiniciar Nginx
echo -e "${YELLOW}🔄 Reiniciando Nginx...${NC}"
systemctl restart nginx
systemctl enable nginx

# 8. Verificar estado
systemctl status nginx --no-pager

# 9. Configurar firewall UFW
echo -e "${YELLOW}🛡️  Configurando firewall...${NC}"
ufw status || echo "UFW no está activo"
ufw allow 'Nginx Full' || true
ufw status

# 10. Verificar containers Docker
echo -e "${YELLOW}🐳 Verificando containers Docker...${NC}"
cd /root/sitemaqrf
docker-compose ps

# 11. Test de conectividad
echo -e "${YELLOW}🧪 Probando conectividad...${NC}"
echo -e "Frontend (8080): "
curl -s http://localhost:8080 | head -n 5 || echo "No responde"

echo -e "\nBackend (3001): "
curl -s http://localhost:3001/health || echo "No responde"

echo -e "\nNginx (80): "
curl -s http://localhost/nginx-health || echo "No responde"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Nginx configurado correctamente${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo ""
echo "1. Instalar certificados SSL con Let's Encrypt:"
echo "   sudo certbot --nginx -d fepp.online -d www.fepp.online"
echo ""
echo "2. Probar el sitio:"
echo "   http://fepp.online"
echo ""
echo "3. Después de SSL, actualizar frontend para usar rutas relativas"
echo ""
echo -e "${YELLOW}💡 Logs de Nginx:${NC}"
echo "   tail -f /var/log/nginx/fepp.online.access.log"
echo "   tail -f /var/log/nginx/fepp.online.error.log"
