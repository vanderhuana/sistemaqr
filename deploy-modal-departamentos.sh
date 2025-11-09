#!/bin/bash
# Despliegue del modal de departamentos en producción
# Fecha: 2025-11-01

echo "🚀 Desplegando modal de departamentos en producción..."
echo ""

# 1. Ir al directorio del proyecto
cd /root/sitemaqrf

# 2. Verificar rama actual
echo "📍 Verificando rama actual..."
git branch

# 3. Descargar últimos cambios
echo "📥 Descargando últimos cambios desde GitHub..."
git pull origin master

# 4. Mostrar último commit
echo "📝 Último commit:"
git log --oneline -1

# 5. Reconstruir frontend (solo frontend, ya que solo cambiamos eso)
echo "🔨 Reconstruyendo contenedor del frontend..."
docker-compose build --no-cache frontend

# 6. Reiniciar solo el frontend
echo "🔄 Reiniciando frontend..."
docker-compose up -d frontend

# 7. Esperar a que inicie
echo "⏳ Esperando 10 segundos..."
sleep 10

# 8. Verificar estado
echo "✅ Estado de contenedores:"
docker-compose ps

# 9. Ver logs del frontend
echo "📋 Últimos logs del frontend:"
docker-compose logs --tail=20 frontend

echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "📋 Verifica que funcione:"
echo "1. Abre https://fepp.online"
echo "2. Busca el formulario de registro de participantes"
echo "3. En el campo 'Zona', selecciona 'Otra'"
echo "4. Deberías ver el modal con los 9 departamentos de Bolivia"
echo ""
