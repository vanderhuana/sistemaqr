const express = require('express');
const router = express.Router();
const premioController = require('../controllers/premioController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Middleware: Solo administradores pueden gestionar premios
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// ===== RUTAS PARA ADMINISTRACIÓN DE PREMIOS =====

// IMPORTANTE: Las rutas específicas DEBEN ir ANTES que las rutas con parámetros dinámicos

// GET /api/admin/premios/stats - Obtener estadísticas de premios
router.get('/stats', premioController.getStats);

// ===== RUTAS PARA GESTIÓN DE GANADORES =====

// GET /api/admin/premios/ganadores - Obtener todos los ganadores
router.get('/ganadores', premioController.getGanadores);

// PUT /api/admin/premios/ganadores/:id/entrega - Marcar premio como entregado
router.put('/ganadores/:id/entrega', premioController.marcarEntregado);

// ===== RUTAS GENERALES =====

// GET /api/admin/premios - Obtener todos los premios
router.get('/', premioController.getAll);

// POST /api/admin/premios - Crear nuevo premio
router.post('/', premioController.create);

// PUT /api/admin/premios/:id - Actualizar premio
router.put('/:id', premioController.update);

// DELETE /api/admin/premios/:id - Eliminar premio
router.delete('/:id', premioController.delete);

module.exports = router;