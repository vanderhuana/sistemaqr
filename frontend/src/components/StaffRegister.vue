<template>
  <div class="staff-register">
    <h2>Registro de Staff / Personal</h2>
    <form @submit.prevent="registrarStaff" class="form-staff">
      <div class="form-group">
        <label>Nombre completo</label>
        <input v-model="form.nombre" required />
      </div>
      <div class="form-group">
        <label>Documento</label>
        <input v-model="form.documento" required />
      </div>
      <div class="form-group">
        <label>Cargo</label>
        <input v-model="form.cargo" required />
      </div>
      <div class="form-group">
        <label>Foto</label>
        <input type="file" @change="onFileChange" accept="image/*" />
        <img v-if="previewFoto" :src="previewFoto" class="preview-foto" />
      </div>
      <button type="submit" class="btn-guardar">Registrar</button>
    </form>
    <div v-if="staffCreado" class="credencial-staff">
      <h3>Credencial generada</h3>
      <div class="credencial-card">
        <img v-if="staffCreado.fotoUrl" :src="staffCreado.fotoUrl" class="credencial-foto" />
        <div class="credencial-datos">
          <p><strong>Nombre:</strong> {{ staffCreado.nombre }}</p>
          <p><strong>Documento:</strong> {{ staffCreado.documento }}</p>
          <p><strong>Cargo:</strong> {{ staffCreado.cargo }}</p>
        </div>
        <div class="credencial-qr">
          <img :src="qrUrl" alt="QR Staff" />
        </div>
      </div>
      <button @click="imprimirCredencial" class="btn-imprimir">Imprimir credencial</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { staffService } from '../services/api'

const form = ref({ nombre: '', documento: '', cargo: '', foto: null })
const previewFoto = ref(null)
const staffCreado = ref(null)
const qrUrl = ref('')

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    form.value.foto = file
    const reader = new FileReader()
    reader.onload = (ev) => {
      previewFoto.value = ev.target.result
    }
    reader.readAsDataURL(file)
  }
}

async function registrarStaff() {
  let fotoUrl = ''
  if (form.value.foto) {
    // Simulación: subir foto a algún endpoint o usar base64
    fotoUrl = previewFoto.value
  }
  const payload = {
    nombre: form.value.nombre,
    documento: form.value.documento,
    cargo: form.value.cargo,
    fotoUrl
  }
  const res = await staffService.createStaff(payload)
  if (res.success) {
    staffCreado.value = res.staff
    qrUrl.value = `/api/qr/generate?data=${encodeURIComponent(res.staff.qrCode)}`
  } else {
    alert('Error al registrar staff: ' + res.error)
  }
}

function imprimirCredencial() {
  window.print()
}
</script>

<style scoped>
.staff-register {
  max-width: 480px;
  margin: 0 auto;
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
}
.form-group {
  margin-bottom: 1rem;
}
.preview-foto {
  max-width: 120px;
  margin-top: 8px;
  border-radius: 8px;
}
.btn-guardar, .btn-imprimir {
  background: #6B9080;
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 12px;
}
.credencial-staff {
  margin-top: 2rem;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
}
.credencial-card {
  display: flex;
  align-items: center;
  gap: 18px;
  background: #e6f2ed;
  padding: 1rem;
  border-radius: 12px;
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
</style>
