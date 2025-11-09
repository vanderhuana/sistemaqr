const express = require('express');
const router = express.Router();
const configuracionController = require('../controllers/configuracionController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Ruta pública para verificar si formularios están activos
router.get('/formularios-status', async (req, res) => {
  try {
    const { Configuracion } = require('../models');

    const [participantes, trabajadores, feipobol] = await Promise.all([
      Configuracion.findOne({ where: { clave: 'formulario_participantes_activo' } }),
      Configuracion.findOne({ where: { clave: 'formulario_trabajadores_activo' } }),
      Configuracion.findOne({ where: { clave: 'formulario_feipobol_activo' } })
    ]);

    res.json({
      success: true,
      data: {
        participantes: participantes ? participantes.valor === 'true' : true,
        trabajadores: trabajadores ? trabajadores.valor === 'true' : true,
        feipobol: feipobol ? feipobol.valor === 'true' : true
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        participantes: true,
        trabajadores: true,
        feipobol: true
      }
    });
  }
});

// Rutas protegidas (solo admin)
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// GET /api/configuracion - Obtener todas las configuraciones
router.get('/', configuracionController.getAll);

// GET /api/configuracion/:clave - Obtener configuración específica
router.get('/:clave', configuracionController.getByKey);

// POST /api/configuracion - Crear/actualizar configuración
router.post('/', configuracionController.set);

// POST /api/configuracion/toggle/:tipo - Toggle formularios (participantes/trabajadores)
router.post('/toggle/:tipo', configuracionController.toggleFormulario);

module.exports = router;
