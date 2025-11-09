<template>
  <div class="registro-feipobol-container">
    
    <!-- HEADER CON ESTADÍSTICAS -->
    <div class="stats-header">
      <div class="stat-item">
        <div class="stat-number">{{ registros.length }}</div>
        <div class="stat-label">Total Registrados</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ registrosHoy }}</div>
        <div class="stat-label">Registros Hoy</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ proximoNumeroSorteo }}</div>
        <div class="stat-label">Próximo N° Sorteo</div>
      </div>
    </div>

    <!-- CONTROLES SUPERIORES -->
    <div class="controles-superior">
      <div class="filtros-busqueda">
        <input 
          v-model="filtroNombre" 
          type="text" 
          placeholder="Buscar por nombre, CI o correo..."
          class="input-busqueda"
        />
        
        <select v-model="filtroEstado" class="select-estado">
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="participoSorteo">Participó en Sorteo</option>
          <option value="ganador">Ganador</option>
        </select>
      </div>
      
      <div class="acciones-superior">
        <button @click="refrescarDatos" class="btn-refrescar" :disabled="cargando">
          🔄 {{ cargando ? 'Cargando...' : 'Refrescar' }}
        </button>
        
        <button @click="exportarDatos" class="btn-exportar" :disabled="cargando">
          📊 Exportar Excel
        </button>
        
        <button @click="abrirFormularioPublico" class="btn-formulario" :disabled="cargando">
          🌐 Ver Formulario Público
        </button>
      </div>
    </div>

    <!-- MENSAJE DE ERROR -->
    <div v-if="error" class="error-message">
      ⚠️ {{ error }}
      <button @click="error = ''" class="btn-cerrar-error">✕</button>
    </div>

    <!-- LOADING -->
    <div v-if="cargando" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando registros de FEIPOBOL...</p>
    </div>

    <!-- LISTA DE REGISTROS -->
    <div v-else class="registros-grid">
      
      <!-- Sin registros -->
      <div v-if="registrosFiltrados.length === 0" class="no-registros">
        <div class="no-registros-icon">🏆</div>
        <h3>{{ filtroNombre || filtroEstado ? 'No se encontraron registros' : 'No hay registros de FEIPOBOL aún' }}</h3>
        <p v-if="!filtroNombre && !filtroEstado">
          Los participantes pueden registrarse usando el formulario público
        </p>
        <button @click="abrirFormularioPublico" class="btn-ir-formulario">
          🌐 Ir al Formulario de Registro
        </button>
      </div>

      <!-- Cards de registros -->
      <div v-for="registro in registrosFiltrados" :key="registro.id" class="registro-card">
        
        <!-- Header de la card -->
        <div class="registro-header">
          <div class="registro-numero">
            <span class="numero-sorteo">#{{ registro.numeroSorteo }}</span>
            <span class="estado-badge" :class="getEstadoClass(registro)">
              {{ getEstadoTexto(registro) }}
            </span>
          </div>
          <div class="registro-acciones">
            <button @click="verDetalles(registro)" class="btn-ver" title="Ver detalles">👁️</button>
            <button @click="descargarQR(registro)" class="btn-qr" title="Descargar QR">📱</button>
            <button @click="marcarParticipacion(registro)" class="btn-sorteo" title="Marcar participación" 
                    :disabled="registro.participoSorteo">
              🎲
            </button>
            <button @click="eliminarRegistro(registro)" class="btn-eliminar" title="Eliminar registro">🗑️</button>
          </div>
        </div>

        <!-- Información principal -->
        <div class="registro-info">
          <div class="info-personal">
            <h4 class="nombre-completo">{{ registro.nombre }} {{ registro.apellido }}</h4>
            <p class="ci">CI: {{ registro.ci }}</p>
            <p class="contacto">
              📞 {{ registro.telefono }}
              <br>
              📧 {{ registro.correo }}
            </p>
          </div>
          
          <div class="info-adicional">
            <p class="zona">📍 {{ registro.zona }}</p>
          </div>
        </div>

        <!-- Footer con metadatos -->
        <div class="registro-footer">
          <div class="metadatos">
            <small class="fecha-registro">
              Registrado: {{ formatearFechaHora(registro.fechaRegistro) }}
            </small>
            <small class="ip-registro">
              IP: {{ registro.ipRegistro }}
            </small>
          </div>
          
          <div v-if="registro.participoSorteo" class="info-sorteo">
            <span class="participo-sorteo">🎲 Participó en sorteo</span>
            <span v-if="registro.PremioGanado" class="premio-ganado">🏆 GANADOR</span>
          </div>
        </div>

        <!-- QR Code (oculto por defecto, se muestra al hacer click) -->
        <div v-if="registro.mostrarQR" class="qr-section">
          <img :src="registro.qrCodeDataUrl" alt="QR Code" class="qr-image" />
          <p class="qr-token">Token: {{ registro.token }}</p>
        </div>
      </div>
    </div>

    <!-- PAGINACIÓN -->
    <div v-if="registrosFiltrados.length > registrosPorPagina" class="paginacion">
      <button 
        @click="paginaActual = Math.max(1, paginaActual - 1)" 
        :disabled="paginaActual === 1"
        class="btn-pagina"
      >
        ← Anterior
      </button>
      
      <span class="info-pagina">
        Página {{ paginaActual }} de {{ totalPaginas }} 
        ({{ registrosFiltrados.length }} registros)
      </span>
      
      <button 
        @click="paginaActual = Math.min(totalPaginas, paginaActual + 1)" 
        :disabled="paginaActual === totalPaginas"
        class="btn-pagina"
      >
        Siguiente →
      </button>
    </div>

    <!-- MODAL DETALLES DEL REGISTRO -->
    <div v-if="mostrarDetalles" class="modal-overlay" @click.self="cerrarDetalles">
      <div class="modal-detalles">
        <div class="modal-header">
          <h3>👤 Detalles del Registro #{{ registroSeleccionado?.numeroSorteo }}</h3>
          <button @click="cerrarDetalles" class="btn-cerrar">✕</button>
        </div>
        
        <div v-if="registroSeleccionado" class="modal-content">
          
          <!-- Información personal -->
          <div class="seccion-detalle">
            <h4>Información Personal</h4>
            <div class="detalle-grid">
              <div class="detalle-item">
                <label>Nombre completo:</label>
                <span>{{ registroSeleccionado.nombre }} {{ registroSeleccionado.apellido }}</span>
              </div>
              <div class="detalle-item">
                <label>CI:</label>
                <span>{{ registroSeleccionado.ci }}</span>
              </div>
              <div class="detalle-item">
                <label>Teléfono:</label>
                <span>{{ registroSeleccionado.telefono }}</span>
              </div>
              <div class="detalle-item">
                <label>Correo:</label>
                <span>{{ registroSeleccionado.correo }}</span>
              </div>
              <div class="detalle-item">
                <label>Zona:</label>
                <span>{{ registroSeleccionado.zona }}</span>
              </div>
            </div>
          </div>

          <!-- Información de registro -->
          <div class="seccion-detalle">
            <h4>Información de Registro</h4>
            <div class="detalle-grid">
              <div class="detalle-item">
                <label>Número de sorteo:</label>
                <span class="numero-destacado">#{{ registroSeleccionado.numeroSorteo }}</span>
              </div>
              <div class="detalle-item">
                <label>Token:</label>
                <span class="token-texto">{{ registroSeleccionado.token }}</span>
              </div>
              <div class="detalle-item">
                <label>Fecha de registro:</label>
                <span>{{ formatearFechaHora(registroSeleccionado.fechaRegistro) }}</span>
              </div>
              <div class="detalle-item">
                <label>IP de registro:</label>
                <span>{{ registroSeleccionado.ipRegistro }}</span>
              </div>
              <div class="detalle-item">
                <label>Estado:</label>
                <span class="estado-badge-detalle" :class="getEstadoClass(registroSeleccionado)">
                  {{ getEstadoTexto(registroSeleccionado) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Información de sorteo -->
          <div v-if="registroSeleccionado.participoSorteo" class="seccion-detalle">
            <h4>Información de Sorteo</h4>
            <div class="detalle-grid">
              <div class="detalle-item">
                <label>Participó en sorteo:</label>
                <span class="si-participo">✅ Sí</span>
              </div>
              <div class="detalle-item">
                <label>Fecha del sorteo:</label>
                <span>{{ formatearFechaHora(registroSeleccionado.fechaSorteo) }}</span>
              </div>
              <div v-if="registroSeleccionado.PremioGanado" class="detalle-item">
                <label>Premio ganado:</label>
                <span class="premio-destacado">🏆 {{ registroSeleccionado.PremioGanado.Premio?.nombrePremio || 'Premio' }}</span>
              </div>
            </div>
          </div>

          <!-- QR Code -->
          <div class="seccion-detalle">
            <h4>Código QR</h4>
            <div class="qr-detalle">
              <img :src="registroSeleccionado.qrCodeDataUrl" alt="QR Code" class="qr-image-grande" />
              <div class="qr-acciones">
                <button @click="descargarQR(registroSeleccionado)" class="btn-descargar-qr">
                  💾 Descargar QR
                </button>
                <button @click="imprimirQR(registroSeleccionado)" class="btn-imprimir-qr">
                  🖨️ Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="mostrarModalEliminar" class="modal-overlay" @click="cerrarModalEliminar">
      <div class="modal-confirmacion-eliminar" @click.stop>
        <div class="icono-advertencia">⚠️</div>
        <h3 class="titulo-confirmacion">¿Eliminar Registro?</h3>
        <p class="mensaje-confirmacion">
          Estás a punto de eliminar este registro de forma permanente.
        </p>
        
        <div v-if="registroEliminar" class="info-participante-eliminar">
          <p><strong>{{ registroEliminar.nombre }} {{ registroEliminar.apellido }}</strong></p>
          <p class="ci-eliminar">N° Sorteo: {{ registroEliminar.numeroSorteo }}</p>
          <p class="ci-eliminar">CI: {{ registroEliminar.ci }}</p>
        </div>

        <div class="advertencia-eliminar">
          <p><strong>⚠️ Esta acción no se puede deshacer</strong></p>
        </div>

        <div class="modal-acciones-eliminar">
          <button @click="cerrarModalEliminar" class="btn-cancelar-eliminar">
            Cancelar
          </button>
          <button @click="confirmarEliminarRegistro" class="btn-confirmar-eliminar">
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Estados reactivos
const registros = ref([])
const cargando = ref(false)
const error = ref('')

// Filtros
const filtroNombre = ref('')
const filtroEstado = ref('')

// Paginación
const paginaActual = ref(1)
const registrosPorPagina = 12

// Modal detalles
const mostrarDetalles = ref(false)
const registroSeleccionado = ref(null)

// Modal de eliminación
const mostrarModalEliminar = ref(false)
const registroEliminar = ref(null)

// Computed properties
const registrosFiltrados = computed(() => {
  let filtrados = registros.value

  // Filtro por nombre, CI o correo
  if (filtroNombre.value) {
    const termino = filtroNombre.value.toLowerCase()
    filtrados = filtrados.filter(registro => 
      registro.nombre.toLowerCase().includes(termino) ||
      registro.apellido.toLowerCase().includes(termino) ||
      registro.ci.includes(termino) ||
      registro.correo.toLowerCase().includes(termino)
    )
  }



  // Filtro por estado
  if (filtroEstado.value) {
    filtrados = filtrados.filter(registro => {
      switch (filtroEstado.value) {
        case 'activo':
          return registro.estado === 'activo'
        case 'participoSorteo':
          return registro.participoSorteo
        case 'ganador':
          // Un registro es ganador si tiene la relación PremioGanado
          return registro.PremioGanado !== null && registro.PremioGanado !== undefined
        default:
          return true
      }
    })
  }

  return filtrados
})

const totalPaginas = computed(() => {
  return Math.ceil(registrosFiltrados.value.length / registrosPorPagina)
})

const registrosHoy = computed(() => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return registros.value.filter(registro => {
    const fechaRegistro = new Date(registro.fechaRegistro)
    fechaRegistro.setHours(0, 0, 0, 0)
    return fechaRegistro.getTime() === hoy.getTime()
  }).length
})

const proximoNumeroSorteo = computed(() => {
  if (registros.value.length === 0) return 1000
  const maxNumero = Math.max(...registros.value.map(r => r.numeroSorteo))
  return maxNumero + 1
})

// Métodos
const cargarRegistros = async () => {
  cargando.value = true
  error.value = ''
  
  try {
    console.log('🏆 Cargando registros FEIPOBOL...')
    const response = await fetch('/api/admin/registro-feipobol', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      registros.value = data.registros || []
      
      // Generar URLs de QR para cada registro
      registros.value.forEach(registro => {
        if (registro.qrCode) {
          registro.qrCodeDataUrl = `data:image/png;base64,${registro.qrCode}`
        }
      })
      
      console.log('✅ Registros FEIPOBOL cargados:', registros.value.length)
    } else {
      throw new Error('Error al cargar registros')
    }
  } catch (err) {
    console.error('❌ Error cargando registros FEIPOBOL:', err)
    error.value = 'Error al cargar los registros de FEIPOBOL'
  }
  
  cargando.value = false
}

const refrescarDatos = async () => {
  await cargarRegistros()
}

const exportarDatos = async () => {
  try {
    console.log('📊 Exportando datos...')
    const response = await fetch('/api/admin/registro-feipobol/export', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `registro-feipobol-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  } catch (err) {
    console.error('❌ Error exportando datos:', err)
    error.value = 'Error al exportar los datos'
  }
}

const abrirFormularioPublico = () => {
  // Abrir la ruta de Vue Router, no el archivo HTML estático
  const url = window.location.origin + '/registro-feipobol'
  window.open(url, '_blank')
}

const verDetalles = (registro) => {
  registroSeleccionado.value = registro
  mostrarDetalles.value = true
}

const cerrarDetalles = () => {
  mostrarDetalles.value = false
  registroSeleccionado.value = null
}

const descargarQR = (registro) => {
  if (!registro.qrCodeDataUrl) return
  
  const a = document.createElement('a')
  a.href = registro.qrCodeDataUrl
  a.download = `FEIPOBOL-QR-${registro.numeroSorteo}-${registro.nombre}-${registro.apellido}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const imprimirQR = (registro) => {
  const ventanaImpresion = window.open('', '_blank')
  ventanaImpresion.document.write(`
    <html>
      <head>
        <title>FEIPOBOL 2025 - Registro #${registro.numeroSorteo}</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
          .header { background: #6B9080; color: white; padding: 20px; margin-bottom: 20px; }
          .qr-container { margin: 20px 0; }
          .info { margin: 10px 0; }
          .numero-sorteo { font-size: 24px; font-weight: bold; color: #FF6B35; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FEIPOBOL 2025</h1>
          <h2>Registro de Participante</h2>
        </div>
        <div class="numero-sorteo">NÚMERO DE SORTEO: #${registro.numeroSorteo}</div>
        <div class="info"><strong>${registro.nombre} ${registro.apellido}</strong></div>
        <div class="info">CI: ${registro.ci}</div>
        <div class="qr-container">
          <img src="${registro.qrCodeDataUrl}" style="width: 200px; height: 200px;" />
        </div>
        <div class="info">Token: ${registro.token}</div>
        <div class="info">Fecha: ${formatearFechaHora(registro.fechaRegistro)}</div>
      </body>
    </html>
  `)
  ventanaImpresion.document.close()
  ventanaImpresion.print()
}

const marcarParticipacion = async (registro) => {
  if (registro.participoSorteo) return
  
  if (!confirm(`¿Marcar que ${registro.nombre} ${registro.apellido} participó en el sorteo?`)) {
    return
  }
  
  try {
    const response = await fetch(`/api/admin/registro-feipobol/${registro.id}/participacion`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        participoSorteo: true,
        fechaSorteo: new Date().toISOString()
      })
    })
    
    if (response.ok) {
      registro.participoSorteo = true
      registro.fechaSorteo = new Date().toISOString()
      alert('Participación marcada exitosamente')
    }
  } catch (err) {
    console.error('❌ Error marcando participación:', err)
    error.value = 'Error al marcar la participación'
  }
}

const eliminarRegistro = (registro) => {
  registroEliminar.value = registro
  mostrarModalEliminar.value = true
}

const cerrarModalEliminar = () => {
  mostrarModalEliminar.value = false
  registroEliminar.value = null
}

const confirmarEliminarRegistro = async () => {
  if (!registroEliminar.value) return
  
  try {
    const response = await fetch(`/api/admin/registro-feipobol/${registroEliminar.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    
    if (response.ok) {
      alert('✅ Registro eliminado exitosamente')
      await cargarRegistros()
      cerrarModalEliminar()
    } else {
      const data = await response.json()
      alert(data.message || 'Error al eliminar el registro')
    }
  } catch (err) {
    console.error('❌ Error eliminando registro:', err)
    error.value = 'Error al eliminar el registro'
  }
}

const getEstadoClass = (registro) => {
  if (registro.PremioGanado) return 'ganador'
  if (registro.participoSorteo) return 'participo'
  return 'activo'
}

const getEstadoTexto = (registro) => {
  if (registro.PremioGanado) return 'GANADOR'
  if (registro.participoSorteo) return 'PARTICIPÓ'
  return 'ACTIVO'
}

const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A'
  return new Date(fecha).toLocaleDateString('es-ES')
}

const formatearFechaHora = (fecha) => {
  if (!fecha) return 'N/A'
  return new Date(fecha).toLocaleString('es-ES')
}

// Lifecycle
onMounted(() => {
  refrescarDatos()
})
</script>

<style scoped>
.registro-feipobol-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* STATS HEADER */
.stats-header {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  color: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(107, 144, 128, 0.3);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* CONTROLES SUPERIORES */
.controles-superior {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  gap: 20px;
  flex-wrap: wrap;
}

.filtros-busqueda {
  display: flex;
  gap: 15px;
  flex: 1;
  max-width: 800px;
}

.input-busqueda, .select-estado {
  padding: 10px 15px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.input-busqueda {
  flex: 2;
  min-width: 250px;
}

.select-estado {
  flex: 1;
  min-width: 150px;
}

.input-busqueda:focus, .select-estado:focus {
  outline: none;
  border-color: #6B9080;
}

.acciones-superior {
  display: flex;
  gap: 10px;
}

.btn-refrescar, .btn-exportar, .btn-formulario {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-refrescar {
  background: #6B9080;
  color: white;
}

.btn-exportar {
  background: #FF6B35;
  color: white;
}

.btn-formulario {
  background: #4A90E2;
  color: white;
}

.btn-refrescar:hover, .btn-exportar:hover, .btn-formulario:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* ERROR MESSAGE */
.error-message {
  background: #ffebee;
  color: #d32f2f;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #ffcdd2;
}

.btn-cerrar-error {
  background: none;
  border: none;
  color: #d32f2f;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
}

/* LOADING */
.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #6B9080;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* NO REGISTROS */
.no-registros {
  text-align: center;
  padding: 60px 20px;
}

.no-registros-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.btn-ir-formulario {
  background: #4A90E2;
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.btn-ir-formulario:hover {
  background: #357ABD;
  transform: translateY(-2px);
}

/* REGISTROS GRID */
.registros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.registro-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #f0f0f0;
}

.registro-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.registro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
}

.numero-sorteo {
  font-size: 1.2rem;
  font-weight: bold;
  color: #FF6B35;
}

.estado-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.estado-badge.activo {
  background: #e8f5e8;
  color: #388e3c;
}

.estado-badge.participo {
  background: #e3f2fd;
  color: #1976d2;
}

.estado-badge.ganador {
  background: #fff3e0;
  color: #f57c00;
  animation: ganador-glow 2s ease-in-out infinite alternate;
}

@keyframes ganador-glow {
  from { box-shadow: 0 0 5px rgba(245, 124, 0, 0.5); }
  to { box-shadow: 0 0 15px rgba(245, 124, 0, 0.8); }
}

.registro-acciones {
  display: flex;
  gap: 8px;
}

.btn-ver, .btn-qr, .btn-sorteo, .btn-eliminar {
  background: none;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn-ver:hover {
  background: #6B9080;
  color: white;
  border-color: #6B9080;
}

.btn-qr:hover {
  background: #4A90E2;
  color: white;
  border-color: #4A90E2;
}

.btn-sorteo:hover {
  background: #FF6B35;
  color: white;
  border-color: #FF6B35;
}

.btn-eliminar:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-sorteo:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.registro-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.nombre-completo {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.ci {
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.contacto, .zona {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 4px;
}

.registro-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.metadatos {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fecha-registro, .ip-registro {
  font-size: 0.8rem;
  color: #999;
}

.info-sorteo {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.participo-sorteo {
  font-size: 0.8rem;
  color: #1976d2;
  font-weight: 600;
}

.premio-ganado {
  font-size: 0.9rem;
  color: #f57c00;
  font-weight: bold;
  animation: premio-brillo 1.5s ease-in-out infinite alternate;
}

@keyframes premio-brillo {
  from { opacity: 0.8; }
  to { opacity: 1; }
}

.qr-section {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}

.qr-image {
  width: 100px;
  height: 100px;
  margin-bottom: 10px;
}

.qr-token {
  font-size: 0.8rem;
  color: #666;
  word-break: break-all;
}

/* PAGINACIÓN */
.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.btn-pagina {
  background: #6B9080;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-pagina:hover:not(:disabled) {
  background: #5a7a6a;
  transform: translateY(-2px);
}

.btn-pagina:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.info-pagina {
  font-weight: 600;
  color: #666;
}

/* MODAL DETALLES */
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

.modal-detalles {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
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
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.btn-cerrar {
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

.btn-cerrar:hover {
  background: rgba(255,255,255,0.2);
}

.modal-content {
  padding: 30px;
}

.seccion-detalle {
  margin-bottom: 30px;
}

.seccion-detalle h4 {
  color: #6B9080;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 15px;
  padding-bottom: 5px;
  border-bottom: 2px solid #6B9080;
}

.detalle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.detalle-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detalle-item label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.detalle-item span {
  font-size: 1rem;
  color: #333;
}

.numero-destacado {
  font-size: 1.2rem;
  font-weight: bold;
  color: #FF6B35;
}

.token-texto {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  word-break: break-all;
  background: #f5f5f5;
  padding: 5px;
  border-radius: 4px;
}

.estado-badge-detalle {
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
}

.si-participo {
  color: #388e3c;
  font-weight: 600;
}

.premio-destacado {
  font-size: 1.1rem;
  font-weight: bold;
  color: #f57c00;
}

.qr-detalle {
  text-align: center;
}

.qr-image-grande {
  width: 200px;
  height: 200px;
  margin-bottom: 20px;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
}

.qr-acciones {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.btn-descargar-qr, .btn-imprimir-qr {
  background: #6B9080;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-descargar-qr:hover, .btn-imprimir-qr:hover {
  background: #5a7a6a;
  transform: translateY(-2px);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .registro-feipobol-container {
    padding: 15px;
  }
  
  .stats-header {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  .controles-superior {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filtros-busqueda {
    flex-direction: column;
  }
  
  .acciones-superior {
    justify-content: center;
  }
  
  .registros-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .registro-info {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .registro-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .modal-detalles {
    width: 95%;
    margin: 20px;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .detalle-grid {
    grid-template-columns: 1fr;
  }
  
  .qr-acciones {
    flex-direction: column;
    align-items: center;
  }
}

/* Modal de Confirmación de Eliminación */
.modal-confirmacion-eliminar {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: bounceIn 0.5s ease-out;
  text-align: center;
}

.icono-advertencia {
  font-size: 64px;
  margin-bottom: 16px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.titulo-confirmacion {
  font-size: 1.8rem;
  font-weight: bold;
  color: #dc3545;
  margin-bottom: 16px;
}

.mensaje-confirmacion {
  font-size: 1rem;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
}

.info-participante-eliminar {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-participante-eliminar p {
  margin: 8px 0;
  font-size: 1rem;
}

.info-participante-eliminar strong {
  color: #333;
}

.ci-eliminar {
  color: #666;
}

.advertencia-eliminar {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 12px 16px;
  margin-bottom: 24px;
  border-radius: 4px;
}

.advertencia-eliminar p {
  margin: 0;
  color: #856404;
  font-size: 0.9rem;
}

.modal-acciones-eliminar {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancelar-eliminar,
.btn-confirmar-eliminar {
  padding: 12px 32px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-cancelar-eliminar {
  background: #6c757d;
  color: white;
}

.btn-cancelar-eliminar:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-confirmar-eliminar {
  background: #dc3545;
  color: white;
}

.btn-confirmar-eliminar:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
}

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
    transform: scale(1) translateY(0);
  }
}
</style>