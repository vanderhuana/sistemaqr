<template>
  <div class="qr-scanner">
    <!-- Estado del Escáner -->
    <div class="scanner-status">
      <div class="status-indicator" :class="{ 
        'active': scannerActive && !processingQR && scanInterval, 
        'inactive': !scannerActive, 
        'processing': processingQR,
        'paused': scannerActive && !scanInterval && !processingQR
      }">
        <span class="status-icon">
          {{ processingQR ? '⏳' : 
             (scannerActive && !scanInterval && !processingQR) ? '⏸️' : 
             scannerActive ? '📹' : '📱' }}
        </span>
        <span class="status-text">
          {{ processingQR ? 'Procesando QR...' : 
             (scannerActive && !scanInterval && !processingQR) ? 'ESCÁNER PAUSADO' :
             scannerActive ? 'ESCÁNER ACTIVO' : 'ESCÁNER INACTIVO' }}
        </span>
      </div>
      
      <button @click="toggleScanner" class="btn-toggle-scanner" :disabled="processingQR">
        {{ scannerActive ? 'DETENER ESCÁNER' : 'ACTIVAR ESCÁNER' }}
      </button>
    </div>
    
    <!-- Área del Escáner -->
    <div class="scanner-area">
      <div class="camera-container">
        <video ref="videoElement" v-show="scannerActive" autoplay playsinline></video>
        <canvas ref="canvasElement" style="display: none;"></canvas>
        
        <!-- Overlay de escáner -->
        <div v-if="scannerActive" class="scanner-overlay">
          <div class="scan-frame">
            <div class="scan-corner top-left"></div>
            <div class="scan-corner top-right"></div>
            <div class="scan-corner bottom-left"></div>
            <div class="scan-corner bottom-right"></div>
            <div class="scan-line" :class="{ 'scanning': scannerActive }"></div>
          </div>
          <p class="scan-instructions">
            Enfoca el código QR dentro del marco
          </p>
        </div>
        
        <!-- Placeholder cuando no está activo -->
        <div v-else class="scanner-placeholder">
          <div class="placeholder-content">
            <div class="placeholder-icon">📱</div>
            <h3>Escáner QR Inactivo</h3>
            <p>Presiona "ACTIVAR ESCÁNER" para comenzar</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

// Emits
const emit = defineEmits(['resultado'])

// Variables reactivas
const scannerActive = ref(false)
const processingQR = ref(false)
const scanInterval = ref(null)
const videoStream = ref(null)
const videoElement = ref(null)
const canvasElement = ref(null)

// Toggle Scanner
const toggleScanner = async () => {
  try {
    if (scannerActive.value) {
      stopScanner()
    } else {
      await startScanner()
    }
  } catch (error) {
    console.error('Error al alternar escáner:', error)
    alert('Error al acceder a la cámara: ' + error.message)
  }
}

// Start Scanner
const startScanner = async () => {
  try {
    // Verificar si el navegador soporta getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      try {
        const isSecureContext = window.isSecureContext || location.protocol === 'https:'
        const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname)
        if (!isSecureContext && !isLocalhost) {
          throw new Error('Acceso a la cámara requiere HTTPS. Abre la app usando https:// en tu dispositivo móvil.')
        }
      } catch (e) {
        // ignore
      }
      throw new Error('Tu navegador no soporta acceso a la cámara')
    }

    // Solicitar acceso a la cámara con configuración optimizada
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment', // Cámara trasera por defecto
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 15 } // Mayor tasa de frames para detección más rápida
      } 
    })
    
    videoStream.value = stream
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      scannerActive.value = true
      
      // Comenzar a escanear
      startScanning()
    }
  } catch (error) {
    console.error('Error al acceder a la cámara:', error)
    
    let errorMessage = 'No se pudo acceder a la cámara.'
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = '❌ Permiso denegado.\n\n' +
                     '📸 Para usar el escáner, debes permitir el acceso a la cámara:\n\n' +
                     '1. Asegúrate de abrir la aplicación por HTTPS.\n' +
                     '2. Haz clic en el ícono de candado en la barra de direcciones.\n' +
                     '3. Activa "Cámara" → "Permitir".\n' +
                     '4. Recarga la página e intenta de nuevo.'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = '❌ No se encontró ninguna cámara conectada.'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = '❌ La cámara está siendo usada por otra aplicación.'
    } else if (error.message) {
      errorMessage = `❌ Error: ${error.message}`
    }
    
    throw new Error(errorMessage)
  }
}

// Stop Scanner
const stopScanner = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop())
    videoStream.value = null
  }
  
  if (scanInterval.value) {
    clearInterval(scanInterval.value)
    scanInterval.value = null
  }
  
  scannerActive.value = false
  processingQR.value = false
}

// Start Scanning Loop
const startScanning = () => {
  if (scanInterval.value) return
  
  // Escanear cada 200ms para detección más rápida
  scanInterval.value = setInterval(() => {
    if (!scannerActive.value || processingQR.value) return
    captureAndDecodeQR()
  }, 200)
}

// Capture and Decode QR (optimizado para mayor velocidad)
const captureAndDecodeQR = async () => {
  try {
    const video = videoElement.value
    const canvas = canvasElement.value
    
    if (!video || !canvas || !video.videoWidth) return
    
    const context = canvas.getContext('2d', { willReadFrequently: true })
    
    // Optimización: Escanear solo el área central (70% del frame)
    // Esto reduce el área de procesamiento y aumenta la velocidad
    const scanWidth = Math.floor(video.videoWidth * 0.8)
    const scanHeight = Math.floor(video.videoHeight * 0.8)
    const offsetX = Math.floor((video.videoWidth - scanWidth) / 2)
    const offsetY = Math.floor((video.videoHeight - scanHeight) / 2)
    
    canvas.width = scanWidth
    canvas.height = scanHeight
    
    // Dibujar solo el área central del video
    context.drawImage(
      video,
      offsetX, offsetY, scanWidth, scanHeight, // área fuente (centro del video)
      0, 0, scanWidth, scanHeight // área destino (todo el canvas)
    )
    
    // Obtener datos de imagen
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Decodificar QR usando jsQR con opciones optimizadas
    const { default: jsQR } = await import('jsqr')
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert' // Mejora la velocidad al no intentar inversión de colores
    })
    
    if (qrResult && qrResult.data) {
      console.log('🔍 QR detectado:', qrResult.data)
      processingQR.value = true
      
      // Pausar escaneo mientras se procesa
      if (scanInterval.value) {
        clearInterval(scanInterval.value)
        scanInterval.value = null
      }
      
      // Emitir resultado al padre inmediatamente
      emit('resultado', qrResult.data)
      
      // Reiniciar escaneo después de 2 segundos
      setTimeout(() => {
        processingQR.value = false
        if (scannerActive.value) {
          startScanning()
        }
      }, 2000)
    }
  } catch (error) {
    console.error('Error al capturar frame:', error)
  }
}

// Cleanup al desmontar
onUnmounted(() => {
  stopScanner()
})
</script>

<style scoped>
.qr-scanner {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.scanner-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  gap: 1rem;
  flex-wrap: wrap;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.status-indicator.active {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.status-indicator.inactive {
  background: linear-gradient(135deg, #64748b 0%, #94a3b8 100%);
  color: white;
}

.status-indicator.processing {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-indicator.paused {
  background: linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%);
  color: white;
}

.status-icon {
  font-size: 1.5rem;
  animation: iconPulse 2s ease-in-out infinite;
}

.status-text {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.btn-toggle-scanner {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.btn-toggle-scanner:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
}

.btn-toggle-scanner:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.scanner-area {
  width: 100%;
}

.camera-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: none;
}

.scan-frame {
  position: relative;
  width: 70%;
  aspect-ratio: 1;
  max-width: 300px;
}

.scan-corner {
  position: absolute;
  width: 40px;
  height: 40px;
  border: 4px solid #10b981;
  border-radius: 4px;
}

.scan-corner.top-left {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.scan-corner.top-right {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.scan-corner.bottom-left {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.scan-corner.bottom-right {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #10b981, transparent);
  box-shadow: 0 0 10px #10b981;
}

.scan-line.scanning {
  animation: scanAnimation 2s linear infinite;
}

.scan-instructions {
  margin-top: 2rem;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  padding: 0 1rem;
}

.scanner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}

.placeholder-content {
  text-align: center;
  color: #94a3b8;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.placeholder-content h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #cbd5e1;
}

.placeholder-content p {
  font-size: 0.9rem;
}

@keyframes scanAnimation {
  0% {
    top: 0;
  }
  100% {
    top: 100%;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .scanner-status {
    flex-direction: column;
    align-items: stretch;
  }

  .status-indicator {
    justify-content: center;
  }

  .btn-toggle-scanner {
    width: 100%;
  }

  .scan-frame {
    width: 80%;
  }
}
</style>
