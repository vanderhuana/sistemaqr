import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import VentaView from './views/VentaView.vue'
import StaffView from './views/StaffView.vue'
import RegistroTrabajador from './views/RegistroTrabajador.vue'
import RegistroParticipante from './views/RegistroParticipante.vue'
import DashboardAdmin from './components/DashboardAdmin.vue'
import DashboardVendedor from './components/DashboardVendedor.vue'
import DashboardControl from './components/DashboardControl.vue'
import GeneradorQREntradas from './components/GeneradorQREntradas.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/login', component: LoginView },
  { path: '/dashboard', component: DashboardAdmin, meta: { requiresAuth: true, requiresRole: 'admin' } },
  { path: '/vendedor', component: DashboardVendedor, meta: { requiresAuth: true, requiresRole: 'vendedor' } },
  { path: '/control', component: DashboardControl, meta: { requiresAuth: true, requiresRole: 'control' } },
  { path: '/venta', component: VentaView, meta: { requiresVendedor: true } },
  { path: '/staff', component: StaffView },
  { path: '/registro-trabajador', component: RegistroTrabajador },
  { path: '/registro-participante', component: RegistroParticipante },
  { 
    path: '/generar-entradas', 
    component: GeneradorQREntradas, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['admin', 'vendedor'] 
    } 
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  console.log('🛣️ Router Guard - Navegando de', from.path, 'a', to.path)
  
  // Obtener usuario desde localStorage (store auth usa 'sisqr_user')
  let usuario = null
  try {
    const storedUser = localStorage.getItem('sisqr_user')
    console.log('📦 Usuario en localStorage:', storedUser)
    usuario = JSON.parse(storedUser || 'null')
    console.log('👤 Usuario parseado:', usuario)
    console.log('🎭 Rol del usuario:', usuario?.role)
  } catch (e) {
    console.error('❌ Error parseando usuario:', e)
    usuario = null
  }

  console.log('🔒 Ruta requiere auth:', to.meta.requiresAuth)
  console.log('🎯 Ruta requiere rol:', to.meta.requiresRole)

  // Verificar autenticación requerida
  if (to.meta.requiresAuth && !usuario) {
    console.log('⛔ No autenticado, redirigiendo a /login')
    return next('/login')
  }

  // Verificar rol específico requerido
  if (to.meta.requiresRole && usuario?.role !== to.meta.requiresRole) {
    console.log('⚠️ Rol incorrecto. Esperado:', to.meta.requiresRole, 'Actual:', usuario?.role)
    // Redirigir según el rol del usuario
    if (usuario?.role === 'admin') {
      console.log('➡️ Redirigiendo admin a /dashboard')
      return next('/dashboard')
    } else if (usuario?.role === 'vendedor') {
      console.log('➡️ Redirigiendo vendedor a /vendedor')
      return next('/vendedor')
    } else if (usuario?.role === 'control') {
      console.log('➡️ Redirigiendo control a /control')
      return next('/control')
    }
    console.log('❓ Rol desconocido, redirigiendo a /')
    return next('/')
  }

  // Verificar roles permitidos (para rutas con allowedRoles)
  if (to.meta.allowedRoles && !to.meta.allowedRoles.includes(usuario?.role)) {
    console.log('⚠️ Rol no permitido. Permitidos:', to.meta.allowedRoles, 'Actual:', usuario?.role)
    if (usuario?.role === 'admin') {
      return next('/dashboard')
    } else if (usuario?.role === 'vendedor') {
      return next('/vendedor')
    } else if (usuario?.role === 'control') {
      return next('/control')
    }
    return next('/')
  }

  // Compatibilidad con meta antigua
  if (to.meta.requiresVendedor && usuario?.role !== 'vendedor') {
    console.log('⛔ RequiresVendedor pero no es vendedor, redirigiendo a /')
    return next('/')
  }
  
  console.log('✅ Permitiendo navegación a', to.path)
  next()
})

export default router
