const { RegistroFeipobol } = require('../models');
const QRCode = require('qrcode');

/**
 * Controlador para endpoints públicos (sin autenticación)
 */
class PublicController {

  /**
   * Registrar participante desde formulario público FEIPOBOL 2025
   */
  static async registrarParticipante(req, res) {
    try {
      const {
        nombre,
        apellido,
        ci,
        telefono,
        correo,
        zona,
        fechaNacimiento,
        sexo,
        empresaId
      } = req.body;

      console.log('📝 Nuevo registro FEIPOBOL 2025:', { nombre, apellido, ci, telefono });

      // Validaciones básicas
      if (!nombre || !apellido || !telefono) {
        return res.status(400).json({
          success: false,
          message: 'Nombre, apellido y teléfono son obligatorios'
        });
      }

      // Verificar si ya existe el CI (si se proporcionó)
      if (ci) {
        const existente = await RegistroFeipobol.findOne({ where: { ci } });
        if (existente) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un registro con este número de CI. Cada persona puede registrarse solo una vez.'
          });
        }
      }

      // Obtener IP del cliente
      const ipRegistro = req.ip || req.connection.remoteAddress;

      // Crear el registro
      const nuevoRegistro = await RegistroFeipobol.create({
        nombre,
        apellido,
        ci: ci || null,
        telefono,
        correo: correo || null,
        zona: zona || null,
        ipRegistro,
        estado: 'activo'
      });

      // Generar código QR con información del registro
      const qrData = {
        id: nuevoRegistro.id,
        token: nuevoRegistro.token,
        numeroSorteo: nuevoRegistro.numeroSorteo,
        nombre: `${nombre} ${apellido}`,
        tipo: 'feipobol2025'
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Guardar el QR en el registro
      await nuevoRegistro.update({
        qrCode: qrCodeDataURL
      });

      console.log('✅ Registro FEIPOBOL exitoso:', {
        id: nuevoRegistro.id,
        numeroSorteo: nuevoRegistro.numeroSorteo,
        nombre: `${nombre} ${apellido}`
      });

      res.status(201).json({
        success: true,
        message: '¡Registro exitoso! Gracias por participar en FEIPOBOL 2025',
        data: {
          id: nuevoRegistro.id,
          token: nuevoRegistro.token,
          numeroSorteo: nuevoRegistro.numeroSorteo,
          nombre: `${nombre} ${apellido}`,
          qrCode: qrCodeDataURL,
          fechaRegistro: nuevoRegistro.fechaRegistro
        }
      });

    } catch (error) {
      console.error('❌ Error registrando participante FEIPOBOL:', error);
      
      // Errores de validación de Sequelize
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: error.errors.map(e => e.message).join(', ')
        });
      }

      // Errores de unicidad
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Este número de CI ya está registrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al procesar el registro. Por favor, intente nuevamente.'
      });
    }
  }

  /**
   * Obtener lista de empresas para el formulario
   */
  /**
   * Verificar estado del servidor (health check)
   */
  static async healthCheck(req, res) {
    res.json({
      success: true,
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = PublicController;
