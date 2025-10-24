<template>
  <div class="dashboard-feipobol">
    
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
    
    <!-- SIDEBAR FEIPOBOL -->
    <aside class="sidebar-feipobol" :class="{ open: sidebarOpen }">
      <!-- Header del sidebar -->
      <div class="sidebar-header">
        <h2>FEIPOBOL</h2>
        <p>EN EL BICENTENARIO DE BOLIVIA 🇧🇴</p>
      </div>
      
      <!-- Información del usuario -->
      <div class="user-info">
        <div class="user-avatar">
          {{ (usuario.firstName || usuario.nombre || usuario.username || 'A')[0].toUpperCase() }}
        </div>
        <div class="user-details">
          <h3>{{ usuario.firstName || usuario.nombre || usuario.username || 'Administrador' }} {{ usuario.lastName || usuario.apellido || '' }}</h3>
          <p class="user-role">{{ usuario.role ? usuario.role.toUpperCase() : 'ADMINISTRADOR' }}</p>
          <p class="user-email">{{ usuario.email || 'admin@feipobol.bo' }}</p>
        </div>
      </div>

      <!-- Menú de navegación -->
      <nav class="sidebar-nav">

        <button 
          @click="cambiarSeccion('usuarios')" 
          :class="{ active: seccionActiva === 'usuarios' }"
          class="nav-item"
        >
          GESTIONAR USUARIOS
        </button>
        <button 
          @click="cambiarSeccion('reportes')" 
          :class="{ active: seccionActiva === 'reportes' }"
          class="nav-item"
        >
          REPORTES DE VENTAS
        </button>
        <button 
          @click="cambiarSeccion('eventos')" 
          :class="{ active: seccionActiva === 'eventos' }"
          class="nav-item"
        >
          GESTIONAR EVENTOS
        </button>
        <button 
          @click="cambiarSeccion('vender')" 
          :class="{ active: seccionActiva === 'vender' }"
          class="nav-item"
        >
          VENDER ENTRADA
        </button>
        <button 
          @click="cambiarSeccion('generar-qr')" 
          :class="{ active: seccionActiva === 'generar-qr' }"
          class="nav-item nav-item-qr"
        >
          🎫 GENERAR QRs
        </button>
        <button 
          @click="cambiarSeccion('scanner')" 
          :class="{ active: seccionActiva === 'scanner' }"
          class="nav-item"
        >
          ESCÁNER QR
        </button>

        <!-- CONTROL DE ACCESO -->
        <div class="control-acceso-toggle">
          <div class="toggle-header">
            <span>🚪 Control de Acceso</span>
            <span :class="['estado-badge', sistemaAccesoActivo ? 'activo' : 'inactivo']">
              {{ sistemaAccesoActivo ? 'ACTIVO' : 'INACTIVO' }}
            </span>
          </div>
          <button 
            @click="toggleSistemaAcceso" 
            :class="['btn-toggle', sistemaAccesoActivo ? 'activo' : 'inactivo']"
            :disabled="cargandoToggle"
          >
            {{ cargandoToggle ? '⏳' : (sistemaAccesoActivo ? '✅ DESACTIVAR' : '❌ ACTIVAR') }}
          </button>
        </div>

        <!-- STAFF / PERSONAL removed -->
        <button 
          @click="seccionActiva = 'escanear'" 
          :class="{ active: seccionActiva === 'escanear' }"
          class="nav-item"
        >
          ESCANEAR
        </button>
        <button 
          @click="seccionActiva = 'filtrar'" 
          :class="{ active: seccionActiva === 'filtrar' }"
          class="nav-item"
        >
          FILTRAR VISITANTE
        </button>

        <!-- MENÚ LISTA -->
        <div class="nav-seccion">
          <div class="nav-seccion-titulo">LISTA</div>
          <button 
            @click="seccionActiva = 'trabajadores'" 
            :class="{ active: seccionActiva === 'trabajadores' }"
            class="nav-item sub-item"
          >
            👷 TRABAJADORES
          </button>
          <button 
            @click="seccionActiva = 'participantes'" 
            :class="{ active: seccionActiva === 'participantes' }"
            class="nav-item sub-item"
          >
            🎯 PARTICIPANTES
          </button>
        </div>
      </nav>

      <!-- Botón salir -->
      <button @click="$emit('cerrar-sesion')" class="btn-salir">
        SALIR
      </button>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="contenido-principal">
      
      <!-- HEADER DEL CONTENIDO -->
      <header class="contenido-header">
        <h1 v-if="seccionActiva === 'usuarios'">LISTA DE USUARIOS</h1>
        <h1 v-else-if="seccionActiva === 'reportes'">REPORTES DE VENTAS</h1>
        <h1 v-else-if="seccionActiva === 'eventos'">GESTIÓN DE EVENTOS</h1>
        <h1 v-else-if="seccionActiva === 'vender'">VENDER ENTRADA</h1>
        <h1 v-else-if="seccionActiva === 'generar-qr'">GENERADOR DE ENTRADAS QR</h1>
        <h1 v-else-if="seccionActiva === 'scanner'">ESCÁNER QR</h1>
        <h1 v-else-if="seccionActiva === 'escanear'">ESCÁNER QR</h1>
        <h1 v-else-if="seccionActiva === 'filtrar'">FILTRAR VISITANTES</h1>
        <h1 v-else-if="seccionActiva === 'trabajadores'">LISTA DE TRABAJADORES</h1>
        <h1 v-else-if="seccionActiva === 'participantes'">LISTA DE PARTICIPANTES</h1>
        <h1 v-else>PANEL ADMINISTRADOR</h1>
      </header>
      
      <!-- ESTADÍSTICAS RÁPIDAS (solo en vista principal) -->
      <section v-if="seccionActiva === 'dashboard'" class="stats-section">
        <div class="stat-card ventas">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <h3>{{ estadisticas.totalVentas }}</h3>
            <p>Ventas Totales</p>
          </div>
        </div>
        
        <div class="stat-card usuarios">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <h3>{{ estadisticas.totalUsuarios }}</h3>
            <p>Usuarios Registrados</p>
          </div>
        </div>
        
        <div class="stat-card entradas">
          <div class="stat-icon">🎫</div>
          <div class="stat-info">
            <h3>{{ estadisticas.entradasVendidas }}</h3>
            <p>Entradas Vendidas</p>
          </div>
        </div>
        
        <div class="stat-card validaciones">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{ estadisticas.validacionesHoy }}</h3>
            <p>Validaciones Hoy</p>
          </div>
        </div>
      </section>

      <!-- SECCIÓN GESTIÓN DE USUARIOS -->
      <section v-if="seccionActiva === 'usuarios'" class="seccion-contenido">
        <div class="contenido-card">
          <div class="card-header">
            <button 
              @click="mostrarNuevoUsuario = true" 
              class="btn-nuevo-feipobol"
              :disabled="cargando"
            >
              + Nuevo Usuario
            </button>
            
            <button 
              @click="cargarUsuarios" 
              class="btn-refrescar"
              :disabled="cargando"
            >
              🔄 {{ cargando ? 'Cargando...' : 'Refrescar' }}
            </button>
          </div>

          <!-- Mostrar error si existe -->
          <div v-if="error" class="error-message">
            ⚠️ {{ error }}
            <button @click="error = ''" class="btn-cerrar-error">✕</button>
          </div>
          
          <!-- Loading -->
          <div v-if="cargando" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Cargando usuarios...</p>
          </div>
          
          <!-- Tabla de usuarios -->
          <div v-else class="tabla-usuarios">
            <div class="usuario-header">
              <span>NOMBRE</span>
              <span>EMAIL</span>
              <span>ROL</span>
              <span>ACCIONES</span>
            </div>
            
            <div v-if="usuarios.length === 0" class="usuario-vacio">
              <p>No hay usuarios registrados</p>
            </div>
            
            <div v-for="usuario in usuarios" :key="usuario.id" class="usuario-fila">
              <span class="usuario-nombre">{{ usuario.nombre || 'Sin nombre' }}</span>
              <span class="usuario-email">{{ usuario.email || 'Sin email' }}</span>
              <span class="usuario-rol" :class="usuario.rol || 'indefinido'">
                {{ usuario.rol ? usuario.rol.toUpperCase() : 'INDEFINIDO' }}
              </span>
              <div class="usuario-acciones">
                <button @click="editarUsuario(usuario)" class="btn-accion editar" :disabled="cargando">✏️</button>
                <button @click="eliminarUsuario(usuario.id)" class="btn-accion eliminar" :disabled="cargando">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- SECCIÓN REPORTES -->
      <section v-else-if="seccionActiva === 'reportes'" class="seccion-contenido">
        <div class="contenido-card">
          <div class="reportes-grid">
            <div class="reporte-item">
              <h3>Ventas del Mes</h3>
              <p class="numero-grande">Bs. {{ totalVendido }}</p>
            </div>
            <div class="reporte-item">
              <h3>Entradas Vendidas</h3>
              <p class="numero-grande">{{ totalEntradas }}</p>
            </div>
            <div class="reporte-item">
              <h3>Promedio Diario</h3>
              <p class="numero-grande">Bs. {{ promedioVentas }}</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- SECCIÓN EVENTOS -->
      <!-- SECCIÓN GESTIÓN DE EVENTOS -->
      <section v-else-if="seccionActiva === 'eventos'" class="seccion-contenido">
        <div class="contenido-card">
          <div class="card-header">
            <button 
              @click="mostrarNuevoEvento = true" 
              class="btn-nuevo-feipobol"
              :disabled="cargandoEventos"
            >
              + Nuevo Evento
            </button>
            
            <button 
              @click="cargarEventos" 
              class="btn-refrescar"
              :disabled="cargandoEventos"
            >
              🔄 {{ cargandoEventos ? 'Cargando...' : 'Refrescar' }}
            </button>
          </div>

          <!-- Mostrar error si existe -->
          <div v-if="errorEventos" class="error-message">
            ⚠️ {{ errorEventos }}
            <button @click="errorEventos = ''" class="btn-cerrar-error">✕</button>
          </div>
          
          <!-- Loading -->
          <div v-if="cargandoEventos" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Cargando eventos...</p>
          </div>
          
          <!-- Grid de eventos -->
          <div v-else class="eventos-grid">
            <div v-if="eventos.length === 0" class="no-eventos">
              <p>📅 No hay eventos registrados</p>
              <button @click="mostrarNuevoEvento = true" class="btn-crear-primero">
                Crear primer evento
              </button>
            </div>
            
            <div v-for="evento in eventos" :key="evento.id" class="evento-card-admin">
              <div class="evento-header">
                <h4>{{ evento.name }}</h4>
                <div class="evento-acciones">
                  <button @click="editarEvento(evento)" class="btn-editar" title="Editar">✏️</button>
                  <button @click="eliminarEvento(evento.id)" class="btn-eliminar" title="Eliminar">🗑️</button>
                </div>
              </div>
              
              <div class="evento-info">
                <p><strong>📍 Lugar:</strong> {{ evento.location }}</p>
                <p><strong>📅 Inicio:</strong> {{ formatearFechaEvento(evento.startDate) }}</p>
                <p><strong>📅 Fin:</strong> {{ formatearFechaEvento(evento.endDate) }}</p>
                <p><strong>� Capacidad:</strong> {{ evento.maxCapacity }} personas</p>
                <p><strong>�💰 Precio base:</strong> Bs. {{ evento.basePrice }}</p>
                <p><strong>🎫 Vendidas:</strong> {{ evento.currentSold || 0 }} / {{ evento.maxCapacity }}</p>
                
                <!-- Rangos de precios -->
                <div v-if="evento.priceRanges && evento.priceRanges.length > 0" class="rangos-precios">
                  <p><strong>🕒 Rangos de Precios:</strong></p>
                  <div class="rangos-lista">
                    <div v-for="(rango, index) in evento.priceRanges" :key="index" class="rango-item">
                      <span class="rango-horario">{{ rango.startTime }} - {{ rango.endTime }}</span>
                      <span class="rango-precio">Bs. {{ rango.price }}</span>
                      <span v-if="rango.name && rango.name !== `${rango.startTime} - ${rango.endTime}`" class="rango-nombre">({{ rango.name }})</span>
                    </div>
                  </div>
                </div>
                <div v-else class="sin-rangos">
                  <p><em>📋 Sin rangos de precios específicos - se usa precio base</em></p>
                </div>
              </div>
              
              <div class="evento-footer">
                <span class="evento-estado-badge" :class="getEstadoBadgeClass(evento.status)">
                  {{ evento.status.toUpperCase() }}
                </span>
                
                <div class="estado-controles">
                  <button 
                    v-if="evento.status === 'draft'" 
                    @click="cambiarEstadoEvento(evento, 'active')"
                    class="btn-activar"
                  >
                    Activar
                  </button>
                  <button 
                    v-if="evento.status === 'active'" 
                    @click="cambiarEstadoEvento(evento, 'paused')"
                    class="btn-pausar"
                  >
                    Pausar
                  </button>
                  <button 
                    v-if="evento.status === 'paused'" 
                    @click="cambiarEstadoEvento(evento, 'active')"
                    class="btn-reactivar"
                  >
                    Reactivar
                  </button>
                </div>
              </div>
              
              <div v-if="evento.description" class="evento-descripcion">
                <p><strong>Descripción:</strong> {{ evento.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <!-- SECCIÓN VENTA DE ENTRADAS -->
      <section v-else-if="seccionActiva === 'vender'" class="seccion-contenido">
        <div class="contenido-card">
          
          <!-- Paso 1: Selección de Evento y Venta Rápida -->
          <div v-if="pasoVenta === 1" class="paso-venta">
            <div class="paso-header">
              <h3>🚀 Venta Rápida de Entradas</h3>
              <p>Selecciona evento y cantidad - ¡Se genera inmediatamente!</p>
            </div>
            
            <div v-if="cargandoEventos" class="loading-container">
              <div class="loading-spinner"></div>
              <p>Cargando eventos disponibles...</p>
            </div>
            
            <div v-else class="eventos-venta-grid">
              <div v-if="eventosVenta.length === 0" class="no-eventos-venta">
                <h4>😔 No hay eventos disponibles para venta</h4>
                <p>No se encontraron eventos activos o próximos a iniciarse.</p>
                <button @click="seccionActiva = 'eventos'" class="btn-ir-eventos">
                  📅 Crear Nuevo Evento
                </button>
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
                  
                  <!-- Precio actual -->
                  <div class="precio-actual">
                    <span class="precio-label">Precio actual:</span>
                    <span class="precio-valor">Bs. {{ calcularPrecioActual(evento) }}</span>
                  </div>
                  
                  <!-- Rangos de precios si existen -->
                  <div v-if="evento.priceRanges && evento.priceRanges.length > 0" class="rangos-mini">
                    <p class="rangos-titulo">🕒 Rangos disponibles:</p>
                    <div class="rangos-mini-lista">
                      <span v-for="rango in evento.priceRanges" :key="rango.startTime" class="rango-mini">
                        {{ rango.startTime }}-{{ rango.endTime }}: Bs.{{ rango.price }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div class="evento-venta-accion">
                  <button class="btn-seleccionar">
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
              <button @click="seccionActiva = 'estadisticas'" class="btn-ver-ventas">
                � VER ESTADÍSTICAS
              </button>
            </div>
          </div>
          
        </div>
      </section>
      
      <!-- SECCIÓN GENERADOR DE QR PARA ENTRADAS -->
      <section v-else-if="seccionActiva === 'generar-qr'" class="seccion-contenido">
        <GeneradorQREntradas />
      </section>
      
      <!-- SECCIÓN ESCÁNER QR -->
      <section v-else-if="seccionActiva === 'scanner'" class="seccion-contenido">
        <div class="contenido-card">
          
          <!-- Estado del Escáner -->
          <div class="scanner-status">
            <div class="status-indicator" :class="{ 
              'active': scannerActive && !processingQR && scanInterval, 
              'inactive': !scannerActive, 
              'processing': processingQR,
              'paused': scannerActive && !scanInterval && !processingQR
            }">
              <span class="status-icon">
                {{ processingQR ? '⏳' : 
                   (scannerActive && !scanInterval && !processingQR) ? '⏸️' : 
                   scannerActive ? '📹' : '📱' }}
              </span>
              <span class="status-text">
                {{ processingQR ? 'Procesando QR...' : 
                   (scannerActive && !scanInterval && !processingQR) ? 'ESCÁNER PAUSADO' :
                   scannerActive ? 'ESCÁNER ACTIVO' : 'ESCÁNER INACTIVO' }}
              </span>
            </div>
            
            <button @click="toggleScanner" class="btn-toggle-scanner" :disabled="processingQR">
              {{ scannerActive ? 'DETENER ESCÁNER' : 'ACTIVAR ESCÁNER' }}
            </button>
          </div>
          
          <!-- Área del Escáner -->
          <div class="scanner-area">
            <div class="camera-container">
              <video ref="videoElement" v-show="scannerActive" autoplay playsinline></video>
              <canvas ref="canvasElement" style="display: none;"></canvas>
              
              <!-- Overlay de escáner -->
              <div v-if="scannerActive" class="scanner-overlay">
                <div class="scan-frame">
                  <div class="scan-corner top-left"></div>
                  <div class="scan-corner top-right"></div>
                  <div class="scan-corner bottom-left"></div>
                  <div class="scan-corner bottom-right"></div>
                  <div class="scan-line" :class="{ 'scanning': scannerActive }"></div>
                </div>
                <p class="scan-instructions">
                  Enfoca el código QR dentro del marco
                </p>
              </div>
              
              <!-- Placeholder cuando no está activo -->
              <div v-else class="scanner-placeholder">
                <div class="placeholder-content">
                  <div class="placeholder-icon">�</div>
                  <h3>Escáner QR Inactivo</h3>
                  <p>Presiona "ACTIVAR ESCÁNER" para comenzar</p>
                </div>
              </div>
            </div>
            
            <!-- Input manual alternativo -->
            <div class="manual-input">
              <h4>📝 Entrada Manual (Alternativa)</h4>
              <div class="manual-input-row">
                <input 
                  v-model="manualQRCode" 
                  type="text" 
                  placeholder="Pega o escribe el código QR aquí" 
                  class="manual-qr-input"
                  @keyup.enter="validateManualQR"
                />
                <button @click="validateManualQR" :disabled="!manualQRCode || processingQR" class="btn-validate-manual">
                  VALIDAR
                </button>
              </div>
            </div>
          </div>
          
          <!-- Estado de última validación (info compacta) -->
          <div v-if="lastValidationResult" class="last-validation-info" :class="lastValidationResult.success ? 'success-info' : 'error-info'">
            <span class="validation-icon">{{ lastValidationResult.success ? '✅' : '❌' }}</span>
            <span class="validation-summary">
              Última: {{ lastValidationResult.success ? 'VÁLIDA' : 'INVÁLIDA' }} - 
              {{ lastValidationResult.ticket?.ticketNumber || lastValidationResult.message }}
            </span>
            <small class="validation-time">{{ formatearFecha(lastValidationResult.timestamp) }}</small>
          </div>
          
          <!-- Historial de validaciones recientes -->
          <div class="validation-history">
            <h4>📋 Últimas Validaciones</h4>
            <div v-if="validationHistory.length === 0" class="no-history">
              <p>No hay validaciones recientes</p>
            </div>
            
            <div v-else class="history-list">
              <div v-for="validation in validationHistory" :key="validation.id" 
                   class="history-item" :class="validation.success ? 'success' : 'error'">
                <div class="history-icon">
                  {{ validation.success ? '✅' : '❌' }}
                </div>
                <div class="history-details">
                  <div class="history-main">
                    <strong>{{ validation.success ? 'VÁLIDA' : 'INVÁLIDA' }}</strong>
                    <span class="history-ticket">{{ validation.ticketNumber || validation.qrCode?.substring(0, 10) }}...</span>
                  </div>
                  <div class="history-meta">
                    <small>{{ formatearFecha(validation.timestamp) }} - {{ validation.message }}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>
      
      <!-- SECCIÓN FILTRAR -->
      <section v-else-if="seccionActiva === 'filtrar'" class="seccion-contenido">
        <div class="contenido-card">
          <div class="filtros-container">
            <h3>🔽 Filtrar Visitantes</h3>
            <p>Funcionalidad de filtros próximamente</p>
          </div>
        </div>
      </section>

      <!-- SECCIÓN TRABAJADORES -->
      <section v-else-if="seccionActiva === 'trabajadores'" class="seccion-contenido">
        <TrabajadoresList />
      </section>

      <!-- SECCIÓN PARTICIPANTES -->
      <section v-else-if="seccionActiva === 'participantes'" class="seccion-contenido">
        <ParticipantesList />
      </section>

    </main>

    <!-- MODAL NUEVO USUARIO -->
    <div v-if="mostrarNuevoUsuario" class="modal-overlay" @click.self="mostrarNuevoUsuario = false">
      <div class="modal-content">
        <h3>👤 Nuevo Usuario</h3>
        <form @submit.prevent="crearUsuario">
          <input v-model="nuevoUsuario.nombre" placeholder="Nombre completo" required>
          <input v-model="nuevoUsuario.email" type="email" placeholder="Email" required>
          <input v-model="nuevoUsuario.password" type="password" placeholder="Contraseña" required>
          <select v-model="nuevoUsuario.rol" required>
            <option value="">Seleccionar rol</option>
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor</option>
            <option value="control">Control</option>
          </select>
          <div class="modal-actions">
            <button type="submit" class="btn-guardar" :disabled="cargando">
              {{ cargando ? 'Guardando...' : 'Guardar' }}
            </button>
            <button type="button" @click="mostrarNuevoUsuario = false" class="btn-cancelar" :disabled="cargando">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL EDITAR USUARIO -->
    <div v-if="mostrarEditarUsuario" class="modal-overlay" @click.self="cancelarEdicion">
      <div class="modal-content">
        <h3>✏️ Editar Usuario</h3>
        <form @submit.prevent="actualizarUsuario">
          <div class="campo-info">
            <label>ID del usuario:</label>
            <span class="usuario-id">{{ usuarioEditando.id }}</span>
          </div>
          
          <input 
            v-model="usuarioEditando.nombre" 
            placeholder="Nombre completo" 
            required
          >
          
          <input 
            v-model="usuarioEditando.email" 
            type="email" 
            placeholder="Email" 
            required
          >
          
          <input 
            v-model="usuarioEditando.password" 
            type="password" 
            placeholder="Nueva contraseña (opcional)"
          >
          <p class="password-hint">💡 Deja vacío para mantener la contraseña actual</p>
          
          <select v-model="usuarioEditando.rol" required>
            <option value="">Seleccionar rol</option>
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor</option>
            <option value="control">Control</option>
          </select>
          
          <div class="modal-actions">
            <button type="submit" class="btn-guardar" :disabled="cargando">
              {{ cargando ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <button type="button" @click="cancelarEdicion" class="btn-cancelar" :disabled="cargando">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL NUEVO EVENTO -->
    <div v-if="mostrarNuevoEvento" class="modal-overlay" @click.self="mostrarNuevoEvento = false">
      <div class="modal-card">
        <h3>
          ➕ Crear Nuevo Evento
          <button type="button" @click="mostrarNuevoEvento = false" class="btn-cerrar-modal">✕</button>
        </h3>
        <form @submit.prevent="crearEvento">
          <div class="form-group">
            <label for="evento-nombre">Nombre del Evento *</label>
            <input 
              id="evento-nombre"
              type="text" 
              v-model="nuevoEvento.name" 
              placeholder="Ej: FEIPOBOL 2025 - Día 1"
              maxlength="200"
              required
            />
          </div>

          <div class="form-group">
            <label for="evento-ubicacion">Ubicación *</label>
            <input 
              id="evento-ubicacion"
              type="text" 
              v-model="nuevoEvento.location" 
              placeholder="Ej: Campo Ferial Chuquiago Marka"
              maxlength="255"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="evento-inicio">Fecha y Hora de Inicio *</label>
              <input 
                id="evento-inicio"
                type="datetime-local" 
                v-model="nuevoEvento.startDate" 
                required
              />
            </div>

            <div class="form-group">
              <label for="evento-fin">Fecha y Hora de Fin *</label>
              <input 
                id="evento-fin"
                type="datetime-local" 
                v-model="nuevoEvento.endDate" 
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="evento-capacidad">Capacidad Máxima *</label>
              <input 
                id="evento-capacidad"
                type="number" 
                v-model="nuevoEvento.maxCapacity" 
                min="1"
                max="100000"
                required
              />
            </div>

            <div class="form-group">
              <label for="evento-precio">Precio Base (Bs.) *</label>
              <input 
                id="evento-precio"
                type="number" 
                v-model="nuevoEvento.basePrice" 
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="evento-descripcion">Descripción</label>
            <textarea 
              id="evento-descripcion"
              v-model="nuevoEvento.description" 
              placeholder="Descripción del evento (opcional)"
              rows="3"
            ></textarea>
          </div>

          <!-- SECCIÓN RANGOS DE PRECIOS -->
          <div class="rangos-precio-seccion">
            <h4>🕒 Rangos de Precios por Horarios</h4>
            <p class="rangos-info">Ejemplo: "Noche de Rock" - 19:00 a 21:00: 20bs, 21:01 a 22:10: 40bs</p>
            
            <!-- Lista de rangos actuales -->
            <div v-if="nuevoEvento.priceRanges.length > 0" class="rangos-actuales">
              <div v-for="(rango, index) in nuevoEvento.priceRanges" :key="index" class="rango-actual">
                <span class="rango-display">
                  {{ rango.startTime }} - {{ rango.endTime }}: <strong>Bs. {{ rango.price }}</strong>
                  <span v-if="rango.name" class="rango-nombre-display">({{ rango.name }})</span>
                </span>
                <div class="rango-acciones">
                  <button type="button" @click="editarRango(index, false)" class="btn-editar-rango">✏️</button>
                  <button type="button" @click="eliminarRango(index, false)" class="btn-eliminar-rango">🗑️</button>
                </div>
              </div>
            </div>
            
            <!-- Formulario para agregar nuevo rango -->
            <div class="agregar-rango-form">
              <div class="form-row-rango">
                <div class="form-group-small">
                  <label>Hora Inicio</label>
                  <input 
                    type="time" 
                    v-model="nuevoRango.startTime"
                    placeholder="19:00"
                  />
                </div>
                <div class="form-group-small">
                  <label>Hora Fin</label>
                  <input 
                    type="time" 
                    v-model="nuevoRango.endTime"
                    placeholder="21:00"
                  />
                </div>
                <div class="form-group-small">
                  <label>Precio (Bs.)</label>
                  <input 
                    type="number" 
                    v-model="nuevoRango.price"
                    min="0"
                    step="0.01"
                    placeholder="20"
                  />
                </div>
                <div class="form-group-small">
                  <label>Nombre (Opcional)</label>
                  <input 
                    type="text" 
                    v-model="nuevoRango.name"
                    placeholder="Entrada temprana"
                    maxlength="50"
                  />
                </div>
                <div class="form-group-small">
                  <button type="button" @click="agregarRango(false)" class="btn-agregar-rango">
                    ➕ Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-guardar" :disabled="cargandoEventos">
              {{ cargandoEventos ? 'Creando...' : 'Crear Evento' }}
            </button>
            <button type="button" @click="mostrarNuevoEvento = false" class="btn-cancelar" :disabled="cargandoEventos">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL EDITAR EVENTO -->
    <div v-if="mostrarEditarEvento" class="modal-overlay" @click.self="mostrarEditarEvento = false">
      <div class="modal-card">
        <h3>
          ✏️ Editar Evento
          <button type="button" @click="cancelarEdicionEvento" class="btn-cerrar-modal">✕</button>
        </h3>
        <form @submit.prevent="actualizarEvento">
          <div class="form-group">
            <label for="evento-editar-nombre">Nombre del Evento *</label>
            <input 
              id="evento-editar-nombre"
              type="text" 
              v-model="eventoEditando.name" 
              placeholder="Ej: FEIPOBOL 2025 - Día 1"
              maxlength="200"
              required
            />
          </div>

          <div class="form-group">
            <label for="evento-editar-ubicacion">Ubicación *</label>
            <input 
              id="evento-editar-ubicacion"
              type="text" 
              v-model="eventoEditando.location" 
              placeholder="Ej: Campo Ferial Chuquiago Marka"
              maxlength="255"
              required
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="evento-editar-inicio">Fecha y Hora de Inicio *</label>
              <input 
                id="evento-editar-inicio"
                type="datetime-local" 
                v-model="eventoEditando.startDate" 
                required
              />
            </div>

            <div class="form-group">
              <label for="evento-editar-fin">Fecha y Hora de Fin *</label>
              <input 
                id="evento-editar-fin"
                type="datetime-local" 
                v-model="eventoEditando.endDate" 
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="evento-editar-capacidad">Capacidad Máxima *</label>
              <input 
                id="evento-editar-capacidad"
                type="number" 
                v-model="eventoEditando.maxCapacity" 
                min="1"
                max="100000"
                required
              />
            </div>

            <div class="form-group">
              <label for="evento-editar-precio">Precio Base (Bs.) *</label>
              <input 
                id="evento-editar-precio"
                type="number" 
                v-model="eventoEditando.basePrice" 
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div class="form-group">
            <label for="evento-editar-estado">Estado</label>
            <select id="evento-editar-estado" v-model="eventoEditando.status">
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="finished">Finalizado</option>
            </select>
          </div>

          <div class="form-group">
            <label for="evento-editar-descripcion">Descripción</label>
            <textarea 
              id="evento-editar-descripcion"
              v-model="eventoEditando.description" 
              placeholder="Descripción del evento (opcional)"
              rows="3"
            ></textarea>
          </div>

          <!-- SECCIÓN RANGOS DE PRECIOS -->
          <div class="rangos-precio-seccion">
            <h4>🕒 Rangos de Precios por Horarios</h4>
            <p class="rangos-info">Ejemplo: "Noche de Rock" - 19:00 a 21:00: 20bs, 21:01 a 22:10: 40bs</p>
            
            <!-- Lista de rangos actuales -->
            <div v-if="eventoEditando.priceRanges.length > 0" class="rangos-actuales">
              <div v-for="(rango, index) in eventoEditando.priceRanges" :key="index" class="rango-actual">
                <span class="rango-display">
                  {{ rango.startTime }} - {{ rango.endTime }}: <strong>Bs. {{ rango.price }}</strong>
                  <span v-if="rango.name" class="rango-nombre-display">({{ rango.name }})</span>
                </span>
                <div class="rango-acciones">
                  <button type="button" @click="editarRango(index, true)" class="btn-editar-rango">✏️</button>
                  <button type="button" @click="eliminarRango(index, true)" class="btn-eliminar-rango">🗑️</button>
                </div>
              </div>
            </div>
            
            <!-- Formulario para agregar nuevo rango -->
            <div class="agregar-rango-form">
              <div class="form-row-rango">
                <div class="form-group-small">
                  <label>Hora Inicio</label>
                  <input 
                    type="time" 
                    v-model="nuevoRango.startTime"
                    placeholder="19:00"
                  />
                </div>
                <div class="form-group-small">
                  <label>Hora Fin</label>
                  <input 
                    type="time" 
                    v-model="nuevoRango.endTime"
                    placeholder="21:00"
                  />
                </div>
                <div class="form-group-small">
                  <label>Precio (Bs.)</label>
                  <input 
                    type="number" 
                    v-model="nuevoRango.price"
                    min="0"
                    step="0.01"
                    placeholder="20"
                  />
                </div>
                <div class="form-group-small">
                  <label>Nombre (Opcional)</label>
                  <input 
                    type="text" 
                    v-model="nuevoRango.name"
                    placeholder="Entrada temprana"
                    maxlength="50"
                  />
                </div>
                <div class="form-group-small">
                  <button type="button" @click="agregarRango(true)" class="btn-agregar-rango">
                    ➕ Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn-guardar" :disabled="cargandoEventos">
              {{ cargandoEventos ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <button type="button" @click="cancelarEdicionEvento" class="btn-cancelar" :disabled="cargandoEventos">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL SELECCIÓN DE CANTIDAD DE PERSONAS -->
    <div v-if="showPersonCountModal" class="modal-overlay" @click="cancelPersonCount">
      <div class="modal-content person-count-modal" @click.stop>
        <div class="modal-header">
          <h3>🎫 Seleccionar cantidad de personas</h3>
          <button @click="cancelPersonCount" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Loading spinner -->
          <div v-if="loadingTicketInfo" class="loading-ticket-info">
            <div class="spinner"></div>
            <p>Obteniendo información del ticket...</p>
          </div>
          
          <!-- Información del ticket -->
          <div v-else>
            <div class="ticket-info-summary" v-if="currentTicketInfo">
              <div class="info-row">
                <span class="label">🎫 Ticket:</span>
                <span class="value">{{ currentTicketInfo.ticketNumber }}</span>
              </div>
              <div class="info-row">
                <span class="label">👤 Comprador:</span>
                <span class="value">{{ currentTicketInfo.buyer.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">🏟️ Evento:</span>
                <span class="value">{{ currentTicketInfo.event.name }}</span>
              </div>
              <div class="info-row entries-status">
                <span class="label">📊 Estado:</span>
                <span class="value">
                  <strong class="used">{{ currentTicketInfo.usedEntries }}</strong> / 
                  <strong class="total">{{ currentTicketInfo.totalEntries }}</strong> 
                  entradas utilizadas
                </span>
              </div>
              <div class="info-row remaining">
                <span class="label">⚡ Disponibles:</span>
                <span class="value remaining-count">{{ currentTicketInfo.remainingEntries }} entrada(s)</span>
              </div>
              <div v-if="currentTicketInfo.lastValidation" class="info-row last-validation">
                <span class="label">🕒 Última validación:</span>
                <span class="value">{{ formatDateTime(currentTicketInfo.lastValidation.validatedAt) }}</span>
              </div>
            </div>
            
            <div class="qr-info">
              <strong>QR Code:</strong> {{ pendingQRCode }}
            </div>
            
            <div class="person-count-selector">
              <label for="personCount">
                ¿Cuántas personas van a ingresar con este ticket?
                <span v-if="currentTicketInfo" class="available-info">
                  (Máximo {{ currentTicketInfo.remainingEntries }} disponible(s))
                </span>
              </label>
            
            <div class="count-controls">
              <button 
                type="button" 
                @click="selectedPersonCount = Math.max(1, selectedPersonCount - 1)"
                :disabled="selectedPersonCount <= 1"
                class="count-btn minus">
                −
              </button>
              
              <input 
                id="personCount"
                v-model.number="selectedPersonCount" 
                type="number" 
                min="1" 
                :max="maxPersonsAllowed"
                class="count-input"
              />
              
              <button 
                type="button" 
                @click="selectedPersonCount = Math.min(maxPersonsAllowed, selectedPersonCount + 1)"
                :disabled="selectedPersonCount >= maxPersonsAllowed"
                class="count-btn plus">
                +
              </button>
            </div>
            
            <p class="count-info">
              Mín: 1 persona • Máx: {{ maxPersonsAllowed }} personas
            </p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="cancelPersonCount" class="btn-secondary">
            Cancelar
          </button>
          <button @click="confirmPersonCount" class="btn-primary" :disabled="selectedPersonCount < 1">
            Validar {{ selectedPersonCount }} persona{{ selectedPersonCount !== 1 ? 's' : '' }}
          </button>
        </div>
      </div>
    </div>

    <!-- COMPONENTE RESULTADO DE VALIDACIÓN QR -->
    <QRValidResult 
      v-if="showValidationResult && lastValidationResult"
      :result="lastValidationResult"
      @close="handleValidationResultClose"
    />

  </div>
</template>
<script>
export default {
  name: 'DashboardAdmin',
  data() {
    return {
      // state managed in <script setup>
    }
  },
  methods: {
    // ...otros métodos
    salir() {
      localStorage.clear()
      window.location.href = '/login'
    },
    // irAStaff removed when staff module was uninstalled from sidebar
  }
}
</script>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import apiClient, { userService, eventService, ticketService, validationService, accessService } from '@/services/api'
import QRValidResult from './QRValidResult.vue'
import TrabajadoresList from './TrabajadoresList.vue'
import ParticipantesList from './ParticipantesList.vue'
import GeneradorQREntradas from './GeneradorQREntradas.vue'
import jsQR from 'jsqr'

const usuario = ref({})

// Control de acceso
const sistemaAccesoActivo = ref(true)
const cargandoToggle = ref(false)

const estadisticas = ref({
  totalVentas: 0,
  totalUsuarios: 0,
  entradasVendidas: 0,
  validacionesHoy: 0
})

const usuarios = ref([])
const tickets = ref([])
const cargando = ref(false)
const error = ref('')

const ventasPorDia = ref([
  { dia: 'Lun', cantidad: 45 },
  { dia: 'Mar', cantidad: 78 },
  { dia: 'Mie', cantidad: 62 },
  { dia: 'Jue', cantidad: 89 },
  { dia: 'Vie', cantidad: 124 },
  { dia: 'Sab', cantidad: 156 },
  { dia: 'Dom', cantidad: 98 }
])

const filtroReporte = ref('semana')
const mostrarNuevoUsuario = ref(false)
const mostrarEditarUsuario = ref(false)
const mostrarNuevoEvento = ref(false)
const mostrarEditarEvento = ref(false)
const seccionActiva = ref('usuarios') // Sección por defecto

// Variables para responsive
const sidebarOpen = ref(false)

// Variables para usuarios
const nuevoUsuario = ref({
  nombre: '',
  email: '',
  password: '',
  rol: ''
})

const usuarioEditando = ref({
  id: null,
  nombre: '',
  email: '',
  rol: '',
  password: '' // Opcional para edición
})

// Variables para eventos
const eventos = ref([])
const cargandoEventos = ref(false)
const errorEventos = ref('')

// Variables para venta de entradas
const pasoVenta = ref(1)
const eventosVenta = ref([])
const eventoSeleccionado = ref(null)
const procesandoVenta = ref(false)
const ticketsGenerados = ref([])

const datosVenta = ref({
  buyerName: '',
  buyerEmail: '',
  buyerPhone: '',
  buyerDocument: '',
  quantity: 1,
  paymentMethod: 'cash',
  paymentReference: '',
  notes: ''
})

// Variables para escáner QR
const scannerActive = ref(false)
const processingQR = ref(false)
const manualQRCode = ref('')
const lastValidationResult = ref(null)
const showValidationResult = ref(false)
const validationHistory = ref([])
const videoStream = ref(null)
const scanInterval = ref(null)

// Variables para selección de cantidad de personas
const showPersonCountModal = ref(false)
const pendingQRCode = ref('')
const selectedPersonCount = ref(1)
const maxPersonsAllowed = ref(10)
const wasScanningBeforePause = ref(false)
const currentTicketInfo = ref(null)
const loadingTicketInfo = ref(false)

const nuevoEvento = ref({
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  maxCapacity: 100,
  basePrice: 0,
  status: 'draft',
  priceRanges: []
})

const eventoEditando = ref({
  id: null,
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  maxCapacity: 100,
  basePrice: 0,
  status: 'draft',
  priceRanges: []
})

// Variables para rangos de precios
const nuevoRango = ref({
  startTime: '',
  endTime: '', 
  price: 0,
  name: ''
})

const editandoRango = ref({
  index: -1,
  startTime: '',
  endTime: '',
  price: 0,
  name: ''
})

// Computed
const maxVentas = computed(() => {
  return Math.max(...ventasPorDia.value.map(v => v.cantidad))
})

const totalVendido = computed(() => {
  return ventasPorDia.value.reduce((sum, v) => sum + (v.cantidad * 50), 0)
})

const totalEntradas = computed(() => {
  return ventasPorDia.value.reduce((sum, v) => sum + v.cantidad, 0)
})

const promedioVentas = computed(() => {
  return Math.round(totalVendido.value / ventasPorDia.value.length)
})

// Computed para venta de entradas
const precioCalculado = computed(() => {
  if (!eventoSeleccionado.value) return 0
  return calcularPrecioActual(eventoSeleccionado.value)
})

const precioTotal = computed(() => {
  return precioCalculado.value * datosVenta.value.quantity
})

const entradasDisponibles = computed(() => {
  if (!eventoSeleccionado.value) return 0
  return eventoSeleccionado.value.maxCapacity - (eventoSeleccionado.value.currentSold || 0)
})

// Métodos
const formatearFecha = (fecha) => {
  return fecha.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A'
  const date = new Date(dateTime)
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Métodos para usuarios
const cargarUsuarios = async () => {
  cargando.value = true
  error.value = '' // Limpiar errores anteriores
  
  console.log('🔄 Cargando usuarios desde API...')
  const response = await userService.getAllUsers()
  
  console.log('📊 Respuesta de usuarios:', response)
  
  if (response.success) {
    usuarios.value = Array.isArray(response.data) ? response.data : []
    console.log('✅ Usuarios cargados exitosamente:', usuarios.value)
  } else {
    error.value = response.error
    console.error('❌ Error cargando usuarios:', response.error)
    
    // Fallback: usar usuarios de ejemplo si falla la API
    usuarios.value = [
      { id: 1, nombre: 'Carlos Admin', email: 'admin@sisqr6.com', rol: 'admin' },
      { id: 2, nombre: 'María Ventas', email: 'vendedor@sisqr6.com', rol: 'vendedor' },
      { id: 3, nombre: 'José Control', email: 'control@sisqr6.com', rol: 'control' }
    ]
    console.log('🔄 Usando usuarios de fallback')
  }
  cargando.value = false
}

const cargarEstadisticas = async () => {
  console.log('📈 Cargando estadísticas desde API...')
  const response = await ticketService.getStats()
  
  console.log('📊 Respuesta de estadísticas:', response)
  
  if (response.success) {
    estadisticas.value = response.data
    console.log('✅ Estadísticas cargadas:', estadisticas.value)
  } else {
    console.error('❌ Error cargando estadísticas:', response.error)
    
    // Fallback: usar estadísticas de ejemplo
    estadisticas.value = {
      totalVentas: 15420,
      totalUsuarios: 25,
      entradasVendidas: 342,
      validacionesHoy: 89
    }
    console.log('🔄 Usando estadísticas de fallback')
  }
}

const crearUsuario = async () => {
  if (!nuevoUsuario.value.nombre || !nuevoUsuario.value.email || !nuevoUsuario.value.password || !nuevoUsuario.value.rol) {
    alert('Por favor completa todos los campos')
    return
  }

  cargando.value = true
  
  // SIEMPRE usar backend real
  console.log('📡 Creando usuario en backend real')
  const response = await userService.createUser(nuevoUsuario.value)
  
  if (response.success) {
    // Asegurar que usuarios.value sea un array
    if (!Array.isArray(usuarios.value)) {
      usuarios.value = []
    }
    usuarios.value.push(response.data)
    // Limpiar formulario
    nuevoUsuario.value = { nombre: '', email: '', password: '', rol: '' }
    mostrarNuevoUsuario.value = false
    alert('Usuario creado exitosamente!')
  } else {
    error.value = response.error
    alert(`Error: ${response.error}`)
  }
  
  cargando.value = false
}

const editarUsuario = (usuario) => {
  console.log('📝 Editando usuario:', usuario)
  
  // Cargar datos del usuario en el formulario de edición
  usuarioEditando.value = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    password: '' // La contraseña se deja vacía por seguridad
  }
  
  mostrarEditarUsuario.value = true
}

const eliminarUsuario = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este usuario?')) {
    return
  }

  cargando.value = true
  
  // SIEMPRE usar backend real
  console.log('📡 Eliminando usuario en backend real')
  const response = await userService.deleteUser(id)
  
  if (response.success) {
    usuarios.value = usuarios.value.filter(u => u.id !== id)
    alert('Usuario eliminado exitosamente')
  } else {
    error.value = response.error
    alert(`Error: ${response.error}`)
  }
  
  cargando.value = false
}

const actualizarUsuario = async () => {
  if (!usuarioEditando.value.nombre || !usuarioEditando.value.email || !usuarioEditando.value.rol) {
    alert('Por favor completa los campos obligatorios (nombre, email, rol)')
    return
  }

  cargando.value = true
  
  console.log('📡 Actualizando usuario en backend real')
  const datosActualizacion = {
    nombre: usuarioEditando.value.nombre,
    email: usuarioEditando.value.email,
    rol: usuarioEditando.value.rol
  }
  
  // Solo incluir password si se proporcionó uno nuevo
  if (usuarioEditando.value.password && usuarioEditando.value.password.trim() !== '') {
    datosActualizacion.password = usuarioEditando.value.password
  }
  
  const response = await userService.updateUser(usuarioEditando.value.id, datosActualizacion)
  
  if (response.success) {
    // Actualizar el usuario en la lista local
    const index = usuarios.value.findIndex(u => u.id === usuarioEditando.value.id)
    if (index !== -1) {
      usuarios.value[index] = { ...usuarios.value[index], ...response.data }
    }
    
    // Cerrar modal y limpiar formulario
    mostrarEditarUsuario.value = false
    usuarioEditando.value = { id: null, nombre: '', email: '', rol: '', password: '' }
    
    alert('Usuario actualizado exitosamente!')
  } else {
    error.value = response.error
    alert(`Error: ${response.error}`)
  }
  
  cargando.value = false
}

const cancelarEdicion = () => {
  mostrarEditarUsuario.value = false
  usuarioEditando.value = { id: null, nombre: '', email: '', rol: '', password: '' }
}

// ============= FUNCIONES DE EVENTOS =============

const cargarEventos = async () => {
  console.log('🎪 Cargando eventos desde backend real')
  cargandoEventos.value = true
  errorEventos.value = ''
  
  const response = await eventService.getAllEvents()
  
  if (response.success) {
    eventos.value = Array.isArray(response.data) ? response.data : []
    console.log('✅ Eventos cargados:', eventos.value.length)
  } else {
    errorEventos.value = response.error
    console.error('❌ Error cargando eventos:', response.error)
    eventos.value = []
  }
  
  cargandoEventos.value = false
}

const crearEvento = async () => {
  if (!nuevoEvento.value.name || !nuevoEvento.value.location || !nuevoEvento.value.startDate || !nuevoEvento.value.endDate) {
    alert('Por favor completa todos los campos obligatorios')
    return
  }

  if (new Date(nuevoEvento.value.endDate) <= new Date(nuevoEvento.value.startDate)) {
    alert('La fecha de fin debe ser posterior a la fecha de inicio')
    return
  }

  // Validar rangos de precios
  const validacionRangos = validarRangos(nuevoEvento.value.priceRanges)
  if (!validacionRangos.valid) {
    alert(`Error en rangos de precios: ${validacionRangos.message}`)
    return
  }

  cargandoEventos.value = true
  
  console.log('📡 Creando evento en backend real')
  const response = await eventService.createEvent(nuevoEvento.value)
  
  if (response.success) {
    if (!Array.isArray(eventos.value)) {
      eventos.value = []
    }
    eventos.value.push(response.data)
    
    // Limpiar formulario
    nuevoEvento.value = {
      name: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      maxCapacity: 100,
      basePrice: 0,
      status: 'draft',
      priceRanges: []
    }
    mostrarNuevoEvento.value = false
    alert('Evento creado exitosamente!')
  } else {
    errorEventos.value = response.error
    alert(`Error: ${response.error}`)
  }
  
  cargandoEventos.value = false
}

const editarEvento = (evento) => {
  console.log('📝 Editando evento:', evento)
  
  // Formatear fechas para input datetime-local
  const formatDate = (date) => {
    const d = new Date(date)
    return d.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
  }
  
  eventoEditando.value = {
    id: evento.id,
    name: evento.name,
    description: evento.description || '',
    location: evento.location,
    startDate: formatDate(evento.startDate),
    endDate: formatDate(evento.endDate),
    maxCapacity: evento.maxCapacity,
    basePrice: evento.basePrice,
    status: evento.status,
    priceRanges: evento.priceRanges ? [...evento.priceRanges] : []
  }
  
  mostrarEditarEvento.value = true
}

const actualizarEvento = async () => {
  if (!eventoEditando.value.name || !eventoEditando.value.location || !eventoEditando.value.startDate || !eventoEditando.value.endDate) {
    alert('Por favor completa todos los campos obligatorios')
    return
  }

  if (new Date(eventoEditando.value.endDate) <= new Date(eventoEditando.value.startDate)) {
    alert('La fecha de fin debe ser posterior a la fecha de inicio')
    return
  }

  // Validar rangos de precios
  const validacionRangos = validarRangos(eventoEditando.value.priceRanges)
  if (!validacionRangos.valid) {
    alert(`Error en rangos de precios: ${validacionRangos.message}`)
    return
  }

  cargandoEventos.value = true
  
  const datosActualizacion = { ...eventoEditando.value }
  delete datosActualizacion.id // No enviar ID en el body
  
  const response = await eventService.updateEvent(eventoEditando.value.id, datosActualizacion)
  
  if (response.success) {
    // Actualizar el evento en la lista local
    const index = eventos.value.findIndex(e => e.id === eventoEditando.value.id)
    if (index !== -1) {
      eventos.value[index] = { ...eventos.value[index], ...response.data }
    }
    
    // Cerrar modal y limpiar formulario
    mostrarEditarEvento.value = false
    eventoEditando.value = {
      id: null,
      name: '',
      description: '',
      location: '',
      startDate: '',
      endDate: '',
      maxCapacity: 100,
      basePrice: 0,
      status: 'draft',
      priceRanges: []
    }
    
    alert('Evento actualizado exitosamente!')
  } else {
    errorEventos.value = response.error
    alert(`Error: ${response.error}`)
  }
  
  cargandoEventos.value = false
}

const eliminarEvento = async (id) => {
  if (!confirm('¿Estás seguro de eliminar este evento?')) {
    return
  }

  cargandoEventos.value = true
  
  const response = await eventService.deleteEvent(id)
  
  if (response.success) {
    eventos.value = eventos.value.filter(e => e.id !== id)
    alert('Evento eliminado exitosamente!')
  } else {
    errorEventos.value = response.error
    alert(`Error: ${response.error}`)
  }
  
  cargandoEventos.value = false
}

const cambiarEstadoEvento = async (evento, nuevoEstado) => {
  const response = await eventService.updateEventStatus(evento.id, nuevoEstado)
  
  if (response.success) {
    // Actualizar estado local
    const index = eventos.value.findIndex(e => e.id === evento.id)
    if (index !== -1) {
      eventos.value[index].status = nuevoEstado
    }
    alert(`Evento ${nuevoEstado === 'active' ? 'activado' : 'pausado'} exitosamente!`)
  } else {
    errorEventos.value = response.error
    alert(`Error: ${response.error}`)
  }
}

const cancelarEdicionEvento = () => {
  mostrarEditarEvento.value = false
  eventoEditando.value = {
    id: null,
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    maxCapacity: 100,
    basePrice: 0,
    status: 'draft',
    priceRanges: []
  }
}

const formatearFechaEvento = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEstadoBadgeClass = (estado) => {
  switch (estado) {
    case 'active': return 'estado-activo'
    case 'draft': return 'estado-borrador'
    case 'paused': return 'estado-pausado'
    case 'finished': return 'estado-finalizado'
    default: return 'estado-desconocido'
  }
}

// ============= FUNCIONES PARA RANGOS DE PRECIOS =============

const agregarRango = (esEdicion = false) => {
  if (!nuevoRango.value.startTime || !nuevoRango.value.endTime || nuevoRango.value.price <= 0) {
    alert('Por favor completa todos los campos del rango de precios')
    return
  }

  const rango = {
    startTime: nuevoRango.value.startTime,
    endTime: nuevoRango.value.endTime,
    price: parseFloat(nuevoRango.value.price),
    name: nuevoRango.value.name || `${nuevoRango.value.startTime} - ${nuevoRango.value.endTime}`
  }

  if (esEdicion) {
    eventoEditando.value.priceRanges.push(rango)
  } else {
    nuevoEvento.value.priceRanges.push(rango)
  }

  // Limpiar formulario de rango
  nuevoRango.value = {
    startTime: '',
    endTime: '',
    price: 0,
    name: ''
  }

  // Ordenar rangos por hora de inicio
  const rangos = esEdicion ? eventoEditando.value.priceRanges : nuevoEvento.value.priceRanges
  rangos.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

const eliminarRango = (index, esEdicion = false) => {
  if (confirm('¿Estás seguro de eliminar este rango de precios?')) {
    if (esEdicion) {
      eventoEditando.value.priceRanges.splice(index, 1)
    } else {
      nuevoEvento.value.priceRanges.splice(index, 1)
    }
  }
}

const editarRango = (index, esEdicion = false) => {
  const rangos = esEdicion ? eventoEditando.value.priceRanges : nuevoEvento.value.priceRanges
  const rango = rangos[index]
  
  editandoRango.value = {
    index,
    startTime: rango.startTime,
    endTime: rango.endTime,
    price: rango.price,
    name: rango.name
  }
  
  // Mostrar modal de edición de rango (implementar si es necesario)
  // Por ahora, simplemente copiar valores a nuevoRango para editar inline
  nuevoRango.value = {
    startTime: rango.startTime,
    endTime: rango.endTime,
    price: rango.price,
    name: rango.name
  }
  
  // Eliminar el rango actual para que se pueda re-agregar editado
  eliminarRango(index, esEdicion)
}

const validarRangos = (rangos) => {
  if (!rangos || rangos.length === 0) {
    return { valid: true, message: '' }
  }

  // Ordenar por hora de inicio para validación
  const rangosSorted = [...rangos].sort((a, b) => a.startTime.localeCompare(b.startTime))

  for (let i = 0; i < rangosSorted.length - 1; i++) {
    const actual = rangosSorted[i]
    const siguiente = rangosSorted[i + 1]
    
    if (actual.endTime >= siguiente.startTime) {
      return {
        valid: false,
        message: `Los rangos se solapan: ${actual.startTime}-${actual.endTime} y ${siguiente.startTime}-${siguiente.endTime}`
      }
    }
  }

  return { valid: true, message: '' }
}

const formatearRangosParaMostrar = (priceRanges) => {
  if (!priceRanges || priceRanges.length === 0) {
    return 'Sin rangos de precios específicos'
  }
  
  return priceRanges.map(range => 
    `${range.startTime}-${range.endTime}: Bs. ${range.price}${range.name && range.name !== `${range.startTime} - ${range.endTime}` ? ` (${range.name})` : ''}`
  ).join(' | ')
}

// ============= FUNCIONES PARA VENTA DE ENTRADAS =============

const cargarEventosVenta = async () => {
  console.log('🎪 Cargando eventos disponibles para venta')
  const response = await eventService.getAllEvents()
  
  if (response.success) {
    // Filtrar solo eventos activos y disponibles para venta
    eventosVenta.value = response.data.filter(evento => 
      evento.status === 'active' && 
      new Date(evento.endDate) > new Date() &&
      (evento.maxCapacity - (evento.currentSold || 0)) > 0
    )
    console.log('✅ Eventos para venta cargados:', eventosVenta.value.length)
  } else {
    errorEventos.value = response.error
    console.error('❌ Error cargando eventos para venta:', response.error)
  }
}

const calcularPrecioActual = (evento) => {
  if (!evento.priceRanges || evento.priceRanges.length === 0) {
    return parseFloat(evento.basePrice)
  }
  
  const ahora = new Date()
  const horaActual = ahora.getHours().toString().padStart(2, '0') + ':' + ahora.getMinutes().toString().padStart(2, '0')
  
  // Buscar el rango de precio aplicable
  for (const rango of evento.priceRanges) {
    if (horaActual >= rango.startTime && horaActual <= rango.endTime) {
      return parseFloat(rango.price)
    }
  }
  
  // Si no encuentra rango aplicable, usar precio base
  return parseFloat(evento.basePrice)
}

const seleccionarEvento = (evento) => {
  console.log('🎪 Evento seleccionado:', evento.name)
  eventoSeleccionado.value = evento
}

const siguientePaso = () => {
  if (pasoVenta.value === 1 && eventoSeleccionado.value) {
    pasoVenta.value = 2
    // Resetear datos del comprador
    datosVenta.value = {
      buyerName: '',
      buyerEmail: '',
      buyerPhone: '',
      buyerDocument: '',
      quantity: 1,
      paymentMethod: 'cash',
      paymentReference: '',
      notes: ''
    }
  }
}

const anteriorPaso = () => {
  if (pasoVenta.value > 1) {
    pasoVenta.value--
  }
}

const actualizarPrecioTotal = () => {
  // El computed se actualiza automáticamente
  console.log('💰 Precio total actualizado:', precioTotal.value)
}

const procesarVenta = async () => {
  if (!datosVenta.value.buyerName || !datosVenta.value.buyerDocument) {
    alert('Por favor completa los campos obligatorios: Nombre y Documento')
    return
  }

  if (datosVenta.value.quantity > entradasDisponibles.value) {
    alert(`Solo hay ${entradasDisponibles.value} entradas disponibles`)
    return
  }

  procesandoVenta.value = true
  
  try {
    console.log('🎫 Procesando venta de entrada...')
    
    const ventaData = {
      eventId: eventoSeleccionado.value.id,
      buyerName: datosVenta.value.buyerName,
      buyerEmail: datosVenta.value.buyerEmail || null,
      buyerPhone: datosVenta.value.buyerPhone || null,
      buyerDocument: datosVenta.value.buyerDocument,
      paymentMethod: datosVenta.value.paymentMethod,
      paymentReference: datosVenta.value.paymentReference || null,
      notes: datosVenta.value.notes || null,
      quantity: datosVenta.value.quantity
    }
    
    const response = await ticketService.sellTicket(ventaData)
    
    if (response.success) {
      console.log('✅ Venta exitosa:', response.data)
      
      // El backend ahora devuelve UN SOLO ticket con quantity
      const ticket = response.data.ticket
      if (!ticket) {
        throw new Error('No se recibió ticket del backend')
      }
      
      // Generar QR para el ticket único
      try {
        ticket.qrDataUrl = await generarQRDataUrl(ticket.qrCode)
        ticket.salePrice = ticket.totalPrice // Mantener compatibilidad
      } catch (error) {
        console.error('Error generando QR:', error)
        ticket.qrDataUrl = null
      }
      
      // Crear array con un solo ticket para mantener compatibilidad con el frontend
      ticketsGenerados.value = [ticket]
      
      pasoVenta.value = 3
      
      // Actualizar contador de entradas vendidas localmente
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
  // Por ahora retornamos un QR simple usando una API pública
  // En producción deberías usar una librería como qrcode
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrText)}`
}

// Venta rápida directa - sin formularios
const ventaRapidaDirecta = async () => {
  if (!eventoSeleccionado.value) {
    alert('Selecciona un evento primero')
    return
  }

  procesandoVenta.value = true
  
  try {
    console.log('🚀 Iniciando venta rápida directa...')
    console.log('🎯 Evento seleccionado:', eventoSeleccionado.value)
    console.log('🆔 Event ID:', eventoSeleccionado.value.id)
    console.log('🔢 Cantidad:', datosVenta.value.quantity)
    
    // Preparar datos mínimos para la venta rápida
    const datosVentaRapida = {
      eventId: eventoSeleccionado.value.id,
      quantity: datosVenta.value.quantity,
      buyerName: 'Cliente Venta Rápida', // Nombre válido sin números
      buyerDocument: `VR${Date.now().toString().slice(-8)}`, // Documento simplificado
      // No incluir campos opcionales vacíos - evita validación
      paymentMethod: 'cash',
      notes: 'Venta rápida - sin datos de comprador'
    }
    
    console.log('📝 Datos de venta rápida:', datosVentaRapida)
    
    const response = await ticketService.sellTicket(datosVentaRapida)
    
    console.log('🔍 RESPONSE COMPLETO:', JSON.stringify(response, null, 2))
    console.log('🔍 response.success:', response.success)
    console.log('🔍 response.error:', response.error)
    
    if (response.success) {
      console.log('✅ Venta rápida exitosa:', response)
      console.log('📦 Data del backend:', response.data)
      console.log('🔍 Tipo de response.data:', typeof response.data)
      console.log('🔍 Keys de response.data:', response.data ? Object.keys(response.data) : 'response.data es null/undefined')
      
      // Ahora el backend devuelve UN SOLO ticket (no un array)
      const ticket = response.data?.ticket
      
      console.log('🎫 Ticket extraído:', ticket)
      console.log('🔢 Cantidad de entradas:', ticket?.quantity || 0)
      console.log('📋 Datos del ticket:', ticket || 'No hay ticket')
      
      if (!ticket) {
        console.error('❌ Error: No se encontró ticket válido')
        console.error('❌ response.data completo:', JSON.stringify(response.data, null, 2))
        throw new Error('El backend no devolvió un ticket válido')
      }
      
      console.log('🎫 Ticket recibido del backend:', ticket)
      
      // Generar QR para el ticket único
      const qrDataUrl = await generarQRDataUrl(ticket.qrCode)
      const ticketConQR = { 
        ...ticket,
        qrDataUrl,
        salePrice: ticket.totalPrice, // El backend devuelve 'totalPrice' para múltiples entradas
        price: ticket.totalPrice, // También mantener 'price' para compatibilidad
        ticketNumber: ticket.ticketNumber,
        saleDate: new Date().toISOString()
      }
      
      // Crear array con un solo ticket para mantener compatibilidad
      const ticketsConQR = [ticketConQR]
      
      ticketsGenerados.value = ticketsConQR
      pasoVenta.value = 2 // Ir directo al paso de confirmación
      
      console.log('🎫 Tickets generados con QR:', ticketsConQR)
    } else {
      throw new Error(response.error || 'Error en la venta')
    }
    
  } catch (error) {
    console.error('❌ Error en venta rápida:', error)
    alert(`Error generando la entrada: ${error.message}`)
  } finally {
    procesandoVenta.value = false
  }
}

const nuevaVenta = () => {
  pasoVenta.value = 1
  eventoSeleccionado.value = null
  ticketsGenerados.value = []
  datosVenta.value = {
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    buyerDocument: '',
    quantity: 1,
    paymentMethod: 'cash',
    paymentReference: '',
    notes: ''
  }
  
  // Recargar eventos para actualizar disponibilidad
  cargarEventosVenta()
}

const imprimirTicket = (ticket) => {
  // Crear ventana de impresión
  const ventanaImpresion = window.open('', '_blank')
  
  const htmlContent = `
    <html>
      <head>
        <title>Entrada - ${ticket.ticketNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: white; }
          .ticket { 
            border: 3px solid #6B9080; 
            padding: 25px; 
            max-width: 400px; 
            margin: 0 auto;
            background: white;
            border-radius: 15px;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #6B9080; 
            padding-bottom: 15px; 
            margin-bottom: 15px;
          }
          .qr { text-align: center; margin: 20px 0; }
          .info { line-height: 1.8; color: #2c5530; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">
            <h2>🎫 FEIPOBOL 2025</h2>
            <h3>${eventoSeleccionado.value?.name || 'Evento'}</h3>
          </div>
          <div class="info">
            <p><strong>Entrada:</strong> #${ticket.ticketNumber}</p>
            <p><strong>Comprador:</strong> ${ticket.buyerName || 'Cliente'}</p>
            <p><strong>Precio:</strong> Bs. ${ticket.salePrice || ticket.price}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Lugar:</strong> ${eventoSeleccionado.value?.location || 'Ubicación del evento'}</p>
          </div>
          <div class="qr">
            <img src="${ticket.qrDataUrl}" alt="QR Code" style="max-width: 150px;" />
            <p style="font-size: 10px;">${ticket.qrCode}</p>
          </div>
        </div>
      </body>
    </html>
  `
  
  ventanaImpresion.document.write(htmlContent)
  ventanaImpresion.document.close()
  ventanaImpresion.print()
}

const descargarQR = (ticket) => {
  const link = document.createElement('a')
  link.href = ticket.qrDataUrl
  link.download = `QR_${ticket.ticketNumber}.png`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const verHistorialVentas = () => {
  // Por implementar - ir a una sección de historial
  alert('Función de historial en desarrollo')
}

const formatearFechaTiempo = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// **FUNCIONES RESPONSIVE**
const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  sidebarOpen.value = false
}

const cambiarSeccion = (seccion) => {
  seccionActiva.value = seccion
  // Cerrar sidebar en móvil al cambiar de sección
  if (window.innerWidth <= 768) {
    closeSidebar()
  }
}

// **FUNCIONES DEL ESCÁNER QR**
const toggleScanner = async () => {
  try {
    if (scannerActive.value) {
      stopScanner()
    } else {
      await startScanner()
    }
  } catch (error) {
    console.error('Error al alternar escáner:', error)
    alert('Error al acceder a la cámara: ' + error.message)
  }
}

const startScanner = async () => {
  try {
    // Verificar si el navegador soporta getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Posible causa: contexto inseguro (HTTP) en móviles o navegador antiguo
      try {
        const isSecureContext = window.isSecureContext || location.protocol === 'https:'
        const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname)
        if (!isSecureContext && !isLocalhost) {
          throw new Error('Acceso a la cámara requiere HTTPS. Abre la app usando https:// en tu dispositivo móvil o instala/acepta el certificado autofirmado en el dispositivo.')
        }
      } catch (e) {
        // ignore
      }
      throw new Error('Tu navegador no soporta acceso a la cámara')
    }

    // Solicitar acceso a la cámara con configuración optimizada
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment', // Cámara trasera por defecto
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        frameRate: { ideal: 30, min: 15 } // Mayor tasa de frames para detección más rápida
      } 
    })
    
    videoStream.value = stream
    const video = document.querySelector('video')
    if (video) {
      video.srcObject = stream
      scannerActive.value = true
      
      // Comenzar a escanear
      startScanning()
    }
  } catch (error) {
    console.error('Error al acceder a la cámara:', error)
    
    let errorMessage = 'No se pudo acceder a la cámara.'
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = '❌ Permiso denegado.\n\n' +
                     '📸 Para usar el escáner, debes permitir el acceso a la cámara:\n\n' +
                     '1. Asegúrate de abrir la aplicación por HTTPS (https://192.168.1.3:5173) en el móvil.\n' +
                     '2. Si aparece advertencia de certificado, acepta/instala el certificado autofirmado o instala el CRT en el dispositivo.\n' +
                     '3. Haz clic en el ícono de candado/información en la barra de direcciones y activa "Cámara" → "Permitir".\n' +
                     '4. Recarga la página e intenta de nuevo.'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = '❌ No se encontró ninguna cámara conectada.\n\n' +
                     'Verifica que tu dispositivo tenga una cámara y esté conectada correctamente.'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = '❌ La cámara está siendo usada por otra aplicación.\n\n' +
                     'Cierra otras aplicaciones que puedan estar usando la cámara.'
    } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      errorMessage = '❌ La cámara no cumple con los requisitos necesarios.\n\n' +
                     'Intenta usar una cámara diferente o actualiza tu navegador.'
    } else if (error.message) {
      errorMessage = `❌ Error: ${error.message}`
    }
    
    throw new Error(errorMessage)
  }
}

const stopScanner = () => {
  if (videoStream.value) {
    videoStream.value.getTracks().forEach(track => track.stop())
    videoStream.value = null
  }
  
  if (scanInterval.value) {
    clearInterval(scanInterval.value)
    scanInterval.value = null
  }
  
  scannerActive.value = false
  processingQR.value = false
}

const startScanning = () => {
  if (scanInterval.value) return
  
  // Escanear cada 200ms para detección más rápida (2.5x más rápido)
  scanInterval.value = setInterval(() => {
    if (!scannerActive.value || processingQR.value) return
    captureAndDecodeQR()
  }, 200)
}

const captureAndDecodeQR = async () => {
  try {
    const video = document.querySelector('video')
    const canvas = document.querySelector('canvas')
    
    if (!video || !canvas || !video.videoWidth) return
    
    const context = canvas.getContext('2d', { willReadFrequently: true })
    
    // Optimización: Escanear solo el área central (80% del frame)
    // Esto reduce el área de procesamiento y aumenta la velocidad
    const scanWidth = Math.floor(video.videoWidth * 0.8)
    const scanHeight = Math.floor(video.videoHeight * 0.8)
    const offsetX = Math.floor((video.videoWidth - scanWidth) / 2)
    const offsetY = Math.floor((video.videoHeight - scanHeight) / 2)
    
    canvas.width = scanWidth
    canvas.height = scanHeight
    
    // Dibujar solo el área central del video
    context.drawImage(
      video,
      offsetX, offsetY, scanWidth, scanHeight, // área fuente (centro del video)
      0, 0, scanWidth, scanHeight // área destino (todo el canvas)
    )
    
    // Obtener datos de imagen
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Decodificar QR usando jsQR con opciones optimizadas
    const { default: jsQR } = await import('jsqr')
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert' // Mejora la velocidad al no intentar inversión de colores
    })
    
    if (qrResult && qrResult.data) {
      console.log('🔍 QR detectado:', qrResult.data)
      // Validar el QR encontrado
      await validateQRCode(qrResult.data)
    }
    
  } catch (error) {
    console.error('Error al capturar frame:', error)
  }
}

// **FUNCIONES DE CONTROL DE ACCESO**
const cargarEstadoSistema = async () => {
  try {
    const response = await accessService.getSystemStatus()
    if (response.success) {
      sistemaAccesoActivo.value = response.systemActive
    }
  } catch (error) {
    console.error('Error cargando estado del sistema:', error)
  }
}

const toggleSistemaAcceso = async () => {
  if (cargandoToggle.value) return
  
  const nuevoEstado = !sistemaAccesoActivo.value
  const confirmMsg = nuevoEstado ? 
    '¿Activar el sistema de control de acceso?\n\nLos trabajadores y participantes podrán ingresar.' :
    '⚠️ ¿DESACTIVAR el sistema de control de acceso?\n\nNINGÚN trabajador o participante podrá ingresar hasta que se reactive.'
  
  if (!confirm(confirmMsg)) return
  
  cargandoToggle.value = true
  
  try {
    const response = await accessService.toggleSystem(nuevoEstado)
    
    if (response.success) {
      sistemaAccesoActivo.value = response.systemActive
      alert(`✅ Sistema ${nuevoEstado ? 'ACTIVADO' : 'DESACTIVADO'} correctamente`)
    } else {
      alert('❌ Error al cambiar estado del sistema: ' + response.error)
    }
  } catch (error) {
    console.error('Error:', error)
    alert('❌ Error de conexión')
  } finally {
    cargandoToggle.value = false
  }
}

// Helper: Detectar tipo de QR (UUID = trabajador/participante, otro = ticket)
const esTokenAcceso = (qrCode) => {
  // Un UUID tiene el formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(qrCode)
}

const esEntradaSimple = (qrCode) => {
  // Detecta tokens de entradas generadas (formato: ENTRY-timestamp-random)
  return qrCode.startsWith('ENTRY-') || qrCode.startsWith('TK-')
}

const validateQRCode = async (qrCode) => {
  if (processingQR.value) return
  
  processingQR.value = true
  loadingTicketInfo.value = true
  
  // Pausar temporalmente el escáner para mostrar resultado
  wasScanningBeforePause.value = scannerActive.value
  if (wasScanningBeforePause.value && scanInterval.value) {
    clearInterval(scanInterval.value)
    scanInterval.value = null
  }
  
  try {
    // **DETECTAR TIPO DE QR**
    
    // 1. Token de acceso (trabajador/participante)
    if (esTokenAcceso(qrCode)) {
      console.log('🆔 Token de acceso detectado:', qrCode)
      await validarAccesoPersonal(qrCode)
      return
    }
    
    // 2. Entrada simple (QR físico generado)
    if (esEntradaSimple(qrCode)) {
      console.log('🎫 Entrada simple detectada:', qrCode)
      await validarEntradaSimpleDirecta(qrCode)
      return
    }
    
    // 3. Ticket de evento con múltiples entradas
    console.log('🎫 Ticket de evento detectado:', qrCode)
    
    // Obtener información actual del ticket
    console.log('🔍 Obteniendo información del ticket:', qrCode)
    const ticketResponse = await validationService.getTicketInfo(qrCode)
    
    if (ticketResponse.success) {
      currentTicketInfo.value = ticketResponse.ticket
      
      // Configurar valores por defecto
      pendingQRCode.value = qrCode
      selectedPersonCount.value = 1
      maxPersonsAllowed.value = Math.min(10, ticketResponse.ticket.remainingEntries)
      
      // Mostrar modal para seleccionar cuántas personas van a ingresar
      showPersonCountModal.value = true
      
    } else {
      // Si no se puede obtener info del ticket, proceder directamente con validación
      console.warn('⚠️ No se pudo obtener info del ticket, procediendo con validación directa')
      pendingQRCode.value = qrCode
      selectedPersonCount.value = 1
      maxPersonsAllowed.value = 10
      currentTicketInfo.value = null
      showPersonCountModal.value = true
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo información del ticket:', error)
    // En caso de error, mostrar modal básico
    pendingQRCode.value = qrCode
    selectedPersonCount.value = 1
    maxPersonsAllowed.value = 10
    currentTicketInfo.value = null
    showPersonCountModal.value = true
  } finally {
    loadingTicketInfo.value = false
    processingQR.value = false // Permitir interacción con el modal
  }
}

const confirmPersonCount = async () => {
  try {
    showPersonCountModal.value = false
    processingQR.value = true
    
    console.log('🔍 Validando QR:', pendingQRCode.value, 'para', selectedPersonCount.value, 'persona(s)')
    
    const response = await validationService.validateQR(
      pendingQRCode.value,
      null,
      'Dashboard Administrativo',
      selectedPersonCount.value
    )
    
    const result = {
      success: response.success,
      message: response.message,
      ticket: response.ticket,
      validation: response.validation,
      timestamp: new Date()
    }
    
    lastValidationResult.value = result
    showValidationResult.value = true
    
    // Agregar al historial
    validationHistory.value.unshift({
      id: Date.now(),
      success: result.success,
      message: result.message,
      ticketNumber: result.ticket?.ticketNumber,
      qrCode: pendingQRCode.value,
      timestamp: new Date()
    })
    
    // Mantener solo las últimas 10 validaciones
    if (validationHistory.value.length > 10) {
      validationHistory.value = validationHistory.value.slice(0, 10)
    }
    
    // Reproducir sonido de confirmación
    playValidationSound(result.success)
    
  } catch (error) {
    console.error('Error validando QR:', error)
    
    const result = {
      success: false,
      message: error.message || 'Error de conexión',
      timestamp: new Date()
    }
    
    lastValidationResult.value = result
    showValidationResult.value = true
    
    validationHistory.value.unshift({
      id: Date.now(),
      success: false,
      message: result.message,
      qrCode: pendingQRCode.value,
      timestamp: new Date()
    })
    
    playValidationSound(false)
  } finally {
    processingQR.value = false
    
    // Reactivar escáner después de 3 segundos si estaba activo
    if (wasScanningBeforePause.value) {
      setTimeout(() => {
        if (scannerActive.value && !scanInterval.value) {
          console.log('🔄 Reactivando escáner automáticamente...')
          startScanning()
        }
      }, 3000) // 3 segundos de pausa
    }
  }
}

// **VALIDAR ACCESO DE TRABAJADOR/PARTICIPANTE**
const validarAccesoPersonal = async (token) => {
  try {
    loadingTicketInfo.value = true
    
    console.log('🔍 Validando token de acceso:', token)
    
    const response = await accessService.validateAccess(token, null)
    
    console.log('📡 Respuesta del servidor:', response)
    
    // Crear objeto de resultado compatible con el modal de validación
    const result = {
      success: response.success,
      message: response.message || (response.success ? 'Acceso permitido' : 'Acceso denegado'),
      persona: response.persona,
      tipo: response.tipo || response.persona?.tipo || 'desconocido', // Primero revisar nivel superior
      result: response.result,
      systemActive: response.systemActive,
      validationDuration: response.validationDuration,
      timestamp: new Date()
    }
    
    lastValidationResult.value = result
    showValidationResult.value = true
    
    // Agregar al historial
    validationHistory.value.unshift({
      id: Date.now(),
      success: result.success,
      message: result.message,
      nombre: result.persona?.nombre || 'Desconocido',
      tipo: result.tipo,
      qrCode: token,
      timestamp: new Date()
    })
    
    // Mantener solo las últimas 10 validaciones
    if (validationHistory.value.length > 10) {
      validationHistory.value = validationHistory.value.slice(0, 10)
    }
    
    // Reproducir sonido
    playValidationSound(result.success)
    
  } catch (error) {
    console.error('❌ Error validando acceso:', error)
    
    const result = {
      success: false,
      message: error.message || 'Error de conexión',
      timestamp: new Date()
    }
    
    lastValidationResult.value = result
    showValidationResult.value = true
    
    validationHistory.value.unshift({
      id: Date.now(),
      success: false,
      message: result.message,
      qrCode: token,
      timestamp: new Date()
    })
    
    playValidationSound(false)
  } finally {
    loadingTicketInfo.value = false
    processingQR.value = false
    
    // Reactivar escáner después de 8 segundos (tiempo suficiente para ver el resultado)
    if (wasScanningBeforePause.value) {
      setTimeout(() => {
        if (scannerActive.value && !scanInterval.value) {
          console.log('🔄 Reactivando escáner automáticamente...')
          startScanning()
        }
      }, 8000)
    }
  }
}

const validarEntradaSimpleDirecta = async (token) => {
  try {
    loadingTicketInfo.value = true
    
    console.log('🔍 Validando entrada simple:', token)
    
    const response = await apiClient.post('/api/validation/validar-entrada', { token })
    const responseData = response.data
    
    console.log('📡 Respuesta del servidor:', responseData)
    
    // Crear objeto de resultado compatible con el modal de validación
    const result = {
      success: responseData.success,
      message: responseData.message || (responseData.success ? 'Entrada válida' : 'Entrada inválida'),
      validationType: 'entrada_simple',
      entrada: responseData.entrada,
      validatedBy: responseData.validatedBy,
      validationDuration: responseData.validationDuration,
      timestamp: new Date()
    }
    
    lastValidationResult.value = result
    showValidationResult.value = true
    
    // Agregar al historial
    validationHistory.value.unshift({
      id: Date.now(),
      success: result.success,
      message: result.message,
      nombre: 'Entrada Simple',
      tipo: 'entrada',
      qrCode: token,
      ticketNumber: responseData.entrada?.numero || '',
      timestamp: new Date()
    })
    
    // Mantener solo las últimas 10 validaciones
    if (validationHistory.value.length > 10) {
      validationHistory.value = validationHistory.value.slice(0, 10)
    }
    
    // Reproducir sonido
    playValidationSound(result.success)
    
  } catch (error) {
    console.error('❌ Error validando entrada simple:', error)
    
    const result = {
      success: false,
      message: error.response?.data?.message || error.message || 'Error de conexión',
      validationType: 'entrada_simple',
      timestamp: new Date()
    }
    
    lastValidationResult.value = result
    showValidationResult.value = true
    
    validationHistory.value.unshift({
      id: Date.now(),
      success: false,
      message: result.message,
      qrCode: token,
      timestamp: new Date()
    })
    
    playValidationSound(false)
  } finally {
    loadingTicketInfo.value = false
    processingQR.value = false
    
    // Reactivar escáner después de 8 segundos (tiempo suficiente para ver el resultado)
    if (wasScanningBeforePause.value) {
      setTimeout(() => {
        if (scannerActive.value && !scanInterval.value) {
          console.log('🔄 Reactivando escáner automáticamente...')
          startScanning()
        }
      }, 8000)
    }
  }
}

const validateManualQR = () => {
  if (manualQRCode.value.trim()) {
    validateQRCode(manualQRCode.value.trim())
    manualQRCode.value = ''
  }
}

const cancelPersonCount = () => {
  showPersonCountModal.value = false
  pendingQRCode.value = ''
  processingQR.value = false
  
  // Reactivar escáner si estaba activo
  if (wasScanningBeforePause.value && scannerActive.value && !scanInterval.value) {
    startScanning()
  }
}

// Función para manejar el cierre manual del modal de resultado
const handleValidationResultClose = () => {
  showValidationResult.value = false
  
  // Reactivar escáner inmediatamente si está activo
  if (scannerActive.value && !scanInterval.value && !processingQR.value) {
    console.log('🔄 Reactivando escáner tras cerrar modal...')
    startScanning()
  }
}

const playValidationSound = (success) => {
  // Crear sonido de confirmación
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.setValueAtTime(success ? 800 : 400, audioContext.currentTime)
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

onMounted(async () => {
  // Cargar usuario desde localStorage (coinc con ambas claves posibles)
  const user = localStorage.getItem('sisqr_user') || localStorage.getItem('user')
  usuario.value = user ? JSON.parse(user) : {}
  console.log('🔐 Dashboard Admin montado para:', usuario.value)
  console.log('📋 Datos del usuario:', {
    nombre: usuario.value.nombre || `${usuario.value.firstName} ${usuario.value.lastName}`,
    email: usuario.value.email,
    rol: usuario.value.rol || usuario.value.role
  })
  
  // SIEMPRE usar backend real
  console.log('📡 FORZANDO uso de backend real - cargando datos desde API')
  const token = localStorage.getItem('sisqr_token') || localStorage.getItem('token')
  console.log('🔑 Token disponible:', token ? 'Sí' : 'No')
  
  // Cargar datos reales desde el backend
  await cargarUsuarios()
  await cargarEventos()
  await cargarEventosVenta()
  await cargarEstadisticas()
  await cargarEstadoSistema() // Cargar estado del sistema de acceso
})

// Limpiar recursos al desmontar el componente
onBeforeUnmount(() => {
  stopScanner()
})

const usarDatosSimulados = () => {
  console.log('📝 Cargando datos simulados para desarrollo')
  
  // Usuarios simulados
  usuarios.value = [
    { id: 1, nombre: 'Carlos Admin', email: 'admin@sisqr6.com', rol: 'admin' },
    { id: 2, nombre: 'María Ventas', email: 'vendedor@sisqr6.com', rol: 'vendedor' },
    { id: 3, nombre: 'José Control', email: 'control@sisqr6.com', rol: 'control' }
  ]
  
  // Estadísticas simuladas
  estadisticas.value = {
    totalVentas: 15420,
    totalUsuarios: 25,
    entradasVendidas: 342,
    validacionesHoy: 89
  }
  
  console.log('✅ Datos simulados cargados correctamente')
}
</script>

<style scoped>
.dashboard-feipobol {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
}

/* SIDEBAR FEIPOBOL */
.sidebar-feipobol {
  width: 300px;
  background: #6B9080;
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
}

/* Responsive: collapse sidebar on small screens */
@media (max-width: 992px) {
  .sidebar-feipobol {
    transform: translateX(-100%);
    position: fixed;
    transition: transform 0.25s ease;
  }

  .sidebar-feipobol.open {
    transform: translateX(0);
  }

  .mobile-menu-btn {
    display: block;
    position: fixed;
    left: 12px;
    top: 12px;
    z-index: 110;
    background: white;
    border: none;
    padding: 8px 10px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }

  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 105;
  }

  .sidebar-overlay.active {
    display: block;
  }

  .contenido-principal {
    margin-left: 0 !important;
    padding: 20px !important;
  }
}

/* Scroll personalizado para sidebar */
.sidebar-feipobol::-webkit-scrollbar {
  width: 8px;
}

.sidebar-feipobol::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
}

.sidebar-feipobol::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.3);
  border-radius: 4px;
}

.sidebar-feipobol::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.5);
}

.sidebar-header {
  padding: 30px 25px;
  background: rgba(0,0,0,0.1);
  text-align: left;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 900;
  letter-spacing: 2px;
}

/* Stats grid responsive */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 18px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 1024px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-section {
    grid-template-columns: 1fr;
  }

  .contenido-principal {
    padding: 12px;
  }

  .contenido-card {
    padding: 12px;
    border-radius: 10px;
  }

  .evento-card-admin {
    padding: 12px;
  }
}

.sidebar-header p {
  margin: 8px 0 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
  font-weight: 500;
}

.user-info {
  padding: 20px 25px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B35, #F7931E);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-details h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  margin: 4px 0 0 0;
  font-size: 0.75rem;
  opacity: 0.9;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #FFE66D;
}

.user-email {
  margin: 4px 0 0 0;
  font-size: 0.7rem;
  opacity: 0.7;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* NAVEGACIÓN SIDEBAR */
.sidebar-nav {
  flex: 1;
  padding: 20px 0;
  padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px)); /* Espacio extra + área segura del dispositivo */
  overflow-y: auto; /* Scroll si hay mucho contenido */
  overflow-x: hidden;
}

.nav-item {
  width: 100%;
  background: none;
  border: none;
  color: white;
  padding: 15px 25px;
  text-align: left;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  border-left-color: rgba(255,255,255,0.5);
}

.nav-item.active {
  background: rgba(255,255,255,0.2);
  border-left-color: #FF6B35;
  font-weight: 700;
}

.nav-item-qr {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
  border-radius: 8px;
  margin: 5px 15px;
  padding: 15px 20px;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(255, 107, 53, 0.3);
  border-left: 4px solid transparent;
}

.nav-item-qr:hover {
  background: linear-gradient(135deg, #FF8C42 0%, #FFA356 100%);
  transform: translateX(5px);
  box-shadow: 0 6px 12px rgba(255, 107, 53, 0.4);
}

/* Control de Acceso Toggle */
.control-acceso-toggle {
  margin: 20px 25px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.toggle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: white;
  font-weight: 600;
  font-size: 0.95rem;
}

.estado-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.estado-badge.activo {
  background: #4CAF50;
  color: white;
  animation: pulse 2s infinite;
}

.estado-badge.inactivo {
  background: #F44336;
  color: white;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.btn-toggle {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-toggle.activo {
  background: #4CAF50;
  color: white;
}

.btn-toggle.activo:hover:not(:disabled) {
  background: #45A049;
  transform: translateY(-2px);
}

.btn-toggle.inactivo {
  background: #F44336;
  color: white;
}

.btn-toggle.inactivo:hover:not(:disabled) {
  background: #E53935;
  transform: translateY(-2px);
}

.btn-toggle:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Menú LISTA */
.nav-seccion {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.2);
}

.nav-seccion-titulo {
  color: white;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 2px;
  padding: 10px 25px;
  opacity: 0.7;
  text-transform: uppercase;
}

.nav-item.sub-item {
  font-size: 0.95rem;
  padding-left: 35px;
}

.btn-salir {
  margin: 20px 25px;
  margin-bottom: calc(80px + env(safe-area-inset-bottom, 0px)); /* Espacio extra + área segura del dispositivo */
  padding: 12px 20px;
  background: #FF6B35;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  flex-shrink: 0; /* No permitir que se encoja */
}

.btn-salir:hover {
  background: #E55A2B;
  transform: translateY(-2px);
}

/* CONTENIDO PRINCIPAL */
.contenido-principal {
  flex: 1;
  background: #f5f5f5;
  min-height: 100vh;
  margin-left: 300px; /* Espacio para el sidebar fijo */
}

.contenido-header {
  background: white;
  padding: 25px 30px;
  border-bottom: 3px solid #6B9080;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.contenido-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* SECCIONES DE CONTENIDO */
.seccion-contenido {
  padding: 30px;
}

.contenido-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card-header {
  padding: 20px 25px;
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  display: flex;
  justify-content: flex-end;
}

.btn-nuevo-feipobol {
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-nuevo-feipobol:hover {
  background: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}

/* TABLA DE USUARIOS */
.tabla-usuarios {
  padding: 0;
}

.usuario-header {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  gap: 20px;
  padding: 20px 25px;
  background: #f8f9fa;
  font-weight: 700;
  color: #666;
  border-bottom: 2px solid #eee;
}

.usuario-fila {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr;
  gap: 20px;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  align-items: center;
  transition: background 0.3s ease;
}

.usuario-fila:hover {
  background: #f8f9fa;
}

.usuario-fila:last-child {
  border-bottom: none;
}

.usuario-nombre {
  font-weight: 600;
  color: #333;
}

.usuario-email {
  color: #666;
  font-size: 0.9rem;
}

.usuario-rol {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  width: fit-content;
}

.usuario-rol.admin { 
  background: #ffebee; 
  color: #d32f2f; 
}

.usuario-rol.vendedor { 
  background: #fff3e0; 
  color: #f57c00; 
}

.usuario-rol.control { 
  background: #e8f5e8; 
  color: #388e3c; 
}

.usuario-acciones {
  display: flex;
  gap: 8px;
}

.btn-accion {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.btn-accion.editar {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-accion.eliminar {
  background: #ffebee;
  color: #d32f2f;
}

.btn-accion:hover {
  transform: scale(1.1);
}

/* REPORTES */
.reportes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  padding: 30px;
}

.reporte-item {
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  color: white;
  padding: 25px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.reporte-item h3 {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

.numero-grande {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 900;
}

/* EVENTOS */
.eventos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 30px;
}

.evento-card {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.evento-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-weight: 600;
}

.evento-card p {
  margin: 5px 0;
  color: #666;
  font-size: 0.9rem;
}

.evento-estado {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.evento-estado.activo { 
  background: #e8f5e8; 
  color: #388e3c; 
}

.evento-estado.pausado { 
  background: #fff3e0; 
  color: #f57c00; 
}

.evento-estado.proximo { 
  background: #e3f2fd; 
  color: #1976d2; 
}

/* OTRAS SECCIONES */
.escaner-container, .filtros-container {
  padding: 40px;
  text-align: center;
  color: #666;
}

.escaner-container h3, .filtros-container h3 {
  color: #6B9080;
  font-size: 1.5rem;
  margin-bottom: 15px;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .dashboard-feipobol {
    flex-direction: column;
  }
  
  .sidebar-feipobol {
    width: 100%;
    min-height: auto;
  }
  
  .usuario-header, .usuario-fila {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .reportes-grid {
    grid-template-columns: 1fr;
  }
}



/* ESTADÍSTICAS */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.ventas .stat-icon { background: #e8f5e8; }
.usuarios .stat-icon { background: #fff3e0; }
.entradas .stat-icon { background: #e3f2fd; }
.validaciones .stat-icon { background: #f3e5f5; }

.stat-info h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.stat-info p {
  margin: 5px 0 0 0;
  color: #666;
  font-weight: 500;
}

/* FUNCTIONS SECTION */
.functions-section {
  display: grid;
  gap: 30px;
}

.function-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  overflow: hidden;
}

.function-header {
  background: linear-gradient(135deg, #6B9080, #8FA89B);
  color: white;
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.function-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.btn-nuevo {
  background: rgba(255,255,255,0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-nuevo:hover {
  background: rgba(255,255,255,0.3);
}

/* USUARIOS */
.usuarios-lista, .eventos-lista {
  padding: 25px;
}

.usuario-item, .evento-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.usuario-item:last-child, .evento-item:last-child {
  border-bottom: none;
}

.usuario-info, .evento-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.usuario-nombre {
  font-weight: 600;
  color: #333;
}

.usuario-email {
  color: #666;
  font-size: 0.9rem;
}

.usuario-rol {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  width: fit-content;
}

.usuario-rol.admin { background: #ffebee; color: #d32f2f; }
.usuario-rol.vendedor { background: #fff3e0; color: #f57c00; }
.usuario-rol.control { background: #e8f5e8; color: #388e3c; }

.usuario-acciones, .evento-acciones {
  display: flex;
  gap: 10px;
}

.btn-editar, .btn-eliminar, .btn-toggle {
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-editar:hover { background: #e3f2fd; }
.btn-eliminar:hover { background: #ffebee; }
.btn-toggle:hover { background: #f3e5f5; }

/* EVENTOS */
.evento-info h4 {
  margin: 0;
  color: #333;
  font-weight: 600;
}

.evento-info p {
  margin: 2px 0;
  color: #666;
  font-size: 0.9rem;
}

.evento-estado {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.evento-estado.activo { background: #e8f5e8; color: #388e3c; }
.evento-estado.pausado { background: #fff3e0; color: #f57c00; }
.evento-estado.proximo { background: #e3f2fd; color: #1976d2; }

/* REPORTES */
.filtro-select {
  padding: 8px 12px;
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 6px;
  background: rgba(255,255,255,0.2);
  color: white;
  font-weight: 600;
}

.reportes-contenido {
  padding: 25px;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
}

.grafico-simple {
  display: flex;
  align-items: end;
  gap: 15px;
  height: 200px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.barra-venta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.barra {
  width: 100%;
  background: linear-gradient(180deg, #6B9080, #4A6741);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  transition: all 0.3s ease;
}

.barra:hover {
  background: linear-gradient(180deg, #FF6B35, #E55A2B);
}

.dia {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.resumen-ventas {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.resumen-ventas p {
  margin: 0;
  color: #333;
}

/* MODAL */
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
  padding: 20px;
  overflow-y: auto;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-content h3 {
  margin: 0 0 20px 0;
  color: #6B9080;
  font-size: 1.3rem;
}

.modal-content input, .modal-content select {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: 2px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
}

/* MODAL DE SELECCIÓN DE PERSONAS */
.person-count-modal {
  max-width: 450px;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border: 2px solid #6B9080;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 5px 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f0f0f0;
  color: #333;
}

.qr-info {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-family: monospace;
  font-size: 0.9rem;
  border-left: 4px solid #6B9080;
}

.person-count-selector label {
  display: block;
  margin-bottom: 15px;
  font-weight: 600;
  color: #333;
}

.count-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
  margin-bottom: 10px;
}

.count-btn {
  width: 45px;
  height: 45px;
  border: 2px solid #6B9080;
  background: white;
  border-radius: 50%;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.count-btn:hover:not(:disabled) {
  background: #6B9080;
  color: white;
  transform: scale(1.1);
}

.count-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.count-input {
  width: 80px !important;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin: 0 !important;
  border: 2px solid #6B9080 !important;
}

.count-info {
  text-align: center;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0;
}

.modal-footer {
  display: flex;
  gap: 15px;
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
  justify-content: flex-end;
}

.btn-primary, .btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn-primary {
  background: #6B9080;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a7a6a;
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e9ecef;
  color: #666;
}

.btn-secondary:hover {
  background: #d1ecf1;
  transform: translateY(-2px);
}

/* Estilos para información del ticket */
.ticket-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  border: 1px solid #e9ecef;
}

.ticket-info h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.info-value {
  color: #333;
  font-size: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-active {
  background: #d4edda;
  color: #155724;
}

.status-partial {
  background: #fff3cd;
  color: #856404;
}

.status-used {
  background: #f8d7da;
  color: #721c24;
}

.entries-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.entries-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.entries-progress {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
}

.entries-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  white-space: nowrap;
}

.modal-content input:focus, .modal-content select:focus {
  outline: none;
  border-color: #6B9080;
}

/* Modal específico para eventos */
.modal-card {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow-y: auto;
  margin: 20px;
  position: relative;
}

.modal-card h3 {
  background: #6B9080;
  color: white;
  margin: 0;
  padding: 20px 30px;
  font-size: 1.3rem;
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.btn-cerrar-modal {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-cerrar-modal:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modal-card form {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  justify-content: flex-end;
}

.btn-guardar, .btn-cancelar {
  min-width: 120px;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-guardar {
  background: #6B9080;
  color: white;
}

.btn-guardar:hover {
  background: #5a7a6a;
}

.btn-cancelar {
  background: #eee;
  color: #666;
}

.btn-cancelar:hover {
  background: #ddd;
}

/* LOADING Y ERROR STATES */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #6B9080;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid #c62828;
}

.btn-cerrar-error {
  background: none;
  border: none;
  color: #c62828;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 5px;
}

.btn-refrescar {
  background: #f8f9fa;
  color: #6B9080;
  border: 2px solid #6B9080;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 10px;
}

.btn-refrescar:hover:not(:disabled) {
  background: #6B9080;
  color: white;
}

.btn-refrescar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.usuario-vacio {
  text-align: center;
  padding: 40px;
  color: #666;
}

.usuario-vacio p {
  margin: 0;
  font-style: italic;
}

/* Botones deshabilitados */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ESTILOS ESPECÍFICOS PARA MODAL EDITAR */
.campo-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.campo-info label {
  font-weight: 600;
  color: #666;
}

.usuario-id {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #6B9080;
  background: white;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.password-hint {
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
  margin-top: -10px;
  margin-bottom: 15px;
}

/* Mejoras para modales */
.modal-content form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .admin-main {
    padding: 20px 15px;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
  
  .reportes-contenido {
    grid-template-columns: 1fr;
  }
  
  .header-left {
    flex-direction: column;
    gap: 10px;
  }
  
  .admin-header {
    flex-direction: column;
    gap: 15px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
  }
}

/* ============= ESTILOS PARA EVENTOS ============= */

.eventos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.evento-card-admin {
  background: white;
  border: 2px solid #6B9080;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.evento-card-admin:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
  border-color: #4A7A5C;
}

.evento-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.evento-header h4 {
  margin: 0;
  color: #2c5530;
  font-size: 1.2rem;
  font-weight: 700;
  flex: 1;
}

.evento-acciones {
  display: flex;
  gap: 8px;
}

.btn-editar, .btn-eliminar {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-editar:hover {
  background: #e3f2fd;
}

.btn-eliminar:hover {
  background: #ffebee;
}

.evento-info {
  margin: 15px 0;
  line-height: 1.6;
}

.evento-info p {
  margin: 8px 0;
  color: #333;
  font-size: 0.95rem;
}

.evento-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.evento-estado-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.estado-activo {
  background: #c8e6c9;
  color: #1b5e20;
}

.estado-borrador {
  background: #fff3e0;
  color: #e65100;
}

.estado-pausado {
  background: #ffecb3;
  color: #f57c00;
}

.estado-finalizado {
  background: #e1f5fe;
  color: #0277bd;
}

.estado-desconocido {
  background: #f5f5f5;
  color: #616161;
}

.estado-controles {
  display: flex;
  gap: 8px;
}

.btn-activar, .btn-pausar, .btn-reactivar {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-activar {
  background: #4caf50;
  color: white;
}

.btn-activar:hover {
  background: #45a049;
}

.btn-pausar {
  background: #ff9800;
  color: white;
}

.btn-pausar:hover {
  background: #f57c00;
}

.btn-reactivar {
  background: #2196f3;
  color: white;
}

.btn-reactivar:hover {
  background: #1976d2;
}

.evento-descripcion {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
  color: #666;
  font-style: italic;
}

.no-eventos {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f9f9f9;
  border-radius: 12px;
  border: 2px dashed #ddd;
}

.btn-crear-primero {
  margin-top: 15px;
  background: #6B9080;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-crear-primero:hover {
  background: #4A7A5C;
  transform: translateY(-2px);
}

/* Formularios de eventos */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #2c5530;
  font-weight: 600;
}

.form-group input, 
.form-group select, 
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus, 
.form-group select:focus, 
.form-group textarea:focus {
  outline: none;
  border-color: #6B9080;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* Responsive para eventos */
@media (max-width: 768px) {
  .eventos-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .evento-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .evento-footer {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-row-rango {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

/* ============= ESTILOS PARA RANGOS DE PRECIOS ============= */

.rangos-precios {
  margin-top: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #6B9080;
}

.rangos-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.rango-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  font-size: 0.9rem;
}

.rango-horario {
  color: #2c5530;
  font-weight: 600;
}

.rango-precio {
  background: #6B9080;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
}

.rango-nombre {
  color: #666;
  font-style: italic;
  font-size: 0.85rem;
}

.sin-rangos {
  margin-top: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
  text-align: center;
}

/* Estilos para formulario de rangos */
.rangos-precio-seccion {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background: #fafafa;
}

.rangos-precio-seccion h4 {
  margin: 0 0 10px 0;
  color: #2c5530;
  font-size: 1.1rem;
}

.rangos-info {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 15px;
  font-style: italic;
}

.rangos-actuales {
  margin-bottom: 20px;
}

.rango-actual {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 12px 15px;
  margin-bottom: 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.rango-display {
  flex: 1;
  color: #333;
}

.rango-nombre-display {
  color: #6B9080;
  font-weight: 600;
  margin-left: 8px;
}

.rango-acciones {
  display: flex;
  gap: 8px;
}

.btn-editar-rango, .btn-eliminar-rango {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-editar-rango:hover {
  background: #e3f2fd;
}

.btn-eliminar-rango:hover {
  background: #ffebee;
}

.agregar-rango-form {
  border-top: 1px solid #ddd;
  padding-top: 15px;
}

.form-row-rango {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1.5fr auto;
  gap: 10px;
  align-items: end;
}

.form-group-small {
  display: flex;
  flex-direction: column;
}

.form-group-small label {
  font-size: 0.85rem;
  color: #2c5530;
  font-weight: 600;
  margin-bottom: 4px;
}

.form-group-small input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-group-small input:focus {
  outline: none;
  border-color: #6B9080;
}

.btn-agregar-rango {
  background: #6B9080;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  height: fit-content;
}

.btn-agregar-rango:hover {
  background: #4A7A5C;
  transform: translateY(-1px);
}

.btn-agregar-rango:active {
  transform: translateY(0);
}

/* Responsive para rangos */
@media (max-width: 768px) {
  .form-row-rango {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .rangos-lista {
    flex-direction: column;
  }
  
  .rango-actual {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  /* Ajustes de modal en móvil */
  .modal-overlay {
    padding: 10px;
  }
  
  .modal-card {
    max-width: 95vw;
    max-height: 95vh;
    margin: 10px;
  }
  
  .modal-card h3 {
    padding: 15px 20px;
    font-size: 1.1rem;
  }
  
  .modal-card form {
    padding: 20px;
    gap: 15px;
  }
  
  .rangos-precio-seccion {
    padding: 15px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-guardar, .btn-cancelar {
    min-width: auto;
    width: 100%;
  }
}

/* ============= ESTILOS PARA VENTA DE ENTRADAS ============= */

.paso-venta {
  max-width: 1000px;
  margin: 0 auto;
}

.paso-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #6B9080, #4A7A5C);
  color: white;
  border-radius: 12px;
}

.paso-header.exito {
  background: linear-gradient(135deg, #4caf50, #45a049);
}

.paso-header h3 {
  margin: 0 0 10px 0;
  font-size: 1.5rem;
}

.paso-header p {
  margin: 5px 0;
  opacity: 0.9;
}

/* Grid de eventos para venta */
.eventos-venta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.evento-venta-card {
  border: 2px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.evento-venta-card:hover {
  border-color: #6B9080;
  box-shadow: 0 4px 15px rgba(107, 144, 128, 0.2);
  transform: translateY(-2px);
}

.evento-venta-card.seleccionado {
  border-color: #6B9080;
  background: #f0f8f5;
  box-shadow: 0 4px 15px rgba(107, 144, 128, 0.3);
}

.evento-venta-info h4 {
  margin: 0 0 15px 0;
  color: #2c5530;
  font-size: 1.2rem;
}

.evento-venta-info p {
  margin: 8px 0;
  color: #555;
  line-height: 1.4;
}

.precio-actual {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
  padding: 10px;
  background: #6B9080;
  color: white;
  border-radius: 8px;
  font-weight: 600;
}

.precio-valor {
  font-size: 1.2rem;
}

.rangos-mini {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.rangos-titulo {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 8px 0;
}

.rangos-mini-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.rango-mini {
  background: #f0f8f5;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #2c5530;
}

.btn-seleccionar {
  width: 100%;
  padding: 10px;
  margin-top: 15px;
  background: #6B9080;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-seleccionar:hover {
  background: #4A7A5C;
}

.evento-venta-card.seleccionado .btn-seleccionar {
  background: #4caf50;
}

/* Formulario de venta */
.form-venta {
  max-width: 600px;
  margin: 0 auto;
}

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

/* Navegación de pasos */
.paso-navegacion {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-anterior, .btn-siguiente, .btn-vender, .btn-nueva-venta, .btn-historial {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.btn-anterior {
  background: #f5f5f5;
  color: #666;
}

.btn-anterior:hover {
  background: #e0e0e0;
}

.btn-siguiente, .btn-vender {
  background: #6B9080;
  color: white;
}

.btn-siguiente:hover, .btn-vender:hover:not(:disabled) {
  background: #4A7A5C;
  transform: translateY(-1px);
}

.btn-vender:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-nueva-venta {
  background: #2196f3;
  color: white;
}

.btn-nueva-venta:hover {
  background: #1976d2;
}

.btn-historial {
  background: #ff9800;
  color: white;
}

.btn-historial:hover {
  background: #f57c00;
}

/* Tickets generados */
.tickets-generados {
  display: grid;
  gap: 20px;
  margin: 20px 0;
}

.ticket-card {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 20px;
  padding: 20px;
  border: 2px solid #6B9080;
  border-radius: 12px;
  background: white;
  align-items: center;
}

.ticket-info h4 {
  margin: 0 0 10px 0;
  color: #2c5530;
}

.ticket-info p {
  margin: 4px 0;
  color: #555;
}

.ticket-qr {
  text-align: center;
}

.qr-image {
  max-width: 120px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.qr-code-text {
  font-size: 0.7rem;
  color: #666;
  margin: 5px 0 0 0;
  word-break: break-all;
}

.ticket-acciones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Estilos para venta rápida */
.panel-venta-rapida {
  background: linear-gradient(135deg, #f0f8f5 0%, #e8f5e8 100%);
  border: 2px solid #6B9080;
  border-radius: 12px;
  padding: 25px;
  margin-top: 20px;
  box-shadow: 0 4px 12px rgba(107, 144, 128, 0.15);
}

.evento-seleccionado-info {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #6B9080;
}

.evento-seleccionado-info h4 {
  color: #2c5530;
  margin: 0 0 10px 0;
}

.venta-rapida-controles {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.cantidad-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.cantidad-selector label {
  font-weight: 600;
  color: #2c5530;
}

.cantidad-selector select {
  padding: 12px 20px;
  border: 2px solid #6B9080;
  border-radius: 8px;
  font-size: 1.1rem;
  background: white;
  color: #2c5530;
  font-weight: 600;
  cursor: pointer;
}

.total-precio {
  background: #2c5530;
  color: white;
  padding: 15px 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 3px 8px rgba(44, 85, 48, 0.3);
}

.total-label {
  font-size: 1rem;
  display: block;
  margin-bottom: 5px;
}

.total-valor {
  font-size: 1.8rem;
  font-weight: bold;
}

.btn-venta-directa {
  background: linear-gradient(135deg, #4caf50 0%, #6B9080 100%);
  color: white;
  border: none;
  padding: 18px 40px;
  border-radius: 25px;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-venta-directa:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, #45a049 0%, #4A7A5C 100%);
}

.btn-venta-directa:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Resumen de venta rápida */
.venta-resumen {
  background: #f0f8f5;
  padding: 20px;
  border-radius: 12px;
  margin: 20px 0;
  border-left: 4px solid #6B9080;
}

.resumen-info p {
  margin: 8px 0;
  color: #2c5530;
}

.total-destacado {
  font-size: 1.4rem;
  font-weight: bold;
  color: #4caf50;
}

/* Tickets de venta rápida */
.ticket-card-rapido {
  background: white;
  border: 3px solid #6B9080;
  border-radius: 15px;
  padding: 25px;
  margin: 15px 0;
  box-shadow: 0 4px 15px rgba(107, 144, 128, 0.2);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #6B9080;
}

.ticket-header h4 {
  color: #2c5530;
  margin: 0;
}

.ticket-precio {
  background: #4caf50;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.1rem;
}

.ticket-qr-section {
  display: flex;
  gap: 25px;
  align-items: center;
  margin-bottom: 20px;
}

.qr-image-grande {
  width: 150px;
  height: 150px;
  border: 2px solid #ddd;
  border-radius: 10px;
}

.qr-info {
  flex: 1;
}

.qr-instruccion {
  color: #666;
  font-style: italic;
  margin-top: 10px;
}

.ticket-acciones-rapidas {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-imprimir-rapido, .btn-descargar-rapido {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.btn-imprimir-rapido {
  background: #2196f3;
  color: white;
}

.btn-imprimir-rapido:hover {
  background: #1976d2;
  transform: translateY(-1px);
}

.btn-descargar-rapido {
  background: #ff9800;
  color: white;
}

.btn-descargar-rapido:hover {
  background: #f57c00;
  transform: translateY(-1px);
}

.acciones-finales {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #ddd;
}

.btn-nueva-venta-rapida {
  background: linear-gradient(135deg, #4caf50 0%, #6B9080 100%);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(76, 175, 80, 0.3);
}

.btn-nueva-venta-rapida:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.4);
}

.btn-ver-ventas {
  background: #2196f3;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);
}

.btn-ver-ventas:hover {
  background: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(33, 150, 243, 0.4);
}

.btn-imprimir, .btn-descargar {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-imprimir {
  background: #4caf50;
  color: white;
}

.btn-imprimir:hover {
  background: #45a049;
}

.btn-descargar {
  background: #2196f3;
  color: white;
}

.btn-descargar:hover {
  background: #1976d2;
}

.no-eventos-venta {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  grid-column: 1 / -1;
}

.no-eventos-venta h4 {
  margin: 0 0 15px 0;
  color: #999;
}

.btn-ir-eventos {
  margin-top: 20px;
  padding: 12px 24px;
  background: #6B9080;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-ir-eventos:hover {
  background: #4A7A5C;
}

/* Responsive para venta */
@media (max-width: 768px) {
  .eventos-venta-grid {
    grid-template-columns: 1fr;
  }
  
  .ticket-card {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .paso-navegacion {
    flex-direction: column;
  }
  
  .form-venta {
    padding: 0 10px;
  }
}

/* **ESTILOS ESCÁNER QR** */
.scanner-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 2px solid #e9ecef;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: bold;
  font-size: 1.1rem;
}

.status-indicator.active {
  color: #28a745;
}

.status-indicator.inactive {
  color: #6c757d;
}

.status-indicator.processing {
  color: #ffc107;
}

.status-indicator.paused {
  color: #ff9800;
  animation: pausedBlink 2s infinite;
}

@keyframes pausedBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.6; }
}

.status-icon {
  font-size: 1.5rem;
}

.btn-toggle-scanner {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-toggle-scanner:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3, #004085);
  transform: translateY(-2px);
}

.btn-toggle-scanner:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.scanner-area {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.camera-container {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  min-height: 400px;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.scan-frame {
  position: relative;
  width: 250px;
  height: 250px;
}

.scan-corner {
  position: absolute;
  width: 30px;
  height: 30px;
  border: 3px solid #00ff00;
}

.scan-corner.top-left {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
}

.scan-corner.top-right {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
}

.scan-corner.bottom-left {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
}

.scan-corner.bottom-right {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00ff00, transparent);
  animation: scanAnimation 2s ease-in-out infinite;
}

@keyframes scanAnimation {
  0% {
    top: 0;
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    top: 250px;
    opacity: 1;
  }
}

.scan-instructions {
  color: white;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  margin-top: 20px;
  font-size: 0.9rem;
}

.scanner-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}

.placeholder-content {
  text-align: center;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.manual-input {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

.manual-input h4 {
  margin: 0 0 15px 0;
  color: #495057;
}

.manual-input-row {
  display: flex;
  gap: 12px;
}

.manual-qr-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.9rem;
}

.manual-qr-input:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn-validate-manual {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-validate-manual:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.btn-validate-manual:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.validation-result {
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border-left: 5px solid;
}

.validation-result.success {
  background: #d4edda;
  border-left-color: #28a745;
  color: #155724;
}

.validation-result.error {
  background: #f8d7da;
  border-left-color: #dc3545;
  color: #721c24;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.result-icon {
  font-size: 1.5rem;
}

.result-title {
  font-weight: bold;
  font-size: 1.1rem;
}

/* INFORMACIÓN COMPACTA DE VALIDACIÓN */
.last-validation-info {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95em;
  animation: slideInFromTop 0.3s ease-out;
}

.last-validation-info.success-info {
  background: linear-gradient(135deg, #e8f5e8, #f0fff0);
  border-left-color: #4caf50;
  color: #2e7d32;
}

.last-validation-info.error-info {
  background: linear-gradient(135deg, #ffebee, #fef5f5);
  border-left-color: #f44336;
  color: #c62828;
}

.validation-icon {
  font-size: 1.2em;
  min-width: 24px;
}

.validation-summary {
  flex: 1;
  font-weight: 500;
}

.validation-time {
  color: #666;
  font-size: 0.8em;
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Información compacta de última validación */
.last-validation-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  border-left: 4px solid;
}

.last-validation-info.success-info {
  background: #e8f5e9;
  border-left-color: #4caf50;
  color: #2e7d32;
}

.last-validation-info.error-info {
  background: #ffebee;
  border-left-color: #f44336;
  color: #c62828;
}

.validation-icon {
  font-size: 1.2rem;
}

.validation-summary {
  flex: 1;
  font-weight: 500;
}

.validation-time {
  color: #666;
  font-size: 0.8rem;
}

.ticket-info {
  background: rgba(255, 255, 255, 0.8);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.ticket-details p {
  margin: 5px 0;
  font-size: 0.9rem;
}

.result-message p {
  margin: 0;
  font-weight: 500;
}

.result-timestamp {
  text-align: right;
  font-style: italic;
  opacity: 0.8;
}

.validation-history {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

.validation-history h4 {
  margin: 0 0 15px 0;
  color: #495057;
}

.no-history {
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.history-item.success {
  background: rgba(40, 167, 69, 0.1);
  border-left: 3px solid #28a745;
}

.history-item.error {
  background: rgba(220, 53, 69, 0.1);
  border-left: 3px solid #dc3545;
}

.history-icon {
  font-size: 1.2rem;
  margin-top: 2px;
}

.history-details {
  flex: 1;
}

.history-main {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.history-ticket {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
}

.history-meta {
  opacity: 0.7;
}

/* Responsive para escáner */
@media (max-width: 768px) {
  .scanner-area {
    grid-template-columns: 1fr;
  }
  
  .scanner-status {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .manual-input-row {
    flex-direction: column;
  }
  
  .scan-frame {
    width: 200px;
    height: 200px;
  }
  
  .scan-line {
    animation-duration: 1.5s;
  }
  
  @keyframes scanAnimation {
    0% {
      top: 0;
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      top: 200px;
      opacity: 1;
    }
  }
}

/* === DISEÑO RESPONSIVO COMPLETO === */

/* Mobile First - Smartphones (< 480px) */
@media (max-width: 480px) {
  .dashboard-feipobol {
    flex-direction: column;
  }
  
  /* Sidebar como overlay en móvil */
  .sidebar-feipobol {
    position: fixed;
    left: 0;
    top: 0;
    width: 80%;
    max-width: 280px;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    box-shadow: 4px 0 10px rgba(0,0,0,0.3);
  }
  
  .sidebar-feipobol.open {
    transform: translateX(0);
  }
  
  .sidebar-header h2 {
    font-size: 1.5rem;
  }
  
  .sidebar-header p {
    font-size: 0.75rem;
  }
  
  .user-info {
    padding: 15px;
  }
  
  .user-info h3 {
    font-size: 1rem;
  }
  
  .user-info p {
    font-size: 0.85rem;
  }
  
  .nav-item {
    padding: 12px 20px;
    font-size: 0.95rem;
  }
  
  /* Contenido principal */
  .main-content {
    margin-left: 0 !important;
    width: 100%;
    padding: 10px;
  }
  
  .content-header {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
  }
  
  .content-header h1 {
    font-size: 1.5rem;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .btn-primary, .btn-secondary, .btn-success {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
  }
  
  /* Dashboard cards */
  .dashboard-cards {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .card-feipobol {
    padding: 15px;
  }
  
  .card-feipobol h3 {
    font-size: 0.9rem;
  }
  
  .card-value {
    font-size: 2rem;
  }
  
  /* Tablas */
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  table {
    min-width: 600px;
    font-size: 0.85rem;
  }
  
  th, td {
    padding: 8px;
  }
  
  /* Formularios */
  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .form-group label {
    font-size: 0.9rem;
  }
  
  .form-control, .form-select {
    font-size: 16px !important; /* Prevenir zoom en iOS */
    padding: 10px;
  }
  
  /* Scanner */
  .scanner-container {
    padding: 15px;
  }
  
  .scanner-video {
    width: 100%;
    height: auto;
    max-height: 300px;
  }
  
  .scanner-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .scanner-controls button {
    width: 100%;
  }
  
  /* Control de acceso */
  .control-acceso-toggle {
    padding: 15px;
  }
  
  .toggle-header h4 {
    font-size: 1rem;
  }
  
  .estado-badge {
    font-size: 0.75rem;
    padding: 4px 10px;
  }
  
  /* Historial */
  .history-list {
    gap: 12px;
  }
  
  .history-item {
    padding: 12px;
  }
  
  .history-info h4 {
    font-size: 0.95rem;
  }
  
  .history-details {
    font-size: 0.85rem;
  }
}

/* Tablets (481px - 768px) */
@media (min-width: 481px) and (max-width: 768px) {
  .sidebar-feipobol {
    width: 250px;
  }
  
  .main-content {
    margin-left: 0;
    width: 100%;
  }
  
  /* Sidebar como overlay en tablet también */
  .sidebar-feipobol {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
  }
  
  .sidebar-feipobol.open {
    transform: translateX(0);
  }
  
  .dashboard-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-header {
    padding: 20px;
  }
  
  .main-content {
    padding: 15px;
  }
}

/* Desktop pequeño (769px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar-feipobol {
    width: 260px;
  }
  
  .main-content {
    margin-left: 260px;
  }
  
  .dashboard-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop grande (> 1024px) */
@media (min-width: 1025px) {
  .sidebar-feipobol {
    width: 300px;
  }
  
  .main-content {
    margin-left: 300px;
  }
  
  .dashboard-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Botón hamburguesa para móvil/tablet */
@media (max-width: 768px) {
  /* Agregar botón hamburguesa */
  .mobile-menu-btn {
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
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
  }
  
  .mobile-menu-btn:active {
    transform: scale(0.95);
  }
  
  /* Overlay para cerrar sidebar */
  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
    display: none;
  }
  
  .sidebar-overlay.active {
    display: block;
  }
  
  /* Ajustar contenido principal cuando hay botón hamburguesa */
  .main-content {
    padding-top: 60px;
  }
}

/* Orientación landscape en móviles */
@media (max-width: 768px) and (orientation: landscape) {
  .scanner-video {
    max-height: 200px;
  }
  
  .sidebar-feipobol {
    width: 60%;
  }
}

/* Prevenir selección de texto en botones */
@media (max-width: 768px) {
  button, .nav-item {
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
}

/* Mejorar touch targets */
@media (max-width: 768px) {
  button,
  a,
  .nav-item,
  .clickable {
    min-height: 44px;
    min-width: 44px;
  }
}
/* Ajustes adicionales específicos para pantallas pequeñas/tablets */
@media (max-width: 1024px) {
  .contenido-principal { padding: 18px; }
  .stats-section { gap: 12px; }
  .stat-card { padding: 14px; }
}

@media (max-width: 768px) {
  /* Forzar sidebar como overlay and ensure main content uses full width */
  .sidebar-feipobol { width: 80%; max-width: 320px; }
  .mobile-menu-btn { left: 14px; top: 12px; }
  .contenido-principal { margin-left: 0 !important; padding: 14px; }

  /* Scan frame and scanner area adjustments */
  .scan-frame { width: 200px; height: 200px; }
  .camera-container { min-height: 260px; }
  .scan-instructions { font-size: 0.85rem; padding: 6px 10px; }
}

@media (max-width: 480px) {
  .scan-frame { width: 160px; height: 160px; }
  .camera-container { min-height: 200px; }
  .stats-section { grid-template-columns: 1fr; gap: 10px; }
  .sidebar-feipobol { width: 90%; max-width: 320px; }
  .sidebar-header h2 { font-size: 1.3rem; }
}
</style>