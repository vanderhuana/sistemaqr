const { Participante } = require('../models');
const { generateUniqueQRCode } = require('../utils/qrUtils');

// Crear participante
exports.createParticipante = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      ci,
      telefono,
      correo,
      zona,
      fechaNacimiento,
      area,
      empresaId,
      sexo,
      ocupacion,
      nombreReferencia,
      parentesco,
      celularReferencia,
      urlFoto,
      datosExtra
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !telefono) {
      return res.status(400).json({
        error: 'Campos requeridos: nombre, apellido, telefono'
      });
    }

    // Convertir a mayúsculas los campos de texto principales
    const nombreMayusculas = nombre.toUpperCase().trim();
    const apellidoMayusculas = apellido.toUpperCase().trim();
    const zonaMayusculas = zona ? zona.toUpperCase().trim() : null;
    const areaMayusculas = area ? area.toUpperCase().trim() : null;
    const sexoMayusculas = sexo ? sexo.toUpperCase().trim() : null;
    const ocupacionMayusculas = ocupacion ? ocupacion.toUpperCase().trim() : null;
    const nombreReferenciaMayusculas = nombreReferencia ? nombreReferencia.toUpperCase().trim() : null;
    const parentescoMayusculas = parentesco ? parentesco.toUpperCase().trim() : null;

    // Validar que la empresa tenga cupo disponible
    if (empresaId) {
      const { Empresa } = require('../models');
      const empresa = await Empresa.findByPk(empresaId);
      
      if (!empresa) {
        return res.status(400).json({
          error: 'La empresa seleccionada no existe'
        });
      }

      if (!empresa.activo) {
        return res.status(400).json({
          error: 'La empresa seleccionada está inactiva'
        });
      }

      const tieneCupo = await empresa.tieneCupoDisponible();
      if (!tieneCupo) {
        return res.status(400).json({
          error: 'La empresa seleccionada ya no tiene cupo disponible'
        });
      }
    }

    // Verificar si el CI ya existe (solo si se proporciona)
    if (ci) {
      const participanteExistente = await Participante.findOne({ where: { ci } });
      if (participanteExistente) {
        return res.status(400).json({
          error: 'Ya existe un participante con este CI'
        });
      }
    }

    // Generar QR único
    let qrCode = null;
    let intentos = 0;
    const maxIntentos = 5;

    while (!qrCode && intentos < maxIntentos) {
      try {
        const tempToken = require('uuid').v4();
        qrCode = await generateUniqueQRCode(tempToken, 'participante');
        
        const qrExistente = await Participante.findOne({ where: { qrCode } });
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

    // Crear participante
    const participante = await Participante.create({
      nombre: nombreMayusculas,
      apellido: apellidoMayusculas,
      ci,
      telefono,
      correo: correo ? correo.toLowerCase().trim() : null,
      zona: zonaMayusculas,
      fechaNacimiento,
      area: areaMayusculas,
      empresaId,
      sexo: sexoMayusculas,
      ocupacion: ocupacionMayusculas,
      nombreReferencia: nombreReferenciaMayusculas,
      parentesco: parentescoMayusculas,
      celularReferencia,
      qrCode,
      urlFoto,
      datosExtra: datosExtra || {},
      estado: 'activo'
    });

    res.status(201).json({
      success: true,
      message: 'Participante registrado exitosamente',
      data: participante
    });
  } catch (error) {
    console.error('Error al crear participante:', error);
    res.status(500).json({
      error: 'Error al registrar participante',
      details: error.message
    });
  }
};

// Obtener todos los participantes
exports.getAllParticipantes = async (req, res) => {
  try {
    const { Empresa } = require('../models');
    
    const participantes = await Participante.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: Empresa,
        as: 'Empresa',
        attributes: ['id', 'nombre', 'cupoTotal', 'activo']
      }]
    });

    res.json({
      success: true,
      data: {
        participantes,
        total: participantes.length
      }
    });
  } catch (error) {
    console.error('Error al obtener participantes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener participantes',
      details: error.message
    });
  }
};

// Obtener participante por ID
exports.getParticipanteById = async (req, res) => {
  try {
    const { id } = req.params;

    const participante = await Participante.findByPk(id);

    if (!participante) {
      return res.status(404).json({
        error: 'Participante no encontrado'
      });
    }

    res.json({ participante });
  } catch (error) {
    console.error('Error al obtener participante:', error);
    res.status(500).json({
      error: 'Error al obtener participante',
      details: error.message
    });
  }
};

// Actualizar participante
exports.updateParticipante = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const participante = await Participante.findByPk(id);

    if (!participante) {
      return res.status(404).json({
        error: 'Participante no encontrado'
      });
    }

    // Si se actualiza el CI, verificar que no exista
    if (datos.ci && datos.ci !== participante.ci) {
      const ciExistente = await Participante.findOne({ where: { ci: datos.ci } });
      if (ciExistente) {
        return res.status(400).json({
          error: 'Ya existe un participante con este CI'
        });
      }
    }

    await participante.update(datos);

    res.json({
      message: 'Participante actualizado exitosamente',
      participante
    });
  } catch (error) {
    console.error('Error al actualizar participante:', error);
    res.status(500).json({
      error: 'Error al actualizar participante',
      details: error.message
    });
  }
};

// Eliminar participante
exports.deleteParticipante = async (req, res) => {
  try {
    const { id } = req.params;

    const participante = await Participante.findByPk(id);

    if (!participante) {
      return res.status(404).json({
        error: 'Participante no encontrado'
      });
    }

    await participante.destroy();

    res.json({
      message: 'Participante eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar participante:', error);
    res.status(500).json({
      error: 'Error al eliminar participante',
      details: error.message
    });
  }
};

// Obtener participante por token
exports.getParticipanteByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const participante = await Participante.findOne({ where: { token } });

    if (!participante) {
      return res.status(404).json({
        error: 'Participante no encontrado'
      });
    }

    res.json({ participante });
  } catch (error) {
    console.error('Error al obtener participante:', error);
    res.status(500).json({
      error: 'Error al obtener participante',
      details: error.message
    });
  }
};
