const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');

// Registrar nuevo staff
router.post('/', staffController.createStaff);

// Listar staff
router.get('/', staffController.getAllStaff);

module.exports = router;
