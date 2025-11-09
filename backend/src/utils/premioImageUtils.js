const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Genera una imagen personalizada de premio usando Sharp
 * @param {Object} premio - Datos del premio
 * @param {string} premio.nombrePremio - Nombre del premio
 * @param {string} premio.descripcionPremio - Descripción del premio
 * @param {number} premio.numeroSorteo - Número del sorteo
 * @returns {Promise<string>} - Path de la imagen generada
 */
async function generarImagenPremio(premio) {
  try {
    const { nombrePremio, descripcionPremio, numeroSorteo } = premio;
    
    // Paths
    const assetsDir = path.join(__dirname, '../../assets');
    const generatedDir = path.join(assetsDir, 'generated');
    const templatePath = path.join(assetsDir, 'modal_premio.png');
    
    // Verificar que existe la plantilla
    if (!fs.existsSync(templatePath)) {
      throw new Error('No se encontró la plantilla modal_premio.png en assets/');
    }
    
    // Crear directorio generated si no existe
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    
    // Nombre del archivo de salida
    const timestamp = Date.now();
    const outputFilename = `premio_${numeroSorteo}_${timestamp}.jpg`;
    const outputPath = path.join(generatedDir, outputFilename);
    
    // Leer la plantilla base
    const templateBuffer = fs.readFileSync(templatePath);
    const templateImage = sharp(templateBuffer);
    
    // Obtener dimensiones de la plantilla
    const { width, height } = await templateImage.metadata();
    
    // Configurar texto del premio
    const textoCompleto = `¡GANASTE!\n\n${nombrePremio.toUpperCase()}`;
    const textoDescripcion = descripcionPremio || '';
    const textoNumero = `#${numeroSorteo}`;
    
    // Crear SVG con el texto superpuesto
    const svgText = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Texto principal: ¡GANASTE! -->
        <text x="${width/2}" y="150" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="48" 
              font-weight="bold" 
              fill="#FF6B35">¡GANASTE!</text>
              
        <!-- Nombre del premio -->
        <text x="${width/2}" y="220" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="36" 
              font-weight="bold" 
              fill="#2C3E50">${nombrePremio.toUpperCase()}</text>
              
        <!-- Descripción del premio -->
        ${textoDescripcion ? `
        <text x="${width/2}" y="270" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="24" 
              fill="#34495E">${textoDescripcion}</text>
        ` : ''}
        
        <!-- Número de sorteo -->
        <text x="${width/2}" y="${height - 80}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="32" 
              font-weight="bold" 
              fill="#E74C3C">NÚMERO: ${textoNumero}</text>
              
        <!-- Felicitaciones -->
        <text x="${width/2}" y="${height - 40}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="20" 
              fill="#7F8C8D">¡FELICITACIONES!</text>
      </svg>
    `;
    
    // Combinar plantilla + texto
    const finalImage = await templateImage
      .composite([
        {
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        }
      ])
      .jpeg({ 
        quality: 90,
        progressive: true 
      })
      .toFile(outputPath);
    
    console.log(`✅ Imagen de premio generada: ${outputFilename}`);
    
    // Retornar el path relativo para guardarlo en la base de datos
    return `generated/${outputFilename}`;
    
  } catch (error) {
    console.error('❌ Error generando imagen de premio:', error);
    throw error;
  }
}

/**
 * Genera una imagen de "Sigue Participando" para números sin premio
 * @param {number} numeroSorteo - Número del sorteo
 * @returns {Promise<string>} - Path de la imagen generada
 */
async function generarImagenSigueParticipando(numeroSorteo) {
  try {
    const assetsDir = path.join(__dirname, '../../assets');
    const generatedDir = path.join(assetsDir, 'generated');
    const templatePath = path.join(assetsDir, 'modal_premio.png');
    
    // Verificar que existe la plantilla
    if (!fs.existsSync(templatePath)) {
      throw new Error('No se encontró la plantilla modal_premio.png en assets/');
    }
    
    // Crear directorio generated si no existe
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }
    
    // Nombre del archivo de salida
    const timestamp = Date.now();
    const outputFilename = `sigue_participando_${numeroSorteo}_${timestamp}.jpg`;
    const outputPath = path.join(generatedDir, outputFilename);
    
    // Leer la plantilla base
    const templateBuffer = fs.readFileSync(templatePath);
    const templateImage = sharp(templateBuffer);
    
    // Obtener dimensiones de la plantilla
    const { width, height } = await templateImage.metadata();
    
    // Crear SVG con mensaje de "Sigue Participando"
    const svgText = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <!-- Texto principal -->
        <text x="${width/2}" y="180" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="42" 
              font-weight="bold" 
              fill="#3498DB">SIGUE</text>
              
        <text x="${width/2}" y="240" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="42" 
              font-weight="bold" 
              fill="#3498DB">PARTICIPANDO</text>
              
        <!-- Número de sorteo -->
        <text x="${width/2}" y="300" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="28" 
              fill="#2C3E50">Tu número: #${numeroSorteo}</text>
              
        <!-- Mensaje motivacional -->
        <text x="${width/2}" y="${height - 80}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="24" 
              fill="#27AE60">¡Gracias por participar!</text>
              
        <text x="${width/2}" y="${height - 40}" 
              text-anchor="middle" 
              font-family="Arial, sans-serif" 
              font-size="20" 
              fill="#7F8C8D">FEIPOBOL 2025</text>
      </svg>
    `;
    
    // Combinar plantilla + texto
    await templateImage
      .composite([
        {
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        }
      ])
      .jpeg({ 
        quality: 90,
        progressive: true 
      })
      .toFile(outputPath);
    
    console.log(`✅ Imagen "Sigue Participando" generada: ${outputFilename}`);
    
    // Retornar el path relativo
    return `generated/${outputFilename}`;
    
  } catch (error) {
    console.error('❌ Error generando imagen "Sigue Participando":', error);
    throw error;
  }
}

/**
 * Elimina archivos de imagen antiguos para liberar espacio
 * @param {number} diasAntiguedad - Días de antigüedad para eliminar
 */
async function limpiarImagenesAntiguas(diasAntiguedad = 30) {
  try {
    const generatedDir = path.join(__dirname, '../../assets/generated');
    
    if (!fs.existsSync(generatedDir)) {
      return;
    }
    
    const archivos = fs.readdirSync(generatedDir);
    const ahora = Date.now();
    const limiteTiempo = diasAntiguedad * 24 * 60 * 60 * 1000; // milisegundos
    
    let eliminados = 0;
    
    for (const archivo of archivos) {
      const archivoPath = path.join(generatedDir, archivo);
      const stats = fs.statSync(archivoPath);
      
      if (ahora - stats.mtime.getTime() > limiteTiempo) {
        fs.unlinkSync(archivoPath);
        eliminados++;
      }
    }
    
    if (eliminados > 0) {
      console.log(`🧹 Limpieza completada: ${eliminados} imágenes antiguas eliminadas`);
    }
    
  } catch (error) {
    console.error('❌ Error limpiando imágenes antiguas:', error);
  }
}

module.exports = {
  generarImagenPremio,
  generarImagenSigueParticipando,
  limpiarImagenesAntiguas
};