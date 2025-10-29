const { Ticket, Event, User, ValidationLog } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const qrcode = require('qrcode');
const { getPriceAtDateTime } = require('../utils/priceUtils');
const { generateUniqueQRCode } = require('../utils/qrUtils');

// **VENDER ENTRADA** (Vendedores y Admin)
const sellTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    
    const {
      eventId,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerDocument,
      paymentMethod,
      paymentReference,
      notes,
      quantity = 1
    } = req.body;
    
    // Validar cantidad
    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({
        error: 'Cantidad inválida',
        message: 'Solo se pueden vender entre 1 y 10 entradas por transacción'
      });
    }
    
    // Verificar que el evento existe y se puede vender
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        error: 'Evento no encontrado',
        message: 'No existe un evento con ese ID'
      });
    }
    
    // Verificar si se puede vender
    const canSell = event.canSellTickets();
    if (!canSell) {
      return res.status(400).json({
        error: 'No se puede vender',
        message: 'Este evento no permite ventas en este momento'
      });
    }

    // Política de seguridad: solo roles 'vendedor' y 'admin' pueden ejecutar ventas.
    // Esto actúa como defensa en profundidad además del middleware de rutas.
    if (req.user?.role !== 'vendedor' && req.user?.role !== 'admin') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo usuarios con rol vendedor o admin pueden realizar ventas'
      });
    }
    
    // Verificar disponibilidad
    const availableTickets = event.getAvailableTickets();
    if (availableTickets < quantity) {
      return res.status(400).json({
        error: 'Entradas insuficientes',
        message: `Solo quedan ${availableTickets} entradas disponibles`
      });
    }
    
    // Calcular precio actual
    const priceInfo = getPriceAtDateTime(event);
    const unitPrice = priceInfo.price;
    const totalPrice = unitPrice * quantity;
    
    // Crear UN SOLO TICKET con quantity para múltiples entradas
    const saleDate = new Date();
    
    // Generar QR code único con validación de duplicados
    let qrCode;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      qrCode = generateUniqueQRCode(null, eventId);
      const existingQR = await Ticket.findOne({ where: { qrCode } });
      
      if (!existingQR) break;
      
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error('No se pudo generar un código QR único después de múltiples intentos');
      }
      
      // Esperar 1ms antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1));
    } while (attempts < maxAttempts);
    
    // Generar ticketNumber manualmente para evitar problemas con hooks
    const ticketCount = await Ticket.count();
    const ticketNumber = `E${String(ticketCount + 1).padStart(6, '0')}`;
    
    // Crear UN SOLO TICKET que representa todas las entradas
    const ticket = await Ticket.create({
      eventId,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerDocument,
      qrCode,
      ticketNumber, // Generado manualmente
      salePrice: totalPrice, // Precio total de todas las entradas
      quantity: quantity, // Número de entradas en este ticket
      saleDate,
      paymentMethod,
      paymentReference,
      notes,
      sellerId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        priceSource: priceInfo.source,
        appliedRange: priceInfo.appliedRange,
        unitPrice: unitPrice,
        totalQuantity: quantity
      }
    });
    
    // Actualizar contador de entradas vendidas del evento
    await event.increment('currentSold', { by: quantity });
    
    res.status(201).json({
      message: `${quantity} entrada(s) vendida(s) exitosamente en 1 ticket`,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        qrCode: ticket.qrCode,
        quantity: ticket.quantity,
        unitPrice: unitPrice,
        totalPrice: ticket.salePrice,
        buyerName: ticket.buyerName
      },
      summary: {
        quantity,
        unitPrice,
        totalPrice,
        eventName: event.name,
        eventDate: event.startDate,
        sellerName: `${req.user.firstName} ${req.user.lastName}`
      }
    });
    
  } catch (error) {
    console.error('Error vendiendo entrada:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo procesar la venta'
    });
  }
};

// **GENERAR QR VISUAL** (para imprimir o mostrar)
const generateQRImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'png' } = req.query;
    
    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'Event',
          attributes: ['name', 'startDate', 'location']
        }
      ]
    });
    
    if (!ticket) {
      return res.status(404).json({
        error: 'Entrada no encontrada'
      });
    }
    
    // Verificar permisos (vendedor que la vendió o admin)
    if (req.user.role !== 'admin' && ticket.sellerId !== req.user.id) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes generar QR de entradas que vendiste'
      });
    }
    
    // Crear datos del QR (JSON con información de la entrada)
    const qrData = {
      ticketId: ticket.id,
      qrCode: ticket.qrCode,
      eventId: ticket.eventId,
      buyerName: ticket.buyerName,
      validUntil: ticket.Event.startDate,
      checksum: generateChecksum(ticket.qrCode)
    };
    
    // Generar imagen QR
    const qrOptions = {
      errorCorrectionLevel: 'M',
      type: format === 'svg' ? 'svg' : 'png',
      quality: 0.92,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };
    
    if (format === 'svg') {
      const qrSvg = await qrcode.toString(JSON.stringify(qrData), {
        ...qrOptions,
        type: 'svg'
      });
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(qrSvg);
    } else {
      const qrBuffer = await qrcode.toBuffer(JSON.stringify(qrData), qrOptions);
      
      res.setHeader('Content-Type', 'image/png');
      res.send(qrBuffer);
    }
    
  } catch (error) {
    console.error('Error generando QR:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo generar el código QR'
    });
  }
};

// **LISTAR ENTRADAS** (con filtros)
const getTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      eventId,
      status,
      startDate,
      endDate,
      search,
      sellerId
    } = req.query;
    
    // Construir filtros
    const where = {};
    
    if (eventId) where.eventId = eventId;
    if (status) where.status = status;
    
    if (startDate) {
      where.saleDate = {
        [Op.gte]: new Date(startDate)
      };
    }
    
    if (endDate) {
      where.saleDate = {
        ...where.saleDate,
        [Op.lte]: new Date(endDate)
      };
    }
    
    if (search) {
      where[Op.or] = [
        { buyerName: { [Op.iLike]: `%${search}%` } },
        { buyerEmail: { [Op.iLike]: `%${search}%` } },
        { ticketNumber: { [Op.iLike]: `%${search}%` } },
        { qrCode: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filtro por vendedor (solo admin puede ver todas, vendedores solo las suyas)
    if (req.user.role !== 'admin') {
      where.sellerId = req.user.id;
    } else if (sellerId) {
      where.sellerId = sellerId;
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['saleDate', 'DESC']],
      include: [
        {
          model: Event,
          as: 'Event',
          attributes: ['id', 'name', 'startDate', 'location']
        },
        {
          model: User,
          as: 'Seller',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'Validator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false
        }
      ]
    });
    
    res.json({
      message: 'Entradas obtenidas exitosamente',
      tickets,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo entradas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las entradas'
    });
  }
};

// **OBTENER ENTRADA POR ID**
const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: Event,
          as: 'Event'
        },
        {
          model: User,
          as: 'Seller',
          attributes: ['id', 'username', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'Validator',
          attributes: ['id', 'username', 'firstName', 'lastName'],
          required: false
        },
        {
          model: ValidationLog,
          as: 'ValidationLogs',
          limit: 10,
          order: [['attemptedAt', 'DESC']]
        }
      ]
    });
    
    if (!ticket) {
      return res.status(404).json({
        error: 'Entrada no encontrada'
      });
    }
    
    // Verificar permisos (vendedor, control que puede validar, o admin)
    const canView = req.user.role === 'admin' || 
                   ticket.sellerId === req.user.id || 
                   req.user.role === 'control';
    
    if (!canView) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'No tienes permisos para ver esta entrada'
      });
    }
    
    res.json({
      message: 'Entrada obtenida exitosamente',
      ticket: {
        ...ticket.toJSON(),
        validationInfo: ticket.getValidationInfo()
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo entrada:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la entrada'
    });
  }
};

// **CANCELAR ENTRADA** (Solo antes de ser usada)
const cancelTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const ticket = await Ticket.findByPk(id, {
      include: [{ model: Event, as: 'Event' }]
    });
    
    if (!ticket) {
      return res.status(404).json({
        error: 'Entrada no encontrada'
      });
    }
    
    // Verificar permisos (vendedor que la vendió o admin)
    if (req.user.role !== 'admin' && ticket.sellerId !== req.user.id) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes cancelar entradas que vendiste'
      });
    }
    
    // Verificar que se puede cancelar
    if (ticket.status === 'used') {
      return res.status(400).json({
        error: 'No se puede cancelar',
        message: 'Esta entrada ya fue utilizada'
      });
    }
    
    if (ticket.status === 'cancelled') {
      return res.status(400).json({
        error: 'Ya cancelada',
        message: 'Esta entrada ya estaba cancelada'
      });
    }
    
    // Verificar si el evento permite reembolsos
    if (!ticket.Event.allowRefunds) {
      return res.status(400).json({
        error: 'Reembolsos no permitidos',
        message: 'Este evento no permite cancelaciones'
      });
    }
    
    await ticket.cancel(reason);
    
    // Decrementar contador del evento
    await ticket.Event.decrement('currentSold');
    
    res.json({
      message: 'Entrada cancelada exitosamente',
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        cancelReason: reason
      }
    });
    
  } catch (error) {
    console.error('Error cancelando entrada:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo cancelar la entrada'
    });
  }
};

// **ESTADÍSTICAS DE VENTAS** (Dashboard vendedor/admin)
const getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate, eventId } = req.query;
    
    // Construir filtros
    const where = {};
    
    // Solo vendedores ven sus propias ventas, admin ve todas
    if (req.user.role !== 'admin') {
      where.sellerId = req.user.id;
    }
    
    if (eventId) where.eventId = eventId;
    
    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate[Op.gte] = new Date(startDate);
      if (endDate) where.saleDate[Op.lte] = new Date(endDate);
    }
    
    // Estadísticas generales
    const [
      totalTickets,
      activeTickets,
      usedTickets,
      cancelledTickets,
      totalRevenue
    ] = await Promise.all([
      Ticket.count({ where }),
      Ticket.count({ where: { ...where, status: 'active' } }),
      Ticket.count({ where: { ...where, status: 'used' } }),
      Ticket.count({ where: { ...where, status: 'cancelled' } }),
      Ticket.sum('salePrice', { where: { ...where, status: ['active', 'used'] } })
    ]);
    
    // Ventas por día (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const dailySales = await Ticket.findAll({
      where: {
        ...where,
        saleDate: { [Op.gte]: sevenDaysAgo }
      },
      attributes: [
        [Ticket.sequelize.fn('DATE', Ticket.sequelize.col('saleDate')), 'date'],
        [Ticket.sequelize.fn('COUNT', Ticket.sequelize.col('id')), 'count'],
        [Ticket.sequelize.fn('SUM', Ticket.sequelize.col('salePrice')), 'revenue']
      ],
      group: [Ticket.sequelize.fn('DATE', Ticket.sequelize.col('saleDate'))],
      order: [[Ticket.sequelize.fn('DATE', Ticket.sequelize.col('saleDate')), 'ASC']]
    });
    
    res.json({
      message: 'Estadísticas obtenidas exitosamente',
      stats: {
        totalTickets,
        activeTickets,
        usedTickets,
        cancelledTickets,
        totalRevenue: totalRevenue || 0,
        averagePrice: totalTickets > 0 ? (totalRevenue || 0) / totalTickets : 0
      },
      dailySales,
      period: {
        startDate: startDate || 'Desde el inicio',
        endDate: endDate || 'Hasta ahora'
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas'
    });
  }
};

// **FUNCIÓN AUXILIAR: Generar checksum para validación QR**
const generateChecksum = (qrCode) => {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(qrCode + process.env.JWT_SECRET).digest('hex').slice(0, 8);
};

// **ESTADÍSTICAS SIMPLES PARA DASHBOARD**
const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Total de ventas (todos los tiempos)
    const totalVentas = await Ticket.sum('salePrice') || 0;
    
    // Total usuarios
    const totalUsuarios = await User.count();
    
    // Entradas vendidas (todos los tiempos)
    const entradasVendidas = await Ticket.count({
      where: {
        status: { [Op.in]: ['active', 'used'] }
      }
    });
    
    // Validaciones de hoy
    const validacionesHoy = await ValidationLog.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });
    
    res.json({
      totalVentas,
      totalUsuarios,
      entradasVendidas,
      validacionesHoy
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas simples:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las estadísticas'
    });
  }
};

// **GENERAR LOTE DE ENTRADAS SIMPLES** (Para imprimir QRs y pegar en entradas físicas)
const generarLoteEntradas = async (req, res) => {
  try {
    const { cantidad, tipo = 'entrada_general' } = req.body;
    
    // Validar cantidad - aumentado a 5000
    if (!cantidad || cantidad < 1 || cantidad > 5000) {
      return res.status(400).json({
        error: 'Cantidad inválida',
        message: 'Debes generar entre 1 y 5000 entradas'
      });
    }
    
    // Verificar permisos (solo admin y vendedor)
    if (req.user.role !== 'admin' && req.user.role !== 'vendedor') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo admin y vendedores pueden generar entradas'
      });
    }
    
    const fecha = new Date();
    const baseCount = await Ticket.count();
    
    // Preparar datos en batch para inserción masiva
    const entradasData = [];
    for (let i = 0; i < cantidad; i++) {
      // Generar token único
      const token = `ENTRY-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
      
      entradasData.push({
        qrCode: token,
        ticketNumber: `E${String(baseCount + i + 1).padStart(6, '0')}`,
        buyerName: 'Por asignar',
        salePrice: 0,
        quantity: 1,
        paymentMethod: 'cash',
        status: 'active',
        saleDate: fecha,
        sellerId: req.user.id,
        metadata: {
          tipo: tipo,
          generacionMasiva: true,
          generadoPor: req.user.username
        }
      });
    }
    
    // Inserción masiva (mucho más rápido)
    const entradas = await Ticket.bulkCreate(entradasData);
    
    // Formatear respuesta
    const entradasFormateadas = entradas.map(entrada => ({
      id: entrada.id,
      token: entrada.qrCode,
      numero: entrada.ticketNumber
    }));
    
    res.status(201).json({
      message: `${cantidad} entradas generadas exitosamente`,
      entradas: entradasFormateadas,
      resumen: {
        total: cantidad,
        tipo: tipo,
        generadoPor: `${req.user.firstName} ${req.user.lastName}`,
        fecha: fecha
      }
    });
    
  } catch (error) {
    console.error('Error generando lote de entradas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo generar el lote de entradas'
    });
  }
};

module.exports = {
  sellTicket,
  generateQRImage,
  getTickets,
  getTicketById,
  cancelTicket,
  getSalesStats,
  getStats,
  generarLoteEntradas
};