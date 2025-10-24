<template>
  <div class="qr-result-overlay" @click="closeResult">
    <div class="qr-result-modal" @click.stop>
      <!-- QR VÁLIDO -->
      <div v-if="result.success" class="result-valid">
        <!-- Icono de éxito animado -->
        <div class="success-icon">
          <div class="checkmark-circle">
            <div class="checkmark"></div>
          </div>
        </div>
        
        <!-- VALIDACIÓN DE PERSONAL (TRABAJADOR/PARTICIPANTE) -->
        <div v-if="result.persona" class="personal-validation">
          <h2 class="result-title">✅ PERSONAL AUTORIZADO</h2>
          <p class="result-subtitle">Acceso permitido</p>
          
          <div class="ticket-info">
            <!-- Información de la persona -->
            <div class="info-section personal-section">
              <h3>{{ result.tipo === 'trabajador' ? '👷 TRABAJADOR' : '🎯 PARTICIPANTE' }}</h3>
              <div class="personal-card">
                <div class="personal-header">
                  <div class="personal-name">{{ result.persona.nombre }}</div>
                  <div class="personal-badge">{{ result.tipo?.toUpperCase() }}</div>
                </div>
                
                <div class="info-grid">
                  <div class="info-item" v-if="result.persona.ci">
                    <span class="label">CI:</span>
                    <span class="value">{{ result.persona.ci }}</span>
                  </div>
                  <div class="info-item" v-if="result.persona.area">
                    <span class="label">Área:</span>
                    <span class="value">{{ result.persona.area }}</span>
                  </div>
                  <div class="info-item" v-if="result.persona.telefono">
                    <span class="label">Teléfono:</span>
                    <span class="value">{{ result.persona.telefono }}</span>
                  </div>
                  <div class="info-item" v-if="result.persona.sexo">
                    <span class="label">Sexo:</span>
                    <span class="value">{{ result.persona.sexo }}</span>
                  </div>
                  <div class="info-item" v-if="result.persona.ocupacion">
                    <span class="label">Ocupación:</span>
                    <span class="value">{{ result.persona.ocupacion }}</span>
                  </div>
                  <div class="info-item" v-if="result.persona.ultimoAcceso">
                    <span class="label">Último Acceso:</span>
                    <span class="value">{{ formatDateTime(result.persona.ultimoAcceso) }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Información del sistema -->
            <div class="info-section">
              <h3>ℹ️ Información</h3>
              <div class="system-info">
                <p>✅ Acceso registrado exitosamente</p>
                <p>🕐 Próximo acceso disponible: Mañana a las 10:00 AM</p>
                <p v-if="result.validationDuration">⚡ Tiempo de validación: {{ result.validationDuration }}ms</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- VALIDACIÓN DE TICKET (EVENTO) -->
        <div v-else class="ticket-validation">
          <!-- ENTRADA SIMPLE (sin información de personas múltiples) -->
          <div v-if="result.validationType === 'entrada_simple'" class="simple-entry-validation">
            <h2 class="result-title">✅ ENTRADA VÁLIDA</h2>
            <p class="result-subtitle">Acceso Permitido</p>
            
            <div class="ticket-info">
              <div class="info-section simple-entry-card">
                <h3>🎫 Entrada Física</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Número:</span>
                    <span class="value">{{ result.entrada?.numero || result.entrada?.ticketNumber || 'N/A' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Tipo:</span>
                    <span class="value">{{ result.entrada?.tipo || 'Entrada General' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Estado:</span>
                    <span class="value status-active">✅ Validada</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Validado por:</span>
                    <span class="value">{{ result.validatedBy || usuario.username || 'Control' }}</span>
                  </div>
                </div>
                
                <div class="success-message">
                  <div class="message-icon">✅</div>
                  <div class="message-text">
                    <p class="message-main">Acceso Autorizado</p>
                    <p class="message-sub">La entrada ha sido registrada exitosamente</p>
                  </div>
                </div>
              </div>
              
              <!-- Información adicional -->
              <div class="info-section">
                <h3>📋 Información de Validación</h3>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Fecha/Hora:</span>
                    <span class="value">{{ formatDateTime(new Date()) }}</span>
                  </div>
                  <div class="info-item" v-if="result.validationDuration">
                    <span class="label">Tiempo de validación:</span>
                    <span class="value">{{ result.validationDuration }}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- TICKET DE EVENTO CON MÚLTIPLES ENTRADAS -->
          <div v-else>
          <h2 class="result-title">¡ENTRADA VÁLIDA!</h2>
          <p class="result-subtitle">Acceso permitido</p>
          
          <!-- Información del ticket -->
          <div class="ticket-info">
            <div class="info-section">
              <h3>🎫 Información del Ticket</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Número:</span>
                  <span class="value">{{ result.ticket?.ticketNumber || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Precio:</span>
                  <span class="value">{{ formatPrice(result.ticket?.price) }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Comprador:</span>
                  <span class="value">{{ result.ticket?.buyer?.name || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Email:</span>
                  <span class="value">{{ result.ticket?.buyer?.email || 'N/A' }}</span>
                </div>
              </div>
            </div>
          
          <!-- Información de entradas múltiples -->
          <div v-if="result.ticket?.totalEntries > 1" class="info-section entries-info">
            <h3>👥 Información de Entradas</h3>
            <div class="entries-summary">
              <div class="entry-count">
                <span class="count-number">{{ result.validation?.validatedCount || 1 }}</span>
                <span class="count-label">{{ (result.validation?.validatedCount || 1) === 1 ? 'Persona ingresó' : 'Personas ingresaron' }}</span>
              </div>
              
              <div class="entries-remaining">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: getProgressPercentage() + '%' }"></div>
                </div>
                <div class="progress-text">
                  <span class="used">{{ result.ticket.usedEntries || 0 }}</span> / 
                  <span class="total">{{ result.ticket.totalEntries || 1 }}</span> entradas utilizadas
                </div>
                <div v-if="result.ticket?.remainingEntries > 0" class="remaining-notice">
                  ⚠️ Quedan <strong>{{ result.ticket.remainingEntries }}</strong> entrada(s) disponibles
                </div>
                <div v-else class="all-used-notice">
                  ✅ Todas las entradas han sido utilizadas
                </div>
              </div>
            </div>
          </div>
          
          <!-- Información del evento -->
          <div class="info-section">
            <h3>🏟️ Evento</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Nombre:</span>
                <span class="value">{{ result.event?.name || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Ubicación:</span>
                <span class="value">{{ result.event?.location || 'N/A' }}</span>
              </div>
            </div>
          </div>
          
          <!-- Información de validación -->
          <div class="info-section">
            <h3>✅ Validación</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Validado por:</span>
                <span class="value">{{ result.validation?.validatedBy || 'N/A' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Fecha/Hora:</span>
                <span class="value">{{ formatDateTime(result.validation?.validatedAt) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Duración:</span>
                <span class="value">{{ result.validation?.duration }}ms</span>
              </div>
            </div>
          </div>
          </div>
          </div>
        </div>
      </div>
      
      <!-- QR INVÁLIDO -->
      <div v-else class="result-invalid">
        <!-- Icono de error animado -->
        <div class="error-icon">
          <div class="error-circle">
            <div class="error-x">
              <div class="x-line x-line1"></div>
              <div class="x-line x-line2"></div>
            </div>
          </div>
        </div>
        
        <!-- Título principal (dinámico según el tipo de error) -->
        <h2 class="result-title">{{ getErrorTitle() }}</h2>
        <p class="result-subtitle">{{ getErrorSubtitle() }}</p>
        
        <!-- Información de la persona si ya ingresó -->
        <div v-if="result.result === 'already_entered_today' && result.persona" class="person-info-warning">
          <div class="person-card">
            <div class="person-name">{{ result.persona.nombre }}</div>
            <div class="person-badge">{{ result.persona.tipo?.toUpperCase() }}</div>
            <div class="person-details">
              <span v-if="result.persona.ci">CI: {{ result.persona.ci }}</span>
              <span v-if="result.persona.area">{{ result.persona.area }}</span>
            </div>
            <div class="last-entry">
              <span class="label">Último ingreso:</span>
              <span class="value">{{ formatDateTime(result.persona.ultimoAcceso) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Información de entrada simple ya usada -->
        <div v-if="(result.estado === 'YA_USADA' || result.result === 'already_used') && result.entrada" class="person-info-warning">
          <div class="person-card">
            <div class="person-name">Entrada {{ result.entrada.numero }}</div>
            <div class="person-badge">YA UTILIZADA</div>
            <div class="person-details">
              <span v-if="result.entrada.tipo">Tipo: {{ result.entrada.tipo }}</span>
            </div>
            <div class="last-entry" v-if="result.entrada.fechaUso">
              <span class="label">Fecha de uso:</span>
              <span class="value">{{ formatDateTime(result.entrada.fechaUso) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Razón del error -->
        <div class="error-info">
          <div class="error-reason">
            <h3>🔍 Razón:</h3>
            <p class="error-message">{{ getErrorMessage(result.result) }}</p>
          </div>
          
          <!-- Detalles adicionales si los hay -->
          <div v-if="result.message" class="error-details">
            <h4>📋 Detalles:</h4>
            <p>{{ result.message }}</p>
          </div>
          
          <!-- Información adicional según el tipo de error -->
          <div v-if="result.usedAt || result.eventStart || result.eventEnd" class="additional-info">
            <div v-if="result.usedAt" class="info-item">
              <span class="label">Usado anteriormente:</span>
              <span class="value">{{ formatDateTime(result.usedAt) }}</span>
            </div>
            <div v-if="result.usedBy" class="info-item">
              <span class="label">Usado por:</span>
              <span class="value">{{ result.usedBy }}</span>
            </div>
            <div v-if="result.eventStart" class="info-item">
              <span class="label">Evento inicia:</span>
              <span class="value">{{ formatDateTime(result.eventStart) }}</span>
            </div>
            <div v-if="result.eventEnd" class="info-item">
              <span class="label">Evento termina:</span>
              <span class="value">{{ formatDateTime(result.eventEnd) }}</span>
            </div>
          </div>
          
          <!-- Timestamp del intento -->
          <div class="timestamp">
            <span class="label">🕐 Intento realizado:</span>
            <span class="value">{{ formatDateTime(new Date()) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Botón de cerrar -->
      <button class="close-button" @click="closeResult">
        <span>Continuar escaneando</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QRValidResult',
  props: {
    result: {
      type: Object,
      required: true
    }
  },
  emits: ['close'],
  methods: {
    closeResult() {
      this.$emit('close')
    },
    
    formatPrice(price) {
      if (!price) return 'N/A'
      return `${parseFloat(price).toFixed(2)} Bs`
    },
    
    formatDateTime(dateTime) {
      if (!dateTime) return 'N/A'
      const date = new Date(dateTime)
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },
    
    getErrorMessage(resultCode) {
      const messages = {
        'invalid_qr': 'El código QR no existe en el sistema',
        'already_used': 'Esta entrada ya fue utilizada',
        'already_entered_today': 'Esta persona ya registró su ingreso el día de hoy',
        'expired': 'La entrada ha expirado',
        'invalid_event': 'Esta entrada no pertenece a este evento',
        'event_not_started': 'El evento aún no ha comenzado',
        'event_finished': 'El evento ya ha terminado',
        'ticket_refunded': 'Esta entrada fue reembolsada',
        'access_denied': 'No tienes permisos para validar entradas',
        'inactive_status': 'Persona con estado inactivo o suspendido',
        'not_found': 'Código QR no encontrado en el sistema',
        'system_disabled': 'Sistema de control de acceso desactivado',
        'server_error': 'Error interno del servidor',
        // Estados específicos para entradas simples
        'NO_EXISTE': 'La entrada no existe en el sistema',
        'YA_USADA': 'Esta entrada ya fue utilizada anteriormente',
        'CANCELADA': 'Esta entrada ha sido cancelada',
        'TOKEN_INVALIDO': 'El código de entrada no es válido',
        'SIN_PERMISOS': 'No tienes permisos para validar entradas',
        'ERROR_SERVIDOR': 'Error al procesar la validación'
      }
      return messages[resultCode] || this.result.message || 'Error desconocido'
    },
    
    getErrorTitle() {
      // Usar título personalizado si viene del backend
      if (this.result.title) {
        return `⚠️ ${this.result.title}`
      }
      
      // Títulos específicos según el tipo de error
      const titles = {
        'already_entered_today': '⚠️ YA INGRESÓ HOY',
        'already_used': '⚠️ YA UTILIZADA',
        'inactive_status': '⚠️ ESTADO INACTIVO',
        'system_disabled': '⚠️ SISTEMA DESACTIVADO',
        'not_found': '❌ NO ENCONTRADO',
        'access_denied': '❌ ACCESO DENEGADO',
        'invalid_qr': '❌ QR INVÁLIDO',
        'expired': '❌ EXPIRADA',
        'invalid_event': '❌ EVENTO INCORRECTO',
        'event_not_started': '⏳ EVENTO NO INICIADO',
        'event_finished': '⏹️ EVENTO FINALIZADO',
        'ticket_refunded': '💰 REEMBOLSADA',
        // Títulos para entradas simples
        'NO_EXISTE': '❌ ENTRADA NO ENCONTRADA',
        'YA_USADA': '⚠️ ENTRADA YA UTILIZADA',
        'CANCELADA': '❌ ENTRADA CANCELADA',
        'TOKEN_INVALIDO': '❌ CÓDIGO INVÁLIDO',
        'SIN_PERMISOS': '❌ SIN PERMISOS',
        'ERROR_SERVIDOR': '⚠️ ERROR DEL SISTEMA'
      }
      
      return titles[this.result.result || this.result.estado] || '❌ ENTRADA INVÁLIDA'
    },
    
    getErrorSubtitle() {
      // Subtítulos específicos según el tipo de error
      const subtitles = {
        'already_entered_today': 'Ingreso ya registrado',
        'already_used': 'Acceso denegado',
        'inactive_status': 'Acceso denegado',
        'system_disabled': 'Acceso deshabilitado',
        'not_found': 'QR no reconocido',
        'access_denied': 'Sin permisos',
        'event_not_started': 'Aún no disponible',
        'event_finished': 'Evento terminado',
        // Subtítulos para entradas simples
        'NO_EXISTE': 'Entrada no registrada',
        'YA_USADA': 'No se puede volver a usar',
        'CANCELADA': 'Entrada anulada',
        'TOKEN_INVALIDO': 'Código no reconocido',
        'SIN_PERMISOS': 'Acceso restringido',
        'ERROR_SERVIDOR': 'Intente nuevamente'
      }
      
      return subtitles[this.result.result || this.result.estado] || 'Acceso denegado'
    },
    
    getProgressPercentage() {
      const total = this.result.ticket?.totalEntries || 1
      const used = this.result.ticket?.usedEntries || 0
      return Math.min(100, Math.max(0, (used / total) * 100))
    }
  },
  
  mounted() {
    // Agregar clase al body para prevenir scroll
    document.body.classList.add('modal-open')
    
    // No auto-cerrar automáticamente, dejar que el componente padre lo maneje
    // El DashboardControl cerrará después de 8 segundos (válidos) o 6 segundos (inválidos)
    // El DashboardAdmin puede tener su propio tiempo
  },
  
  beforeUnmount() {
    // Remover clase del body
    document.body.classList.remove('modal-open')
  }
}
</script>

<style scoped>
/* === OVERLAY Y MODAL PRINCIPAL === */
.qr-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 20px;
}

.qr-result-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-50px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* === RESULTADO VÁLIDO === */
.result-valid {
  text-align: center;
  color: #2d5016;
}

.success-icon {
  margin-bottom: 20px;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(45deg, #4caf50, #66bb6a);
  margin: 0 auto;
  position: relative;
  animation: successPulse 0.6s ease-out;
}

@keyframes successPulse {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.checkmark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 15px;
  border-left: 4px solid white;
  border-bottom: 4px solid white;
  transform: translate(-50%, -60%) rotate(-45deg);
  animation: checkmarkDraw 0.3s ease-out 0.3s both;
}

@keyframes checkmarkDraw {
  from {
    width: 0;
    height: 0;
  }
  to {
    width: 30px;
    height: 15px;
  }
}

.result-valid .result-title {
  color: #2e7d32;
  font-size: 2.2em;
  font-weight: bold;
  margin: 10px 0;
  animation: titleFadeIn 0.5s ease-out 0.4s both;
}

.result-valid .result-subtitle {
  color: #4caf50;
  font-size: 1.2em;
  margin-bottom: 30px;
  animation: titleFadeIn 0.5s ease-out 0.5s both;
}

/* === RESULTADO INVÁLIDO === */
.result-invalid {
  text-align: center;
  color: #c62828;
}

.error-icon {
  margin-bottom: 20px;
}

.error-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(45deg, #f44336, #ef5350);
  margin: 0 auto;
  position: relative;
  animation: errorPulse 0.6s ease-out;
}

@keyframes errorPulse {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.error-x {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.x-line {
  position: absolute;
  width: 30px;
  height: 4px;
  background: white;
  border-radius: 2px;
  animation: xLineDraw 0.3s ease-out 0.3s both;
}

.x-line1 {
  transform: rotate(45deg);
}

.x-line2 {
  transform: rotate(-45deg);
}

@keyframes xLineDraw {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 30px;
    opacity: 1;
  }
}

.result-invalid .result-title {
  color: #c62828;
  font-size: 2.2em;
  font-weight: bold;
  margin: 10px 0;
  animation: titleFadeIn 0.5s ease-out 0.4s both;
}

.result-invalid .result-subtitle {
  color: #f44336;
  font-size: 1.2em;
  margin-bottom: 30px;
  animation: titleFadeIn 0.5s ease-out 0.5s both;
}

@keyframes titleFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === INFORMACIÓN DEL TICKET === */
.ticket-info {
  text-align: left;
  animation: infoSlideIn 0.5s ease-out 0.6s both;
}

.info-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #4caf50;
}

/* === ESTILOS PARA ENTRADA SIMPLE === */
.simple-entry-validation {
  text-align: center;
}

.simple-entry-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 3px solid #4caf50;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(76, 175, 80, 0.2);
}

.simple-entry-card h3 {
  color: #2e7d32;
  font-size: 1.3em;
  margin-bottom: 20px;
  font-weight: 700;
}

.status-active {
  color: #2e7d32;
  font-weight: 700;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-top: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.message-icon {
  font-size: 3em;
  line-height: 1;
  animation: iconBounce 0.6s ease-out;
}

@keyframes iconBounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.message-text {
  text-align: left;
  flex: 1;
}

.message-main {
  font-size: 1.4em;
  font-weight: 700;
  color: #2e7d32;
  margin: 0 0 5px 0;
}

.message-sub {
  font-size: 1em;
  color: #555;
  margin: 0;
}

/* Estilos específicos para personal autorizado */
.personal-section {
  border-left-color: #2196F3;
}

.personal-card {
  background: white;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
}

.personal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.personal-name {
  font-size: 1.5em;
  font-weight: 700;
  color: #2196F3;
}

.personal-badge {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 700;
  letter-spacing: 1px;
}

.system-info {
  background: white;
  padding: 15px;
  border-radius: 8px;
}

.system-info p {
  margin: 8px 0;
  color: #555;
  font-size: 0.95em;
  line-height: 1.6;
}

.info-section h3 {
  color: #2e7d32;
  font-size: 1.1em;
  margin-bottom: 15px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-weight: 600;
  color: #555;
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.value {
  color: #333;
  font-size: 1em;
  font-weight: 500;
}

/* === INFORMACIÓN DE ENTRADAS MÚLTIPLES === */
.entries-info {
  background: linear-gradient(135deg, #f8f9ff, #e8f4fd);
  border: 2px solid #4caf50;
  border-radius: 12px;
  padding: 20px;
}

.entries-summary {
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: center;
}

.entry-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.count-number {
  font-size: 2.5em;
  font-weight: bold;
  color: #4caf50;
  line-height: 1;
}

.count-label {
  font-size: 1.1em;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.entries-remaining {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #66bb6a);
  border-radius: 6px;
  transition: width 0.6s ease-out;
  animation: progressFill 0.8s ease-out;
}

.progress-text {
  font-size: 1em;
  font-weight: 600;
  color: #555;
}

.used {
  color: #4caf50;
  font-weight: bold;
}

.total {
  color: #333;
  font-weight: bold;
}

.remaining-notice {
  background: #fff3cd;
  color: #856404;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ffeaa7;
  font-weight: 600;
  font-size: 0.95em;
}

.all-used-notice {
  background: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #c3e6cb;
  font-weight: 600;
  font-size: 0.95em;
}

@keyframes progressFill {
  from {
    width: 0;
  }
  to {
    width: var(--progress-width, 0%);
  }
}

/* === INFORMACIÓN DE ERROR === */
.error-info {
  text-align: left;
  animation: infoSlideIn 0.5s ease-out 0.6s both;
}

/* Tarjeta de persona para "ya ingresó" */
.person-info-warning {
  margin: 20px 0;
  animation: fadeInScale 0.5s ease-out 0.4s both;
}

.person-card {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border: 2px solid #ffc107;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2);
}

.person-name {
  font-size: 1.4em;
  font-weight: 700;
  color: #f57f17;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.person-badge {
  display: inline-block;
  background: #ffa000;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.person-details {
  display: flex;
  gap: 15px;
  color: #f57f17;
  font-size: 0.95em;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.person-details span {
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 500;
}

.last-entry {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  padding: 10px 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.last-entry .label {
  color: #e65100;
  font-weight: 600;
  font-size: 0.9em;
}

.last-entry .value {
  color: #f57f17;
  font-weight: 700;
  font-size: 0.95em;
}

.error-reason {
  background: #ffebee;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 4px solid #f44336;
}

.error-reason h3 {
  color: #c62828;
  font-size: 1.1em;
  margin-bottom: 10px;
  font-weight: 600;
}

.error-message {
  color: #d32f2f;
  font-size: 1.1em;
  font-weight: 500;
  margin: 0;
}

.error-details {
  background: #fff3e0;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  border-left: 4px solid #ff9800;
}

.error-details h4 {
  color: #f57c00;
  font-size: 1em;
  margin-bottom: 8px;
  font-weight: 600;
}

.additional-info {
  background: #f3e5f5;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  border-left: 4px solid #9c27b0;
}

.timestamp {
  background: #e8f5e8;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9em;
}

@keyframes infoSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === BOTÓN DE CERRAR === */
.close-button {
  width: 100%;
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 15px 30px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
  animation: buttonFadeIn 0.5s ease-out 0.7s both;
}

.close-button:hover {
  background: linear-gradient(45deg, #1565c0, #2196f3);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(25, 118, 210, 0.4);
}

@keyframes buttonFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .qr-result-modal {
    padding: 30px 20px;
    margin: 10px;
    border-radius: 15px;
  }
  
  .result-title {
    font-size: 1.8em !important;
  }
  
  .result-subtitle {
    font-size: 1.1em !important;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .checkmark-circle,
  .error-circle {
    width: 60px;
    height: 60px;
  }
  
  .checkmark {
    width: 22px;
    height: 11px;
  }
  
  .x-line {
    width: 22px;
  }
}

@media (max-width: 480px) {
  .qr-result-overlay {
    padding: 10px;
  }
  
  .qr-result-modal {
    padding: 25px 15px;
  }
  
  .result-title {
    font-size: 1.6em !important;
  }
}
</style>

<style>
/* Prevenir scroll del body cuando el modal está abierto */
body.modal-open {
  overflow: hidden;
}
</style>