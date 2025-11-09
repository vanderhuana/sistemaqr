const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const eventController = require('../controllers/eventController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { requireAdmin, requireVendedor } = require('../middleware/roles');
const {
  validateCreateEvent,
  validateUpdateEvent,
  validateEventStatus
} = require('../middleware/validators');

// **RUTAS PÚBLICAS** (acceso sin autenticación)

// GET /api/events - Listar eventos públicos (solo activos)
router.get('/', optionalAuth, eventController.getEvents);

// **RUTAS PROTEGIDAS** (requieren autenticación)

// **RUTAS ESPECÍFICAS** (deben ir ANTES de las rutas con parámetros :id)

// GET /api/events/admin/dashboard - Dashboard de eventos (solo admin)
router.get('/admin/dashboard', 
  authenticateToken, 
  requireAdmin, 
  eventController.getEventsDashboard
);

// GET /api/events/validations - Obtener todas las validaciones de QR (admin o vendedor)
router.get('/validations',
  authenticateToken,
  requireVendedor, // Admin o Vendedor pueden ver validaciones
  async (req, res) => {
    try {
      console.log('📊 Iniciando consulta de validaciones...');
      
      // Importar modelos
      const models = require('../models');
      const { ValidationLog, Ticket, User } = models;
      
      console.log('✅ Modelos importados correctamente');
      console.log('📋 ValidationLog existe:', !!ValidationLog);
      console.log('📋 Ticket existe:', !!Ticket);
      console.log('� User existe:', !!User);
      
      // Primero intentar obtener sin includes
      const validationsCount = await ValidationLog.count();
      console.log(`�📊 Total de validaciones en BD: ${validationsCount}`);
      
      // Si no hay validaciones, retornar array vacío
      if (validationsCount === 0) {
        console.log('ℹ️ No hay validaciones registradas');
        return res.json({
          success: true,
          validations: [],
          total: 0,
          message: 'No hay validaciones registradas aún'
        });
      }
      
      // Intentar obtener con includes
      console.log('🔍 Obteniendo validaciones con relaciones...');
      const validations = await ValidationLog.findAll({
        include: [
          {
            model: Ticket,
            as: 'Ticket',
            attributes: ['id', 'numero', 'tipo'],
            required: false
          },
          {
            model: User,
            as: 'Validator',
            attributes: ['id', 'nombre', 'username'],
            required: false
          }
        ],
        order: [['validatedAt', 'DESC']],
        limit: 500
      });

      console.log(`✅ Validaciones encontradas: ${validations.length}`);

      res.json({
        success: true,
        validations: validations || [],
        total: validations.length
      });
    } catch (error) {
      console.error('❌ Error obteniendo validaciones:', error);
      console.error('❌ Tipo de error:', error.name);
      console.error('❌ Mensaje:', error.message);
      console.error('❌ Stack:', error.stack);
      
      res.status(500).json({
        success: false,
        error: 'Error al obtener validaciones',
        message: error.message,
        errorType: error.name,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
);

// **RUTAS CON PARÁMETROS** (deben ir DESPUÉS de rutas específicas)

// GET /api/events/:id - Obtener evento específico (solo activos para no-admin)
router.get('/:id', optionalAuth, eventController.getEventById);

// GET /api/events/:id/price - Obtener precio actual del evento
router.get('/:id/price', eventController.getCurrentPrice);

// **RUTAS PROTEGIDAS** (requieren autenticación)

// **RUTAS DE ADMINISTRADOR** (solo admin puede crear/modificar eventos)

// POST /api/events - Crear nuevo evento (solo admin)
router.post('/', 
  authenticateToken, 
  requireAdmin, 
  validateCreateEvent, 
  eventController.createEvent
);

// PUT /api/events/:id - Actualizar evento (solo admin o creador)
router.put('/:id', 
  authenticateToken, 
  requireAdmin, 
  validateUpdateEvent, 
  eventController.updateEvent
);

// PATCH /api/events/:id/status - Cambiar estado del evento (solo admin)
router.patch('/:id/status', 
  authenticateToken, 
  requireAdmin, 
  validateEventStatus, 
  eventController.updateEventStatus
);

// DELETE /api/events/:id - Eliminar evento (solo admin)
router.delete('/:id', 
  authenticateToken, 
  requireAdmin, 
  eventController.deleteEvent
);

// **UTILIDADES PARA CONFIGURACIÓN DE PRECIOS**

// GET /api/events/price-examples/:type - Obtener ejemplos de rangos de precios
router.get('/price-examples/:type?', 
  authenticateToken, 
  requireAdmin, 
  (req, res) => {
    try {
      const { generateExampleRanges } = require('../utils/rangeValidation');
      const { type = 'general' } = req.params;
      
      const examples = {
        general: generateExampleRanges('general'),
        restaurant: generateExampleRanges('restaurant'),
        nightclub: generateExampleRanges('nightclub'), 
        conference: generateExampleRanges('conference'),
        hourly: generateExampleRanges('hourly')
      };
      
      const selectedExample = examples[type] || examples.general;
      
      res.json({
        message: 'Ejemplos de rangos obtenidos',
        type,
        availableTypes: Object.keys(examples),
        ranges: selectedExample,
        instructions: {
          format: 'Cada rango debe tener startTime, endTime, price y opcionalmente name',
          consecutiveRanges: 'Puedes crear rangos consecutivos como 18:00-19:00, 19:01-20:00, etc.',
          nightRanges: 'Para horarios nocturnos usa rangos como 22:00-06:00 (cruzan medianoche)',
          validation: 'Los rangos se validan automáticamente para evitar solapamientos'
        }
      });
    } catch (error) {
      console.error('Error obteniendo ejemplos:', error);
      res.status(500).json({
        error: 'Error interno',
        message: 'No se pudieron obtener los ejemplos'
      });
    }
  }
);

// POST /api/events/validate-ranges - Validar rangos de precios antes de crear evento
router.post('/validate-ranges', 
  authenticateToken, 
  requireAdmin,
  (req, res) => {
    try {
      const { priceRanges, basePrice } = req.body;
      const { validatePriceRanges, optimizePriceRanges } = require('../utils/rangeValidation');
      
      // Validar rangos
      const validation = validatePriceRanges(priceRanges || []);
      
      if (validation.isValid) {
        // Optimizar rangos si es posible
        const optimizedRanges = optimizePriceRanges(validation.validatedRanges);
        
        res.json({
          message: 'Rangos válidos',
          isValid: true,
          originalRanges: priceRanges,
          validatedRanges: validation.validatedRanges,
          optimizedRanges,
          suggestions: {
            canOptimize: optimizedRanges.length < (priceRanges || []).length,
            basePrice: basePrice || 0,
            totalRanges: validation.validatedRanges.length
          }
        });
      } else {
        res.status(400).json({
          message: 'Rangos inválidos',
          isValid: false,
          errors: validation.errors,
          receivedRanges: priceRanges
        });
      }
    } catch (error) {
      console.error('Error validando rangos:', error);
      res.status(500).json({
        error: 'Error interno',
        message: 'No se pudieron validar los rangos'
      });
    }
  }
);

module.exports = router;