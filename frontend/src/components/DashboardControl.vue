<template>
  <div class="dashboard-control">
    
    <!-- Botón hamburguesa para móvil -->
    <button 
      class="mobile-menu-btn" 
      @click="toggleSidebar"
      aria-label="Abrir menú"
    >
      <span v-if="!sidebarOpen">☰</span>
      <span v-else>✕</span>
    </button>
    
    <!-- Overlay para cerrar sidebar en móvil -->
    <div 
      class="sidebar-overlay" 
      :class="{ active: sidebarOpen }"
      @click="closeSidebar"
    ></div>
    
    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <!-- Header del sidebar -->
      <div class="sidebar-header">
        <h2>FEIPOBOL</h2>
        <p>CONTROL DE ACCESO</p>
      </div>
      
      <!-- Información del usuario -->
      <div class="user-info">
        <div class="user-avatar">
          {{ (usuario.firstName || usuario.nombre || usuario.username || 'C')[0].toUpperCase() }}
        </div>
        <div class="user-details">
          <h3>{{ usuario.firstName || usuario.nombre || usuario.username || 'Control' }} {{ usuario.lastName || usuario.apellido || '' }}</h3>
          <p class="user-role">CONTROL</p>
          <p class="user-email">{{ usuario.email || 'control@feipobol.bo' }}</p>
        </div>
      </div>

      <!-- Menú de navegación -->
      <nav class="sidebar-nav">
        <button 
          @click="cambiarSeccion('scanner')" 
          :class="{ active: seccionActiva === 'scanner' }"
          class="nav-item"
        >
          📷 ESCANEAR QR
        </button>
        <button 
          @click="cambiarSeccion('historial')" 
          :class="{ active: seccionActiva === 'historial' }"
          class="nav-item"
        >
          📋 HISTORIAL
        </button>
        <button 
          @click="cambiarSeccion('estadisticas')" 
          :class="{ active: seccionActiva === 'estadisticas' }"
          class="nav-item"
        >
          📊 ESTADÍSTICAS
        </button>
      </nav>

      <!-- Botón salir -->
      <button @click="$emit('cerrar-sesion')" class="btn-salir">
        SALIR
      </button>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="main-content">

      <!-- SECCIÓN: SCANNER -->
      <section v-if="seccionActiva === 'scanner'" class="seccion-scanner">
        <div class="contenido-card">
          
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
            
            <!-- Input manual alternativo -->
            <div class="manual-input">
              <h4>📝 Entrada Manual (Alternativa)</h4>
              <div class="manual-input-row">
                <input 
                  v-model="manualQRCode" 
                  type="text" 
                  placeholder="Pega o escribe el código QR aquí" 
                  class="manual-qr-input"
                  @keyup.enter="validateManualQR"
                />
                <button @click="validateManualQR" :disabled="!manualQRCode || processingQR" class="btn-validate-manual">
                  VALIDAR
                </button>
              </div>
            </div>
          </div>
          
          <!-- Estado de última validación (info compacta) -->
          <div v-if="lastValidationResult" class="last-validation-info" :class="lastValidationResult.success ? 'success-info' : 'error-info'">
            <span class="validation-icon">{{ lastValidationResult.success ? '✅' : '❌' }}</span>
            <span class="validation-summary">
              Última: {{ lastValidationResult.success ? 'VÁLIDA' : 'INVÁLIDA' }} - 
              {{ lastValidationResult.ticket?.ticketNumber || lastValidationResult.message }}
            </span>
            <small class="validation-time">{{ formatearFecha(lastValidationResult.timestamp) }}</small>
          </div>
          
          <!-- Historial de validaciones recientes -->
          <div class="validation-history">
            <h4>� Últimas Validaciones</h4>
            <div v-if="validationHistory.length === 0" class="no-history">
              <p>No hay validaciones recientes</p>
            </div>
            
            <div v-else class="history-list">
              <div v-for="validation in validationHistory" :key="validation.id" 
                   class="history-item" :class="validation.success ? 'success' : 'error'">
                <div class="history-icon">
                  {{ validation.success ? '✅' : '❌' }}
                </div>
                <div class="history-details">
                  <div class="history-main">
                    <strong>{{ validation.success ? 'VÁLIDA' : 'INVÁLIDA' }}</strong>
                    <span class="history-ticket">{{ validation.ticketNumber || validation.qrCode?.substring(0, 10) }}...</span>
                  </div>
                  <div class="history-meta">
                    <small>{{ formatearFecha(validation.timestamp) }} - {{ validation.message }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      <!-- SECCIÓN: HISTORIAL -->
      <section v-if="seccionActiva === 'historial'" class="seccion-historial">
        <div class="historial-header">
          <div class="filtros">
            <select v-model="filtroFecha" class="form-select" @change="cargarHistorial">
              <option value="hoy">Hoy</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="todo">Todo</option>
            </select>
            <select v-model="filtroTipo" class="form-select" @change="cargarHistorial">
              <option value="todos">Todos</option>
              <option value="validos">Válidos</option>
              <option value="rechazados">Rechazados</option>
            </select>
          </div>
        </div>

        <div v-if="cargandoHistorial" class="loading">
          <div class="spinner"></div>
          <p>Cargando historial...</p>
        </div>

        <div v-else-if="historial.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No hay registros</h3>
          <p>Las validaciones que realices aparecerán aquí</p>
        </div>

        <div v-else class="table-container">
          <table class="historial-table">
            <thead>
              <tr>
                <th>Fecha/Hora</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in historial" :key="item.id" :class="item.valida ? 'row-success' : 'row-error'">
                <td>{{ formatDateTime(item.fecha) }}</td>
                <td class="td-nombre">{{ item.nombre }}</td>
                <td>
                  <span class="tipo-badge">
                    {{ item.tipo === 'trabajador' ? '👷 Trabajador' : '🎫 Entrada' }}
                  </span>
                </td>
                <td>
                  <span :class="['status-badge', item.valida ? 'success' : 'error']">
                    {{ item.valida ? '✅ VÁLIDO' : '❌ RECHAZADO' }}
                  </span>
                </td>
                <td class="td-motivo">{{ item.motivo || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- SECCIÓN: ESTADÍSTICAS -->
      <section v-if="seccionActiva === 'estadisticas'" class="seccion-estadisticas">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>Accesos Hoy</h3>
              <p class="stat-number">{{ estadisticas.accesosHoy || 0 }}</p>
            </div>
          </div>
          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <h3>Válidos Hoy</h3>
              <p class="stat-number">{{ estadisticas.validosHoy || 0 }}</p>
            </div>
          </div>
          <div class="stat-card error">
            <div class="stat-icon">❌</div>
            <div class="stat-content">
              <h3>Rechazados Hoy</h3>
              <p class="stat-number">{{ estadisticas.rechazadosHoy || 0 }}</p>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <h3>Tasa de Éxito</h3>
              <p class="stat-number">{{ tasaExito }}%</p>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-container">
            <h3>📊 Validaciones por Hora (Hoy)</h3>
            <div class="simple-chart">
              <div v-for="hora in validacionesPorHora" :key="hora.hora" class="chart-bar">
                <div class="bar" :style="{ height: (hora.cantidad / maxValidaciones * 100) + '%' }">
                  <span class="bar-value">{{ hora.cantidad }}</span>
                </div>
                <span class="bar-label">{{ hora.hora }}h</span>
              </div>
            </div>
          </div>

          <div class="chart-container">
            <h3>📈 Válidos vs Rechazados (Semana)</h3>
            <div class="pie-chart">
              <div class="pie-item success">
                <div class="pie-color"></div>
                <div class="pie-info">
                  <span class="pie-label">Válidos</span>
                  <span class="pie-value">{{ estadisticas.validosSemana || 0 }}</span>
                </div>
              </div>
              <div class="pie-item error">
                <div class="pie-color"></div>
                <div class="pie-info">
                  <span class="pie-label">Rechazados</span>
                  <span class="pie-value">{{ estadisticas.rechazadosSemana || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>

    <!-- Modal de Resultado -->
    <QRValidResult 
      v-if="mostrarResultado"
      :result="resultado"
      @close="cerrarResultado"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import apiClient, { accessService, ticketService, validationService } from '@/services/api'
import QRValidResult from './QRValidResult.vue'
import jsQR from 'jsqr'

// Props
defineEmits(['cerrar-sesion'])

// Variables
const usuario = ref({})
const seccionActiva = ref('scanner')
const sidebarOpen = ref(false)
const mostrarResultado = ref(false)
const resultado = ref(null)
const cargandoHistorial = ref(false)
const historial = ref([])
const validacionesRecientes = ref([])
const filtroFecha = ref('hoy')
const filtroTipo = ref('todos')

// Variables para escáner QR (replicadas del DashboardAdmin)
const scannerActive = ref(false)
const processingQR = ref(false)
const manualQRCode = ref('')
const lastValidationResult = ref(null)
const showValidationResult = ref(false)
const validationHistory = ref([])
const videoStream = ref(null)
const scanInterval = ref(null)
const videoElement = ref(null)
const canvasElement = ref(null)
const wasScanningBeforePause = ref(false)
const lastScannedQR = ref('')
const lastScanTime = ref(0)

const estadisticas = ref({
  accesosHoy: 0,
  validosHoy: 0,
  rechazadosHoy: 0,
  validosSemana: 0,
  rechazadosSemana: 0
})

const validacionesPorHora = ref([
  { hora: 6, cantidad: 0 },
  { hora: 8, cantidad: 0 },
  { hora: 10, cantidad: 0 },
  { hora: 12, cantidad: 0 },
  { hora: 14, cantidad: 0 },
  { hora: 16, cantidad: 0 },
  { hora: 18, cantidad: 0 },
  { hora: 20, cantidad: 0 }
])

// Computeds
const tituloSeccion = computed(() => {
  const titulos = {
    'scanner': '📷 Escanear QR',
    'historial': '📋 Historial de Validaciones',
    'estadisticas': '📊 Estadísticas de Acceso'
  }
  return titulos[seccionActiva.value] || 'Dashboard'
})

const tasaExito = computed(() => {
  const total = estadisticas.value.accesosHoy
  if (total === 0) return 0
  return Math.round((estadisticas.value.validosHoy / total) * 100)
})

const maxValidaciones = computed(() => {
  return Math.max(...validacionesPorHora.value.map(h => h.cantidad), 1)
})

// Funciones responsive
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const cambiarSeccion = (seccion) => {
  seccionActiva.value = seccion
  if (window.innerWidth <= 768) {
    closeSidebar()
  }
  if (seccion === 'historial') {
    cargarHistorial()
  }
}

// Funciones de validación
const manejarResultado = async (data) => {
  console.log('Resultado escaneado:', data)
  
  try {
    let response
    
    // Determinar si es trabajador o entrada
    if (data.tipo === 'trabajador' || data.tipoPersona === 'trabajador') {
      response = await accessService.validate({ codigo: data.codigo || data.qr })
    } else {
      response = await ticketService.validate(data.codigo || data.qr)
    }

    console.log('Respuesta de validación:', response)
    
    const valida = response.success || false
    const nombre = response.persona 
      ? `${response.persona.nombre} ${response.persona.apellido}`
      : response.ticket 
        ? response.ticket.buyerName 
        : 'Desconocido'
    
    // Agregar a validaciones recientes
    const nuevaValidacion = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      nombre: nombre,
      tipo: data.tipo || data.tipoPersona || 'entrada',
      valida: valida,
      motivo: response.message || ''
    }
    
    validacionesRecientes.value.unshift(nuevaValidacion)
    if (validacionesRecientes.value.length > 10) {
      validacionesRecientes.value.pop()
    }
    
    // Actualizar estadísticas
    estadisticas.value.accesosHoy++
    if (valida) {
      estadisticas.value.validosHoy++
    } else {
      estadisticas.value.rechazadosHoy++
    }
    
    // Actualizar validaciones por hora
    const horaActual = new Date().getHours()
    const horaChart = validacionesPorHora.value.find(h => {
      return horaActual >= h.hora && horaActual < (validacionesPorHora.value[validacionesPorHora.value.indexOf(h) + 1]?.hora || 24)
    })
    if (horaChart) {
      horaChart.cantidad++
    }
    
    // Mostrar resultado
    resultado.value = response
    mostrarResultado.value = true
    
    // Recargar scanner después de 3 segundos
    setTimeout(() => {
      scannerKey.value++
    }, 3000)
    
  } catch (error) {
    console.error('Error validando:', error)
    resultado.value = {
      success: false,
      message: error.response?.data?.message || 'Error al validar el código',
      result: 'error'
    }
    mostrarResultado.value = true
  }
}

const cerrarResultado = () => {
  mostrarResultado.value = false
  resultado.value = null
}

// **FUNCIONES DEL SCANNER QR (REPLICADAS DEL DASHBOARD ADMIN)**

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

const startScanner = async () => {
  try {
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

    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment',
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 15 } // Mayor tasa de frames para detección más rápida
      } 
    })
    
    videoStream.value = stream
    if (videoElement.value) {
      videoElement.value.srcObject = stream
      scannerActive.value = true
      startScanning()
    }
  } catch (error) {
    console.error('Error al acceder a la cámara:', error)
    
    let errorMessage = 'No se pudo acceder a la cámara.'
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = '❌ Permiso denegado.\n\n' +
                     '📸 Para usar el escáner, debes permitir el acceso a la cámara:\n\n' +
                     '1. Asegúrate de abrir la aplicación por HTTPS.\n' +
                     '2. Haz clic en el ícono de candado y activa "Cámara" → "Permitir".\n' +
                     '3. Recarga la página e intenta de nuevo.'
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

const startScanning = () => {
  if (scanInterval.value) return
  
  // Escanear cada 150ms para detección más rápida y precisa
  scanInterval.value = setInterval(() => {
    if (!scannerActive.value || processingQR.value) return
    captureAndDecodeQR()
  }, 150)
}

const captureAndDecodeQR = async () => {
  try {
    const video = document.querySelector('video')
    const canvas = document.querySelector('canvas')
    
    if (!video || !canvas || !video.videoWidth) return
    
    const context = canvas.getContext('2d', { willReadFrequently: true })
    
    // Usar TODA el área del video para mejor detección
    // Esto aumenta las posibilidades de detectar el QR
    const scanWidth = video.videoWidth
    const scanHeight = video.videoHeight
    
    canvas.width = scanWidth
    canvas.height = scanHeight
    
    // Dibujar el video completo en el canvas
    context.drawImage(video, 0, 0, scanWidth, scanHeight)
    
    // Obtener datos de imagen
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Decodificar QR usando jsQR con opciones optimizadas para mejor precisión
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth' // Intentar con inversión de colores para mejor detección
    })
    
    if (qrResult && qrResult.data) {
      console.log('🔍 QR detectado:', qrResult.data)
      await validateQRCode(qrResult.data)
    }
    
  } catch (error) {
    console.error('Error al capturar frame:', error)
  }
}

const esTokenAcceso = (qrCode) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(qrCode)
}

const esEntradaSimple = (qrCode) => {
  // Detecta tokens de entradas generadas (formato: ENTRY-timestamp-random)
  return qrCode.startsWith('ENTRY-') || qrCode.startsWith('TK-')
}

const validateQRCode = async (qrCode) => {
  if (processingQR.value) return
  
  // Evitar escaneos duplicados del mismo QR en menos de 3 segundos
  const now = Date.now()
  if (lastScannedQR.value === qrCode && (now - lastScanTime.value) < 3000) {
    console.log('⏭️ QR ya escaneado recientemente, ignorando...')
    return
  }
  
  lastScannedQR.value = qrCode
  lastScanTime.value = now
  processingQR.value = true
  
  // Pausar temporalmente el escáner para mostrar resultado
  wasScanningBeforePause.value = scannerActive.value
  if (wasScanningBeforePause.value && scanInterval.value) {
    clearInterval(scanInterval.value)
    scanInterval.value = null
  }
  
  try {
    // **DETECTAR TIPO DE QR**
    
    // 1. Token de acceso (trabajador/participante)
    if (esTokenAcceso(qrCode)) {
      console.log('� Token de acceso detectado:', qrCode)
      await validarAccesoPersonal(qrCode)
      return
    }
    
    // 2. Entrada simple (QR físico generado)
    if (esEntradaSimple(qrCode)) {
      console.log('� Entrada simple detectada:', qrCode)
      await validarEntradaSimpleDirecta(qrCode)
      return
    }
    
    // 3. Ticket de evento - validar directamente
    console.log('🎫 Ticket de evento detectado:', qrCode)
    await validarTicketEvento(qrCode)
    
  } catch (error) {
    console.error('❌ Error procesando QR:', error)
    
    resultado.value = {
      success: false,
      message: error.message || 'Error de conexión',
      result: 'error'
    }
    mostrarResultado.value = true
    
    setTimeout(() => {
      processingQR.value = false
      mostrarResultado.value = false
      if (wasScanningBeforePause.value && scannerActive.value && !scanInterval.value) {
        startScanning()
      }
    }, 3000)
  }
}

const validarAccesoPersonal = async (token) => {
  try {
    console.log('🔍 Validando token de acceso:', token)
    
    const response = await accessService.validateAccess(token, null)
    
    console.log('� Respuesta del servidor:', response)
    
    const timestamp = new Date()
    
    // Agregar estadísticas
    estadisticas.value.accesosHoy++
    if (response.success) {
      estadisticas.value.validosHoy++
    } else {
      estadisticas.value.rechazadosHoy++
    }
    
    // Agregar al historial
    validacionesRecientes.value.unshift({
      id: Date.now(),
      fecha: timestamp.toISOString(),
      nombre: response.persona ? `${response.persona.nombre} ${response.persona.apellido}` : 'Desconocido',
      tipo: response.tipo || response.persona?.tipo || 'trabajador',
      valida: response.success,
      motivo: response.message || ''
    })
    
    if (validacionesRecientes.value.length > 10) {
      validacionesRecientes.value.pop()
    }
    
    // Mostrar modal de resultado
    resultado.value = response
    mostrarResultado.value = true
    
    // Tiempo de cierre automático
    const autoCloseTime = response.success ? 8000 : 6000
    
    setTimeout(() => {
      processingQR.value = false
      mostrarResultado.value = false
      if (wasScanningBeforePause.value && scannerActive.value && !scanInterval.value) {
        startScanning()
      }
    }, autoCloseTime)
    
  } catch (error) {
    console.error('❌ Error validando acceso:', error)
    
    resultado.value = {
      success: false,
      message: error.response?.data?.message || error.message || 'Error de conexión',
      result: 'error'
    }
    mostrarResultado.value = true
    
    setTimeout(() => {
      processingQR.value = false
      mostrarResultado.value = false
      if (wasScanningBeforePause.value && scannerActive.value && !scanInterval.value) {
        startScanning()
      }
    }, 3000)
  }
}

const validarEntradaSimpleDirecta = async (token) => {
  try {
    console.log('🔍 Validando entrada simple:', token)
    
    const response = await apiClient.post('/api/validation/validar-entrada', { token })
    const responseData = response.data
    
    console.log('📡 Respuesta del servidor:', responseData)
    
    const timestamp = new Date()
    
    // Agregar estadísticas
    estadisticas.value.accesosHoy++
    if (responseData.success) {
      estadisticas.value.validosHoy++
    } else {
      estadisticas.value.rechazadosHoy++
    }
    
    // Agregar al historial
    validacionesRecientes.value.unshift({
      id: Date.now(),
      fecha: timestamp.toISOString(),
      nombre: 'Entrada Simple',
      tipo: 'entrada',
      valida: responseData.success,
      motivo: responseData.message || ''
    })
    
    if (validacionesRecientes.value.length > 10) {
      validacionesRecientes.value.pop()
    }
    
    // Mostrar modal de resultado
    resultado.value = responseData
    mostrarResultado.value = true
    
    // Tiempo de cierre automático
    const autoCloseTime = responseData.success ? 8000 : 6000
    
    setTimeout(() => {
      processingQR.value = false
      mostrarResultado.value = false
      if (wasScanningBeforePause.value && scannerActive.value && !scanInterval.value) {
        startScanning()
      }
    }, autoCloseTime)
    
  } catch (error) {
    console.error('❌ Error validando entrada simple:', error)
    
    resultado.value = {
      success: false,
      message: error.response?.data?.message || error.message || 'Error de conexión',
      result: 'error'
    }
    mostrarResultado.value = true
    
    setTimeout(() => {
      processingQR.value = false
      mostrarResultado.value = false
      if (wasScanningBeforePause.value && scannerActive.value && !scanInterval.value) {
        startScanning()
      }
    }, 3000)
  }
}

const validarTicketEvento = async (qrCode) => {
  try {
    console.log('🔍 Validando ticket de evento:', qrCode)
    
    const response = await ticketService.validateTicket(qrCode)
    
    console.log('📡 Respuesta del servidor:', response)
    
    const timestamp = new Date()
    
    // Agregar estadísticas
    estadisticas.value.accesosHoy++
    if (response.success) {
      estadisticas.value.validosHoy++
    } else {
      estadisticas.value.rechazadosHoy++
    }
    
    // Agregar al historial
    validacionesRecientes.value.unshift({
      id: Date.now(),
      fecha: timestamp.toISOString(),
      nombre: response.ticket?.buyerName || 'Entrada Evento',
      tipo: 'entrada evento',
      valida: response.success,
      motivo: response.message || ''
    })
    
    if (validacionesRecientes.value.length > 10) {
      validacionesRecientes.value.pop()
    }
    
    // Mostrar modal de resultado
    resultado.value = response
    mostrarResultado.value = true
    
    // Tiempo de cierre automático
    const autoCloseTime = response.success ? 8000 : 6000
    
    setTimeout(() => {
      processingQR.value = false
      mostrarResultado.value = false
      if (wasScanningBeforePause.value && scannerActive.value && !scanInterval.value) {
        startScanning()
      }
    }, autoCloseTime)
    
  } catch (error) {
    console.error('❌ Error validando ticket:', error)
    
    resultado.value = {
      success: false,
      message: error.response?.data?.message || error.message || 'Error de conexión',
      result: 'error'
    }
    mostrarResultado.value = true
    
    setTimeout(() => {
      processingQR.value = false
      mostrarResultado.value = false
      if (wasScanningBeforePause.value && scannerActive.value && !scanInterval.value) {
        startScanning()
      }
    }, 3000)
  }
}

const validateManualQR = async () => {
  if (!manualQRCode.value || processingQR.value) return
  
  const qrCode = manualQRCode.value.trim()
  manualQRCode.value = ''
  
  await validateQRCode(qrCode)
}

const formatearFecha = (fecha) => {
  if (!fecha) return ''
  const d = new Date(fecha)
  const hoy = new Date()
  
  if (d.toDateString() === hoy.toDateString()) {
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }
  
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) + ' ' +
         d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// ** FIN DE FUNCIONES DEL SCANNER **

const cargarHistorial = async () => {
  try {
    cargandoHistorial.value = true
    
    // Aquí deberías llamar a tu API para obtener el historial
    // Por ahora usaremos las validaciones recientes como ejemplo
    historial.value = [...validacionesRecientes.value]
    
    // Aplicar filtros
    if (filtroTipo.value === 'validos') {
      historial.value = historial.value.filter(v => v.valida)
    } else if (filtroTipo.value === 'rechazados') {
      historial.value = historial.value.filter(v => !v.valida)
    }
    
  } catch (error) {
    console.error('Error cargando historial:', error)
  } finally {
    cargandoHistorial.value = false
  }
}

const calcularEstadisticas = () => {
  const ahora = new Date()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)

  const validacionesHoy = validacionesRecientes.value.filter(v => 
    new Date(v.fecha) >= hoy
  )
  const validacionesSemana = validacionesRecientes.value.filter(v => 
    new Date(v.fecha) >= hace7Dias
  )

  estadisticas.value.accesosHoy = validacionesHoy.length
  estadisticas.value.validosHoy = validacionesHoy.filter(v => v.valida).length
  estadisticas.value.rechazadosHoy = validacionesHoy.filter(v => !v.valida).length
  estadisticas.value.validosSemana = validacionesSemana.filter(v => v.valida).length
  estadisticas.value.rechazadosSemana = validacionesSemana.filter(v => !v.valida).length
}

// Formateadores
const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A'
  const date = new Date(dateTime)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatTime = (dateTime) => {
  if (!dateTime) return 'N/A'
  const date = new Date(dateTime)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(() => {
  const user = localStorage.getItem('sisqr_user') || localStorage.getItem('user')
  usuario.value = user ? JSON.parse(user) : {}
  console.log('🔐 Dashboard Control montado para:', usuario.value)
  console.log('📋 Datos del usuario:', {
    nombre: usuario.value.nombre || `${usuario.value.firstName} ${usuario.value.lastName}`,
    email: usuario.value.email,
    rol: usuario.value.rol || usuario.value.role
  })
  
  calcularEstadisticas()
})
</script>

<style scoped>
.dashboard-control {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
}

/* SIDEBAR */
.sidebar {
  width: 280px;
  background: #6B9080;
  color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 3px;
}

.sidebar-header {
  padding: 25px 20px;
  background: rgba(0,0,0,0.15);
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: 2px;
}

.sidebar-header p {
  margin: 5px 0 0 0;
  font-size: 0.8rem;
  opacity: 0.9;
  font-weight: 600;
  letter-spacing: 1px;
}

.user-info {
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #34D399);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-details h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  margin: 3px 0 0 0;
  font-size: 0.7rem;
  opacity: 0.9;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #A7F3D0;
}

.user-email {
  margin: 3px 0 0 0;
  font-size: 0.65rem;
  opacity: 0.7;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-nav {
  flex: 1;
  padding: 15px 0;
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px)); /* Espacio extra + área segura del dispositivo */
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  width: 100%;
  background: none;
  border: none;
  color: white;
  padding: 14px 20px;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.15);
  border-left-color: rgba(255,255,255,0.5);
}

.nav-item.active {
  background: rgba(255,255,255,0.25);
  border-left-color: #10B981;
  font-weight: 700;
}

.btn-salir {
  margin: 15px 20px;
  margin-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); /* Espacio extra + área segura del dispositivo */
  padding: 12px;
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.btn-salir:hover {
  background: #DC2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* CONTENIDO PRINCIPAL */
.main-content {
  flex: 1;
  background: #f5f5f5;
  min-height: 100vh;
  margin-left: 280px;
}

.content-header {
  background: white;
  padding: 20px 25px;
  border-bottom: 2px solid #6B9080;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.content-header h1 {
  margin: 0;
  color: #1F2937;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.content-header h1 span {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* **ESTILOS ESCÁNER QR** */
.seccion-scanner {
  padding: 30px;
}

.contenido-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.scanner-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 2px solid #dee2e6;
  gap: 15px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  font-size: 1rem;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.status-indicator.active {
  color: #fff;
  background: linear-gradient(135deg, #28a745, #20c997);
  border-color: #28a745;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.status-indicator.inactive {
  color: #495057;
  background: #fff;
  border-color: #dee2e6;
}

.status-indicator.processing {
  color: #fff;
  background: linear-gradient(135deg, #ffc107, #ffb300);
  border-color: #ffc107;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.status-indicator.paused {
  color: #fff;
  background: linear-gradient(135deg, #ff9800, #fb8c00);
  border-color: #ff9800;
  animation: pausedBlink 2s infinite;
}

@keyframes pausedBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.7; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.status-icon {
  font-size: 1.5rem;
}

.btn-toggle-scanner {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-toggle-scanner:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3, #004085);
  transform: translateY(-2px);
}

.btn-toggle-scanner:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scanner-area {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.camera-container {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

video {
  width: 100%;
  height: 100%;
  object-fit: contain; /* Cambiar a contain para que se vea completo */
  max-height: 500px;
  display: block;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.scan-frame {
  position: relative;
  width: 250px;
  height: 250px;
}

.scan-corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid #00ff00;
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
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ff00, transparent);
  animation: scanAnimation 2s ease-in-out infinite;
}

@keyframes scanAnimation {
  0% {
    top: 0;
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    top: 250px;
    opacity: 1;
  }
}

.scan-instructions {
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  margin-top: 20px;
  font-size: 0.9rem;
}

.scanner-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}

.placeholder-content {
  text-align: center;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.manual-input {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

@media (max-width: 768px) {
  .scanner-area {
    grid-template-columns: 1fr;
  }

  .camera-container {
    min-height: 300px;
    border-radius: 10px;
  }

  .scan-frame {
    width: 200px;
    height: 200px;
  }

  .scan-instructions {
    font-size: 0.85rem;
    padding: 6px 10px;
  }

  .manual-input {
    padding: 12px;
  }
}

.manual-input h4 {
  margin: 0 0 15px 0;
  color: #495057;
}

.manual-input-row {
  display: flex;
  gap: 12px;
}

.manual-qr-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
}

.manual-qr-input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn-validate-manual {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-validate-manual:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.btn-validate-manual:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.last-validation-info {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95em;
  animation: slideInFromTop 0.3s ease-out;
}

.last-validation-info.success-info {
  background: linear-gradient(135deg, #e8f5e8, #f0fff0);
  border-left-color: #4caf50;
  color: #2e7d32;
}

.last-validation-info.error-info {
  background: linear-gradient(135deg, #ffebee, #fef5f5);
  border-left-color: #f44336;
  color: #c62828;
}

.validation-icon {
  font-size: 1.2em;
  min-width: 24px;
}

.validation-summary {
  flex: 1;
  font-weight: 500;
}

.validation-time {
  color: #666;
  font-size: 0.8em;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.validation-history {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
}

.validation-history h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.no-history {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-left: 4px solid;
  transition: transform 0.2s ease;
}

.history-item:hover {
  transform: translateX(5px);
}

.history-item.success {
  border-left-color: #28a745;
}

.history-item.error {
  border-left-color: #dc3545;
}

.history-icon {
  font-size: 1.5rem;
  min-width: 30px;
  text-align: center;
}

.history-details {
  flex: 1;
}

.history-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.history-main strong {
  color: #333;
  font-size: 0.95rem;
}

.history-ticket {
  font-family: monospace;
  color: #666;
  font-size: 0.85rem;
}

.history-meta small {
  color: #999;
  font-size: 0.8rem;
}
/* **FIN ESTILOS ESCÁNER QR** */

.stat-badge {
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  padding: 8px 14px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(107, 144, 128, 0.3);
}

.stat-badge.success {
  background: linear-gradient(135deg, #6B9080, #4A6741);
}

.stat-badge.error {
  background: linear-gradient(135deg, #EF4444, #DC2626);
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(255,255,255,0.9);
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  color: white;
  font-weight: 700;
}

/* SECCIONES */
section {
  padding: 25px;
}

/* SCANNER */
.scanner-container {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin-bottom: 25px;
}

.scanner-header {
  text-align: center;
  margin-bottom: 25px;
}

.scanner-header h2 {
  margin: 0 0 10px 0;
  color: #1F2937;
  font-size: 1.6rem;
}

.scanner-subtitle {
  margin: 0;
  color: #6B7280;
  font-size: 0.95rem;
}

.scanner-wrapper {
  max-width: 500px;
  margin: 0 auto 25px auto;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 25px;
}

.quick-stat {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.quick-stat-icon {
  font-size: 2rem;
}

.quick-stat-label {
  margin: 0;
  font-size: 0.8rem;
  color: #6B7280;
  font-weight: 500;
}

.quick-stat-value {
  margin: 5px 0 0 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1F2937;
}

.recent-validations {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.recent-validations h3 {
  margin: 0 0 20px 0;
  color: #1F2937;
  font-size: 1.3rem;
}

.empty-message {
  text-align: center;
  padding: 40px 20px;
  color: #9CA3AF;
}

.validations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: #F9FAFB;
  transition: all 0.3s ease;
}

.validation-item:hover {
  transform: translateX(5px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.validation-item.success {
  border-left: 4px solid #10B981;
}

.validation-item.error {
  border-left: 4px solid #EF4444;
}

.validation-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
}

.validation-info {
  flex: 1;
}

.validation-name {
  margin: 0;
  font-weight: 600;
  color: #1F2937;
  font-size: 0.95rem;
}

.validation-time {
  margin: 3px 0 0 0;
  font-size: 0.8rem;
  color: #6B7280;
}

.validation-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.success {
  background: #D1FAE5;
  color: #6B9080;
}

.status-badge.error {
  background: #FEE2E2;
  color: #DC2626;
}

/* HISTORIAL */
.historial-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 25px;
  padding: 0 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.filtros {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #6B9080;
  box-shadow: 0 0 0 3px rgba(107, 144, 128, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #E5E7EB;
  border-top-color: #6B9080;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #6B7280;
  margin: 0 0 10px 0;
  font-size: 1.3rem;
}

.empty-state p {
  color: #9CA3AF;
  margin: 0;
}

.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.historial-table {
  width: 100%;
  border-collapse: collapse;
}

.historial-table thead {
  background: #F9FAFB;
}

.historial-table th {
  padding: 12px 15px;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 700;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #E5E7EB;
}

.historial-table td {
  padding: 15px;
  font-size: 0.9rem;
  color: #4B5563;
  border-bottom: 1px solid #E5E7EB;
}

.historial-table tbody tr {
  transition: all 0.2s;
}

.historial-table tbody tr:hover {
  background: #F9FAFB;
}

.row-success {
  border-left: 4px solid #10B981;
}

.row-error {
  border-left: 4px solid #EF4444;
}

.td-nombre {
  font-weight: 600;
  color: #1F2937;
}

.td-motivo {
  font-size: 0.85rem;
  color: #6B7280;
}

.tipo-badge {
  background: #DBEAFE;
  color: #1E40AF;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* ESTADÍSTICAS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.stat-card.success {
  border-left: 4px solid #10B981;
}

.stat-card.error {
  border-left: 4px solid #EF4444;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content h3 {
  margin: 0;
  font-size: 0.85rem;
  color: #6B7280;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-number {
  margin: 5px 0 0 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #1F2937;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chart-container h3 {
  margin: 0 0 25px 0;
  color: #1F2937;
  font-size: 1.2rem;
}

.simple-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
  gap: 8px;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #6B9080, #4A6741);
  border-radius: 8px 8px 0 0;
  position: relative;
  min-height: 30px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 8px;
  transition: all 0.3s ease;
}

.bar:hover {
  background: linear-gradient(180deg, #047857, #065F46);
  transform: scale(1.05);
}

.bar-value {
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
}

.bar-label {
  font-size: 0.8rem;
  color: #6B7280;
  font-weight: 600;
}

.pie-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 0;
}

.pie-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pie-color {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

.pie-item.success .pie-color {
  background: linear-gradient(135deg, #6B9080, #4A6741);
}

.pie-item.error .pie-color {
  background: linear-gradient(135deg, #EF4444, #DC2626);
}

.pie-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pie-label {
  font-size: 1rem;
  color: #4B5563;
  font-weight: 600;
}

.pie-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1F2937;
}

/* RESPONSIVE */
.mobile-menu-btn {
  display: none;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    width: 75%;
    max-width: 280px;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    padding-top: 60px;
  }
  
  .mobile-menu-btn {
    display: flex;
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 999;
    background: #6B9080;
    color: white;
    border: none;
    border-radius: 8px;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-size: 1.3rem;
  }
  
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
  
  .sidebar-overlay.active {
    display: block;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 15px 18px;
    position: sticky;
    top: 0;
  }
  
  .content-header h1 {
    font-size: 1.4rem;
    width: 100%;
  }
  
  .content-header h1 span {
    font-size: 1.3rem;
  }
  
  .header-stats {
    width: 100%;
  }
  
  .stat-badge {
    flex: 1;
    min-width: 100px;
    font-size: 0.75rem;
  }
  
  section {
    padding: 15px;
  }
  
  /* Scanner responsive */
  .scanner-area {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .camera-container {
    min-height: 300px;
    max-height: 400px;
  }
  
  .scanner-status {
    flex-direction: column;
    gap: 10px;
  }
  
  .status-indicator {
    width: 100%;
    justify-content: center;
  }
  
  .btn-toggle-scanner {
    width: 100%;
    padding: 14px;
  }
  
  .manual-input {
    order: 2;
  }
  
  .manual-input-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .manual-qr-input {
    width: 100%;
  }
  
  .btn-validate-manual {
    width: 100%;
  }
  
  .scan-instructions {
    font-size: 0.85rem;
    padding: 0 10px;
  }
  
  /* Stats y charts */
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
  }
  
  .simple-chart {
    height: 150px;
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  .historial-table {
    min-width: 600px;
  }
}

@media (max-width: 480px) {
  .sidebar-header h2 {
    font-size: 1.4rem;
  }
  
  .content-header {
    padding: 12px 15px;
  }
  
  .content-header h1 {
    font-size: 1.2rem;
  }
  
  .content-header h1 span {
    font-size: 1.1rem;
    gap: 8px;
  }
  
  .scanner-header h2 {
    font-size: 1.3rem;
  }
  
  .quick-stats {
    grid-template-columns: 1fr;
  }
  
  /* Scanner más compacto en móviles pequeños */
  .camera-container {
    min-height: 250px;
  }
  
  .scan-frame {
    width: 180px;
    height: 180px;
  }
  
  .scan-corner {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }
  
  .scanner-status {
    padding: 12px;
  }
  
  .status-text {
    font-size: 0.85rem;
  }
  
  .btn-toggle-scanner {
    font-size: 0.9rem;
    padding: 12px;
  }
  
  .manual-input h4 {
    font-size: 0.95rem;
  }
  
  .last-validation-info {
    font-size: 0.8rem;
    padding: 10px;
  }
  
  .validation-history h4 {
    font-size: 1rem;
  }
  
  .history-item {
    padding: 10px;
  }
  
  .history-main {
    font-size: 0.9rem;
  }
  
  .history-meta small {
    font-size: 0.75rem;
  }
}

/* Ajustes adicionales para mejor comportamiento en móviles/tablets */
@media (max-width: 1024px) {
  .main-content { 
    padding: 18px; 
  }
  
  .stat-badge { 
    padding: 6px 12px; 
  }
  
  .scanner-area {
    grid-template-columns: 1fr;
  }
}
</style>
