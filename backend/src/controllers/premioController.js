const { PremioFeipobol, GanadorFeipobol, RegistroFeipobol } = require('../models');
const { Op } = require('sequelize');
const { generarImagenPremio } = require('../utils/premioImageUtils');

const premioController = {
  // ===== MÉTODOS PARA ADMINISTRACIÓN DE PREMIOS =====

  // Obtener todos los premios configurados
  async getAll(req, res) {
    try {
      console.log('🔍 GET /api/admin/premios - Obteniendo todos los premios...');
      
      const premios = await PremioFeipobol.findAll({
        include: [
          {
            model: GanadorFeipobol,
            as: 'Ganador',
            required: false, // LEFT JOIN
            include: [
              {
                model: RegistroFeipobol,
                as: 'Registro',
                required: false, // LEFT JOIN
                attributes: ['id', 'nombre', 'apellido', 'ci', 'telefono', 'numeroSorteo']
              }
            ]
          }
        ],
        order: [['numeroSorteo', 'ASC']]
      });

      console.log('📊 Premios encontrados:', premios.length);
      
      // Convertir a JSON para logging
      const premiosJSON = premios.map(p => p.toJSON());
      premiosJSON.forEach(p => {
        console.log(`  🏆 Premio #${p.numeroSorteo}: ${p.nombrePremio}`);
        if (p.Ganador) {
          console.log(`    ✅ Ganador ID: ${p.Ganador.id}`);
          console.log(`    👤 Registro:`, p.Ganador.Registro);
        } else {
          console.log(`    ❌ Sin ganador aún`);
        }
      });

      res.json({
        success: true,
        premios: premiosJSON,
        total: premiosJSON.length
      });
    } catch (error) {
      console.error('❌ Error obteniendo premios:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Crear un nuevo premio
  async create(req, res) {
    try {
      const {
        numeroSorteo,
        nombrePremio,
        descripcionPremio,
        valorPremio,
        activo = true
      } = req.body;

      // Validaciones
      if (!numeroSorteo || !nombrePremio) {
        return res.status(400).json({
          success: false,
          message: 'Número de sorteo y nombre del premio son requeridos'
        });
      }

      // Verificar que el número no esté ya usado
      const premioExistente = await PremioFeipobol.findOne({
        where: { numeroSorteo }
      });

      if (premioExistente) {
        return res.status(400).json({
          success: false,
          message: `Ya existe un premio configurado para el número ${numeroSorteo}`
        });
      }

      // Verificar si ya hay un registro con ese número
      const registroConNumero = await RegistroFeipobol.findOne({
        where: { numeroSorteo }
      });

      if (registroConNumero) {
        return res.status(400).json({
          success: false,
          message: `No se puede crear premio para el número ${numeroSorteo} porque ya fue asignado a un participante`
        });
      }

      // Crear el premio
      const premio = await PremioFeipobol.create({
        numeroSorteo,
        nombrePremio: nombrePremio.trim(),
        descripcionPremio: descripcionPremio ? descripcionPremio.trim() : null,
        valorPremio: valorPremio || null,
        activo
      });

      res.status(201).json({
        success: true,
        message: 'Premio creado exitosamente',
        premio
      });

    } catch (error) {
      console.error('Error creando premio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar un premio existente
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        numeroSorteo,
        nombrePremio,
        descripcionPremio,
        valorPremio,
        activo
      } = req.body;

      const premio = await PremioFeipobol.findByPk(id);
      if (!premio) {
        return res.status(404).json({
          success: false,
          message: 'Premio no encontrado'
        });
      }

      // Verificar si ya fue ganado
      const ganador = await GanadorFeipobol.findOne({
        where: { premioId: id }
      });

      if (ganador) {
        return res.status(400).json({
          success: false,
          message: 'No se puede modificar un premio que ya fue ganado'
        });
      }

      // Si se cambia el número, verificar que no exista
      if (numeroSorteo && numeroSorteo !== premio.numeroSorteo) {
        const premioExistente = await PremioFeipobol.findOne({
          where: { numeroSorteo, id: { [Op.ne]: id } }
        });

        if (premioExistente) {
          return res.status(400).json({
            success: false,
            message: `Ya existe un premio configurado para el número ${numeroSorteo}`
          });
        }

        // Verificar si ya hay un registro con ese número
        const registroConNumero = await RegistroFeipobol.findOne({
          where: { numeroSorteo }
        });

        if (registroConNumero) {
          return res.status(400).json({
            success: false,
            message: `No se puede usar el número ${numeroSorteo} porque ya fue asignado a un participante`
          });
        }
      }

      // Actualizar premio
      await premio.update({
        numeroSorteo: numeroSorteo || premio.numeroSorteo,
        nombrePremio: nombrePremio ? nombrePremio.trim() : premio.nombrePremio,
        descripcionPremio: descripcionPremio !== undefined ? (descripcionPremio ? descripcionPremio.trim() : null) : premio.descripcionPremio,
        valorPremio: valorPremio !== undefined ? valorPremio : premio.valorPremio,
        activo: activo !== undefined ? activo : premio.activo
      });

      res.json({
        success: true,
        message: 'Premio actualizado exitosamente',
        premio
      });

    } catch (error) {
      console.error('Error actualizando premio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar un premio
  async delete(req, res) {
    try {
      const { id } = req.params;

      const premio = await PremioFeipobol.findByPk(id);
      if (!premio) {
        return res.status(404).json({
          success: false,
          message: 'Premio no encontrado'
        });
      }

      // Verificar si ya fue ganado
      const ganador = await GanadorFeipobol.findOne({
        where: { premioId: id }
      });

      if (ganador) {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar un premio que ya fue ganado'
        });
      }

      await premio.destroy();

      res.json({
        success: true,
        message: 'Premio eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando premio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener estadísticas de premios
  async getStats(req, res) {
    try {
      const totalPremios = await PremioFeipobol.count();
      const premiosActivos = await PremioFeipobol.count({ where: { activo: true } });
      const premiosGanados = await GanadorFeipobol.count();
      const premiosDisponibles = premiosActivos - premiosGanados;

      // Calcular valor total de premios
      const totalValor = await PremioFeipobol.sum('valorPremio', {
        where: { activo: true }
      }) || 0;

      const valorGanado = await PremioFeipobol.sum('valorPremio', {
        include: [{
          model: GanadorFeipobol,
          as: 'Ganador',
          required: true
        }]
      }) || 0;

      res.json({
        success: true,
        stats: {
          totalPremios,
          premiosActivos,
          premiosGanados,
          premiosDisponibles,
          totalValor,
          valorGanado,
          valorDisponible: totalValor - valorGanado
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener todos los ganadores
  async getGanadores(req, res) {
    try {
      const ganadores = await GanadorFeipobol.findAll({
        include: [
          {
            model: PremioFeipobol,
            as: 'Premio'
          },
          {
            model: RegistroFeipobol,
            as: 'Registro'
          }
        ],
        order: [['fechaGanado', 'DESC']]
      });

      res.json({
        success: true,
        ganadores: ganadores,
        total: ganadores.length
      });

    } catch (error) {
      console.error('Error obteniendo ganadores:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Marcar premio como entregado
  async marcarEntregado(req, res) {
    try {
      const { id } = req.params;
      const { entregado, observaciones } = req.body;

      const ganador = await GanadorFeipobol.findByPk(id);
      if (!ganador) {
        return res.status(404).json({
          success: false,
          message: 'Ganador no encontrado'
        });
      }

      await ganador.update({
        entregado: entregado !== undefined ? entregado : true,
        fechaEntrega: entregado !== false ? new Date() : null,
        observaciones: observaciones || ganador.observaciones
      });

      res.json({
        success: true,
        message: entregado !== false ? 'Premio marcado como entregado' : 'Entrega desmarcada',
        ganador
      });

    } catch (error) {
      console.error('Error marcando entrega:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = premioController;