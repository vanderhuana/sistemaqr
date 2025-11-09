<template>
  <div class="participantes-lista">
    <div class="header-lista">
      <h2>🎯 Lista de Participantes</h2>
      <div class="header-acciones">
        <button @click="exportarExcel" class="btn-exportar-excel" title="Exportar a Excel">
          📊 EXPORTAR EXCEL
        </button>
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
      <!-- Info de paginación -->
      <div class="info-paginacion">
        <p>
          Mostrando {{ (paginaActual - 1) * itemsPorPagina + 1 }} - 
          {{ Math.min(paginaActual * itemsPorPagina, participantesFiltrados.length) }} 
          de {{ participantesFiltrados.length }} participantes
        </p>
        <select v-model.number="itemsPorPagina" class="select-items-pagina" @change="paginaActual = 1">
          <option :value="10">10 por página</option>
          <option :value="20">20 por página</option>
          <option :value="50">50 por página</option>
          <option :value="100">100 por página</option>
        </select>
      </div>

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
          <tr v-for="participante in participantesPaginados" :key="participante.id">
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
              <button @click="editarParticipante(participante)" class="btn-accion editar" title="Editar datos">
                ✏️
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

      <!-- Controles de paginación -->
      <div v-if="totalPaginas > 1" class="paginacion">
        <button 
          @click="paginaAnterior" 
          :disabled="paginaActual === 1"
          class="btn-pagina"
        >
          ← Anterior
        </button>

        <div class="numeros-pagina">
          <button 
            v-for="pagina in totalPaginas" 
            :key="pagina"
            @click="cambiarPagina(pagina)"
            :class="['btn-numero-pagina', { activo: pagina === paginaActual }]"
            v-show="mostrarNumeroPagina(pagina)"
          >
            {{ pagina }}
          </button>
        </div>

        <button 
          @click="paginaSiguiente" 
          :disabled="paginaActual === totalPaginas"
          class="btn-pagina"
        >
          Siguiente →
        </button>
      </div>
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

    <!-- Modal de Edición -->
    <div v-if="participanteEditando" class="modal-overlay" @click="cerrarEdicion">
      <div class="modal-contenido modal-edicion" @click.stop>
        <button @click="cerrarEdicion" class="btn-cerrar-modal">✕</button>
        <h3>✏️ Editar Participante</h3>
        
        <div class="form-edicion-grid">
          <div class="form-group">
            <label>Nombre *</label>
            <input 
              v-model="participanteEditando.nombre" 
              type="text" 
              placeholder="Nombre"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Apellido *</label>
            <input 
              v-model="participanteEditando.apellido" 
              type="text" 
              placeholder="Apellido"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>CI</label>
            <input 
              v-model="participanteEditando.ci" 
              type="text" 
              placeholder="Cédula de Identidad"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Teléfono *</label>
            <input 
              v-model="participanteEditando.telefono" 
              type="text" 
              placeholder="Número de teléfono"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Correo</label>
            <input 
              v-model="participanteEditando.correo" 
              type="email" 
              placeholder="correo@ejemplo.com"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Zona</label>
            <input 
              v-model="participanteEditando.zona" 
              type="text" 
              placeholder="Zona de residencia"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Área</label>
            <input 
              v-model="participanteEditando.area" 
              type="text" 
              placeholder="Área"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Ocupación</label>
            <input 
              v-model="participanteEditando.ocupacion" 
              type="text" 
              placeholder="Ocupación"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Sexo</label>
            <select v-model="participanteEditando.sexo" :disabled="guardandoEdicion">
              <option value="">Seleccione...</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Fecha de Nacimiento</label>
            <input 
              v-model="participanteEditando.fechaNacimiento" 
              type="date" 
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Empresa/Stand</label>
            <select v-model="participanteEditando.empresaId" :disabled="guardandoEdicion">
              <option :value="null">Sin empresa</option>
              <option 
                v-for="empresa in empresas" 
                :key="empresa.id" 
                :value="empresa.id"
              >
                {{ empresa.nombre }} ({{ empresa.cupoDisponible || 0 }}/{{ empresa.cupoTotal }} disponibles)
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Estado</label>
            <select v-model="participanteEditando.estado" :disabled="guardandoEdicion">
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
          
          <!-- Datos de Referencia -->
          <div class="form-group full-width">
            <h4 class="seccion-titulo">👥 Datos de Referencia (Opcional)</h4>
          </div>
          
          <div class="form-group">
            <label>Nombre de Referencia</label>
            <input 
              v-model="participanteEditando.nombreReferencia" 
              type="text" 
              placeholder="Nombre completo"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Parentesco</label>
            <input 
              v-model="participanteEditando.parentesco" 
              type="text" 
              placeholder="Ej: Padre, Madre, Hermano"
              :disabled="guardandoEdicion"
            />
          </div>
          
          <div class="form-group">
            <label>Teléfono de Referencia</label>
            <input 
              v-model="participanteEditando.celularReferencia" 
              type="text" 
              placeholder="Número de contacto"
              :disabled="guardandoEdicion"
            />
          </div>
        </div>
        
        <div class="modal-acciones">
          <button 
            @click="cerrarEdicion" 
            class="btn-cancelar"
            :disabled="guardandoEdicion"
          >
            Cancelar
          </button>
          <button 
            @click="guardarEdicion" 
            class="btn-guardar"
            :disabled="guardandoEdicion"
          >
            {{ guardandoEdicion ? '⏳ Guardando...' : '💾 Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Gestión de Empresas/Stands -->
    <div v-if="mostrarModalEmpresas" class="modal-overlay" @click="cerrarModalEmpresas">
      <div class="modal-empresas" @click.stop>
        <!-- Header del Modal -->
        <div class="modal-header-empresas">
          <div class="modal-title-empresas">
            <span class="icono-modal">🏢</span>
            <h3>Gestión de Empresas/Stands</h3>
          </div>
          <button @click="cerrarModalEmpresas" class="btn-cerrar-modal">✕</button>
        </div>

        <!-- Formulario para agregar empresa -->
        <div class="form-empresa-card">
          <div class="form-empresa-header">
            <span class="icono-form">✨</span>
            <h4>Agregar Nueva Empresa/Stand</h4>
          </div>
          <div class="form-row-empresa">
            <div class="input-group-empresa">
              <label>Nombre de la Empresa/Stand</label>
              <input 
                v-model="nuevaEmpresa.nombre" 
                type="text" 
                placeholder="Ej: Stand Artesanías La Paz"
                class="input-empresa"
                maxlength="100"
              />
            </div>
            <div class="input-group-empresa">
              <label>Cupo Total</label>
              <input 
                v-model.number="nuevaEmpresa.cupoTotal" 
                type="number" 
                min="1"
                max="1000"
                placeholder="0"
                class="input-cupo"
              />
            </div>
            <button 
              @click="agregarEmpresa" 
              class="btn-agregar-empresa"
              :disabled="!nuevaEmpresa.nombre || !nuevaEmpresa.cupoTotal || guardandoEmpresa"
            >
              <span class="btn-icono">{{ guardandoEmpresa ? '⏳' : '➕' }}</span>
              <span class="btn-texto">{{ guardandoEmpresa ? 'AGREGANDO...' : 'AGREGAR' }}</span>
            </button>
          </div>
        </div>

        <!-- Mensaje de operación -->
        <transition name="fade">
          <div v-if="mensajeEmpresa" :class="['alerta-empresa', tipoMensajeEmpresa === 'success' ? 'alerta-exito' : 'alerta-error']">
            <span class="alerta-icono">{{ tipoMensajeEmpresa === 'success' ? '✅' : '⚠️' }}</span>
            {{ mensajeEmpresa }}
          </div>
        </transition>

        <!-- Barra de búsqueda y filtros -->
        <div class="filtros-empresas">
          <div class="busqueda-empresa-wrapper">
            <span class="icono-busqueda">�</span>
            <input 
              v-model="busquedaEmpresa"
              type="text" 
              placeholder="Buscar empresa/stand..."
              class="input-busqueda-empresa"
            />
          </div>
          <select v-model="filtroEstadoEmpresa" class="select-filtro-estado-empresa">
            <option value="">Todos los estados</option>
            <option value="disponible">✅ Disponibles</option>
            <option value="completo">🔴 Completos</option>
          </select>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="stats-empresas">
          <div class="stat-card-empresa">
            <div class="stat-icono">🏢</div>
            <div class="stat-info">
              <div class="stat-numero">{{ empresasFiltradas.length }}</div>
              <div class="stat-label">Total</div>
            </div>
          </div>
          <div class="stat-card-empresa disponible">
            <div class="stat-icono">✅</div>
            <div class="stat-info">
              <div class="stat-numero">{{ empresasDisponibles }}</div>
              <div class="stat-label">Disponibles</div>
            </div>
          </div>
          <div class="stat-card-empresa completo">
            <div class="stat-icono">🔴</div>
            <div class="stat-info">
              <div class="stat-numero">{{ empresasCompletas }}</div>
              <div class="stat-label">Completos</div>
            </div>
          </div>
        </div>

        <!-- Tabla/Grid de empresas -->
        <div class="tabla-empresas-wrapper">
          <div v-if="cargandoEmpresas" class="loading-empresas">
            <div class="spinner"></div>
            <p>Cargando empresas...</p>
          </div>

          <!-- Vista de Lista (Responsive) -->
          <div v-else-if="empresasFiltradas.length > 0" class="empresas-lista">
            <div 
              v-for="empresa in empresasFiltradas" 
              :key="empresa.id" 
              class="empresa-item"
              :class="{ 'editando': editandoEmpresa?.id === empresa.id }"
            >
              <!-- Modo Vista Normal -->
              <template v-if="editandoEmpresa?.id !== empresa.id">
                <div class="empresa-info-principal">
                  <span class="icono-empresa">🏪</span>
                  <div class="empresa-nombre-estado">
                    <h5 class="nombre-empresa-lista">{{ empresa.nombre }}</h5>
                    <span :class="['badge-estado-lista', (empresa.cupoDisponible || 0) > 0 ? 'disponible' : 'completo']">
                      {{ (empresa.cupoDisponible || 0) > 0 ? '✅ Disponible' : '🔴 Completo' }}
                    </span>
                  </div>
                </div>

                <div class="empresa-cupo-info">
                  <div class="cupo-numeros-lista">
                    <span class="cupo-usado">{{ empresa.cupoUsado || 0 }}</span>
                    <span class="cupo-separador">/</span>
                    <span class="cupo-total">{{ empresa.cupoTotal }}</span>
                  </div>

                  <div class="progress-wrapper-lista">
                    <div class="progress-bar-lista">
                      <div 
                        class="progress-fill-lista" 
                        :style="{ width: `${empresa.porcentajeUso || 0}%` }"
                        :class="getProgressClass(empresa.porcentajeUso || 0)"
                      ></div>
                    </div>
                    <span class="porcentaje-text">{{ Math.round(empresa.porcentajeUso || 0) }}%</span>
                  </div>
                </div>

                <div class="empresa-acciones">
                  <button @click="iniciarEdicion(empresa)" class="btn-lista-accion editar" title="Editar empresa">
                    ✏️
                  </button>
                  <button @click="eliminarEmpresa(empresa.id, empresa.cupoUsado)" class="btn-lista-accion eliminar" title="Eliminar empresa">
                    🗑️
                  </button>
                </div>
              </template>

              <!-- Modo Edición -->
              <template v-else>
                <div class="empresa-edit-lista">
                  <div class="edit-info-principal">
                    <span class="icono-edit">✏️</span>
                    <div class="input-group-inline">
                      <label>Nombre:</label>
                      <input 
                        v-model="editandoEmpresa.nombre"
                        type="text"
                        class="input-editar-nombre-lista"
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                  </div>

                  <div class="edit-cupo-info">
                    <div class="input-group-inline">
                      <label>Cupo Total:</label>
                      <input 
                        v-model.number="editandoEmpresa.cupoTotal"
                        type="number"
                        min="1"
                        class="input-editar-cupo-lista"
                        placeholder="0"
                      />
                    </div>
                    <small class="cupo-minimo-text">Mínimo: {{ editandoEmpresa.cupoUsado || 0 }}</small>
                  </div>

                  <div class="edit-acciones">
                    <button @click="guardarEdicionEmpresa" class="btn-lista-accion guardar" title="Guardar cambios">
                      💾
                    </button>
                    <button @click="cancelarEdicion" class="btn-lista-accion cancelar" title="Cancelar edición">
                      ✕
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div v-else class="sin-empresas">
            <div class="sin-empresas-icono">📭</div>
            <h4>No hay empresas/stands registrados</h4>
            <p>Agrega tu primera empresa usando el formulario superior</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div v-if="mostrarModalEliminar" class="modal-overlay" @click="cerrarModalEliminar">
      <div class="modal-confirmacion-eliminar" @click.stop>
        <div class="icono-advertencia">⚠️</div>
        <h3 class="titulo-confirmacion">¿Eliminar Participante?</h3>
        <p class="mensaje-confirmacion">
          Estás a punto de eliminar a:
        </p>
        <div class="info-participante-eliminar" v-if="participanteEliminar">
          <strong>{{ participanteEliminar.nombre }} {{ participanteEliminar.apellido }}</strong>
          <span class="ci-eliminar">CI: {{ participanteEliminar.ci }}</span>
        </div>
        <p class="advertencia-eliminar">
          ⚡ Esta acción no se puede deshacer
        </p>
        <div class="modal-acciones-eliminar">
          <button @click="cerrarModalEliminar" class="btn-cancelar-eliminar">
            ✕ Cancelar
          </button>
          <button @click="confirmarEliminarParticipante" class="btn-confirmar-eliminar">
            🗑️ Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { participanteService, empresaService } from '../services/api'
import { generarCredencialPDF } from '../utils/credencialGenerator'
import * as XLSX from 'xlsx'

const participantes = ref([])
const busqueda = ref('')
const filtroEmpresa = ref('')
const filtroEstado = ref('')
const empresasFiltro = ref([])
const cargando = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('')
const participanteSeleccionado = ref(null)

// Variables para edición de participante
const participanteEditando = ref(null)
const guardandoEdicion = ref(false)

// Variables de paginación
const paginaActual = ref(1)
const itemsPorPagina = ref(20)
const totalPaginas = computed(() => Math.ceil(participantesFiltrados.value.length / itemsPorPagina.value))

// Variables para gestión de empresas
const mostrarModalEmpresas = ref(false)
const mostrarModalEliminar = ref(false)
const participanteEliminar = ref(null)
const empresas = ref([])
const cargandoEmpresas = ref(false)
const guardandoEmpresa = ref(false)
const mensajeEmpresa = ref('')
const tipoMensajeEmpresa = ref('')
const busquedaEmpresa = ref('')
const filtroEstadoEmpresa = ref('')
const nuevaEmpresa = ref({
  nombre: '',
  cupoTotal: null
})
const editandoEmpresa = ref(null)

// Computed para empresas filtradas
const empresasFiltradas = computed(() => {
  let resultado = empresas.value
  
  // Filtro por búsqueda
  if (busquedaEmpresa.value) {
    const termino = busquedaEmpresa.value.toLowerCase()
    resultado = resultado.filter(e => 
      e.nombre.toLowerCase().includes(termino)
    )
  }
  
  // Filtro por estado
  if (filtroEstadoEmpresa.value) {
    if (filtroEstadoEmpresa.value === 'disponible') {
      resultado = resultado.filter(e => (e.cupoDisponible || 0) > 0)
    } else if (filtroEstadoEmpresa.value === 'completo') {
      resultado = resultado.filter(e => (e.cupoDisponible || 0) === 0)
    }
  }
  
  return resultado
})

// Computed para estadísticas
const empresasDisponibles = computed(() => {
  return empresas.value.filter(e => (e.cupoDisponible || 0) > 0).length
})

const empresasCompletas = computed(() => {
  return empresas.value.filter(e => (e.cupoDisponible || 0) === 0).length
})

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

// Participantes paginados
const participantesPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * itemsPorPagina.value
  const fin = inicio + itemsPorPagina.value
  return participantesFiltrados.value.slice(inicio, fin)
})

// Funciones de paginación
const cambiarPagina = (pagina) => {
  if (pagina >= 1 && pagina <= totalPaginas.value) {
    paginaActual.value = pagina
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const paginaAnterior = () => {
  cambiarPagina(paginaActual.value - 1)
}

const paginaSiguiente = () => {
  cambiarPagina(paginaActual.value + 1)
}

// Mostrar solo páginas cercanas a la actual
const mostrarNumeroPagina = (pagina) => {
  if (totalPaginas.value <= 7) return true
  if (pagina === 1 || pagina === totalPaginas.value) return true
  if (Math.abs(pagina - paginaActual.value) <= 2) return true
  return false
}

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

// Exportar a Excel
const exportarExcel = () => {
  try {
    // Preparar datos para exportar (usar datos filtrados actuales)
    const datos = participantesFiltrados.value.map(p => ({
      Nombre: p.nombre,
      Apellido: p.apellido,
      CI: p.ci || '',
      Teléfono: p.telefono,
      Correo: p.correo || '',
      Zona: p.zona || '',
      Área: p.area || '',
      Ocupación: p.ocupacion || '',
      Sexo: p.sexo || '',
      'Fecha Nacimiento': p.fechaNacimiento || '',
      Empresa: p.Empresa?.nombre || '',
      Estado: p.estado,
      'Nombre Referencia': p.nombreReferencia || '',
      Parentesco: p.parentesco || '',
      'Teléfono Referencia': p.celularReferencia || '',
      Token: p.token,
      'Fecha Registro': new Date(p.createdAt).toLocaleDateString()
    }))

    // Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(datos)
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // Nombre
      { wch: 15 }, // Apellido
      { wch: 12 }, // CI
      { wch: 12 }, // Teléfono
      { wch: 25 }, // Correo
      { wch: 15 }, // Zona
      { wch: 15 }, // Área
      { wch: 20 }, // Ocupación
      { wch: 10 }, // Sexo
      { wch: 15 }, // Fecha Nacimiento
      { wch: 25 }, // Empresa
      { wch: 12 }, // Estado
      { wch: 20 }, // Nombre Referencia
      { wch: 15 }, // Parentesco
      { wch: 15 }, // Teléfono Referencia
      { wch: 40 }, // Token
      { wch: 15 }  // Fecha Registro
    ]
    ws['!cols'] = colWidths

    // Crear libro
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes')

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split('T')[0]
    const nombreArchivo = `Participantes_FEIPOBOL_${fecha}.xlsx`

    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo)

    mensaje.value = `✅ Excel exportado exitosamente: ${datos.length} participantes`
    mensajeTipo.value = 'success'
    setTimeout(() => {
      mensaje.value = ''
    }, 3000)
  } catch (error) {
    console.error('Error al exportar Excel:', error)
    mensaje.value = '❌ Error al exportar a Excel'
    mensajeTipo.value = 'error'
  }
}

// Editar participante
const editarParticipante = (participante) => {
  participanteEditando.value = { 
    ...participante,
    empresaId: participante.Empresa?.id || null
  }
}

const cerrarEdicion = () => {
  participanteEditando.value = null
}

const guardarEdicion = async () => {
  if (!participanteEditando.value) return
  
  // Validaciones básicas
  if (!participanteEditando.value.nombre || !participanteEditando.value.apellido) {
    mensaje.value = '❌ Nombre y apellido son obligatorios'
    mensajeTipo.value = 'error'
    return
  }

  if (!participanteEditando.value.telefono) {
    mensaje.value = '❌ El teléfono es obligatorio'
    mensajeTipo.value = 'error'
    return
  }

  guardandoEdicion.value = true

  try {
    const datosActualizar = {
      nombre: participanteEditando.value.nombre,
      apellido: participanteEditando.value.apellido,
      ci: participanteEditando.value.ci,
      telefono: participanteEditando.value.telefono,
      correo: participanteEditando.value.correo,
      zona: participanteEditando.value.zona,
      area: participanteEditando.value.area,
      ocupacion: participanteEditando.value.ocupacion,
      sexo: participanteEditando.value.sexo,
      fechaNacimiento: participanteEditando.value.fechaNacimiento,
      estado: participanteEditando.value.estado,
      empresaId: participanteEditando.value.empresaId,
      nombreReferencia: participanteEditando.value.nombreReferencia,
      parentesco: participanteEditando.value.parentesco,
      celularReferencia: participanteEditando.value.celularReferencia
    }

    const resultado = await participanteService.updateParticipante(
      participanteEditando.value.id,
      datosActualizar
    )

    if (resultado.success) {
      mensaje.value = '✅ Participante actualizado exitosamente'
      mensajeTipo.value = 'success'
      cerrarEdicion()
      cargarParticipantes()
    } else {
      mensaje.value = '❌ Error al actualizar participante'
      mensajeTipo.value = 'error'
    }
  } catch (error) {
    console.error('Error al guardar edición:', error)
    mensaje.value = `❌ Error: ${error.response?.data?.error || error.message}`
    mensajeTipo.value = 'error'
  } finally {
    guardandoEdicion.value = false
  }
}

const eliminarParticipante = (id) => {
  // Buscar el participante para mostrar su información
  const participante = participantesFiltrados.value.find(p => p.id === id)
  if (participante) {
    participanteEliminar.value = participante
    mostrarModalEliminar.value = true
  }
}

const cerrarModalEliminar = () => {
  mostrarModalEliminar.value = false
  participanteEliminar.value = null
}

const confirmarEliminarParticipante = async () => {
  if (!participanteEliminar.value) return

  try {
    const resultado = await participanteService.deleteParticipante(participanteEliminar.value.id)
    
    if (resultado.success) {
      mensaje.value = '✅ Participante eliminado exitosamente'
      mensajeTipo.value = 'success'
      cerrarModalEliminar()
      cargarParticipantes()
    } else {
      mensaje.value = '❌ Error al eliminar participante'
      mensajeTipo.value = 'error'
    }
  } catch (error) {
    console.error('Error:', error)
    mensaje.value = '❌ Error al eliminar participante'
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

// Helper para clases de barra de progreso
const getProgressClass = (porcentaje) => {
  if (porcentaje >= 100) return 'completo'
  if (porcentaje >= 75) return 'alto'
  if (porcentaje >= 50) return 'medio'
  return 'bajo'
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

const guardarEdicionEmpresa = async () => {
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

// Resetear a página 1 cuando cambien los filtros
watch([busqueda, filtroEmpresa, filtroEstado], () => {
  paginaActual.value = 1
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
/* ==================== MODAL DE GESTIÓN DE EMPRESAS/STANDS ==================== */
.modal-empresas {
  background: white;
  border-radius: 20px;
  padding: 0;
  width: 95%;
  max-width: 1100px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Header del Modal */
.modal-header-empresas {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px 20px 0 0;
}

.modal-title-empresas {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}

.icono-modal {
  font-size: 2rem;
  animation: bounce 1s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

.modal-title-empresas h3 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.btn-cerrar-modal {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  backdrop-filter: blur(10px);
}

.btn-cerrar-modal:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Contenido del Modal con scroll */
.modal-empresas > div:not(.modal-header-empresas) {
  padding: 25px 30px;
  overflow-y: auto;
  flex: 1;
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

/* Botón Exportar Excel */
.btn-exportar-excel {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
}

.btn-exportar-excel:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.btn-exportar-excel:active {
  transform: translateY(0);
}

/* Modal de Edición */
.modal-contenido.modal-edicion {
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-contenido.modal-edicion h3 {
  color: #f59e0b;
  margin-bottom: 25px;
  font-size: 1.5rem;
  text-align: center;
  border-bottom: 2px solid #fbbf24;
  padding-bottom: 15px;
}

.form-edicion-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #374151;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 10px 15px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.seccion-titulo {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
  padding: 10px 0;
  border-top: 1px solid #e5e7eb;
}

.modal-acciones {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding-top: 20px;
  border-top: 2px solid #e5e7eb;
}

.btn-cancelar {
  background: #6b7280;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancelar:hover {
  background: #4b5563;
  transform: translateY(-2px);
}

.btn-cancelar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-guardar {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
}

.btn-guardar:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.btn-guardar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Responsive para modal de edición */
@media (max-width: 768px) {
  .form-edicion-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-contenido.modal-edicion {
    max-width: 95%;
    padding: 20px;
  }
  
  .modal-acciones {
    flex-direction: column;
  }
  
  .btn-cancelar,
  .btn-guardar {
    width: 100%;
  }
}

/* Formulario de Agregar Empresa */
.form-empresa-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 25px;
  border: 2px solid #dee2e6;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.form-empresa-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.icono-form {
  font-size: 1.5rem;
}

.form-empresa-header h4 {
  margin: 0;
  color: #495057;
  font-size: 1.2rem;
  font-weight: 700;
}

.form-row-empresa {
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 15px;
  align-items: end;
}

.input-group-empresa {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group-empresa label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
}

.input-empresa,
.input-cupo {
  padding: 14px 18px;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.input-empresa:focus,
.input-cupo:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.input-cupo {
  text-align: center;
  font-weight: 700;
  font-size: 1.1rem;
}

.btn-agregar-empresa {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.3);
  height: 52px;
}

.btn-agregar-empresa:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
}

.btn-agregar-empresa:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-icono {
  font-size: 1.2rem;
}

.btn-texto {
  font-size: 0.95rem;
}

/* Alertas */
.alerta-empresa {
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  animation: slideInLeft 0.3s ease;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.alerta-icono {
  font-size: 1.3rem;
}

.alerta-exito {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  border: 2px solid #b1dfbb;
}

.alerta-error {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  color: #721c24;
  border: 2px solid #f1b0b7;
}

.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Filtros y Búsqueda */
.filtros-empresas {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.busqueda-empresa-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.icono-busqueda {
  position: absolute;
  left: 15px;
  font-size: 1.2rem;
  pointer-events: none;
  z-index: 1;
}

.input-busqueda-empresa {
  width: 100%;
  padding: 14px 18px 14px 45px;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.input-busqueda-empresa:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.select-filtro-estado-empresa {
  padding: 14px 18px;
  border: 2px solid #dee2e6;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.select-filtro-estado-empresa:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

/* Estadísticas */
.stats-empresas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 25px;
}

.stat-card-empresa {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
  border: 2px solid #dee2e6;
  transition: all 0.3s ease;
}

.stat-card-empresa:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.stat-card-empresa.disponible {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-color: #b1dfbb;
}

.stat-card-empresa.completo {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  border-color: #f1b0b7;
}

.stat-icono {
  font-size: 2.5rem;
}

.stat-info {
  flex: 1;
}

.stat-numero {
  font-size: 2rem;
  font-weight: 900;
  color: #212529;
  line-height: 1;
}

.stat-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  margin-top: 4px;
}

/* Grid de Empresas */
.tabla-empresas-wrapper {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 15px;
  border: 2px solid #dee2e6;
}

.empresas-lista {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empresa-item {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  border: 2px solid #dee2e6;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.empresa-item:hover:not(.editando) {
  border-color: #667eea;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.empresa-item.editando {
  border-color: #ffc107;
  box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.2);
}

/* Info Principal (Izquierda) */
.empresa-info-principal {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 200px;
}

.icono-empresa {
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.empresa-nombre-estado {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nombre-empresa-lista {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #2c3e50;
}

.badge-estado-lista {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  width: fit-content;
}

.badge-estado-lista.disponible {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.badge-estado-lista.completo {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
}

/* Cupo Info (Centro) */
.empresa-cupo-info {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
  min-width: 250px;
}

.cupo-numeros-lista {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.cupo-usado {
  font-size: 1.5rem;
  font-weight: 900;
  color: #667eea;
}

.cupo-separador {
  font-size: 1.2rem;
  font-weight: 700;
  color: #6c757d;
}

.cupo-total {
  font-size: 1.2rem;
  font-weight: 700;
  color: #6c757d;
}

.progress-wrapper-lista {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar-lista {
  flex: 1;
  height: 10px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.progress-fill-lista {
  height: 100%;
  border-radius: 10px;
  transition: all 0.5s ease;
}

.progress-fill-lista.bajo {
  background: linear-gradient(90deg, #28a745 0%, #20c997 100%);
}

.progress-fill-lista.medio {
  background: linear-gradient(90deg, #20c997 0%, #ffc107 100%);
}

.progress-fill-lista.alto {
  background: linear-gradient(90deg, #ffc107 0%, #fd7e14 100%);
}

.progress-fill-lista.completo {
  background: linear-gradient(90deg, #fd7e14 0%, #dc3545 100%);
}

.porcentaje-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #495057;
  min-width: 45px;
  text-align: right;
}

/* Acciones (Derecha) */
.empresa-acciones {
  display: flex;
  gap: 8px;
}

.btn-lista-accion {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 10px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-lista-accion.editar {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  box-shadow: 0 3px 8px rgba(0, 123, 255, 0.3);
}

.btn-lista-accion.editar:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 12px rgba(0, 123, 255, 0.4);
}

.btn-lista-accion.eliminar {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  color: white;
  box-shadow: 0 3px 8px rgba(220, 53, 69, 0.3);
}

.btn-lista-accion.eliminar:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 12px rgba(220, 53, 69, 0.4);
}

.btn-lista-accion.guardar {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  box-shadow: 0 3px 8px rgba(40, 167, 69, 0.3);
}

.btn-lista-accion.guardar:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 12px rgba(40, 167, 69, 0.4);
}

.btn-lista-accion.cancelar {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
  box-shadow: 0 3px 8px rgba(108, 117, 125, 0.3);
}

.btn-lista-accion.cancelar:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 12px rgba(108, 117, 125, 0.4);
}

/* Modo Edición Lista */
.empresa-edit-lista {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
}

.edit-info-principal {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.icono-edit {
  font-size: 1.5rem;
}

.input-group-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.input-group-inline label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #495057;
  white-space: nowrap;
}

.input-editar-nombre-lista,
.input-editar-cupo-lista {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #ffc107;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
}

.edit-cupo-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.cupo-minimo-text {
  font-size: 0.75rem;
  color: #6c757d;
  margin-left: 80px;
}

.edit-acciones {
  display: flex;
  gap: 8px;
}

.input-editar-nombre-lista:focus,
.input-editar-cupo-lista:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 4px rgba(255, 193, 7, 0.2);
}

.input-editar-cupo-lista {
  text-align: center;
  font-weight: 700;
  font-size: 1.2rem;
}

.cupo-minimo-text {
  font-size: 0.8rem;
  color: #6c757d;
  font-style: italic;
  margin-top: 4px;
}

/* Sin Empresas */
.sin-empresas {
  text-align: center;
  padding: 60px 20px;
  color: #6c757d;
}

.sin-empresas-icono {
  font-size: 5rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.sin-empresas h4 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  color: #495057;
}

.sin-empresas p {
  margin: 0;
  font-size: 1rem;
  color: #6c757d;
}

/* Loading */
.loading-empresas {
  text-align: center;
  padding: 60px 20px;
}

.loading-empresas .spinner {
  width: 60px;
  height: 60px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  margin: 0 auto 20px;
}

.loading-empresas p {
  color: #6c757d;
  font-size: 1.1rem;
  font-weight: 600;
}

/* ==================== RESPONSIVE MODAL EMPRESAS ==================== */
@media (max-width: 1024px) {
  .modal-empresas {
    width: 90%;
    max-width: 800px;
  }

  .empresas-lista {
    gap: 12px;
  }

  .form-row-empresa {
    grid-template-columns: 1fr 130px auto;
  }

  .stats-empresas {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .modal-empresas {
    width: 100%;
    max-height: 95vh;
    border-radius: 15px 15px 0 0;
  }

  .modal-header-empresas {
    padding: 20px 20px;
  }

  .modal-title-empresas h3 {
    font-size: 1.4rem;
  }

  .icono-modal {
    font-size: 1.5rem;
  }

  .btn-cerrar-modal {
    width: 38px;
    height: 38px;
    font-size: 1.3rem;
  }

  .modal-empresas > div:not(.modal-header-empresas) {
    padding: 20px;
  }

  .form-empresa-card {
    padding: 20px;
  }

  .form-row-empresa {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .btn-agregar-empresa {
    width: 100%;
    justify-content: center;
  }

  .filtros-empresas {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .stats-empresas {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .stat-card-empresa {
    padding: 15px 10px;
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }

  .stat-icono {
    font-size: 2rem;
  }

  .stat-numero {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .empresas-lista {
    gap: 10px;
  }

  .empresa-item {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
    padding: 15px;
  }

  .empresa-info-principal {
    min-width: auto;
  }

  .empresa-cupo-info {
    min-width: auto;
    flex-direction: column;
    gap: 10px;
  }

  .cupo-numeros-lista {
    justify-content: center;
  }

  .progress-wrapper-lista {
    width: 100%;
  }

  .porcentaje-text {
    text-align: center;
  }

  .empresa-acciones {
    justify-content: center;
  }

  .edit-info-principal {
    flex-direction: column;
    gap: 10px;
  }

  .input-group-inline {
    flex-direction: column;
    align-items: stretch;
  }

  .edit-cupo-info {
    margin-top: 10px;
  }

  .cupo-minimo-text {
    margin-left: 0;
    text-align: center;
  }

  .edit-acciones {
    justify-content: center;
  }

  .tabla-empresas-wrapper {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .modal-header-empresas {
    padding: 18px 15px;
  }

  .modal-title-empresas h3 {
    font-size: 1.2rem;
  }

  .icono-modal {
    font-size: 1.3rem;
  }

  .btn-cerrar-modal {
    width: 35px;
    height: 35px;
    font-size: 1.2rem;
  }

  .modal-empresas > div:not(.modal-header-empresas) {
    padding: 15px;
  }

  .form-empresa-card {
    padding: 15px;
  }

  .form-empresa-header h4 {
    font-size: 1rem;
  }

  .input-empresa,
  .input-cupo,
  .input-busqueda-empresa,
  .select-filtro-estado-empresa {
    padding: 12px 15px;
    font-size: 0.95rem;
  }

  .btn-agregar-empresa {
    padding: 12px 20px;
    font-size: 0.9rem;
  }

  .stats-empresas {
    gap: 8px;
  }

  .stat-card-empresa {
    padding: 12px 8px;
  }

  .stat-icono {
    font-size: 1.8rem;
  }

  .stat-numero {
    font-size: 1.3rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .cupo-usado {
    font-size: 2rem;
  }

  .cupo-total,
  .cupo-separador {
    font-size: 1.6rem;
  }

  .empresa-card-footer {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .btn-card-accion {
    padding: 10px 14px;
    font-size: 0.85rem;
  }

  .sin-empresas {
    padding: 40px 15px;
  }

  .sin-empresas-icono {
    font-size: 4rem;
  }

  .sin-empresas h4 {
    font-size: 1.1rem;
  }

  .sin-empresas p {
    font-size: 0.9rem;
  }
}

/* ==================== PAGINACIÓN ==================== */
.info-paginacion {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-bottom: 15px;
}

.info-paginacion p {
  margin: 0;
  font-weight: 600;
  color: #495057;
  font-size: 0.95rem;
}

.select-items-pagina {
  padding: 8px 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.select-items-pagina:hover {
  border-color: #667eea;
}

.select-items-pagina:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.paginacion {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 25px 20px;
  background: #f8f9fa;
  border-radius: 10px;
  margin-top: 20px;
}

.btn-pagina {
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 8px rgba(102, 126, 234, 0.3);
}

.btn-pagina:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(102, 126, 234, 0.4);
}

.btn-pagina:disabled {
  background: linear-gradient(135deg, #adb5bd 0%, #868e96 100%);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.numeros-pagina {
  display: flex;
  gap: 5px;
  align-items: center;
}

.btn-numero-pagina {
  width: 40px;
  height: 40px;
  border: 2px solid #dee2e6;
  background: white;
  color: #495057;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-numero-pagina:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateY(-2px);
}

.btn-numero-pagina.activo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
}

/* Responsive paginación */
@media (max-width: 768px) {
  .info-paginacion {
    flex-direction: column;
    gap: 10px;
    padding: 12px 15px;
  }

  .info-paginacion p {
    font-size: 0.85rem;
    text-align: center;
  }

  .select-items-pagina {
    width: 100%;
    padding: 10px;
  }

  .paginacion {
    flex-wrap: wrap;
    gap: 8px;
    padding: 20px 15px;
  }

  .btn-pagina {
    padding: 8px 15px;
    font-size: 0.85rem;
  }

  .btn-numero-pagina {
    width: 35px;
    height: 35px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .numeros-pagina {
    gap: 3px;
  }

  .btn-numero-pagina {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }

  .btn-pagina {
    padding: 8px 12px;
    font-size: 0.8rem;
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
