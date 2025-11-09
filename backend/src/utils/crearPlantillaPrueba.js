const sharp = require('sharp');
const path = require('path');

async function crearPlantillaPrueba() {
  try {
    const plantillaPath = path.join(__dirname, '../assets/modal_premio.png');
    
    // Crear un SVG simple como plantilla de prueba
    const svgTemplate = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <!-- Fondo degradado -->
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6B9080;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8FA89B;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <rect width="800" height="600" fill="url(#grad1)" />
        
        <!-- Círculo decorativo -->
        <circle cx="400" cy="300" r="200" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="4"/>
        
        <!-- Texto FEIPOBOL -->
        <text x="400" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">FEIPOBOL</text>
        
        <!-- Texto 2025 -->
        <text x="400" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="rgba(255,255,255,0.9)">2025</text>
        
        <!-- Decoración -->
        <text x="400" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.8)">En el Bicentenario de Bolivia 🇧🇴</text>
      </svg>
    `;

    // Generar PNG desde SVG
    await sharp(Buffer.from(svgTemplate))
      .png()
      .toFile(plantillaPath);

    console.log('✅ Plantilla de prueba creada exitosamente:', plantillaPath);
    console.log('🎨 Puedes reemplazarla con tu propio diseño personalizado');

  } catch (error) {
    console.error('❌ Error creando plantilla de prueba:', error);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  crearPlantillaPrueba();
}

module.exports = { crearPlantillaPrueba };