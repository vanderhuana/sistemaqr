const express = require('express');
const router = express.Router();
const participanteController = require('../controllers/participanteController');

// Rutas CRUD
router.post('/', participanteController.createParticipante);
router.get('/', participanteController.getAllParticipantes);
router.get('/:id', participanteController.getParticipanteById);
router.put('/:id', participanteController.updateParticipante);
router.delete('/:id', participanteController.deleteParticipante);

// Ruta para obtener por token
router.get('/token/:token', participanteController.getParticipanteByToken);

module.exports = router;
