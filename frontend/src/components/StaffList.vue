<template>
  <div class="staff-list">
    <h2>Personal registrado</h2>
    <div v-if="staff.length === 0">No hay staff registrado.</div>
    <div class="staff-grid">
      <div v-for="item in staff" :key="item.id" class="credencial-card">
        <img v-if="item.fotoUrl" :src="item.fotoUrl" class="credencial-foto" />
        <div class="credencial-datos">
          <p><strong>Nombre:</strong> {{ item.nombre }}</p>
          <p><strong>Documento:</strong> {{ item.documento }}</p>
          <p><strong>Cargo:</strong> {{ item.cargo }}</p>
        </div>
        <div class="credencial-qr">
          <img :src="getQrUrl(item.qrCode)" alt="QR Staff" />
        </div>
        <button @click="imprimir(item.id)" class="btn-imprimir">Imprimir</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { staffService } from '../services/api'

const staff = ref([])

onMounted(async () => {
  const res = await staffService.getAllStaff()
  if (res.success) staff.value = res.staff
})

function getQrUrl(qrCode) {
  return `/api/qr/generate?data=${encodeURIComponent(qrCode)}`
}

function imprimir(id) {
  // Imprimir solo la credencial seleccionada
  // Puede mejorarse con una ventana/área específica
  window.print()
}
</script>

<style scoped>
.staff-list {
  margin-top: 2rem;
}
.staff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 18px;
}
.credencial-card {
  display: flex;
  align-items: center;
  gap: 18px;
  background: #e6f2ed;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 12px;
}
.credencial-foto {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #6B9080;
}
.credencial-datos {
  flex: 1;
}
.credencial-qr img {
  width: 80px;
  height: 80px;
}
.btn-imprimir {
  background: #6B9080;
  color: white;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}
</style>
