#!/bin/bash
# COMANDOS PARA DESPLEGAR MODAL DE DEPARTAMENTOS
# Ejecutar en el servidor de producción

# ============================================
# 🚀 DESPLIEGUE RÁPIDO
# ============================================

# Conectarse al servidor
ssh root@142.93.26.33

# Ejecutar estos comandos en el servidor:

cd /root/sitemaqrf

# Descargar cambios
git pull origin master

# Reconstruir solo el frontend (más rápido)
docker-compose build --no-cache frontend

# Reiniciar frontend
docker-compose up -d frontend

# Esperar 10 segundos
sleep 10

# Verificar estado
docker-compose ps

# Ver logs
docker-compose logs --tail=30 frontend

# ============================================
# ✅ VERIFICACIÓN
# ============================================

# Después del despliegue:
# 1. Abre https://fepp.online
# 2. Ve al formulario de registro de participantes
# 3. En el campo "Zona", selecciona "Otra"
# 4. Deberías ver el modal con los 9 departamentos de Bolivia
