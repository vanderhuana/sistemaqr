#!/bin/bash
# Script para reiniciar completamente los servicios en producción
# ADVERTENCIA: Esto detendrá todos los servicios temporalmente

echo "⚠️  ADVERTENCIA: Esto detendrá todos los servicios"
echo "El sitio web estará OFFLINE durante ~30 segundos"
echo ""
read -p "¿Estás seguro? (escribe 'SI' para continuar): " confirmacion

if [ "$confirmacion" != "SI" ]; then
    echo "❌ Cancelado"
    exit 1
fi

cd /root/sitemaqrf

echo ""
echo "🛑 Deteniendo todos los contenedores..."
docker-compose down

echo ""
echo "📥 Descargando últimos cambios..."
git pull origin master

echo ""
echo "🔨 Reconstruyendo todos los contenedores..."
docker-compose build --no-cache

echo ""
echo "🚀 Iniciando servicios..."
docker-compose up -d

echo ""
echo "⏳ Esperando 15 segundos a que inicien los servicios..."
sleep 15

echo ""
echo "✅ Estado de contenedores:"
docker-compose ps

echo ""
echo "📋 Logs del backend:"
docker-compose logs --tail=20 backend

echo ""
echo "📋 Logs del frontend:"
docker-compose logs --tail=20 frontend

echo ""
echo "🎉 ¡Servicios reiniciados!"
echo "Verifica en: https://fepp.online"
