<template>
  <div class="reports-manager">
    <div class="header">
      <h2>📊 Módulo de Reportes</h2>
      <p>Genera reportes detallados con filtros personalizados</p>
    </div>

    <!-- Tabs de navegación -->
    <div class="tabs-container">
      <button 
        @click="activeTab = 'ventas'" 
        :class="['tab-button', { active: activeTab === 'ventas' }]"
      >
        💰 Reportes de Ventas
      </button>
      <button 
        @click="activeTab = 'accesos'" 
        :class="['tab-button', { active: activeTab === 'accesos' }]"
      >
        🎫 Reportes de Accesos (Generador QR)
      </button>
    </div>

    <!-- CONTENIDO: Reportes de Ventas -->
    <div v-show="activeTab === 'ventas'" class="tab-content">

    <!-- Filtros -->
    <div class="filters-section">
      <h3>🔍 Filtros</h3>
      <div class="filters-grid">
        <!-- Filtro por fechas -->
        <div class="filter-group">
          <label>📅 Rango de fechas:</label>
          <div class="date-range">
            <input 
              type="date" 
              v-model="filters.fechaInicio"
              class="form-input"
            >
            <span>hasta</span>
            <input 
              type="date" 
              v-model="filters.fechaFin"
              class="form-input"
            >
          </div>
        </div>

        <!-- Filtro por evento -->
        <div class="filter-group">
          <label>� Evento:</label>
          <select v-model="filters.eventId" class="form-select">
            <option value="">Todos los eventos</option>
            <option 
              v-for="evento in filterOptions.eventos" 
              :key="evento.value" 
              :value="evento.value"
            >
              {{ evento.label }}
            </option>
          </select>
        </div>

        <!-- Filtro por estado -->
        <div class="filter-group">
          <label>📋 Estado:</label>
          <select v-model="filters.estado" class="form-select">
            <option value="">Todos los estados</option>
            <option 
              v-for="estado in filterOptions.estados" 
              :key="estado.value" 
              :value="estado.value"
            >
              {{ estado.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="filter-actions">
        <button 
          @click="aplicarFiltros" 
          class="btn-primary"
          :disabled="cargando"
        >
          <span v-if="cargando">🔄 Cargando...</span>
          <span v-else>🔍 Aplicar Filtros</span>
        </button>
        
        <button 
          @click="limpiarFiltros" 
          class="btn-secondary"
        >
          🗑️ Limpiar
        </button>
        
        <button 
          @click="generarPDF" 
          class="btn-success"
          :disabled="!reportData.tickets || reportData.tickets.length === 0"
        >
          📄 Descargar PDF
        </button>
      </div>
    </div>

    <!-- Estadísticas -->
    <div v-if="reportData.estadisticas" class="statistics-section">
      <h3>📈 Estadísticas</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ reportData.estadisticas.totalTickets }}</div>
          <div class="stat-label">Total de Entradas</div>
        </div>
        
        <div class="stat-card" v-if="reportData.estadisticas.totalVendido">
          <div class="stat-number">Bs. {{ reportData.estadisticas.totalVendido }}</div>
          <div class="stat-label">Total Vendido</div>
        </div>
        
        <div class="stat-card" v-if="reportData.estadisticas.promedioVenta">
          <div class="stat-number">Bs. {{ reportData.estadisticas.promedioVenta }}</div>
          <div class="stat-label">Promedio por Venta</div>
        </div>
      </div>

      <!-- Gráficos simples -->
      <div class="charts-section">
        <!-- Por estado -->
        <div class="chart-container" v-if="reportData.estadisticas.porEstado && reportData.estadisticas.porEstado.length > 0">
          <h4>Por Estado</h4>
          <div class="bar-chart">
            <div 
              v-for="item in reportData.estadisticas.porEstado" 
              :key="item.estado"
              class="bar-item"
            >
              <div class="bar-label">{{ item.estado }}</div>
              <div class="bar-container">
                <div 
                  class="bar-fill"
                  :style="{ width: (item.cantidad / reportData.estadisticas.totalTickets * 100) + '%' }"
                ></div>
                <span class="bar-value">{{ item.cantidad }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Ventas por día -->
        <div class="chart-container" v-if="reportData.estadisticas.ventasPorDia && reportData.estadisticas.ventasPorDia.length > 0">
          <h4>Ventas por Día (últimos 7 días)</h4>
          <div class="bar-chart">
            <div 
              v-for="item in reportData.estadisticas.ventasPorDia" 
              :key="item.fecha"
              class="bar-item"
            >
              <div class="bar-label">{{ formatFecha(item.fecha) }}</div>
              <div class="bar-container">
                <div 
                  class="bar-fill empresa-bar"
                  :style="{ width: (item.total / reportData.estadisticas.ventasPorDia[0].total * 100) + '%' }"
                ></div>
                <span class="bar-value">{{ item.cantidad }} (Bs. {{ item.total }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de resultados -->
    <div v-if="reportData.tickets" class="results-section">
      <h3>📋 Resultados ({{ reportData.pagination?.total || 0 }} registros)</h3>
      
      <div class="table-container">
        <table class="results-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Comprador</th>
              <th>Evento</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in reportData.tickets" :key="ticket.id">
              <td>
                <code class="qr-code">{{ ticket.ticketNumber }}</code>
              </td>
              <td>
                <div>
                  <strong>{{ ticket.buyerName || 'N/A' }}</strong>
                  <br>
                  <small>{{ ticket.buyerEmail || ticket.buyerPhone || 'Sin contacto' }}</small>
                </div>
              </td>
              <td>
                {{ ticket.Event?.name || 'Sin evento' }}
              </td>
              <td>
                <strong>Bs. {{ ticket.salePrice || '0' }}</strong>
              </td>
              <td>
                <span class="badge" :class="'badge-' + ticket.status">
                  {{ formatEstado(ticket.status) }}
                </span>
              </td>
              <td>
                {{ formatFecha(ticket.saleDate) }}
              </td>
              <td>
                <button 
                  @click="validarCredencial(ticket.ticketNumber)"
                  class="btn-validate"
                  title="Validar credencial"
                >
                  🔍
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="reportData.pagination && reportData.pagination.pages > 1" class="pagination">
        <button 
          @click="cambiarPagina(reportData.pagination.page - 1)"
          :disabled="reportData.pagination.page <= 1"
          class="btn-page"
        >
          ← Anterior
        </button>
        
        <span class="page-info">
          Página {{ reportData.pagination.page }} de {{ reportData.pagination.pages }}
        </span>
        
        <button 
          @click="cambiarPagina(reportData.pagination.page + 1)"
          :disabled="reportData.pagination.page >= reportData.pagination.pages"
          class="btn-page"
        >
          Siguiente →
        </button>
      </div>
    </div>
    </div>
    <!-- FIN TAB: Reportes de Ventas -->

    <!-- CONTENIDO: Reportes de Accesos (Generador QR) -->
    <div v-show="activeTab === 'accesos'" class="tab-content">
      
      <!-- Filtros de accesos -->
      <div class="filters-section">
        <h3>🔍 Filtros de Accesos</h3>
        <div class="filters-grid">
          <!-- Filtro por fechas -->
          <div class="filter-group">
            <label>📅 Rango de fechas:</label>
            <div class="date-range">
              <input 
                type="date" 
                v-model="accesosFilters.fechaInicio"
                class="form-input"
              >
              <span>hasta</span>
              <input 
                type="date" 
                v-model="accesosFilters.fechaFin"
                class="form-input"
              >
            </div>
          </div>

          <!-- Filtro por empresa -->
          <div class="filter-group">
            <label>🏢 Empresa:</label>
            <select v-model="accesosFilters.empresaId" class="form-select">
              <option value="">Todas las empresas</option>
              <option 
                v-for="empresa in accesosFilterOptions.empresas" 
                :key="empresa.value" 
                :value="empresa.value"
              >
                {{ empresa.label }}
              </option>
            </select>
          </div>

          <!-- Filtro por estado -->
          <div class="filter-group">
            <label>📋 Estado:</label>
            <select v-model="accesosFilters.estado" class="form-select">
              <option value="">Todos los estados</option>
              <option 
                v-for="estado in accesosFilterOptions.estados" 
                :key="estado.value" 
                :value="estado.value"
              >
                {{ estado.label }}
              </option>
            </select>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="filter-actions">
          <button 
            @click="aplicarFiltrosAccesos" 
            class="btn-primary"
            :disabled="cargandoAccesos"
          >
            <span v-if="cargandoAccesos">🔄 Cargando...</span>
            <span v-else>🔍 Aplicar Filtros</span>
          </button>
          
          <button 
            @click="limpiarFiltrosAccesos" 
            class="btn-secondary"
          >
            🗑️ Limpiar
          </button>
        </div>
      </div>

      <!-- Estadísticas de Accesos -->
      <div v-if="accesosData.estadisticas" class="statistics-section">
        <h3>📈 Estadísticas de Accesos</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ accesosData.estadisticas.totalParticipantes }}</div>
            <div class="stat-label">Total Participantes</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-number">{{ accesosData.estadisticas.conAcceso }}</div>
            <div class="stat-label">Con Acceso Registrado</div>
          </div>
          
          <div class="stat-card">
            <div class="stat-number">{{ accesosData.estadisticas.sinAcceso }}</div>
            <div class="stat-label">Sin Acceso</div>
          </div>
        </div>

        <!-- Gráficos de accesos -->
        <div class="charts-section">
          <!-- Por estado -->
          <div class="chart-container" v-if="accesosData.estadisticas.porEstado && accesosData.estadisticas.porEstado.length > 0">
            <h4>Por Estado</h4>
            <div class="bar-chart">
              <div 
                v-for="item in accesosData.estadisticas.porEstado" 
                :key="item.estado"
                class="bar-item"
              >
                <div class="bar-label">{{ item.estado }}</div>
                <div class="bar-container">
                  <div 
                    class="bar-fill"
                    :style="{ width: (item.cantidad / accesosData.estadisticas.totalParticipantes * 100) + '%' }"
                  ></div>
                  <span class="bar-value">{{ item.cantidad }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Por empresa -->
          <div class="chart-container" v-if="accesosData.estadisticas.porEmpresa && accesosData.estadisticas.porEmpresa.length > 0">
            <h4>Top 10 Empresas</h4>
            <div class="bar-chart">
              <div 
                v-for="item in accesosData.estadisticas.porEmpresa" 
                :key="item.empresa"
                class="bar-item"
              >
                <div class="bar-label">{{ item.empresa }}</div>
                <div class="bar-container">
                  <div 
                    class="bar-fill empresa-bar"
                    :style="{ width: (item.cantidad / accesosData.estadisticas.porEmpresa[0].cantidad * 100) + '%' }"
                  ></div>
                  <span class="bar-value">{{ item.cantidad }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Accesos por día -->
          <div class="chart-container" v-if="accesosData.estadisticas.accesosPorDia && accesosData.estadisticas.accesosPorDia.length > 0">
            <h4>Accesos por Día</h4>
            <div class="bar-chart">
              <div 
                v-for="item in accesosData.estadisticas.accesosPorDia" 
                :key="item.fecha"
                class="bar-item"
              >
                <div class="bar-label">{{ formatFecha(item.fecha) }}</div>
                <div class="bar-container">
                  <div 
                    class="bar-fill"
                    :style="{ width: (item.cantidad / accesosData.estadisticas.accesosPorDia[0].cantidad * 100) + '%' }"
                  ></div>
                  <span class="bar-value">{{ item.cantidad }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de participantes -->
      <div v-if="accesosData.participantes" class="results-section">
        <h3>👥 Participantes ({{ accesosData.pagination?.total || 0 }} registros)</h3>
        
        <div class="table-container">
          <table class="results-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>CI</th>
                <th>Empresa</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Último Acceso</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="participante in accesosData.participantes" :key="participante.id">
                <td>
                  <strong>{{ participante.nombre }} {{ participante.apellido }}</strong>
                </td>
                <td>
                  {{ participante.ci || 'N/A' }}
                </td>
                <td>
                  {{ participante.Empresa?.nombre || 'Sin empresa' }}
                </td>
                <td>
                  {{ participante.telefono }}
                </td>
                <td>
                  <span class="badge" :class="'badge-' + participante.estado">
                    {{ participante.estado }}
                  </span>
                </td>
                <td>
                  {{ participante.ultimoAcceso ? formatFecha(participante.ultimoAcceso) : 'Sin acceso' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="accesosData.pagination && accesosData.pagination.pages > 1" class="pagination">
          <button 
            @click="cambiarPaginaAccesos(accesosData.pagination.page - 1)"
            :disabled="accesosData.pagination.page <= 1"
            class="btn-page"
          >
            ← Anterior
          </button>
          
          <span class="page-info">
            Página {{ accesosData.pagination.page }} de {{ accesosData.pagination.pages }}
          </span>
          
          <button 
            @click="cambiarPaginaAccesos(accesosData.pagination.page + 1)"
            :disabled="accesosData.pagination.page >= accesosData.pagination.pages"
            class="btn-page"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
    <!-- FIN TAB: Reportes de Accesos -->

    <!-- Modal de validación de credencial -->
    <div v-if="modalValidacion.show" class="modal-overlay" @click="cerrarModalValidacion">
      <div class="modal-content validation-modal" @click.stop>
        <div class="modal-header">
          <h3>🔍 Validación de Credencial</h3>
          <button @click="cerrarModalValidacion" class="btn-close">×</button>
        </div>
        
        <div class="modal-body">
          <div v-if="modalValidacion.loading" class="loading">
            <div class="spinner"></div>
            <p>Validando credencial...</p>
          </div>
          
          <div v-else-if="modalValidacion.data" class="validation-result">
            <div class="validation-status" :class="{ 'valid': modalValidacion.data.valido, 'invalid': !modalValidacion.data.valido }">
              <div class="status-icon">
                {{ modalValidacion.data.valido ? '✅' : '❌' }}
              </div>
              <div class="status-message">
                {{ modalValidacion.data.mensaje }}
              </div>
            </div>
            
            <div class="ticket-details">
              <h4>Detalles de la Entrada</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Código:</label>
                  <span>{{ modalValidacion.data.ticket.codigo }}</span>
                </div>
                
                <div v-if="modalValidacion.data.ticket.comprador" class="detail-item">
                  <label>Comprador:</label>
                  <span>{{ modalValidacion.data.ticket.comprador.nombre }}</span>
                </div>
                
                <div v-if="modalValidacion.data.ticket.comprador?.email" class="detail-item">
                  <label>Email:</label>
                  <span>{{ modalValidacion.data.ticket.comprador.email }}</span>
                </div>
                
                <div v-if="modalValidacion.data.ticket.comprador?.telefono" class="detail-item">
                  <label>Teléfono:</label>
                  <span>{{ modalValidacion.data.ticket.comprador.telefono }}</span>
                </div>
                
                <div v-if="modalValidacion.data.ticket.comprador?.documento" class="detail-item">
                  <label>Documento:</label>
                  <span>{{ modalValidacion.data.ticket.comprador.documento }}</span>
                </div>
                
                <div class="detail-item">
                  <label>Evento:</label>
                  <span>{{ modalValidacion.data.ticket.evento }}</span>
                </div>
                
                <div v-if="modalValidacion.data.ticket.precio" class="detail-item">
                  <label>Precio:</label>
                  <span>Bs. {{ modalValidacion.data.ticket.precio }}</span>
                </div>
                
                <div class="detail-item">
                  <label>Estado:</label>
                  <span class="badge" :class="'badge-' + modalValidacion.data.ticket.estado">
                    {{ formatEstado(modalValidacion.data.ticket.estado) }}
                  </span>
                </div>
                
                <div class="detail-item">
                  <label>Fecha venta:</label>
                  <span>{{ formatFecha(modalValidacion.data.ticket.fechaVenta) }}</span>
                </div>
                
                <div v-if="modalValidacion.data.ticket.fechaValidacion" class="detail-item">
                  <label>Fecha validación:</label>
                  <span>{{ formatFecha(modalValidacion.data.ticket.fechaValidacion) }}</span>
                </div>
                
                <div class="detail-item">
                  <label>Vendido por:</label>
                  <span>{{ modalValidacion.data.ticket.vendidoPor }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="cerrarModalValidacion" class="btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reportService } from '../services/api.js'

export default {
  name: 'ReportsManager',
  data() {
    return {
      activeTab: 'ventas', // 'ventas' o 'accesos'
      cargando: false,
      filters: {
        fechaInicio: '',
        fechaFin: '',
        estado: '',
        eventId: '',
        page: 1,
        limit: 50
      },
      filterOptions: {
        eventos: [],
        estados: []
      },
      reportData: {
        tickets: [],
        pagination: null,
        estadisticas: null
      },
      // Datos para tab de accesos
      cargandoAccesos: false,
      accesosFilters: {
        fechaInicio: '',
        fechaFin: '',
        empresaId: '',
        estado: '',
        page: 1,
        limit: 50
      },
      accesosFilterOptions: {
        empresas: [],
        estados: []
      },
      accesosData: {
        participantes: [],
        pagination: null,
        estadisticas: null
      },
      modalValidacion: {
        show: false,
        loading: false,
        data: null
      }
    }
  },
  computed: {
    estadoMasComun() {
      if (!this.reportData.estadisticas?.porEstado?.length) return { estado: '', cantidad: 0 };
      return this.reportData.estadisticas.porEstado.reduce((max, current) => 
        current.cantidad > max.cantidad ? current : max
      );
    }
  },
  async mounted() {
    await this.cargarOpcionesFiltros();
    await this.cargarOpcionesFiltrosAccesos();
    this.configurarFechasPorDefecto();
    this.configurarFechasPorDefectoAccesos();
  },
  methods: {
    async cargarOpcionesFiltros() {
      try {
        const response = await reportService.getFilterOptions();
        if (response.success) {
          this.filterOptions = response.data;
        }
      } catch (error) {
        console.error('Error cargando opciones de filtros:', error);
      }
    },

    configurarFechasPorDefecto() {
      // Por defecto: último mes
      const hoy = new Date();
      const haceUnMes = new Date();
      haceUnMes.setMonth(hoy.getMonth() - 1);
      
      this.filters.fechaFin = hoy.toISOString().split('T')[0];
      this.filters.fechaInicio = haceUnMes.toISOString().split('T')[0];
    },

    async aplicarFiltros() {
      this.cargando = true;
      try {
        const response = await reportService.getReportData(this.filters);
        if (response.success) {
          this.reportData = response.data;
        } else {
          alert('Error: ' + response.message);
        }
      } catch (error) {
        console.error('Error aplicando filtros:', error);
        alert('Error al aplicar filtros');
      } finally {
        this.cargando = false;
      }
    },

    limpiarFiltros() {
      this.filters = {
        fechaInicio: '',
        fechaFin: '',
        estado: '',
        eventId: '',
        page: 1,
        limit: 50
      };
      this.reportData = {
        tickets: [],
        pagination: null,
        estadisticas: null
      };
      this.configurarFechasPorDefecto();
    },

    async generarPDF() {
      try {
        const queryParams = new URLSearchParams();
        Object.keys(this.filters).forEach(key => {
          if (this.filters[key] && key !== 'page' && key !== 'limit') {
            queryParams.append(key, this.filters[key]);
          }
        });
        queryParams.append('titulo', 'Reporte de Entradas - ' + new Date().toLocaleDateString());

        const url = `/api/reports/pdf?${queryParams.toString()}`;
        
        // Crear un enlace temporal para descargar
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } catch (error) {
        console.error('Error generando PDF:', error);
        alert('Error al generar el PDF');
      }
    },

    async cambiarPagina(nuevaPagina) {
      this.filters.page = nuevaPagina;
      await this.aplicarFiltros();
    },

    async validarCredencial(codigoQR) {
      this.modalValidacion = {
        show: true,
        loading: true,
        data: null
      };

      try {
        const response = await reportService.validateCredential(codigoQR);
        this.modalValidacion.loading = false;
        
        if (response.success) {
          this.modalValidacion.data = response.data;
        } else {
          this.modalValidacion.data = {
            valido: false,
            mensaje: response.message || 'Error validando credencial'
          };
        }
      } catch (error) {
        console.error('Error validando credencial:', error);
        this.modalValidacion.loading = false;
        this.modalValidacion.data = {
          valido: false,
          mensaje: 'Error de conexión al validar credencial'
        };
      }
    },

    cerrarModalValidacion() {
      this.modalValidacion = {
        show: false,
        loading: false,
        data: null
      };
    },

    formatFecha(fecha) {
      return new Date(fecha).toLocaleString();
    },

    formatEstado(estado) {
      const estados = {
        'sold': 'Vendido',
        'used': 'Usado',
        'cancelled': 'Cancelado',
        'expired': 'Expirado',
        'available': 'Disponible'
      };
      return estados[estado] || estado;
    },

    // ===== MÉTODOS PARA TAB DE ACCESOS =====
    
    async cargarOpcionesFiltrosAccesos() {
      try {
        const response = await reportService.getAccesosFilterOptions();
        if (response.success) {
          this.accesosFilterOptions = response.data;
        }
      } catch (error) {
        console.error('Error cargando opciones de filtros de accesos:', error);
      }
    },

    configurarFechasPorDefectoAccesos() {
      const hoy = new Date();
      const haceUnMes = new Date();
      haceUnMes.setMonth(hoy.getMonth() - 1);
      
      this.accesosFilters.fechaFin = hoy.toISOString().split('T')[0];
      this.accesosFilters.fechaInicio = haceUnMes.toISOString().split('T')[0];
    },

    async aplicarFiltrosAccesos() {
      this.cargandoAccesos = true;
      try {
        const response = await reportService.getAccesosData(this.accesosFilters);
        if (response.success) {
          this.accesosData = response.data;
        } else {
          alert('Error: ' + response.message);
        }
      } catch (error) {
        console.error('Error aplicando filtros de accesos:', error);
        alert('Error al aplicar filtros');
      } finally {
        this.cargandoAccesos = false;
      }
    },

    limpiarFiltrosAccesos() {
      this.accesosFilters = {
        fechaInicio: '',
        fechaFin: '',
        empresaId: '',
        estado: '',
        page: 1,
        limit: 50
      };
      this.accesosData = {
        participantes: [],
        pagination: null,
        estadisticas: null
      };
      this.configurarFechasPorDefectoAccesos();
    },

    async cambiarPaginaAccesos(nuevaPagina) {
      if (nuevaPagina >= 1 && nuevaPagina <= this.accesosData.pagination.pages) {
        this.accesosFilters.page = nuevaPagina;
        await this.aplicarFiltrosAccesos();
      }
    }
  }
}
</script>

<style scoped>
.reports-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
}

/* Tabs */
.tabs-container {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 2px solid #e1e8ed;
  padding-bottom: 0;
}

.tab-button {
  padding: 12px 25px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #7f8c8d;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.tab-button.active {
  color: #3498db;
  border-bottom-color: #3498db;
  background: rgba(52, 152, 219, 0.1);
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Filtros */
.filters-section {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.filters-section h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 25px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #34495e;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-range span {
  color: #7f8c8d;
  font-size: 14px;
}

.form-input, .form-select {
  padding: 10px;
  border: 2px solid #e1e8ed;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #3498db;
}

.filter-actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

/* Botones */
.btn-primary, .btn-secondary, .btn-success, .btn-validate, .btn-page, .btn-close {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-success {
  background: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #229954;
}

.btn-validate {
  background: #f39c12;
  color: white;
  padding: 8px 12px;
  font-size: 12px;
}

.btn-validate:hover {
  background: #e67e22;
}

.btn-primary:disabled, .btn-success:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

/* Estadísticas */
.statistics-section {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.statistics-section h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
}

.stat-number {
  font-size: 2.5em;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

/* Gráficos */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.chart-container {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.chart-container h4 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 15px;
}

.bar-label {
  min-width: 100px;
  font-size: 12px;
  font-weight: 600;
  color: #34495e;
}

.bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: #e9ecef;
  border-radius: 4px;
  height: 24px;
  position: relative;
}

.bar-fill {
  background: #3498db;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.empresa-bar {
  background: #27ae60;
}

.bar-value {
  position: absolute;
  right: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #2c3e50;
}

/* Tabla de resultados */
.results-section {
  background: white;
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.results-section h3 {
  margin-bottom: 20px;
  color: #2c3e50;
}

.table-container {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.results-table th,
.results-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e1e8ed;
}

.results-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.results-table tr:hover {
  background: #f8f9fa;
}

.qr-code {
  background: #f1f2f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.badge-sold { background: #d4edda; color: #155724; }
.badge-used { background: #fff3cd; color: #856404; }
.badge-cancelled { background: #f8d7da; color: #721c24; }
.badge-expired { background: #e2e3e5; color: #495057; }
.badge-available { background: #cce5ff; color: #0066cc; }

.text-muted {
  color: #6c757d;
  font-style: italic;
}

/* Paginación */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.btn-page {
  background: #6c757d;
  color: white;
  padding: 8px 15px;
}

.btn-page:hover:not(:disabled) {
  background: #5a6268;
}

.btn-page:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.page-info {
  font-weight: 600;
  color: #495057;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e1e8ed;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #e1e8ed;
  display: flex;
  justify-content: flex-end;
}

/* Validación modal */
.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.validation-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  border-radius: 8px;
  font-weight: 600;
}

.validation-status.valid {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.validation-status.invalid {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-icon {
  font-size: 24px;
}

.status-message {
  font-size: 16px;
}

.ticket-details h4 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-item label {
  font-weight: 600;
  color: #34495e;
  font-size: 14px;
}

.detail-item span {
  color: #2c3e50;
}

/* Responsive */
@media (max-width: 768px) {
  .reports-manager {
    padding: 10px;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-actions {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .results-table {
    font-size: 12px;
  }
  
  .results-table th,
  .results-table td {
    padding: 8px 4px;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>