const express = require('express');
const router = express.Router();
const PublicController = require('../controllers/publicController');
const { createRegistroFeipobol } = require('../controllers/registroFeipobolController');

/**
 * @route POST /api/public/registro
 * @desc Registrar participante desde formulario público con detección de premios
 * @access Public
 */
router.post('/registro', createRegistroFeipobol);

/**
 * @route GET /api/public/health
 * @desc Health check
 * @access Public
 */
router.get('/health', PublicController.healthCheck);

module.exports = router;
