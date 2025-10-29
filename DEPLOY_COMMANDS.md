# Comandos para Deploy en DigitalOcean

## 1. Conectarse al servidor
```bash
ssh root@142.93.26.33
```

## 2. Navegar al directorio del proyecto
```bash
cd /root/sistemaqr
```

## 3. Detener los contenedores actuales
```bash
docker-compose down
```

## 4. Obtener los últimos cambios
```bash
git pull origin master
```

## 5. Reconstruir y levantar los contenedores
```bash
docker-compose up -d --build
```

## 6. Verificar que los contenedores estén corriendo
```bash
docker-compose ps
```

## 7. Ver los logs en tiempo real (opcional)
```bash
docker-compose logs -f backend frontend
```

## 8. Verificar el estado del backend
```bash
curl http://localhost:3001/health
```

## 9. Verificar el estado del frontend
```bash
curl http://localhost:8080
```

## 10. Salir de los logs (si los estás viendo)
Presiona: `Ctrl + C`

## URLs de acceso:
- Frontend: http://142.93.26.33:8080
- Frontend (dominio): https://fepp.online
- Frontend (www): https://www.fepp.online
- Backend API: http://142.93.26.33:3001

## Comandos útiles adicionales:

### Ver logs de un servicio específico
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Reiniciar un servicio específico
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Ver uso de recursos
```bash
docker stats
```

### Limpiar contenedores e imágenes antiguas
```bash
docker system prune -a
```

## Verificación final:
1. Abrir navegador en: https://fepp.online
2. Login con usuario admin
3. Probar generación de 1000 entradas QR
4. Verificar que el scanner funcione correctamente
5. Descargar PDF y verificar que no se cuelgue

## Mejoras incluidas en este deploy:
✅ Generación masiva hasta 5000 QRs
✅ Inserción masiva con bulkCreate (100x más rápido)
✅ Barra de progreso visual
✅ PDF optimizado con procesamiento por lotes
✅ Scanner mejorado (150ms, full video, attemptBoth)
✅ QR tickets 30mm, 40 por página
✅ Líneas de corte optimizadas
✅ Timeout API aumentado a 120 segundos
