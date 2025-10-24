/**
 * Utilidades para validación avanzada de rangos de precios
 */

// Convertir tiempo HH:MM a minutos
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Validar solapamiento real entre rangos (excluyendo rangos consecutivos)
const hasRealTimeOverlap = (start1, end1, start2, end2) => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  // Determinar si los rangos cruzan medianoche
  const range1CrossesMidnight = start1Min > end1Min;
  const range2CrossesMidnight = start2Min > end2Min;
  
  if (range1CrossesMidnight && range2CrossesMidnight) {
    // Ambos cruzan medianoche - siempre se solapan
    return true;
  }
  
  if (range1CrossesMidnight && !range2CrossesMidnight) {
    // Rango 1 nocturno, rango 2 normal
    // Se solapan si el rango 2 intersecta con la parte nocturna del rango 1
    return (start2Min >= start1Min || end2Min <= end1Min);
  }
  
  if (!range1CrossesMidnight && range2CrossesMidnight) {
    // Rango 1 normal, rango 2 nocturno
    return (start1Min >= start2Min || end1Min <= end2Min);
  }
  
  // Ambos son rangos normales
  // Permitir rangos consecutivos exactos (18:00-19:00 y 19:01-20:00)
  if (end1Min + 1 === start2Min || end2Min + 1 === start1Min) {
    return false; // Rangos consecutivos válidos
  }
  
  // Verificar solapamiento real
  return start1Min < end2Min && start2Min < end1Min;
};

// Validar conjunto completo de rangos
const validatePriceRanges = (ranges) => {
  const errors = [];
  
  if (!Array.isArray(ranges)) {
    return { isValid: false, errors: ['Los rangos de precio deben ser un array'] };
  }
  
  if (ranges.length === 0) {
    return { isValid: true, errors: [] };
  }
  
  // Validar cada rango individualmente
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const rangeNum = i + 1;
    
    // Validar campos requeridos
    if (!range.startTime || !range.endTime || range.price === undefined) {
      errors.push(`Rango ${rangeNum}: Debe incluir startTime, endTime y price`);
      continue;
    }
    
    // Validar formato de hora
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(range.startTime)) {
      errors.push(`Rango ${rangeNum}: startTime debe estar en formato HH:MM (${range.startTime})`);
    }
    
    if (!timeRegex.test(range.endTime)) {
      errors.push(`Rango ${rangeNum}: endTime debe estar en formato HH:MM (${range.endTime})`);
    }
    
    // Validar precio
    if (range.price < 0) {
      errors.push(`Rango ${rangeNum}: El precio no puede ser negativo`);
    }
    
    // Validar que no sean iguales
    if (range.startTime === range.endTime) {
      errors.push(`Rango ${rangeNum}: La hora de inicio no puede ser igual a la hora de fin`);
    }
    
    // Agregar nombre descriptivo si no existe
    if (!range.name) {
      const isNightRange = timeToMinutes(range.startTime) > timeToMinutes(range.endTime);
      range.name = isNightRange 
        ? `Horario Nocturno ${range.startTime}-${range.endTime}`
        : `Horario ${range.startTime}-${range.endTime}`;
    }
  }
  
  // Validar solapamientos entre rangos
  for (let i = 0; i < ranges.length - 1; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const range1 = ranges[i];
      const range2 = ranges[j];
      
      if (hasRealTimeOverlap(range1.startTime, range1.endTime, range2.startTime, range2.endTime)) {
        errors.push(
          `Rangos ${i + 1} y ${j + 1}: Se solapan en horarios (${range1.startTime}-${range1.endTime} con ${range2.startTime}-${range2.endTime})`
        );
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    validatedRanges: ranges
  };
};

// Generar rangos de ejemplo para diferentes tipos de eventos
const generateExampleRanges = (eventType = 'general') => {
  const examples = {
    general: [
      { startTime: '08:00', endTime: '12:00', price: 25, name: 'Matutino' },
      { startTime: '12:01', endTime: '18:00', price: 35, name: 'Vespertino' },
      { startTime: '18:01', endTime: '23:00', price: 45, name: 'Nocturno' }
    ],
    
    restaurant: [
      { startTime: '12:00', endTime: '15:00', price: 30, name: 'Almuerzo' },
      { startTime: '15:01', endTime: '18:00', price: 25, name: 'Tarde' },
      { startTime: '18:01', endTime: '22:00', price: 40, name: 'Cena' },
      { startTime: '22:01', endTime: '01:00', price: 35, name: 'Noche' }
    ],
    
    nightclub: [
      { startTime: '20:00', endTime: '23:00', price: 40, name: 'Early Night' },
      { startTime: '23:01', endTime: '02:00', price: 60, name: 'Prime Time' },
      { startTime: '02:01', endTime: '06:00', price: 30, name: 'After Hours' }
    ],
    
    conference: [
      { startTime: '07:00', endTime: '09:00', price: 80, name: 'Early Registration' },
      { startTime: '09:01', endTime: '17:00', price: 120, name: 'Full Day' },
      { startTime: '17:01', endTime: '20:00', price: 60, name: 'Evening Session' }
    ],
    
    hourly: [
      { startTime: '18:00', endTime: '19:00', price: 40, name: 'Hora 1' },
      { startTime: '19:01', endTime: '20:00', price: 50, name: 'Hora 2' },
      { startTime: '20:01', endTime: '21:00', price: 60, name: 'Hora 3' },
      { startTime: '21:01', endTime: '22:00', price: 55, name: 'Hora 4' },
      { startTime: '22:01', endTime: '23:00', price: 45, name: 'Hora 5' }
    ]
  };
  
  return examples[eventType] || examples.general;
};

// Optimizar rangos (combinar rangos consecutivos con el mismo precio)
const optimizePriceRanges = (ranges) => {
  if (!ranges || ranges.length <= 1) return ranges;
  
  // Ordenar rangos por hora de inicio
  const sortedRanges = [...ranges].sort((a, b) => {
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
  
  const optimized = [sortedRanges[0]];
  
  for (let i = 1; i < sortedRanges.length; i++) {
    const current = sortedRanges[i];
    const previous = optimized[optimized.length - 1];
    
    // Si tienen el mismo precio y son consecutivos, combinar
    if (current.price === previous.price && 
        timeToMinutes(previous.endTime) + 1 === timeToMinutes(current.startTime)) {
      previous.endTime = current.endTime;
      previous.name = `${previous.name} + ${current.name}`;
    } else {
      optimized.push(current);
    }
  }
  
  return optimized;
};

module.exports = {
  timeToMinutes,
  hasRealTimeOverlap,
  validatePriceRanges,
  generateExampleRanges,
  optimizePriceRanges
};