<template>
  <div class="premios-admin">
    <div class="header-section">
      <h1>🏆 Gestión de Premios FEIPOBOL</h1>
      <p class="descripcion">Configure premios por número de sorteo para el evento FEIPOBOL 2025</p>
    </div>

    <!-- Estadísticas -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🎁</div>
        <div class="stat-info">
          <h3>{{ stats.totalPremios || 0 }}</h3>
          <p>Total Premios</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-info">
          <h3>{{ stats.premiosActivos || 0 }}</h3>
          <p>Premios Activos</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-info">
          <h3>{{ stats.premiosGanados || 0 }}</h3>
          <p>Premios Ganados</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <h3>Bs. {{ formatearMonto(stats.totalValor) }}</h3>
          <p>Valor Total</p>
        </div>
      </div>
    </div>

    <!-- Controles -->
    <div class="controles">
      <button @click="mostrarModalCrear = true" class="btn-crear">
        ➕ Crear Nuevo Premio
      </button>
      
      <div class="filtros">
        <select v-model="filtroEstado" class="select-filtro">
          <option value="">Todos los premios</option>
          <option value="activo">Solo activos</option>
          <option value="ganado">Solo ganados</option>
          <option value="disponible">Solo disponibles</option>
        </select>
        
        <input 
          v-model="busqueda" 
          type="text" 
          placeholder="Buscar premio..." 
          class="input-busqueda"
        />
      </div>
    </div>

    <!-- Tabla de premios -->
    <div class="tabla-container">
      <table class="tabla-premios">
        <thead>
          <tr>
            <th>N° Sorteo</th>
            <th>Premio</th>
            <th>Descripción</th>
            <th>Valor</th>
            <th>Estado</th>
            <th>Ganador</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="premio in premiosPaginados" :key="premio.id" class="fila-premio">
            <td class="numero-sorteo">
              <span class="badge-numero">#{{ premio.numeroSorteo }}</span>
            </td>
            <td class="nombre-premio">
              <strong>{{ premio.nombrePremio }}</strong>
            </td>
            <td class="descripcion">
              {{ premio.descripcionPremio || '-' }}
            </td>
            <td class="valor">
              <span v-if="premio.valorPremio" class="monto">
                Bs. {{ formatearMonto(premio.valorPremio) }}
              </span>
              <span v-else class="sin-valor">-</span>
            </td>
            <td class="estado">
              <span 
                :class="[
                  'badge-estado',
                  premio.Ganador ? 'ganado' : (premio.activo ? 'activo' : 'inactivo')
                ]"
              >
                {{ premio.Ganador ? '🏆 Ganado' : (premio.activo ? '✅ Activo' : '❌ Inactivo') }}
              </span>
            </td>
            <td class="ganador">
              <div v-if="premio.Ganador" class="info-ganador">
                <strong>{{ premio.Ganador.Registro?.nombre }} {{ premio.Ganador.Registro?.apellido }}</strong>
                <small>{{ formatearFecha(premio.Ganador.fechaGanado) }}</small>
                <div class="estado-entrega">
                  <span 
                    :class="[
                      'badge-entrega',
                      premio.Ganador.entregado ? 'entregado' : 'pendiente'
                    ]"
                  >
                    {{ premio.Ganador.entregado ? '📦 Entregado' : '⏳ Pendiente' }}
                  </span>
                </div>
              </div>
              <span v-else class="sin-ganador">Sin ganador</span>
            </td>
            <td class="acciones">
              <div class="botones-accion">
                <button 
                  v-if="!premio.Ganador"
                  @click="editarPremio(premio)" 
                  class="btn-editar"
                  title="Editar premio"
                >
                  ✏️
                </button>
                
                <button 
                  v-if="premio.Ganador && !premio.Ganador.entregado"
                  @click="marcarEntregado(premio.Ganador)" 
                  class="btn-entregar"
                  title="Marcar como entregado"
                >
                  📦
                </button>
                
                <button 
                  v-if="!premio.Ganador"
                  @click="eliminarPremio(premio)" 
                  class="btn-eliminar"
                  title="Eliminar premio"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- Paginación -->
      <div v-if="premiosFiltrados.length > 0" class="paginacion-container">
        <div class="info-paginacion">
          Mostrando {{ ((paginaActual - 1) * itemsPorPagina) + 1 }} - 
          {{ Math.min(paginaActual * itemsPorPagina, premiosFiltrados.length) }} 
          de {{ premiosFiltrados.length }} premios
        </div>

        <div class="controles-paginacion">
          <div class="items-por-pagina">
            <label>Mostrar:</label>
            <select v-model.number="itemsPorPagina" @change="cambiarItemsPorPagina" class="select-items">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>

          <div class="botones-paginacion">
            <button 
              @click="cambiarPagina(1)" 
              :disabled="paginaActual === 1"
              class="btn-paginacion"
              title="Primera página"
            >
              ⏮️
            </button>
            
            <button 
              @click="cambiarPagina(paginaActual - 1)" 
              :disabled="paginaActual === 1"
              class="btn-paginacion"
              title="Anterior"
            >
              ◀️
            </button>

            <button 
              v-for="pagina in rangoPaginas" 
              :key="pagina"
              @click="cambiarPagina(pagina)"
              :class="['btn-paginacion', { activo: paginaActual === pagina }]"
            >
              {{ pagina }}
            </button>

            <button 
              @click="cambiarPagina(paginaActual + 1)" 
              :disabled="paginaActual === totalPaginas"
              class="btn-paginacion"
              title="Siguiente"
            >
              ▶️
            </button>
            
            <button 
              @click="cambiarPagina(totalPaginas)" 
              :disabled="paginaActual === totalPaginas"
              class="btn-paginacion"
              title="Última página"
            >
              ⏭️
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="premiosFiltrados.length === 0" class="sin-resultados">
        <div class="icono-vacio">🎁</div>
        <h3>No hay premios</h3>
        <p>{{ busqueda || filtroEstado ? 'No se encontraron premios con los filtros aplicados' : 'Aún no has creado ningún premio' }}</p>
      </div>
    </div>

    <!-- Modal crear/editar premio -->
    <div v-if="mostrarModalCrear || premioEditando" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-premio">
        <div class="modal-header">
          <h3>{{ premioEditando ? 'Editar Premio' : 'Crear Nuevo Premio' }}</h3>
          <button @click="cerrarModal" class="btn-cerrar">×</button>
        </div>
        
        <form @submit.prevent="guardarPremio" class="form-premio">
          <div class="form-group">
            <label>Número de Sorteo <span class="requerido">*</span></label>
            <input 
              v-model.number="formPremio.numeroSorteo" 
              type="number" 
              min="1" 
              required
              placeholder="Ej: 10, 25, 100..."
              class="form-control"
            />
            <small class="help-text">El número que debe salir para ganar este premio</small>
          </div>

          <div class="form-group">
            <label>Nombre del Premio <span class="requerido">*</span></label>
            <input 
              v-model="formPremio.nombrePremio" 
              type="text" 
              required
              placeholder="Ej: Televisor 32 pulgadas, Celular Samsung..."
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea 
              v-model="formPremio.descripcionPremio" 
              placeholder="Descripción detallada del premio (opcional)"
              class="form-control textarea"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Valor Aproximado (Bs.)</label>
            <input 
              v-model.number="formPremio.valorPremio" 
              type="number" 
              min="0" 
              step="0.01"
              placeholder="Ej: 1500.00"
              class="form-control"
            />
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                v-model="formPremio.activo" 
                type="checkbox" 
                class="checkbox"
              />
              <span class="checkmark"></span>
              Premio activo
            </label>
            <small class="help-text">Solo los premios activos participan en el sorteo</small>
          </div>

          <div class="form-actions">
            <button type="button" @click="cerrarModal" class="btn-cancelar">
              Cancelar
            </button>
            <button type="submit" :disabled="guardando" class="btn-guardar">
              {{ guardando ? 'Guardando...' : (premioEditando ? 'Actualizar' : 'Crear Premio') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <div v-if="modalConfirmacion.mostrar" class="modal-overlay" @click.self="cerrarConfirmacion">
      <div class="modal-confirmacion">
        <div class="modal-header">
          <h3>{{ modalConfirmacion.titulo }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ modalConfirmacion.mensaje }}</p>
        </div>
        <div class="modal-actions">
          <button @click="cerrarConfirmacion" class="btn-cancelar">
            Cancelar
          </button>
          <button @click="confirmarAccion" class="btn-confirmar">
            {{ modalConfirmacion.textoBtnConfirmar }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { premiosService } from '@/services/api'

console.log('🏆 Componente PremiosFeipobol.vue montándose...')

// Estado reactivo
const premios = ref([])
const stats = ref({})
const mostrarModalCrear = ref(false)
const premioEditando = ref(null)
const guardando = ref(false)
const busqueda = ref('')
const filtroEstado = ref('')

// Estado de paginación
const paginaActual = ref(1)
const itemsPorPagina = ref(20)

const modalConfirmacion = reactive({
  mostrar: false,
  titulo: '',
  mensaje: '',
  textoBtnConfirmar: '',
  accion: null
})

const formPremio = reactive({
  numeroSorteo: '',
  nombrePremio: '',
  descripcionPremio: '',
  valorPremio: '',
  activo: true
})

// Computed
const premiosFiltrados = computed(() => {
  let resultado = premios.value

  // Filtrar por búsqueda
  if (busqueda.value) {
    const termino = busqueda.value.toLowerCase()
    resultado = resultado.filter(premio => 
      premio.nombrePremio.toLowerCase().includes(termino) ||
      premio.descripcionPremio?.toLowerCase().includes(termino) ||
      premio.numeroSorteo.toString().includes(termino)
    )
  }

  // Filtrar por estado
  if (filtroEstado.value) {
    resultado = resultado.filter(premio => {
      switch (filtroEstado.value) {
        case 'activo':
          return premio.activo && !premio.Ganador
        case 'ganado':
          return premio.Ganador
        case 'disponible':
          return premio.activo && !premio.Ganador
        default:
          return true
      }
    })
  }

  // Ordenar de manera DESCENDENTE (del mayor al menor)
  return resultado.sort((a, b) => b.numeroSorteo - a.numeroSorteo)
})

// Premios paginados
const premiosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina.value
  const fin = inicio + itemsPorPagina.value
  return premiosFiltrados.value.slice(inicio, fin)
})

// Total de páginas
const totalPaginas = computed(() => {
  return Math.ceil(premiosFiltrados.value.length / itemsPorPagina.value)
})

// Rango de páginas para mostrar
const rangoPaginas = computed(() => {
  const rango = []
  const maxPaginas = 5
  let inicio = Math.max(1, paginaActual.value - Math.floor(maxPaginas / 2))
  let fin = Math.min(totalPaginas.value, inicio + maxPaginas - 1)
  
  if (fin - inicio < maxPaginas - 1) {
    inicio = Math.max(1, fin - maxPaginas + 1)
  }
  
  for (let i = inicio; i <= fin; i++) {
    rango.push(i)
  }
  
  return rango
})

// Métodos
const cargarPremios = async () => {
  try {
    const response = await premiosService.getAllPremios()
    if (response.success) {
      premios.value = response.data || []
      console.log('Premios cargados:', premios.value)
    }
  } catch (error) {
    console.error('Error cargando premios:', error)
  }
}

const cargarStats = async () => {
  try {
    const response = await premiosService.getStats()
    if (response.success) {
      stats.value = response.data || {}
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error)
  }
}

const guardarPremio = async () => {
  try {
    guardando.value = true

    let response
    if (premioEditando.value) {
      response = await premiosService.updatePremio(premioEditando.value.id, formPremio)
    } else {
      response = await premiosService.createPremio(formPremio)
    }

    if (response.success) {
      alert(response.data.message || 'Premio guardado exitosamente')
      cerrarModal()
      await cargarPremios()
      await cargarStats()
    } else {
      alert(response.error || 'Error al guardar premio')
    }

  } catch (error) {
    console.error('Error guardando premio:', error)
    alert('Error de conexión')
  } finally {
    guardando.value = false
  }
}

const editarPremio = (premio) => {
  premioEditando.value = premio
  formPremio.numeroSorteo = premio.numeroSorteo
  formPremio.nombrePremio = premio.nombrePremio
  formPremio.descripcionPremio = premio.descripcionPremio || ''
  formPremio.valorPremio = premio.valorPremio || ''
  formPremio.activo = premio.activo
}

const eliminarPremio = (premio) => {
  modalConfirmacion.mostrar = true
  modalConfirmacion.titulo = 'Eliminar Premio'
  modalConfirmacion.mensaje = `¿Estás seguro de eliminar el premio "${premio.nombrePremio}" del número ${premio.numeroSorteo}?`
  modalConfirmacion.textoBtnConfirmar = 'Eliminar'
  modalConfirmacion.accion = async () => {
    try {
      const response = await premiosService.deletePremio(premio.id)

      if (response.success) {
        alert(response.data.message || 'Premio eliminado exitosamente')
        await cargarPremios()
        await cargarStats()
      } else {
        alert(response.error || 'Error al eliminar premio')
      }
    } catch (error) {
      console.error('Error eliminando premio:', error)
      alert('Error de conexión')
    }
  }
}

const marcarEntregado = (ganador) => {
  modalConfirmacion.mostrar = true
  modalConfirmacion.titulo = 'Marcar Premio como Entregado'
  modalConfirmacion.mensaje = `¿Confirmas que el premio fue entregado a ${ganador.Registro?.nombre} ${ganador.Registro?.apellido}?`
  modalConfirmacion.textoBtnConfirmar = 'Marcar Entregado'
  modalConfirmacion.accion = async () => {
    try {
      const response = await premiosService.marcarEntregado(ganador.id, { entregado: true })

      if (response.success) {
        alert(response.data.message || 'Premio marcado como entregado')
        await cargarPremios()
        await cargarStats()
      } else {
        alert(response.error || 'Error al marcar entrega')
      }
    } catch (error) {
      console.error('Error marcando entrega:', error)
      alert('Error de conexión')
    }
  }
}

const cerrarModal = () => {
  mostrarModalCrear.value = false
  premioEditando.value = null
  Object.keys(formPremio).forEach(key => {
    if (key === 'activo') {
      formPremio[key] = true
    } else {
      formPremio[key] = ''
    }
  })
}

const cerrarConfirmacion = () => {
  modalConfirmacion.mostrar = false
  modalConfirmacion.accion = null
}

const confirmarAccion = async () => {
  if (modalConfirmacion.accion) {
    await modalConfirmacion.accion()
  }
  cerrarConfirmacion()
}

// Funciones de paginación
const cambiarPagina = (pagina) => {
  if (pagina >= 1 && pagina <= totalPaginas.value) {
    paginaActual.value = pagina
  }
}

const cambiarItemsPorPagina = () => {
  paginaActual.value = 1 // Resetear a la primera página
}

const formatearMonto = (monto) => {
  if (!monto) return '0.00'
  return parseFloat(monto).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const formatearFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cargar datos al montar
onMounted(() => {
  cargarPremios()
  cargarStats()
})
</script>

<style scoped>
.premios-admin {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
}

.header-section h1 {
  color: #2C3E50;
  margin-bottom: 10px;
}

.descripcion {
  color: #6C757D;
  font-size: 1.1rem;
}

/* ESTADÍSTICAS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  text-align: center;
}

.stat-info h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #2C3E50;
}

.stat-info p {
  margin: 5px 0 0;
  color: #6C757D;
  font-size: 0.9rem;
}

/* CONTROLES */
.controles {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  gap: 20px;
  flex-wrap: wrap;
}

.btn-crear {
  background: linear-gradient(135deg, #28A745, #20C997);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-crear:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(40,167,69,0.3);
}

.filtros {
  display: flex;
  gap: 15px;
  align-items: center;
}

.select-filtro,
.input-busqueda {
  padding: 8px 15px;
  border: 2px solid #E9ECEF;
  border-radius: 20px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

.select-filtro:focus,
.input-busqueda:focus {
  outline: none;
  border-color: #007BFF;
}

.input-busqueda {
  min-width: 200px;
}

/* TABLA */
.tabla-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  overflow: hidden;
}

.tabla-premios {
  width: 100%;
  border-collapse: collapse;
}

.tabla-premios th {
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  color: white;
  padding: 15px 12px;
  text-align: left;
  font-weight: bold;
  font-size: 0.9rem;
}

.tabla-premios td {
  padding: 15px 12px;
  border-bottom: 1px solid #E9ECEF;
  vertical-align: top;
}

.fila-premio:hover {
  background-color: #F8F9FA;
}

.badge-numero {
  background: #007BFF;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: bold;
  font-size: 0.85rem;
}

.nombre-premio strong {
  color: #2C3E50;
}

.monto {
  color: #28A745;
  font-weight: bold;
}

.sin-valor,
.sin-ganador {
  color: #6C757D;
  font-style: italic;
}

.badge-estado {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.badge-estado.activo {
  background: #D4EDDA;
  color: #155724;
}

.badge-estado.ganado {
  background: #FFE69C;
  color: #856404;
}

.badge-estado.inactivo {
  background: #F8D7DA;
  color: #721C24;
}

.info-ganador strong {
  display: block;
  color: #2C3E50;
}

.info-ganador small {
  color: #6C757D;
  font-size: 0.75rem;
}

.estado-entrega {
  margin-top: 5px;
}

.badge-entrega {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: bold;
}

.badge-entrega.entregado {
  background: #D1ECF1;
  color: #0C5460;
}

.badge-entrega.pendiente {
  background: #FFF3CD;
  color: #856404;
}

.botones-accion {
  display: flex;
  gap: 8px;
}

.btn-editar,
.btn-entregar,
.btn-eliminar {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.3s ease;
}

.btn-editar:hover {
  background-color: #E3F2FD;
}

.btn-entregar:hover {
  background-color: #E8F5E8;
}

.btn-eliminar:hover {
  background-color: #FFEBEE;
}

.sin-resultados {
  text-align: center;
  padding: 60px 20px;
  color: #6C757D;
}

.icono-vacio {
  font-size: 4rem;
  margin-bottom: 20px;
}

/* PAGINACIÓN */
.paginacion-container {
  margin-top: 25px;
  padding: 20px;
  background: #F8F9FA;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-paginacion {
  color: #6C757D;
  font-size: 0.95rem;
  text-align: center;
}

.controles-paginacion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.items-por-pagina {
  display: flex;
  align-items: center;
  gap: 10px;
}

.items-por-pagina label {
  color: #495057;
  font-weight: 500;
}

.select-items {
  padding: 8px 12px;
  border: 2px solid #DEE2E6;
  border-radius: 6px;
  background: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-items:hover {
  border-color: #ADB5BD;
}

.select-items:focus {
  outline: none;
  border-color: #4A90E2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.botones-paginacion {
  display: flex;
  gap: 5px;
}

.btn-paginacion {
  padding: 8px 12px;
  border: 2px solid #DEE2E6;
  background: white;
  color: #495057;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  min-width: 40px;
}

.btn-paginacion:hover:not(:disabled) {
  background-color: #E9ECEF;
  border-color: #ADB5BD;
}

.btn-paginacion.activo {
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: white;
  border-color: #4A90E2;
  font-weight: bold;
}

.btn-paginacion:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .controles-paginacion {
    flex-direction: column;
  }

  .botones-paginacion {
    flex-wrap: wrap;
    justify-content: center;
  }

  .btn-paginacion {
    padding: 6px 10px;
    font-size: 0.85rem;
    min-width: 35px;
  }
}

/* MODALES */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-premio,
.modal-confirmacion {
  background: white;
  border-radius: 15px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #E9ECEF;
}

.modal-header h3 {
  margin: 0;
  color: #2C3E50;
}

.btn-cerrar {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6C757D;
  padding: 5px;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-cerrar:hover {
  background-color: #F8F9FA;
}

.form-premio {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #2C3E50;
}

.requerido {
  color: #DC3545;
}

.form-control {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #E9ECEF;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #007BFF;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.help-text {
  color: #6C757D;
  font-size: 0.85rem;
  margin-top: 5px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox {
  width: 18px;
  height: 18px;
}

.form-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #E9ECEF;
}

.btn-cancelar,
.btn-guardar,
.btn-confirmar {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancelar {
  background: #F8F9FA;
  color: #6C757D;
  border: 2px solid #E9ECEF;
}

.btn-cancelar:hover {
  background: #E9ECEF;
}

.btn-guardar {
  background: linear-gradient(135deg, #007BFF, #0056B3);
  color: white;
}

.btn-guardar:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,123,255,0.3);
}

.btn-guardar:disabled {
  opacity: 0.6;
  transform: none;
  cursor: not-allowed;
}

.btn-confirmar {
  background: linear-gradient(135deg, #DC3545, #C82333);
  color: white;
}

.btn-confirmar:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(220,53,69,0.3);
}

.modal-body {
  padding: 20px 25px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding: 20px 25px;
  border-top: 1px solid #E9ECEF;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .premios-admin {
    padding: 15px;
  }

  .controles {
    flex-direction: column;
    align-items: stretch;
  }

  .filtros {
    justify-content: center;
  }

  .input-busqueda {
    min-width: unset;
    flex: 1;
  }

  .tabla-container {
    overflow-x: auto;
  }

  .tabla-premios {
    min-width: 800px;
  }

  .modal-premio,
  .modal-confirmacion {
    width: 95%;
    margin: 10px;
  }

  .form-actions,
  .modal-actions {
    flex-direction: column;
  }

  .btn-cancelar,
  .btn-guardar,
  .btn-confirmar {
    width: 100%;
  }
}
</style>