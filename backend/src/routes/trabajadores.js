const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajadorController');

// Rutas CRUD
router.post('/', trabajadorController.createTrabajador);
router.get('/', trabajadorController.getAllTrabajadores);
router.get('/:id', trabajadorController.getTrabajadorById);
router.put('/:id', trabajadorController.updateTrabajador);
router.delete('/:id', trabajadorController.deleteTrabajador);

// Ruta para obtener por token (validación QR)
router.get('/token/:token', trabajadorController.getTrabajadorByToken);

module.exports = router;
