# 🎫 API de Venta de Entradas con QR

## Base URL: `http://localhost:3000/api/tickets`

---

## 🎯 Funcionalidades Principales

- ✅ **Venta de entradas** con códigos QR únicos
- ✅ **Generación automática** de códigos QR
- ✅ **Validación de disponibilidad** y precios en tiempo real
- ✅ **Control de permisos** por roles
- ✅ **Cancelación de entradas** (con restricciones)
- ✅ **Estadísticas de ventas** personalizadas
- ✅ **Múltiples formatos de QR** (PNG, SVG, DataURL)

---

## 📋 Endpoints Disponibles

### **VENTA DE ENTRADAS** 🔐 Vendedor/Admin

## 1. **Vender Entrada**
```bash
POST /api/tickets/sell
Authorization: Bearer TOKEN
```

**Body (JSON):**
```json
{
  "eventId": "uuid-del-evento",
  "buyerName": "Juan Pérez",
  "buyerEmail": "juan@example.com",
  "buyerPhone": "+1234567890",
  "buyerDocument": "12345678",
  "paymentMethod": "card",
  "paymentReference": "TXN-123456789",
  "quantity": 2,
  "notes": "Cliente VIP"
}
```

**Respuesta Exitosa:**
```json
{
  "message": "2 entrada(s) vendida(s) exitosamente",
  "tickets": [
    {
      "id": "uuid-ticket-1",
      "ticketNumber": "E000001",
      "qrCode": "QR-EVT1-TK01-1634567890-ABC123",
      "price": 35.00,
      "buyerName": "Juan Pérez"
    },
    {
      "id": "uuid-ticket-2", 
      "ticketNumber": "E000002",
      "qrCode": "QR-EVT1-TK02-1634567891-DEF456",
      "price": 35.00,
      "buyerName": "Juan Pérez"
    }
  ],
  "summary": {
    "quantity": 2,
    "unitPrice": 35.00,
    "totalPrice": 70.00,
    "eventName": "Festival de Música 2024",
    "eventDate": "2024-06-15T18:00:00Z",
    "sellerName": "María Vendedora"
  }
}
```

### **CONSULTA DE ENTRADAS** 🔐 Vendedor/Admin

## 2. **Listar Entradas**
```bash
GET /api/tickets?page=1&limit=20&eventId=uuid&status=active
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `page` (opcional): Página (default: 1)
- `limit` (opcional): Elementos por página (default: 20, max: 100)
- `eventId` (opcional): Filtrar por evento
- `status` (opcional): active, used, cancelled, refunded
- `startDate` (opcional): Desde fecha de venta
- `endDate` (opcional): Hasta fecha de venta
- `search` (opcional): Buscar en nombre, email, ticket number, QR code

## 3. **Obtener Entrada Específica**
```bash
GET /api/tickets/:id
Authorization: Bearer TOKEN
```

### **GENERACIÓN DE QR** 🔐 Vendedor/Admin

## 4. **Generar QR para Imprimir** 
```bash
GET /api/tickets/:id/qr
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `format` (opcional): png, svg (default: png)

**Respuesta:** Imagen del código QR

## 5. **Generar QR en Formato Específico**
```bash
GET /api/tickets/:id/qr/svg
GET /api/tickets/:id/qr/png  
Authorization: Bearer TOKEN
```

### **GESTIÓN DE ENTRADAS** 🔐 Vendedor/Admin

## 6. **Cancelar Entrada**
```bash
PATCH /api/tickets/:id/cancel
Authorization: Bearer TOKEN
```

**Body (JSON):**
```json
{
  "reason": "Cliente solicitó cancelación por cambio de planes"
}
```

### **ESTADÍSTICAS** 🔐 Vendedor/Admin

## 7. **Estadísticas de Ventas**
```bash
GET /api/tickets/stats/sales?startDate=2024-01-01&endDate=2024-12-31&eventId=uuid
Authorization: Bearer TOKEN
```

**Respuesta:**
```json
{
  "message": "Estadísticas obtenidas exitosamente",
  "stats": {
    "totalTickets": 150,
    "activeTickets": 120,
    "usedTickets": 25,
    "cancelledTickets": 5,
    "totalRevenue": 4500.00,
    "averagePrice": 30.00
  },
  "dailySales": [
    {
      "date": "2024-03-01",
      "count": 10,
      "revenue": 350.00
    }
  ]
}
```

---

## 🧪 Flujo Completo de Prueba

### **Paso 1: Login como Vendedor**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "vendedor@sisqr6.com",
    "password": "vendedor123"
  }'
```

### **Paso 2: Crear y Activar un Evento** (como Admin)
```bash
# Login como admin primero
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "login": "admin@sisqr6.com",
    "password": "admin123"
  }'

# Crear evento
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "name": "Concierto Rock 2024",
    "description": "Gran concierto de rock",
    "location": "Estadio Central",
    "startDate": "2024-12-25T20:00:00Z",
    "endDate": "2024-12-25T23:00:00Z",
    "maxCapacity": 100,
    "basePrice": 50.00,
    "priceRanges": [
      {
        "startTime": "18:00",
        "endTime": "21:00",
        "price": 45.00
      }
    ]
  }'

# Activar evento (guarda el ID del evento de la respuesta anterior)
curl -X PATCH http://localhost:3000/api/events/ID_DEL_EVENTO/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"status": "active"}'
```

### **Paso 3: Vender Entrada**
```bash
curl -X POST http://localhost:3000/api/tickets/sell \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VENDEDOR_TOKEN" \
  -d '{
    "eventId": "ID_DEL_EVENTO",
    "buyerName": "Carlos Cliente",
    "buyerEmail": "carlos@example.com",
    "buyerPhone": "+56987654321", 
    "buyerDocument": "12345678-9",
    "paymentMethod": "card",
    "paymentReference": "VISA-****1234",
    "quantity": 1,
    "notes": "Entrada general"
  }'
```

### **Paso 4: Verificar Venta**
```bash
# Listar entradas vendidas
curl http://localhost:3000/api/tickets \
  -H "Authorization: Bearer VENDEDOR_TOKEN"

# Ver entrada específica (usar ID de la respuesta anterior)
curl http://localhost:3000/api/tickets/ID_DEL_TICKET \
  -H "Authorization: Bearer VENDEDOR_TOKEN"
```

### **Paso 5: Generar QR para Imprimir**
```bash
# Generar QR en PNG
curl http://localhost:3000/api/tickets/ID_DEL_TICKET/qr \
  -H "Authorization: Bearer VENDEDOR_TOKEN" \
  --output ticket_qr.png

# Generar QR en SVG  
curl http://localhost:3000/api/tickets/ID_DEL_TICKET/qr/svg \
  -H "Authorization: Bearer VENDEDOR_TOKEN" \
  --output ticket_qr.svg
```

### **Paso 6: Ver Estadísticas**
```bash
curl http://localhost:3000/api/tickets/stats/sales \
  -H "Authorization: Bearer VENDEDOR_TOKEN"
```

---

## 🔒 Permisos por Rol

| Acción | Vendedor | Control | Admin |
|--------|----------|---------|-------|
| Vender entradas | ✅ | ❌ | ✅ |
| Ver sus entradas | ✅ | ✅* | ✅ |
| Ver todas las entradas | ❌ | ❌ | ✅ |
| Generar QR | ✅ | ❌ | ✅ |
| Cancelar entradas | ✅** | ❌ | ✅ |
| Ver estadísticas | ✅*** | ❌ | ✅ |
| Cancelación forzada | ❌ | ❌ | ✅ |

*Control puede ver entradas solo para validación
**Vendedor solo puede cancelar las que él vendió
***Vendedor solo ve sus propias estadísticas

---

## ⚡ Características del Sistema QR

### **Códigos QR Únicos**
- Formato: `QR-EVT1-TK01-1634567890-ABC123`
- Incluye: ID evento, ticket, timestamp, código aleatorio
- **Checksum** para verificar autenticidad
- **Múltiples formatos**: PNG, SVG, DataURL

### **Datos del QR (JSON completo)**
```json
{
  "id": "uuid-ticket",
  "qr": "QR-EVT1-TK01-1634567890-ABC123",
  "tn": "E000001",
  "eventId": "uuid-evento",
  "eventName": "Concierto Rock 2024",
  "eventDate": "2024-12-25T20:00:00Z",
  "buyer": "Carlos Cliente",
  "status": "active",
  "price": 45.00,
  "saleDate": "2024-03-01T10:30:00Z",
  "checksum": "a1b2c3d4e5f6",
  "generated": "2024-03-01T14:30:00Z",
  "v": "1.0"
}
```

### **Validaciones Automáticas**
- ✅ Verificación de disponibilidad en tiempo real
- ✅ Cálculo automático de precios según horario
- ✅ Control de capacidad del evento  
- ✅ Validación de estado del evento
- ✅ Checksum de seguridad en QR

---

## ⚠️ Restricciones Importantes

### **Venta de Entradas:**
- Máximo 10 entradas por transacción
- Solo eventos activos y con capacidad disponible
- Precios calculados en tiempo real según horario
- Vendedores solo pueden vender, no validar

### **Cancelación:**
- Solo entradas no utilizadas
- Solo si el evento permite reembolsos
- Vendedor solo puede cancelar las que vendió
- Admin puede hacer cancelaciones forzadas

### **Generación QR:**
- Solo quien vendió la entrada puede generar QR
- Admin puede generar cualquier QR
- Múltiples tamaños y formatos disponibles

---

## 🚀 Próximo Paso

Una vez que verifiques que la venta de entradas funciona correctamente:

**→ API de Validación QR** (escaneo y validación en tiempo real)