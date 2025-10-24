const { Op } = require('sequelize');

/**
 * Utilidades para el sistema de precios dinámicos
 */

// Validar rangos de precios
const validatePriceRanges = (priceRanges) => {
  if (!Array.isArray(priceRanges) || priceRanges.length === 0) {
    return { isValid: true, errors: [] };
  }
  
  const errors = [];
  
  // Validar formato de cada rango
  for (let i = 0; i < priceRanges.length; i++) {
    const range = priceRanges[i];
    
    if (!range.startTime || !range.endTime || range.price === undefined) {
      errors.push(`Rango ${i + 1}: Debe incluir startTime, endTime y price`);
      continue;
    }
    
    // Validar formato de hora
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(range.startTime)) {
      errors.push(`Rango ${i + 1}: startTime debe estar en formato HH:MM`);
    }
    
    if (!timeRegex.test(range.endTime)) {
      errors.push(`Rango ${i + 1}: endTime debe estar en formato HH:MM`);
    }
    
    if (range.price < 0) {
      errors.push(`Rango ${i + 1}: El precio no puede ser negativo`);
    }
    
    // Validar que startTime < endTime
    if (range.startTime >= range.endTime) {
      errors.push(`Rango ${i + 1}: La hora de inicio debe ser anterior a la hora de fin`);
    }
  }
  
  // Validar solapamientos
  for (let i = 0; i < priceRanges.length - 1; i++) {
    for (let j = i + 1; j < priceRanges.length; j++) {
      const range1 = priceRanges[i];
      const range2 = priceRanges[j];
      
      // Verificar solapamiento
      if (timeOverlap(range1.startTime, range1.endTime, range2.startTime, range2.endTime)) {
        errors.push(`Rangos ${i + 1} y ${j + 1}: Se solapan en horarios`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Verificar si dos rangos de tiempo se solapan (considerando rangos nocturnos)
const timeOverlap = (start1, end1, start2, end2) => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  // Rango 1 cruza medianoche
  const range1CrossesMidnight = start1Min > end1Min;
  // Rango 2 cruza medianoche
  const range2CrossesMidnight = start2Min > end2Min;
  
  if (range1CrossesMidnight && range2CrossesMidnight) {
    // Ambos cruzan medianoche - siempre se solapan
    return true;
  }
  
  if (range1CrossesMidnight && !range2CrossesMidnight) {
    // Rango 1 nocturno, rango 2 normal
    return (start2Min >= start1Min || end2Min <= end1Min);
  }
  
  if (!range1CrossesMidnight && range2CrossesMidnight) {
    // Rango 1 normal, rango 2 nocturno  
    return (start1Min >= start2Min || end1Min <= end2Min);
  }
  
  // Ambos son rangos normales (no cruzan medianoche)
  return start1Min < end2Min && start2Min < end1Min;
};

// Convertir string de hora a minutos para comparaciones
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Obtener precio para un momento específico
const getPriceAtDateTime = (event, dateTime = new Date()) => {
  // Si no hay rangos de precios, usar precio base
  if (!event.priceRanges || event.priceRanges.length === 0) {
    return {
      price: event.basePrice,
      source: 'base',
      appliedRange: null,
      timeInfo: {
        currentTime: dateTime.toTimeString().slice(0, 5),
        message: 'Sin rangos configurados, usando precio base'
      }
    };
  }
  
  const timeString = dateTime.toTimeString().slice(0, 5); // HH:MM
  const currentMinutes = timeToMinutes(timeString);
  
  console.log(`🕒 Calculando precio para: ${timeString} (${currentMinutes} minutos)`);
  
  // Buscar rango que aplique
  for (const range of event.priceRanges) {
    const startMinutes = timeToMinutes(range.startTime);
    const endMinutes = timeToMinutes(range.endTime);
    
    console.log(`📊 Evaluando rango: ${range.startTime}-${range.endTime} (${startMinutes}-${endMinutes} min) = $${range.price}`);
    
    // Si el rango cruza medianoche (ej: 21:00-10:00)
    if (startMinutes > endMinutes) {
      console.log(`🌙 Rango nocturno detectado: ${range.startTime}-${range.endTime}`);
      
      // Verificar si está en la ventana nocturna
      if (currentMinutes >= startMinutes || currentMinutes <= endMinutes) {
        const timeZone = currentMinutes >= startMinutes ? 'noche' : 'madrugada';
        console.log(`✅ COINCIDE - Horario ${timeZone}: $${range.price}`);
        
        return {
          price: range.price,
          source: 'range',
          appliedRange: {
            ...range,
            crossesMidnight: true,
            timeZone
          },
          timeInfo: {
            currentTime: timeString,
            rangeType: 'nocturno',
            message: `Precio nocturno aplicado (${range.startTime}-${range.endTime})`
          }
        };
      } else {
        console.log(`❌ Fuera del rango nocturno`);
      }
    } else {
      // Rango normal (no cruza medianoche)
      console.log(`☀️ Rango diurno: ${range.startTime}-${range.endTime}`);
      
      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        console.log(`✅ COINCIDE - Horario diurno: $${range.price}`);
        
        return {
          price: range.price,
          source: 'range',
          appliedRange: {
            ...range,
            crossesMidnight: false
          },
          timeInfo: {
            currentTime: timeString,
            rangeType: 'diurno',
            message: `Precio diurno aplicado (${range.startTime}-${range.endTime})`
          }
        };
      } else {
        console.log(`❌ Fuera del rango diurno`);
      }
    }
  }
  
  // Si no se encontró rango, usar precio base
  console.log(`💰 Usando precio base: $${event.basePrice}`);
  
  return {
    price: event.basePrice,
    source: 'base',
    appliedRange: null,
    timeInfo: {
      currentTime: timeString,
      rangeType: 'base',
      message: 'Ningún rango aplicable, usando precio base'
    }
  };
};

// Calcular precios promedio por día
const calculateDailyAveragePrice = (event) => {
  if (!event.priceRanges || event.priceRanges.length === 0) {
    return event.basePrice;
  }
  
  let totalMinutes = 0;
  let weightedSum = 0;
  
  // Para cada rango, calcular su duración y peso
  event.priceRanges.forEach(range => {
    const startMinutes = timeToMinutes(range.startTime);
    const endMinutes = timeToMinutes(range.endTime);
    
    let duration;
    if (startMinutes > endMinutes) {
      // Rango que cruza medianoche
      duration = (1440 - startMinutes) + endMinutes; // 1440 = 24 * 60
    } else {
      duration = endMinutes - startMinutes;
    }
    
    totalMinutes += duration;
    weightedSum += range.price * duration;
  });
  
  // Calcular el tiempo no cubierto por rangos (usa precio base)
  const uncoveredMinutes = 1440 - totalMinutes;
  if (uncoveredMinutes > 0) {
    weightedSum += event.basePrice * uncoveredMinutes;
    totalMinutes += uncoveredMinutes;
  }
  
  return totalMinutes > 0 ? weightedSum / totalMinutes : event.basePrice;
};

// Generar horarios recomendados para rangos de precios
const generateRecommendedPriceRanges = (eventType = 'general') => {
  const templates = {
    general: [
      { startTime: '09:00', endTime: '12:00', name: 'Mañana' },
      { startTime: '12:00', endTime: '18:00', name: 'Tarde' },
      { startTime: '18:00', endTime: '23:00', name: 'Noche' }
    ],
    conference: [
      { startTime: '08:00', endTime: '10:00', name: 'Early Bird' },
      { startTime: '10:00', endTime: '17:00', name: 'Horario Principal' },
      { startTime: '17:00', endTime: '20:00', name: 'Networking' }
    ],
    nightlife: [
      { startTime: '20:00', endTime: '23:00', name: 'Primera Tanda' },
      { startTime: '23:00', endTime: '02:00', name: 'Prime Time' },
      { startTime: '02:00', endTime: '05:00', name: 'After Hours' }
    ],
    restaurant: [
      { startTime: '12:00', endTime: '15:00', name: 'Almuerzo' },
      { startTime: '19:00', endTime: '22:00', name: 'Cena' },
      { startTime: '22:00', endTime: '01:00', name: 'Tarde/Noche' }
    ]
  };
  
  return templates[eventType] || templates.general;
};

// Calcular ingresos estimados basado en precios y capacidad
const calculateEstimatedRevenue = (event, occupancyRate = 0.8) => {
  const averagePrice = calculateDailyAveragePrice(event);
  const estimatedSales = Math.floor(event.maxCapacity * occupancyRate);
  
  return {
    averagePrice,
    estimatedSales,
    totalRevenue: averagePrice * estimatedSales,
    occupancyRate
  };
};

// Validar que el evento puede vender entradas
const canSellTickets = (event, currentDateTime = new Date()) => {
  // Verificar estado del evento
  if (event.status !== 'active') {
    return {
      canSell: false,
      reason: `Evento ${event.status}`,
      code: 'EVENT_STATUS'
    };
  }
  
  // Verificar capacidad
  if (event.currentSold >= event.maxCapacity) {
    return {
      canSell: false,
      reason: 'Evento agotado',
      code: 'SOLD_OUT'
    };
  }
  
  // Verificar fechas de venta
  if (event.saleStartDate && currentDateTime < event.saleStartDate) {
    return {
      canSell: false,
      reason: 'Las ventas aún no han comenzado',
      code: 'SALE_NOT_STARTED'
    };
  }
  
  if (event.saleEndDate && currentDateTime > event.saleEndDate) {
    return {
      canSell: false,
      reason: 'Las ventas han terminado',
      code: 'SALE_ENDED'
    };
  }
  
  // Verificar que no haya comenzado el evento
  if (currentDateTime > event.startDate) {
    return {
      canSell: false,
      reason: 'El evento ya ha comenzado',
      code: 'EVENT_STARTED'
    };
  }
  
  return {
    canSell: true,
    reason: 'Puede vender',
    availableTickets: event.maxCapacity - event.currentSold
  };
};

module.exports = {
  validatePriceRanges,
  timeOverlap,
  timeToMinutes,
  getPriceAtDateTime,
  calculateDailyAveragePrice,
  generateRecommendedPriceRanges,
  calculateEstimatedRevenue,
  canSellTickets
};