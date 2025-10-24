const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const ticketController = require('../controllers/ticketController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole, requireAdmin, requireVendedor, requireControl, requireAdminOr } = require('../middleware/roles');
const {
  validateSellTicket,
  validateCancelTicket,
  validateQRGeneration
} = require('../middleware/validators');

// **RUTAS PÚBLICAS** (sin autenticación - para validación QR)
// Estas rutas están en el controlador de validación que crearemos después

// **RUTAS PROTEGIDAS** (requieren autenticación)

// **VENTA DE ENTRADAS** (Vendedores y Admin)

// POST /api/tickets/sell - Vender entrada
// Nota: permitimos tanto vendedor como admin
router.post('/sell', 
  authenticateToken, 
  requireVendedor, // Permite vendedores y admin
  validateSellTicket, 
  ticketController.sellTicket
);

// POST /api/tickets/generar-lote - Generar múltiples entradas simples con QR
router.post('/generar-lote',
  authenticateToken,
  requireVendedor, // Admin o Vendedor
  ticketController.generarLoteEntradas
);

// **ESTADÍSTICAS Y REPORTES** (deben ir ANTES de rutas con parámetros)

// GET /api/tickets/stats - Estadísticas simples para dashboard
router.get('/stats', 
  authenticateToken, 
  ticketController.getStats
);

// GET /api/tickets/stats/sales - Estadísticas de ventas
router.get('/stats/sales', 
  authenticateToken, 
  requireVendedor, // Admin ve todas, Vendedor ve solo las suyas
  ticketController.getSalesStats
);

// **CONSULTA DE ENTRADAS**

// GET /api/tickets - Listar entradas (vendedores ven solo las suyas, admin ve todas)
router.get('/', 
  authenticateToken, 
  requireVendedor, // Admin o Vendedor
  ticketController.getTickets
);

// GET /api/tickets/:id - Obtener entrada específica
router.get('/:id', 
  authenticateToken, 
  requireVendedor, // Admin, Vendedor o Control
  ticketController.getTicketById
);

// **GENERACIÓN DE QR**

// GET /api/tickets/:id/qr - Generar imagen QR para imprimir
router.get('/:id/qr', 
  authenticateToken, 
  requireVendedor, // Admin o Vendedor (quien vendió la entrada)
  ticketController.generateQRImage
);

// GET /api/tickets/:id/qr/:format - Generar QR en formato específico
router.get('/:id/qr/:format', 
  authenticateToken, 
  requireVendedor,
  validateQRGeneration,
  ticketController.generateQRImage
);

// **GESTIÓN DE ENTRADAS**

// PATCH /api/tickets/:id/cancel - Cancelar entrada
router.patch('/:id/cancel', 
  authenticateToken, 
  requireVendedor, // Admin o Vendedor que la vendió
  validateCancelTicket, 
  ticketController.cancelTicket
);

// **RUTAS ADMINISTRATIVAS** (solo admin)

// GET /api/tickets/admin/all - Ver todas las entradas del sistema (solo admin)
router.get('/admin/all', 
  authenticateToken, 
  requireAdmin, 
  ticketController.getTickets
);

// PATCH /api/tickets/:id/force-cancel - Cancelación forzada (solo admin)
router.patch('/:id/force-cancel', 
  authenticateToken, 
  requireAdmin, 
  validateCancelTicket, 
  async (req, res, next) => {
    // Marcar como cancelación administrativa forzada
    req.body.isForceCancel = true;
    next();
  },
  ticketController.cancelTicket
);

module.exports = router;