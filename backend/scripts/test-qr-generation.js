/**
 * Script de prueba para generación masiva de QR codes
 * Prueba la capacidad del sistema para generar 30,000 QR codes
 */

const { generateUniqueQRCode, generateQRImage, createQRData } = require('../src/utils/qrUtils');

// Colores para consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m'
};

// Función para formatear números
const formatNumber = (num) => num.toLocaleString('es-BO');

// Función para formatear tiempo
const formatTime = (ms) => {
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}min`;
};

// Prueba 1: Generar códigos QR únicos (solo códigos, sin imágenes)
async function testQRCodeGeneration(count) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}PRUEBA 1: Generación de ${formatNumber(count)} códigos QR únicos${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const qrCodes = new Set();
  const startTime = Date.now();
  let duplicates = 0;

  console.log(`⏳ Generando códigos...`);

  for (let i = 0; i < count; i++) {
    const qrCode = generateUniqueQRCode();
    
    if (qrCodes.has(qrCode)) {
      duplicates++;
      console.log(`${colors.red}⚠️  Duplicado encontrado: ${qrCode}${colors.reset}`);
    }
    
    qrCodes.add(qrCode);

    // Mostrar progreso cada 5000
    if ((i + 1) % 5000 === 0) {
      const elapsed = Date.now() - startTime;
      const rate = (i + 1) / (elapsed / 1000);
      console.log(`   ✓ ${formatNumber(i + 1)} códigos generados (${rate.toFixed(0)} códigos/seg)`);
    }
  }

  const totalTime = Date.now() - startTime;
  const rate = count / (totalTime / 1000);

  console.log(`\n${colors.green}✅ RESULTADO:${colors.reset}`);
  console.log(`   Total generados: ${colors.green}${formatNumber(qrCodes.size)}${colors.reset}`);
  console.log(`   Duplicados: ${duplicates > 0 ? colors.red : colors.green}${duplicates}${colors.reset}`);
  console.log(`   Tiempo total: ${colors.yellow}${formatTime(totalTime)}${colors.reset}`);
  console.log(`   Velocidad: ${colors.yellow}${rate.toFixed(0)} códigos/seg${colors.reset}`);
  console.log(`   Tiempo promedio: ${colors.yellow}${(totalTime / count).toFixed(4)}ms por código${colors.reset}`);

  return { qrCodes: Array.from(qrCodes), totalTime, rate, duplicates };
}

// Prueba 2: Generar imágenes QR (más intensivo)
async function testQRImageGeneration(count, sampleQRCodes) {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}PRUEBA 2: Generación de ${formatNumber(count)} imágenes QR${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;

  console.log(`⏳ Generando imágenes QR...`);

  for (let i = 0; i < count; i++) {
    try {
      const qrCode = sampleQRCodes[i % sampleQRCodes.length];
      
      // Crear datos simulados del ticket
      const mockTicket = {
        id: `ticket-${i}`,
        qrCode: qrCode,
        ticketNumber: `TN-${i.toString().padStart(6, '0')}`,
        eventId: 'event-test',
        buyerName: `Comprador ${i}`,
        status: 'active',
        salePrice: 100,
        saleDate: new Date()
      };

      const mockEvent = {
        name: 'Evento de Prueba',
        startDate: new Date('2025-12-01')
      };

      const qrData = createQRData(mockTicket, mockEvent);
      
      // Generar imagen QR (buffer)
      await generateQRImage(qrData, {
        width: 200,
        type: 'buffer',
        errorCorrectionLevel: 'M'
      });

      successCount++;

      // Mostrar progreso cada 1000
      if ((i + 1) % 1000 === 0) {
        const elapsed = Date.now() - startTime;
        const rate = (i + 1) / (elapsed / 1000);
        console.log(`   ✓ ${formatNumber(i + 1)} imágenes generadas (${rate.toFixed(0)} img/seg)`);
      }

    } catch (error) {
      errorCount++;
      if (errorCount <= 5) {
        console.log(`${colors.red}❌ Error generando imagen ${i}: ${error.message}${colors.reset}`);
      }
    }
  }

  const totalTime = Date.now() - startTime;
  const rate = count / (totalTime / 1000);

  console.log(`\n${colors.green}✅ RESULTADO:${colors.reset}`);
  console.log(`   Exitosas: ${colors.green}${formatNumber(successCount)}${colors.reset}`);
  console.log(`   Errores: ${errorCount > 0 ? colors.red : colors.green}${errorCount}${colors.reset}`);
  console.log(`   Tiempo total: ${colors.yellow}${formatTime(totalTime)}${colors.reset}`);
  console.log(`   Velocidad: ${colors.yellow}${rate.toFixed(0)} imágenes/seg${colors.reset}`);
  console.log(`   Tiempo promedio: ${colors.yellow}${(totalTime / count).toFixed(2)}ms por imagen${colors.reset}`);

  return { successCount, errorCount, totalTime, rate };
}

// Prueba 3: Uso de memoria
function testMemoryUsage() {
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.blue}PRUEBA 3: Uso de memoria${colors.reset}`);
  console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const memUsage = process.memoryUsage();
  
  console.log(`   Heap usado: ${colors.yellow}${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB${colors.reset}`);
  console.log(`   Heap total: ${colors.yellow}${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB${colors.reset}`);
  console.log(`   RSS: ${colors.yellow}${(memUsage.rss / 1024 / 1024).toFixed(2)} MB${colors.reset}`);
  console.log(`   External: ${colors.yellow}${(memUsage.external / 1024 / 1024).toFixed(2)} MB${colors.reset}`);

  return memUsage;
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log(`\n${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.green}║  PRUEBA DE GENERACIÓN MASIVA DE QR CODES - SISQR6        ║${colors.reset}`);
  console.log(`${colors.green}║  Objetivo: Verificar capacidad de generar 30,000 QRs     ║${colors.reset}`);
  console.log(`${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}`);

  const startMemory = testMemoryUsage();

  try {
    // Prueba 1: Generar 30,000 códigos únicos
    const result1 = await testQRCodeGeneration(30000);

    if (result1.duplicates > 0) {
      console.log(`\n${colors.red}⚠️  ADVERTENCIA: Se encontraron ${result1.duplicates} códigos duplicados${colors.reset}`);
    }

    // Prueba 2: Generar 5,000 imágenes QR (subset para no saturar memoria)
    // Usar una muestra de los códigos generados
    const sampleSize = Math.min(5000, result1.qrCodes.length);
    const sampleCodes = result1.qrCodes.slice(0, sampleSize);
    const result2 = await testQRImageGeneration(5000, sampleCodes);

    // Memoria final
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.blue}MEMORIA DESPUÉS DE LAS PRUEBAS${colors.reset}`);
    console.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    const endMemory = testMemoryUsage();

    const memoryIncrease = (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024;
    console.log(`\n   Incremento de heap: ${colors.yellow}${memoryIncrease.toFixed(2)} MB${colors.reset}`);

    // Resumen final
    console.log(`\n${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║  RESUMEN FINAL                                            ║${colors.reset}`);
    console.log(`${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.green}✅ CÓDIGOS QR:${colors.reset}`);
    console.log(`   • ${formatNumber(30000)} códigos únicos generados`);
    console.log(`   • ${result1.duplicates === 0 ? '✓' : '✗'} Sin duplicados`);
    console.log(`   • ${result1.rate.toFixed(0)} códigos/segundo`);

    console.log(`\n${colors.green}✅ IMÁGENES QR:${colors.reset}`);
    console.log(`   • ${formatNumber(result2.successCount)} imágenes generadas exitosamente`);
    console.log(`   • ${result2.rate.toFixed(0)} imágenes/segundo`);
    console.log(`   • Tiempo estimado para 30,000: ${formatTime((30000 / result2.rate) * 1000)}`);

    console.log(`\n${colors.green}✅ RENDIMIENTO:${colors.reset}`);
    console.log(`   • Memoria utilizada: ${memoryIncrease.toFixed(2)} MB`);
    console.log(`   • Sistema ${result1.duplicates === 0 && result2.errorCount === 0 ? colors.green + 'ESTABLE' : colors.yellow + 'REQUIERE ATENCIÓN'}${colors.reset}`);

    // Conclusión
    const isSuccess = result1.duplicates === 0 && result2.errorCount === 0;
    
    if (isSuccess) {
      console.log(`\n${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
      console.log(`${colors.green}║  ✅ SISTEMA LISTO PARA GENERAR 30,000 QR CODES           ║${colors.reset}`);
      console.log(`${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    } else {
      console.log(`\n${colors.yellow}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
      console.log(`${colors.yellow}║  ⚠️  REVISAR SISTEMA ANTES DE PRODUCCIÓN                  ║${colors.reset}`);
      console.log(`${colors.yellow}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
    }

  } catch (error) {
    console.error(`\n${colors.red}❌ ERROR CRÍTICO:${colors.reset}`, error);
    process.exit(1);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  console.log(`${colors.blue}Iniciando pruebas...${colors.reset}\n`);
  
  runAllTests()
    .then(() => {
      console.log(`${colors.green}\n✅ Pruebas completadas${colors.reset}\n`);
      process.exit(0);
    })
    .catch((error) => {
      console.error(`${colors.red}\n❌ Error ejecutando pruebas:${colors.reset}`, error);
      process.exit(1);
    });
}

module.exports = { testQRCodeGeneration, testQRImageGeneration, testMemoryUsage };
