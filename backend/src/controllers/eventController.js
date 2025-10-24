const { Event, User, Ticket } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// **CREAR EVENTO** (Solo admin)
const createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    
    const {
      name,
      description,
      location,
      startDate,
      endDate,
      maxCapacity,
      basePrice,
      priceRanges,
      saleStartDate,
      saleEndDate,
      allowRefunds,
      requiresApproval,
      metadata,
      imageUrl
    } = req.body;
    
    // Validar rangos de precios si se proporcionan
    let validatedRanges = [];
    if (priceRanges && priceRanges.length > 0) {
      const { validatePriceRanges, optimizePriceRanges } = require('../utils/rangeValidation');
      
      const validation = validatePriceRanges(priceRanges);
      
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Rangos de precios inválidos',
          message: 'Los rangos proporcionados no son válidos',
          details: validation.errors
        });
      }
      
      // Usar rangos optimizados
      validatedRanges = optimizePriceRanges(validation.validatedRanges);
    }

    // Crear el evento
    const event = await Event.create({
      name,
      description,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      maxCapacity,
      basePrice,
      priceRanges: validatedRanges,
      saleStartDate: saleStartDate ? new Date(saleStartDate) : null,
      saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
      allowRefunds: allowRefunds || false,
      requiresApproval: requiresApproval || false,
      metadata: metadata || {},
      imageUrl,
      status: 'draft',
      createdBy: req.user.id
    });
    
    res.status(201).json({
      message: 'Evento creado exitosamente',
      event,
      ...(priceRanges && priceRanges.length > 0 && {
        priceInfo: {
          originalRangeCount: priceRanges.length,
          validatedRangeCount: validatedRanges.length,
          optimized: validatedRanges.length < priceRanges.length,
          ranges: validatedRanges
        }
      })
    });
    
  } catch (error) {
    console.error('Error creando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el evento'
    });
  }
};

// **LISTAR EVENTOS** (Público con filtros)
const getEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      location,
      search
    } = req.query;
    
    // Construir filtros
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (startDate) {
      where.startDate = {
        [Op.gte]: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.endDate = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (location) {
      where.location = {
        [Op.iLike]: `%${location}%`
      };
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Solo mostrar eventos activos a usuarios no admin
    if (!req.user || req.user.role !== 'admin') {
      where.status = 'active';
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: events } = await Event.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['startDate', 'ASC']],
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    res.json({
      message: 'Eventos obtenidos exitosamente',
      events,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo eventos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los eventos'
    });
  }
};

// **OBTENER EVENTO POR ID**
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: Ticket,
          as: 'Tickets',
          attributes: ['id', 'status'],
          separate: true
        }
      ]
    });
    
    if (!event) {
      return res.status(404).json({
        error: 'Evento no encontrado',
        message: 'No existe un evento con ese ID'
      });
    }
    
    // Solo mostrar eventos no activos a admins
    if (event.status !== 'active' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({
        error: 'Evento no encontrado',
        message: 'No existe un evento con ese ID'
      });
    }
    
    // Calcular estadísticas del evento
    const ticketStats = await Ticket.getStatistics(id);
    
    res.json({
      message: 'Evento obtenido exitosamente',
      event: {
        ...event.toJSON(),
        availableTickets: event.getAvailableTickets(),
        canSellTickets: event.canSellTickets(),
        ticketStats
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el evento'
    });
  }
};

// **ACTUALIZAR EVENTO** (Solo admin o creador)
const updateEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    
    const { id } = req.params;
    
    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        error: 'Evento no encontrado',
        message: 'No existe un evento con ese ID'
      });
    }
    
    // Verificar permisos (admin o creador del evento)
    if (req.user.role !== 'admin' && event.createdBy !== req.user.id) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes editar eventos que creaste'
      });
    }
    
    // Verificar si ya hay entradas vendidas (limita algunas actualizaciones)
    const soldTickets = await Ticket.count({
      where: { eventId: id, status: ['active', 'used'] }
    });
    
    const updateData = { ...req.body };
    
    // Si hay entradas vendidas, aplicar restricciones según el rol
    if (soldTickets > 0) {
      // Solo admins pueden cambiar fechas críticas con entradas vendidas
      if (req.user.role !== 'admin') {
        delete updateData.startDate;
        delete updateData.endDate;
      }
      
      // Solo permitir aumentar capacidad, no reducirla
      if (updateData.maxCapacity && updateData.maxCapacity < event.maxCapacity) {
        return res.status(400).json({
          error: 'No se puede reducir capacidad',
          message: `Ya se vendieron ${soldTickets} entradas. No puedes reducir la capacidad máxima.`
        });
      }
    }
    
    // Convertir fechas si están presentes
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.saleStartDate) updateData.saleStartDate = new Date(updateData.saleStartDate);
    if (updateData.saleEndDate) updateData.saleEndDate = new Date(updateData.saleEndDate);
    
    await event.update(updateData);
    await event.reload({
      include: [
        {
          model: User,
          as: 'Creator',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });
    
    res.json({
      message: 'Evento actualizado exitosamente',
      event
    });
    
  } catch (error) {
    console.error('Error actualizando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el evento'
    });
  }
};

// **CAMBIAR ESTADO DEL EVENTO** (Solo admin)
const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['draft', 'active', 'suspended', 'finished', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'Estado debe ser: draft, active, suspended, finished o cancelled'
      });
    }
    
    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        error: 'Evento no encontrado'
      });
    }
    
    await event.update({ status });
    
    res.json({
      message: `Evento ${status === 'active' ? 'activado' : status === 'suspended' ? 'suspendido' : 'actualizado'} exitosamente`,
      event
    });
    
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el estado del evento'
    });
  }
};

// **ELIMINAR EVENTO** (Solo admin, y solo si no hay entradas)
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        error: 'Evento no encontrado'
      });
    }
    
    // Verificar si hay entradas vendidas
    const ticketCount = await Ticket.count({
      where: { eventId: id }
    });
    
    if (ticketCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar',
        message: `Este evento tiene ${ticketCount} entradas asociadas. No se puede eliminar.`
      });
    }
    
    await event.destroy();
    
    res.json({
      message: 'Evento eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error eliminando evento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el evento'
    });
  }
};

// **OBTENER PRECIO ACTUAL** (Para mostrar en tiempo real)
const getCurrentPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { dateTime } = req.query;
    
    const event = await Event.findByPk(id);
    
    if (!event) {
      return res.status(404).json({
        error: 'Evento no encontrado'
      });
    }
    
    const checkDate = dateTime ? new Date(dateTime) : new Date();
    const currentPrice = event.getPriceAtTime(checkDate);
    
    res.json({
      message: 'Precio obtenido exitosamente',
      price: currentPrice,
      dateTime: checkDate.toISOString(),
      canSell: event.canSellTickets(),
      availableTickets: event.getAvailableTickets()
    });
    
  } catch (error) {
    console.error('Error obteniendo precio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el precio'
    });
  }
};

// **DASHBOARD DE EVENTOS** (Solo admin)
const getEventsDashboard = async (req, res) => {
  try {
    // Estadísticas generales
    const [
      totalEvents,
      activeEvents,
      draftEvents,
      finishedEvents
    ] = await Promise.all([
      Event.count(),
      Event.count({ where: { status: 'active' } }),
      Event.count({ where: { status: 'draft' } }),
      Event.count({ where: { status: 'finished' } })
    ]);
    
    // Próximos eventos
    const upcomingEvents = await Event.findAll({
      where: {
        status: 'active',
        startDate: {
          [Op.gte]: new Date()
        }
      },
      limit: 5,
      order: [['startDate', 'ASC']],
      include: [
        {
          model: Ticket,
          as: 'Tickets',
          attributes: ['status'],
          separate: true
        }
      ]
    });
    
    res.json({
      message: 'Dashboard obtenido exitosamente',
      stats: {
        totalEvents,
        activeEvents,
        draftEvents,
        finishedEvents
      },
      upcomingEvents: upcomingEvents.map(event => ({
        ...event.toJSON(),
        soldTickets: event.Tickets?.filter(t => t.status !== 'cancelled').length || 0,
        availableTickets: event.getAvailableTickets()
      }))
    });
    
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el dashboard'
    });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getCurrentPrice,
  getEventsDashboard
};