<template>
  <div class="venta-vendedor">
    <div class="paso-header">
      <h2>🚀 Venta Rápida de Entradas</h2>
      <p>Selecciona evento y cantidad - ¡Se genera inmediatamente!</p>
    </div>
    <!-- Lista de eventos -->
    <div class="eventos-venta-grid">
      <div v-for="evento in eventos" :key="evento.id" :class="['evento-venta-card', { seleccionado: eventoSeleccionado === evento.id }]">
        <div class="evento-venta-info">
          <h4>{{ evento.name }}</h4>
          <p><span>📍</span> {{ evento.location || evento.ubicacion || 'Sin ubicación' }}</p>
          <p><span>📅</span> {{ formatDateTime(evento.start_date || evento.startDate || evento.date) }}</p>
          <p><span>👥</span> Disponibles: {{ availableSeats(evento) }} / {{ evento.max_capacity || evento.capacity || '—' }}</p>
        </div>

        <div class="precio-actual">
          <div class="precio-label">Precio actual:</div>
          <div class="precio-valor">Bs. {{ evento.base_price ?? evento.price ?? 0 }}</div>
        </div>

        <button class="btn-seleccionar" @click.prevent="selectEvent(evento)">Seleccionar</button>
      </div>
    </div>

    <!-- Formulario de venta -->
    <form class="form-venta" @submit.prevent="venderTicket">
      <div class="form-group">
        <label for="evento">Evento</label>
        <select v-model="eventoSeleccionado" id="evento">
          <option v-for="evento in eventos" :key="evento.id" :value="evento.id">
            {{ evento.name }}
          </option>
        </select>
      </div>
      <div class="form-group">
        <label for="nombre">Nombre del comprador</label>
        <input v-model="comprador.nombre" id="nombre" required />
      </div>
      <div class="form-group">
        <label for="email">Email</label>
        <input v-model="comprador.email" id="email" type="email" required />
      </div>
      <div class="form-group">
        <label for="telefono">Teléfono</label>
        <input v-model="comprador.telefono" id="telefono" required />
      </div>
      <div class="form-group">
        <label for="documento">Documento</label>
        <input v-model="comprador.documento" id="documento" required />
      </div>
      <div class="form-group">
        <label for="cantidad">Cantidad de entradas</label>
        <input v-model.number="cantidad" id="cantidad" type="number" min="1" required />
      </div>
      <div class="form-actions">
        <button type="submit" class="btn-guardar">Vender Ticket</button>
      </div>
    </form>
    <!-- Resumen de venta -->
    <div v-if="ticketGenerado" class="resumen-ticket paso-venta">
      <h3>Ticket generado</h3>
      <p><strong>QR:</strong> {{ ticketGenerado.qr_code }}</p>
      <p><strong>Comprador:</strong> {{ ticketGenerado.buyer_name }}</p>
      <p><strong>Cantidad:</strong> {{ ticketGenerado.quantity }}</p>
      <p><strong>Evento:</strong> {{ ticketGenerado.event.name }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { eventService, ticketService } from '../services/api'

const eventos = ref([])
const eventoSeleccionado = ref('')
const comprador = ref({ nombre: '', email: '', telefono: '', documento: '' })
const cantidad = ref(1)
const ticketGenerado = ref(null)
const cargando = ref(false)

onMounted(async () => {
  try {
    const res = await eventService.getAllEvents()
    eventos.value = (res && res.success && (Array.isArray(res.data) ? res.data : res.data.events)) || []
    if (eventos.value.length) eventoSeleccionado.value = eventos.value[0].id
  } catch (err) {
    console.error('Error cargando eventos', err)
  }
})

function selectEvent(evento) {
  eventoSeleccionado.value = evento.id
  // si quieres, reiniciar cantidad al mínimo
  cantidad.value = 1
}

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

function availableSeats(evento) {
  // intenta inferir un campo de asientos disponibles, si no está presente devuelve '-'
  return evento.available_seats ?? evento.availableSeats ?? evento.available ?? evento.remaining ?? '—'
}

async function venderTicket() {
  if (!eventoSeleccionado.value) return alert('Seleccione un evento')
  cargando.value = true
  try {
    const data = {
      eventId: eventoSeleccionado.value,
      buyer_name: comprador.value.nombre,
      buyer_email: comprador.value.email,
      buyer_phone: comprador.value.telefono,
      buyer_document: comprador.value.documento,
      quantity: cantidad.value
    }
    const res = await ticketService.sellTicket(data)
    if (res && res.success) {
      ticketGenerado.value = res.data
    } else {
      console.error('Venta fallida', res)
      alert(res?.error || 'Venta fallida')
    }
  } catch (err) {
    console.error('Error al vender ticket', err)
    alert('Ocurrió un error al procesar la venta')
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>
.venta-vendedor {
  max-width: 500px;
  margin: 0 auto;
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
}
.form-group {
  margin-bottom: 1rem;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}
.btn-guardar {
  background: #6B9080;
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-guardar:hover {
  background: #4A7A5C;
  transform: translateY(-2px);
}
.resumen-ticket {
  margin-top: 2rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}

/* Inputs estilo admin */
.form-venta .form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #2c5530;
}

.form-venta .form-group input,
.form-venta .form-group select,
.form-venta .form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-venta .form-group input:focus,
.form-venta .form-group select:focus,
.form-venta .form-group textarea:focus {
  outline: none;
  border-color: #6B9080;
}

/* Estilos de tarjetas similares al admin */
.paso-header {
  text-align: center;
  margin-bottom: 20px;
  padding: 18px 24px;
  background: linear-gradient(135deg, #6B9080, #4A7A5C);
  color: white;
  border-radius: 8px;
}
.paso-header h2 { margin: 0 0 6px 0; font-size: 1.3rem }
.paso-header p { margin: 0; opacity: 0.95 }

.eventos-venta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
  margin: 20px 0 28px 0;
}
.evento-venta-card {
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 18px;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: all 0.2s ease;
}
.evento-venta-card:hover { transform: translateY(-4px); box-shadow: 0 6px 18px rgba(0,0,0,0.06) }
.evento-venta-card.seleccionado { border-color: #6B9080; background: #f0f8f5 }
.evento-venta-info h4 { margin: 0 0 8px 0; color: #2c5530 }
.evento-venta-info p { margin: 4px 0; color: #555 }
.precio-actual { display:flex; justify-content:space-between; align-items:center; padding:10px; background:#6B9080; color:white; border-radius:8px }
.precio-valor { font-weight:700 }
.btn-seleccionar { margin-top: 6px; padding:10px; background:#6B9080; color:white; border:none; border-radius:8px; cursor:pointer }
.btn-seleccionar:hover { background:#4A7A5C }
</style>
