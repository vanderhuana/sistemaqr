const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
require('dotenv').config();

// Importar configuración de base de datos
const { testConnection } = require('./src/config/database');
const { syncModels, seedData } = require('./src/models');

const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

// Middleware de seguridad
app.use(helmet());

// CORS - Configuración para permitir acceso desde red local
app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como apps móviles o Postman)
    if (!origin) return callback(null, true);

    // Normalizar origin quitando slash final si existe
    const normalize = (u) => (typeof u === 'string' ? u.replace(/\/+$/,'') : u);
    const incoming = normalize(origin);

    // Lista de orígenes permitidos por defecto (sin slash final)
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://192.168.1.3:5173',
      'http://192.168.1.3:8080',
      'http://192.168.1.3:3000',
      'https://localhost:5173',
      'https://192.168.1.3:5173',
      'https://192.168.1.3:3443',
      'http://142.93.26.33:8080',
      'https://142.93.26.33',
      'http://fepp.online',
      'https://fepp.online',
      'http://www.fepp.online',
      'https://www.fepp.online'
    ];

    // Si se definió FRONTEND_URL en env, añádelo (normalizado)
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(normalize(process.env.FRONTEND_URL));
    }

    // Permitir cualquier origen en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(incoming) !== -1) {
      return callback(null, true);
    }

    // Si no está en la lista, rechazar con mensaje claro
    const err = new Error('Not allowed by CORS');
    err.status = 403;
    return callback(err);
  },
  credentials: true
}));

// Servir archivos estáticos del frontend QR
app.use('/qr', express.static(path.join(__dirname, '../frontend')));

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Importar rutas
const authRoutes = require('./src/routes/auth');
const eventRoutes = require('./src/routes/events');
const ticketRoutes = require('./src/routes/tickets');
const userRoutes = require('./src/routes/users');
const staffRoutes = require('./src/routes/staff');
const trabajadorRoutes = require('./src/routes/trabajadores');
const participanteRoutes = require('./src/routes/participantes');
const empresaRoutes = require('./src/routes/empresas');

// Configurar rutas
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/trabajadores', trabajadorRoutes);
app.use('/api/participantes', participanteRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/validation', require('./src/routes/validation'));
app.use('/api/access', require('./src/routes/access'));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'API del Sistema de Entradas QR',
    version: '1.0.0',
    status: 'OK',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      tickets: '/api/tickets',
      users: '/api/users',
      validation: '/api/validation',
      health: '/health',
      database: '/db-status'
    }
  });
});

// Ruta para verificar el estado del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ruta para verificar la base de datos
app.get('/db-status', async (req, res) => {
  try {
    const { User, Event, Ticket } = require('./src/models');
    
    const [userCount, eventCount, ticketCount] = await Promise.all([
      User.count(),
      Event.count(),
      Ticket.count()
    ]);
    
    res.json({
      status: 'DB Connected',
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        events: eventCount,
        tickets: ticketCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'DB Error',
      message: error.message
    });
  }
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe`
  });
});

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Función para inicializar la base de datos
const initializeDatabase = async () => {
  try {
    console.log('🔄 Inicializando base de datos...');
    
    // Probar conexión
    await testConnection();
    
    // Sincronizar modelos
    await syncModels(false); // false = no forzar recreación de tablas
    
    // Crear datos de prueba solo en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      await seedData();
    }
    
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    process.exit(1);
  }
};

// Iniciar servidor
const startServer = async () => {
  // Inicializar base de datos primero
  await initializeDatabase();
  
  // Configuración de certificados SSL
  let sslOptions = null;
  const pfxPath = path.join(__dirname, 'ssl', 'server.pfx');
  const certPath = path.join(__dirname, 'ssl', 'server.crt');
  const keyPath = path.join(__dirname, 'ssl', 'server.key');
  
  // Intentar cargar certificados
  try {
    if (fs.existsSync(pfxPath)) {
      // Usar archivo PFX
      sslOptions = {
        pfx: fs.readFileSync(pfxPath),
        passphrase: process.env.SSL_PASSPHRASE || 'sisfipo2024'
      };
      console.log('🔒 Certificado SSL (PFX) cargado');
    } else if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      // Usar archivos CRT y KEY
      sslOptions = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      };
      console.log('🔒 Certificado SSL (CRT/KEY) cargado');
    }
  } catch (error) {
    console.log('⚠️  No se pudieron cargar certificados SSL:', error.message);
  }
  
  // Iniciar servidor HTTP (sin SSL)
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor HTTP corriendo en puerto ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🌐 Red: http://192.168.1.3:${PORT}`);
  });
  
  // Iniciar servidor HTTPS (con SSL) si hay certificados
  if (sslOptions) {
    https.createServer(sslOptions, app).listen(HTTPS_PORT, '0.0.0.0', () => {
      console.log(`🔒 Servidor HTTPS corriendo en puerto ${HTTPS_PORT}`);
      console.log(`🌐 Local: https://localhost:${HTTPS_PORT}`);
      console.log(`🌐 Red: https://192.168.1.3:${HTTPS_PORT}`);
      console.log(`� Dispositivos móviles pueden acceder a: https://192.168.1.3:${HTTPS_PORT}`);
      console.log(`⚠️  Los dispositivos verán advertencia de certificado - aceptar para continuar`);
    });
  } else {
    console.log('⚠️  Servidor HTTPS no iniciado - ejecuta generar-certificados.ps1 primero');
    console.log('⚠️  La cámara solo funciona en HTTPS desde dispositivos móviles');
  }
  
  console.log(`📱 Modo: ${process.env.NODE_ENV || 'development'}`);
  console.log('💡 Asegúrate de que el firewall permita conexiones en los puertos', PORT, 'y', HTTPS_PORT);
};

// Iniciar aplicación
startServer().catch(error => {
  console.error('❌ Error iniciando el servidor:', error);
  process.exit(1);
});

module.exports = app;
