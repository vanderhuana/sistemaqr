<template>
  <div class="trabajadores-lista">
    <div class="header-lista">
      <h2>📋 Lista de Trabajadores</h2>
      <button @click="copiarLink" class="btn-copiar-link">
        📋 Copiar Link de Registro
      </button>
    </div>

    <!-- Barra de búsqueda y filtros -->
    <div class="barra-busqueda">
      <input 
        v-model="busqueda" 
        type="text" 
        placeholder="Buscar por nombre, apellido o CI..."
        class="input-busqueda"
      />
      <select v-model="filtroEstado" class="select-filtro-estado">
        <option value="">Todos los estados</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
        <option value="suspendido">Suspendidos</option>
      </select>
      <button @click="cargarTrabajadores" class="btn-refrescar" :disabled="cargando">
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
      <p>Cargando trabajadores...</p>
    </div>

    <!-- Tabla de trabajadores -->
    <div v-else-if="trabajadoresFiltrados.length > 0" class="tabla-container">
      <table class="tabla-trabajadores">
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>CI</th>
            <th>Área</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Credencial</th>
            <th>Acceso Hoy</th>
            <th>Token</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="trabajador in trabajadoresFiltrados" :key="trabajador.id">
            <td class="nombre-col">
              {{ trabajador.nombre }} {{ trabajador.apellido }}
            </td>
            <td>{{ trabajador.ci }}</td>
            <td>{{ trabajador.areaTrabajo || '-' }}</td>
            <td>{{ trabajador.telefono }}</td>
            <td>
              <span :class="['badge-estado', `estado-${trabajador.estado}`]">
                {{ trabajador.estado.toUpperCase() }}
              </span>
            </td>
            <td class="credencial-col">
              <button 
                @click="toggleEstadoCredencial(trabajador)" 
                :class="['btn-toggle-credencial', trabajador.estado === 'activo' ? 'activa' : 'inactiva']"
                :title="trabajador.estado === 'activo' ? 'Desactivar credencial' : 'Activar credencial'"
              >
                {{ trabajador.estado === 'activo' ? '✅ ACTIVA' : '❌ INACTIVA' }}
              </button>
            </td>
            <td class="acceso-col">
              <span :class="['badge-acceso', ingresoHoy(trabajador.ultimoAcceso) ? 'ingreso' : 'pendiente']">
                {{ ingresoHoy(trabajador.ultimoAcceso) ? '✅ INGRESÓ' : '⏳ PENDIENTE' }}
              </span>
              <div v-if="trabajador.ultimoAcceso" class="ultimo-acceso-hint">
                {{ formatearFecha(trabajador.ultimoAcceso) }}
              </div>
            </td>
            <td class="token-col">
              <code>{{ trabajador.token.substring(0, 8) }}...</code>
            </td>
            <td class="acciones-col">
              <button @click="verDetalle(trabajador)" class="btn-accion ver" title="Ver detalle">
                👁️
              </button>
              <button @click="generarCredencial(trabajador)" class="btn-accion credencial" title="Generar Credencial">
                🎫
              </button>
              <button @click="eliminarTrabajador(trabajador.id)" class="btn-accion eliminar" title="Eliminar">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Sin resultados -->
    <div v-else class="sin-datos">
      <p>No hay trabajadores registrados</p>
      <button @click="copiarLink" class="btn-secundario">
        📋 Copiar Link de Registro
      </button>
    </div>

    <!-- Modal de detalle -->
    <div v-if="trabajadorSeleccionado" class="modal-overlay" @click="cerrarModal">
      <div class="modal-contenido" @click.stop>
        <button @click="cerrarModal" class="btn-cerrar-modal">✕</button>
        <h3>Detalle del Trabajador</h3>
        
        <div class="detalle-grid">
          <div class="detalle-item">
            <strong>Nombre completo:</strong>
            <p>{{ trabajadorSeleccionado.nombre }} {{ trabajadorSeleccionado.apellido }}</p>
          </div>
          <div class="detalle-item">
            <strong>CI:</strong>
            <p>{{ trabajadorSeleccionado.ci }}</p>
          </div>
          <div class="detalle-item">
            <strong>Teléfono:</strong>
            <p>{{ trabajadorSeleccionado.telefono }}</p>
          </div>
          <div class="detalle-item">
            <strong>Correo:</strong>
            <p>{{ trabajadorSeleccionado.correo || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Zona:</strong>
            <p>{{ trabajadorSeleccionado.zona || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Área de Trabajo:</strong>
            <p>{{ trabajadorSeleccionado.areaTrabajo }}</p>
          </div>
          <div class="detalle-item">
            <strong>Ocupación:</strong>
            <p>{{ trabajadorSeleccionado.ocupacion || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Sexo:</strong>
            <p>{{ trabajadorSeleccionado.sexo || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Fecha de Nacimiento:</strong>
            <p>{{ trabajadorSeleccionado.fechaNacimiento || 'No proporcionado' }}</p>
          </div>
          <div class="detalle-item">
            <strong>Estado:</strong>
            <p>{{ trabajadorSeleccionado.estado }}</p>
          </div>
          <div class="detalle-item full-width">
            <strong>Token:</strong>
            <code>{{ trabajadorSeleccionado.token }}</code>
          </div>
          
          <!-- Referencia -->
          <div v-if="trabajadorSeleccionado.nombreReferencia" class="detalle-item full-width seccion-referencia">
            <strong>Referencia:</strong>
            <p>
              {{ trabajadorSeleccionado.nombreReferencia }} 
              ({{ trabajadorSeleccionado.parentesco }}) - 
              Tel: {{ trabajadorSeleccionado.celularReferencia }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { trabajadorService } from '../services/api'
import { generarCredencialPDF } from '../utils/credencialGenerator'

const trabajadores = ref([])
const busqueda = ref('')
const filtroEstado = ref('')
const cargando = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('')
const trabajadorSeleccionado = ref(null)

const trabajadoresFiltrados = computed(() => {
  let resultado = trabajadores.value
  
  // Filtro por búsqueda
  if (busqueda.value) {
    const termino = busqueda.value.toLowerCase()
    resultado = resultado.filter(t => 
      t.nombre.toLowerCase().includes(termino) ||
      t.apellido.toLowerCase().includes(termino) ||
      t.ci.toLowerCase().includes(termino)
    )
  }
  
  // Filtro por estado
  if (filtroEstado.value) {
    resultado = resultado.filter(t => t.estado === filtroEstado.value)
  }
  
  return resultado
})

const cargarTrabajadores = async () => {
  cargando.value = true
  mensaje.value = ''

  try {
    const resultado = await trabajadorService.getAllTrabajadores()
    
    if (resultado.success) {
      trabajadores.value = resultado.data.trabajadores || []
    } else {
      mensaje.value = 'Error al cargar trabajadores'
      mensajeTipo.value = 'error'
    }
  } catch (error) {
    console.error('Error:', error)
    mensaje.value = 'Error al cargar trabajadores'
    mensajeTipo.value = 'error'
  } finally {
    cargando.value = false
  }
}

const copiarLink = () => {
  const link = `${window.location.origin}/registro-trabajador`
  navigator.clipboard.writeText(link).then(() => {
    mensaje.value = '¡Link copiado al portapapeles!'
    mensajeTipo.value = 'success'
    setTimeout(() => { mensaje.value = '' }, 3000)
  })
}

const toggleEstadoCredencial = async (trabajador) => {
  const nuevoEstado = trabajador.estado === 'activo' ? 'inactivo' : 'activo'
  const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar'
  
  if (!confirm(`¿Estás seguro de ${accion} la credencial de ${trabajador.nombre} ${trabajador.apellido}?`)) {
    return
  }
  
  try {
    const resultado = await trabajadorService.updateTrabajador(trabajador.id, {
      estado: nuevoEstado
    })
    
    if (resultado.success) {
      mensaje.value = `Credencial ${nuevoEstado === 'activo' ? 'activada' : 'desactivada'} exitosamente`
      mensajeTipo.value = 'success'
      await cargarTrabajadores()
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

const verDetalle = (trabajador) => {
  trabajadorSeleccionado.value = trabajador
}

const cerrarModal = () => {
  trabajadorSeleccionado.value = null
}

const eliminarTrabajador = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este trabajador?')) return

  try {
    const resultado = await trabajadorService.deleteTrabajador(id)
    
    if (resultado.success) {
      mensaje.value = 'Trabajador eliminado exitosamente'
      mensajeTipo.value = 'success'
      cargarTrabajadores()
    } else {
      mensaje.value = 'Error al eliminar trabajador'
      mensajeTipo.value = 'error'
    }
  } catch (error) {
    console.error('Error:', error)
    mensaje.value = 'Error al eliminar trabajador'
    mensajeTipo.value = 'error'
  }
}

const generarCredencial = async (trabajador) => {
  // Crear objeto de datos del formulario para el generador de PDF
  const datosFormulario = {
    nombre: trabajador.nombre,
    apellido: trabajador.apellido,
    ci: trabajador.ci,
    areaTrabajo: trabajador.areaTrabajo,
    fechaInicio: trabajador.fechaInicio || new Date().toISOString().split('T')[0],
    fechaFin: trabajador.fechaFin || new Date().toISOString().split('T')[0]
  }

  // Generar PDF con el nuevo sistema
  await generarCredencialPDF(
    trabajador,
    datosFormulario,
    '', // Sin empresa para trabajadores
    'TRABAJADOR'
  )
}

onMounted(() => {
  cargarTrabajadores()
})
</script>

<style scoped>
.trabajadores-lista {
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

.select-filtro-estado:focus {
  outline: none;
  border-color: #6B9080;
}

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

.tabla-trabajadores {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px; /* Ancho mínimo para scroll horizontal */
  table-layout: auto;
}

.tabla-trabajadores thead {
  background: #6B9080;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tabla-trabajadores th {
  padding: 15px;
  text-align: left;
  font-weight: 600;
  white-space: nowrap; /* Evitar que los títulos se rompan */
}

.tabla-trabajadores td {
  padding: 15px;
  border-bottom: 1px solid #E0E0E0;
  white-space: nowrap;
}

.tabla-trabajadores tbody tr:hover {
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
  .trabajadores-lista {
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

  .barra-busqueda {
    flex-direction: column;
    gap: 10px;
  }
  
  .input-busqueda,
  .select-filtro-estado,
  .btn-refrescar {
    width: 100%;
  }

  .tabla-container {
    border-radius: 8px;
    margin: 0 -15px; /* Extender hasta los bordes en móvil */
    overflow-x: auto;
  }
  
  .tabla-trabajadores {
    font-size: 0.85rem;
  }
  
  .tabla-trabajadores th,
  .tabla-trabajadores td {
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
  .trabajadores-lista {
    padding: 10px;
  }
  
  .header-lista h2 {
    font-size: 1.3rem;
  }
  
  .btn-copiar-link {
    padding: 10px 15px;
    font-size: 0.9rem;
  }
  
  .tabla-trabajadores {
    font-size: 0.75rem;
    min-width: 800px; /* Reducir ancho mínimo en móviles muy pequeños */
  }
  
  .tabla-trabajadores th,
  .tabla-trabajadores td {
    padding: 8px 6px;
  }
  
  .badge-estado,
  .badge-acceso {
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
</style>
