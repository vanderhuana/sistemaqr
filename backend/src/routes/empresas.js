const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Rutas públicas (para el formulario de registro)
router.get('/disponibles', empresaController.getEmpresasDisponibles);

// Rutas protegidas (solo para administradores)
router.get('/', authenticateToken, authorizeRoles('admin'), empresaController.getAllEmpresas);
router.post('/', authenticateToken, authorizeRoles('admin'), empresaController.createEmpresa);
router.put('/:id', authenticateToken, authorizeRoles('admin'), empresaController.updateEmpresa);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), empresaController.deleteEmpresa);

module.exports = router;
