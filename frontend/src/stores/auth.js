import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

// Configurar axios
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar el token a las requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sisqr_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar respuestas de error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('sisqr_token')
      localStorage.removeItem('sisqr_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const user = ref(null)
  const token = ref(null)
  const loading = ref(false)

  // Computed
  const isAuthenticated = computed(() => !!token.value)
  
  const userRole = computed(() => user.value?.role)
  
  const canValidate = computed(() => {
    return user.value?.role === 'control' || user.value?.role === 'admin'
  })
  
  // Solo el rol 'vendedor' puede vender entradas
  const canSell = computed(() => {
    return user.value?.role === 'vendedor'
  })
  
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Acciones
  const login = async (credentials) => {
    loading.value = true
    
    try {
      const response = await api.post('/auth/login', credentials)
      
      if (response.data.success) {
        token.value = response.data.token
        user.value = response.data.user
        
        // Guardar en localStorage
        localStorage.setItem('sisqr_token', token.value)
        localStorage.setItem('sisqr_user', JSON.stringify(user.value))
        
        return response.data
      } else {
        throw new Error(response.data.message || 'Error en el login')
      }
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    token.value = null
    
    localStorage.removeItem('sisqr_token')
    localStorage.removeItem('sisqr_user')
    
    // Redireccionar al login
    window.location.href = '/login'
  }

  const checkAuth = () => {
    const savedToken = localStorage.getItem('sisqr_token')
    const savedUser = localStorage.getItem('sisqr_user')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      try {
        user.value = JSON.parse(savedUser)
        return true
      } catch (error) {
        console.error('Error parsing saved user:', error)
        logout()
        return false
      }
    }
    
    return false
  }

  const updateProfile = async (profileData) => {
    loading.value = true
    
    try {
      const response = await api.put('/auth/profile', profileData)
      
      if (response.data.success) {
        user.value = { ...user.value, ...response.data.user }
        localStorage.setItem('sisqr_user', JSON.stringify(user.value))
        return response.data
      } else {
        throw new Error(response.data.message || 'Error actualizando perfil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const changePassword = async (passwords) => {
    loading.value = true
    
    try {
      const response = await api.post('/auth/change-password', passwords)
      return response.data
    } catch (error) {
      console.error('Error changing password:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Verificar autenticación al inicializar
  checkAuth()

  return {
    // Estado
    user,
    token,
    loading,
    
    // Computed
    isAuthenticated,
    userRole,
    canValidate,
    canSell,
    isAdmin,
    
    // Acciones
    login,
    logout,
    checkAuth,
    updateProfile,
    changePassword,
    
    // API instance para otros stores
    api
  }
})