const express = require('express');
const router = express.Router();
const registroFeipobolController = require('../controllers/registroFeipobolController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// GET /api/admin/registro-feipobol - Obtener todos los registros
router.get('/', registroFeipobolController.getAll);

// GET /api/admin/registro-feipobol/stats - Obtener estadísticas
router.get('/stats', registroFeipobolController.getStats);

// GET /api/admin/registro-feipobol/search - Búsqueda avanzada
router.get('/search', registroFeipobolController.search);

// GET /api/admin/registro-feipobol/export - Exportar a Excel
router.get('/export', registroFeipobolController.exportToExcel);

// GET /api/admin/registro-feipobol/:id - Obtener registro por ID
router.get('/:id', registroFeipobolController.getById);

// PUT /api/admin/registro-feipobol/:id/participacion - Marcar participación
router.put('/:id/participacion', registroFeipobolController.marcarParticipacion);

// PUT /api/admin/registro-feipobol/:id/premio - Marcar premio
router.put('/:id/premio', registroFeipobolController.marcarPremio);

// DELETE /api/admin/registro-feipobol/:id - Eliminar registro (solo casos excepcionales)
router.delete('/:id', registroFeipobolController.delete);

module.exports = router;