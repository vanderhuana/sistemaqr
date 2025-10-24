const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// GET /api/users - Obtener todos los usuarios (solo admin)
router.get('/', requireAdmin, userController.getAllUsers);

// POST /api/users - Crear nuevo usuario (solo admin)
router.post('/', requireAdmin, userController.createUser);

// GET /api/users/profile - Obtener perfil del usuario actual
router.get('/profile', userController.getProfile);

// PUT /api/users/:id - Actualizar usuario (solo admin)
router.put('/:id', requireAdmin, userController.updateUser);

// DELETE /api/users/:id - Eliminar usuario (solo admin)
router.delete('/:id', requireAdmin, userController.deleteUser);

module.exports = router;