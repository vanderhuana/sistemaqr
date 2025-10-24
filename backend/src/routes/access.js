const express = require('express');
const router = express.Router();
const accessController = require('../controllers/accessController');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// POST /api/access/validate - Validar QR de trabajador/participante
router.post('/validate',
  authenticateToken,
  requireRole(['control', 'admin']),
  accessController.validateAccess
);

// GET /api/access/status - Obtener estado del sistema
router.get('/status',
  authenticateToken,
  requireRole(['control', 'admin']),
  accessController.getSystemStatus
);

// POST /api/access/toggle - Activar/desactivar sistema (solo admin)
router.post('/toggle',
  authenticateToken,
  requireRole(['admin']),
  accessController.toggleSystem
);

// GET /api/access/history - Historial de accesos de hoy
router.get('/history',
  authenticateToken,
  requireRole(['control', 'admin']),
  accessController.getAccessHistory
);

module.exports = router;
