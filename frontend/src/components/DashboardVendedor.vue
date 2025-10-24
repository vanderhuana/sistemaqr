<template>
  <div class="dashboard-vendedor">
    
    <!-- Botón hamburguesa para móvil -->
    <button 
      class="mobile-menu-btn" 
      @click="toggleSidebar"
      aria-label="Abrir menú"
    >
      <span v-if="!sidebarOpen">☰</span>
      <span v-else>✕</span>
    </button>
    
    <!-- Overlay para cerrar sidebar en móvil -->
    <div 
      class="sidebar-overlay" 
      :class="{ active: sidebarOpen }"
      @click="closeSidebar"
    ></div>
    
    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <!-- Header del sidebar -->
      <div class="sidebar-header">
        <h2>FEIPOBOL</h2>
        <p>PUNTO DE VENTA</p>
      </div>
      
      <!-- Información del usuario -->
      <div class="user-info">
        <div class="user-avatar">
          {{ (usuario.firstName || usuario.nombre || usuario.username || 'V')[0].toUpperCase() }}
        </div>
        <div class="user-details">
          <h3>{{ usuario.firstName || usuario.nombre || usuario.username || 'Vendedor' }} {{ usuario.lastName || usuario.apellido || '' }}</h3>
          <p class="user-role">VENDEDOR</p>
          <p class="user-email">{{ usuario.email || 'vendedor@feipobol.bo' }}</p>
        </div>
      </div>

      <!-- Menú de navegación -->
      <nav class="sidebar-nav">
        <button 
          @click="cambiarSeccion('vender')" 
          :class="{ active: seccionActiva === 'vender' }"
          class="nav-item"
        >
          🎫 VENDER ENTRADAS
        </button>
        <button 
          @click="cambiarSeccion('generar-qr')" 
          :class="{ active: seccionActiva === 'generar-qr' }"
          class="nav-item nav-item-qr"
        >
          🎫 GENERAR QRs
        </button>
        <button 
          @click="cambiarSeccion('mis-ventas')" 
          :class="{ active: seccionActiva === 'mis-ventas' }"
          class="nav-item"
        >
          📊 MIS VENTAS
        </button>
        <button 
          @click="cambiarSeccion('trabajadores')" 
          :class="{ active: seccionActiva === 'trabajadores' }"
          class="nav-item"
        >
          👷 TRABAJADORES
        </button>
        <button 
          @click="cambiarSeccion('participantes')" 
          :class="{ active: seccionActiva === 'participantes' }"
          class="nav-item"
        >
          👥 PARTICIPANTES
        </button>
      </nav>

      <!-- Botón salir -->
      <button @click="$emit('cerrar-sesion')" class="btn-salir">
        SALIR
      </button>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="main-content">
      
      <!-- SECCIÓN: VENDER ENTRADAS -->
      <section v-if="seccionActiva === 'vender'" class="seccion-vender">
        <div class="contenido-card-venta">
          
          <!-- Paso 1: Selección de Evento y Venta Rápida -->
          <div v-if="pasoVenta === 1" class="paso-venta">
            <div class="paso-header">
              <h3>🚀 Venta Rápida de Entradas</h3>
              <p>Selecciona evento y cantidad - ¡Se genera inmediatamente!</p>
            </div>
            
            <div v-if="cargandoEventos" class="loading-container">
              <div class="spinner"></div>
              <p>Cargando eventos disponibles...</p>
            </div>
            
            <div v-else class="eventos-venta-grid">
              <div v-if="eventosVenta.length === 0" class="no-eventos-venta">
                <h4>😔 No hay eventos disponibles para venta</h4>
                <p>No se encontraron eventos activos o próximos a iniciarse.</p>
              </div>
              
              <div v-for="evento in eventosVenta" :key="evento.id" 
                   @click="seleccionarEvento(evento)"
                   class="evento-venta-card" 
                   :class="{ 'seleccionado': eventoSeleccionado?.id === evento.id }">
                <div class="evento-venta-info">
                  <h4>{{ evento.name }}</h4>
                  <p>📍 {{ evento.location }}</p>
                  <p>📅 {{ formatearFechaEvento(evento.startDate) }}</p>
                  <p>👥 Disponibles: {{ evento.maxCapacity - (evento.currentSold || 0) }} / {{ evento.maxCapacity }}</p>
                  
                  <div class="precio-actual">
                    <span class="precio-label">Precio actual:</span>
                    <span class="precio-valor">Bs. {{ calcularPrecioActual(evento) }}</span>
                  </div>
                </div>
                
                <div class="evento-venta-accion">
                  <button class="btn-seleccionar">

          /* Additional responsive refinements */
          @media (max-width: 1024px) {
            .eventos-venta-grid {
              grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            }

            .panel-venta-rapida {
              padding: 18px;
            }

            .total-valor {
              font-size: 1.6rem;
            }
          }

          @media (max-width: 768px) {
            .evento-venta-card {
              padding: 16px;
            }

            .ticket-qr-section {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }

            .qr-image-grande {
              width: 160px;
              height: 160px;
            }

            .evento-venta-info h4 {
              font-size: 1.05rem;
            }
          }

          @media (max-width: 480px) {
            .qr-image-grande {
              width: 120px;
              height: 120px;
            }

            .btn-seleccionar, .btn-venta-directa, .btn-imprimir-rapido, .btn-descargar-rapido {
              font-size: 0.95rem;
              padding: 10px;
            }

            .panel-venta-rapida {
              padding: 14px;
            }

            .eventos-venta-grid {
              grid-template-columns: 1fr;
            }
          }
                    {{ eventoSeleccionado?.id === evento.id ? '✓ Seleccionado' : 'Seleccionar' }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Panel de Venta Rápida -->
            <div v-if="eventoSeleccionado" class="panel-venta-rapida">
              <div class="evento-seleccionado-info">
                <h4>📋 Evento Seleccionado: {{ eventoSeleccionado.name }}</h4>
                <p><strong>Precio por entrada:</strong> Bs. {{ calcularPrecioActual(eventoSeleccionado) }}</p>
              </div>
              
              <div class="venta-rapida-controles">
                <div class="cantidad-selector">
                  <label for="cantidad-rapida">Cantidad de entradas:</label>
                  <select id="cantidad-rapida" v-model="datosVenta.quantity" @change="actualizarPrecioTotal">
                    <option v-for="n in Math.min(10, eventoSeleccionado.maxCapacity - (eventoSeleccionado.currentSold || 0))" 
                            :key="n" :value="n">
                      {{ n }} {{ n === 1 ? 'entrada' : 'entradas' }}
                    </option>
                  </select>
                </div>
                
                <div class="total-precio">
                  <span class="total-label">TOTAL A PAGAR:</span>
                  <span class="total-valor">Bs. {{ precioTotal }}</span>
                </div>
                
                <button @click="ventaRapidaDirecta()" class="btn-venta-directa" :disabled="procesandoVenta">
                  {{ procesandoVenta ? '⏳ Generando Entrada...' : '🚀 GENERAR ENTRADA AHORA' }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Paso 2: Entrada Generada -->
          <div v-if="pasoVenta === 2" class="paso-venta">
            <div class="paso-header exito">
              <h3>✅ ¡Entrada Generada Exitosamente!</h3>
              <p>La entrada ha sido creada inmediatamente</p>
            </div>
            
            <div class="venta-resumen">
              <h4>📋 Resumen de la Venta</h4>
              <div class="resumen-info">
                <p><strong>Evento:</strong> {{ eventoSeleccionado?.name }}</p>
                <p><strong>Cantidad:</strong> {{ datosVenta.quantity }} {{ datosVenta.quantity === 1 ? 'entrada' : 'entradas' }}</p>
                <p><strong>Precio unitario:</strong> Bs. {{ calcularPrecioActual(eventoSeleccionado) }}</p>
                <p><strong>TOTAL PAGADO:</strong> <span class="total-destacado">Bs. {{ precioTotal }}</span></p>
                <p><strong>Fecha:</strong> {{ new Date().toLocaleString() }}</p>
              </div>
            </div>
            
            <div class="tickets-generados">
              <div v-for="ticket in ticketsGenerados" :key="ticket.id" class="ticket-card-rapido">
                <div class="ticket-header">
                  <h4>🎫 ENTRADA #{{ ticket.ticketNumber }}</h4>
                  <span class="ticket-precio">Bs. {{ ticket.salePrice }}</span>
                </div>
                
                <div class="ticket-qr-section">
                  <img :src="ticket.qrDataUrl" alt="QR Code" class="qr-image-grande" />
                  <div class="qr-info">
                    <p class="qr-code-text">{{ ticket.qrCode }}</p>
                    <p class="qr-instruccion">Mostrar este código al ingresar al evento</p>
                  </div>
                </div>
                
                <div class="ticket-acciones-rapidas">
                  <button @click="imprimirTicket(ticket)" class="btn-imprimir-rapido">
                    🖨️ IMPRIMIR
                  </button>
                  <button @click="descargarQR(ticket)" class="btn-descargar-rapido">
                    💾 DESCARGAR
                  </button>
                </div>
              </div>
            </div>
            
            <div class="acciones-finales">
              <button @click="nuevaVenta()" class="btn-nueva-venta-rapida">
                🚀 NUEVA VENTA RÁPIDA
              </button>
              <button @click="cambiarSeccion('mis-ventas')" class="btn-ver-ventas">
                📊 VER MIS VENTAS
              </button>
            </div>
          </div>
          
        </div>
      </section>

      <!-- SECCIÓN: GENERADOR DE QR PARA ENTRADAS -->
      <section v-else-if="seccionActiva === 'generar-qr'" class="seccion-generar-qr">
        <GeneradorQREntradas />
      </section>

      <!-- SECCIÓN: MIS VENTAS -->
      <section v-if="seccionActiva === 'mis-ventas'" class="seccion-ventas">
        <div class="ventas-header">
          <h2>📋 Historial de Mis Ventas</h2>
          <div class="filtros">
            <select v-model="filtroFecha" class="form-select">
              <option value="hoy">Hoy</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="todo">Todo</option>
            </select>
          </div>
        </div>

        <div v-if="cargandoVentas" class="loading">
          <div class="spinner"></div>
          <p>Cargando ventas...</p>
        </div>

        <div v-else-if="ventas.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No hay ventas registradas</h3>
          <p>Las ventas que realices aparecerán aquí</p>
        </div>

        <div v-else class="ventas-list">
          <div v-for="venta in ventasFiltradas" :key="venta.id" class="venta-card">
            <div class="venta-header">
              <span class="ticket-number">🎫 {{ venta.ticketNumber }}</span>
              <span class="venta-fecha">{{ formatDateTime(venta.saleDate) }}</span>
            </div>
            <div class="venta-body">
              <div class="venta-info">
                <p><strong>Comprador:</strong> {{ venta.buyerName }}</p>
                <p v-if="venta.buyerEmail"><strong>Email:</strong> {{ venta.buyerEmail }}</p>
                <p v-if="venta.buyerPhone"><strong>Teléfono:</strong> {{ venta.buyerPhone }}</p>
              </div>
              <div class="venta-price">
                <span class="price-label">Precio</span>
                <span class="price-value">Bs {{ venta.salePrice }}</span>
              </div>
            </div>
            <div class="venta-footer">
              <span class="payment-method">{{ formatPaymentMethod(venta.paymentMethod) }}</span>
              <span :class="['status-badge', venta.status]">
                {{ formatStatus(venta.status) }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- SECCIÓN: TRABAJADORES -->
      <section v-else-if="seccionActiva === 'trabajadores'" class="seccion-lista">
        <TrabajadoresList />
      </section>

      <!-- SECCIÓN: PARTICIPANTES -->
      <section v-else-if="seccionActiva === 'participantes'" class="seccion-lista">
        <ParticipantesList />
      </section>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ticketService, eventService } from '@/services/api'
import TrabajadoresList from './TrabajadoresList.vue'
import ParticipantesList from './ParticipantesList.vue'
import GeneradorQREntradas from './GeneradorQREntradas.vue'

// Props y Emits
defineEmits(['cerrar-sesion'])
const props = defineProps({ usuario: Object })

// Variables
const usuario = ref(props.usuario || {})
const seccionActiva = ref('vender')
const sidebarOpen = ref(false)
const cargandoVentas = ref(false)
const cargandoEventos = ref(false)
const procesandoVenta = ref(false)
const ventas = ref([])
const filtroFecha = ref('hoy')

// Variables de venta
const pasoVenta = ref(1)
const eventosVenta = ref([])
const eventoSeleccionado = ref(null)
const ticketsGenerados = ref([])
const datosVenta = ref({
  quantity: 1,
  buyerName: '',
  buyerEmail: '',
  buyerPhone: '',
  buyerDocument: '',
  paymentMethod: 'cash',
  paymentReference: '',
  notes: ''
})

const estadisticas = ref({
  ventasHoy: 0,
  totalHoy: 0
})

// Computeds
const tituloSeccion = computed(() => {
  const titulos = {
    'vender': '🎫 Vender Entradas',
    'mis-ventas': '📋 Mis Ventas',
    'trabajadores': '👷 Trabajadores',
    'participantes': '👥 Participantes'
  }
  return titulos[seccionActiva.value] || 'Dashboard'
})

const ventasFiltradas = computed(() => {
  const ahora = new Date()
  let fechaInicio

  switch (filtroFecha.value) {
    case 'hoy':
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
      break
    case 'semana':
      fechaInicio = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'mes':
      fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      break
    default:
      return ventas.value
  }

  return ventas.value.filter(venta => new Date(venta.saleDate) >= fechaInicio)
})

const precioTotal = computed(() => {
  if (!eventoSeleccionado.value) return 0
  const precioUnitario = calcularPrecioActual(eventoSeleccionado.value)
  return (precioUnitario * datosVenta.value.quantity).toFixed(2)
})

// Funciones responsive
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const cambiarSeccion = (seccion) => {
  seccionActiva.value = seccion
  if (window.innerWidth <= 768) {
    closeSidebar()
  }
  if (seccion === 'mis-ventas') {
    cargarVentas()
  }
  if (seccion === 'vender') {
    cargarEventosVenta()
  }
}

// Funciones de venta
const cargarEventosVenta = async () => {
  try {
    cargandoEventos.value = true
    const response = await eventService.getAll()
    
    // Filtrar solo eventos activos o próximos
    const ahora = new Date()
    eventosVenta.value = response.events.filter(evento => {
      const fechaInicio = new Date(evento.startDate)
      return fechaInicio >= ahora || evento.status === 'active'
    })
    
    console.log('Eventos cargados para venta:', eventosVenta.value)
  } catch (error) {
    console.error('Error cargando eventos:', error)
  } finally {
    cargandoEventos.value = false
  }
}

const seleccionarEvento = (evento) => {
  eventoSeleccionado.value = evento
  datosVenta.value.quantity = 1
  actualizarPrecioTotal()
}

const calcularPrecioActual = (evento) => {
  if (!evento) return 0
  
  // Si tiene rangos de precios, calcular según la hora actual
  if (evento.priceRanges && evento.priceRanges.length > 0) {
    const ahora = new Date()
    const horaActual = ahora.getHours()
    const minutosActuales = ahora.getMinutes()
    const tiempoActual = horaActual * 60 + minutosActuales
    
    // Buscar el rango de precio aplicable
    for (const rango of evento.priceRanges) {
      const [horaInicio, minInicio] = rango.startTime.split(':').map(Number)
      const [horaFin, minFin] = rango.endTime.split(':').map(Number)
      const inicioMinutos = horaInicio * 60 + minInicio
      const finMinutos = horaFin * 60 + minFin
      
      if (tiempoActual >= inicioMinutos && tiempoActual < finMinutos) {
        return parseFloat(rango.price)
      }
    }
  }
  
  // Si no tiene rangos o no aplica ninguno, usar el precio base
  return parseFloat(evento.ticketPrice || 0)
}

const actualizarPrecioTotal = () => {
  // Esto fuerza la actualización del computed precioTotal
  datosVenta.value = { ...datosVenta.value }
}

const ventaRapidaDirecta = async () => {
  if (!eventoSeleccionado.value) {
    alert('Selecciona un evento primero')
    return
  }

  procesandoVenta.value = true
  
  try {
    console.log('🚀 Iniciando venta rápida directa...')
    
    const datosVentaRapida = {
      eventId: eventoSeleccionado.value.id,
      quantity: datosVenta.value.quantity,
      buyerName: 'Cliente Venta Rápida',
      buyerDocument: `VR${Date.now().toString().slice(-8)}`,
      paymentMethod: 'cash',
      notes: `Venta realizada por: ${usuario.value.firstName || usuario.value.nombre || 'Vendedor'}`
    }
    
    const response = await ticketService.sellTicket(datosVentaRapida)
    
    if (response.success) {
      console.log('✅ Venta rápida exitosa:', response)
      
      const ticket = response.data.ticket
      if (!ticket) {
        throw new Error('No se recibió ticket del backend')
      }
      
      // Generar QR
      try {
        ticket.qrDataUrl = await generarQRDataUrl(ticket.qrCode)
        ticket.salePrice = ticket.totalPrice
      } catch (error) {
        console.error('Error generando QR:', error)
        ticket.qrDataUrl = null
      }
      
      ticketsGenerados.value = [ticket]
      pasoVenta.value = 2
      
      // Actualizar estadísticas localmente
      estadisticas.value.ventasHoy++
      estadisticas.value.totalHoy = (parseFloat(estadisticas.value.totalHoy) + parseFloat(ticket.totalPrice)).toFixed(2)
      
      // Actualizar contador
      eventoSeleccionado.value.currentSold = (eventoSeleccionado.value.currentSold || 0) + datosVenta.value.quantity
      
    } else {
      console.error('❌ Error en la venta:', response.error)
      alert(`Error en la venta: ${response.error}`)
    }
    
  } catch (error) {
    console.error('❌ Error procesando venta:', error)
    alert('Error procesando la venta. Intenta nuevamente.')
  } finally {
    procesandoVenta.value = false
  }
}

const generarQRDataUrl = async (qrText) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`
}

const nuevaVenta = () => {
  pasoVenta.value = 1
  eventoSeleccionado.value = null
  ticketsGenerados.value = []
  datosVenta.value = {
    quantity: 1,
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    buyerDocument: '',
    paymentMethod: 'cash',
    paymentReference: '',
    notes: ''
  }
  cargarEventosVenta()
}

const imprimirTicket = (ticket) => {
  window.print()
}

const descargarQR = (ticket) => {
  const link = document.createElement('a')
  link.href = ticket.qrDataUrl
  link.download = `QR-${ticket.ticketNumber}.png`
  link.click()
}

const formatearFechaEvento = (fecha) => {
  if (!fecha) return 'N/A'
  const date = new Date(fecha)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Funciones de datos
const cargarVentas = async () => {
  try {
    cargandoVentas.value = true
    const response = await ticketService.getAll()
    
    // Filtrar solo las ventas del vendedor actual
    ventas.value = response.tickets.filter(ticket => 
      ticket.sellerId === usuario.value.id
    )
    
    calcularEstadisticas()
  } catch (error) {
    console.error('Error cargando ventas:', error)
  } finally {
    cargandoVentas.value = false
  }
}

const calcularEstadisticas = () => {
  const ahora = new Date()
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

  const ventasHoy = ventas.value.filter(v => new Date(v.saleDate) >= hoy)

  estadisticas.value = {
    ventasHoy: ventasHoy.length,
    totalHoy: ventasHoy.reduce((sum, v) => sum + parseFloat(v.salePrice), 0).toFixed(2)
  }
}

const onVentaRealizada = () => {
  // Recargar ventas cuando se realiza una nueva venta
  cargarVentas()
}

// Formateadores
const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A'
  const date = new Date(dateTime)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPaymentMethod = (method) => {
  const methods = {
    'cash': '💵 Efectivo',
    'card': '💳 Tarjeta',
    'transfer': '🏦 Transferencia',
    'qr': '📱 QR'
  }
  return methods[method] || method
}

const formatStatus = (status) => {
  const statuses = {
    'active': 'Activa',
    'used': 'Usada',
    'cancelled': 'Cancelada',
    'refunded': 'Reembolsada'
  }
  return statuses[status] || status
}

// Lifecycle
onMounted(async () => {
  const user = localStorage.getItem('sisqr_user') || localStorage.getItem('user')
  if (user) {
    usuario.value = JSON.parse(user)
  }
  console.log('🔐 Dashboard Vendedor montado para:', usuario.value)
  console.log('📋 Datos del usuario:', {
    nombre: usuario.value.nombre || `${usuario.value.firstName} ${usuario.value.lastName}`,
    email: usuario.value.email,
    rol: usuario.value.rol || usuario.value.role
  })
  
  await cargarEventosVenta()
  await cargarVentas()
})
</script>

<style scoped>
.dashboard-vendedor {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
}

/* SIDEBAR */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #6B9080 0%, #5A7A6A 100%);
  color: white;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 3px;
}

.sidebar-header {
  padding: 25px 20px;
  background: rgba(0,0,0,0.15);
  text-align: center;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: 2px;
}

.sidebar-header p {
  margin: 5px 0 0 0;
  font-size: 0.8rem;
  opacity: 0.9;
  font-weight: 600;
  letter-spacing: 1px;
}

.user-info {
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE66D, #F7931E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-details h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  margin: 3px 0 0 0;
  font-size: 0.7rem;
  opacity: 0.9;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #FFE66D;
}

.user-email {
  margin: 3px 0 0 0;
  font-size: 0.65rem;
  opacity: 0.7;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-nav {
  flex: 1;
  padding: 15px 0;
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px)); /* Espacio extra + área segura del dispositivo */
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  width: 100%;
  background: none;
  border: none;
  color: white;
  padding: 14px 20px;
  text-align: left;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.15);
  border-left-color: rgba(255,255,255,0.5);
}

.nav-item.active {
  background: rgba(255,255,255,0.25);
  border-left-color: #FFE66D;
  font-weight: 700;
}

.nav-item-qr {
  background: linear-gradient(135deg, #FFE66D 0%, #FFBA08 100%);
  color: #1A1A1A;
  border-radius: 8px;
  margin: 5px 15px;
  padding: 14px 20px;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(255, 230, 109, 0.3);
  border-left: 4px solid transparent;
}

.nav-item-qr:hover {
  background: linear-gradient(135deg, #FFBA08 0%, #F48C06 100%);
  transform: translateX(5px);
  box-shadow: 0 6px 12px rgba(255, 186, 8, 0.4);
}

.btn-salir {
  margin: 15px 20px;
  margin-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); /* Espacio extra + área segura del dispositivo */
  padding: 12px;
  background: #EF4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.btn-salir:hover {
  background: #DC2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

/* CONTENIDO PRINCIPAL */
.main-content {
  flex: 1;
  background: #f5f5f5;
  min-height: 100vh;
  margin-left: 280px;
  padding: 25px;
}

/* SECCIONES */
section {
  padding: 0;
}

/* VENTAS */
.ventas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.ventas-header h2 {
  margin: 0;
  color: #1F2937;
  font-size: 1.5rem;
}

.filtros {
  display: flex;
  gap: 10px;
}

.form-select {
  padding: 8px 12px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.form-select:focus {
  outline: none;
  border-color: #6B9080;
  box-shadow: 0 0 0 3px rgba(107, 144, 128, 0.1);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #E5E7EB;
  border-top-color: #6B9080;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  color: #6B7280;
  margin: 0 0 10px 0;
  font-size: 1.3rem;
}

.empty-state p {
  color: #9CA3AF;
  margin: 0;
}

.ventas-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.venta-card {
  background: white;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.venta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.venta-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E5E7EB;
}

.ticket-number {
  font-weight: 700;
  color: #6B9080;
  font-size: 0.95rem;
}

.venta-fecha {
  font-size: 0.8rem;
  color: #6B7280;
}

.venta-body {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 12px;
}

.venta-info {
  flex: 1;
}

.venta-info p {
  margin: 5px 0;
  font-size: 0.85rem;
  color: #4B5563;
}

.venta-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.price-label {
  font-size: 0.75rem;
  color: #6B7280;
  text-transform: uppercase;
}

.price-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #10B981;
}

.venta-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #E5E7EB;
}

.payment-method {
  font-size: 0.85rem;
  color: #6B7280;
  font-weight: 500;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.active {
  background: #D1FAE5;
  color: #059669;
}

.status-badge.used {
  background: #E0E7FF;
  color: #4F46E5;
}

.status-badge.cancelled {
  background: #FEE2E2;
  color: #DC2626;
}

/* RESPONSIVE */
.mobile-menu-btn {
  display: none;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    width: 75%;
    max-width: 280px;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    padding-top: 60px;
    padding-left: 15px;
    padding-right: 15px;
  }
  
  .mobile-menu-btn {
    display: flex;
    position: fixed;
    top: 15px;
    left: 15px;
    z-index: 999;
    background: #6B9080;
    color: white;
    border: none;
    border-radius: 8px;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-size: 1.3rem;
  }
  
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
  
  .sidebar-overlay.active {
    display: block;
  }
  
  .ventas-list {
    grid-template-columns: 1fr;
  }
  
  section {
    padding: 0;
  }
}

@media (max-width: 480px) {
  .sidebar-header h2 {
    font-size: 1.4rem;
  }
  
  .venta-body {
    flex-direction: column;
  }
  
  .venta-price {
    align-items: flex-start;
  }
}

/* ESTILOS ADICIONALES PARA VENTA */
.contenido-card-venta {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.paso-venta {
  width: 100%;
}

.paso-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #E5E7EB;
}

.paso-header h3 {
  margin: 0 0 10px 0;
  color: #6B9080;
  font-size: 1.8rem;
  font-weight: 700;
}

.paso-header p {
  margin: 0;
  color: #6B7280;
  font-size: 1rem;
}

.paso-header.exito {
  border-bottom-color: #10B981;
}

.paso-header.exito h3 {
  color: #10B981;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.eventos-venta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.no-eventos-venta {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  background: #F9FAFB;
  border-radius: 12px;
}

.no-eventos-venta h4 {
  margin: 0 0 10px 0;
  color: #6B7280;
  font-size: 1.3rem;
}

.no-eventos-venta p {
  margin: 0 0 20px 0;
  color: #9CA3AF;
}

.evento-venta-card {
  background: white;
  border: 2px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.evento-venta-card:hover {
  border-color: #6B9080;
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(107, 144, 128, 0.2);
}

.evento-venta-card.seleccionado {
  border-color: #6B9080;
  background: #F0F9FF;
  box-shadow: 0 4px 12px rgba(107, 144, 128, 0.3);
}

.evento-venta-info h4 {
  margin: 0 0 15px 0;
  color: #1F2937;
  font-size: 1.2rem;
  font-weight: 700;
}

.evento-venta-info p {
  margin: 8px 0;
  color: #4B5563;
  font-size: 0.95rem;
}

.precio-actual {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.precio-label {
  font-size: 0.9rem;
  color: #6B7280;
  font-weight: 500;
}

.precio-valor {
  font-size: 1.5rem;
  color: #6B9080;
  font-weight: 700;
}

.evento-venta-accion {
  margin-top: 15px;
}

.btn-seleccionar {
  width: 100%;
  padding: 12px;
  background: #6B9080;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-seleccionar:hover {
  background: #5A7A6A;
  transform: translateY(-2px);
}

.panel-venta-rapida {
  background: linear-gradient(135deg, #F0F9FF, #E0F2FE);
  border: 2px solid #6B9080;
  border-radius: 12px;
  padding: 25px;
  margin-top: 30px;
}

.evento-seleccionado-info {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(107, 144, 128, 0.3);
}

.evento-seleccionado-info h4 {
  margin: 0 0 10px 0;
  color: #1F2937;
  font-size: 1.2rem;
}

.evento-seleccionado-info p {
  margin: 5px 0;
  color: #4B5563;
}

.venta-rapida-controles {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cantidad-selector label {
  display: block;
  margin-bottom: 8px;
  color: #4B5563;
  font-weight: 600;
}

.cantidad-selector select {
  width: 100%;
  padding: 12px;
  border: 2px solid #D1D5DB;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
}

.cantidad-selector select:focus {
  outline: none;
  border-color: #6B9080;
}

.total-precio {
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.total-label {
  font-size: 1.1rem;
  color: #6B7280;
  font-weight: 600;
}

.total-valor {
  font-size: 2rem;
  color: #6B9080;
  font-weight: 700;
}

.btn-venta-directa {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #6B9080, #5A7A6A);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-venta-directa:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(107, 144, 128, 0.4);
}

.btn-venta-directa:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.venta-resumen {
  background: #F9FAFB;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
}

.venta-resumen h4 {
  margin: 0 0 20px 0;
  color: #1F2937;
  font-size: 1.3rem;
}

.resumen-info p {
  margin: 10px 0;
  color: #4B5563;
  font-size: 1rem;
}

.total-destacado {
  color: #6B9080;
  font-weight: 700;
  font-size: 1.3rem;
}

.tickets-generados {
  display: grid;
  gap: 25px;
  margin-bottom: 30px;
}

.ticket-card-rapido {
  background: white;
  border: 2px solid #6B9080;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #E5E7EB;
}

.ticket-header h4 {
  margin: 0;
  color: #1F2937;
  font-size: 1.3rem;
}

.ticket-precio {
  font-size: 1.5rem;
  color: #6B9080;
  font-weight: 700;
}

.ticket-qr-section {
  display: flex;
  gap: 25px;
  align-items: center;
  margin-bottom: 20px;
}

.qr-image-grande {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.qr-info {
  flex: 1;
}

.qr-code-text {
  font-family: monospace;
  font-size: 1.1rem;
  color: #1F2937;
  font-weight: 700;
  margin: 0 0 10px 0;
  word-break: break-all;
}

.qr-instruccion {
  margin: 0;
  color: #6B7280;
  font-size: 0.95rem;
}

.ticket-acciones-rapidas {
  display: flex;
  gap: 15px;
}

.btn-imprimir-rapido,
.btn-descargar-rapido {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-imprimir-rapido {
  background: #6B9080;
  color: white;
}

.btn-imprimir-rapido:hover {
  background: #5A7A6A;
  transform: translateY(-2px);
}

.btn-descargar-rapido {
  background: #E5E7EB;
  color: #4B5563;
}

.btn-descargar-rapido:hover {
  background: #D1D5DB;
  transform: translateY(-2px);
}

.acciones-finales {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-nueva-venta-rapida,
.btn-ver-ventas {
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-nueva-venta-rapida {
  background: linear-gradient(135deg, #6B9080, #5A7A6A);
  color: white;
}

.btn-nueva-venta-rapida:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(107, 144, 128, 0.4);
}

.btn-ver-ventas {
  background: #E5E7EB;
  color: #4B5563;
}

.btn-ver-ventas:hover {
  background: #D1D5DB;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .eventos-venta-grid {
    grid-template-columns: 1fr;
  }
  
  .ticket-qr-section {
    flex-direction: column;
  }
  
  .ticket-acciones-rapidas {
    flex-direction: column;
  }
  
  .acciones-finales {
    flex-direction: column;
  }
}

</style>
