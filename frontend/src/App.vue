<template>
  <div id="app">
    
    <!-- RUTAS PÚBLICAS (sin autenticación requerida) -->
    <router-view v-if="esRutaPublica" />
    
    <!-- VISTA DE LOGIN (PANTALLA PRINCIPAL) -->
    <div v-else-if="!usuarioActual" class="vista-login">
      <!-- HEADER FEIPOBOL EXACTO -->
      <header class="feipobol-header">
        <div class="logo-container">
          <img 
            src="./assets/logo.png" 
            alt="FEIPOBOL Logo" 
            class="logo-feipobol"
          />
          <div class="texto-header">
            <h1>FEIPOBOL</h1>
            <p>2025</p>
          </div>
        </div>
        
        <button class="btn-header-ingresar" @click="mostrarLogin = true">
          <span class="texto-btn-ingresar">INGRESAR</span>
          <span class="icono-btn-ingresar">🔑</span>
        </button>
      </header>

    <!-- CONTENIDO PRINCIPAL FEIPOBOL -->
    <main class="contenido-feipobol">
      
      <!-- LADO IZQUIERDO -->
      <section class="lado-izquierdo">
        <h1 class="titulo-principal">
          SISTEMA DE<br>
          VENTA DE<br>
          ENTRADAS
        </h1>
        
        <div class="boton-central-container">
          <button class="boton-ingresar-central" @click="mostrarLogin = true">
            INGRESAR
          </button>
          <p class="texto-autorizacion">Solo personal autorizado</p>
        </div>
      </section>

      <!-- LADO DERECHO - LOGO ANIMADO FEIPOBOL -->
      <section class="lado-derecho">
        <div class="arte-feipobol">
          <!-- LOGO PRINCIPAL ANIMADO -->
          <div class="logo-principal-container">
            <img 
              src="./assets/logo.png" 
              alt="FEIPOBOL Logo Principal" 
              class="logo-principal-animado"
            />
            
            <!-- EFECTOS DE FONDO ANIMADOS -->
            <div class="efectos-fondo">
              <!-- Círculos flotantes -->
              <div class="circulo-flotante circulo-1"></div>
              <div class="circulo-flotante circulo-2"></div>
              <div class="circulo-flotante circulo-3"></div>
              <div class="circulo-flotante circulo-4"></div>
              
              <!-- Líneas de movimiento -->
              <div class="linea-movimiento linea-1"></div>
              <div class="linea-movimiento linea-2"></div>
              <div class="linea-movimiento linea-3"></div>
            </div>
          </div>
          
          <!-- TEXTO FEIPOBOL 2025 ANIMADO -->
          <div class="texto-2025">
            <h2>FEIPOBOL 2025</h2>
          </div>
        </div>
      </section>

    </main>

    <!-- MODAL DE LOGIN FEIPOBOL -->
    <div v-if="mostrarLogin" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-login">
        <header class="login-header">
          <h3>Iniciar Sesión</h3>
          <button class="btn-cerrar" @click="cerrarModal">×</button>
        </header>
        
        <div class="form-login">
          <div class="campo">
            <input 
              v-model="credenciales.email" 
              type="email" 
              placeholder="Correo electrónico"
            />
          </div>
          
          <div class="campo">
            <input 
              v-model="credenciales.password" 
              type="password" 
              placeholder="Contraseña"
            />
          </div>
          
          <button 
            @click="iniciarSesion" 
            class="btn-iniciar-sesion"
            :disabled="!credenciales.email || !credenciales.password || cargando"
          >
            {{ cargando ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>

          <!-- MENSAJES DE ESTADO -->
          <div v-if="mensaje" :class="['alerta', mensaje.tipo]">
            {{ mensaje.texto }}
          </div>
        </div>
      </div>
    </div>
    
    </div> <!-- Fin vista-login -->

    <!-- VISTA DE DASHBOARD (SEGÚN ROL) -->
    <div v-else class="vista-dashboard">
      <!-- Dashboard Admin -->
      <DashboardAdmin 
        v-if="usuarioActual.rol === 'admin'"
        :usuario="usuarioActual"
        @cerrar-sesion="cerrarSesion"
      />
      <DashboardVendedor 
        v-else-if="usuarioActual.rol === 'vendedor'"
        :usuario="usuarioActual"
        @cerrar-sesion="cerrarSesion"
      />
      <!-- Dashboard Control -->
      <DashboardControl 
        v-else-if="usuarioActual.rol === 'control'"
        :usuario="usuarioActual"
        @cerrar-sesion="cerrarSesion"
      />
    </div> <!-- Fin vista-dashboard -->

    <!-- FOOTER removed per request -->

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authService } from './services/api.js'
import DashboardAdmin from './components/DashboardAdmin.vue'
import DashboardVendedor from './components/DashboardVendedor.vue'
import DashboardControl from './components/DashboardControl.vue'

const route = useRoute()

// Variables reactivas
const mostrarLogin = ref(false)
const credenciales = ref({
  email: '',
  password: ''
})
const cargando = ref(false)
const mensaje = ref(null)
const usuarioActual = ref(null)

// Verificar si la ruta actual es pública
const esRutaPublica = computed(() => {
  const rutasPublicas = ['/registro-trabajador', '/registro-participante']
  return rutasPublicas.includes(route.path)
})

// Verificar si ya hay un usuario logueado al cargar la aplicación
onMounted(() => {
  const user = authService.getCurrentUser()
  if (user) {
    usuarioActual.value = user
    console.log('Usuario ya autenticado:', user)
  }
})

const iniciarSesion = async () => {
  cargando.value = true
  mensaje.value = {
    tipo: 'info',
    texto: 'Conectando con el servidor...'
  }
  
  try {
    // FORZAR LOGIN REAL CON BACKEND - Sin fallback
    console.log('🚀 Conectando SOLO con backend real...')
    console.log('� Email:', credenciales.value.email)
    console.log('🔒 Password:', credenciales.value.password ? '***' : 'vacío')
    
    const resultado = await authService.login(
      credenciales.value.email,
      credenciales.value.password
    )
    
    console.log('📡 Resultado completo del login:', resultado)
    
    if (resultado.success && resultado.user && resultado.token) {
      usuarioActual.value = resultado.user
      mensaje.value = {
        tipo: 'exito',
        texto: `✅ Bienvenido ${resultado.user.nombre}! Login exitoso`
      }
      
      // Redireccionar según el rol después de 2 segundos
      setTimeout(() => {
        cerrarModal()
        redirectToRoleDashboard(resultado.user.rol)
      }, 2000)
      
    } else {
      // Backend respondió pero falló la autenticación
      console.log('❌ Login falló:', resultado)
      mensaje.value = {
        tipo: 'error',
        texto: resultado.message || '❌ Credenciales incorrectas o usuario no existe'
      }
    }
  } catch (error) {
    console.error('❌ Error de conexión con backend:', error)
    
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      mensaje.value = {
        tipo: 'error',
        texto: '❌ No se puede conectar con el servidor. Verifique que esté funcionando.'
      }
    } else {
      mensaje.value = {
        tipo: 'error',
        texto: error.response?.data?.message || '❌ Error interno del servidor'
      }
    }
  }
  
  cargando.value = false
}

// Función de fallback para desarrollo
const simularLoginLocal = (email, password) => {
  const usuariosLocales = {
    'admin@sisqr6.com': { 
      id: 1, 
      nombre: 'Carlos Administrador', 
      email: 'admin@sisqr6.com', 
      rol: 'admin',
      password: 'admin123'
    },
    'vendedor@sisqr6.com': { 
      id: 2, 
      nombre: 'María Vendedora', 
      email: 'vendedor@sisqr6.com', 
      rol: 'vendedor',
      password: 'vendedor123'
    },
    'control@sisqr6.com': { 
      id: 3, 
      nombre: 'José Control', 
      email: 'control@sisqr6.com', 
      rol: 'control',
      password: 'control123'
    }
  }
  
  const usuario = usuariosLocales[email]
  if (usuario && usuario.password === password) {
    // Remover password del objeto retornado
    const { password: _, ...usuarioSinPassword } = usuario
    
    // Guardar token simulado y usuario en localStorage para desarrollo
    const tokenSimulado = `dev-token-${usuario.id}-${Date.now()}`
    localStorage.setItem('token', tokenSimulado)
    localStorage.setItem('user', JSON.stringify(usuarioSinPassword))
    
    console.log('🔧 Token simulado guardado:', tokenSimulado)
    console.log('👤 Usuario guardado en localStorage:', usuarioSinPassword)
    
    return usuarioSinPassword
  }
  
  return null
}

// Estado de la vista actual
const vistaActual = ref('login') // 'login', 'dashboard'

const redirectToRoleDashboard = (rol) => {
  // Cambiar a vista de dashboard
  vistaActual.value = 'dashboard'
  console.log(`Redirigiendo a dashboard de ${rol}`)
}

const cerrarSesion = async () => {
  await authService.logout()
  usuarioActual.value = null
  vistaActual.value = 'login'
  console.log('Sesión cerrada, volviendo al login')
}

const cerrarModal = () => {
  mostrarLogin.value = false
  credenciales.value = { email: '', password: '' }
  mensaje.value = null
}
</script>

<script>
export default {
  watch: {
    usuarioActual(val) {
      if (val && val.rol === 'vendedor' && this.$route.path !== '/venta') {
        this.$router.push('/venta')
      }
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100vw;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* HEADER FEIPOBOL EXACTO */
.feipobol-header {
  background: #6B9080;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-feipobol {
  height: 65px;
  width: auto;
  background: white;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.texto-header h1 {
  color: white;
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: 3px;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.texto-header p {
  color: rgba(255,255,255,0.95);
  font-size: 0.95rem;
  font-weight: 500;
  margin: 2px 0 0 0;
  letter-spacing: 1px;
}

.btn-header-ingresar {
  background: #FF6B35;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(255,107,53,0.3);
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
}

.btn-header-ingresar .icono-btn-ingresar {
  display: none;
  font-size: 1.4rem;
}

.btn-header-ingresar .texto-btn-ingresar {
  display: inline;
}

.btn-header-ingresar:hover {
  background: #E55A2B;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255,107,53,0.4);
}

.usuario-logueado {
  display: flex;
  align-items: center;
  gap: 15px;
}

.texto-usuario {
  color: white;
  font-weight: 600;
  font-size: 1rem;
  background: rgba(255,255,255,0.1);
  padding: 8px 16px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.btn-cerrar-sesion {
  background: rgba(255,255,255,0.2);
  color: white;
  border: 2px solid rgba(255,255,255,0.3);
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cerrar-sesion:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}

/* CONTENIDO PRINCIPAL */
.contenido-feipobol {
  height: calc(100vh - 90px);
  display: flex;
  background: linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 100%);
  position: relative;
  overflow: hidden;
}

/* LADO IZQUIERDO */
.lado-izquierdo {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 60px;
  z-index: 2;
}

.titulo-principal {
  font-size: 4.5rem;
  font-weight: 900;
  color: #6B9080;
  line-height: 1.1;
  margin-bottom: 60px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
  letter-spacing: -1px;
}

.boton-central-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
}

.boton-ingresar-central {
  background: #FF6B35;
  color: white;
  border: none;
  padding: 20px 40px;
  border-radius: 12px;
  font-size: 1.4rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(255,107,53,0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.boton-ingresar-central:hover {
  background: #E55A2B;
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255,107,53,0.4);
}

.texto-autorizacion {
  font-size: 1.1rem;
  color: #7a7a7a;
  font-weight: 500;
  letter-spacing: 1px;
  margin: 0;
}

/* LADO DERECHO - ARTE FEIPOBOL */
.lado-derecho {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.arte-feipobol {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* LOGO PRINCIPAL ANIMADO */
.logo-principal-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-principal-animado {
  width: 380px;
  height: auto;
  max-width: 90%;
  filter: drop-shadow(0 15px 35px rgba(0,0,0,0.2));
  /* animation: logoFlotante 4s ease-in-out infinite, logoRotacion 20s linear infinite; */
  z-index: 10;
  position: relative;
}

/* EFECTOS DE FONDO ANIMADOS */
.efectos-fondo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.circulo-flotante {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(45deg, rgba(107,144,128,0.3), rgba(255,107,53,0.2));
  animation: flotarCirculo 8s ease-in-out infinite;
}

.circulo-1 {
  width: 80px;
  height: 80px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
  animation-duration: 6s;
}

.circulo-2 {
  width: 60px;
  height: 60px;
  top: 60%;
  right: 15%;
  animation-delay: -2s;
  animation-duration: 8s;
}

.circulo-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: -4s;
  animation-duration: 10s;
}

.circulo-4 {
  width: 40px;
  height: 40px;
  top: 30%;
  right: 30%;
  animation-delay: -1s;
  animation-duration: 5s;
}

.linea-movimiento {
  position: absolute;
  background: linear-gradient(90deg, transparent, rgba(107,144,128,0.4), transparent);
  animation: lineaMovimiento 3s ease-in-out infinite;
}

.linea-1 {
  width: 200px;
  height: 2px;
  top: 25%;
  left: -50px;
  animation-delay: 0s;
}

.linea-2 {
  width: 150px;
  height: 1px;
  top: 50%;
  right: -40px;
  animation-delay: -1s;
  animation-direction: reverse;
}

.linea-3 {
  width: 180px;
  height: 3px;
  bottom: 30%;
  left: -60px;
  animation-delay: -2s;
}

.texto-2025 {
  position: absolute;
  bottom: 80px;
  text-align: center;
}

.texto-2025 h2 {
  font-size: 2.8rem;
  font-weight: 900;
  color: #333;
  letter-spacing: 3px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
  animation: textoGlow 3s ease-in-out infinite alternate;
}

/* MODAL DE LOGIN */
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

.modal-login {
  background: white;
  border-radius: 20px;
  padding: 0;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: aparecerModal 0.3s ease-out;
}

.login-header {
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  color: white;
  padding: 25px 30px;
  border-radius: 20px 20px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-header h3 {
  margin: 0;
  font-size: 1.6rem;
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

.form-login {
  padding: 30px;
}

.campo {
  margin-bottom: 20px;
}

.campo input {
  width: 100%;
  padding: 15px 20px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  background: #fafafa;
}

.campo input:focus {
  outline: none;
  border-color: #6B9080;
  background: white;
  box-shadow: 0 0 0 3px rgba(107,144,128,0.1);
}

.btn-iniciar-sesion {
  width: 100%;
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-iniciar-sesion:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(107,144,128,0.3);
}

.btn-iniciar-sesion:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alerta {
  margin: 20px 0 0 0;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  font-weight: 500;
}

.alerta.info {
  background: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.alerta.exito {
  background: #e8f5e8;
  color: #388e3c;
  border: 1px solid #c8e6c9;
}

.alerta.error {
  background: #ffebee;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

/* ANIMACIONES */
@keyframes logoFlotante {
  0%, 100% { 
    transform: translateY(0px) scale(1); 
  }
  25% { 
    transform: translateY(-15px) scale(1.02); 
  }
  50% { 
    transform: translateY(-8px) scale(1.05); 
  }
  75% { 
    transform: translateY(-20px) scale(1.02); 
  }
}

@keyframes logoRotacion {
  0% { 
    transform: rotate(0deg); 
  }
  100% { 
    transform: rotate(360deg); 
  }
}

@keyframes flotarCirculo {
  0%, 100% { 
    transform: translateY(0px) translateX(0px) scale(1);
    opacity: 0.3;
  }
  25% { 
    transform: translateY(-20px) translateX(10px) scale(1.1);
    opacity: 0.6;
  }
  50% { 
    transform: translateY(-35px) translateX(-5px) scale(1.2);
    opacity: 0.8;
  }
  75% { 
    transform: translateY(-15px) translateX(15px) scale(1.1);
    opacity: 0.5;
  }
}

@keyframes lineaMovimiento {
  0% { 
    transform: translateX(-100%);
    opacity: 0;
  }
  50% { 
    opacity: 1;
  }
  100% { 
    transform: translateX(100vw);
    opacity: 0;
  }
}

@keyframes textoGlow {
  0% { 
    text-shadow: 2px 2px 4px rgba(0,0,0,0.2), 0 0 20px rgba(107,144,128,0.3);
  }
  100% { 
    text-shadow: 2px 2px 4px rgba(0,0,0,0.2), 0 0 30px rgba(255,107,53,0.4), 0 0 40px rgba(107,144,128,0.2);
  }
}

@keyframes aparecerModal {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-50px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* RESPONSIVE */
@media (max-width: 768px) {
  /* Header responsive */
  .feipobol-header {
    padding: 0 15px;
    height: 70px;
  }
  
  .logo-feipobol {
    height: 50px;
  }
  
  .texto-header h1 {
    font-size: 1.5rem;
    letter-spacing: 2px;
  }
  
  .texto-header p {
    font-size: 0.8rem;
  }
  
  /* Botón header: mostrar solo ícono en móvil */
  .btn-header-ingresar {
    padding: 12px 16px;
    min-width: auto;
  }
  
  .btn-header-ingresar .texto-btn-ingresar {
    display: none;
  }
  
  .btn-header-ingresar .icono-btn-ingresar {
    display: inline;
  }
  
  /* Contenido principal */
  .contenido-feipobol {
    flex-direction: column;
    height: calc(100vh - 70px);
  }
  
  .lado-izquierdo {
    padding: 30px 20px;
    text-align: center;
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .titulo-principal {
    font-size: 2.5rem;
    margin-bottom: 30px;
    line-height: 1.2;
  }
  
  /* Botón central centrado */
  .boton-central-container {
    align-items: center;
    width: 100%;
    max-width: 300px;
  }
  
  .boton-ingresar-central {
    padding: 18px 35px;
    font-size: 1.2rem;
    width: 100%;
  }
  
  .texto-autorizacion {
    text-align: center;
    font-size: 0.95rem;
  }
  
  /* Lado derecho - Logo ajustado */
  .lado-derecho {
    flex: 1;
    min-height: 300px;
    padding: 20px;
  }
  
  .logo-principal-animado {
    width: 250px;
    height: auto;
    max-width: 80%;
  }
  
  /* Texto FEIPOBOL 2025 más arriba para no tapar el logo */
  .texto-2025 {
    bottom: 40px;
  }
  
  .texto-2025 h2 {
    font-size: 1.6rem;
    letter-spacing: 2px;
  }
  
  /* Ocultar efectos de animación en móvil */
  .circulo-flotante {
    display: none;
  }
  
  .linea-movimiento {
    display: none;
  }
  
  /* Modal responsive */
  .modal-login {
    max-width: 95%;
    margin: 0 10px;
  }
  
  .login-header {
    padding: 20px 25px;
  }
  
  .login-header h3 {
    font-size: 1.3rem;
  }
  
  .form-login {
    padding: 25px 20px;
  }
  
  .campo input {
    padding: 13px 18px;
    font-size: 1rem;
  }
  
  .botones-roles {
    flex-direction: column;
    gap: 8px;
  }
  
  .btn-rol {
    width: 100%;
    padding: 12px;
    font-size: 0.95rem;
  }
}

/* Responsive para pantallas muy pequeñas */
@media (max-width: 480px) {
  .feipobol-header {
    height: 60px;
    padding: 0 10px;
  }
  
  .logo-container {
    gap: 10px;
  }
  
  .logo-feipobol {
    height: 40px;
  }
  
  .texto-header h1 {
    font-size: 1.2rem;
    letter-spacing: 1px;
  }
  
  .texto-header p {
    font-size: 0.7rem;
  }
  
  .btn-header-ingresar {
    padding: 10px 14px;
  }
  
  .btn-header-ingresar .icono-btn-ingresar {
    font-size: 1.2rem;
  }
  
  .titulo-principal {
    font-size: 2rem;
    margin-bottom: 20px;
  }
  
  .boton-ingresar-central {
    padding: 15px 30px;
    font-size: 1.1rem;
  }
  
  .logo-principal-animado {
    width: 200px;
  }
  
  .texto-2025 {
    bottom: 30px;
  }
  
  .texto-2025 h2 {
    font-size: 1.3rem;
  }
}

/* Landscape mobile */
@media (max-width: 768px) and (orientation: landscape) {
  .contenido-feipobol {
    flex-direction: row;
  }
  
  .lado-izquierdo {
    flex: 0 0 50%;
    padding: 20px;
  }
  
  .lado-derecho {
    flex: 0 0 50%;
    min-height: auto;
  }
  
  .titulo-principal {
    font-size: 2rem;
    margin-bottom: 20px;
  }
  
  .boton-ingresar-central {
    padding: 12px 25px;
    font-size: 1rem;
  }
  
  .logo-principal-animado {
    width: 180px;
  }
  
  .texto-2025 h2 {
    font-size: 1.2rem;
  }
}

/* === FOOTER STYLES === */
.feipobol-footer {
  background: linear-gradient(135deg, #2C3E50 0%, #34495E 100%);
  color: white;
  padding: 30px 20px;
  margin-top: auto;
  width: 100%;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
  padding: 20px 0;
}

.copyright {
  margin: 5px 0;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}

.developers {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.developers-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.developers-names {
  font-size: 14px;
  font-weight: 700;
  color: #FFD700;
  margin: 0;
  letter-spacing: 1px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .feipobol-footer {
    padding: 25px 15px;
  }
  
  .developers-names {
    font-size: 11px;
    word-break: break-word;
    line-height: 1.8;
  }
  
  .copyright {
    font-size: 12px;
  }
  
  .developers-title {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .developers-names {
    font-size: 10px;
  }
}

</style>
