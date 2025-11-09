const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAdminOrControl } = require('../middleware/roles');

/**
 * @route GET /api/reports/data
 * @desc Obtener datos para reportes con filtros
 * @access Admin, Control
 */
router.get('/data', 
  authenticateToken, 
  requireAdminOrControl, 
  ReportController.getReportData
);

/**
 * @route GET /api/reports/pdf
 * @desc Generar reporte PDF
 * @access Admin
 */
router.get('/pdf', 
  authenticateToken, 
  requireAdmin, 
  ReportController.generatePDF
);

/**
 * @route GET /api/reports/validate/:codigoQR
 * @desc Validar credenciales de un código QR
 * @access Admin, Control
 */
router.get('/validate/:codigoQR', 
  authenticateToken, 
  requireAdminOrControl, 
  ReportController.validarCredenciales
);

/**
 * @route GET /api/reports/filter-options
 * @desc Obtener opciones para filtros de reportes
 * @access Admin, Control
 */
router.get('/filter-options', 
  authenticateToken, 
  requireAdminOrControl, 
  ReportController.getFilterOptions
);

/**
 * @route GET /api/reports/accesos
 * @desc Obtener datos de accesos de participantes (Generador QR)
 * @access Admin, Control
 */
router.get('/accesos', 
  authenticateToken, 
  requireAdminOrControl, 
  ReportController.getAccesosParticipantes
);

/**
 * @route GET /api/reports/accesos-filter-options
 * @desc Obtener opciones para filtros de accesos
 * @access Admin, Control
 */
router.get('/accesos-filter-options', 
  authenticateToken, 
  requireAdminOrControl, 
  ReportController.getAccesosFilterOptions
);

module.exports = router;