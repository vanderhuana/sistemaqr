const { Op, fn, col, literal } = require('sequelize');
const PDFDocument = require('pdfkit');
const { Ticket, Event, User, Participante, Trabajador, Empresa } = require('../models');

/**
 * Controlador para generar reportes del sistema
 */
class ReportController {

  /**
   * Obtener datos para el reporte con filtros
   */
  static async getReportData(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        empresaId,
        estado,
        tipoEntrada,
        eventId,
        page = 1,
        limit = 100
      } = req.query;

      // Construir filtros dinámicos
      const whereConditions = {};
      const includeConditions = [];

      // Filtro por fechas
      if (fechaInicio && fechaFin) {
        whereConditions.createdAt = {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
      }

      // Filtro por estado
      if (estado) {
        whereConditions.status = estado;
      }

      // Filtro por tipo de entrada (usando metadata)
      if (tipoEntrada) {
        whereConditions['metadata.tipo'] = tipoEntrada;
      }

      // Filtro por evento
      if (eventId) {
        whereConditions.eventId = eventId;
      }

      // Incluir evento, vendedor y validador
      includeConditions.push({
        model: Event,
        as: 'Event',
        attributes: ['id', 'name', 'startDate', 'location']
      });

      includeConditions.push({
        model: User,
        as: 'Seller',
        attributes: ['firstName', 'lastName', 'role']
      });

      includeConditions.push({
        model: User,
        as: 'Validator',
        attributes: ['firstName', 'lastName'],
        required: false
      });

      // Obtener tickets con filtros
      const { count, rows: tickets } = await Ticket.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      // Estadísticas generales
      const estadisticas = await ReportController.getEstadisticas(whereConditions);

      res.json({
        success: true,
        data: {
          tickets,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          },
          estadisticas
        }
      });

    } catch (error) {
      console.error('Error generando reporte:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener estadísticas para el reporte
   */
  static async getEstadisticas(whereConditions = {}) {
    try {
      // Total de tickets
      const totalTickets = await Ticket.count({ where: whereConditions });

      // Tickets por estado
      const porEstado = await Ticket.findAll({
        where: whereConditions,
        attributes: [
          'status',
          [fn('COUNT', col('id')), 'cantidad']
        ],
        group: ['status'],
        raw: true
      });

      // Total vendido
      const totalVendido = await Ticket.sum('salePrice', { where: whereConditions }) || 0;

      // Ventas por día (últimos 7 días)
      const ventasPorDia = await Ticket.findAll({
        where: whereConditions,
        attributes: [
          [fn('DATE', col('saleDate')), 'fecha'],
          [fn('COUNT', col('id')), 'cantidad'],
          [fn('SUM', col('salePrice')), 'total']
        ],
        group: [fn('DATE', col('saleDate'))],
        order: [[fn('DATE', col('saleDate')), 'DESC']],
        limit: 7,
        raw: true
      });

      return {
        totalTickets,
        porEstado: porEstado.map(item => ({
          estado: item.status || 'Sin estado',
          cantidad: parseInt(item.cantidad)
        })),
        totalVendido: parseFloat(totalVendido).toFixed(2),
        promedioVenta: totalTickets > 0 ? (totalVendido / totalTickets).toFixed(2) : 0,
        ventasPorDia
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return {
        totalTickets: 0,
        porEstado: [],
        totalVendido: 0,
        promedioVenta: 0,
        ventasPorDia: []
      };
    }
  }

  /**
   * Generar reporte PDF
   */
  static async generatePDF(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        estado,
        eventId,
        titulo = 'Reporte de Entradas'
      } = req.query;

      // Obtener datos para el PDF
      const whereConditions = {};
      if (fechaInicio && fechaFin) {
        whereConditions.saleDate = {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
      }
      if (estado) whereConditions.status = estado;
      if (eventId) whereConditions.eventId = eventId;

      const tickets = await Ticket.findAll({
        where: whereConditions,
        include: [
          {
            model: Event,
            as: 'Event',
            attributes: ['id', 'name', 'date', 'location']
          },
          {
            model: User,
            as: 'Seller',
            attributes: ['firstName', 'lastName']
          }
        ],
        order: [['saleDate', 'DESC']],
        limit: 1000 // Límite para PDF
      });

      const estadisticas = await ReportController.getEstadisticas(whereConditions);

      // Crear PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Headers para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte_${Date.now()}.pdf"`);
      
      // Pipe del PDF a la respuesta
      doc.pipe(res);

      // Título del reporte
      doc.fontSize(20).text(titulo, { align: 'center' });
      doc.moveDown();

      // Información del reporte
      doc.fontSize(12);
      if (fechaInicio && fechaFin) {
        doc.text(`Período: ${fechaInicio} - ${fechaFin}`);
      }
      doc.text(`Generado: ${new Date().toLocaleString()}`);
      doc.text(`Total de registros: ${tickets.length}`);
      doc.moveDown();

      // Estadísticas
      doc.fontSize(16).text('📊 Estadísticas', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);

      // Por estado
      if (estadisticas.porEstado && estadisticas.porEstado.length > 0) {
        doc.text('Por Estado:');
        estadisticas.porEstado.forEach(item => {
          doc.text(`  • ${item.estado}: ${item.cantidad}`, { indent: 20 });
        });
        doc.moveDown(0.5);
      }

      // Total vendido
      if (estadisticas.totalVendido) {
        doc.text(`Total Vendido: Bs. ${estadisticas.totalVendido}`);
        doc.text(`Promedio por Venta: Bs. ${estadisticas.promedioVenta}`);
        doc.moveDown();
      }

      // Nueva página para el detalle
      doc.addPage();
      
      // Tabla de tickets
      doc.fontSize(16).text('📋 Detalle de Entradas', { underline: true });
      doc.moveDown();

      doc.fontSize(10);
      let yPosition = 150;
      const lineHeight = 15;

      // Headers de tabla
      doc.text('Código', 50, yPosition, { width: 70 });
      doc.text('Comprador', 120, yPosition, { width: 120 });
      doc.text('Evento', 240, yPosition, { width: 100 });
      doc.text('Precio', 340, yPosition, { width: 50 });
      doc.text('Estado', 390, yPosition, { width: 60 });
      doc.text('Fecha', 450, yPosition, { width: 80 });

      yPosition += lineHeight;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 5;

      // Datos de tickets
      tickets.slice(0, 50).forEach((ticket) => { // Límite para evitar PDFs muy grandes
        if (yPosition > 700) { // Nueva página si es necesario
          doc.addPage();
          yPosition = 50;
        }

        const evento = ticket.Event?.name || 'N/A';
        const comprador = ticket.buyerName || 'N/A';
        const precio = ticket.salePrice ? `Bs. ${ticket.salePrice}` : 'N/A';

        doc.text(ticket.ticketNumber || 'N/A', 50, yPosition, { width: 70 });
        doc.text(comprador, 120, yPosition, { width: 120 });
        doc.text(evento, 240, yPosition, { width: 100 });
        doc.text(precio, 340, yPosition, { width: 50 });
        doc.text(ticket.status || 'N/A', 390, yPosition, { width: 60 });
        doc.text(new Date(ticket.saleDate).toLocaleDateString(), 450, yPosition, { width: 80 });

        yPosition += lineHeight;
      });

      // Footer
      doc.fontSize(8);
      doc.text(
        `Reporte generado el ${new Date().toLocaleString()} | Sistema QR FEIPOBOL`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      // Finalizar PDF
      doc.end();

    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Error generando reporte PDF'
      });
    }
  }

  /**
   * Validar credenciales de un QR
   */
  static async validarCredenciales(req, res) {
    try {
      const { codigoQR } = req.params;

      if (!codigoQR) {
        return res.status(400).json({
          success: false,
          message: 'Código QR requerido'
        });
      }

      // Buscar ticket por código QR o número de ticket
      const ticket = await Ticket.findOne({
        where: {
          [Op.or]: [
            { qrCode: codigoQR },
            { ticketNumber: codigoQR }
          ]
        },
        include: [
          {
            model: Event,
            as: 'Event',
            attributes: ['id', 'name', 'date', 'location']
          },
          {
            model: User,
            as: 'Seller',
            attributes: ['firstName', 'lastName']
          }
        ]
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'Código QR no válido o no encontrado'
        });
      }

      // Validar estado del ticket
      const validacionResult = {
        valido: false,
        mensaje: '',
        ticket: {
          codigo: ticket.ticketNumber,
          qrCode: ticket.qrCode,
          comprador: {
            nombre: ticket.buyerName || 'N/A',
            email: ticket.buyerEmail || 'N/A',
            telefono: ticket.buyerPhone || 'N/A',
            documento: ticket.buyerDocument || 'N/A'
          },
          evento: ticket.Event?.name || 'Sin evento',
          precio: ticket.salePrice,
          estado: ticket.status,
          fechaVenta: ticket.saleDate,
          fechaValidacion: ticket.validationDate,
          vendidoPor: ticket.Seller ? 
            `${ticket.Seller.firstName} ${ticket.Seller.lastName}` : 'Sistema'
        }
      };

      switch (ticket.status) {
        case 'sold':
          validacionResult.valido = true;
          validacionResult.mensaje = '✅ Entrada válida y activa';
          break;
        case 'used':
          validacionResult.valido = false;
          validacionResult.mensaje = '⚠️ Entrada ya utilizada';
          break;
        case 'cancelled':
          validacionResult.valido = false;
          validacionResult.mensaje = '❌ Entrada cancelada';
          break;
        case 'expired':
          validacionResult.valido = false;
          validacionResult.mensaje = '⏰ Entrada expirada';
          break;
        default:
          validacionResult.valido = false;
          validacionResult.mensaje = '❓ Estado de entrada desconocido';
      }

      res.json({
        success: true,
        data: validacionResult
      });

    } catch (error) {
      console.error('Error validando credenciales:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtener opciones para filtros
   */
  static async getFilterOptions(req, res) {
    try {
      // Obtener eventos
      const eventos = await Event.findAll({
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      });

      // Estados posibles (basados en el modelo Ticket)
      const estados = [
        { value: 'sold', label: 'Vendido' },
        { value: 'used', label: 'Usado' },
        { value: 'cancelled', label: 'Cancelado' },
        { value: 'expired', label: 'Expirado' },
        { value: 'available', label: 'Disponible' }
      ];

      res.json({
        success: true,
        data: {
          eventos: eventos.map(e => ({ value: e.id, label: e.name })),
          estados
        }
      });

    } catch (error) {
      console.error('Error obteniendo opciones de filtros:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo opciones de filtros'
      });
    }
  }

  /**
   * Obtener datos de accesos de Participantes (Generador QR)
   */
  static async getAccesosParticipantes(req, res) {
    try {
      const {
        fechaInicio,
        fechaFin,
        empresaId,
        estado,
        page = 1,
        limit = 100
      } = req.query;

      console.log('📊 Obteniendo accesos con filtros:', { fechaInicio, fechaFin, empresaId, estado });

      // Construir filtros
      const whereConditions = {};
      
      if (estado) {
        whereConditions.estado = estado;
      }

      if (fechaInicio && fechaFin) {
        whereConditions.ultimoAcceso = {
          [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
        };
      }

      // Include de empresa
      const includeConditions = [{
        model: Empresa,
        as: 'Empresa',
        attributes: ['id', 'nombre', 'razonSocial']
      }];

      // Filtro por empresa
      if (empresaId) {
        whereConditions.empresaId = empresaId;
      }

      console.log('🔍 Where conditions:', whereConditions);

      // Obtener participantes con paginación
      const { count, rows: participantes } = await Participante.findAndCountAll({
        where: whereConditions,
        include: includeConditions,
        order: [['ultimoAcceso', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      console.log(`✅ Encontrados ${count} participantes`);

      // Obtener estadísticas
      const estadisticas = await ReportController.getEstadisticasAccesos(whereConditions);

      res.json({
        success: true,
        data: {
          participantes,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / parseInt(limit))
          },
          estadisticas
        }
      });

    } catch (error) {
      console.error('❌ Error obteniendo accesos de participantes:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo datos de accesos',
        error: error.message
      });
    }
  }

  /**
   * Obtener estadísticas de accesos
   */
  static async getEstadisticasAccesos(whereConditions = {}) {
    try {
      console.log('📊 Calculando estadísticas de accesos...');
      
      // Total de participantes
      const totalParticipantes = await Participante.count({
        where: whereConditions
      });

      console.log(`Total participantes: ${totalParticipantes}`);

      // Por estado
      const porEstado = await Participante.findAll({
        where: whereConditions,
        attributes: [
          'estado',
          [fn('COUNT', col('id')), 'cantidad']
        ],
        group: ['estado'],
        raw: true
      });

      console.log('Por estado:', porEstado);

      // Por empresa (top 10) - versión simplificada
      let porEmpresa = [];
      try {
        const porEmpresaResult = await Participante.findAll({
          where: whereConditions,
          include: [{
            model: Empresa,
            as: 'Empresa',
            attributes: ['id', 'nombre']
          }],
          attributes: [
            'empresaId',
            [fn('COUNT', col('Participante.id')), 'cantidad']
          ],
          group: ['Participante.empresaId', 'Empresa.id', 'Empresa.nombre'],
          order: [[literal('cantidad'), 'DESC']],
          limit: 10
        });

        porEmpresa = porEmpresaResult.map(item => ({
          empresa: item.Empresa?.nombre || 'Sin empresa',
          cantidad: parseInt(item.get('cantidad'))
        }));
      } catch (empresaError) {
        console.error('Error obteniendo por empresa:', empresaError.message);
        // Continuar sin datos de empresa
      }

      console.log('Por empresa:', porEmpresa);

      // Accesos por día (últimos 7 días)
      const accesosPorDia = await Participante.findAll({
        where: {
          ...whereConditions,
          ultimoAcceso: {
            [Op.not]: null
          }
        },
        attributes: [
          [fn('DATE', col('ultimoAcceso')), 'fecha'],
          [fn('COUNT', col('id')), 'cantidad']
        ],
        group: [fn('DATE', col('ultimoAcceso'))],
        order: [[fn('DATE', col('ultimoAcceso')), 'DESC']],
        limit: 7,
        raw: true
      });

      console.log('Accesos por día:', accesosPorDia);

      // Total con acceso registrado
      const conAcceso = await Participante.count({
        where: {
          ...whereConditions,
          ultimoAcceso: {
            [Op.not]: null
          }
        }
      });

      console.log(`Con acceso: ${conAcceso}`);

      return {
        totalParticipantes,
        conAcceso,
        sinAcceso: totalParticipantes - conAcceso,
        porEstado: porEstado.map(item => ({
          estado: item.estado,
          cantidad: parseInt(item.cantidad)
        })),
        porEmpresa,
        accesosPorDia
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de accesos:', error);
      console.error('Stack:', error.stack);
      return {
        totalParticipantes: 0,
        conAcceso: 0,
        sinAcceso: 0,
        porEstado: [],
        porEmpresa: [],
        accesosPorDia: []
      };
    }
  }

  /**
   * Obtener opciones de filtros para accesos
   */
  static async getAccesosFilterOptions(req, res) {
    try {
      // Obtener empresas activas
      const empresas = await Empresa.findAll({
        attributes: ['id', 'nombre'],
        order: [['nombre', 'ASC']]
      });

      // Estados posibles de participantes
      const estados = [
        { value: 'activo', label: 'Activo' },
        { value: 'inactivo', label: 'Inactivo' },
        { value: 'suspendido', label: 'Suspendido' }
      ];

      res.json({
        success: true,
        data: {
          empresas: empresas.map(e => ({ value: e.id, label: e.nombre })),
          estados
        }
      });

    } catch (error) {
      console.error('Error obteniendo opciones de filtros de accesos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo opciones de filtros'
      });
    }
  }
}

module.exports = ReportController;