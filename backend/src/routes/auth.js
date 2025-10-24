const express = require('express');
const router = express.Router();

// Importar controladores y middleware
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateRefreshToken
} = require('../middleware/validators');

// **RUTAS PÚBLICAS** (no requieren autenticación)

// POST /api/auth/login - Login de usuario
router.post('/login', validateLogin, authController.login);

// POST /api/auth/register - Registro de usuario (público para vendedores)
router.post('/register', validateRegister, authController.register);

// POST /api/auth/refresh - Refrescar token
router.post('/refresh', validateRefreshToken, authController.refreshToken);

// **RUTAS PROTEGIDAS** (requieren autenticación)

// GET /api/auth/profile - Obtener perfil del usuario autenticado
router.get('/profile', authenticateToken, authController.getProfile);

// PUT /api/auth/profile - Actualizar perfil del usuario autenticado
router.put('/profile', 
  authenticateToken, 
  validateUpdateProfile, 
  authController.updateProfile
);

// POST /api/auth/change-password - Cambiar contraseña
router.post('/change-password', 
  authenticateToken, 
  validateChangePassword, 
  authController.changePassword
);

// POST /api/auth/logout - Logout (invalidar token)
router.post('/logout', authenticateToken, authController.logout);

// GET /api/auth/verify - Verificar si el token es válido
router.get('/verify', authenticateToken, authController.verifyAuth);

// **RUTAS ADMINISTRATIVAS** (solo admin)

// POST /api/auth/register-admin - Solo admin puede crear otros admins
router.post('/register-admin', 
  authenticateToken, 
  requireAdmin, 
  validateRegister, 
  authController.register
);

module.exports = router;