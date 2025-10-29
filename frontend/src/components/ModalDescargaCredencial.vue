<template>
  <Transition name="modal">
    <div v-if="mostrar" class="modal-overlay" @click.self="cerrar">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ titulo }}</h2>
        </div>
        
        <div class="modal-body">
          <!-- Estado: Generando -->
          <div v-if="estado === 'generando'" class="estado-generando">
            <div class="spinner-container">
              <div class="spinner"></div>
            </div>
            <p class="mensaje-principal">⚙️ Generando credencial...</p>
            <p class="mensaje-secundario">Por favor espera un momento</p>
          </div>
          
          <!-- Estado: Descargando -->
          <div v-else-if="estado === 'descargando'" class="estado-descargando">
            <div class="progress-container">
              <div class="checkmark-circle">
                <div class="checkmark"></div>
              </div>
            </div>
            <p class="mensaje-principal">📥 ¡Descarga iniciada!</p>
            <p class="mensaje-secundario">Tu credencial se está guardando...</p>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progreso + '%' }"></div>
            </div>
          </div>
          
          <!-- Estado: Completado -->
          <div v-else-if="estado === 'completado'" class="estado-completado">
            <div class="success-icon">✅</div>
            <p class="mensaje-principal">¡Credencial descargada!</p>
            <p class="mensaje-galeria">📱 Revisa tu galería o carpeta de descargas</p>
            <div class="archivo-info">
              <p class="nombre-archivo">{{ nombreArchivo }}</p>
            </div>
          </div>
          
          <!-- Estado: Error -->
          <div v-else-if="estado === 'error'" class="estado-error">
            <div class="error-icon">❌</div>
            <p class="mensaje-principal">Error al descargar</p>
            <p class="mensaje-error">{{ mensajeError }}</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            v-if="estado === 'completado' || estado === 'error'" 
            @click="cerrar" 
            class="btn-cerrar"
          >
            {{ estado === 'completado' ? '✓ ENTENDIDO' : 'CERRAR' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  mostrar: {
    type: Boolean,
    default: false
  },
  estado: {
    type: String,
    default: 'generando', // generando, descargando, completado, error
    validator: (value) => ['generando', 'descargando', 'completado', 'error'].includes(value)
  },
  nombreArchivo: {
    type: String,
    default: ''
  },
  mensajeError: {
    type: String,
    default: 'Ocurrió un error inesperado'
  }
})

const emit = defineEmits(['cerrar', 'actualizar:mostrar'])

const progreso = ref(0)

// Simular progreso de descarga
watch(() => props.estado, (nuevoEstado) => {
  if (nuevoEstado === 'descargando') {
    progreso.value = 0
    const intervalo = setInterval(() => {
      if (progreso.value < 100) {
        progreso.value += 10
      } else {
        clearInterval(intervalo)
      }
    }, 100) // Completa en ~1 segundo
  }
})

const titulo = ref('Descargando Credencial')

const cerrar = () => {
  emit('cerrar')
  emit('actualizar:mostrar', false)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  background: linear-gradient(135deg, #6B9080, #4A6741);
  padding: 25px;
  text-align: center;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.modal-body {
  padding: 40px 30px;
  text-align: center;
}

.spinner-container {
  margin-bottom: 25px;
  display: flex;
  justify-content: center;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #e0e0e0;
  border-top-color: #6B9080;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-container {
  margin-bottom: 25px;
  display: flex;
  justify-content: center;
}

.checkmark-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10B981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.4s ease-out;
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
}

@keyframes scaleIn {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.checkmark {
  width: 35px;
  height: 20px;
  border-left: 4px solid white;
  border-bottom: 4px solid white;
  transform: rotate(-45deg);
  margin-top: -5px;
  animation: drawCheck 0.3s ease-out 0.2s both;
}

@keyframes drawCheck {
  from {
    width: 0;
    height: 0;
  }
  to {
    width: 35px;
    height: 20px;
  }
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: bounceIn 0.5s ease-out;
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.error-icon {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: shake 0.5s ease-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.mensaje-principal {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 10px 0;
}

.mensaje-secundario {
  font-size: 1rem;
  color: #6B7280;
  margin: 0 0 20px 0;
}

.mensaje-galeria {
  font-size: 1.1rem;
  color: #059669;
  margin: 0 0 20px 0;
  font-weight: 600;
  background: #D1FAE5;
  padding: 15px;
  border-radius: 12px;
  border-left: 4px solid #10B981;
}

.mensaje-error {
  font-size: 0.95rem;
  color: #DC2626;
  margin: 0;
  background: #FEE2E2;
  padding: 12px;
  border-radius: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #E5E7EB;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6B9080, #10B981);
  border-radius: 10px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(107, 144, 128, 0.5);
}

.archivo-info {
  background: #F3F4F6;
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
}

.nombre-archivo {
  font-size: 0.85rem;
  color: #4B5563;
  margin: 0;
  font-family: monospace;
  word-break: break-all;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  justify-content: center;
}

.btn-cerrar {
  background: linear-gradient(135deg, #6B9080, #4A6741);
  color: white;
  border: none;
  padding: 14px 40px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(107, 144, 128, 0.3);
}

.btn-cerrar:hover {
  background: linear-gradient(135deg, #4A6741, #3a5233);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(107, 144, 128, 0.4);
}

.btn-cerrar:active {
  transform: translateY(0);
}

/* Transiciones del modal */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: translateY(30px) scale(0.95);
}

/* Responsive */
@media (max-width: 480px) {
  .modal-content {
    max-width: 95%;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
  
  .modal-body {
    padding: 30px 20px;
  }
  
  .mensaje-principal {
    font-size: 1.1rem;
  }
  
  .mensaje-secundario,
  .mensaje-galeria {
    font-size: 0.95rem;
  }
  
  .success-icon,
  .error-icon {
    font-size: 4rem;
  }
}
</style>
