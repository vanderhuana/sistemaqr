<template>
  <v-app>
    <!-- Header FEIPOBOL -->
    <v-app-bar
      class="feipobol-header"
      height="80"
      elevation="0"
    >
      <div class="feipobol-logo" @click="goToHome" style="cursor: pointer;">
        <div class="logo-triangle">
          <svg width="60" height="60" viewBox="0 0 100 100">
            <polygon points="10,90 50,10 90,90" fill="#FF6B35"/>
            <polygon points="20,90 60,25 85,90" fill="#FF9500"/>
            <circle cx="35" cy="45" r="3" fill="white"/>
            <rect x="32" y="48" width="6" height="12" fill="#FFD700"/>
            <polygon points="55,60 65,50 75,60" fill="#FF4444"/>
          </svg>
        </div>
        
        <div>
          <div class="feipobol-title">FEIPOBOL</div>
          <div class="feipobol-subtitle">SISTEMA DE CONTROL DE ACCESO</div>
        </div>
      </div>

      <v-btn
        variant="outlined"
        color="white"
        @click="goToHome"
        class="btn-volver"
      >
        <v-icon class="icon-only-mobile">mdi-arrow-left</v-icon>
        <span class="text-hide-mobile">VOLVER</span>
      </v-btn>
    </v-app-bar>

    <!-- Contenido principal -->
    <v-main class="main-content">
      <v-container class="fill-height">
        <v-row justify="center" align="center" class="fill-height">
          <v-col cols="12" sm="8" md="6" lg="4">
            
            <!-- Card de Login -->
            <v-card 
              class="feipobol-card fade-in-up"
              elevation="12"
            >
              <v-card-title class="text-center pa-6">
                <div class="w-100">
                  <v-icon 
                    size="64" 
                    color="feipobol-green"
                    class="mb-4"
                  >
                    mdi-account-circle
                  </v-icon>
                  <h2 class="text-h5 font-weight-bold" style="color: var(--feipobol-green)">
                    INICIAR SESIÓN
                  </h2>
                  <p class="text-body-2 mt-2" style="color: #666">
                    Acceso solo para personal autorizado
                  </p>
                </div>
              </v-card-title>

              <v-card-text class="px-6 pb-6">
                <v-form @submit.prevent="handleLogin" class="form-container">
                  
                  <!-- Campo Usuario/Email -->
                  <div class="form-field">
                    <v-text-field
                      v-model="credentials.login"
                      label="Usuario o Email"
                      prepend-inner-icon="mdi-account"
                      variant="outlined"
                      :error-messages="errors.login"
                      @input="clearError('login')"
                      required
                    />
                  </div>

                  <!-- Campo Contraseña -->
                  <div class="form-field">
                    <v-text-field
                      v-model="credentials.password"
                      :type="showPassword ? 'text' : 'password'"
                      label="Contraseña"
                      prepend-inner-icon="mdi-lock"
                      :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                      @click:append-inner="showPassword = !showPassword"
                      variant="outlined"
                      :error-messages="errors.password"
                      @input="clearError('password')"
                      required
                    />
                  </div>

                  <!-- Mensaje de error general -->
                  <v-alert
                    v-if="generalError"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                    closable
                    @click:close="generalError = ''"
                  >
                    {{ generalError }}
                  </v-alert>

                  <!-- Botón de Login centrado -->
                  <div class="login-button-container">
                    <v-btn
                      type="submit"
                      class="btn-ingresar"
                      size="large"
                      :loading="loading"
                      :disabled="!isFormValid"
                    >
                      <v-icon left>mdi-login</v-icon>
                      INGRESAR
                    </v-btn>
                    <p class="text-caption text-center mt-2" style="color: #999">
                      Solo personal autorizado
                    </p>
                  </div>

                </v-form>

              </v-card-text>
            </v-card>

            <!-- Card de información -->
            <v-card 
              class="feipobol-card mt-4"
              style="background: linear-gradient(45deg, #6B9080, #8FA89B);"
              elevation="8"
            >
              <v-card-text class="text-center text-white">
                <v-icon size="32" class="mb-2">mdi-shield-check</v-icon>
                <div class="text-h6 font-weight-bold">Sistema Seguro</div>
                <div class="text-body-2 mt-1">
                  Autenticación JWT • Encriptación SSL • Control de Acceso por Roles
                </div>
              </v-card-text>
            </v-card>

          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Estado reactivo
const loading = ref(false)
const showPassword = ref(false)
const generalError = ref('')

const credentials = ref({
  login: '',
  password: ''
})

const errors = ref({
  login: '',
  password: ''
})

// Computed
const isFormValid = computed(() => {
  return credentials.value.login.length > 0 && 
         credentials.value.password.length > 0
})

// Métodos
const clearError = (field) => {
  errors.value[field] = ''
  generalError.value = ''
}

const validateForm = () => {
  let isValid = true
  
  if (!credentials.value.login) {
    errors.value.login = 'Usuario o email es requerido'
    isValid = false
  }
  
  if (!credentials.value.password) {
    errors.value.password = 'Contraseña es requerida'
    isValid = false
  }
  
  return isValid
}



const handleLogin = async () => {
  if (!validateForm()) return
  
  loading.value = true
  generalError.value = ''
  
  try {
    const loginResponse = await authStore.login(credentials.value)
    console.log('🔐 Respuesta de login:', loginResponse)
    
    // Redireccionar según el rol
    const user = authStore.user
    console.log('👤 Usuario logueado:', user)
    console.log('🎭 Rol del usuario:', user?.role)
    
    if (user?.role === 'admin') {
      console.log('➡️ Redirigiendo a /dashboard')
      await router.push('/dashboard')
    } else if (user?.role === 'vendedor') {
      console.log('➡️ Redirigiendo a /vendedor')
      await router.push('/vendedor')
    } else if (user?.role === 'control') {
      console.log('➡️ Redirigiendo a /control')
      await router.push('/control')
    } else {
      console.log('➡️ Rol desconocido, redirigiendo a /')
      await router.push('/')
    }
    
  } catch (error) {
    console.error('Error en login:', error)
    
    if (error.response?.status === 401) {
      generalError.value = 'Credenciales incorrectas. Verifica tu usuario y contraseña.'
    } else if (error.response?.status === 403) {
      generalError.value = 'Acceso denegado. Tu cuenta no tiene permisos suficientes.'
    } else {
      generalError.value = 'Error de conexión. Verifica que el servidor esté funcionando.'
    }
  } finally {
    loading.value = false
  }
}

const goToHome = () => {
  router.push('/')
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.w-100 {
  width: 100%;
}

/* Responsive header and card adjustments */
.feipobol-header {
  padding: 0 16px;
}
.feipobol-logo {
  display:flex;
  align-items:center;
  gap:12px;
}
.logo-triangle svg {
  width: 60px;
  height: 60px;
}
.feipobol-title {
  font-weight: 700;
  font-size: 1.2rem;
  line-height: 1;
}
.feipobol-subtitle {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.95);
}

/* Make card spacing more compact on small screens */
.feipobol-card {
  padding: 20px;
}

.feipobol-card .v-card-title {
  padding-top: 8px;
  padding-bottom: 8px;
}

.feipobol-card .v-icon {
  font-size: 56px !important;
}

.form-container .form-field {
  margin-bottom: 12px;
}

.btn-ingresar {
  padding: 12px 16px;
}

/* Botón superior responsive */
.btn-volver {
  min-width: auto !important;
}

.icon-only-mobile {
  margin-right: 0;
}

.text-hide-mobile {
  display: inline;
}

/* Contenedor del botón de login centrado */
.login-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.login-button-container .btn-ingresar {
  min-width: 200px;
}

/* Hover effects para los cards de usuarios */
.v-card.cursor-pointer:hover {
  transform: scale(1.03);
  transition: transform 0.15s ease;
}

/* Mobile-first adjustments */
@media (max-width: 600px) {
  /* Botón superior: solo icono en móvil */
  .btn-volver .text-hide-mobile {
    display: none;
  }
  
  .btn-volver {
    padding: 8px !important;
    min-width: 40px !important;
  }
  
  /* Botón de login más compacto en móvil */
  .login-button-container .btn-ingresar {
    min-width: 160px;
    font-size: 0.95rem;
  }
  
  .feipobol-header {
    height: 64px !important;
  }
  .logo-triangle svg {
    width: 44px;
    height: 44px;
  }
  .feipobol-title {
    font-size: 1rem;
  }
  .feipobol-subtitle {
    display: none;
  }
  .v-col > .feipobol-card {
    margin: 0 8px;
  }
  .feipobol-card {
    padding: 14px;
  }
  .feipobol-card .v-icon {
    font-size: 48px !important;
  }
  .text-h5 {
    font-size: 1.1rem !important;
  }
}

/* Tablet and up */
@media (min-width: 601px) and (max-width: 1024px) {
  .logo-triangle svg {
    width: 52px;
    height: 52px;
  }
  .feipobol-card {
    padding: 18px;
  }
}

</style>