// Servicio de staff/personal
export const staffService = {
  async createStaff(data) {
    try {
      const response = await apiClient.post('/api/staff', data)
      return response.data
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error al registrar staff' }
    }
  },
  async getAllStaff() {
    try {
      const response = await apiClient.get('/api/staff')
      return response.data
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Error al listar staff' }
    }
  }
}
import axios from 'axios'

// Configuración base de axios
// En desarrollo usa proxy de Vite, en producción usa VITE_API_URL o ruta relativa
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutos para generación masiva de QRs
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Evitar problemas de CORS
  validateStatus: (status) => status < 500, // Considerar 4xx como respuesta válida
})

// Interceptor para añadir token a las peticiones
apiClient.interceptors.request.use(
  (config) => {
    // Intentar obtener el token con ambos nombres (compatibilidad)
    const token = localStorage.getItem('sisqr_token') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - destruir sesión completamente
      console.warn('⚠️ Token expirado o inválido - cerrando sesión')
      
      // Limpiar localStorage (todas las variantes)
      localStorage.removeItem('token')
      localStorage.removeItem('sisqr_token')
      localStorage.removeItem('user')
      localStorage.removeItem('sisqr_user')
      localStorage.removeItem('refreshToken')
      
      // Redirigir al login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Servicio de usuarios
export const userService = {
  async getAllUsers() {
    try {
      const token = localStorage.getItem('token')
      console.log('🔑 Token en getAllUsers:', token ? 'Existe' : 'No existe')
      
      const response = await apiClient.get('/api/users')
      console.log('📦 Respuesta getAllUsers:', response.data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('❌ Error obteniendo usuarios:', error)
      console.error('📊 Detalles del error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      })
      return { success: false, error: error.response?.data?.message || 'Error al obtener usuarios' }
    }
  },

  async createUser(userData) {
    try {
      const token = localStorage.getItem('token')
      console.log('🔑 Token en createUser:', token ? 'Existe' : 'No existe')
      console.log('👤 Datos de usuario a crear:', userData)
      
      const response = await apiClient.post('/api/users', userData)
      console.log('✅ Usuario creado:', response.data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('❌ Error creando usuario:', error)
      console.error('📊 Detalles del error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      })
      return { success: false, error: error.response?.data?.message || 'Error al crear usuario' }
    }
  },

  async updateUser(id, userData) {
    try {
      const response = await apiClient.put(`/api/users/${id}`, userData)
      
      // Si el usuario editado es el usuario actual, actualizar localStorage
      const currentUser = JSON.parse(localStorage.getItem('sisqr_user') || localStorage.getItem('user') || '{}')
      if (currentUser.id === id) {
        console.log('ℹ️ Usuario actual editado - actualizando sesión')
        const updatedUser = { ...currentUser, ...userData }
        localStorage.setItem('sisqr_user', JSON.stringify(updatedUser))
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error actualizando usuario:', error)
      return { success: false, error: error.response?.data?.message || 'Error al actualizar usuario' }
    }
  },

  async deleteUser(id) {
    try {
      await apiClient.delete(`/api/users/${id}`)
      
      // Si el usuario eliminado es el usuario actual, cerrar sesión
      const currentUser = JSON.parse(localStorage.getItem('sisqr_user') || localStorage.getItem('user') || '{}')
      if (currentUser.id === id) {
        console.warn('⚠️ Usuario actual eliminado - cerrando sesión')
        
        // Limpiar localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('sisqr_token')
        localStorage.removeItem('user')
        localStorage.removeItem('sisqr_user')
        localStorage.removeItem('refreshToken')
        
        // Redirigir al login después de un breve delay
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      }
      
      return { success: true }
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      return { success: false, error: error.response?.data?.message || 'Error al eliminar usuario' }
    }
  }
}

// Servicio de tickets/ventas
export const ticketService = {
  async getStats() {
    try {
      const response = await apiClient.get('/api/tickets/stats')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error)
      return { success: false, error: 'Error al obtener estadísticas' }
    }
  },

  async getAllTickets() {
    try {
      const response = await apiClient.get('/api/tickets')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error obteniendo tickets:', error)
      return { success: false, error: 'Error al obtener tickets' }
    }
  },

  async createTicket(ticketData) {
    try {
      const response = await apiClient.post('/api/tickets', ticketData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error creando ticket:', error)
      return { success: false, error: error.response?.data?.message || 'Error al crear ticket' }
    }
  },

  async validateTicket(qrCode) {
    try {
      const response = await apiClient.post('/api/tickets/validate', { qrCode })
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error validando ticket:', error)
      return { success: false, error: error.response?.data?.message || 'Error al validar ticket' }
    }
  },

  async sellTicket(saleData) {
    try {
      console.log('🎫 Vendiendo ticket:', saleData)
      const token = localStorage.getItem('token')
      console.log('🔑 Token actual:', token ? token.substring(0, 50) + '...' : 'No hay token')
      
      const response = await apiClient.post('/api/tickets/sell', saleData)
      console.log('✅ Ticket vendido - Status:', response.status)
      console.log('✅ Ticket vendido - Headers:', response.headers)
      console.log('✅ Ticket vendido - Data:', response.data)
      console.log('✅ Ticket vendido - Data type:', typeof response.data)
      console.log('✅ Ticket vendido - Data keys:', response.data ? Object.keys(response.data) : 'No keys')
      
      return { success: true, data: response.data }
    } catch (error) {
      console.error('❌ Error vendiendo ticket - Status:', error.response?.status)
      console.error('❌ Error vendiendo ticket - Data:', error.response?.data)
      console.error('❌ Error vendiendo ticket - Message:', error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al vender ticket'
      }
    }
  }
}

// Servicio de autenticación
export const authService = {
  async login(email, password) {
    try {
      console.log('Intentando login con:', { email, password })
      console.log('Usando proxy de Vite para /api/auth/login')
      
      // Probar primero con fetch directo usando el proxy de Vite
      try {
        const testResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ login: email, password })
        })
        
        console.log('Test fetch - Status:', testResponse.status)
        console.log('Test fetch - Content-Type:', testResponse.headers.get('content-type'))
        
        const testData = await testResponse.text()
        console.log('Test fetch - Response raw:', testData.substring(0, 200) + '...')
        
        // Si la respuesta es HTML, hay un problema
        if (testData.includes('<html>')) {
          console.error('❌ Respuesta es HTML, backend no está respondiendo correctamente')
          throw new Error('Backend no está respondiendo JSON en /api/auth/login')
        }
        
        // Si llegamos aquí, la respuesta es válida
        console.log('✅ Fetch directo exitoso, continuando con axios...')
        
      } catch (fetchError) {
        console.error('❌ Error en test fetch:', fetchError)
        throw fetchError
      }
      
      const response = await apiClient.post('/api/auth/login', {
        login: email,  // Backend espera 'login' no 'email'
        password
      })
      
      console.log('Status de respuesta:', response.status)
      console.log('Headers de respuesta:', response.headers)
      console.log('Respuesta del backend:', response.data)
      
      // Verificar si la respuesta tiene la estructura esperada
      if (response.data && response.data.token) {
        const { token, user: userData, refreshToken } = response.data
        
        // Mapear los datos del usuario para que coincidan con nuestro frontend
        const user = {
          id: userData.id,
          nombre: `${userData.firstName} ${userData.lastName}`.trim(),
          email: userData.email,
          rol: userData.role,
          username: userData.username,
          phone: userData.phone,
          isActive: userData.isActive,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        }
        
        console.log('👤 Usuario mapeado:', user)
        
        // Validar que el usuario tenga la estructura mínima
        if (user && user.nombre && user.rol) {
          // Guardar token y usuario en localStorage con el prefijo correcto
          localStorage.setItem('token', token)
          localStorage.setItem('sisqr_token', token) // Mantener compatibilidad
          localStorage.setItem('user', JSON.stringify(user))
          localStorage.setItem('sisqr_user', JSON.stringify(user)) // Clave que usan los dashboards
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken)
          }
          
          console.log('✅ Datos guardados en localStorage')
          console.log('👤 Usuario guardado:', user)
          return { success: true, user, token }
        } else {
          console.error('Usuario no tiene la estructura esperada:', user)
          return {
            success: false,
            message: 'Respuesta del servidor incompleta'
          }
        }
      } else {
        console.error('Respuesta del servidor no tiene token:', response.data)
        return {
          success: false,
          message: 'Respuesta del servidor inválida'
        }
      }
    } catch (error) {
      console.error('Error en login:', error)
      
      // Verificar si es un error de red o del servidor
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        return {
          success: false,
          message: '❌ No se puede conectar al servidor. Verifica que el backend esté corriendo.'
        }
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error de conexión con el servidor'
      }
    }
  },

  async logout() {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      // Limpiar localStorage siempre (todas las variantes de las claves)
      localStorage.removeItem('token')
      localStorage.removeItem('sisqr_token')
      localStorage.removeItem('user')
      localStorage.removeItem('sisqr_user')
      localStorage.removeItem('refreshToken')
      console.log('✅ LocalStorage limpiado completamente')
    }
  },

  getCurrentUser() {
    // Intentar obtener de sisqr_user primero (que usan los dashboards), luego de user
    const userJson = localStorage.getItem('sisqr_user') || localStorage.getItem('user')
    return userJson ? JSON.parse(userJson) : null
  },

  getToken() {
    // Intentar obtener de sisqr_token primero, luego de token
    return localStorage.getItem('sisqr_token') || localStorage.getItem('token')
  },

  isAuthenticated() {
    return !!this.getToken()
  }
}

// Servicio para QR
export const qrService = {
  async generateQR(eventId, clientInfo) {
    try {
      const response = await apiClient.post('/qr/generate', {
        event_id: eventId,
        client_info: clientInfo
      })
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al generar QR'
      }
    }
  },

  async validateQR(qrData) {
    try {
      const response = await apiClient.post('/qr/validate', {
        qr_data: qrData
      })
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al validar QR'
      }
    }
  }
}

// Servicio de eventos
export const eventService = {
  async getAllEvents() {
    try {
      console.log('🎪 Obteniendo eventos desde backend')
      const response = await apiClient.get('/api/events')
      console.log('✅ Eventos obtenidos:', response.data)
      return { success: true, data: response.data.events || response.data }
    } catch (error) {
      console.error('❌ Error obteniendo eventos:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al obtener eventos'
      }
    }
  },

  async createEvent(eventData) {
    try {
      console.log('🎪 Creando evento:', eventData)
      const response = await apiClient.post('/api/events', eventData)
      console.log('✅ Evento creado:', response.data)
      return { success: true, data: response.data.event || response.data }
    } catch (error) {
      console.error('❌ Error creando evento:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al crear evento'
      }
    }
  },

  async updateEvent(id, eventData) {
    try {
      console.log('🎪 Actualizando evento:', id, eventData)
      const response = await apiClient.put(`/api/events/${id}`, eventData)
      console.log('✅ Evento actualizado:', response.data)
      return { success: true, data: response.data.event || response.data }
    } catch (error) {
      console.error('❌ Error actualizando evento:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al actualizar evento'
      }
    }
  },

  async deleteEvent(id) {
    try {
      console.log('🎪 Eliminando evento:', id)
      const response = await apiClient.delete(`/api/events/${id}`)
      console.log('✅ Evento eliminado:', response.data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('❌ Error eliminando evento:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al eliminar evento'
      }
    }
  },

  async updateEventStatus(id, status) {
    try {
      console.log('🎪 Actualizando estado del evento:', id, status)
      const response = await apiClient.patch(`/api/events/${id}/status`, { status })
      console.log('✅ Estado del evento actualizado:', response.data)
      return { success: true, data: response.data.event || response.data }
    } catch (error) {
      console.error('❌ Error actualizando estado:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Error al actualizar estado'
      }
    }
  }
}

// Servicio de validación QR
export const validationService = {
  async validateQR(qrCode, eventId = null, location = null, entryCount = 1) {
    try {
      console.log('🔍 Validando QR:', qrCode, 'para', entryCount, 'persona(s)')
      
      const requestData = {
        qrCode,
        entryCount,
        location: location || 'Dashboard Administrativo',
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: new Date().toISOString()
        }
      }
      
      if (eventId) {
        requestData.eventId = eventId
      }
      
      const response = await apiClient.post('/api/validation/scan-qr', requestData)
      console.log('✅ Respuesta de validación:', response.data)
      
      return {
        success: response.data.success,
        ticket: response.data.ticket,
        message: response.data.message,
        validationLog: response.data.validationLog
      }
    } catch (error) {
      console.error('❌ Error en validación QR:', error.response?.data || error.message)
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error de conexión al validar QR',
        error: error.response?.data || { message: error.message }
      }
    }
  },

  async getValidationHistory(limit = 50) {
    try {
      console.log('📋 Obteniendo historial de validaciones')
      const response = await apiClient.get(`/api/validation/history?limit=${limit}`)
      return {
        success: true,
        data: response.data.validations || response.data
      }
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  },

  async getValidationStats(eventId = null) {
    try {
      console.log('📊 Obteniendo estadísticas de validación')
      const url = eventId ? `/api/validation/stats?eventId=${eventId}` : '/api/validation/stats'
      const response = await apiClient.get(url)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  },

  async getTicketInfo(qrCode) {
    try {
      console.log('🎫 Obteniendo información del ticket:', qrCode)
      const response = await apiClient.get(`/api/validation/ticket-info/${encodeURIComponent(qrCode)}`)
      return {
        success: true,
        ticket: response.data.ticket
      }
    } catch (error) {
      console.error('❌ Error obteniendo info del ticket:', error.response?.data || error.message)
      return {
        success: false,
        message: error.response?.data?.message || 'Error obteniendo información del ticket',
        error: error.response?.data || { message: error.message }
      }
    }
  }
}

// Servicio de trabajadores
export const trabajadorService = {
  async createTrabajador(data) {
    try {
      const response = await apiClient.post('/api/trabajadores', data)
      // El backend ya devuelve { success, message, data }, no envolver de nuevo
      return response.data
    } catch (error) {
      console.error('Error creando trabajador:', error)
      return { success: false, error: error.response?.data?.error || 'Error al registrar trabajador' }
    }
  },

  async getAllTrabajadores() {
    try {
      const response = await apiClient.get('/api/trabajadores')
      console.log('📊 Respuesta trabajadores:', response.data)
      return { success: true, data: response.data.data || response.data }
    } catch (error) {
      console.error('Error obteniendo trabajadores:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener trabajadores' }
    }
  },

  async getTrabajadorById(id) {
    try {
      const response = await apiClient.get(`/api/trabajadores/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error obteniendo trabajador:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener trabajador' }
    }
  },

  async updateTrabajador(id, data) {
    try {
      const response = await apiClient.put(`/api/trabajadores/${id}`, data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error actualizando trabajador:', error)
      return { success: false, error: error.response?.data?.error || 'Error al actualizar trabajador' }
    }
  },

  async deleteTrabajador(id) {
    try {
      await apiClient.delete(`/api/trabajadores/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error eliminando trabajador:', error)
      return { success: false, error: error.response?.data?.error || 'Error al eliminar trabajador' }
    }
  }
}

// Servicio de participantes
export const participanteService = {
  async createParticipante(data) {
    try {
      const response = await apiClient.post('/api/participantes', data)
      // El backend ya devuelve { success, message, data }, no envolver de nuevo
      return response.data
    } catch (error) {
      console.error('Error creando participante:', error)
      return { success: false, error: error.response?.data?.error || 'Error al registrar participante' }
    }
  },

  async getAllParticipantes() {
    try {
      const response = await apiClient.get('/api/participantes')
      console.log('📊 Respuesta participantes:', response.data)
      return { success: true, data: response.data.data || response.data }
    } catch (error) {
      console.error('Error obteniendo participantes:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener participantes' }
    }
  },

  async getParticipanteById(id) {
    try {
      const response = await apiClient.get(`/api/participantes/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error obteniendo participante:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener participante' }
    }
  },

  async updateParticipante(id, data) {
    try {
      const response = await apiClient.put(`/api/participantes/${id}`, data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error actualizando participante:', error)
      return { success: false, error: error.response?.data?.error || 'Error al actualizar participante' }
    }
  },

  async deleteParticipante(id) {
    try {
      await apiClient.delete(`/api/participantes/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error eliminando participante:', error)
      return { success: false, error: error.response?.data?.error || 'Error al eliminar participante' }
    }
  }
}

// Servicio de FEIPOBOL 2025
export const feipobolService = {
  async createRegistroFeipobol(data) {
    try {
      const response = await apiClient.post('/api/public/registro', data)
      // El backend ya devuelve { success, message, data }, no envolver de nuevo
      return response.data
    } catch (error) {
      console.error('Error creando registro FEIPOBOL:', error)
      return { success: false, error: error.response?.data?.error || 'Error al registrar para FEIPOBOL' }
    }
  },

  async getAllRegistrosFeipobol() {
    try {
      const response = await apiClient.get('/api/registro-feipobol')
      console.log('📊 Respuesta registros FEIPOBOL:', response.data)
      return { success: true, data: response.data.data || response.data }
    } catch (error) {
      console.error('Error obteniendo registros FEIPOBOL:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener registros FEIPOBOL' }
    }
  },

  async getRegistroFeipobolById(id) {
    try {
      const response = await apiClient.get(`/api/registro-feipobol/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error obteniendo registro FEIPOBOL:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener registro FEIPOBOL' }
    }
  },

  async updateRegistroFeipobol(id, data) {
    try {
      const response = await apiClient.put(`/api/registro-feipobol/${id}`, data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error actualizando registro FEIPOBOL:', error)
      return { success: false, error: error.response?.data?.error || 'Error al actualizar registro FEIPOBOL' }
    }
  },

  async deleteRegistroFeipobol(id) {
    try {
      await apiClient.delete(`/api/registro-feipobol/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error eliminando registro FEIPOBOL:', error)
      return { success: false, error: error.response?.data?.error || 'Error al eliminar registro FEIPOBOL' }
    }
  }
}

// Servicio de control de acceso (trabajadores/participantes)
export const accessService = {
  async validateAccess(token, tipo) {
    try {
      console.log('🔍 Validando acceso:', { token, tipo })
      const response = await apiClient.post('/api/access/validate', { token, tipo })
      console.log('✅ Respuesta validación acceso:', response.data)
      return { success: true, ...response.data }
    } catch (error) {
      console.error('❌ Error validando acceso:', error.response?.data)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al validar acceso',
        result: error.response?.data?.result || 'error',
        ...error.response?.data
      }
    }
  },

  async getSystemStatus() {
    try {
      const response = await apiClient.get('/api/access/status')
      return { success: true, ...response.data }
    } catch (error) {
      console.error('Error obteniendo estado del sistema:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener estado'
      }
    }
  },

  async toggleSystem(activo) {
    try {
      const response = await apiClient.post('/api/access/toggle', { activo })
      return { success: true, ...response.data }
    } catch (error) {
      console.error('Error cambiando estado del sistema:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al cambiar estado'
      }
    }
  },

  async getAccessHistory(limit = 50, tipo = null) {
    try {
      const params = new URLSearchParams({ limit })
      if (tipo) params.append('tipo', tipo)
      
      const response = await apiClient.get(`/api/access/history?${params}`)
      return { success: true, ...response.data }
    } catch (error) {
      console.error('Error obteniendo historial:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener historial'
      }
    }
  }
}

// Servicio de empresas/stands
export const empresaService = {
  async getAllEmpresas() {
    try {
      const response = await apiClient.get('/api/empresas')
      return { success: true, data: response.data.data || response.data }
    } catch (error) {
      console.error('Error obteniendo empresas:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener empresas' }
    }
  },

  async getEmpresasDisponibles() {
    try {
      // Agregar timestamp para prevenir caché del navegador
      const timestamp = new Date().getTime()
      const response = await apiClient.get(`/api/empresas/disponibles?_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      console.log('📊 Empresas disponibles recibidas:', response.data.data?.length || 0)
      return { success: true, data: response.data.data || response.data }
    } catch (error) {
      console.error('Error obteniendo empresas disponibles:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener empresas disponibles' }
    }
  },

  async createEmpresa(data) {
    try {
      const response = await apiClient.post('/api/empresas', data)
      return { success: true, data: response.data.data || response.data }
    } catch (error) {
      console.error('Error creando empresa:', error)
      return { success: false, error: error.response?.data?.error || 'Error al crear empresa/stand' }
    }
  },

  async updateEmpresa(id, data) {
    try {
      const response = await apiClient.put(`/api/empresas/${id}`, data)
      return { success: true, data: response.data.data || response.data }
    } catch (error) {
      console.error('Error actualizando empresa:', error)
      return { success: false, error: error.response?.data?.error || 'Error al actualizar empresa/stand' }
    }
  },

  async deleteEmpresa(id) {
    try {
      await apiClient.delete(`/api/empresas/${id}`)
      return { success: true }
    } catch (error) {
      console.error('Error eliminando empresa:', error)
      return { success: false, error: error.response?.data?.error || 'Error al eliminar empresa/stand' }
    }
  }
}

// Servicio de backup
export const backupService = {
  async exportBackup() {
    try {
      const response = await apiClient.post('/api/backup/export', {}, {
        responseType: 'blob' // Importante para recibir el archivo
      })
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error exportando backup:', error)
      throw error
    }
  },

  async importBackup(file) {
    try {
      const formData = new FormData()
      formData.append('backup', file)
      
      const response = await apiClient.post('/api/backup/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error importando backup:', error)
      throw error
    }
  },

  async listBackups() {
    try {
      const response = await apiClient.get('/api/backup/list')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error listando backups:', error)
      throw error
    }
  },

  async deleteBackup(filename) {
    try {
      const response = await apiClient.delete(`/api/backup/${filename}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error eliminando backup:', error)
      throw error
    }
  },

  async downloadBackup(filename) {
    try {
      const response = await apiClient.get(`/api/backup/download/${filename}`, {
        responseType: 'blob'
      })
      return { success: true, data: response.data, filename }
    } catch (error) {
      console.error('Error descargando backup:', error)
      throw error
    }
  },

  async cleanDatabase() {
    try {
      const response = await apiClient.post('/api/backup/clean')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error limpiando base de datos:', error)
      throw error
    }
  }
}

// Servicio de reportes
export const reportService = {
  async getReportData(filters = {}) {
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key])
        }
      })
      
      const response = await apiClient.get(`/api/reports/data?${params.toString()}`)
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Error obteniendo datos de reporte:', error)
      return { success: false, message: error.response?.data?.message || 'Error de conexión' }
    }
  },

  async getFilterOptions() {
    try {
      const response = await apiClient.get('/api/reports/filter-options')
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Error obteniendo opciones de filtros:', error)
      return { success: false, message: error.response?.data?.message || 'Error de conexión' }
    }
  },

  async validateCredential(codigoQR) {
    try {
      const response = await apiClient.get(`/api/reports/validate/${encodeURIComponent(codigoQR)}`)
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Error validando credencial:', error)
      return { success: false, message: error.response?.data?.message || 'Error de conexión' }
    }
  },

  generatePDFUrl(filters = {}) {
    const params = new URLSearchParams()
    Object.keys(filters).forEach(key => {
      if (filters[key] && key !== 'page' && key !== 'limit') {
        params.append(key, filters[key])
      }
    })
    params.append('titulo', 'Reporte de Entradas - ' + new Date().toLocaleDateString())
    
    return `${apiClient.defaults.baseURL}/api/reports/pdf?${params.toString()}`
  },

  // Reportes de accesos (Generador QR)
  async getAccesosData(filters = {}) {
    try {
      const params = new URLSearchParams()
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key])
        }
      })
      
      const response = await apiClient.get(`/api/reports/accesos?${params.toString()}`)
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Error obteniendo datos de accesos:', error)
      return { success: false, message: error.response?.data?.message || 'Error de conexión' }
    }
  },

  async getAccesosFilterOptions() {
    try {
      const response = await apiClient.get('/api/reports/accesos-filter-options')
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Error obteniendo opciones de filtros de accesos:', error)
      return { success: false, message: error.response?.data?.message || 'Error de conexión' }
    }
  }
}

// Servicio para gestión de premios FEIPOBOL
export const premiosService = {
  async getAllPremios() {
    try {
      const response = await apiClient.get('/api/admin/premios')
      // El backend devuelve { success: true, premios: [...] }
      return { success: true, data: response.data.premios || response.data }
    } catch (error) {
      console.error('Error obteniendo premios:', error)
      return { success: false, error: error.response?.data?.message || 'Error al obtener premios' }
    }
  },

  async getStats() {
    try {
      const response = await apiClient.get('/api/admin/premios/stats')
      // El backend devuelve { success: true, stats: {...} }
      return { success: true, data: response.data.stats || response.data }
    } catch (error) {
      console.error('Error obteniendo estadísticas de premios:', error)
      return { success: false, error: error.response?.data?.message || 'Error al obtener estadísticas' }
    }
  },

  async createPremio(data) {
    try {
      const response = await apiClient.post('/api/admin/premios', data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error creando premio:', error)
      return { success: false, error: error.response?.data?.message || 'Error al crear premio' }
    }
  },

  async updatePremio(id, data) {
    try {
      const response = await apiClient.put(`/api/admin/premios/${id}`, data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error actualizando premio:', error)
      return { success: false, error: error.response?.data?.message || 'Error al actualizar premio' }
    }
  },

  async deletePremio(id) {
    try {
      const response = await apiClient.delete(`/api/admin/premios/${id}`)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error eliminando premio:', error)
      return { success: false, error: error.response?.data?.message || 'Error al eliminar premio' }
    }
  },

  async getGanadores() {
    try {
      const response = await apiClient.get('/api/admin/premios/ganadores')
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error obteniendo ganadores:', error)
      return { success: false, error: error.response?.data?.message || 'Error al obtener ganadores' }
    }
  },

  async marcarEntregado(ganadorId, data) {
    try {
      const response = await apiClient.put(`/api/admin/premios/ganadores/${ganadorId}/entrega`, data)
      return { success: true, data: response.data }
    } catch (error) {
      console.error('Error marcando entrega:', error)
      return { success: false, error: error.response?.data?.message || 'Error al marcar entrega' }
    }
  }
}

// Servicio de configuración (habilitar/deshabilitar formularios)
export const configuracionService = {
  // Obtener estado de los formularios (público)
  async getFormulariosStatus() {
    try {
      const response = await apiClient.get('/api/configuracion/formularios-status')
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Error obteniendo estado formularios:', error)
      // Por defecto, permitir acceso si hay error
      return { success: true, data: { participantes: true, trabajadores: true, feipobol: true } }
    }
  },

  // Obtener todas las configuraciones (admin)
  async getAll() {
    try {
      const response = await apiClient.get('/api/configuracion')
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error)
      return { success: false, error: error.response?.data?.error || 'Error al obtener configuraciones' }
    }
  },

  // Toggle formulario (admin)
  async toggleFormulario(tipo, activo) {
    try {
      const response = await apiClient.post(`/api/configuracion/toggle/${tipo}`, { activo })
      return { success: true, data: response.data.data }
    } catch (error) {
      console.error(`Error toggling formulario ${tipo}:`, error)
      return { success: false, error: error.response?.data?.error || 'Error al cambiar estado' }
    }
  }
}

export default apiClient