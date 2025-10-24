# Sistema de Rangos de Precios - Ejemplos y Documentación

## Descripción General

El sistema de rangos de precios permite a los administradores configurar diferentes precios para las entradas según la hora de compra. Esto es útil para eventos con precios diferenciales por horarios (happy hour, precios nocturnos, etc.).

## Estructura de un Rango de Precio

```json
{
  "name": "Nombre descriptivo (opcional)",
  "startTime": "HH:MM",
  "endTime": "HH:MM", 
  "price": 50.00,
  "description": "Descripción opcional"
}
```

## Ejemplos de Configuración

### 1. Rangos Consecutivos (Restaurante/Bar)

```json
{
  "basePrice": 30,
  "priceRanges": [
    {
      "name": "Tarde",
      "startTime": "18:00",
      "endTime": "19:00",
      "price": 40
    },
    {
      "name": "Prime Time",
      "startTime": "19:01",
      "endTime": "20:00", 
      "price": 50
    },
    {
      "name": "Noche",
      "startTime": "20:01",
      "endTime": "22:00",
      "price": 45
    }
  ]
}
```

### 2. Rangos Nocturnos (Club/Discoteca)

```json
{
  "basePrice": 100,
  "priceRanges": [
    {
      "name": "Early Bird",
      "startTime": "20:00",
      "endTime": "22:00",
      "price": 80
    },
    {
      "name": "Peak Hours",
      "startTime": "22:01",
      "endTime": "02:00",
      "price": 120
    },
    {
      "name": "After Hours",
      "startTime": "02:01",
      "endTime": "06:00",
      "price": 60
    }
  ]
}
```

### 3. Conferencia/Seminario (Horarios Laborales)

```json
{
  "basePrice": 200,
  "priceRanges": [
    {
      "name": "Registro Temprano",
      "startTime": "07:00",
      "endTime": "09:00",
      "price": 150
    },
    {
      "name": "Horario Normal",
      "startTime": "09:01",
      "endTime": "17:00",
      "price": 200
    },
    {
      "name": "Registro Tardío",
      "startTime": "17:01",
      "endTime": "19:00",
      "price": 250
    }
  ]
}
```

## Endpoints de la API

### Obtener Ejemplos de Rangos

```http
GET /api/events/price-examples/{type}
```

Tipos disponibles:
- `general`: Rangos básicos
- `restaurant`: Para restaurantes/bares
- `nightclub`: Para clubes nocturnos
- `conference`: Para conferencias/seminarios
- `hourly`: Rangos por horas

**Ejemplo de respuesta:**

```json
{
  "message": "Ejemplos de rangos obtenidos",
  "type": "restaurant",
  "availableTypes": ["general", "restaurant", "nightclub", "conference", "hourly"],
  "ranges": [
    {
      "name": "Happy Hour",
      "startTime": "17:00",
      "endTime": "19:00",
      "price": 25
    },
    {
      "name": "Dinner Time",
      "startTime": "19:01",
      "endTime": "22:00",
      "price": 35
    }
  ],
  "instructions": {
    "format": "Cada rango debe tener startTime, endTime, price y opcionalmente name",
    "consecutiveRanges": "Puedes crear rangos consecutivos como 18:00-19:00, 19:01-20:00, etc.",
    "nightRanges": "Para horarios nocturnos usa rangos como 22:00-06:00 (cruzan medianoche)",
    "validation": "Los rangos se validan automáticamente para evitar solapamientos"
  }
}
```

### Validar Rangos Antes de Crear Evento

```http
POST /api/events/validate-ranges
Content-Type: application/json

{
  "basePrice": 40,
  "priceRanges": [
    {
      "name": "Tarde",
      "startTime": "18:00", 
      "endTime": "19:00",
      "price": 40
    },
    {
      "name": "Noche",
      "startTime": "19:01",
      "endTime": "20:00",
      "price": 50
    }
  ]
}
```

**Ejemplo de respuesta exitosa:**

```json
{
  "message": "Rangos válidos",
  "isValid": true,
  "originalRanges": [...],
  "validatedRanges": [...],
  "optimizedRanges": [...],
  "suggestions": {
    "canOptimize": false,
    "basePrice": 40,
    "totalRanges": 2
  }
}
```

**Ejemplo de respuesta con errores:**

```json
{
  "message": "Rangos inválidos", 
  "isValid": false,
  "errors": [
    "Rango 1 y 2 se solapan: 18:00-20:00 vs 19:00-21:00",
    "Precio debe ser un número positivo"
  ],
  "receivedRanges": [...]
}
```

## Reglas de Validación

1. **No Solapamiento**: Los rangos no pueden solaparse en tiempo
2. **Formato de Hora**: Debe ser formato HH:MM (24 horas)
3. **Precio Positivo**: Los precios deben ser números positivos
4. **Orden Lógico**: startTime debe ser menor que endTime (excepto rangos nocturnos)
5. **Rangos Nocturnos**: Soportados automáticamente (ej: 22:00-06:00)

## Casos de Uso Comunes

### Restaurante con Happy Hour
- **17:00-19:00**: Precio reducido (happy hour)
- **19:01-22:00**: Precio normal (dinner time)
- **Resto del día**: Precio base

### Club Nocturno
- **20:00-22:00**: Early bird discount  
- **22:01-02:00**: Peak hours premium
- **02:01-06:00**: After hours discount
- **Resto del día**: Precio base

### Evento Corporativo
- **07:00-09:00**: Registro temprano (descuento)
- **09:01-17:00**: Registro normal
- **17:01-19:00**: Registro tardío (recargo)
- **Resto del tiempo**: No disponible (precio base alto)

## Optimización Automática

El sistema optimiza automáticamente los rangos:
- Combina rangos consecutivos con el mismo precio
- Elimina rangos redundantes
- Reorganiza para mejor eficiencia

## Notas Técnicas

- Los rangos se evalúan en el momento de la compra
- Si no hay rango específico, se usa el precio base
- Los rangos pueden cruzar medianoche (ej: 23:00-03:00)
- La validación se hace tanto en frontend como backend