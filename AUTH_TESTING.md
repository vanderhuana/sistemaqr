# 🔐 Pruebas del Sistema de Autenticación

## Endpoints Disponibles

### Base URL: `http://localhost:3000/api/auth`

## 1. **Registro de Usuario**
```bash
POST /api/auth/register
```

**Body (JSON):**
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123456",
  "firstName": "Usuario",
  "lastName": "Prueba",
  "phone": "+1234567890"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": "uuid-here",
    "username": "testuser",
    "email": "test@example.com",
    "firstName": "Usuario",
    "lastName": "Prueba",
    "role": "vendedor"
  },
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here"
}
```

## 2. **Login de Usuario**
```bash
POST /api/auth/login
```

**Body (JSON):**
```json
{
  "login": "admin@sisqr6.com",
  "password": "admin123"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": "uuid-here",
    "username": "admin",
    "email": "admin@sisqr6.com",
    "role": "admin"
  },
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here"
}
```

## 3. **Obtener Perfil**
```bash
GET /api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

## 4. **Actualizar Perfil**
```bash
PUT /api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (JSON):**
```json
{
  "firstName": "Nuevo Nombre",
  "lastName": "Nuevo Apellido",
  "phone": "+0987654321"
}
```

## 5. **Cambiar Contraseña**
```bash
POST /api/auth/change-password
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (JSON):**
```json
{
  "currentPassword": "admin123",
  "newPassword": "NewPass123",
  "confirmPassword": "NewPass123"
}
```

## 6. **Verificar Token**
```bash
GET /api/auth/verify
Authorization: Bearer YOUR_JWT_TOKEN
```

## 7. **Refrescar Token**
```bash
POST /api/auth/refresh
```

**Body (JSON):**
```json
{
  "refreshToken": "your-refresh-token-here"
}
```

## 8. **Logout**
```bash
POST /api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📋 Usuarios de Prueba Creados Automáticamente

| Usuario | Email | Password | Rol |
|---------|--------|----------|-----|
| admin | admin@sisqr6.com | admin123 | admin |
| vendedor1 | vendedor@sisqr6.com | vendedor123 | vendedor |
| control1 | control@sisqr6.com | control123 | control |

---

## 🧪 Comandos cURL para Pruebas Rápidas

### 1. Login Admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin@sisqr6.com",
    "password": "admin123"
  }'
```

### 2. Registro de Usuario Nuevo
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nuevouser",
    "email": "nuevo@example.com",
    "password": "Nueva123",
    "firstName": "Nuevo",
    "lastName": "Usuario"
  }'
```

### 3. Obtener Perfil (reemplaza TOKEN)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Verificar Estado de la Base de Datos
```bash
curl http://localhost:3000/db-status
```

---

## ⚠️ Notas Importantes

1. **JWT_SECRET**: Asegúrate de tener un JWT_SECRET en tu archivo `.env`
2. **PostgreSQL**: La base de datos debe estar corriendo y configurada
3. **Tokens**: Los tokens JWT expiran en 24h por defecto
4. **Roles**: Solo los admin pueden crear otros usuarios con roles específicos
5. **Validaciones**: Todas las rutas tienen validaciones de entrada estrictas

---

## 🚀 Próximo Paso Sugerido

Una vez que verifiques que la autenticación funciona correctamente, podemos continuar con:

- **API de Gestión de Eventos** (CRUD completo)
- **API de Venta de Entradas** (con generación de QR)
- **API de Validación QR** (para control de entrada)