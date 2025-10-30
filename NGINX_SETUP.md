# 🚀 Guía Completa: Configuración de Nginx para fepp.online

## 📋 Resumen
Esta guía configura Nginx como proxy inverso para:
- **Frontend Vue3**: Puerto 8080 → Nginx puerto 80/443
- **Backend Express API**: Puerto 3001 → Nginx `/api/` routes
- **SSL/HTTPS**: Certificados Let's Encrypt con renovación automática

---

## ✅ Pre-requisitos

1. ✔️ Servidor Ubuntu en DigitalOcean (142.93.26.33)
2. ✔️ Dominio fepp.online apuntando a la IP del servidor
3. ✔️ Docker containers corriendo (sisqr6-frontend, sisqr6-backend, sisqr6-postgres)
4. ✔️ Puertos 80 y 443 disponibles

---

## 🔧 Paso 1: Subir Scripts al Servidor

Desde tu máquina local (Windows), sube los scripts:

```powershell
# Opción A: Usando SCP (si tienes instalado)
scp setup-nginx.sh root@142.93.26.33:/root/
scp setup-ssl.sh root@142.93.26.33:/root/

# Opción B: Copiar manualmente
# 1. Conectar por SSH
# 2. Crear archivos con nano
# 3. Copiar el contenido
```

---

## 🚀 Paso 2: Instalar y Configurar Nginx

Conecta al servidor:

```bash
ssh root@142.93.26.33
```

Ejecuta el script de instalación:

```bash
cd /root
chmod +x setup-nginx.sh
./setup-nginx.sh
```

Este script hará:
- ✅ Instalar Nginx
- ✅ Crear configuración para fepp.online
- ✅ Configurar proxy para frontend (puerto 8080)
- ✅ Configurar proxy para backend API (puerto 3001)
- ✅ Activar sitio
- ✅ Configurar firewall UFW

**Verificar que funciona:**

```bash
# Desde el servidor
curl http://localhost/nginx-health
# Debe responder: "Nginx OK"

curl http://fepp.online
# Debe mostrar el HTML del frontend
```

---

## 🔒 Paso 3: Instalar Certificados SSL

Ejecuta el script de SSL:

```bash
cd /root
chmod +x setup-ssl.sh
./setup-ssl.sh
```

Te pedirá:
1. Email para notificaciones de Let's Encrypt
2. Confirmación de términos

Certbot automáticamente:
- ✅ Obtendrá certificados SSL
- ✅ Modificará la configuración de Nginx
- ✅ Habilitará redirección HTTP → HTTPS
- ✅ Configurará renovación automática (cada 60 días)

**Verificar SSL:**

```bash
# Verificar certificado
curl -I https://fepp.online

# Comprobar renovación automática
sudo certbot renew --dry-run
```

---

## 🔄 Paso 4: Actualizar Frontend para Rutas Relativas

Ahora que Nginx maneja el proxy, actualiza el frontend para usar rutas relativas.

**En tu máquina local (Windows):**

```powershell
cd D:\sisfipo\sisqr6
```

Edita `frontend/.env.production`:

```bash
# Variables de entorno para PRODUCCIÓN
# Con Nginx, usamos rutas relativas
# Nginx proxy redirige /api/ al backend en puerto 3001
VITE_API_URL=
```

Guarda, commit y push:

```powershell
git add frontend/.env.production
git commit -m "Config: Configurar rutas relativas con Nginx proxy"
git push origin master
```

---

## 🐳 Paso 5: Rebuild Frontend en Servidor

**En el servidor:**

```bash
cd /root/sitemaqrf

# Pull cambios
git pull origin master

# Rebuild frontend sin caché
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d

# Verificar containers
docker-compose ps
# Todos deben estar "healthy"
```

---

## ✅ Paso 6: Verificar Funcionamiento

### Test 1: Acceso Web

```bash
# Desde navegador
https://fepp.online
# Debe cargar el sitio con SSL (candado verde)
```

### Test 2: API Backend

```bash
# Desde el servidor o tu máquina
curl https://fepp.online/api/auth/health
# O cualquier endpoint de API
```

### Test 3: Login y Validación QR

1. Abre https://fepp.online
2. Login con usuario de control
3. Escanea un código QR
4. Verifica que la validación funcione

### Test 4: Network Inspector

1. F12 en navegador
2. Tab "Network"
3. Intenta login
4. Verifica que las peticiones sean a `/api/auth/login` (rutas relativas)
5. Response debe ser exitoso

---

## 📊 Monitoreo y Logs

### Ver logs de Nginx

```bash
# Access logs (tráfico)
tail -f /var/log/nginx/fepp.online.access.log

# Error logs (problemas)
tail -f /var/log/nginx/fepp.online.error.log
```

### Ver logs de Docker

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend
```

### Verificar estado de servicios

```bash
# Nginx
sudo systemctl status nginx

# Docker containers
docker-compose ps

# Certificados SSL
sudo certbot certificates
```

---

## 🔧 Configuración de Nginx Explicada

```nginx
# Frontend - Todas las rutas excepto /api/
location / {
    proxy_pass http://localhost:8080;  # Docker container frontend
    # Headers para el proxy
    # Cache control para assets estáticos
}

# Backend API - Todas las rutas que empiecen con /api/
location /api/ {
    proxy_pass http://localhost:3001/api/;  # Docker container backend
    # Timeouts largos (120s) para generación de QR
    # Headers de proxy
}
```

---

## 🛠️ Troubleshooting

### Problema: "502 Bad Gateway"

**Causa:** Nginx no puede conectar al backend/frontend

**Solución:**
```bash
# Verificar containers
docker-compose ps

# Reiniciar containers si no están healthy
docker-compose restart

# Ver logs
docker-compose logs backend
docker-compose logs frontend
```

### Problema: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**Causa:** Certificado SSL no configurado correctamente

**Solución:**
```bash
# Verificar certificados
sudo certbot certificates

# Renovar si es necesario
sudo certbot renew --force-renewal

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: API requests fallan con CORS

**Causa:** Backend no permite el origen

**Solución:**
Verifica `backend/server.js` incluya:
```javascript
'https://fepp.online',
'https://www.fepp.online'
```

### Problema: Frontend no se actualiza

**Causa:** Caché del navegador

**Solución:**
```bash
# Hard refresh en navegador
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)

# O limpiar caché de navegador
```

---

## 🔐 Seguridad

### Firewall UFW

```bash
# Ver reglas actuales
sudo ufw status

# Permitir solo lo necesario
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Headers de Seguridad (ya configurados)

- ✅ Helmet.js en backend
- ✅ CORS configurado
- ✅ HTTPS obligatorio (redirect automático)
- ✅ SSL con certificados válidos

---

## 📞 Comandos Útiles

```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar config de Nginx
sudo nginx -t

# Recargar Nginx (sin downtime)
sudo systemctl reload nginx

# Ver procesos Nginx
ps aux | grep nginx

# Verificar puertos en uso
netstat -tulpn | grep -E ':(80|443|3001|8080)'

# Test de certificado SSL
openssl s_client -connect fepp.online:443 -servername fepp.online
```

---

## 🎯 Resumen de URLs

| Servicio | URL Directa | URL con Nginx |
|----------|-------------|---------------|
| Frontend | http://142.93.26.33:8080 | https://fepp.online |
| Backend API | http://142.93.26.33:3001/api | https://fepp.online/api |
| Health Backend | http://142.93.26.33:3001/health | https://fepp.online/api/health |
| PostgreSQL | localhost:5432 | N/A (interno) |

---

## ✨ Resultado Final

Después de completar todos los pasos:

✅ https://fepp.online - Sitio web con SSL  
✅ https://www.fepp.online - Redirección automática  
✅ Frontend usa rutas relativas (/api/)  
✅ Nginx maneja proxy a backend  
✅ Certificados SSL renovación automática  
✅ HTTP → HTTPS redirect automático  
✅ Firewall configurado  
✅ Logs centralizados  

---

**¡Tu sistema está en producción con SSL! 🚀**
