<template>
  <div class="registro-feipobol">
    <!-- Header FEIPOBOL -->
    <header class="header-feipobol">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="FEIPOBOL Logo" class="logo-img" />
        <div class="header-text">
          <h1>FEIPOBOL</h1>
          <p>EN EL BICENTENARIO DE BOLIVIA 🇧🇴</p>
        </div>
      </div>
    </header>

    <div class="contenido-formulario">
      <!-- Formulario izquierda -->
      <div class="formulario-card">
        <div class="titulo-con-regalos">
          <span class="emoji-regalo">🎁</span>
          <h2 class="titulo-formulario">FORMULARIO DE REGISTRO<br />SORTEOS!!!</h2>
          <span class="emoji-regalo">🎁</span>
        </div>
        <div class="linea-decorativa"></div>

        <!-- Mensaje de cargando -->
        <div v-if="cargandoEstado" class="alerta-cargando">
          <div class="spinner"></div>
          <p>Verificando disponibilidad del formulario...</p>
        </div>

        <!-- Mensaje de formulario bloqueado -->
        <div v-else-if="formularioBloqueado" class="alerta-bloqueado">
          <div class="icono-bloqueado">🎉</div>
          <h3>¡Los Sorteos Comienzan Mañana! 🎊</h3>
          <p>¡Prepárate para ganar increíbles premios en FEIPOBOL 2025! 🎁</p>
          <p>Los registros abrirán muy pronto. ¡Vuelve mañana y participa! 🚀✨</p>
        </div>

        <form v-else @submit.prevent="enviarFormulario" class="form-feipobol">
          <div class="form-group">
            <label>Nombre(s): <span class="requerido">*</span></label>
            <div class="input-con-icono">
              <input 
                ref="nombreInput"
                v-model="formData.nombre" 
                type="text" 
                placeholder="Tu nombre aquí"
                required
                class="form-control"
                :class="{ 'input-error': errores.nombre, 'input-valido': formData.nombre.trim() && !errores.nombre }"
                @input="validarNombre"
                @blur="validarNombre"
                autofocus
              />
              <span v-if="formData.nombre.trim() && !errores.nombre" class="icono-validacion valido">✓</span>
              <span v-if="errores.nombre" class="icono-validacion error">✗</span>
            </div>
            <span v-if="errores.nombre" class="mensaje-error">{{ errores.nombre }}</span>
          </div>

          <div class="form-group">
            <label>Apellido(s): <span class="requerido">*</span></label>
            <div class="input-con-icono">
              <input 
                ref="apellidoInput"
                v-model="formData.apellido" 
                type="text" 
                placeholder="Tu apellido aquí"
                required
                class="form-control"
                :class="{ 'input-error': errores.apellido, 'input-valido': formData.apellido.trim() && !errores.apellido }"
                @input="validarApellido"
                @blur="validarApellido"
              />
              <span v-if="formData.apellido.trim() && !errores.apellido" class="icono-validacion valido">✓</span>
              <span v-if="errores.apellido" class="icono-validacion error">✗</span>
            </div>
            <span v-if="errores.apellido" class="mensaje-error">{{ errores.apellido }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Número de CI: <span class="requerido">*</span></label>
              <div class="input-con-icono">
                <input 
                  ref="ciInput"
                  v-model="formData.ci" 
                  type="text" 
                  placeholder="Ej: 1234567-1A"
                  @input="aplicarMascaraCI"
                  @blur="validarCI"
                  maxlength="11"
                  required
                  inputmode="numeric"
                  class="form-control"
                  :class="{ 'input-error': errores.ci, 'input-valido': formData.ci && !errores.ci }"
                />
                <span v-if="formData.ci && !errores.ci" class="icono-validacion valido">✓</span>
                <span v-if="errores.ci" class="icono-validacion error">✗</span>
              </div>
              <span v-if="errores.ci" class="mensaje-error">{{ errores.ci }}</span>
              <span v-else class="mensaje-ayuda">7-8 dígitos (se agregará guión automático)</span>
            </div>

            <div class="form-group">
              <label>Número de Celular: <span class="requerido">*</span></label>
              <div class="input-con-icono">
                <input 
                  ref="telefonoInput"
                  v-model="formData.telefono" 
                  type="tel" 
                  placeholder="Ej: 71234567"
                  @input="aplicarMascaraTelefono"
                  @blur="validarCelular"
                  maxlength="8"
                  required
                  inputmode="tel"
                  class="form-control"
                  :class="{ 'input-error': errores.telefono, 'input-valido': formData.telefono.length === 8 && !errores.telefono }"
                />
                <span v-if="formData.telefono.length === 8 && !errores.telefono" class="icono-validacion valido">✓</span>
                <span v-if="errores.telefono" class="icono-validacion error">✗</span>
              </div>
              <span v-if="errores.telefono" class="mensaje-error">{{ errores.telefono }}</span>
              <span v-else class="mensaje-ayuda">8 dígitos, inicia con 6 o 7</span>
            </div>
          </div>

          <div class="form-group zona-group">
            <label>Zona de Residencia: <span class="requerido">*</span></label>
            <div class="input-con-icono">
              <input 
                v-model="busquedaZona" 
                type="text" 
                placeholder="Buscar zona de residencia..."
                required
                class="buscador-zona form-control"
                :class="{ 'input-valido': formData.zona }"
                @focus="mostrarListaZonas = true"
                @input="mostrarListaZonas = true"
                @blur="ocultarListaZonas"
              />
              <span v-if="formData.zona" class="icono-validacion valido">✓</span>
            </div>
            <div v-if="mostrarListaZonas && zonasFiltradas.length > 0" class="lista-zonas">
              <div 
                v-for="zona in zonasFiltradas" 
                :key="zona" 
                class="zona-item"
                @mousedown="seleccionarZona(zona)"
              >
                {{ zona }}
              </div>
            </div>
            <div v-if="mostrarListaZonas && busquedaZona && zonasFiltradas.length === 0" class="zona-no-encontrada">
              No se encontró la zona "{{ busquedaZona }}"
            </div>
            <span class="mensaje-ayuda">
              💡 Si no encuentra su zona, seleccione <strong>"OTRA"</strong> para elegir un departamento de Bolivia
            </span>
          </div>

          <div class="form-group">
            <label>Correo Electrónico:</label>
            <div class="input-con-icono">
              <input 
                v-model="formData.correo" 
                type="email" 
                placeholder="tucorreo@email.com (opcional)"
                inputmode="email"
                class="form-control"
                :class="{ 
                  'input-error': errores.correo, 
                  'input-valido': formData.correo.trim() && !errores.correo 
                }"
                @input="validarCorreo"
                @blur="validarCorreo"
              />
              <span v-if="formData.correo.trim() && !errores.correo" class="icono-validacion valido">✓</span>
              <span v-if="errores.correo" class="icono-validacion error">✗</span>
            </div>
            <p v-if="errores.correo" class="mensaje-error">{{ errores.correo }}</p>
          </div>

          <div class="form-actions">
            <button 
              type="submit" 
              :disabled="enviando" 
              class="btn-enviar"
            >
              <span v-if="!enviando">ENVIAR DATOS 😃</span>
              <span v-else class="loading">
                <span class="spinner"></span>
                Registrando...
              </span>
            </button>
          </div>

          <div class="info-adicional">
            <p>• Todos los campos con <span class="requerido">*</span> son obligatorios</p>
            <p>• El correo electrónico es opcional</p>
            <p>• CI: 7-8 dígitos (puede incluir complemento Ej: 1234567-1A)</p>
            <p>• Celular: 8 dígitos, debe iniciar con 6 o 7 (Ej: 71234567)</p>
            <p class="info-premio">🎁 <strong>Importante:</strong> Para reclamar tu premio, deberás presentar tu documento de identidad (CI) o registrar el mismo número de celular usado en este formulario</p>
          </div>
        </form>

        <!-- Mensajes de estado -->
        <div v-if="mensaje.texto" :class="['mensaje', mensaje.tipo]">
          <div class="mensaje-contenido">
            <span class="mensaje-icono">{{ mensaje.tipo === 'error' ? '❌' : '✅' }}</span>
            <span>{{ mensaje.texto }}</span>
          </div>
          <button @click="cerrarMensaje" class="btn-cerrar-mensaje">×</button>
        </div>
      </div>

      <!-- Sección derecha con logo -->
      <div class="seccion-logo">
        <div class="logo-contenedor-derecha">
          <img src="@/assets/logo.png" alt="Cerro Rico de Potosí" class="logo-principal" />
        </div>
      </div>
    </div>

    <!-- Modal de éxito -->
    <div v-if="mostrarModalExito" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-exito">
        <div class="modal-header">
          <h3>🎉 ¡Registro Exitoso!</h3>
          <button @click="cerrarModal" class="btn-cerrar-modal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="info-registro">
            <h4>📋 Información del Registro</h4>
            <div class="datos-registro">
              <p><strong>Nombre:</strong> {{ registroExitoso?.nombre }} {{ registroExitoso?.apellido }}</p>
              <p><strong>N° de Sorteo:</strong> <span class="numero-sorteo">#{{ registroExitoso?.numeroSorteo }}</span></p>
              <p><strong>Fecha:</strong> {{ formatearFecha(registroExitoso?.fechaRegistro) }}</p>
            </div>
          </div>

          <div v-if="registroExitoso?.qrCode" class="qr-section">
            <h4>📱 Tu Código QR</h4>
            <div class="qr-container">
              <img :src="'data:image/png;base64,' + registroExitoso.qrCode" alt="Código QR" class="qr-image"/>
              <p class="qr-info">Guarda este código QR para futuros eventos</p>
            </div>
            
            <div class="qr-actions">
              <button @click="descargarQR" class="btn-descargar">
                💾 Descargar QR
              </button>
              <button @click="imprimirBoleto" class="btn-imprimir">
                🖨️ Imprimir Boleto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Premio GANADOR -->
    <div v-if="mostrarModalPremio && premioInfo" class="modal-overlay" @click.self="cerrarModalPremio">
      <div ref="modalGanador" class="modal-ganador-simple">
        <canvas ref="canvasConfeti" class="canvas-confeti"></canvas>
        <button @click="cerrarModalPremio" class="btn-cerrar-simple">×</button>
        
        <div class="contenido-ganador-simple">
          <div class="numero-registro-pequeño">N° de Registro: #{{ registroExitoso?.numeroSorteo }}</div>
          <div class="icono-ganador">🎉</div>
          <h1 class="titulo-ganaste">¡GANASTE!</h1>
          <h2 class="nombre-ganador-simple">{{ registroExitoso?.nombre }} {{ registroExitoso?.apellido }}</h2>
          
          <div class="info-ganador">
            <div class="info-item destacado">
              <span class="label">Premio:</span>
              <span class="value">{{ premioInfo?.nombrePremio }}</span>
            </div>
          </div>
          
          <p class="firma-feipobol">FEIPOBOL 2025</p>
          
          <button @click="descargarBoletoGanador" class="btn-descargar-ganador">
            📥 Descargar Boleto
          </button>
        </div>
      </div>
    </div>

    <!-- Modal simple para NO GANADOR -->
    <div v-if="mostrarModalPremio && !premioInfo" class="modal-overlay" @click.self="cerrarModalPremio">
      <div class="modal-perdedor-simple">
        <button @click="cerrarModalPremio" class="btn-cerrar-simple">×</button>
        
        <!-- Canvas para confeti suave -->
        <canvas ref="canvasConfetiPerdedor" class="confeti-canvas-perdedor"></canvas>
        
        <div class="contenido-perdedor">
          <div class="numero-registro-pequeño">N° de Registro: #{{ registroExitoso?.numeroSorteo }}</div>
          <div class="icono-perdedor">🎊</div>
          <h1 class="titulo-principal-perdedor">¡Gracias por Participar!</h1>
          <h2 class="titulo-perdedor">{{ registroExitoso?.nombre }},</h2>
          <p class="mensaje-motivacional">{{ mensajeMotivacional }}</p>
          <p class="firma-feipobol">FEIPOBOL 2025</p>
          
          <button @click="cerrarModalPremio" class="btn-cerrar-perdedor">
            Aceptar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Departamentos -->
    <div v-if="mostrarModalDepartamentos" class="modal-overlay" @click="cerrarModalDepartamentos">
      <div class="modal-departamentos" @click.stop>
        <button @click="cerrarModalDepartamentos" class="btn-cerrar-simple">×</button>
        
        <div class="contenido-departamentos">
          <h2 class="titulo-departamentos">🇧🇴 Seleccione su Departamento</h2>
          <p class="subtitulo-departamentos">Elija el departamento donde reside</p>
          
          <div class="grid-departamentos">
            <button
              v-for="depto in departamentosBolivia"
              :key="depto.nombre"
              @click="seleccionarDepartamento(depto.nombre)"
              class="btn-departamento"
            >
              <span class="emoji-depto">{{ depto.emoji }}</span>
              <span class="nombre-depto">{{ depto.nombre }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { feipobolService, configuracionService } from '@/services/api.js'
import confetti from 'canvas-confetti'

// Referencias a inputs para auto-scroll
const nombreInput = ref(null)
const apellidoInput = ref(null)
const ciInput = ref(null)
const telefonoInput = ref(null)

// Referencias del modal de ganador
const modalGanador = ref(null)
const canvasConfeti = ref(null)
const canvasConfetiPerdedor = ref(null)

// Estado reactivo
const enviando = ref(false)
const mostrarModalExito = ref(false)
const mostrarModalPremio = ref(false)
const registroExitoso = ref(null)
const premioInfo = ref(null)
const mensajeMotivacional = ref('')

// Control de formulario bloqueado
const formularioBloqueado = ref(false)
const cargandoEstado = ref(true)

// Mensajes motivacionales aleatorios
const mensajesMotivacionales = [
  '¡Sigue adelante! La próxima puede ser tuya',
  '¡Tu momento llegará! Disfruta la feria',
  '¡Gracias por participar! La suerte está de tu lado',
  '¡No te rindas! Grandes cosas vienen en camino',
  '¡Eres increíble! Sigue participando',
  '¡Tu energía positiva te traerá suerte!',
  '¡Cada participación cuenta! Sigue así',
  '¡La perseverancia siempre gana!',
  '¡Tu día de suerte está cerca!',
  '¡Gracias por ser parte de esta feria!',
  '¡Tu entusiasmo es contagioso!',
  '¡Sigue creyendo en ti!',
  '¡Las mejores cosas toman tiempo!',
  '¡Tu actitud positiva es tu mejor premio!',
  '¡Cada intento te acerca más al éxito!',
  '¡Eres un campeón por participar!',
  '¡Tu suerte está por cambiar!',
  '¡Gracias por tu participación!',
  '¡Disfruta cada momento de la feria!',
  '¡Tu sonrisa es tu mejor premio!'
]

const obtenerMensajeAleatorio = () => {
  const indice = Math.floor(Math.random() * mensajesMotivacionales.length)
  return mensajesMotivacionales[indice]
}

// Función para lanzar confeti dentro del modal
const lanzarConfeti = () => {
  if (!canvasConfeti.value) return

  // Crear instancia de confetti para este canvas específico
  const miConfetti = confetti.create(canvasConfeti.value, {
    resize: true,
    useWorker: true
  })

  const duracion = 4000 // 4 segundos
  const fin = Date.now() + duracion

  const colores = ['#FFD700', '#FFA500', '#FF6B35', '#FF8C00', '#FFFF00']

  const lanzar = () => {
    // Confeti desde la izquierda
    miConfetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: colores,
      gravity: 0.8,
      scalar: 1.2
    })
    
    // Confeti desde la derecha
    miConfetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: colores,
      gravity: 0.8,
      scalar: 1.2
    })

    if (Date.now() < fin) {
      requestAnimationFrame(lanzar)
    }
  }

  lanzar()

  // Explosión central grande
  setTimeout(() => {
    miConfetti({
      particleCount: 80,
      spread: 100,
      origin: { x: 0.5, y: 0.4 },
      colors: colores,
      gravity: 1,
      scalar: 1.5
    })
  }, 200)

  // Explosión adicional después de 1 segundo
  setTimeout(() => {
    miConfetti({
      particleCount: 60,
      spread: 80,
      origin: { x: 0.5, y: 0.5 },
      colors: colores,
      gravity: 0.9,
      scalar: 1.3
    })
  }, 1000)
}

// Función para lanzar confeti suave (modal perdedor)
const lanzarConfetiSuave = () => {
  if (!canvasConfetiPerdedor.value) return

  // Crear instancia de confetti para este canvas específico
  const miConfetti = confetti.create(canvasConfetiPerdedor.value, {
    resize: true,
    useWorker: true
  })

  const duracion = 3000 // 3 segundos (más corto)
  const fin = Date.now() + duracion

  // Colores pastel suaves y motivadores
  const colores = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#E0BBE4', '#FFC9DE']

  const lanzar = () => {
    // Confeti suave desde arriba (como lluvia ligera)
    miConfetti({
      particleCount: 2,
      angle: 90,
      spread: 60,
      origin: { x: Math.random(), y: 0 },
      colors: colores,
      gravity: 0.6,
      scalar: 0.8,
      drift: Math.random() * 0.5 - 0.25
    })

    if (Date.now() < fin) {
      requestAnimationFrame(lanzar)
    }
  }

  lanzar()

  // Explosión suave inicial
  setTimeout(() => {
    miConfetti({
      particleCount: 40,
      spread: 70,
      origin: { x: 0.5, y: 0.5 },
      colors: colores,
      gravity: 0.7,
      scalar: 0.9
    })
  }, 100)
}

// Watcher para lanzar confeti cuando aparece un ganador
watch([mostrarModalPremio, premioInfo], ([mostrar, premio]) => {
  if (mostrar && premio) {
    // Lanzar confeti después de que el modal esté visible
    setTimeout(() => {
      lanzarConfeti()
    }, 100)
  } else if (mostrar && !premio) {
    // Lanzar confeti suave para no ganador
    setTimeout(() => {
      lanzarConfetiSuave()
    }, 100)
  }
})

// Zonas de Potosí
const busquedaZona = ref('')
const mostrarListaZonas = ref(false)
const mostrarModalDepartamentos = ref(false)

const departamentosBolivia = [
  { nombre: 'La Paz', emoji: '🏔️' },
  { nombre: 'Cochabamba', emoji: '🌄' },
  { nombre: 'Santa Cruz', emoji: '🌴' },
  { nombre: 'Potosí', emoji: '⛰️' },
  { nombre: 'Oruro', emoji: '🎭' },
  { nombre: 'Chuquisaca', emoji: '🏛️' },
  { nombre: 'Tarija', emoji: '🍇' },
  { nombre: 'Beni', emoji: '🌿' },
  { nombre: 'Pando', emoji: '🌳' }
]

const zonasDisponibles = [
  'Centro Histórico',
  'Plan 40',
  'Las Lecherías',
  'Ciudad Satélite',
  'Villa Copacabana',
  'Cantumarca',
  'Zona Huachacalla',
  'San Pedro',
  'San Benito',
  'San Gerardo',
  'Zona Alta',
  'Pampa Ingenio',
  'Villa Santiago',
  'Villa Venezuela',
  'Villa Santa Fe',
  'Chapini',
  'Villa Tomás Frías',
  'Villa Imperial',
  'Villa Unificada',
  'Villa Magisterio',
  'San Antonio',
  'Villa Concepción',
  'Villa Costanera',
  'Alto Potosí',
  'San Clemente',
  'Villa Colón',
  'San Ildefonso',
  'Cervecería',
  'Campamento Pailaviri',
  'Manquiri',
  'Calvario',
  'San Cristóbal',
  'San Roque',
  'San Lorenzo',
  'Mercado Central',
  'Alto de la Luna',
  'Lomas de la Vega',
  'Villa Fátima',
  'Villa Banzer',
  'Santa Bárbara',
  'Ciudadela',
  'Universitaria',
  'Villa Huanuni',
  'Chiripujio',
  'Porco',
  'Bolívar',
  'Simón Bolívar',
  '23 de Marzo',
  'Magisterio',
  'Ferroviaria',
  'Mineros San Juan',
  'Jaime Paz Zamora',
  'Villa Fátima Norte',
  'Villa Fátima Sud',
  'Villa Armonía',
  'Villa Rosario',
  'Valle Hermoso',
  '4 de Julio',
  'Barrio Minero',
  'Barrio Cívico',
  'Barrio Petrolero',
  'Zona Norte',
  'Zona Sud',
  'Zona Este',
  'Zona Oeste',
  'Otra'
]

const zonasFiltradas = computed(() => {
  if (!busquedaZona.value) {
    return zonasDisponibles
  }
  return zonasDisponibles.filter(zona => 
    zona.toLowerCase().includes(busquedaZona.value.toLowerCase())
  )
})

const seleccionarZona = (zona) => {
  if (zona.toLowerCase() === 'otra') {
    // Abrir modal de departamentos
    mostrarModalDepartamentos.value = true
    mostrarListaZonas.value = false
  } else {
    formData.zona = zona
    busquedaZona.value = zona
    mostrarListaZonas.value = false
  }
}

const seleccionarDepartamento = (departamento) => {
  formData.zona = departamento
  busquedaZona.value = departamento
  mostrarModalDepartamentos.value = false
}

const cerrarModalDepartamentos = () => {
  mostrarModalDepartamentos.value = false
}

const ocultarListaZonas = () => {
  setTimeout(() => {
    mostrarListaZonas.value = false
  }, 200)
}

const mensaje = reactive({
  texto: '',
  tipo: '' // 'error' | 'exito'
})

const formData = reactive({
  nombre: '',
  apellido: '',
  ci: '',
  zona: '',
  telefono: '',
  correo: ''
})

// Errores de validación
const errores = reactive({
  nombre: '',
  apellido: '',
  ci: '',
  telefono: '',
  correo: ''
})

// Métodos de validación
const validarCI = () => {
  const ci = formData.ci.trim()
  
  // Si está vacío, no mostrar error (es opcional)
  if (!ci || ci.length === 0) {
    errores.ci = ''
    return true
  }
  
  // Formato flexible: 7-8 dígitos, opcionalmente seguido de guion y complemento
  // Acepta: 1234567, 12345678, 1234567-1, 1234567-1A, 1234567-A, etc.
  const regexCI = /^\d{7,8}(-[A-Z0-9]+)?$/i
  
  if (!regexCI.test(ci)) {
    errores.ci = 'Debe tener 7-8 dígitos (puede incluir complemento como 1234567-1A)'
    return false
  } else {
    errores.ci = ''
    return true
  }
}

const validarCelular = () => {
  const telefono = formData.telefono.trim()
  
  // Solo validar si el usuario ha empezado a escribir
  if (!telefono || telefono.length === 0) {
    errores.telefono = ''
    return true // No mostrar error si está vacío
  }
  
  // Debe tener exactamente 8 dígitos
  if (telefono.length !== 8) {
    errores.telefono = 'Debe tener 8 dígitos'
    return false
  }
  
  // Debe comenzar con 6 o 7
  if (!telefono.startsWith('6') && !telefono.startsWith('7')) {
    errores.telefono = 'Debe comenzar con 6 o 7'
    return false
  }
  
  errores.telefono = ''
  return true
}

// Validación de nombre
const validarNombre = () => {
  if (!formData.nombre.trim()) {
    errores.nombre = 'El nombre es obligatorio'
    return false
  }
  if (formData.nombre.trim().length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres'
    return false
  }
  errores.nombre = ''
  return true
}

// Validación de apellido
const validarApellido = () => {
  if (!formData.apellido.trim()) {
    errores.apellido = 'El apellido es obligatorio'
    return false
  }
  if (formData.apellido.trim().length < 2) {
    errores.apellido = 'El apellido debe tener al menos 2 caracteres'
    return false
  }
  errores.apellido = ''
  return true
}

// Máscara para CI - Auto-formato con guión
const aplicarMascaraCI = () => {
  // Remover todo excepto números y letras
  let valor = formData.ci.replace(/[^0-9A-Za-z]/g, '')
  
  // Si tiene más de 7 caracteres, insertar guión antes del último carácter
  if (valor.length > 7) {
    // Separar: primeros caracteres (solo números) y último (complemento)
    const numeros = valor.substring(0, valor.length - 1).replace(/[^0-9]/g, '')
    const complemento = valor.substring(valor.length - 1)
    formData.ci = numeros + '-' + complemento
  } else {
    // Solo números si tiene 7 o menos caracteres
    formData.ci = valor.replace(/[^0-9]/g, '')
  }
  // Validar en tiempo real
  validarCI()
}

// Máscara para teléfono - Solo números, máximo 8
const aplicarMascaraTelefono = () => {
  // Permitir solo números y limitar a 8 dígitos
  formData.telefono = formData.telefono.replace(/[^0-9]/g, '').substring(0, 8)
  // Validar en tiempo real
  validarCelular()
}

// Validación de correo electrónico
const validarCorreo = () => {
  const correo = formData.correo.trim()
  
  // Si está vacío, no hay error (es opcional)
  if (!correo || correo.length === 0) {
    errores.correo = ''
    return true
  }
  
  // Validar formato de email
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!regexEmail.test(correo)) {
    errores.correo = 'Debe ser un email válido (ejemplo: usuario@gmail.com)'
    return false
  }
  
  errores.correo = ''
  return true
}

const scrollToError = () => {
  // Scroll al primer campo con error
  if (errores.nombre && nombreInput.value) {
    nombreInput.value.focus()
    nombreInput.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else if (errores.apellido && apellidoInput.value) {
    apellidoInput.value.focus()
    apellidoInput.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else if (errores.ci && ciInput.value) {
    ciInput.value.focus()
    ciInput.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else if (errores.telefono && telefonoInput.value) {
    telefonoInput.value.focus()
    telefonoInput.value.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else if (errores.correo) {
    // Scroll al campo de correo si tiene error
    const correoInput = document.querySelector('input[type="email"]')
    if (correoInput) {
      correoInput.focus()
      correoInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }
}

const enviarFormulario = async () => {
  try {
    // Verificar estado del formulario antes de enviar
    if (formularioBloqueado.value) {
      mensaje.tipo = 'error'
      mensaje.texto = '⚠️ El formulario está temporalmente deshabilitado'
      return
    }

    enviando.value = true
    mensaje.texto = ''
    
    // Limpiar errores previos
    errores.nombre = ''
    errores.apellido = ''
    errores.ci = ''
    errores.telefono = ''
    errores.correo = ''

    // Validaciones usando las funciones
    const nombreValido = validarNombre()
    const apellidoValido = validarApellido()
    const ciValido = formData.ci ? validarCI() : true
    const telefonoValido = validarCelular()
    const correoValido = validarCorreo()
    
    if (!nombreValido || !apellidoValido || !ciValido || !telefonoValido || !correoValido) {
      scrollToError()
      throw new Error('Por favor corrige los errores en el formulario')
    }
    
    // Validación extra para teléfono obligatorio
    if (!formData.telefono.trim()) {
      errores.telefono = 'El celular es obligatorio'
      scrollToError()
      throw new Error('El celular es obligatorio')
    }

    console.log('📤 Enviando registro FEIPOBOL:', formData)

    const response = await feipobolService.createRegistroFeipobol({
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      ci: formData.ci.trim() || null,
      zona: formData.zona || null,
      telefono: formData.telefono.trim(),
      correo: formData.correo.trim() || null
    })

    console.log('✅ Respuesta del servicio:', response)

    if (!response.success) {
      throw new Error(response.error || 'Error en el servidor')
    }

    const data = response
    console.log('✅ Respuesta exitosa:', data)

    if (data.success) {
      registroExitoso.value = data.data
      
      // Verificar si ganó un premio
      if (data.data.esGanador && data.data.premio) {
        premioInfo.value = data.data.premio
      } else {
        premioInfo.value = null
        // Generar mensaje motivacional aleatorio
        mensajeMotivacional.value = obtenerMensajeAleatorio()
      }
      
      // SIEMPRE mostrar el modal nuevo (premio o no premio)
      mostrarModalPremio.value = true
      
      // Limpiar formulario COMPLETO
      Object.keys(formData).forEach(key => {
        formData[key] = ''
      })
      busquedaZona.value = '' // Limpiar también el buscador de zona

      mensaje.tipo = 'exito'
      mensaje.texto = data.message || '✅ Registro completado. ¡Gracias por su participación!'
    } else {
      throw new Error(data.message || 'Error desconocido')
    }

  } catch (error) {
    console.error('❌ Error en registro:', error)
    mensaje.tipo = 'error'
    mensaje.texto = error.message || 'Error al registrar participante'
  } finally {
    enviando.value = false
  }
}

const cerrarMensaje = () => {
  mensaje.texto = ''
  mensaje.tipo = ''
}

const cerrarModal = () => {
  mostrarModalExito.value = false
  registroExitoso.value = null
}

const cerrarModalPremio = () => {
  mostrarModalPremio.value = false
  premioInfo.value = null
  registroExitoso.value = null
  
  // Limpiar formulario completamente al cerrar modal
  Object.keys(formData).forEach(key => {
    formData[key] = ''
  })
  busquedaZona.value = ''
  
  // Limpiar errores
  Object.keys(errores).forEach(key => {
    errores[key] = ''
  })
  
  // Enfocar en el primer campo para nuevo registro
  setTimeout(() => {
    if (nombreInput.value) {
      nombreInput.value.focus()
    }
  }, 300)
}

const descargarQR = () => {
  if (!registroExitoso.value?.qrCode) return
  
  const link = document.createElement('a')
  link.href = 'data:image/png;base64,' + registroExitoso.value.qrCode
  link.download = `FEIPOBOL-${registroExitoso.value.numeroSorteo}-${registroExitoso.value.nombre}-${registroExitoso.value.apellido}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const imprimirBoleto = () => {
  if (!registroExitoso.value) return

  const ventana = window.open('', '_blank')
  ventana.document.write(`
    <html>
      <head>
        <title>FEIPOBOL 2025 - Boleto #${registroExitoso.value.numeroSorteo}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            margin: 0;
          }
          .header { 
            background: linear-gradient(135deg, #6B9080, #8FA89B); 
            color: white; 
            padding: 20px; 
            margin-bottom: 20px; 
            border-radius: 10px;
          }
          .numero-sorteo { 
            font-size: 28px; 
            font-weight: bold; 
            color: #FF6B35; 
            margin: 20px 0;
          }
          .info { 
            margin: 10px 0; 
            font-size: 16px;
          }
          .qr-container { 
            margin: 30px 0; 
          }
          .qr-image { 
            width: 200px; 
            height: 200px; 
            border: 2px solid #6B9080;
            border-radius: 10px;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏆 FEIPOBOL 2025</h1>
          <h2>Registro de Participante</h2>
        </div>
        
        <div class="numero-sorteo">
          NÚMERO DE SORTEO: #${registroExitoso.value.numeroSorteo}
        </div>
        
        <div class="info">
          <strong>${registroExitoso.value.nombre} ${registroExitoso.value.apellido}</strong>
        </div>
        
        ${registroExitoso.value.ci ? `<div class="info">CI: ${registroExitoso.value.ci}</div>` : ''}
        
        <div class="qr-container">
          <img src="data:image/png;base64,${registroExitoso.value.qrCode}" class="qr-image" />
        </div>
        
        <div class="info">
          <strong>Token:</strong> ${registroExitoso.value.token}
        </div>
        
        <div class="info">
          <strong>Fecha:</strong> ${formatearFecha(registroExitoso.value.fechaRegistro)}
        </div>
        
        <div class="footer">
          <p>Conserva este boleto para participar en sorteos y eventos</p>
          <p>FEIPOBOL 2025 - En el Bicentenario de Bolivia 🇧🇴</p>
        </div>
      </body>
    </html>
  `)
  
  ventana.document.close()
  
  // Imprimir después de que se cargue
  setTimeout(() => {
    ventana.print()
  }, 500)
}

const descargarImagenPremio = () => {
  if (!registroExitoso.value?.imagenPath) return
  
  const link = document.createElement('a')
  link.href = `/api/assets/${registroExitoso.value.imagenPath}`
  link.download = `PREMIO-FEIPOBOL-${registroExitoso.value.numeroSorteo}-${premioInfo.value?.nombrePremio || 'Premio'}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const descargarBoletoGanador = async () => {
  if (!registroExitoso.value || !premioInfo.value) return

  try {
    // Cargar la plantilla del cupón
    const plantilla = new Image()
    plantilla.src = '/cupon.png'
    
    await new Promise((resolve, reject) => {
      plantilla.onload = resolve
      plantilla.onerror = reject
    })

    // Crear canvas con el tamaño de la plantilla
    const canvas = document.createElement('canvas')
    canvas.width = plantilla.width
    canvas.height = plantilla.height
    const ctx = canvas.getContext('2d')

    // Dibujar la plantilla de fondo
    ctx.drawImage(plantilla, 0, 0)

    // Configuración de texto
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Posiciones basadas en la plantilla (ajustar según el diseño real)
    const centerX = canvas.width / 2

    // ===== TÍTULO: CUPÓN GANADOR =====
    ctx.font = 'bold 72px Arial, sans-serif'
    ctx.fillStyle = '#000000'
    ctx.fillText('CUPÓN GANADOR', centerX, 620)

    // ===== NOMBRE COMPLETO =====
    const nombreCompleto = `${registroExitoso.value.nombre.toUpperCase()} ${registroExitoso.value.apellido.toUpperCase()}`
    ctx.font = 'bold 48px Arial, sans-serif'
    ctx.fillStyle = '#000000'
    ctx.fillText(nombreCompleto, centerX, 750)

    // ===== CI (Cédula de Identidad) =====
    ctx.font = 'bold 40px Arial, sans-serif'
    ctx.fillStyle = '#000000'
    const ci = registroExitoso.value.ci || registroExitoso.value.cedula || 'S/N'
    ctx.fillText(`CI: ${ci}`, centerX, 830)

    // ===== CELULAR =====
    ctx.font = 'bold 40px Arial, sans-serif'
    ctx.fillStyle = '#000000'
    const celular = registroExitoso.value.celular || registroExitoso.value.telefono || 'S/N'
    ctx.fillText(`CEL: ${celular}`, centerX, 910)

    // ===== PREMIO =====
    const nombrePremio = premioInfo.value.nombrePremio.toUpperCase()
    ctx.font = 'bold 46px Arial, sans-serif'
    ctx.fillStyle = '#000000'
    
    // Dividir premio si es muy largo
    const maxWidth = canvas.width - 100
    let yPosPremio = 1000
    if (ctx.measureText(nombrePremio).width > maxWidth) {
      // Dividir en dos líneas
      const palabras = nombrePremio.split(' ')
      const mitad = Math.ceil(palabras.length / 2)
      const linea1 = palabras.slice(0, mitad).join(' ')
      const linea2 = palabras.slice(mitad).join(' ')
      
      ctx.fillText(linea1, centerX, yPosPremio)
      ctx.fillText(linea2, centerX, yPosPremio + 60)
      yPosPremio += 120
    } else {
      ctx.fillText(nombrePremio, centerX, yPosPremio)
      yPosPremio += 70
    }

    // ===== DESCRIPCIÓN DEL PREMIO =====
    if (premioInfo.value.descripcionPremio) {
      ctx.font = '36px Arial, sans-serif'
      ctx.fillStyle = '#333333'
      
      const descripcion = premioInfo.value.descripcionPremio
      const palabrasDesc = descripcion.split(' ')
      let lineaActual = ''
      const lineasDesc = []
      
      // Dividir descripción en líneas
      palabrasDesc.forEach(palabra => {
        const testLine = lineaActual + palabra + ' '
        if (ctx.measureText(testLine).width > maxWidth && lineaActual !== '') {
          lineasDesc.push(lineaActual.trim())
          lineaActual = palabra + ' '
        } else {
          lineaActual = testLine
        }
      })
      if (lineaActual !== '') {
        lineasDesc.push(lineaActual.trim())
      }
      
      // Dibujar cada línea de descripción
      lineasDesc.forEach(linea => {
        ctx.fillText(linea, centerX, yPosPremio)
        yPosPremio += 50
      })
      yPosPremio += 20
    }

    // ===== FECHA =====
    ctx.font = 'bold 38px Arial, sans-serif'
    ctx.fillStyle = '#000000'
    const fecha = new Date(registroExitoso.value.fechaRegistro || registroExitoso.value.createdAt)
    const fechaFormateada = fecha.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    ctx.fillText(`Fecha: ${fechaFormateada}`, centerX, yPosPremio + 30)

    // ===== NÚMERO DE REGISTRO =====
    ctx.font = 'bold 42px Arial, sans-serif'
    ctx.fillStyle = '#000000'
    const numeroRegistro = registroExitoso.value.numeroSorteo || registroExitoso.value.id || '0'
    ctx.fillText(`# ${numeroRegistro}`, centerX, yPosPremio + 90)

    // Resetear sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Convertir canvas a imagen y descargar
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `CUPON-GANADOR-${registroExitoso.value.numeroSorteo}-${registroExitoso.value.nombre}-${registroExitoso.value.apellido}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/jpeg', 0.95)

  } catch (error) {
    console.error('Error generando cupón ganador:', error)
    alert('Error al generar el cupón. Por favor intenta de nuevo.')
  }
}

const descargarBoletoParticipante = async () => {
  if (!registroExitoso.value) return

  try {
    // Crear canvas
    const canvas = document.createElement('canvas')
    canvas.width = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')

    // Fondo degradado verde/azul
    const gradiente = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradiente.addColorStop(0, '#6B9080')
    gradiente.addColorStop(0.5, '#8FA89B')
    gradiente.addColorStop(1, '#A4C3B2')
    ctx.fillStyle = gradiente
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Marco decorativo
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 20
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80)
    
    ctx.strokeStyle = '#6B9080'
    ctx.lineWidth = 10
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100)

    // Configuración de texto
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 3
    ctx.shadowOffsetY = 3

    let yPos = 200

    // Emoji celebración
    ctx.font = '150px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('🎊', canvas.width / 2, yPos)
    yPos += 180

    // Nombre del participante
    const nombreCompleto = `${registroExitoso.value.nombre.toUpperCase()} ${registroExitoso.value.apellido.toUpperCase()}`
    ctx.font = 'bold 70px Arial'
    ctx.fillStyle = '#2C3E50'
    
    const maxWidth = canvas.width - 200
    if (ctx.measureText(nombreCompleto).width > maxWidth) {
      ctx.font = 'bold 60px Arial'
    }
    ctx.fillText(nombreCompleto, canvas.width / 2, yPos)
    yPos += 140

    // Mensaje motivacional
    ctx.font = 'bold 65px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('¡GRACIAS POR', canvas.width / 2, yPos)
    yPos += 85
    ctx.fillText('PARTICIPAR!', canvas.width / 2, yPos)
    yPos += 180

    // N° de sorteo
    ctx.font = 'bold 70px Arial'
    ctx.fillStyle = '#FF6B35'
    ctx.fillText(`N° Sorteo: #${registroExitoso.value.numeroSorteo}`, canvas.width / 2, yPos)
    yPos += 150

    // Instrucciones
    yPos += 60
    ctx.font = 'bold 55px Arial'
    ctx.fillStyle = '#DC3545'
    ctx.fillText('IMPORTANTE', canvas.width / 2, yPos)
    yPos += 80

    // Caja de instrucciones (más pequeña)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillRect(80, yPos - 50, canvas.width - 160, 380)
    
    ctx.strokeStyle = '#6B9080'
    ctx.lineWidth = 5
    ctx.strokeRect(80, yPos - 50, canvas.width - 160, 380)

    ctx.font = '45px Arial'
    ctx.fillStyle = '#2C3E50'
    
    const instrucciones = [
      'Para que su boleto tenga validez',
      'pase por los puntos de control.',
      '',
      'Este boleto solo sirve para canje',
      'dentro de la feria FEIPOBOL.'
    ]
    
    instrucciones.forEach(linea => {
      ctx.fillText(linea, canvas.width / 2, yPos)
      yPos += 75
    })
    
    yPos += 80

    // Mensaje motivacional aleatorio
    ctx.font = 'bold 60px Arial'
    ctx.fillStyle = '#16A085'
    ctx.fillText('¡SIGUE PARTICIPANDO!', canvas.width / 2, yPos)
    yPos += 90

    // Fecha
    ctx.font = '45px Arial'
    ctx.fillStyle = '#2C3E50'
    ctx.fillText(`Fecha: ${formatearFecha(registroExitoso.value.fechaRegistro)}`, canvas.width / 2, yPos)
    yPos += 100

    // Logo FEIPOBOL
    ctx.font = 'bold 70px Arial'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('FEIPOBOL 2025', canvas.width / 2, yPos)

    // Resetear sombra
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0

    // Convertir a imagen y descargar
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `BOLETO-FEIPOBOL-${registroExitoso.value.numeroSorteo}-${registroExitoso.value.nombre}-${registroExitoso.value.apellido}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/jpeg', 0.95)

  } catch (error) {
    console.error('Error generando boleto:', error)
    alert('Error al generar el boleto. Por favor intenta de nuevo.')
  }
}

const imprimirBoletoGanador = () => {
  if (!registroExitoso.value || !premioInfo.value) return

  const ventana = window.open('', '_blank')
  ventana.document.write(`
    <html>
      <head>
        <title>🏆 FEIPOBOL 2025 - BOLETO GANADOR #${registroExitoso.value.numeroSorteo}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px; 
            margin: 0;
            background: linear-gradient(135deg, #FFD700, #FFA500);
          }
          .header { 
            background: linear-gradient(135deg, #FF6B35, #F7931E); 
            color: white; 
            padding: 30px; 
            margin-bottom: 20px; 
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          }
          .ganador-title {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
          }
          .numero-sorteo { 
            font-size: 48px; 
            font-weight: bold; 
            color: #FF6B35; 
            margin: 20px 0;
            background: white;
            padding: 15px;
            border-radius: 10px;
            display: inline-block;
          }
          .premio-info {
            background: white;
            padding: 25px;
            margin: 20px 0;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          }
          .premio-nombre {
            font-size: 32px;
            font-weight: bold;
            color: #2C3E50;
            margin: 15px 0;
          }
          .info { 
            margin: 15px 0; 
            font-size: 18px;
            color: #2C3E50;
          }
          .footer {
            margin-top: 30px;
            font-size: 14px;
            color: #666;
            border-top: 2px solid #ddd;
            padding-top: 20px;
          }
          .estrella {
            font-size: 24px;
            color: #FFD700;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="estrella">⭐ ⭐ ⭐ ⭐ ⭐</div>
          <div class="ganador-title">¡BOLETO GANADOR!</div>
          <div>FEIPOBOL 2025</div>
        </div>
        
        <div class="numero-sorteo">N° ${registroExitoso.value.numeroSorteo}</div>
        
        <div class="premio-info">
          <div class="premio-nombre">🏆 ${premioInfo.value.nombrePremio}</div>
          ${premioInfo.value.descripcionPremio ? `<div class="info">${premioInfo.value.descripcionPremio}</div>` : ''}
          ${premioInfo.value.valorPremio ? `<div class="info">💰 Valor: Bs. ${premioInfo.value.valorPremio}</div>` : ''}
        </div>
        
        <div class="info">
          <strong>Ganador:</strong> ${registroExitoso.value.nombre} ${registroExitoso.value.apellido}
        </div>
        
        ${registroExitoso.value.ci ? `<div class="info"><strong>CI:</strong> ${registroExitoso.value.ci}</div>` : ''}
        
        <div class="info">
          <strong>Fecha:</strong> ${formatearFecha(registroExitoso.value.fechaRegistro)}
        </div>
        
        <div class="footer">
          <p><strong>🎉 ¡FELICITACIONES! 🎉</strong></p>
          <p>Conserva este boleto para reclamar tu premio</p>
          <p>Te contactaremos pronto para coordinar la entrega</p>
          <p>FEIPOBOL 2025 - En el Bicentenario de Bolivia 🇧🇴</p>
        </div>
      </body>
    </html>
  `)
  
  ventana.document.close()
  
  // Imprimir después de que se cargue
  setTimeout(() => {
    ventana.print()
  }, 500)
}

const onImageError = (event) => {
  console.error('Error cargando imagen de premio:', event)
  // Opcional: mostrar imagen placeholder o mensaje de error
}

const formatearFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Verificar estado del formulario al montar el componente
const verificarEstadoFormulario = async () => {
  try {
    const response = await configuracionService.getFormulariosStatus()
    if (response.success) {
      formularioBloqueado.value = !response.data.feipobol
    }
  } catch (error) {
    console.error('Error verificando estado del formulario:', error)
    // En caso de error, permitir acceso
    formularioBloqueado.value = false
  } finally {
    cargandoEstado.value = false
  }
}

onMounted(() => {
  verificarEstadoFormulario()
  
  // Revisar estado cuando la ventana recibe foco
  const handleFocus = () => {
    console.log('🔍 Ventana recibió foco, verificando estado del formulario...')
    verificarEstadoFormulario()
  }
  
  window.addEventListener('focus', handleFocus)
  
  // Limpiar el listener cuando se desmonte el componente
  onUnmounted(() => {
    window.removeEventListener('focus', handleFocus)
  })
})
</script>

<style scoped>
.registro-feipobol {
  min-height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  background-image: url('@/assets/fondo01.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
  overflow-x: hidden;
}

/* HEADER */
.header-feipobol {
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  padding: 15px 40px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo-img {
  height: 90px;
  width: auto;
  max-width: 140px;
  object-fit: contain;
  background: white;
  padding: 12px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}

.header-text h1 {
  color: white;
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.header-text p {
  color: rgba(255,255,255,0.9);
  font-size: 1rem;
  margin: 5px 0 0 0;
  font-weight: 500;
}

/* CONTENIDO PRINCIPAL */
.contenido-formulario {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  min-height: calc(100vh - 120px);
  align-items: center;
}

.formulario-card {
  background: white;
  border-radius: 20px;
  padding: 30px 35px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  width: 100%;
}

.seccion-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.logo-contenedor-derecha {
  text-align: center;
}

.logo-principal {
  width: 100%;
  max-width: 400px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.2));
  animation: floatLogo 3s ease-in-out infinite;
}

@keyframes floatLogo {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.titulo-con-regalos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 10px;
}

.emoji-regalo {
  font-size: 2.5rem;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.linea-decorativa {
  height: 3px;
  background: linear-gradient(90deg, transparent, #5FD0AD, transparent);
  margin-bottom: 25px;
}

.titulo-formulario {
  font-size: 1.4rem;
  font-weight: 700;
  color: #5FD0AD;
  text-align: center;
  line-height: 1.2;
  margin: 0;
  text-transform: uppercase;
}

.form-feipobol {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  color: #FF6B35;
  font-size: 13px;
}

.requerido {
  color: #FF6B35;
  font-weight: bold;
}

.form-control {
  padding: 12px 14px;
  border: 2px solid #FFD6C4;
  border-radius: 10px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: white;
}

.form-control:focus {
  outline: none;
  border-color: #FF6B35;
  background: white;
  box-shadow: 0 0 0 3px rgba(255,107,53,0.1);
}

/* Estilos de validación */
.input-error {
  border-color: #FF6B35 !important;
  background: #fff5f5 !important;
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(255,107,53,0.1) !important;
}

.input-valido {
  border-color: #28a745 !important;
  background-color: #f0fff4 !important;
}

.input-valido:focus {
  box-shadow: 0 0 0 3px rgba(40,167,69,0.1) !important;
}

/* Contenedor con icono de validación */
.input-con-icono {
  position: relative;
  display: flex;
  align-items: center;
}

.icono-validacion {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  font-weight: bold;
  pointer-events: none;
  z-index: 5;
}

.icono-validacion.valido {
  color: #28a745;
}

.icono-validacion.error {
  color: #dc3545;
}

.mensaje-error {
  color: #FF6B35;
  font-size: 13px;
  font-weight: 600;
  margin-top: -4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mensaje-error::before {
  content: "⚠️";
  font-size: 12px;
}

.mensaje-ayuda {
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
  margin-top: -4px;
}

/* Buscador de zonas */
.zona-group {
  position: relative;
}

.buscador-zona {
  width: 100%;
}

.lista-zonas {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #6B9080;
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  z-index: 1000;
  margin-top: 4px;
}

.zona-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.zona-item:last-child {
  border-bottom: none;
}

.zona-item:hover {
  background: linear-gradient(90deg, rgba(107,144,128,0.1), rgba(107,144,128,0.05));
  color: #6B9080;
  font-weight: 600;
}

.zona-no-encontrada {
  padding: 16px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
}


.form-actions {
  margin-top: 30px;
}

.btn-enviar {
  width: 100%;
  background: linear-gradient(135deg, #5FD0AD, #4DB89A);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 6px 20px rgba(95,208,173,0.4);
}

.btn-enviar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(95,208,173,0.5);
  background: linear-gradient(135deg, #4DB89A, #3DA585);
}

.btn-enviar:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.info-adicional {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #6B9080;
}

.info-adicional p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.info-adicional .info-premio {
  margin-top: 15px;
  padding: 15px;
  background: linear-gradient(135deg, #FFF9E6 0%, #FFE082 100%);
  border-radius: 8px;
  border: 2px solid #FFD700;
  color: #2C3E50;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 3px 10px rgba(255, 215, 0, 0.2);
}

.info-adicional .info-premio strong {
  color: #E74C3C;
  font-weight: 700;
}

/* MENSAJES */
.mensaje {
  margin-top: 20px;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: slideIn 0.3s ease-out;
}

.mensaje.error {
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.mensaje.exito {
  background: #e8f5e8;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

.mensaje-contenido {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mensaje-icono {
  font-size: 18px;
}

.btn-cerrar-mensaje {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

.btn-cerrar-mensaje:hover {
  opacity: 1;
}

/* SECCIÓN IMAGEN */
.seccion-imagen {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.imagen-contenedor {
  width: 100%;
  max-width: 450px;
}

.ilustracion-feipobol {
  width: 100%;
}

.svg-ilustracion {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.1));
}

.elementos-flotantes circle {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* MODAL */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal-exito {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: modalAppear 0.3s ease-out;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-50px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  color: white;
  padding: 25px 30px;
  border-radius: 20px 20px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.btn-cerrar-modal {
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.btn-cerrar-modal:hover {
  background: rgba(255,255,255,0.2);
}

.modal-body {
  padding: 30px;
}

.info-registro {
  margin-bottom: 30px;
}

.info-registro h4 {
  color: #6B9080;
  font-size: 1.2rem;
  margin-bottom: 15px;
  font-weight: 700;
}

.datos-registro p {
  margin: 8px 0;
  font-size: 16px;
}

.numero-sorteo {
  color: #FF6B35;
  font-weight: bold;
  font-size: 1.2rem;
}

.qr-section {
  text-align: center;
  border-top: 2px solid #f0f0f0;
  padding-top: 30px;
}

.qr-section h4 {
  color: #6B9080;
  font-size: 1.2rem;
  margin-bottom: 20px;
  font-weight: 700;
}

.qr-container {
  margin: 20px 0;
}

.qr-image {
  width: 200px;
  height: 200px;
  border: 2px solid #6B9080;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.qr-info {
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

.qr-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: 25px;
}

.btn-descargar, .btn-imprimir {
  background: #6B9080;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-descargar:hover, .btn-imprimir:hover {
  background: #5a7a6a;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(107,144,128,0.3);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* MODAL DE PREMIO GANADOR */
.modal-premio-ganador {
  background: white;
  border-radius: 25px;
  max-width: 550px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 70px rgba(0,0,0,0.4);
  position: relative;
  animation: slideInFromTop 0.5s ease-out;
}

.modal-header-premio {
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 10;
}

.modal-body-premio {
  padding: 0;
  background: linear-gradient(135deg, #C8E6C9 0%, #81C784 50%, #66BB6A 100%);
  border-radius: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contenido-ganador {
  padding: 70px 30px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
}

.confetti-animation {
  font-size: 3.5rem;
  animation: bounce 1s ease-in-out infinite;
  margin-bottom: 10px;
}

.titulo-ganaste {
  font-size: 2.8rem;
  font-weight: 900;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 25px 0;
  animation: pulse 1.5s ease-in-out infinite;
  letter-spacing: 2px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.tarjeta-ganador-principal {
  background: white;
  padding: 30px 25px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  max-width: 500px;
  width: 100%;
  margin-bottom: 25px;
  border: 4px solid #FFD700;
  position: relative;
  overflow: hidden;
}

.marca-agua {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 6rem;
  font-weight: 900;
  color: rgba(255, 215, 0, 0.08);
  letter-spacing: 10px;
  pointer-events: none;
  z-index: 0;
  white-space: nowrap;
}

.nombre-ganador {
  font-size: 2rem;
  font-weight: 800;
  color: #2C3E50;
  margin-bottom: 25px;
  text-align: center;
  position: relative;
  z-index: 1;
  line-height: 1.2;
  text-transform: uppercase;
}

.datos-ganador-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.dato-ganador-item {
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 1.05rem;
  color: #495057;
  border-left: 4px solid #6C757D;
  transition: all 0.3s ease;
}

.dato-ganador-item:hover {
  transform: translateX(5px);
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
}

.dato-ganador-item strong {
  color: #212529;
  margin-right: 8px;
}

.dato-ganador-item.premio-destacado {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFE082 100%);
  border-left-color: #FFA500;
  font-weight: 600;
}

.dato-ganador-item.sorteo-destacado {
  background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
  border-left-color: #4CAF50;
  font-weight: 600;
}

.nota-importante {
  background: #FFF3CD;
  border: 2px solid #FFC107;
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 20px;
  font-size: 0.95rem;
  color: #856404;
  text-align: center;
  position: relative;
  z-index: 1;
  line-height: 1.5;
}

.pie-tarjeta {
  text-align: center;
  font-size: 1rem;
  color: #6C757D;
  font-weight: 600;
  padding-top: 15px;
  border-top: 2px solid #E9ECEF;
  position: relative;
  z-index: 1;
}

.accion-descarga {
  margin-top: 25px;
}

.btn-descargar-boleto {
  color: white;
  border: none;
  padding: 18px 40px;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 900;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  animation: bounce-button 2s ease-in-out infinite;
}

.btn-descargar-boleto.ganador {
  background: linear-gradient(135deg, #28A745, #20C997);
  box-shadow: 0 10px 30px rgba(40,167,69,0.4);
}

.icono-boton {
  font-size: 1.4rem;
}

.texto-boton {
  font-size: 1.1rem;
}

@keyframes bounce-button {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.btn-descargar-boleto.ganador:hover {
  background: linear-gradient(135deg, #20C997, #17A589);
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 45px rgba(40,167,69,0.6);
  animation: none;
}

/* 🔴 MODAL SIMPLE PARA PERDEDORES */
.modal-perdedor-simple {
  background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
  border-radius: 20px;
  padding: 40px 30px;
  max-width: 450px;
  width: 90%;
  position: relative;
  box-shadow: 0 20px 60px rgba(22,160,133,0.3);
  animation: bounceIn 0.6s ease-out;
  border: 3px solid #16A085;
  overflow: hidden; /* Importante para contener el canvas */
}

/* Canvas de confeti suave para modal perdedor */
.confeti-canvas-perdedor {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* Animación de entrada con bounce */
@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3) translateY(-100px);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

/* 🟢 MODAL SIMPLE PARA GANADORES */
.modal-ganador-simple {
  background: linear-gradient(135deg, #FFF9E6 0%, #FFE082 100%);
  border-radius: 20px;
  padding: 30px 25px;
  max-width: 420px;
  width: 90%;
  position: relative;
  box-shadow: 0 20px 60px rgba(255,215,0,0.4);
  animation: slideInFromTop 0.4s ease-out;
  border: 3px solid #FFD700;
  overflow: hidden; /* Importante para contener el canvas */
}

/* Canvas de confeti dentro del modal */
.canvas-confeti {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.btn-cerrar-simple {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 36px;
  color: #999;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border-radius: 50%;
  z-index: 10; /* Por encima del canvas */
}

.btn-cerrar-simple:hover {
  background: rgba(0,0,0,0.05);
  color: #333;
  transform: rotate(90deg);
}

.contenido-perdedor {
  text-align: center;
  padding: 20px;
  position: relative;
  z-index: 2; /* Por encima del canvas */
}

.contenido-ganador-simple {
  text-align: center;
  padding: 10px;
  position: relative;
  z-index: 2; /* Por encima del canvas */
}

.numero-registro-pequeño {
  font-size: 0.85rem;
  color: #95a5a6;
  font-weight: 500;
  margin-bottom: 10px;
  text-align: center;
  letter-spacing: 0.5px;
}

.icono-perdedor {
  font-size: 80px;
  margin-bottom: 20px;
  animation: pulseGlow 2s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgba(22,160,133,0.6));
}

.icono-ganador {
  font-size: 70px;
  margin-bottom: 10px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulseGlow {
  0%, 100% { 
    transform: scale(1);
    filter: drop-shadow(0 0 10px rgba(22,160,133,0.6));
  }
  50% { 
    transform: scale(1.1);
    filter: drop-shadow(0 0 20px rgba(22,160,133,0.9));
  }
}

.titulo-ganaste {
  font-size: 2.2rem;
  color: #FF8C00;
  margin-bottom: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.nombre-ganador-simple {
  font-size: 1.4rem;
  color: #2C3E50;
  margin-bottom: 15px;
  font-weight: 700;
}

.info-ganador {
  background: white;
  border-radius: 12px;
  padding: 15px;
  margin: 15px 0;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #E0E0E0;
  font-size: 0.95rem;
}

.info-item:last-child {
  border-bottom: none;
}
.info-item.destacado {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  margin: 8px -15px -15px -15px;
  padding: 12px 15px;
  border-radius: 0 0 12px 12px;
  border-bottom: none;
  font-size: 0.95rem;
}

.info-item.destacado .label,
.info-item.destacado .value {
  color: white;
  font-weight: 700;
}

.info-item .label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.info-item .value {
  font-weight: 700;
  color: #2C3E50;
  font-size: 0.9rem;
}

.titulo-principal-perdedor {
  font-size: 2.8rem;
  color: #16A085;
  margin-bottom: 15px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.titulo-perdedor {
  font-size: 2.2rem;
  color: #2C3E50;
  margin-bottom: 20px;
  font-weight: 700;
}

.mensaje-motivacional {
  font-size: 1.3rem;
  color: #16A085;
  margin-bottom: 20px;
  line-height: 1.6;
  font-weight: 600;
  padding: 0 20px;
}

.firma-feipobol {
  font-size: 1.2rem;
  color: #E74C3C;
  font-weight: 800;
  margin-bottom: 20px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.btn-cerrar-perdedor {
  background: linear-gradient(135deg, #16A085, #138D75);
  color: white;
  border: none;
  padding: 15px 50px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 20px rgba(22,160,133,0.3);
}

.btn-cerrar-perdedor:hover {
  background: linear-gradient(135deg, #138D75, #117A65);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(22,160,133,0.4);
}

/* Modal de Departamentos */
.modal-departamentos {
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideInFromTop 0.4s ease-out;
}

@media (max-width: 768px) {
  .modal-departamentos {
    max-width: 95%;
    width: 95%;
    padding: 30px 20px;
    max-height: 85vh;
  }
}

@media (max-width: 480px) {
  .modal-departamentos {
    padding: 25px 15px;
    max-height: 80vh;
  }
}

.contenido-departamentos {
  text-align: center;
}

.titulo-departamentos {
  font-size: 2rem;
  color: #2C3E50;
  margin-bottom: 10px;
  font-weight: 800;
}

@media (max-width: 768px) {
  .titulo-departamentos {
    font-size: 1.6rem;
  }
}

@media (max-width: 480px) {
  .titulo-departamentos {
    font-size: 1.4rem;
  }
}

.subtitulo-departamentos {
  font-size: 1.1rem;
  color: #7F8C8D;
  margin-bottom: 30px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .subtitulo-departamentos {
    font-size: 1rem;
    margin-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .subtitulo-departamentos {
    font-size: 0.9rem;
    margin-bottom: 15px;
  }
}

.grid-departamentos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

@media (min-width: 769px) {
  .grid-departamentos {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) and (min-width: 481px) {
  .grid-departamentos {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .grid-departamentos {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 360px) {
  .grid-departamentos {
    grid-template-columns: 1fr;
  }
}

.btn-departamento {
  background: linear-gradient(135deg, #3498DB, #2980B9);
  color: white;
  border: none;
  padding: 20px 15px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(52,152,219,0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .btn-departamento {
    padding: 18px 12px;
    font-size: 0.9rem;
    gap: 6px;
  }
}

@media (max-width: 480px) {
  .btn-departamento {
    padding: 15px 10px;
    font-size: 0.85rem;
  }
}

.btn-departamento:hover {
  background: linear-gradient(135deg, #2980B9, #21618C);
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 10px 25px rgba(52,152,219,0.5);
}

.btn-departamento:active {
  transform: translateY(-2px) scale(1.02);
}

.emoji-depto {
  font-size: 2rem;
}

@media (max-width: 768px) {
  .emoji-depto {
    font-size: 1.8rem;
  }
}

@media (max-width: 480px) {
  .emoji-depto {
    font-size: 1.5rem;
  }
}

.nombre-depto {
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .nombre-depto {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .nombre-depto {
    font-size: 0.8rem;
  }
}

.btn-descargar-ganador {
  background: linear-gradient(135deg, #FF8C00, #FF6347);
  color: white;
  border: none;
  padding: 12px 40px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 20px rgba(255,140,0,0.4);
}

.btn-descargar-ganador:hover {
  background: linear-gradient(135deg, #FF6347, #FF4500);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(255,140,0,0.6);
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-100px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .header-feipobol {
    padding: 15px 20px;
  }

  .logo-container {
    gap: 15px;
  }

  .logo-img {
    height: 60px;
    max-width: 90px;
    padding: 8px;
  }

  .header-text h1 {
    font-size: 1.8rem;
  }

  .header-text p {
    font-size: 0.9rem;
  }

  .contenido-formulario {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 30px 15px;
  }

  .formulario-card {
    padding: 30px 20px;
  }

  .seccion-logo {
    display: none; /* Ocultar logo en móviles */
  }

  .logo-principal {
    max-width: 250px;
  }

  .titulo-formulario {
    font-size: 1.8rem;
    margin-bottom: 30px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .form-control {
    padding: 12px 14px;
    font-size: 16px; /* Evita zoom en iOS */
  }

  .btn-enviar {
    font-size: 16px;
    padding: 14px;
  }

  .modal-exito {
    width: 95%;
    margin: 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .qr-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn-descargar, .btn-imprimir {
    width: 100%;
    max-width: 200px;
  }

  /* Modal de premio ganador en móvil */
  .modal-premio-ganador {
    width: 95%;
    margin: 10px;
    max-width: 95%;
  }

  .contenido-ganador {
    padding: 50px 20px 25px;
  }

  .confetti-animation {
    font-size: 2rem;
  }

  .titulo-ganaste {
    font-size: 2rem;
  }

  .tarjeta-ganador-principal {
    padding: 20px;
  }

  .marca-agua {
    font-size: 4rem;
  }

  .nombre-ganador {
    font-size: 1.5rem;
  }

  .dato-ganador-item {
    font-size: 1rem;
    padding: 10px 12px;
  }

  .nota-importante {
    font-size: 0.85rem;
    padding: 12px;
  }

  .pie-tarjeta {
    font-size: 0.95rem;
  }

  .btn-descargar-boleto {
    padding: 15px 25px;
    font-size: 0.9rem;
    gap: 8px;
  }

  .icono-boton {
    font-size: 1.2rem;
  }

  .texto-boton {
    font-size: 0.85rem;
  }

  /* Modal perdedor responsive */
  .modal-perdedor-simple {
    width: 95%;
    padding: 30px 20px;
  }

  .icono-perdedor {
    font-size: 60px;
  }

  .titulo-principal-perdedor {
    font-size: 2rem;
  }

  .titulo-perdedor {
    font-size: 1.6rem;
  }

  .mensaje-motivacional {
    font-size: 1.1rem;
    padding: 0 10px;
  }

  .firma-feipobol {
    font-size: 1.2rem;
  }

  .btn-cerrar-perdedor {
    padding: 12px 40px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .header-text h1 {
    font-size: 1.5rem;
  }

  .titulo-formulario {
    font-size: 1.5rem;
  }

  .formulario-card {
    padding: 25px 15px;
  }

  .qr-image {
    width: 150px;
    height: 150px;
  }
}

/* Alertas de estado del formulario */
.alerta-cargando {
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  color: white;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  margin: 40px auto;
  max-width: 600px;
}

.alerta-cargando p {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.5px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; }
}

.alerta-bloqueado {
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 15px;
  color: white;
  box-shadow: 0 10px 40px rgba(245, 87, 108, 0.3);
  margin: 40px auto;
  max-width: 600px;
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.icono-bloqueado {
  font-size: 4rem;
  margin-bottom: 20px;
  animation: shake 2s ease-in-out infinite;
  display: inline-block;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.alerta-bloqueado h3 {
  font-size: 1.8rem;
  margin: 0 0 15px 0;
  font-weight: 800;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.alerta-bloqueado p {
  font-size: 1.1rem;
  margin: 10px 0;
  line-height: 1.6;
  font-weight: 500;
}

/* Responsive para alertas */
@media (max-width: 768px) {
  .alerta-cargando,
  .alerta-bloqueado {
    padding: 40px 30px;
    margin: 20px 15px;
  }

  .alerta-bloqueado h3 {
    font-size: 1.5rem;
  }

  .alerta-bloqueado p {
    font-size: 1rem;
  }

  .icono-bloqueado {
    font-size: 3rem;
  }

  .alerta-cargando p {
    font-size: 1.1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
  }
}

@media (max-width: 480px) {
  .alerta-cargando,
  .alerta-bloqueado {
    padding: 30px 20px;
  }

  .alerta-bloqueado h3 {
    font-size: 1.3rem;
  }

  .alerta-bloqueado p {
    font-size: 0.95rem;
  }

  .icono-bloqueado {
    font-size: 2.5rem;
  }
}
</style>

<style>
/* Estilos globales (sin scoped) para resetear márgenes */
body {
  margin: 0;
  padding: 0;
}
</style>
