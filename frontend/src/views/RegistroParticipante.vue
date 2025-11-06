<template>
  <div class="registro-participante">
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
        <h2 class="titulo-formulario">FORMULARIO DE REGISTRO<br />PARTICIPANTE / AFILIADO FEPP</h2>

        <form @submit.prevent="enviarFormulario" class="form-participante">
          <div class="form-group">
            <label>Nombre(es): <span class="requerido">*</span></label>
            <input 
              v-model="formData.nombre" 
              type="text" 
              placeholder="Tu nombre aquí"
              required
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Apellido(os): <span class="requerido">*</span></label>
            <input 
              v-model="formData.apellido" 
              type="text" 
              placeholder="Tu apellido aquí"
              required
              class="form-control"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Número de CI:</label>
              <input 
                v-model="formData.ci" 
                type="text" 
                placeholder="Ej: 1234567 o 1234567-1A"
                @input="validarCI"
                maxlength="11"
                class="form-control"
                :class="{ 'input-error': errores.ci }"
              />
              <span v-if="errores.ci" class="mensaje-error">{{ errores.ci }}</span>
              <span v-else class="mensaje-ayuda">7-8 dígitos o con complemento (Ej: 1234567-1A)</span>
            </div>

            <div class="form-group">
              <label>Número de Celular: <span class="requerido">*</span></label>
              <input 
                v-model="formData.telefono" 
                type="tel" 
                placeholder="Ej: 71234567"
                @input="validarCelular"
                maxlength="8"
                required
                class="form-control"
                :class="{ 'input-error': errores.telefono }"
              />
              <span v-if="errores.telefono" class="mensaje-error">{{ errores.telefono }}</span>
              <span v-else class="mensaje-ayuda">8 dígitos, debe iniciar con 6 o 7</span>
            </div>
          </div>

          <div class="form-group">
            <label>Correo Electrónico: <span class="requerido">*</span></label>
            <input 
              v-model="formData.correo" 
              type="email" 
              placeholder="tucorreo@email.com"
              required
              class="form-control"
            />
          </div>

          <div class="form-row">
            <div class="form-group zona-group">
              <label>Zona: <span class="requerido">*</span></label>
              <!-- Buscador de zona -->
              <input 
                v-model="busquedaZona"
                type="text"
                placeholder="Buscar zona..."
                required
                class="form-control buscador-zona"
                @focus="mostrarListaZonas = true"
                @blur="ocultarListaZonas"
              />
              <!-- Lista de zonas filtradas -->
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
              <div v-if="mostrarListaZonas && zonasFiltradas.length === 0 && busquedaZona" class="lista-zonas">
                <div class="zona-item zona-no-encontrada">
                  No se encontró la zona "{{ busquedaZona }}"
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Empresa/Stand: <span class="requerido">*</span></label>
              <select 
                v-model="formData.empresaId" 
                required
                class="form-control"
                :disabled="cargandoEmpresas"
              >
                <option value="">{{ cargandoEmpresas ? 'Cargando...' : 'Selecciona tu empresa/stand' }}</option>
                <option 
                  v-for="empresa in empresasDisponibles" 
                  :key="empresa.id" 
                  :value="empresa.id"
                >
                  {{ empresa.nombre }} ({{ empresa.cupoDisponible }} disponibles)
                </option>
              </select>
              <small v-if="empresasDisponibles.length === 0 && !cargandoEmpresas" class="text-warning">
                ⚠️ No hay empresas/stands disponibles en este momento
              </small>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Fecha de Nacimiento: <span class="requerido">*</span></label>
              <input 
                v-model="formData.fechaNacimiento" 
                type="date" 
                required
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label>Sexo: <span class="requerido">*</span></label>
              <select v-model="formData.sexo" required class="form-control">
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Ocupación: <span class="requerido">*</span></label>
            <input 
              v-model="formData.ocupacion" 
              type="text" 
              placeholder="Tu ocupación"
              required
              class="form-control"
            />
          </div>

          <!-- Sección de referencia -->
          <div class="seccion-referencia">
            <h3>Datos de Emergencia (Referencia)</h3>
            <div class="form-group">
              <label>Nombre de Referencia: <span class="requerido">*</span></label>
              <input 
                v-model="formData.nombreReferencia" 
                type="text" 
                placeholder="Nombre completo"
                required
                class="form-control"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Parentesco: <span class="requerido">*</span></label>
                <select v-model="formData.parentesco" required class="form-control">
                  <option value="">Seleccionar parentesco</option>
                  <option value="Padre">Padre</option>
                  <option value="Madre">Madre</option>
                  <option value="Hermano/a">Hermano/a</option>
                  <option value="Hijo/a">Hijo/a</option>
                  <option value="Esposo/a">Esposo/a</option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Nieto/a">Nieto/a</option>
                  <option value="Tío/a">Tío/a</option>
                  <option value="Sobrino/a">Sobrino/a</option>
                  <option value="Primo/a">Primo/a</option>
                  <option value="Cuñado/a">Cuñado/a</option>
                  <option value="Suegro/a">Suegro/a</option>
                  <option value="Yerno/Nuera">Yerno/Nuera</option>
                  <option value="Amigo/a">Amigo/a</option>
                  <option value="Conocido/a">Conocido/a</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div class="form-group">
                <label>Celular de Referencia: <span class="requerido">*</span></label>
                <input 
                  v-model="formData.celularReferencia" 
                  type="tel" 
                  placeholder="########"
                  maxlength="8"
                  @input="validarCelularReferencia"
                  required
                  class="form-control"
                  :class="{ 'input-error': errores.celularReferencia }"
                />
                <span v-if="errores.celularReferencia" class="mensaje-error">{{ errores.celularReferencia }}</span>
                <span v-else class="mensaje-ayuda">8 dígitos, inicia con 6 o 7</span>
              </div>
            </div>
          </div>

          <div class="notas-importante">
            <p>* Todos los campos son obligatorios</p>
            <p>* Si su número de CI tiene una extensión debe ponerla: 1234567-1H</p>
          </div>

          <button 
            type="submit" 
            class="btn-enviar"
            :disabled="enviando"
          >
            {{ enviando ? 'ENVIANDO...' : 'ENVIAR' }}
          </button>

          <!-- Mensaje de resultado -->
          <div v-if="mensaje" :class="['mensaje', mensajeTipo]">
            {{ mensaje }}
          </div>
        </form>
      </div>
      
      <!-- Modal de confirmación -->
      <div v-if="mostrarModal" class="modal-overlay" @click="cerrarModal">
        <div class="modal-confirmacion" @click.stop>
          <div class="modal-header">
            <div class="icono-exito">✅</div>
            <h2>Datos Registrados Correctamente</h2>
          </div>
          
          <div class="modal-body">
            <div class="datos-confirmacion">
              <p><strong>Nombre:</strong> {{ datosRegistrados.nombre }} {{ datosRegistrados.apellido }}</p>
              <p><strong>CI:</strong> {{ datosRegistrados.ci || 'No especificado' }}</p>
              <p><strong>Teléfono:</strong> {{ datosRegistrados.telefono }}</p>
              <p><strong>Empresa/Stand:</strong> {{ getNombreEmpresa(datosRegistrados.empresaId) }}</p>
            </div>
            
            <p class="pregunta-confirmacion">
              ¿Los datos son correctos?
            </p>
          </div>
          
          <div class="modal-acciones">
            <button @click="actualizarDatos" class="btn-actualizar">
              🔄 ACTUALIZAR
            </button>
            <button @click="confirmarYDescargar" class="btn-confirmar">
              ✅ ACEPTAR Y DESCARGAR CREDENCIAL
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de descarga de credencial -->
      <ModalDescargaCredencial 
        :mostrar="mostrarModalDescarga"
        :estado="estadoDescarga"
        :nombreArchivo="nombreArchivoDescarga"
        :mensajeError="errorDescarga"
        @cerrar="cerrarModalDescarga"
      />

      <!-- Modal de Departamentos de Bolivia -->
      <div v-if="mostrarModalDepartamentos" class="modal-overlay" @click="cerrarModalDepartamentos">
        <div class="modal-departamentos" @click.stop>
          <button @click="cerrarModalDepartamentos" class="btn-cerrar-modal">✕</button>
          <h3>🇧🇴 Selecciona tu Departamento</h3>
          <p class="descripcion-modal">Ya que seleccionaste "Otra" zona, indícanos de qué departamento de Bolivia eres:</p>
          
          <div class="grid-departamentos">
            <div 
              v-for="depto in departamentosBolivia" 
              :key="depto.nombre"
              class="card-departamento"
              @click="seleccionarDepartamento(depto.nombre)"
            >
              <div class="icono-depto">{{ depto.icono }}</div>
              <div class="nombre-depto">{{ depto.nombre }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Imagen derecha -->
      <div class="imagen-lado">
        <div class="logo-grande">
          <img src="@/assets/logo.png" alt="FEIPOBOL Logo" class="logo-decorativo" />
          <h2 class="texto-feipobol">FEIPOBOL 2025</h2>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { participanteService, empresaService } from '../services/api'
import { generarCredencialPDF } from '../utils/credencialGenerator'
import ModalDescargaCredencial from '../components/ModalDescargaCredencial.vue'

const formData = ref({
  nombre: '',
  apellido: '',
  ci: '',
  telefono: '',
  correo: '',
  zona: '',
  fechaNacimiento: '',
  empresaId: '',
  sexo: '',
  ocupacion: '',
  nombreReferencia: '',
  parentesco: '',
  celularReferencia: ''
})

const enviando = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('')
const mostrarModal = ref(false)
const datosRegistrados = ref({})
const participanteRegistrado = ref(null)
const empresasDisponibles = ref([])
const cargandoEmpresas = ref(false)

// Modal de descarga
const mostrarModalDescarga = ref(false)
const estadoDescarga = ref('generando') // generando, descargando, completado, error
const nombreArchivoDescarga = ref('')
const errorDescarga = ref('')

// Buscador de zonas
const busquedaZona = ref('')
const mostrarListaZonas = ref(false)
const mostrarModalDepartamentos = ref(false)

// Departamentos de Bolivia
const departamentosBolivia = [
  { nombre: 'La Paz', icono: '🏔️' },
  { nombre: 'Cochabamba', icono: '🌄' },
  { nombre: 'Santa Cruz', icono: '🌴' },
  { nombre: 'Oruro', icono: '🎭' },
  { nombre: 'Potosí', icono: '⛰️' },
  { nombre: 'Chuquisaca', icono: '🏛️' },
  { nombre: 'Tarija', icono: '🍇' },
  { nombre: 'Beni', icono: '🦜' },
  { nombre: 'Pando', icono: '🌳' }
]

const zonasDisponibles = [
  'Centro Histórico',
  'Plan 40',
  'Las Lecherías',
  'Ciudad Satélite',
  'Villa Copacabana',
  'Cantumarca',
  'Zona Huachacalla',
  'Zona Delicias',
  'San Bernardo San Martin',
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

// Errores de validación
const errores = ref({
  ci: '',
  telefono: '',
  celularReferencia: ''
})

// Computed para filtrar zonas
const zonasFiltradas = computed(() => {
  if (!busquedaZona.value) {
    return zonasDisponibles
  }
  const busqueda = busquedaZona.value.toLowerCase()
  return zonasDisponibles.filter(zona => 
    zona.toLowerCase().includes(busqueda)
  )
})

// Funciones del buscador de zonas
const seleccionarZona = (zona) => {
  if (zona === 'Otra') {
    // Abrir modal de departamentos
    mostrarListaZonas.value = false
    mostrarModalDepartamentos.value = true
  } else {
    formData.value.zona = zona
    busquedaZona.value = zona
    mostrarListaZonas.value = false
  }
}

const seleccionarDepartamento = (departamento) => {
  formData.value.zona = `${departamento} (Otro departamento)`
  busquedaZona.value = `${departamento} (Otro departamento)`
  cerrarModalDepartamentos()
}

const cerrarModalDepartamentos = () => {
  mostrarModalDepartamentos.value = false
}

const ocultarListaZonas = () => {
  setTimeout(() => {
    mostrarListaZonas.value = false
  }, 200)
}

// Cargar empresas disponibles al montar el componente
onMounted(async () => {
  await cargarEmpresasDisponibles()
})

const cargarEmpresasDisponibles = async () => {
  cargandoEmpresas.value = true
  try {
    const response = await empresaService.getEmpresasDisponibles()
    if (response.success) {
      const empresasPrevias = empresasDisponibles.value.length
      empresasDisponibles.value = response.data
      console.log(`✅ Empresas actualizadas: ${empresasPrevias} → ${empresasDisponibles.value.length}`)
      
      // Si la empresa seleccionada ya no está disponible (cupo lleno), limpiar selección
      if (formData.value.empresaId) {
        const empresaExiste = empresasDisponibles.value.find(e => e.id === formData.value.empresaId)
        if (!empresaExiste) {
          console.log('⚠️ Empresa seleccionada ya no disponible (cupo completo)')
          formData.value.empresaId = ''
          mensaje.value = 'La empresa que seleccionaste ya completó su cupo. Por favor selecciona otra.'
          mensajeTipo.value = 'warning'
        }
      }
    } else {
      console.error('❌ Error al cargar empresas:', response.error)
      mensaje.value = 'No se pudieron cargar las empresas disponibles'
      mensajeTipo.value = 'error'
    }
  } catch (error) {
    console.error('❌ Error cargando empresas:', error)
  } finally {
    cargandoEmpresas.value = false
  }
}

const getNombreEmpresa = (empresaId) => {
  const empresa = empresasDisponibles.value.find(e => e.id === empresaId)
  return empresa ? empresa.nombre : 'No especificado'
}

// Funciones de validación
const validarCI = () => {
  const ci = formData.value.ci
  if (!ci) {
    errores.value.ci = 'El CI es obligatorio'
    return false
  }
  
  // Formato: 7-8 dígitos o con complemento (Ej: 1234567-1A)
  // Acepta: 1234567, 12345678, 1234567-1A, 12345678-2B
  const regexCI = /^\d{7,8}(-\d[A-Z])?$/i
  
  if (!regexCI.test(ci)) {
    errores.value.ci = 'Formato válido: 1234567 o 1234567-1A'
    return false
  }
  
  errores.value.ci = ''
  return true
}

const validarCelular = () => {
  const telefono = formData.value.telefono
  if (!telefono) {
    errores.value.telefono = 'El celular es obligatorio'
    return false
  }
  
  // Formato Bolivia: 8 dígitos, inicia con 6 o 7
  const regexCelular = /^[67]\d{7}$/
  
  if (!regexCelular.test(telefono)) {
    errores.value.telefono = 'Debe ser 8 dígitos e iniciar con 6 o 7'
    return false
  }
  
  errores.value.telefono = ''
  return true
}

const validarCelularReferencia = () => {
  const celularRef = formData.value.celularReferencia
  
  // Ahora es obligatorio
  if (!celularRef || celularRef.trim() === '') {
    errores.value.celularReferencia = 'El celular de referencia es obligatorio'
    return false
  }
  
  // Formato Bolivia: 8 dígitos, inicia con 6 o 7
  const regexCelular = /^[67]\d{7}$/
  
  if (!regexCelular.test(celularRef)) {
    errores.value.celularReferencia = 'Debe ser 8 dígitos e iniciar con 6 o 7'
    return false
  }
  
  errores.value.celularReferencia = ''
  return true
}

const validarFormulario = () => {
  const ciValida = validarCI()
  const celularValido = validarCelular()
  const celularRefValido = validarCelularReferencia()
  
  return ciValida && celularValido && celularRefValido
}

const enviarFormulario = async () => {
  // Validar formulario antes de enviar
  if (!validarFormulario()) {
    mensaje.value = 'Por favor corrige los errores en el formulario'
    mensajeTipo.value = 'error'
    return
  }
  
  enviando.value = true
  mensaje.value = ''

  try {
    const resultado = await participanteService.createParticipante(formData.value)

    console.log('===== RESPUESTA COMPLETA DEL BACKEND =====')
    console.log('resultado completo:', resultado)
    console.log('resultado.success:', resultado.success)
    console.log('resultado.data:', resultado.data)
    console.log('resultado.error:', resultado.error)
    console.log('resultado.participante:', resultado.participante)

    // Verificar que el registro fue exitoso
    if (resultado.success && resultado.data) {
      // Guardar datos del participante registrado
      participanteRegistrado.value = resultado.data
      
      // Debug: Verificar que el token esté presente
      console.log('===== PARTICIPANTE REGISTRADO =====')
      console.log('Participante registrado recibido del backend:', participanteRegistrado.value)
      console.log('Token del participante:', participanteRegistrado.value?.token)
      console.log('ID del participante:', participanteRegistrado.value?.id)
      console.log('QR Code del participante:', participanteRegistrado.value?.qrCode)
      console.log('Todas las propiedades:', Object.keys(participanteRegistrado.value || {}))
      
      datosRegistrados.value = { ...formData.value }
      
      // Mostrar modal de confirmación
      mostrarModal.value = true
    } else {
      // Mostrar error
      mensaje.value = resultado.error || 'Error al registrar. Por favor intenta nuevamente.'
      mensajeTipo.value = 'error'
      console.error('Error del backend:', resultado.error)
    }
  } catch (error) {
    console.error('Error:', error)
    mensaje.value = 'Error al procesar el formulario. Por favor intenta nuevamente.'
    mensajeTipo.value = 'error'
  } finally {
    enviando.value = false
  }
}

const cerrarModal = () => {
  mostrarModal.value = false
}

const actualizarDatos = () => {
  // Cerrar modal y mantener datos en el formulario para editar
  mostrarModal.value = false
  mensaje.value = 'Puedes actualizar los datos y enviar nuevamente.'
  mensajeTipo.value = 'info'
}

const confirmarYDescargar = async () => {
  // Cerrar modal de confirmación
  mostrarModal.value = false
  
  // Mostrar modal de descarga en estado "generando"
  mostrarModalDescarga.value = true
  estadoDescarga.value = 'generando'
  
  try {
    // Simular breve espera para mostrar el estado generando
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Cambiar a estado "descargando"
    estadoDescarga.value = 'descargando'
    
    // Generar nombre de archivo
    const nombreArchivo = `Credencial-PARTICIPANTE-${datosRegistrados.value.nombre}-${datosRegistrados.value.apellido}.jpg`
    nombreArchivoDescarga.value = nombreArchivo
    
    // Generar y descargar credencial JPEG
    await generarCredencialPDF(
      participanteRegistrado.value,
      datosRegistrados.value,
      getNombreEmpresa(datosRegistrados.value.empresaId),
      'PARTICIPANTE'
    )
    
    // Cambiar a estado "completado"
    estadoDescarga.value = 'completado'
    
  } catch (error) {
    console.error('Error generando credencial:', error)
    estadoDescarga.value = 'error'
    errorDescarga.value = 'No se pudo generar la credencial. Por favor intenta nuevamente.'
  }
  
  // Limpiar formulario después de descargar
  formData.value = {
    nombre: '',
    apellido: '',
    ci: '',
    telefono: '',
    correo: '',
    zona: '',
    fechaNacimiento: '',
    empresaId: '',
    sexo: '',
    ocupacion: '',
    nombreReferencia: '',
    parentesco: '',
    celularReferencia: ''
  }
  
  // Recargar empresas disponibles por si cambió el cupo
  await cargarEmpresasDisponibles()
}

const cerrarModalDescarga = () => {
  mostrarModalDescarga.value = false
  estadoDescarga.value = 'generando'
  nombreArchivoDescarga.value = ''
  errorDescarga.value = ''
  mensaje.value = '✅ Registro completado exitosamente. Puedes registrar otro participante.'
  mensajeTipo.value = 'success'
  
  // Limpiar mensaje después de 5 segundos
  setTimeout(() => {
    mensaje.value = ''
  }, 5000)
}
</script>

<style scoped>
.registro-participante {
  min-height: 100vh;
  background: linear-gradient(135deg, #6B9080 0%, #A4C3B2 100%);
  font-family: 'Inter', -apple-system, sans-serif;
}

.header-feipobol {
  background: white;
  padding: 20px 40px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.logo-placeholder {
  font-size: 4rem;
}

.logo-img {
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.logo {
  width: 80px;
  height: auto;
}

.header-text h1 {
  margin: 0;
  font-size: 2.5rem;
  color: #333;
  font-weight: 900;
}

.header-text p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 0.95rem;
}

.contenido-formulario {
  max-width: 1400px;
  margin: 40px auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 40px;
  align-items: start;
}

.formulario-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
}

.titulo-formulario {
  text-align: center;
  color: #4A7C59;
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 30px;
  line-height: 1.4;
}

.form-participante {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #FF6B6B;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.requerido {
  color: #FF6B6B;
}

.form-control {
  padding: 12px 15px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #6B9080;
  box-shadow: 0 0 0 3px rgba(107, 144, 128, 0.1);
}

.form-control::placeholder {
  color: #999;
  font-style: italic;
}

.form-control:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.input-error {
  border-color: #dc3545 !important;
  background-color: #fff5f5;
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
}

.mensaje-error {
  display: block;
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 5px;
  font-weight: 600;
}

.mensaje-ayuda {
  display: block;
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 5px;
  font-style: italic;
}

.text-warning {
  color: #FF8800;
  font-size: 0.85rem;
  margin-top: 5px;
  display: block;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-row .form-group {
  min-width: 0; /* Permite que los elementos se encojan si es necesario */
}

.form-row select.form-control {
  min-width: 0; /* Previene que el select expanda demasiado */
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.zona-group {
  position: relative;
  min-width: 0; /* Permite que el grupo se encoja */
  width: 100%;
}

.buscador-zona {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.buscador-zona:focus {
  outline: none;
  border-color: #6B9080;
  box-shadow: 0 0 0 3px rgba(107, 144, 128, 0.1);
}

.lista-zonas {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 250px;
  overflow-y: auto;
  background: white;
  border: 2px solid #6B9080;
  border-radius: 8px;
  margin-top: 5px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.zona-item {
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f0f0f0;
}

.zona-item:last-child {
  border-bottom: none;
}

.zona-item:hover {
  background-color: #6B9080;
  color: white;
}

.zona-no-encontrada {
  padding: 12px 15px;
  color: #6c757d;
  font-style: italic;
  text-align: center;
}

.seccion-referencia {
  background: #F9F9F9;
  padding: 20px;
  border-radius: 12px;
  margin-top: 10px;
}

.seccion-referencia h3 {
  color: #4A7C59;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.notas-importante {
  background: #FFF3CD;
  border-left: 4px solid #FF6B6B;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.notas-importante p {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #856404;
}

.btn-enviar {
  background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;
  letter-spacing: 1px;
}

.btn-enviar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
}

.btn-enviar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mensaje {
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
  text-align: center;
  font-weight: 600;
}

.mensaje.success {
  background: #D4EDDA;
  color: #155724;
  border: 1px solid #C3E6CB;
}

.mensaje.error {
  background: #F8D7DA;
  color: #721C24;
  border: 1px solid #F5C6CB;
}

.mensaje.info {
  background: #D1ECF1;
  color: #0C5460;
  border: 1px solid #BEE5EB;
}

.mensaje.warning {
  background: #FFF3CD;
  color: #856404;
  border: 1px solid #FFEAA7;
}

.imagen-lado {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 60px;
  backdrop-filter: blur(10px);
}

.logo-grande {
  text-align: center;
}

.logo-decorativo-emoji {
  font-size: 15rem;
  margin-bottom: 30px;
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.2));
}

.logo-decorativo {
  width: 300px;
  height: auto;
  margin-bottom: 30px;
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.2));
}

.texto-feipobol {
  font-size: 3.5rem;
  font-weight: 900;
  color: white;
  text-shadow: 2px 2px 10px rgba(0,0,0,0.3);
  letter-spacing: 2px;
}

@media (max-width: 1024px) {
  .contenido-formulario {
    grid-template-columns: 1fr !important;
    padding: 15px;
  }

  .imagen-lado {
    display: none !important;
  }
  
  .formulario-card {
    max-width: 100%;
  }
}

/* Tablets y dispositivos medianos */
@media (max-width: 768px) {
  .registro-participante {
    padding: 0;
  }

  .header-feipobol {
    padding: 15px 10px;
  }

  .logo-container {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }

  .logo-img {
    width: 60px;
    height: 60px;
  }

  .header-text h1 {
    font-size: 1.8rem;
    line-height: 1.3;
  }

  .header-text p {
    font-size: 0.85rem;
  }

  .contenido-formulario {
    padding: 15px 10px;
    grid-template-columns: 1fr !important;
  }

  .formulario-card {
    padding: 20px 15px;
    border-radius: 15px;
  }

  .titulo-formulario {
    font-size: 1.3rem;
    margin-bottom: 20px;
  }

  .form-row {
    grid-template-columns: 1fr !important;
    gap: 15px;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-group label {
    font-size: 0.9rem;
  }

  .form-control, .buscador-zona, select {
    padding: 10px 12px;
    font-size: 0.95rem;
  }

  .btn-enviar {
    padding: 14px 25px;
    font-size: 1rem;
    width: 100%;
  }

  .lista-zonas {
    max-height: 200px;
  }

  .zona-item {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
  
  .modal-confirmacion {
    max-width: 95%;
    margin: 0 10px;
  }

  .modal-acciones {
    grid-template-columns: 1fr !important;
    gap: 12px;
  }
  
  .modal-header h2 {
    font-size: 1.3rem;
  }
  
  .icono-exito {
    font-size: 3rem;
  }

  .btn-actualizar, .btn-confirmar {
    padding: 12px 20px;
    font-size: 0.9rem;
    width: 100%;
  }

  .seccion-referencia {
    padding: 15px;
    border-radius: 10px;
  }

  .seccion-referencia h3 {
    font-size: 1rem;
  }
}

/* Móviles */
@media (max-width: 480px) {
  .registro-participante {
    padding: 0;
  }

  .header-feipobol {
    padding: 12px 8px;
  }

  .logo-img {
    width: 50px;
    height: 50px;
  }

  .header-text h1 {
    font-size: 1.5rem;
    line-height: 1.3;
  }

  .header-text p {
    font-size: 0.75rem;
  }

  .contenido-formulario {
    padding: 10px 5px;
    grid-template-columns: 1fr !important;
  }

  .formulario-card {
    padding: 15px 10px;
    border-radius: 12px;
  }

  .titulo-formulario {
    font-size: 1.1rem;
    margin-bottom: 15px;
    line-height: 1.3;
  }

  .form-row {
    grid-template-columns: 1fr !important;
    gap: 12px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-group label {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }

  .form-control, .buscador-zona, select {
    padding: 9px 10px;
    font-size: 0.9rem;
  }

  .btn-enviar {
    padding: 12px;
    font-size: 0.95rem;
    width: 100%;
  }

  .mensaje-error, .mensaje-ayuda {
    font-size: 0.8rem;
  }

  .lista-zonas {
    max-height: 180px;
  }

  .zona-item {
    padding: 9px 10px;
    font-size: 0.85rem;
  }

  .modal-overlay {
    padding: 10px;
  }

  .modal-confirmacion {
    max-width: 100%;
    margin: 0;
  }

  .modal-header {
    padding: 20px 15px;
  }

  .modal-body {
    padding: 20px 15px;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }

  .icono-exito {
    font-size: 2.5rem;
  }

  .datos-confirmacion {
    padding: 15px;
  }

  .datos-confirmacion p {
    font-size: 0.9rem;
    margin-bottom: 8px;
  }

  .pregunta-confirmacion {
    font-size: 0.95rem;
  }

  .btn-actualizar, .btn-confirmar {
    padding: 10px 15px;
    font-size: 0.9rem;
    width: 100%;
  }

  .seccion-referencia {
    padding: 12px;
  }

  .seccion-referencia h3 {
    font-size: 0.95rem;
    margin-bottom: 12px;
  }

  .requerido {
    font-size: 0.9rem;
  }

  .text-warning {
    font-size: 0.8rem;
  }

  .notas-importante {
    padding: 12px;
    font-size: 0.85rem;
  }

  .notas-importante p {
    font-size: 0.8rem;
  }
}

/* Móviles pequeños */
@media (max-width: 360px) {
  .header-feipobol {
    padding: 10px 5px;
  }

  .logo-img {
    width: 45px;
    height: 45px;
  }

  .header-text h1 {
    font-size: 1.3rem;
    line-height: 1.2;
  }

  .header-text p {
    font-size: 0.7rem;
  }

  .contenido-formulario {
    padding: 8px 5px;
  }

  .formulario-card {
    padding: 12px 8px;
    border-radius: 10px;
  }

  .titulo-formulario {
    font-size: 1rem;
    margin-bottom: 12px;
  }

  .form-group {
    margin-bottom: 10px;
  }

  .form-group label {
    font-size: 0.8rem;
    margin-bottom: 5px;
  }

  .form-control, .buscador-zona, select {
    padding: 8px;
    font-size: 0.85rem;
  }

  .btn-enviar {
    padding: 10px;
    font-size: 0.9rem;
  }

  .lista-zonas {
    max-height: 150px;
  }

  .zona-item {
    padding: 8px;
    font-size: 0.8rem;
  }

  .modal-header {
    padding: 15px 10px;
  }

  .modal-body {
    padding: 15px 10px;
  }

  .modal-header h2 {
    font-size: 1rem;
  }

  .icono-exito {
    font-size: 2rem;
  }

  .datos-confirmacion {
    padding: 12px;
  }

  .datos-confirmacion p {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }

  .pregunta-confirmacion {
    font-size: 0.9rem;
  }

  .btn-actualizar, .btn-confirmar {
    padding: 9px 12px;
    font-size: 0.85rem;
  }

  .seccion-referencia {
    padding: 10px;
  }

  .seccion-referencia h3 {
    font-size: 0.9rem;
  }

  .notas-importante {
    padding: 10px;
  }

  .notas-importante p {
    font-size: 0.75rem;
  }

  .mensaje-error, .mensaje-ayuda {
    font-size: 0.75rem;
  }
}

/* Modal de confirmación */
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
}

.modal-confirmacion {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: modalEntrada 0.3s ease-out;
}

@keyframes modalEntrada {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  background: linear-gradient(135deg, #6B9080 0%, #A4C3B2 100%);
  padding: 30px;
  text-align: center;
  color: white;
  border-radius: 20px 20px 0 0;
}

.icono-exito {
  font-size: 4rem;
  margin-bottom: 15px;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

.modal-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.modal-body {
  padding: 30px;
}

.datos-confirmacion {
  background: #F9F9F9;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 25px;
}

.datos-confirmacion p {
  margin: 12px 0;
  color: #333;
  font-size: 1rem;
}

.datos-confirmacion strong {
  color: #6B9080;
  font-weight: 700;
}

.pregunta-confirmacion {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #4A7C59;
  margin: 20px 0;
}

.modal-acciones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding: 0 30px 30px 30px;
}

.btn-actualizar,
.btn-confirmar {
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-actualizar {
  background: #E0E0E0;
  color: #333;
}

.btn-actualizar:hover {
  background: #D0D0D0;
  transform: translateY(-2px);
}

.btn-confirmar {
  background: linear-gradient(135deg, #6B9080 0%, #8FA89B 100%);
  color: white;
}

.btn-confirmar:hover {
  background: linear-gradient(135deg, #5A7A6A 0%, #7A938A 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(107, 144, 128, 0.4);
}

/* Modal de Departamentos de Bolivia */
.modal-departamentos {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-departamentos h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.8rem;
  text-align: center;
  padding-right: 40px;
}

.descripcion-modal {
  text-align: center;
  color: #666;
  margin-bottom: 25px;
  font-size: 1rem;
  line-height: 1.5;
}

.btn-cerrar-modal {
  position: absolute;
  top: 15px;
  right: 15px;
  background: #FF6B6B;
  color: white;
  border: none;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  font-size: 1.3rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-weight: bold;
  line-height: 1;
}

.btn-cerrar-modal:hover {
  background: #E55A5A;
  transform: rotate(90deg);
}

.grid-departamentos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: 20px;
}

.card-departamento {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #dee2e6;
  border-radius: 12px;
  padding: 20px 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-departamento:hover {
  background: linear-gradient(135deg, #6B9080 0%, #A4C3B2 100%);
  border-color: #6B9080;
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(107, 144, 128, 0.3);
}

.card-departamento:hover .nombre-depto {
  color: white;
}

.card-departamento:hover .icono-depto {
  transform: scale(1.2);
}

.icono-depto {
  font-size: 3rem;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.nombre-depto {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  transition: all 0.3s ease;
}

/* Responsive para Modal de Departamentos */
@media (max-width: 768px) {
  .modal-departamentos {
    padding: 25px 20px;
    max-width: 95%;
  }

  .modal-departamentos h3 {
    font-size: 1.4rem;
    padding-right: 35px;
  }

  .descripcion-modal {
    font-size: 0.9rem;
    margin-bottom: 20px;
  }

  .grid-departamentos {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .card-departamento {
    padding: 15px 10px;
  }

  .icono-depto {
    font-size: 2.5rem;
  }

  .nombre-depto {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .modal-departamentos {
    padding: 20px 15px;
  }

  .modal-departamentos h3 {
    font-size: 1.2rem;
  }

  .descripcion-modal {
    font-size: 0.85rem;
  }

  .grid-departamentos {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .card-departamento {
    padding: 15px;
  }

  .icono-depto {
    font-size: 2rem;
  }

  .nombre-depto {
    font-size: 0.85rem;
  }

  .btn-cerrar-modal {
    width: 30px;
    height: 30px;
    font-size: 1.1rem;
  }
}
</style>
