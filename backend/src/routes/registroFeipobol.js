const express = require('express');
const router = express.Router();
const registroFeipobolController = require('../controllers/registroFeipobolController');

// Rutas CRUD públicas para FEIPOBOL 2025
router.post('/', registroFeipobolController.createRegistroFeipobol);
router.get('/', registroFeipobolController.getAllRegistrosFeipobol);
router.get('/:id', registroFeipobolController.getRegistroFeipobolById);
router.put('/:id', registroFeipobolController.updateRegistroFeipobol);
router.delete('/:id', registroFeipobolController.deleteRegistroFeipobol);

// Ruta para obtener por token (validación QR)
router.get('/token/:token', registroFeipobolController.getRegistroFeipobolByToken);

module.exports = router;