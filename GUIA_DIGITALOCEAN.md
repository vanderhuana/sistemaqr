# 🚀 Guía de Despliegue en DigitalOcean - SISQR6

Esta guía te llevará paso a paso para desplegar el sistema SISQR6 en DigitalOcean.

## 📋 Requisitos Previos

- Cuenta de DigitalOcean (puedes crear una en https://www.digitalocean.com/)
- Tarjeta de crédito para activar la cuenta
- Repositorio Git con el código (GitHub, GitLab o Bitbucket)

## 💰 Costos Estimados Mensuales

- **Managed PostgreSQL Database (Basic)**: ~$15/mes
- **App Platform (Basic)**: ~$5-12/mes por componente (frontend + backend = $10-24/mes)
- **Total estimado**: ~$25-40/mes

---

## 📝 PASO 1: Crear Base de Datos PostgreSQL

### 1.1 Ir a Databases en DigitalOcean

1. Login a DigitalOcean
2. Click en **Databases** en el menú lateral
3. Click en **Create Database**

### 1.2 Configurar la Base de Datos

- **Database Engine**: PostgreSQL 15
- **Region**: Selecciona la región más cercana a tus usuarios (ej: New York, San Francisco)
- **Database Cluster Size**: Basic Node - $15/mo (suficiente para empezar)
- **Database Name**: `sisqr6`
- **Nombre del cluster**: `sisqr6-db` (o el que prefieras)

### 1.3 Crear la Base de Datos

1. Click en **Create Database Cluster**
2. Espera 3-5 minutos mientras se aprovisiona
3. Una vez creado, verás la pantalla de detalles

### 1.4 Guardar Credenciales

En la sección **Connection Details**, encontrarás:

- **Host**: `tu-cluster-do-user-XXXX.db.ondigitalocean.com`
- **Port**: `25060`
- **User**: `doadmin`
- **Password**: (clic en "show" para ver)
- **Database**: `defaultdb`
- **SSL Mode**: `require`

**Connection String completa:**
```
postgresql://doadmin:CONTRASEÑA@host-XXXX.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

⚠️ **GUARDA ESTA INFORMACIÓN EN UN LUGAR SEGURO** ⚠️

### 1.5 Crear la Base de Datos del Proyecto

1. Click en **Users & Databases** en el menú de tu cluster
2. En la sección **Databases**, click en **Add new database**
3. Nombre: `sisqr6`
4. Click en **Save**

Tu connection string final será:
```
postgresql://doadmin:CONTRASEÑA@host-XXXX.db.ondigitalocean.com:25060/sisqr6?sslmode=require
```

---

## 🐳 PASO 2: Subir Código a GitHub (si no lo has hecho)

### 2.1 Inicializar Git en tu proyecto local

```bash
cd d:\sisfipo\sisqr6
git init
git add .
git commit -m "Initial commit - SISQR6 FEIPOBOL"
```

### 2.2 Crear repositorio en GitHub

1. Ve a https://github.com/new
2. Nombre: `sisqr6-feipobol`
3. Descripción: `Sistema de Venta y Validación de Entradas FEIPOBOL 2025`
4. Private (recomendado) o Public
5. Click en **Create repository**

### 2.3 Subir código

```bash
git remote add origin https://github.com/TU_USUARIO/sisqr6-feipobol.git
git branch -M main
git push -u origin main
```

---

## 🚀 PASO 3: Crear App en DigitalOcean App Platform

### 3.1 Ir a App Platform

1. En DigitalOcean, click en **Apps** en el menú lateral
2. Click en **Create App**

### 3.2 Conectar Repositorio

1. Selecciona **GitHub**
2. Autoriza a DigitalOcean si es primera vez
3. Selecciona tu repositorio `sisqr6-feipobol`
4. Branch: `main`
5. Click en **Next**

### 3.3 Configurar Backend

DigitalOcean detectará automáticamente los Dockerfiles. Configura:

**Backend Component:**
- **Name**: `sisqr6-backend`
- **Type**: Web Service
- **Source Directory**: `/backend`
- **Dockerfile Path**: `/backend/Dockerfile`
- **HTTP Port**: `3000`
- **Instance Size**: Basic - $5/mo
- **Instance Count**: 1

**Environment Variables para Backend:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://doadmin:TU_CONTRASEÑA@host-XXXX.db.ondigitalocean.com:25060/sisqr6?sslmode=require
JWT_SECRET=tu-super-secreto-jwt-de-minimo-32-caracteres-aleatorios
FRONTEND_URL=${APP_URL}
```

⚠️ Reemplaza `TU_CONTRASEÑA` con la contraseña real de tu base de datos

Para generar un JWT_SECRET seguro, ejecuta en tu terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Configurar Frontend

**Frontend Component:**
- **Name**: `sisqr6-frontend`
- **Type**: Static Site
- **Source Directory**: `/frontend`
- **Dockerfile Path**: `/frontend/Dockerfile`
- **HTTP Port**: `80`
- **Instance Size**: Basic - $5/mo

**Environment Variables para Frontend:**
```
VITE_API_URL=${sisqr6-backend.PUBLIC_URL}
```

(Esto se autocompletará con la URL del backend)

### 3.5 Configurar Dominio (Opcional pero Recomendado)

1. En **Settings** → **Domains**
2. Click en **Add Domain**
3. Ingresa tu dominio (ej: `sistema.feipobol.bo`)
4. Sigue las instrucciones para configurar DNS

Si no tienes dominio, DigitalOcean te dará uno gratuito como:
- Frontend: `sisqr6-frontend-XXXX.ondigitalocean.app`
- Backend: `sisqr6-backend-XXXX.ondigitalocean.app`

### 3.6 Iniciar Despliegue

1. Click en **Create Resources**
2. Espera 5-10 minutos mientras se construyen las imágenes Docker
3. Observa los logs en **Runtime Logs**

---

## 🌱 PASO 4: Ejecutar Seeds de Base de Datos

Una vez que el backend esté desplegado:

### 4.1 Acceder a la Consola del Backend

1. En App Platform, ve a tu app `sisqr6-backend`
2. Click en **Console** en el menú
3. Se abrirá una terminal dentro del contenedor

### 4.2 Ejecutar el Script de Seeds

```bash
npm run seed:users
```

Esto creará los usuarios de producción:
- **Admin**: admin@feipobol.bo / Feipobol2025!
- **Vendedor**: vendedor@feipobol.bo / Vendedor2025!
- **Control**: control@feipobol.bo / Control2025!

---

## ✅ PASO 5: Verificar Funcionamiento

### 5.1 Probar el Frontend

1. Ve a la URL de tu frontend (ej: `https://sisqr6-frontend-XXXX.ondigitalocean.app`)
2. Deberías ver la pantalla de login de FEIPOBOL
3. Intenta hacer login con alguno de los usuarios creados

### 5.2 Probar el Backend

1. Abre: `https://sisqr6-backend-XXXX.ondigitalocean.app/api/health`
2. Deberías ver un mensaje de "healthy" o similar

### 5.3 Verificar Conexión a Base de Datos

En el **Runtime Logs** del backend, busca:
```
✅ Conexión a PostgreSQL establecida correctamente.
```

---

## 🔒 PASO 6: Configuración de Seguridad

### 6.1 Cambiar Contraseñas Predeterminadas

1. Login como admin
2. Ve a Gestión de Usuarios
3. Cambia las contraseñas de los usuarios predeterminados

### 6.2 Configurar CORS

El backend ya está configurado para aceptar requests del frontend. Verifica en `backend/server.js` que `FRONTEND_URL` esté correctamente configurado.

### 6.3 Habilitar SSL/HTTPS

DigitalOcean App Platform configura automáticamente SSL con Let's Encrypt. Todas las conexiones serán HTTPS por defecto.

---

## 📊 PASO 7: Monitoreo y Mantenimiento

### 7.1 Ver Logs

- **Backend Logs**: Apps → sisqr6-backend → Runtime Logs
- **Frontend Logs**: Apps → sisqr6-frontend → Runtime Logs
- **Database Logs**: Databases → sisqr6-db → Logs

### 7.2 Configurar Alertas

1. En tu app, ve a **Settings** → **Alerts**
2. Configura alertas para:
   - High CPU usage
   - High memory usage
   - Application crashes

### 7.3 Backups de Base de Datos

Los backups son automáticos con Managed Database:
- **Daily backups**: Últimos 7 días
- **Point-in-time recovery**: Disponible

Para descargar un backup manual:
1. Databases → sisqr6-db → Backups
2. Click en un backup
3. Download

---

## 🔄 PASO 8: Actualizar la Aplicación

### Opción A: Auto-deploy desde GitHub

Por defecto, DigitalOcean redespliega automáticamente cuando haces push a `main`:

```bash
# En tu máquina local
git add .
git commit -m "Actualización del sistema"
git push origin main

# DigitalOcean detectará el cambio y redespl automated
```

### Opción B: Deploy Manual

1. En App Platform, ve a tu app
2. Click en **Actions** → **Force Rebuild & Deploy**

---

## 🐛 Troubleshooting Común

### Error: "Cannot connect to database"

**Solución:**
1. Verifica que `DATABASE_URL` esté correctamente configurada
2. Asegúrate de que incluya `?sslmode=require` al final
3. Verifica que la contraseña no tenga caracteres especiales sin escapar

### Error: "CORS policy blocked"

**Solución:**
1. Verifica que `FRONTEND_URL` en el backend apunte a la URL correcta del frontend
2. Revisa los logs del backend para ver los errores de CORS
3. Asegúrate de que ambos usen HTTPS

### Error: "Application crashed"

**Solución:**
1. Revisa los Runtime Logs
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que las dependencias se instalaron correctamente

### Frontend muestra página en blanco

**Solución:**
1. Abre las DevTools del navegador (F12)
2. Revisa la consola para errores
3. Verifica que `VITE_API_URL` apunte al backend correcto
4. Prueba hacer build localmente: `npm run build`

---

## 📞 Soporte Adicional

Si necesitas ayuda:
1. Revisa los logs en tiempo real
2. Consulta la documentación de DigitalOcean: https://docs.digitalocean.com/
3. Contacta al equipo de desarrollo

---

## 🎉 ¡Listo!

Tu sistema SISQR6 ahora está desplegado en producción y listo para vender entradas para FEIPOBOL 2025.

**URLs de acceso:**
- Frontend: https://tu-dominio.com (o la URL de App Platform)
- Backend API: https://backend-url.ondigitalocean.app

**Usuarios de acceso:**
- Admin: admin@feipobol.bo
- Vendedor: vendedor@feipobol.bo
- Control: control@feipobol.bo

¡Que tengas un excelente evento! 🇧🇴 🎫
