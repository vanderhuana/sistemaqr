# Configuración de PostgreSQL para SisQR6

## 🚀 Instalación de PostgreSQL

### Windows
1. Descargar PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Ejecutar el instalador y seguir las instrucciones
3. Anotar la contraseña que configures para el usuario `postgres`

### Ubuntu/Linux
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

## 🔧 Configuración de la Base de Datos

### 1. Conectarse a PostgreSQL
```bash
psql -U postgres -h localhost
```

### 2. Crear la base de datos
```sql
CREATE DATABASE sisqr6_db;
CREATE USER sisqr6_user WITH PASSWORD 'tu_password_seguro';
GRANT ALL PRIVILEGES ON DATABASE sisqr6_db TO sisqr6_user;
\q
```

### 3. Configurar variables de entorno
Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus datos:
```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Base de datos PostgreSQL
DB_NAME=sisqr6_db
DB_USER=sisqr6_user  # o 'postgres' si usas el usuario por defecto
DB_PASSWORD=tu_password_seguro
DB_HOST=localhost
DB_PORT=5432

# JWT Secret (genera uno seguro)
JWT_SECRET=tu_jwt_secret_muy_muy_seguro_aqui_min_32_chars
```

## 🧪 Probar la conexión

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar el servidor
```bash
npm run dev
```

### 3. Verificar endpoints
- **API principal**: http://localhost:3000
- **Estado del servidor**: http://localhost:3000/health
- **Estado de la DB**: http://localhost:3000/db-status

## 📊 Datos de prueba incluidos

El sistema creará automáticamente estos usuarios de prueba:

| Usuario | Email | Password | Rol |
|---------|--------|----------|-----|
| admin | admin@sisqr6.com | admin123 | Administrador |
| vendedor1 | vendedor@sisqr6.com | vendedor123 | Vendedor |
| control1 | control@sisqr6.com | control123 | Control |

También se creará un evento de prueba con diferentes rangos de precios por horario.

## 🔒 Seguridad

⚠️ **IMPORTANTE**: En producción:
- Cambiar todas las contraseñas por defecto
- Usar un JWT_SECRET fuerte y único
- Configurar SSL/TLS para PostgreSQL
- Usar variables de entorno seguras

## 🐛 Solución de problemas

### Error de conexión a PostgreSQL
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solución**: 
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en `.env`
- Verificar que el puerto 5432 esté disponible

### Error de autenticación
```
Error: password authentication failed
```
**Solución**:
- Verificar usuario y contraseña en `.env`
- Verificar permisos del usuario en PostgreSQL

### Tablas no se crean
**Solución**:
- Verificar que la base de datos existe
- Verificar permisos del usuario
- Revisar logs del servidor para errores específicos