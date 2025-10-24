# 🎉 API de Gestión de Eventos

## Base URL: `http://localhost:3000/api/events`

---

## 📋 Endpoints Disponibles

### **PÚBLICOS** (sin autenticación requerida)

## 1. **Listar Eventos**
```bash
GET /api/events
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)
- `status` (opcional): Filtrar por estado
- `search` (opcional): Buscar en nombre/descripción
- `location` (opcional): Filtrar por ubicación
- `startDate` (opcional): Eventos desde esta fecha
- `endDate` (opcional): Eventos hasta esta fecha

**Ejemplo:**
```bash
curl "http://localhost:3000/api/events?page=1&limit=5&status=active"
```

## 2. **Obtener Evento por ID**
```bash
GET /api/events/:id
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/events/uuid-del-evento
```

## 3. **Obtener Precio Actual**
```bash
GET /api/events/:id/price
```

**Query Parameters:**
- `dateTime` (opcional): ISO date para consultar precio específico

**Ejemplo:**
```bash
curl "http://localhost:3000/api/events/uuid-del-evento/price?dateTime=2023-12-25T15:30:00Z"
```

---

### **PROTEGIDOS** (requieren autenticación de Admin)

## 4. **Crear Evento** 🔐 Admin
```bash
POST /api/events
Authorization: Bearer TOKEN
```

**Body (JSON):**
```json
{
  "name": "Concierto de Rock",
  "description": "Un increíble concierto de rock en vivo",
  "location": "Estadio Nacional",
  "startDate": "2024-03-15T20:00:00Z",
  "endDate": "2024-03-15T23:30:00Z",
  "maxCapacity": 5000,
  "basePrice": 50.00,
  "priceRanges": [
    {
      "startTime": "18:00",
      "endTime": "20:00",
      "price": 45.00
    },
    {
      "startTime": "20:00",
      "endTime": "23:59",
      "price": 60.00
    }
  ],
  "saleStartDate": "2024-01-15T00:00:00Z",
  "saleEndDate": "2024-03-15T18:00:00Z",
  "allowRefunds": true,
  "requiresApproval": false,
  "imageUrl": "https://example.com/imagen.jpg"
}
```

## 5. **Actualizar Evento** 🔐 Admin
```bash
PUT /api/events/:id
Authorization: Bearer TOKEN
```

## 6. **Cambiar Estado del Evento** 🔐 Admin
```bash
PATCH /api/events/:id/status
Authorization: Bearer TOKEN
```

**Body (JSON):**
```json
{
  "status": "active"
}
```

**Estados válidos:** `draft`, `active`, `suspended`, `finished`, `cancelled`

## 7. **Eliminar Evento** 🔐 Admin
```bash
DELETE /api/events/:id
Authorization: Bearer TOKEN
```

⚠️ **Solo se puede eliminar si no tiene entradas vendidas**

## 8. **Dashboard de Eventos** 🔐 Admin
```bash
GET /api/events/admin/dashboard
Authorization: Bearer TOKEN
```

---

## 🧪 Pruebas Paso a Paso

### **Paso 1: Login como Admin**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin@sisqr6.com",
    "password": "admin123"
  }'
```

**Guarda el `token` de la respuesta para los siguientes pasos.**

### **Paso 2: Crear un Evento**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "name": "Festival de Música 2024",
    "description": "El mejor festival del año con artistas increíbles",
    "location": "Parque Central",
    "startDate": "2024-06-15T18:00:00Z",
    "endDate": "2024-06-15T23:59:00Z",
    "maxCapacity": 1000,
    "basePrice": 35.00,
    "priceRanges": [
      {
        "startTime": "16:00",
        "endTime": "20:00",
        "price": 30.00
      },
      {
        "startTime": "20:00",
        "endTime": "23:59",
        "price": 40.00
      }
    ],
    "allowRefunds": true
  }'
```

### **Paso 3: Activar el Evento**
```bash
curl -X PATCH http://localhost:3000/api/events/ID_DEL_EVENTO/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{"status": "active"}'
```

### **Paso 4: Listar Eventos Públicos**
```bash
curl http://localhost:3000/api/events
```

### **Paso 5: Verificar Precio Actual**
```bash
curl http://localhost:3000/api/events/ID_DEL_EVENTO/price
```

### **Paso 6: Dashboard de Admin**
```bash
curl http://localhost:3000/api/events/admin/dashboard \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 💡 Características del Sistema de Precios

### **Rangos de Precios por Horario**
- ⏰ Define precios diferentes según la hora del día
- 📅 Formato: `HH:MM` (24 horas)
- 🔄 Soporte para rangos que cruzan medianoche
- ❌ Validación automática de solapamientos
- 💰 Precio base usado cuando no hay rango aplicable

### **Ejemplo de Rangos:**
```json
{
  "basePrice": 25.00,
  "priceRanges": [
    {
      "startTime": "09:00",
      "endTime": "12:00", 
      "price": 20.00
    },
    {
      "startTime": "18:00",
      "endTime": "23:00",
      "price": 35.00
    }
  ]
}
```

**Resultado:**
- 09:00-12:00 → $20.00
- 12:00-18:00 → $25.00 (precio base)
- 18:00-23:00 → $35.00
- 23:00-09:00 → $25.00 (precio base)

---

## 🛡️ Seguridad y Permisos

| Acción | Público | Vendedor | Control | Admin |
|--------|---------|----------|---------|-------|
| Listar eventos activos | ✅ | ✅ | ✅ | ✅ |
| Ver evento activo | ✅ | ✅ | ✅ | ✅ |
| Ver todos los eventos | ❌ | ❌ | ❌ | ✅ |
| Crear evento | ❌ | ❌ | ❌ | ✅ |
| Editar evento | ❌ | ❌ | ❌ | ✅ |
| Eliminar evento | ❌ | ❌ | ❌ | ✅ |
| Dashboard | ❌ | ❌ | ❌ | ✅ |

---

## ⚠️ Validaciones Importantes

### **Al Crear Evento:**
- ✅ Fechas de inicio/fin válidas y futuras
- ✅ Capacidad entre 1 y 50,000
- ✅ Precios no negativos
- ✅ Rangos de precio sin solapamiento
- ✅ Fechas de venta coherentes

### **Al Actualizar Evento:**
- ⚠️ No se pueden cambiar fechas si ya hay entradas vendidas
- ⚠️ No se puede reducir capacidad por debajo de entradas vendidas
- ✅ Se pueden actualizar precios y descripción

### **Al Eliminar Evento:**
- ❌ No se puede eliminar si tiene entradas vendidas
- ✅ Solo admin puede eliminar

---

## 🚀 Próximo Paso

Una vez que verifiques que la gestión de eventos funciona, podemos continuar con:

**→ API de Venta de Entradas** (generación de códigos QR únicos)