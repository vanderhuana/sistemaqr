const { RegistroFeipobol, PremioFeipobol, GanadorFeipobol } = require('../models');
const { Op } = require('sequelize');
const { generateUniqueQRCode } = require('../utils/qrUtils');
const { generarImagenPremio, generarImagenSigueParticipando } = require('../utils/premioImageUtils');
const ExcelJS = require('exceljs');

const registroFeipobolController = {
  // Obtener todos los registros (solo admin)
  async getAll(req, res) {
    try {
      const registros = await RegistroFeipobol.findAll({
        order: [['fechaRegistro', 'DESC']]
      });

      res.json({
        success: true,
        registros: registros,
        total: registros.length
      });
    } catch (error) {
      console.error('Error obteniendo registros FEIPOBOL:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener estadísticas
  async getStats(req, res) {
    try {
      const total = await RegistroFeipobol.count();
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const manana = new Date(hoy);
      manana.setDate(manana.getDate() + 1);

      const registrosHoy = await RegistroFeipobol.count({
        where: {
          fechaRegistro: {
            [Op.gte]: hoy,
            [Op.lt]: manana
          }
        }
      });

      const participantes = await RegistroFeipobol.count({
        where: {
          participoSorteo: true
        }
      });

      const ganadores = await RegistroFeipobol.count({
        where: {
          premioGanado: {
            [Op.ne]: null
          }
        }
      });

      const empresasActivas = 0;

      res.json({
        success: true,
        stats: {
          total,
          registrosHoy,
          participantes,
          ganadores,
          empresasActivas
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

  // Marcar participación en sorteo
  async marcarParticipacion(req, res) {
    try {
      const { id } = req.params;
      const { participoSorteo, fechaSorteo, premioGanado } = req.body;

      const registro = await RegistroFeipobol.findByPk(id);
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      }

      await registro.update({
        participoSorteo: participoSorteo || false,
        fechaSorteo: fechaSorteo || new Date(),
        premioGanado: premioGanado || null
      });

      res.json({
        success: true,
        message: 'Registro actualizado exitosamente',
        registro
      });
    } catch (error) {
      console.error('Error actualizando registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Marcar premio ganado
  async marcarPremio(req, res) {
    try {
      const { id } = req.params;
      const { premioGanado } = req.body;

      const registro = await RegistroFeipobol.findByPk(id);
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      }

      await registro.update({
        premioGanado,
        participoSorteo: true,
        fechaSorteo: registro.fechaSorteo || new Date()
      });

      res.json({
        success: true,
        message: 'Premio asignado exitosamente',
        registro
      });
    } catch (error) {
      console.error('Error asignando premio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Exportar a Excel
  async exportToExcel(req, res) {
    try {
      const registros = await RegistroFeipobol.findAll({
        order: [['numeroSorteo', 'ASC']]
      });

      // Crear workbook de Excel
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Registros FEIPOBOL 2025');

      // Configurar columnas
      worksheet.columns = [
        { header: 'N° Sorteo', key: 'numeroSorteo', width: 12 },
        { header: 'Nombre', key: 'nombre', width: 20 },
        { header: 'Apellido', key: 'apellido', width: 20 },
        { header: 'CI', key: 'ci', width: 15 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Correo', key: 'correo', width: 25 },
        { header: 'Zona', key: 'zona', width: 20 },
        { header: 'Fecha Registro', key: 'fechaRegistro', width: 20 },
        { header: 'IP Registro', key: 'ipRegistro', width: 15 },
        { header: 'Participó Sorteo', key: 'participoSorteo', width: 15 },
        { header: 'Fecha Sorteo', key: 'fechaSorteo', width: 20 },
        { header: 'Premio Ganado', key: 'premioGanado', width: 25 },
        { header: 'Token', key: 'token', width: 40 }
      ];

      // Agregar datos
      registros.forEach(registro => {
        worksheet.addRow({
          numeroSorteo: registro.numeroSorteo,
          nombre: registro.nombre,
          apellido: registro.apellido,
          ci: registro.ci,
          telefono: registro.telefono,
          correo: registro.correo,
          zona: registro.zona,
          fechaRegistro: new Date(registro.fechaRegistro).toLocaleString('es-ES'),
          ipRegistro: registro.ipRegistro,
          participoSorteo: registro.participoSorteo ? 'Sí' : 'No',
          fechaSorteo: registro.fechaSorteo ? new Date(registro.fechaSorteo).toLocaleString('es-ES') : '',
          premioGanado: registro.premioGanado || '',
          token: registro.token
        });
      });

      // Estilizar header
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9080' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Configurar respuesta
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=registro-feipobol-${new Date().toISOString().split('T')[0]}.xlsx`);

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error exportando a Excel:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar datos'
      });
    }
  },

  // Obtener registro por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      const registro = await RegistroFeipobol.findByPk(id);

      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      }

      res.json({
        success: true,
        registro
      });
    } catch (error) {
      console.error('Error obteniendo registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Eliminar registro (solo en casos excepcionales)
  async delete(req, res) {
    try {
      const { id } = req.params;

      const registro = await RegistroFeipobol.findByPk(id);
      if (!registro) {
        return res.status(404).json({
          success: false,
          message: 'Registro no encontrado'
        });
      }

      await registro.destroy();

      res.json({
        success: true,
        message: 'Registro eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error eliminando registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Búsqueda avanzada
  async search(req, res) {
    try {
      const { query, estado, fechaInicio, fechaFin } = req.query;

      let whereClause = {};

      // Búsqueda por texto
      if (query) {
        whereClause[Op.or] = [
          { nombre: { [Op.iLike]: `%${query}%` } },
          { apellido: { [Op.iLike]: `%${query}%` } },
          { ci: { [Op.iLike]: `%${query}%` } },
          { correo: { [Op.iLike]: `%${query}%` } },
          { telefono: { [Op.iLike]: `%${query}%` } }
        ];
      }

      // Filtrar por estado
      if (estado === 'participoSorteo') {
        whereClause.participoSorteo = true;
      } else if (estado === 'ganador') {
        whereClause.premioGanado = { [Op.ne]: null };
      } else if (estado === 'activo') {
        whereClause.participoSorteo = false;
      }

      // Filtrar por fechas
      if (fechaInicio || fechaFin) {
        whereClause.fechaRegistro = {};
        if (fechaInicio) {
          whereClause.fechaRegistro[Op.gte] = new Date(fechaInicio);
        }
        if (fechaFin) {
          const fechaFinDate = new Date(fechaFin);
          fechaFinDate.setHours(23, 59, 59, 999);
          whereClause.fechaRegistro[Op.lte] = fechaFinDate;
        }
      }

      const registros = await RegistroFeipobol.findAll({
        where: whereClause,
        order: [['fechaRegistro', 'DESC']]
      });

      res.json({
        success: true,
        registros,
        total: registros.length
      });
    } catch (error) {
      console.error('Error en búsqueda:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la búsqueda'
      });
    }
  }
};

// ========== MÉTODOS PÚBLICOS (API REST) ==========

// Crear registro FEIPOBOL
const createRegistroFeipobol = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      ci,
      telefono,
      correo,
      zona
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !ci || !telefono) {
      return res.status(400).json({
        error: 'Campos requeridos: nombre, apellido, ci, telefono'
      });
    }

    // Convertir a mayúsculas los campos de texto principales
    const nombreMayusculas = nombre.toUpperCase().trim();
    const apellidoMayusculas = apellido.toUpperCase().trim();
    const zonaMayusculas = zona ? zona.toUpperCase().trim() : null;

    // Verificar si el CI ya existe
    const registroExistente = await RegistroFeipobol.findOne({ where: { ci } });
    if (registroExistente) {
      return res.status(400).json({
        error: 'Ya existe un registro con este CI'
      });
    }

    // Generar QR único basado en el token (se genera automáticamente)
    let qrCode = null;
    let intentos = 0;
    const maxIntentos = 5;

    while (!qrCode && intentos < maxIntentos) {
      try {
        const tempToken = require('uuid').v4();
        qrCode = await generateUniqueQRCode(tempToken, 'feipobol');
        
        // Verificar unicidad del QR
        const qrExistente = await RegistroFeipobol.findOne({ where: { qrCode } });
        if (qrExistente) {
          qrCode = null;
          intentos++;
        } else {
          break;
        }
      } catch (error) {
        intentos++;
      }
    }

    if (!qrCode) {
      return res.status(500).json({
        error: 'No se pudo generar un código QR único'
      });
    }

    // Generar número de sorteo secuencial
    const ultimoNumero = await RegistroFeipobol.max('numeroSorteo') || 0;
    const numeroSorteo = ultimoNumero + 1;

    console.log(`🔢 Número de sorteo asignado: ${numeroSorteo}`);

    // Crear registro FEIPOBOL
    const registro = await RegistroFeipobol.create({
      nombre: nombreMayusculas,
      apellido: apellidoMayusculas,
      ci,
      telefono,
      correo: correo ? correo.toLowerCase().trim() : null,
      zona: zonaMayusculas,
      qrCode,
      numeroSorteo
    });

    // Recargar para asegurar que el token generado automáticamente esté incluido
    await registro.reload();

    // FORZAR RECARGA - CAMBIO TIMESTAMP: 2025-11-05 14:30
    console.log(`🎲 Verificando premio para número de sorteo: ${numeroSorteo}`);

    // ===== VERIFICAR SI GANÓ UN PREMIO =====
    let premioInfo = null;
    let imagenPath = null;
    let esGanador = false;

    try {
      // Buscar si existe un premio configurado para este número
      console.log(`🔍 Buscando premio con numeroSorteo = ${numeroSorteo}, activo = true`);
      
      const premio = await PremioFeipobol.findOne({
        where: {
          numeroSorteo: numeroSorteo,
          activo: true
        }
      });

      console.log(`📦 Resultado de búsqueda de premio:`, premio ? {
        id: premio.id,
        numeroSorteo: premio.numeroSorteo,
        nombrePremio: premio.nombrePremio,
        activo: premio.activo
      } : 'null (no encontrado)');

      if (premio) {
        console.log(`🎉 ¡GANADOR DETECTADO! Premio encontrado: ${premio.nombrePremio} (ID: ${premio.id})`);
        esGanador = true;

        // Registrar al ganador
        console.log(`💾 Creando registro de ganador...`);
        console.log(`   - registroId: ${registro.id} (tipo: ${typeof registro.id})`);
        console.log(`   - premioId: ${premio.id} (tipo: ${typeof premio.id})`);
        
        const ganador = await GanadorFeipobol.create({
          registroId: registro.id,
          premioId: premio.id,
          fechaGanado: new Date()
        });

        console.log(`✅ Ganador registrado en BD:`, {
          id: ganador.id,
          registroId: ganador.registroId,
          premioId: ganador.premioId,
          fechaGanado: ganador.fechaGanado
        });

        // Generar imagen personalizada del premio (OPCIONAL)
        console.log(`🖼️ Generando imagen del premio...`);
        try {
          imagenPath = await generarImagenPremio({
            nombrePremio: premio.nombrePremio,
            descripcionPremio: premio.descripcionPremio,
            numeroSorteo: numeroSorteo
          });
          console.log(`✅ Imagen generada: ${imagenPath}`);
          
          // Actualizar el premio con la imagen generada
          await premio.update({ imagenPath: imagenPath });
          console.log(`✅ Premio actualizado con imagenPath`);
        } catch (imgError) {
          console.log(`⚠️ No se pudo generar imagen (continuando sin ella):`, imgError.message);
          imagenPath = null;
        }

        premioInfo = {
          id: premio.id,
          nombrePremio: premio.nombrePremio,
          descripcionPremio: premio.descripcionPremio,
          valorPremio: premio.valorPremio,
          imagenPath: imagenPath,
          fechaGanado: ganador.fechaGanado
        };

        console.log(`✅ GANADOR PROCESADO EXITOSAMENTE`);

      } else {
        console.log(`😊 Número ${numeroSorteo} no tiene premio configurado`);
        console.log(`📝 Generando imagen "Sigue Participando"...`);
        
        // Generar imagen de "Sigue Participando" (OPCIONAL)
        try {
          imagenPath = await generarImagenSigueParticipando(numeroSorteo);
          console.log(`✅ Imagen "Sigue Participando" generada: ${imagenPath}`);
        } catch (imgError) {
          console.log(`⚠️ No se pudo generar imagen (continuando sin ella):`, imgError.message);
          imagenPath = null;
        }
      }

    } catch (error) {
      console.error('❌ ERROR CRÍTICO verificando premio:', error);
      console.error('Stack trace:', error.stack);
      // Si hay error con premios, continúa sin fallar el registro
      imagenPath = null;
    }

    // Preparar respuesta
    const registroJSON = registro.toJSON();
    const respuesta = {
      success: true,
      message: esGanador ? 
        `¡FELICITACIONES! Ganaste: ${premioInfo.nombrePremio}` : 
        'Registro completado. ¡Sigue participando!',
      data: {
        ...registroJSON,
        esGanador: esGanador,
        imagenPath: imagenPath,
        premio: premioInfo
      }
    };

    console.log('===== RESPUESTA REGISTRO FEIPOBOL =====');
    console.log('esGanador:', esGanador);
    console.log('imagenPath:', imagenPath);
    console.log('premio:', premioInfo ? premioInfo.nombrePremio : 'ninguno');

    res.status(201).json(respuesta);
  } catch (error) {
    console.error('Error al crear registro FEIPOBOL:', error);
    res.status(500).json({
      error: 'Error al registrar para FEIPOBOL',
      details: error.message
    });
  }
};

// Obtener todos los registros FEIPOBOL
const getAllRegistrosFeipobol = async (req, res) => {
  try {
    const registros = await RegistroFeipobol.findAll({
      include: [
        {
          model: GanadorFeipobol,
          as: 'PremioGanado',
          required: false,
          include: [
            {
              model: PremioFeipobol,
              as: 'Premio',
              required: false
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        registros,
        total: registros.length
      }
    });
  } catch (error) {
    console.error('Error al obtener registros FEIPOBOL:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener registros FEIPOBOL',
      details: error.message
    });
  }
};

// Obtener registro FEIPOBOL por ID
const getRegistroFeipobolById = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await RegistroFeipobol.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        error: 'Registro FEIPOBOL no encontrado'
      });
    }

    res.json({ registro });
  } catch (error) {
    console.error('Error al obtener registro FEIPOBOL:', error);
    res.status(500).json({
      error: 'Error al obtener registro FEIPOBOL',
      details: error.message
    });
  }
};

// Actualizar registro FEIPOBOL
const updateRegistroFeipobol = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const registro = await RegistroFeipobol.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        error: 'Registro FEIPOBOL no encontrado'
      });
    }

    // Si se actualiza el CI, verificar que no exista
    if (datos.ci && datos.ci !== registro.ci) {
      const ciExistente = await RegistroFeipobol.findOne({ where: { ci: datos.ci } });
      if (ciExistente) {
        return res.status(400).json({
          error: 'Ya existe un registro con este CI'
        });
      }
    }

    await registro.update(datos);

    res.json({
      message: 'Registro FEIPOBOL actualizado exitosamente',
      registro
    });
  } catch (error) {
    console.error('Error al actualizar registro FEIPOBOL:', error);
    res.status(500).json({
      error: 'Error al actualizar registro FEIPOBOL',
      details: error.message
    });
  }
};

// Eliminar registro FEIPOBOL
const deleteRegistroFeipobol = async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await RegistroFeipobol.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        error: 'Registro FEIPOBOL no encontrado'
      });
    }

    await registro.destroy();

    res.json({
      message: 'Registro FEIPOBOL eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar registro FEIPOBOL:', error);
    res.status(500).json({
      error: 'Error al eliminar registro FEIPOBOL',
      details: error.message
    });
  }
};

// Obtener registro FEIPOBOL por token (para validación QR)
const getRegistroFeipobolByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const registro = await RegistroFeipobol.findOne({ where: { token } });

    if (!registro) {
      return res.status(404).json({
        error: 'Registro FEIPOBOL no encontrado'
      });
    }

    res.json({ registro });
  } catch (error) {
    console.error('Error al obtener registro FEIPOBOL:', error);
    res.status(500).json({
      error: 'Error al obtener registro FEIPOBOL',
      details: error.message
    });
  }
};

// Agregar los nuevos métodos al objeto exportado
registroFeipobolController.createRegistroFeipobol = createRegistroFeipobol;
registroFeipobolController.getAllRegistrosFeipobol = getAllRegistrosFeipobol;
registroFeipobolController.getRegistroFeipobolById = getRegistroFeipobolById;
registroFeipobolController.updateRegistroFeipobol = updateRegistroFeipobol;
registroFeipobolController.deleteRegistroFeipobol = deleteRegistroFeipobol;
registroFeipobolController.getRegistroFeipobolByToken = getRegistroFeipobolByToken;

module.exports = registroFeipobolController;