<template>
  <div class="participantes-lista">
    <div class="header-lista">
      <h2>🎯 Lista de Participantes</h2>
      <div class="header-acciones">
        <button @click="abrirModalEmpresas" class="btn-gestionar-empresas">
          🏢 GESTIONAR EMPRESAS/STANDS
        </button>
        <button @click="copiarLink" class="btn-copiar-link">
          📋 Copiar Link de Registro
        </button>
      </div>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="barra-busqueda">
      <input 
        v-model="busqueda" 
        type="text" 
        placeholder="Buscar por nombre, apellido o CI..."
        class="input-busqueda"
      />
      <select v-model="filtroEmpresa" class="select-filtro-empresa">
        <option value="">Todas las empresas</option>
        <option v-for="empresa in empresasFiltro" :key="empresa.id" :value="empresa.id">
          {{ empresa.nombre }} ({{ empresa.participantesCount }})
        </option>
      </select>
      <select v-model="filtroEstado" class="select-filtro-estado">
        <option value="">Todos los estados</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
        <option value="suspendido">Suspendidos</option>
      </select>
      <button @click="cargarParticipantes" class="btn-refrescar" :disabled="cargando">
        🔄 {{ cargando ? 'Cargando...' : 'Refrescar' }}
      </button>
    </div>

    <!-- Mensaje -->
    <div v-if="mensaje" :class="['alerta', mensajeTipo]">
      {{ mensaje }}
    </div>

    <!-- Loading -->
    <div v-if="cargando" class="loading">
      <div class="spinner"></div>
      <p>Cargando participantes...</p>
    </div>

    <!-- Tabla de participantes -->
    <div v-else-if="participantesFiltrados.length > 0" class="tabla-container">
      <table class="tabla-participantes">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>CI</th>
            <th>Empresa/Stand</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Credencial</th>
            <th>Acceso Hoy</th>
            <th>Token</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="participante in participantesFiltrados" :key="participante.id">
            <td class="nombre-col">
              {{ participante.nombre }} {{ participante.apellido }}
            </td>
            <td>{{ participante.ci || 'No registrado' }}</td>
            <td class="empresa-col">
              <span v-if="participante.Empresa" class="badge-empresa">
                🏢 {{ participante.Empresa.nombre }}
              </span>
              <span v-else class="sin-empresa">-</span>
            </td>
            <td>{{ participante.telefono }}</td>
            <td>
              <span :class="['badge-estado', `estado-${participante.estado}`]">
                {{ participante.estado.toUpperCase() }}
              </span>
            </td>
            <td class="credencial-col">
              <button 
                @click="toggleEstadoCredencial(participante)" 
                :class="['btn-toggle-credencial', participante.estado === 'activo' ? 'activa' : 'inactiva']"
                :title="participante.estado === 'activo' ? 'Desactivar credencial' : 'Activar credencial'"
              >
                {{ participante.estado === 'activo' ? '✅ ACTIVA' : '❌ INACTIVA' }}
              </button>
            </td>
            <td class="acceso-col">
              <span :class="['badge-acceso', ingresoHoy(participante.ultimoAcceso) ? 'ingreso' : 'pendiente']">
                {{ ingresoHoy(participante.ultimoAcceso) ? '✅ INGRESÓ' : '⏳ PENDIENTE' }}
              </span>
              <div v-if="participante.ultimoAcceso" class="ultimo-acceso-hint">
                {{ formatearFecha(participante.ultimoAcceso) }}
              </div>
            </td>
            <td class="token-col">
              <code>{{ participante.token.substring(0, 8) }}...</code>
            </td>
            <td class="acciones-col">
              <button @click="verDetalle(participante)" class="btn-accion ver" title="Ver detalle">
                👁️
              </button>
              <button @click="generarCredencial(participante)" class="btn-accion credencial" title="Generar Credencial">
                🎫
              </button>
              <button @click="eliminarParticipante(participante.id)" class="btn-accion eliminar" title="Eliminar">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sin resultados -->
    <div v-else class="sin-datos">
      <p>No hay participantes registrados</p>
      <button @click="copiarLink" class="btn-secundario">
        📋 Copiar Link de Registro
      </button>
    </div>

    <!-- Modal de detalle -->
    <div v-if="participanteSeleccionado" class="modal-overlay" @click="cerrarModal">
      <div class="modal-contenido" @click.stop>
        <button @click="cerrarModal" class="btn-cerrar-modal">✕</button>
        <h3>Detalle del Participante</h3>
        
        <div class="detalle-grid">
          <div class="detalle-item">
            <strong>Nombre completo:</strong>
            <p>{{ participanteSeleccionado.nombre }} {{ participanteSeleccionado.apellido }}</p>
          </div>
          <div class="detalle-item">
            <strong>CI:</strong>
            <p>{{ participanteSeleccionado.ci || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Teléfono:</strong>
            <p>{{ participanteSeleccionado.telefono }}</p>
          </div>
          <div class="detalle-item">
            <strong>Correo:</strong>
            <p>{{ participanteSeleccionado.correo || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Zona:</strong>
            <p>{{ participanteSeleccionado.zona || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Área:</strong>
            <p>{{ participanteSeleccionado.area || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Ocupación:</strong>
            <p>{{ participanteSeleccionado.ocupacion || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Sexo:</strong>
            <p>{{ participanteSeleccionado.sexo || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Fecha de Nacimiento:</strong>
            <p>{{ participanteSeleccionado.fechaNacimiento || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Estado:</strong>
            <p>{{ participanteSeleccionado.estado }}</p>
          </div>
          <div class="detalle-item full-width">
            <strong>Token:</strong>
            <code>{{ participanteSeleccionado.token }}</code>
          </div>
          
          <!-- Referencia -->
          <div v-if="participanteSeleccionado.nombreReferencia" class="detalle-item full-width seccion-referencia">
            <strong>Referencia:</strong>
            <p>
              {{ participanteSeleccionado.nombreReferencia }} 
              ({{ participanteSeleccionado.parentesco }}) - 
              Tel: {{ participanteSeleccionado.celularReferencia }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Gestión de Empresas/Stands -->
    <div v-if="mostrarModalEmpresas" class="modal-overlay" @click="cerrarModalEmpresas">
      <div class="modal-empresas" @click.stop>
        <button @click="cerrarModalEmpresas" class="btn-cerrar-modal">✕</button>
        <h3>🏢 Gestión de Empresas/Stands</h3>
        
        <!-- Formulario para agregar empresa -->
        <div class="form-empresa">
          <h4>➕ Agregar Nueva Empresa/Stand</h4>
          <div class="form-row-empresa">
            <input 
              v-model="nuevaEmpresa.nombre" 
              type="text" 
              placeholder="Nombre de la empresa/stand"
              class="input-empresa"
            />
            <input 
              v-model.number="nuevaEmpresa.cupoTotal" 
              type="number" 
              min="1"
              placeholder="Cupo total"
              class="input-cupo"
            />
            <button 
              @click="agregarEmpresa" 
              class="btn-agregar-empresa"
              :disabled="!nuevaEmpresa.nombre || !nuevaEmpresa.cupoTotal || guardandoEmpresa"
            >
              {{ guardandoEmpresa ? '⏳' : '➕' }} AGREGAR
            </button>
          </div>
        </div>

        <!-- Mensaje de operación -->
        <div v-if="mensajeEmpresa" :class="['alerta-empresa', tipoMensajeEmpresa]">
          {{ mensajeEmpresa }}
        </div>

        <!-- Tabla de empresas -->
        <div class="tabla-empresas-container">
          <h4>📊 Empresas Registradas</h4>
          
          <div v-if="cargandoEmpresas" class="loading-empresas">
            <div class="spinner"></div>
            <p>Cargando empresas...</p>
          </div>

          <table v-else-if="empresas.length > 0" class="tabla-empresas">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Cupo (Usado/Total)</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="empresa in empresas" :key="empresa.id">
                <td>
                  <span v-if="editandoEmpresa?.id !== empresa.id">
                    {{ empresa.nombre }}
                  </span>
                  <input 
                    v-else
                    v-model="editandoEmpresa.nombre"
                    type="text"
                    class="input-editar-nombre"
                  />
                </td>
                <td>
                  <span v-if="editandoEmpresa?.id !== empresa.id">
                    <strong>{{ empresa.cupoUsado || 0 }}</strong> / <strong>{{ empresa.cupoTotal }}</strong>
                  </span>
                  <input 
                    v-else
                    v-model.number="editandoEmpresa.cupoTotal"
                    type="number"
                    min="1"
                    class="input-editar-cupo"
                  />
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: `${empresa.porcentajeUso || 0}%` }"
                      :class="{ 'completo': (empresa.porcentajeUso || 0) >= 100 }"
                    ></div>
                  </div>
                </td>
                <td>
                  <span :class="['badge-estado-empresa', (empresa.cupoDisponible || 0) > 0 ? 'disponible' : 'completo']">
                    {{ (empresa.cupoDisponible || 0) > 0 ? '✅ DISPONIBLE' : '🔴 COMPLETO' }}
                  </span>
                </td>
                <td class="acciones-empresa-col">
                  <template v-if="editandoEmpresa?.id === empresa.id">
                    <button @click="guardarEdicion" class="btn-accion-empresa guardar" title="Guardar">
                      💾
                    </button>
                    <button @click="cancelarEdicion" class="btn-accion-empresa cancelar" title="Cancelar">
                      ✕
                    </button>
                  </template>
                  <template v-else>
                    <button @click="iniciarEdicion(empresa)" class="btn-accion-empresa editar" title="Editar">
                      ✏️
                    </button>
                    <button @click="eliminarEmpresa(empresa.id, empresa.cupoUsado)" class="btn-accion-empresa eliminar" title="Eliminar">
                      🗑️
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="sin-empresas">
            <p>📭 No hay empresas/stands registrados</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { participanteService, empresaService } from '../services/api'
import { generarCredencialPDF } from '../utils/credencialGenerator'

const participantes = ref([])
const busqueda = ref('')
const filtroEmpresa = ref('')
const filtroEstado = ref('')
const empresasFiltro = ref([])
const cargando = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('')
const participanteSeleccionado = ref(null)

// Variables para gestión de empresas
const mostrarModalEmpresas = ref(false)
const empresas = ref([])
const cargandoEmpresas = ref(false)
const guardandoEmpresa = ref(false)
const mensajeEmpresa = ref('')
const tipoMensajeEmpresa = ref('')
const nuevaEmpresa = ref({
  nombre: '',
  cupoTotal: null
})
const editandoEmpresa = ref(null)

const participantesFiltrados = computed(() => {
  let resultado = participantes.value
  
  // Filtro por búsqueda
  if (busqueda.value) {
    const termino = busqueda.value.toLowerCase()
    resultado = resultado.filter(p => 
      p.nombre.toLowerCase().includes(termino) ||
      p.apellido.toLowerCase().includes(termino) ||
      (p.ci && p.ci.toLowerCase().includes(termino))
    )
  }
  
  // Filtro por empresa
  if (filtroEmpresa.value) {
    resultado = resultado.filter(p => p.empresaId === filtroEmpresa.value)
  }
  
  // Filtro por estado
  if (filtroEstado.value) {
    resultado = resultado.filter(p => p.estado === filtroEstado.value)
  }
  
  return resultado
})

const cargarParticipantes = async () => {
  cargando.value = true
  mensaje.value = ''

  try {
    const resultado = await participanteService.getAllParticipantes()
    
    if (resultado.success) {
      participantes.value = resultado.data.participantes || []
      
      // Cargar empresas para el filtro
      await cargarEmpresasParaFiltro()
    } else {
      mensaje.value = 'Error al cargar participantes'
      mensajeTipo.value = 'error'
    }
  } catch (error) {
    console.error('Error:', error)
    mensaje.value = 'Error al cargar participantes'
    mensajeTipo.value = 'error'
  } finally {
    cargando.value = false
  }
}

const cargarEmpresasParaFiltro = async () => {
  try {
    const resultado = await empresaService.getAllEmpresas()
    if (resultado.success) {
      // Contar participantes por empresa
      const empresasConConteo = resultado.data.map(empresa => {
        const participantesCount = participantes.value.filter(
          p => p.empresaId === empresa.id
        ).length
        return {
          ...empresa,
          participantesCount
        }
      })
      empresasFiltro.value = empresasConConteo.filter(e => e.participantesCount > 0)
    }
  } catch (error) {
    console.error('Error cargando empresas para filtro:', error)
  }
}

const toggleEstadoCredencial = async (participante) => {
  const nuevoEstado = participante.estado === 'activo' ? 'inactivo' : 'activo'
  const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar'
  
  if (!confirm(`¿Estás seguro de ${accion} la credencial de ${participante.nombre} ${participante.apellido}?`)) {
    return
  }
  
  try {
    const resultado = await participanteService.updateParticipante(participante.id, {
      estado: nuevoEstado
    })
    
    if (resultado.success) {
      mensaje.value = `Credencial ${nuevoEstado === 'activo' ? 'activada' : 'desactivada'} exitosamente`
      mensajeTipo.value = 'success'
      await cargarParticipantes()
    } else {
      mensaje.value = resultado.error || 'Error al actualizar el estado'
      mensajeTipo.value = 'error'
    }
  } catch (error) {
    console.error('Error:', error)
    mensaje.value = 'Error al actualizar el estado de la credencial'
    mensajeTipo.value = 'error'
  }
  
  setTimeout(() => { mensaje.value = '' }, 3000)
}

const copiarLink = () => {
  const link = `${window.location.origin}/registro-participante`
  navigator.clipboard.writeText(link).then(() => {
    mensaje.value = '¡Link copiado al portapapeles!'
    mensajeTipo.value = 'success'
    setTimeout(() => { mensaje.value = '' }, 3000)
  })
}

// Helper: Verificar si ingresó hoy (después de las 10 AM)
const ingresoHoy = (ultimoAcceso) => {
  if (!ultimoAcceso) return false
  
  const ahora = new Date()
  const ultimoIngresoDate = new Date(ultimoAcceso)
  
  // Hora de reinicio (10 AM del día actual)
  const horaReinicioHoy = new Date(ahora)
  horaReinicioHoy.setHours(10, 0, 0, 0)
  
  // Si aún no son las 10 AM, la hora de reinicio es 10 AM de ayer
  const horaReinicioReferencia = ahora >= horaReinicioHoy ? 
    horaReinicioHoy : 
    new Date(horaReinicioHoy.getTime() - 24 * 60 * 60 * 1000)
  
  // Verificar si el último acceso fue después de la última hora de reinicio
  return ultimoIngresoDate >= horaReinicioReferencia
}

const formatearFecha = (fecha) => {
  if (!fecha) return ''
  const date = new Date(fecha)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const verDetalle = (participante) => {
  participanteSeleccionado.value = participante
}

const cerrarModal = () => {
  participanteSeleccionado.value = null
}

const eliminarParticipante = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este participante?')) return

  try {
    const resultado = await participanteService.deleteParticipante(id)
    
    if (resultado.success) {
      mensaje.value = 'Participante eliminado exitosamente'
      mensajeTipo.value = 'success'
      cargarParticipantes()
    } else {
      mensaje.value = 'Error al eliminar participante'
      mensajeTipo.value = 'error'
    }
  } catch (error) {
    console.error('Error:', error)
    mensaje.value = 'Error al eliminar participante'
    mensajeTipo.value = 'error'
  }
}

const generarCredencial = async (participante) => {
  // Obtener el nombre de la empresa
  const empresa = empresasFiltro.value.find(e => e.id === participante.empresaId) || 
                 empresas.value.find(e => e.id === participante.empresaId)
  const empresaNombre = empresa ? empresa.nombre : ''

  // Crear objeto de datos del formulario para el generador de PDF
  const datosFormulario = {
    nombre: participante.nombre,
    apellido: participante.apellido,
    ci: participante.ci,
    area: participante.area,
    fechaInicio: participante.fechaInicio || new Date().toISOString().split('T')[0],
    fechaFin: participante.fechaFin || new Date().toISOString().split('T')[0]
  }

  // Generar PDF con el nuevo sistema
  await generarCredencialPDF(
    participante,
    datosFormulario,
    empresaNombre,
    'PARTICIPANTE'
  )
}

// Funciones de gestión de empresas
const abrirModalEmpresas = async () => {
  mostrarModalEmpresas.value = true
  await cargarEmpresas()
}

const cerrarModalEmpresas = () => {
  mostrarModalEmpresas.value = false
  editandoEmpresa.value = null
  mensajeEmpresa.value = ''
}

const cargarEmpresas = async () => {
  cargandoEmpresas.value = true
  mensajeEmpresa.value = ''

  try {
    const resultado = await empresaService.getAllEmpresas()
    if (resultado.success) {
      empresas.value = resultado.data
      console.log('✅ Empresas cargadas:', empresas.value)
    } else {
      mensajeEmpresa.value = resultado.error || 'Error al cargar empresas'
      tipoMensajeEmpresa.value = 'error'
    }
  } catch (error) {
    console.error('Error cargando empresas:', error)
    mensajeEmpresa.value = 'Error al cargar empresas'
    tipoMensajeEmpresa.value = 'error'
  } finally {
    cargandoEmpresas.value = false
  }
}

const agregarEmpresa = async () => {
  if (!nuevaEmpresa.value.nombre || !nuevaEmpresa.value.cupoTotal) {
    mensajeEmpresa.value = 'Por favor completa todos los campos'
    tipoMensajeEmpresa.value = 'error'
    return
  }

  guardandoEmpresa.value = true
  mensajeEmpresa.value = ''

  try {
    const resultado = await empresaService.createEmpresa(nuevaEmpresa.value)
    if (resultado.success) {
      mensajeEmpresa.value = '✅ Empresa/Stand creada exitosamente'
      tipoMensajeEmpresa.value = 'success'
      
      // Limpiar formulario
      nuevaEmpresa.value = {
        nombre: '',
        cupoTotal: null
      }
      
      // Recargar lista
      await cargarEmpresas()
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        mensajeEmpresa.value = ''
      }, 3000)
    } else {
      mensajeEmpresa.value = resultado.error || 'Error al crear empresa'
      tipoMensajeEmpresa.value = 'error'
    }
  } catch (error) {
    console.error('Error creando empresa:', error)
    mensajeEmpresa.value = 'Error al crear empresa/stand'
    tipoMensajeEmpresa.value = 'error'
  } finally {
    guardandoEmpresa.value = false
  }
}

const iniciarEdicion = (empresa) => {
  editandoEmpresa.value = {
    id: empresa.id,
    nombre: empresa.nombre,
    cupoTotal: empresa.cupoTotal,
    cupoUsado: empresa.cupoUsado || 0
  }
}

const cancelarEdicion = () => {
  editandoEmpresa.value = null
}

const guardarEdicion = async () => {
  if (!editandoEmpresa.value.nombre || !editandoEmpresa.value.cupoTotal) {
    mensajeEmpresa.value = 'Por favor completa todos los campos'
    tipoMensajeEmpresa.value = 'error'
    return
  }

  if (editandoEmpresa.value.cupoTotal < editandoEmpresa.value.cupoUsado) {
    mensajeEmpresa.value = `El cupo total no puede ser menor a ${editandoEmpresa.value.cupoUsado} (cupo usado actual)`
    tipoMensajeEmpresa.value = 'error'
    return
  }

  guardandoEmpresa.value = true
  mensajeEmpresa.value = ''

  try {
    const resultado = await empresaService.updateEmpresa(editandoEmpresa.value.id, {
      nombre: editandoEmpresa.value.nombre,
      cupoTotal: editandoEmpresa.value.cupoTotal
    })

    if (resultado.success) {
      mensajeEmpresa.value = '✅ Empresa/Stand actualizada exitosamente'
      tipoMensajeEmpresa.value = 'success'
      editandoEmpresa.value = null
      
      // Recargar lista
      await cargarEmpresas()
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        mensajeEmpresa.value = ''
      }, 3000)
    } else {
      mensajeEmpresa.value = resultado.error || 'Error al actualizar empresa'
      tipoMensajeEmpresa.value = 'error'
    }
  } catch (error) {
    console.error('Error actualizando empresa:', error)
    mensajeEmpresa.value = 'Error al actualizar empresa/stand'
    tipoMensajeEmpresa.value = 'error'
  } finally {
    guardandoEmpresa.value = false
  }
}

const eliminarEmpresa = async (id, cupoUsado) => {
  if (cupoUsado > 0) {
    if (!confirm(`Esta empresa tiene ${cupoUsado} participantes registrados. ¿Estás seguro de que deseas eliminarla? Esto podría afectar los registros existentes.`)) {
      return
    }
  } else {
    if (!confirm('¿Estás seguro de que deseas eliminar esta empresa/stand?')) {
      return
    }
  }

  mensajeEmpresa.value = ''

  try {
    const resultado = await empresaService.deleteEmpresa(id)
    if (resultado.success) {
      mensajeEmpresa.value = '✅ Empresa/Stand eliminada exitosamente'
      tipoMensajeEmpresa.value = 'success'
      
      // Recargar lista
      await cargarEmpresas()
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        mensajeEmpresa.value = ''
      }, 3000)
    } else {
      mensajeEmpresa.value = resultado.error || 'Error al eliminar empresa'
      tipoMensajeEmpresa.value = 'error'
    }
  } catch (error) {
    console.error('Error eliminando empresa:', error)
    mensajeEmpresa.value = 'Error al eliminar empresa/stand'
    tipoMensajeEmpresa.value = 'error'
  }
}

onMounted(() => {
  cargarParticipantes()
})
</script>

<style scoped>
/* Mismos estilos que TrabajadoresList.vue */
.participantes-lista {
  padding: 20px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.header-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.header-lista h2 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
}

.btn-copiar-link {
  background: #6B9080;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-copiar-link:hover {
  background: #5A7D6F;
  transform: translateY(-2px);
}

.barra-busqueda {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.input-busqueda {
  flex: 2;
  min-width: 200px;
  padding: 12px 20px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 1rem;
}

.input-busqueda:focus {
  outline: none;
  border-color: #6B9080;
}

.select-filtro-empresa,
.select-filtro-estado {
  flex: 1;
  min-width: 150px;
  padding: 12px 15px;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-filtro-empresa:focus,
.select-filtro-estado:focus {
  outline: none;
  border-color: #6B9080;
}

.select-filtro-empresa:hover,
.select-filtro-estado:hover {
  border-color: #A4C3B2;
}

.btn-refrescar {
  background: #FF6B6B;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-refrescar:hover:not(:disabled) {
  background: #E55A5A;
}

.btn-refrescar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alerta {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 600;
}

.alerta.success {
  background: #D4EDDA;
  color: #155724;
}

.alerta.error {
  background: #F8D7DA;
  color: #721C24;
}

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #6B9080;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.tabla-container {
  background: white;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  -webkit-overflow-scrolling: touch; /* Scroll suave en iOS */
  width: 100%;
  max-width: 100%;
  position: relative;
}

.tabla-participantes {
  width: 100%;
  border-collapse: collapse;
  min-width: 1100px; /* Ancho mínimo para scroll horizontal */
  table-layout: auto;
}

.tabla-participantes thead {
  background: #6B9080;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tabla-participantes th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap; /* Evitar que los títulos se rompan */
}

.tabla-participantes td {
  padding: 15px;
  border-bottom: 1px solid #E0E0E0;
  white-space: nowrap;
}

.tabla-participantes tbody tr:hover {
  background: #F9F9F9;
}

.nombre-col {
  font-weight: 600;
  color: #333;
  min-width: 150px;
}

.badge-estado {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.estado-activo {
  background: #D4EDDA;
  color: #155724;
}

.estado-inactivo {
  background: #F8D7DA;
  color: #721C24;
}

.estado-suspendido {
  background: #FFF3CD;
  color: #856404;
}

/* Badge de Empresa */
.empresa-col {
  text-align: center;
}

.badge-empresa {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.sin-empresa {
  color: #999;
  font-style: italic;
}

/* Botón Toggle Credencial */
.credencial-col {
  text-align: center;
}

.btn-toggle-credencial {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-toggle-credencial.activa {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.btn-toggle-credencial.activa:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.btn-toggle-credencial.inactiva {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
}

.btn-toggle-credencial.inactiva:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

/* Badges de Acceso */
.acceso-col {
  text-align: center;
}

.badge-acceso {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-acceso.ingreso {
  background: #D4EDDA;
  color: #155724;
  border: 2px solid #4CAF50;
}

.badge-acceso.pendiente {
  background: #FFF3CD;
  color: #856404;
  border: 2px solid #FFC107;
}

.ultimo-acceso-hint {
  font-size: 0.75rem;
  color: #666;
  margin-top: 4px;
}

.token-col code {
  background: #F0F0F0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.acciones-col {
  display: flex;
  gap: 10px;
}

.btn-accion {
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-accion:hover {
  transform: scale(1.2);
}

.btn-accion.credencial {
  filter: hue-rotate(90deg);
}

.sin-datos {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
}

.sin-datos p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 20px;
}

.btn-secundario {
  background: #6B9080;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secundario:hover {
  background: #5A7D6F;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-contenido {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
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
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cerrar-modal:hover {
  background: #E55A5A;
  transform: rotate(90deg);
}

.modal-contenido h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 25px;
}

.detalle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.detalle-item {
  background: #F9F9F9;
  padding: 15px;
  border-radius: 8px;
}

.detalle-item strong {
  display: block;
  color: #6B9080;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.detalle-item p,
.detalle-item code {
  margin: 0;
  color: #333;
  font-size: 1rem;
}

.detalle-item.full-width {
  grid-column: 1 / -1;
}

.seccion-referencia {
  background: #E8F5E9;
  border-left: 4px solid #6B9080;
}

@media (max-width: 768px) {
  .participantes-lista {
    padding: 15px;
  }

  .header-lista {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .header-lista h2 {
    font-size: 1.5rem;
  }
  
  .header-acciones {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-gestionar-empresas,
  .btn-copiar-link {
    width: 100%;
  }

  .barra-busqueda {
    flex-direction: column;
    gap: 10px;
  }
  
  .input-busqueda,
  .select-filtro-empresa,
  .select-filtro-estado,
  .btn-refrescar {
    width: 100%;
  }

  .tabla-container {
    border-radius: 8px;
    margin: 0 -15px; /* Extender hasta los bordes en móvil */
    overflow-x: auto;
  }
  
  .tabla-participantes {
    font-size: 0.85rem;
  }
  
  .tabla-participantes th,
  .tabla-participantes td {
    padding: 10px 8px;
  }
  
  .btn-accion {
    width: 32px;
    height: 32px;
    padding: 0;
    font-size: 0.9rem;
  }
  
  .token-col code {
    font-size: 0.75rem;
  }

  .detalle-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-contenido {
    padding: 20px;
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-contenido h3 {
    font-size: 1.3rem;
    padding-right: 40px;
  }
}

@media (max-width: 480px) {
  .participantes-lista {
    padding: 10px;
  }
  
  .header-lista h2 {
    font-size: 1.3rem;
  }
  
  .btn-gestionar-empresas,
  .btn-copiar-link {
    padding: 10px 15px;
    font-size: 0.9rem;
  }
  
  .tabla-participantes {
    font-size: 0.75rem;
    min-width: 900px; /* Reducir ancho mínimo en móviles muy pequeños */
  }
  
  .tabla-participantes th,
  .tabla-participantes td {
    padding: 8px 6px;
  }
  
  .badge-estado,
  .badge-acceso,
  .badge-empresa {
    font-size: 0.7rem;
    padding: 4px 8px;
  }
  
  .btn-toggle-credencial {
    font-size: 0.7rem;
    padding: 6px 12px;
  }
  
  .ultimo-acceso-hint {
    font-size: 0.65rem;
  }
}


/* Modal Gestión de Empresas */
.modal-empresas {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 15px;
  backdrop-filter: blur(5px);
  overflow-y: auto;
}

.modal-empresas > div {
  background: white;
  border-radius: 15px;
  padding: 25px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.3s ease;
  margin: auto;
  position: relative;
}

.modal-empresas > div {
  background: white;
  border-radius: 15px;
  padding: 25px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.3s ease;
  margin: auto;
  position: relative;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-empresas h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 40px;
}

.btn-cerrar-modal {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
}

.btn-cerrar-modal:hover {
  background-color: #f8f9fa;
  color: #dc3545;
  transform: rotate(90deg);
}

.btn-gestionar-empresas {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-gestionar-empresas:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* Formulario de Agregar Empresa */
.form-empresa {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 25px;
  border: 2px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-empresa h4 {
  margin: 0 0 15px 0;
  color: #495057;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-row-empresa {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
  align-items: end;
}

.input-empresa,
.input-cupo {
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  width: 100%;
  background: white;
}

.input-empresa:focus,
.input-cupo:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.input-cupo {
  text-align: center;
  font-weight: 600;
}

.btn-agregar-empresa {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  height: 46px;
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-agregar-empresa:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.btn-agregar-empresa:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Mensajes de Alerta */
.alerta-empresa {
  padding: 12px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.alerta-empresa.alerta-exito {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alerta-empresa.alerta-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Tabla de Empresas */
.tabla-empresas-container {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tabla-empresas {
  width: 100%;
  border-collapse: collapse;
}

.tabla-empresas thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.tabla-empresas th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 0.95rem;
}

.tabla-empresas tbody tr {
  border-bottom: 1px solid #dee2e6;
  transition: background-color 0.2s ease;
}

.tabla-empresas tbody tr:hover {
  background-color: #f8f9fa;
}

.tabla-empresas td {
  padding: 15px;
  color: #495057;
}

/* Inputs de Edición Inline */
.input-editar-nombre,
.input-editar-cupo {
  padding: 8px 12px;
  border: 2px solid #667eea;
  border-radius: 4px;
  font-size: 0.9rem;
  width: 100%;
  background-color: #f0f3ff;
}

.input-editar-nombre:focus,
.input-editar-cupo:focus {
  outline: none;
  border-color: #764ba2;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
}

.input-editar-cupo {
  text-align: center;
  max-width: 80px;
}

/* Progress Bar de Cupo */
.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 5px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745 0%, #20c997 50%, #ffc107 75%, #dc3545 100%);
  border-radius: 10px;
  transition: width 0.3s ease;
}

.cupo-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cupo-texto {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
}

/* Badges de Estado */
.badge-estado-empresa {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.85rem;
  display: inline-block;
  text-transform: uppercase;
}

.badge-estado-empresa.disponible {
  background-color: #d4edda;
  color: #155724;
}

.badge-estado-empresa.completo {
  background-color: #f8d7da;
  color: #721c24;
}

/* Botones de Acción */
.acciones-empresa {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-accion-empresa {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-accion-empresa.btn-editar {
  background-color: #007bff;
  color: white;
}

.btn-accion-empresa.btn-editar:hover {
  background-color: #0056b3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-accion-empresa.btn-guardar {
  background-color: #28a745;
  color: white;
}

.btn-accion-empresa.btn-guardar:hover {
  background-color: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.btn-accion-empresa.btn-cancelar {
  background-color: #6c757d;
  color: white;
}

.btn-accion-empresa.btn-cancelar:hover {
  background-color: #545b62;
  transform: translateY(-2px);
}

.btn-accion-empresa.btn-eliminar {
  background-color: #dc3545;
  color: white;
}

.btn-accion-empresa.btn-eliminar:hover {
  background-color: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.btn-accion-empresa:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Mensaje Sin Empresas */
.sin-empresas {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
}

.sin-empresas p {
  margin: 0;
  font-size: 1.1rem;
}

/* Responsive para Modal de Empresas */
@media (max-width: 1024px) {
  .modal-empresas > div {
    max-width: 700px;
    padding: 20px;
  }

  .form-row-empresa {
    grid-template-columns: 1fr 120px auto;
  }
}

@media (max-width: 768px) {
  .modal-empresas {
    padding: 10px;
    align-items: flex-start;
  }

  .modal-empresas > div {
    padding: 20px 15px;
    max-height: 95vh;
    margin-top: 10px;
    border-radius: 12px;
  }

  .modal-empresas h3 {
    font-size: 1.3rem;
    margin-bottom: 15px;
    padding-right: 35px;
  }

  .btn-cerrar-modal {
    top: 15px;
    right: 15px;
    width: 35px;
    height: 35px;
    font-size: 24px;
  }

  .form-empresa {
    padding: 15px;
    margin-bottom: 20px;
  }

  .form-empresa h4 {
    font-size: 1rem;
  }

  .form-row-empresa {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .btn-agregar-empresa {
    width: 100%;
    height: 44px;
    font-size: 0.9rem;
  }

  .tabla-empresas-container {
    overflow-x: auto;
    margin: 0 -15px;
    padding: 0 15px;
  }

  .tabla-empresas-container h4 {
    font-size: 1rem;
  }

  .tabla-empresas {
    min-width: 600px;
    font-size: 0.85rem;
  }

  .tabla-empresas th,
  .tabla-empresas td {
    padding: 10px 8px;
  }

  .btn-accion-empresa {
    padding: 6px 10px;
    font-size: 1.1rem;
    min-width: 35px;
  }

  .input-editar-nombre,
  .input-editar-cupo {
    font-size: 0.85rem;
    padding: 6px 10px;
  }
}

@media (max-width: 640px) {
  .modal-empresas > div {
    padding: 15px 12px;
    border-radius: 10px;
  }

  .modal-empresas h3 {
    font-size: 1.15rem;
    gap: 8px;
  }

  .form-empresa {
    padding: 12px;
  }

  .input-empresa,
  .input-cupo {
    padding: 10px 12px;
    font-size: 0.9rem;
  }

  .btn-agregar-empresa {
    padding: 10px 16px;
    font-size: 0.85rem;
  }

  .tabla-empresas {
    font-size: 0.8rem;
  }

  .badge-estado-empresa {
    font-size: 0.7rem;
    padding: 3px 8px;
  }
}

@media (max-width: 480px) {
  .modal-empresas {
    padding: 5px;
  }

  .modal-empresas > div {
    padding: 15px 10px;
    max-height: 98vh;
    border-radius: 8px;
  }

  .modal-empresas h3 {
    font-size: 1.05rem;
    margin-bottom: 12px;
  }

  .btn-cerrar-modal {
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    font-size: 20px;
  }

  .form-empresa {
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 15px;
  }

  .form-empresa h4 {
    font-size: 0.95rem;
    margin-bottom: 10px;
  }

  .form-row-empresa {
    gap: 10px;
  }

  .input-empresa,
  .input-cupo {
    padding: 9px 10px;
    font-size: 0.85rem;
    border-radius: 6px;
  }

  .btn-agregar-empresa {
    height: 40px;
    font-size: 0.8rem;
    padding: 8px 14px;
  }

  .tabla-empresas-container {
    margin: 0 -10px;
    padding: 0 10px;
  }

  .tabla-empresas-container h4 {
    font-size: 0.95rem;
    margin-bottom: 10px;
  }

  .tabla-empresas {
    min-width: 550px;
    font-size: 0.75rem;
  }

  .tabla-empresas th,
  .tabla-empresas td {
    padding: 8px 6px;
  }

  .btn-accion-empresa {
    padding: 5px 8px;
    font-size: 1rem;
    min-width: 32px;
  }

  .progress-bar {
    height: 4px;
  }

  .alerta-empresa {
    padding: 10px 12px;
    font-size: 0.85rem;
    margin-bottom: 15px;
  }
}

@media (max-width: 375px) {
  .modal-empresas > div {
    padding: 12px 8px;
  }

  .modal-empresas h3 {
    font-size: 1rem;
  }

  .form-empresa {
    padding: 8px;
  }

  .form-empresa h4 {
    font-size: 0.9rem;
  }

  .input-empresa,
  .input-cupo,
  .btn-agregar-empresa {
    font-size: 0.8rem;
  }

  .tabla-empresas {
    min-width: 500px;
    font-size: 0.7rem;
  }
}
</style>
