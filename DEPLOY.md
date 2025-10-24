# SISQR6 - Sistema de Venta y Validación de Entradas FEIPOBOL

Sistema completo de venta, generación de QR codes y validación de entradas para eventos de FEIPOBOL 2025.

## 🚀 Características

- ✅ Venta de entradas con múltiples métodos de pago
- ✅ Generación de códigos QR únicos (hasta 30,000 por evento)
- ✅ Validación en tiempo real con escáner QR
- ✅ Control de acceso para trabajadores y participantes
- ✅ Dashboard administrativo completo
- ✅ Sistema de roles (Admin, Vendedor, Control)
- ✅ Reportes y estadísticas en tiempo real

## 📋 Requisitos Previos

- Node.js 20.x o superior
- PostgreSQL 15 o superior
- Docker y Docker Compose (para despliegue)

## 🛠️ Instalación Local

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🐳 Despliegue con Docker

### Opción 1: Docker Compose (Desarrollo/Testing)

```bash
# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con valores de producción

# Construir y levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Opción 2: DigitalOcean App Platform

#### Paso 1: Crear Base de Datos Managed PostgreSQL

1. Ir a DigitalOcean → Databases → Create Database
2. Seleccionar PostgreSQL 15
3. Elegir región (recomendado: misma región que la app)
4. Plan: Basic ($15/mes o superior)
5. Guardar las credenciales de conexión

#### Paso 2: Configurar Variables de Entorno

En DigitalOcean App Platform, configurar:

**Backend:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://usuario:password@host:port/database?sslmode=require
JWT_SECRET=tu-clave-secreta-jwt-minimo-32-caracteres
FRONTEND_URL=https://tu-dominio.com
```

**Frontend:**
```
VITE_API_URL=https://tu-backend.ondigitalocean.app
```

#### Paso 3: Crear Seeds de Usuarios

Conectarse al backend y ejecutar:

```bash
npm run seed:users
```

Usuarios creados:
- **Admin:** admin@feipobol.bo / Feipobol2025!
- **Vendedor:** vendedor@feipobol.bo / Vendedor2025!
- **Control:** control@feipobol.bo / Control2025!

#### Paso 4: Configurar Dominio y SSL

1. En App Platform → Settings → Domains
2. Agregar dominio personalizado
3. Configurar DNS según instrucciones
4. SSL se configura automáticamente con Let's Encrypt

## 🔒 Seguridad

- ✅ Autenticación JWT
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Rate limiting en endpoints críticos
- ✅ Validación de datos con express-validator
- ✅ CORS configurado
- ✅ Headers de seguridad con Helmet
- ✅ SSL/TLS en producción

## 📊 Estructura del Proyecto

```
sisqr6/
├── backend/              # API REST con Node.js/Express
│   ├── src/
│   │   ├── config/      # Configuración de DB y app
│   │   ├── controllers/ # Lógica de negocio
│   │   ├── middleware/  # Auth, validación, seguridad
│   │   ├── models/      # Modelos Sequelize
│   │   ├── routes/      # Definición de rutas
│   │   └── utils/       # Utilidades (QR, precios, etc)
│   ├── scripts/         # Scripts de seeds y testing
│   └── Dockerfile
│
├── frontend/            # SPA con Vue 3 + Vuetify
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── views/       # Vistas principales
│   │   ├── services/    # Servicios API
│   │   ├── stores/      # Estado global (Pinia)
│   │   └── utils/       # Utilidades
│   ├── nginx.conf       # Configuración nginx
│   └── Dockerfile
│
└── docker-compose.yml   # Orquestación de servicios
```

## 🧪 Testing

### Prueba de Generación Masiva de QR

```bash
cd backend
node scripts/test-qr-generation.js
```

## 📱 Funcionalidades por Rol

### Administrador
- Gestión completa de usuarios
- Creación y edición de eventos
- Venta de entradas
- Generación masiva de QR codes
- Reportes y estadísticas
- Control de acceso del sistema

### Vendedor
- Venta de entradas
- Consulta de eventos disponibles
- Generación de QR para ventas

### Control
- Escáner QR para validación
- Registro de accesos
- Consulta de validaciones

## 🔧 Mantenimiento

### Backup de Base de Datos

```bash
# En DigitalOcean Managed Database, los backups son automáticos
# Para backup manual:
pg_dump -h host -U user -d database > backup.sql
```

### Ver Logs

```bash
# Docker Compose
docker-compose logs -f backend
docker-compose logs -f frontend

# DigitalOcean App Platform
# Ir a Runtime Logs en el panel de control
```

### Actualizar Aplicación

```bash
# Hacer push a GitHub
git add .
git commit -m "Actualización"
git push origin main

# DigitalOcean App Platform se redespliega automáticamente
```

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades, contactar al equipo de desarrollo.

## 📄 Licencia

Copyright © 2025 FEIPOBOL - Todos los derechos reservados.

---

**FEIPOBOL 2025** - En el Bicentenario de Bolivia 🇧🇴
