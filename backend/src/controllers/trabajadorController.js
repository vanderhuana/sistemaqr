const { Trabajador } = require('../models');
const { generateUniqueQRCode } = require('../utils/qrUtils');

// Crear trabajador
exports.createTrabajador = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      ci,
      telefono,
      correo,
      zona,
      fechaNacimiento,
      areaTrabajo,
      sexo,
      ocupacion,
      nombreReferencia,
      parentesco,
      celularReferencia,
      urlFoto
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !apellido || !ci || !telefono || !areaTrabajo) {
      return res.status(400).json({
        error: 'Campos requeridos: nombre, apellido, ci, telefono, areaTrabajo'
      });
    }

    // Convertir a mayúsculas los campos de texto principales
    const nombreMayusculas = nombre.toUpperCase().trim();
    const apellidoMayusculas = apellido.toUpperCase().trim();
    const zonaMayusculas = zona ? zona.toUpperCase().trim() : null;
    const areaTrabajoMayusculas = areaTrabajo.toUpperCase().trim();
    const sexoMayusculas = sexo ? sexo.toUpperCase().trim() : null;
    const ocupacionMayusculas = ocupacion ? ocupacion.toUpperCase().trim() : null;
    const nombreReferenciaMayusculas = nombreReferencia ? nombreReferencia.toUpperCase().trim() : null;
    const parentescoMayusculas = parentesco ? parentesco.toUpperCase().trim() : null;

    // Verificar si el CI ya existe
    const trabajadorExistente = await Trabajador.findOne({ where: { ci } });
    if (trabajadorExistente) {
      return res.status(400).json({
        error: 'Ya existe un trabajador con este CI'
      });
    }

    // Generar QR único basado en el token (se genera automáticamente)
    let qrCode = null;
    let intentos = 0;
    const maxIntentos = 5;

    while (!qrCode && intentos < maxIntentos) {
      try {
        const tempToken = require('uuid').v4();
        qrCode = await generateUniqueQRCode(tempToken, 'trabajador');
        
        // Verificar unicidad del QR
        const qrExistente = await Trabajador.findOne({ where: { qrCode } });
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

    // Crear trabajador
    const trabajador = await Trabajador.create({
      nombre: nombreMayusculas,
      apellido: apellidoMayusculas,
      ci,
      telefono,
      correo: correo ? correo.toLowerCase().trim() : null,
      zona: zonaMayusculas,
      fechaNacimiento,
      areaTrabajo: areaTrabajoMayusculas,
      sexo: sexoMayusculas,
      ocupacion: ocupacionMayusculas,
      nombreReferencia: nombreReferenciaMayusculas,
      parentesco: parentescoMayusculas,
      celularReferencia,
      qrCode,
      urlFoto,
      estado: 'activo'
    });

    // Recargar para asegurar que el token generado automáticamente esté incluido
    await trabajador.reload();

    res.status(201).json({
      success: true,
      message: 'Trabajador registrado exitosamente',
      data: trabajador
    });
  } catch (error) {
    console.error('Error al crear trabajador:', error);
    res.status(500).json({
      error: 'Error al registrar trabajador',
      details: error.message
    });
  }
};

// Obtener todos los trabajadores
exports.getAllTrabajadores = async (req, res) => {
  try {
    const trabajadores = await Trabajador.findAll({
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        trabajadores,
        total: trabajadores.length
      }
    });
  } catch (error) {
    console.error('Error al obtener trabajadores:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener trabajadores',
      details: error.message
    });
  }
};

// Obtener trabajador por ID
exports.getTrabajadorById = async (req, res) => {
  try {
    const { id } = req.params;

    const trabajador = await Trabajador.findByPk(id);

    if (!trabajador) {
      return res.status(404).json({
        error: 'Trabajador no encontrado'
      });
    }

    res.json({ trabajador });
  } catch (error) {
    console.error('Error al obtener trabajador:', error);
    res.status(500).json({
      error: 'Error al obtener trabajador',
      details: error.message
    });
  }
};

// Actualizar trabajador
exports.updateTrabajador = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = req.body;

    const trabajador = await Trabajador.findByPk(id);

    if (!trabajador) {
      return res.status(404).json({
        error: 'Trabajador no encontrado'
      });
    }

    // Si se actualiza el CI, verificar que no exista
    if (datos.ci && datos.ci !== trabajador.ci) {
      const ciExistente = await Trabajador.findOne({ where: { ci: datos.ci } });
      if (ciExistente) {
        return res.status(400).json({
          error: 'Ya existe un trabajador con este CI'
        });
      }
    }

    await trabajador.update(datos);

    res.json({
      message: 'Trabajador actualizado exitosamente',
      trabajador
    });
  } catch (error) {
    console.error('Error al actualizar trabajador:', error);
    res.status(500).json({
      error: 'Error al actualizar trabajador',
      details: error.message
    });
  }
};

// Eliminar trabajador
exports.deleteTrabajador = async (req, res) => {
  try {
    const { id } = req.params;

    const trabajador = await Trabajador.findByPk(id);

    if (!trabajador) {
      return res.status(404).json({
        error: 'Trabajador no encontrado'
      });
    }

    await trabajador.destroy();

    res.json({
      message: 'Trabajador eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar trabajador:', error);
    res.status(500).json({
      error: 'Error al eliminar trabajador',
      details: error.message
    });
  }
};

// Obtener trabajador por token (para validación QR)
exports.getTrabajadorByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const trabajador = await Trabajador.findOne({ where: { token } });

    if (!trabajador) {
      return res.status(404).json({
        error: 'Trabajador no encontrado'
      });
    }

    res.json({ trabajador });
  } catch (error) {
    console.error('Error al obtener trabajador:', error);
    res.status(500).json({
      error: 'Error al obtener trabajador',
      details: error.message
    });
  }
};
