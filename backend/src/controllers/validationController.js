const { Op } = require('sequelize');
const { Ticket, Event, User, ValidationLog } = require('../models');

const validationController = {

  // **VALIDAR QR ESCANEADO DESDE CELULAR**
  async validateQRCode(req, res) {
    const startTime = Date.now();
    
    try {
      const { qrCode, eventId, location, deviceInfo, entryCount = 1 } = req.body;
      const validatorId = req.user.id;
      
      // Validar entryCount
      if (entryCount < 1 || entryCount > 10) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad de personas debe estar entre 1 y 10',
          result: 'invalid_entry_count'
        });
      }
      
      // Verificar que el usuario tenga rol de control
      if (req.user.role !== 'control' && req.user.role !== 'admin') {
        await ValidationLog.create({
          ticketId: null,
          eventId: eventId || null,
          validatedBy: validatorId,
          isValid: false,
          validationType: 'verification',
          validationResult: 'access_denied',
          qrCode: qrCode?.substring(0, 50) || 'unknown',
          deviceInfo: deviceInfo || {},
          location,
          ipAddress: req.ip,
          errorDetails: 'Usuario sin permisos de control',
          validationDuration: Date.now() - startTime,
          validatedAt: new Date()
        });
        
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para validar entradas',
          result: 'access_denied'
        });
      }

      // Validar que se proporcione el QR
      if (!qrCode) {
        return res.status(400).json({
          success: false,
          message: 'Código QR requerido',
          result: 'invalid_qr'
        });
      }

      // Buscar el ticket por el código QR
      const ticket = await Ticket.findOne({
        where: { qrCode },
        include: [
          {
            model: Event,
            as: 'Event',
            attributes: ['id', 'name', 'startDate', 'endDate', 'status', 'location']
          },
          {
            model: User,
            as: 'Seller',
            attributes: ['id', 'firstName', 'lastName', 'email'],
            required: false
          }
        ]
      });

      // Verificar si el ticket existe
      if (!ticket) {
        await validationController.logValidationAttempt({
          ticketId: null,
          eventId: null, // También establecer como null ya que no encontramos el ticket
          validatorId,
          qrCode,
          result: 'invalid_qr',
          isValid: false,
          deviceInfo,
          location,
          ipAddress: req.ip,
          startTime,
          errorDetails: 'QR no existe en el sistema'
        });
        
        return res.status(404).json({
          success: false,
          message: 'Código QR inválido',
          result: 'invalid_qr'
        });
      }

      // Verificar que el evento coincida (si se proporciona)
      if (eventId && ticket.eventId !== eventId) {
        await validationController.logValidationAttempt({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorId,
          qrCode,
          result: 'invalid_event',
          isValid: false,
          deviceInfo,
          location,
          ipAddress: req.ip,
          startTime,
          errorDetails: `Ticket pertenece al evento ${ticket.eventId}, no al ${eventId}`
        });
        
        return res.status(400).json({
          success: false,
          message: 'Este ticket no pertenece a este evento',
          result: 'invalid_event',
          ticketInfo: {
            eventName: ticket.Event.name,
            correctEvent: ticket.Event.id
          }
        });
      }

      // Verificar el estado del ticket
      if (ticket.status === 'refunded') {
        await validationController.logValidationAttempt({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorId,
          qrCode,
          result: 'ticket_refunded',
          isValid: false,
          deviceInfo,
          location,
          ipAddress: req.ip,
          startTime,
          errorDetails: 'Ticket fue reembolsado'
        });
        
        return res.status(400).json({
          success: false,
          message: 'Este ticket fue reembolsado',
          result: 'ticket_refunded'
        });
      }

      // Verificar cuántas veces se ha validado este ticket
      const successfulValidations = await ValidationLog.count({
        where: {
          ticketId: ticket.id,
          isValid: true,
          validationResult: 'success'
        }
      });

      // Si el ticket tiene quantity definida, verificar si aún tiene entradas disponibles
      const ticketQuantity = ticket.quantity || 1;
      const remainingEntries = ticketQuantity - successfulValidations;

      // Verificar si hay suficientes entradas para la cantidad solicitada
      if (remainingEntries < entryCount) {
        await validationController.logValidationAttempt({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorId,
          qrCode,
          result: 'insufficient_entries',
          isValid: false,
          deviceInfo,
          location,
          ipAddress: req.ip,
          startTime,
          errorDetails: `Intentó validar ${entryCount} personas, pero solo quedan ${remainingEntries} entradas disponibles`
        });
        
        return res.status(400).json({
          success: false,
          message: `Este ticket solo tiene ${remainingEntries} entrada(s) disponible(s), pero intentas validar ${entryCount} persona(s)`,
          result: 'insufficient_entries',
          availableEntries: remainingEntries,
          requestedEntries: entryCount,
          totalEntries: ticketQuantity,
          usedEntries: successfulValidations
        });
      }

      if (remainingEntries <= 0) {
        // Obtener la última validación exitosa
        const lastValidation = await ValidationLog.findOne({
          where: {
            ticketId: ticket.id,
            isValid: true
          },
          order: [['validatedAt', 'DESC']],
          include: [{
            model: User,
            as: 'Validator',
            attributes: ['firstName', 'lastName']
          }]
        });

        await validationController.logValidationAttempt({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorId,
          qrCode,
          result: 'all_entries_used',
          isValid: false,
          deviceInfo,
          location,
          ipAddress: req.ip,
          startTime,
          errorDetails: `Todas las ${ticketQuantity} entradas ya fueron utilizadas`
        });
        
        return res.status(400).json({
          success: false,
          message: `Todas las ${ticketQuantity} entradas de este ticket ya fueron utilizadas`,
          result: 'all_entries_used',
          usedEntries: successfulValidations,
          totalEntries: ticketQuantity,
          lastUsedAt: lastValidation?.validatedAt,
          lastUsedBy: lastValidation?.Validator ? 
            `${lastValidation.Validator.firstName} ${lastValidation.Validator.lastName}` : 
            'Desconocido'
        });
      }

      // Verificar fechas del evento
      const now = new Date();
      const eventStart = new Date(ticket.Event.startDate);
      const eventEnd = new Date(ticket.Event.endDate);

      if (now < eventStart) {
        await validationController.logValidationAttempt({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorId,
          qrCode,
          result: 'event_not_started',
          isValid: false,
          deviceInfo,
          location,
          ipAddress: req.ip,
          startTime,
          errorDetails: `Evento inicia el ${eventStart}`
        });
        
        return res.status(400).json({
          success: false,
          message: 'El evento aún no ha comenzado',
          result: 'event_not_started',
          eventStart: eventStart
        });
      }

      if (now > eventEnd) {
        await validationController.logValidationAttempt({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatorId,
          qrCode,
          result: 'event_finished',
          isValid: false,
          deviceInfo,
          location,
          ipAddress: req.ip,
          startTime,
          errorDetails: `Evento terminó el ${eventEnd}`
        });
        
        return res.status(400).json({
          success: false,
          message: 'El evento ya ha terminado',
          result: 'event_finished',
          eventEnd: eventEnd
        });
      }

      // **VALIDACIÓN EXITOSA**
      // Actualizar el estado del ticket
      const newSuccessfulValidations = successfulValidations + entryCount;
      
      if (newSuccessfulValidations >= ticketQuantity) {
        // Si se agotan todas las entradas, marcar como usado
        await ticket.update({
          status: 'used',
          usedAt: new Date()
        });
      } else {
        // Mantener como activo pero actualizar validatedAt
        await ticket.update({
          validatedAt: new Date()
        });
      }

      // Registrar validaciones exitosas (una por cada persona que ingresa)
      const validationLogs = [];
      const baseAttemptNumber = await validationController.getAttemptNumber(ticket.id);
      
      for (let i = 0; i < entryCount; i++) {
        const validationLog = await ValidationLog.create({
          ticketId: ticket.id,
          eventId: ticket.eventId,
          validatedBy: validatorId,
          isValid: true,
          validationType: 'entry',
          validationResult: 'success',
          qrCode,
          deviceInfo: { 
            ...deviceInfo || {}, 
            entrySequence: i + 1,
            totalEntriesThisValidation: entryCount
          },
          location,
          ipAddress: req.ip,
          attemptNumber: baseAttemptNumber + i,
          validationDuration: Date.now() - startTime,
          validatedAt: new Date()
        });
        validationLogs.push(validationLog);
      }

      // Calcular entradas restantes
      const remainingAfterValidation = ticketQuantity - newSuccessfulValidations;
      
      // Respuesta exitosa optimizada para móvil
      return res.status(200).json({
        success: true,
        message: entryCount === 1 
          ? (remainingAfterValidation > 0 
              ? `¡Entrada válida! Acceso permitido. Quedan ${remainingAfterValidation} entrada(s) en este ticket`
              : '¡Entrada válida! Acceso permitido. Todas las entradas de este ticket han sido utilizadas')
          : (remainingAfterValidation > 0
              ? `¡${entryCount} entradas validadas! Acceso permitido. Quedan ${remainingAfterValidation} entrada(s) en este ticket`
              : `¡${entryCount} entradas validadas! Todas las entradas de este ticket han sido utilizadas`),
        result: 'success',
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          price: ticket.salePrice,
          totalEntries: ticketQuantity,
          usedEntries: newSuccessfulValidations,
          remainingEntries: remainingAfterValidation,
          buyer: {
            name: ticket.buyerName,
            email: ticket.buyerEmail
          }
        },
        event: {
          name: ticket.Event.name,
          location: ticket.Event.location
        },
        validation: {
          id: validationLogs[0].id, // ID del primer log
          validatedCount: entryCount,
          validatedAt: validationLogs[0].validatedAt,
          validatedBy: `${req.user.firstName} ${req.user.lastName}`,
          duration: validationLogs[0].validationDuration
        }
      });

    } catch (error) {
      console.error('Error validando QR:', error);
      
      // Log del error
      try {
        await ValidationLog.create({
          ticketId: null,
          eventId: req.body.eventId || null,
          validatedBy: req.user.id,
          isValid: false,
          validationType: 'verification',
          validationResult: 'access_denied',
          qrCode: req.body.qrCode?.substring(0, 50) || 'unknown',
          deviceInfo: req.body.deviceInfo || {},
          location: req.body.location,
          ipAddress: req.ip,
          errorDetails: error.message,
          validationDuration: Date.now() - startTime,
          validatedAt: new Date()
        });
      } catch (logError) {
        console.error('Error logging validation:', logError);
      }

      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        result: 'server_error'
      });
    }
  },

  // **OBTENER HISTORIAL DE VALIDACIONES (PARA SUPERVISOR)**
  async getValidationHistory(req, res) {
    try {
      const {
        eventId,
        page = 1,
        limit = 20,
        startDate,
        endDate,
        result,
        validator
      } = req.query;

      // Solo admin y control pueden ver historial
      if (!['admin', 'control'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'No autorizado',
          message: 'No tienes permisos para ver el historial'
        });
      }

      const where = {};
      
      if (eventId) where.eventId = eventId;
      if (result) where.validationResult = result;
      if (validator) where.validatedBy = validator;
      
      if (startDate || endDate) {
        where.validatedAt = {};
        if (startDate) where.validatedAt[Op.gte] = new Date(startDate);
        if (endDate) where.validatedAt[Op.lte] = new Date(endDate);
      }

      const validations = await ValidationLog.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit),
        order: [['validatedAt', 'DESC']],
        include: [
          {
            model: Ticket,
            as: 'Ticket',
            attributes: ['ticketNumber', 'salePrice'],
            required: false
          },
          {
            model: Event,
            as: 'Event',
            attributes: ['name', 'location']
          },
          {
            model: User,
            as: 'Validator',
            attributes: ['firstName', 'lastName', 'username']
          }
        ]
      });

      res.json({
        message: 'Historial obtenido',
        data: validations.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(validations.count / limit),
          totalItems: validations.count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        error: 'Error interno',
        message: 'No se pudo obtener el historial'
      });
    }
  },

  // **ESTADÍSTICAS EN TIEMPO REAL**
  async getLiveStats(req, res) {
    try {
      const { eventId } = req.params;

      // Verificar permisos
      if (!['admin', 'control'].includes(req.user.role)) {
        return res.status(403).json({
          error: 'No autorizado'
        });
      }

      const stats = await ValidationLog.getEventStats(eventId);
      
      // Estadísticas adicionales
      const recentValidations = await ValidationLog.findAll({
        where: {
          eventId,
          validatedAt: {
            [Op.gte]: new Date(Date.now() - 60 * 60 * 1000) // Última hora
          }
        },
        attributes: [
          'validationResult',
          [ValidationLog.sequelize.fn('COUNT', '*'), 'count']
        ],
        group: ['validationResult'],
        raw: true
      });

      res.json({
        message: 'Estadísticas en tiempo real',
        eventId,
        stats,
        lastHour: recentValidations.reduce((acc, stat) => {
          acc[stat.validationResult] = parseInt(stat.count);
          return acc;
        }, {}),
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        error: 'Error interno'
      });
    }
  },

  // **HELPER METHODS**
  async logValidationAttempt(data) {
    try {
      await ValidationLog.create({
        ticketId: data.ticketId,
        eventId: data.eventId,
        validatedBy: data.validatorId,
        isValid: data.isValid,
        validationType: 'entry',
        validationResult: data.result,
        qrCode: data.qrCode,
        deviceInfo: data.deviceInfo || {},
        location: data.location,
        ipAddress: data.ipAddress,
        attemptNumber: data.ticketId ? await validationController.getAttemptNumber(data.ticketId) : 1,
        errorDetails: data.errorDetails,
        validationDuration: Date.now() - data.startTime,
        validatedAt: new Date()
      });
    } catch (error) {
      console.error('Error logging validation attempt:', error);
    }
  },

  async getAttemptNumber(ticketId) {
    try {
      const count = await ValidationLog.count({
        where: { ticketId }
      });
      return count + 1;
    } catch {
      return 1;
    }
  },

  // **VALIDAR ENTRADA SIMPLE (SOLO QR)** - Método simplificado para entradas físicas
  async validarEntradaSimple(req, res) {
    const startTime = Date.now();
    
    try {
      const { token } = req.body;
      const validatorId = req.user.id;
      
      // Verificar permisos de control
      if (req.user.role !== 'control' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para validar entradas',
          estado: 'SIN_PERMISOS'
        });
      }

      // Validar que se proporcione el token
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token requerido',
          estado: 'TOKEN_INVALIDO'
        });
      }

      // Buscar la entrada por token
      const entrada = await Ticket.findOne({
        where: { qrCode: token }
      });

      // Verificar si existe
      if (!entrada) {
        await ValidationLog.create({
          ticketId: null,
          eventId: null,
          validatedBy: validatorId,
          isValid: false,
          validationType: 'entry',
          validationResult: 'invalid_qr',
          qrCode: token.substring(0, 50),
          ipAddress: req.ip,
          errorDetails: 'Token no existe en el sistema',
          validationDuration: Date.now() - startTime,
          validatedAt: new Date()
        });
        
        return res.status(404).json({
          success: false,
          message: 'Entrada no válida',
          estado: 'NO_EXISTE'
        });
      }

      // Verificar si ya fue usada
      if (entrada.status === 'used') {
        await ValidationLog.create({
          ticketId: entrada.id,
          eventId: entrada.eventId,
          validatedBy: validatorId,
          isValid: false,
          validationType: 'entry',
          validationResult: 'already_used',
          qrCode: token,
          ipAddress: req.ip,
          errorDetails: 'Entrada ya fue utilizada',
          validationDuration: Date.now() - startTime,
          validatedAt: new Date()
        });
        
        return res.status(400).json({
          success: false,
          message: 'Esta entrada ya fue utilizada',
          estado: 'YA_USADA',
          entrada: {
            numero: entrada.ticketNumber,
            fechaUso: entrada.validatedAt
          }
        });
      }

      // Verificar si está cancelada
      if (entrada.status === 'cancelled') {
        await ValidationLog.create({
          ticketId: entrada.id,
          eventId: entrada.eventId,
          validatedBy: validatorId,
          isValid: false,
          validationType: 'entry',
          validationResult: 'cancelled',
          qrCode: token,
          ipAddress: req.ip,
          errorDetails: 'Entrada cancelada',
          validationDuration: Date.now() - startTime,
          validatedAt: new Date()
        });
        
        return res.status(400).json({
          success: false,
          message: 'Esta entrada fue cancelada',
          estado: 'CANCELADA'
        });
      }

      // **VALIDACIÓN EXITOSA**
      // Marcar como usada
      await entrada.update({
        status: 'used',
        validatedAt: new Date()
      });

      // Registrar en log
      await ValidationLog.create({
        ticketId: entrada.id,
        eventId: entrada.eventId,
        validatedBy: validatorId,
        isValid: true,
        validationType: 'entry',
        validationResult: 'success',
        qrCode: token,
        ipAddress: req.ip,
        attemptNumber: await validationController.getAttemptNumber(entrada.id),
        validationDuration: Date.now() - startTime,
        validatedAt: new Date()
      });

      return res.status(200).json({
        success: true,
        message: '✅ ENTRADA VÁLIDA - Acceso permitido',
        estado: 'VALIDA',
        validationType: 'entrada_simple', // Importante: identificar el tipo
        entrada: {
          numero: entrada.ticketNumber,
          ticketNumber: entrada.ticketNumber, // Alias para compatibilidad
          tipo: entrada.metadata?.tipo || 'entrada_general',
          fechaValidacion: new Date(),
          validadoPor: `${req.user.firstName} ${req.user.lastName}`
        },
        validatedBy: `${req.user.firstName} ${req.user.lastName}`,
        validationDuration: Date.now() - startTime
      });

    } catch (error) {
      console.error('Error validando entrada simple:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error al validar entrada',
        estado: 'ERROR_SERVIDOR'
      });
    }
  },

  // **OBTENER INFORMACIÓN DEL TICKET SIN VALIDAR**
  async getTicketInfo(req, res) {
    try {
      const { qrCode } = req.params;
      const validatorId = req.user.id;

      // Verificar que el usuario tenga rol de control
      if (req.user.role !== 'control' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para consultar entradas',
          result: 'access_denied'
        });
      }

      // Buscar el ticket por el código QR
      const ticket = await Ticket.findOne({
        where: { qrCode },
        include: [
          {
            model: Event,
            as: 'Event',
            attributes: ['id', 'name', 'startDate', 'endDate', 'status', 'location']
          }
        ]
      });

      // Verificar si el ticket existe
      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Código QR no encontrado',
          result: 'invalid_qr'
        });
      }

      // Contar validaciones exitosas
      const successfulValidations = await ValidationLog.count({
        where: {
          ticketId: ticket.id,
          isValid: true,
          validationResult: 'success'
        }
      });

      const ticketQuantity = ticket.quantity || 1;
      const remainingEntries = ticketQuantity - successfulValidations;

      // Obtener última validación
      const lastValidation = await ValidationLog.findOne({
        where: {
          ticketId: ticket.id,
          isValid: true
        },
        order: [['validatedAt', 'DESC']],
        include: [{
          model: User,
          as: 'Validator',
          attributes: ['firstName', 'lastName']
        }]
      });

      return res.status(200).json({
        success: true,
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          qrCode: ticket.qrCode,
          totalEntries: ticketQuantity,
          usedEntries: successfulValidations,
          remainingEntries: remainingEntries,
          status: ticket.status,
          buyer: {
            name: ticket.buyerName,
            email: ticket.buyerEmail
          },
          event: {
            id: ticket.Event.id,
            name: ticket.Event.name,
            location: ticket.Event.location,
            status: ticket.Event.status
          },
          lastValidation: lastValidation ? {
            validatedAt: lastValidation.validatedAt,
            validatedBy: lastValidation.Validator ? 
              `${lastValidation.Validator.firstName} ${lastValidation.Validator.lastName}` : 
              'Desconocido'
          } : null
        }
      });

    } catch (error) {
      console.error('Error obteniendo información del ticket:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        result: 'server_error'
      });
    }
  }
};

module.exports = validationController;