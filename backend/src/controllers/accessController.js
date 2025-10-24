const { Trabajador, Participante } = require('../models');
const { Op } = require('sequelize');

// Configuración del sistema de acceso
let sistemaActivo = true; // Por defecto activo
const HORA_REINICIO = 10; // 10:00 AM

// Helper: Verificar si ya ingresó hoy después de las 10 AM
const yaIngresoHoy = (ultimoAcceso) => {
  if (!ultimoAcceso) return false;
  
  const ahora = new Date();
  const ultimoIngresoDate = new Date(ultimoAcceso);
  
  // Obtener la última hora de reinicio (10 AM del día actual o anterior)
  const horaReinicioHoy = new Date(ahora);
  horaReinicioHoy.setHours(HORA_REINICIO, 0, 0, 0);
  
  // Si aún no son las 10 AM, la hora de reinicio es 10 AM de ayer
  const horaReinicioReferencia = ahora >= horaReinicioHoy ? horaReinicioHoy : new Date(horaReinicioHoy.getTime() - 24 * 60 * 60 * 1000);
  
  // Verificar si el último acceso fue después de la última hora de reinicio
  return ultimoIngresoDate >= horaReinicioReferencia;
};

const accessController = {
  
  // **VALIDAR QR DE TRABAJADOR/PARTICIPANTE**
  async validateAccess(req, res) {
    const startTime = Date.now();
    
    try {
      const { token, tipo } = req.body; // tipo: 'trabajador' o 'participante'
      const validatorId = req.user?.id;
      
      console.log('🔍 Validando acceso:', { token, tipo, sistemaActivo });
      
      // Verificar si el sistema está activo
      if (!sistemaActivo) {
        return res.status(403).json({
          success: false,
          message: '❌ Sistema de acceso desactivado por el administrador',
          result: 'system_disabled',
          systemActive: false
        });
      }
      
      // Verificar permisos
      if (req.user?.role !== 'control' && req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para validar accesos',
          result: 'access_denied'
        });
      }
      
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token requerido',
          result: 'invalid_token'
        });
      }
      
      let persona = null;
      let tipoPersona = tipo;
      
      // Intentar buscar en trabajadores
      if (!tipoPersona || tipoPersona === 'trabajador') {
        persona = await Trabajador.findOne({ where: { token } });
        if (persona) tipoPersona = 'trabajador';
      }
      
      // Si no se encontró, buscar en participantes
      if (!persona && (!tipoPersona || tipoPersona === 'participante')) {
        persona = await Participante.findOne({ where: { token } });
        if (persona) tipoPersona = 'participante';
      }
      
      // No se encontró la persona
      if (!persona) {
        return res.status(404).json({
          success: false,
          message: '❌ Token no válido o no registrado',
          result: 'not_found',
          validationDuration: Date.now() - startTime
        });
      }
      
      // Verificar estado
      if (persona.estado !== 'activo') {
        return res.status(403).json({
          success: false,
          message: `❌ ${tipoPersona === 'trabajador' ? 'Trabajador' : 'Participante'} con estado: ${persona.estado.toUpperCase()}`,
          result: 'inactive_status',
          tipo: tipoPersona,
          persona: {
            nombre: `${persona.nombre} ${persona.apellido}`,
            estado: persona.estado,
            tipo: tipoPersona
          },
          validationDuration: Date.now() - startTime
        });
      }
      
      // Verificar si ya ingresó hoy
      if (yaIngresoHoy(persona.ultimoAcceso)) {
        return res.status(400).json({
          success: false,
          message: `⚠️ ${persona.nombre} ${persona.apellido} ya registró su ingreso hoy`,
          result: 'already_entered_today',
          title: 'YA INGRESÓ HOY',
          tipo: tipoPersona,
          persona: {
            nombre: `${persona.nombre} ${persona.apellido}`,
            ci: persona.ci,
            area: persona.areaTrabajo || persona.area,
            tipo: tipoPersona,
            ultimoAcceso: persona.ultimoAcceso
          },
          validationDuration: Date.now() - startTime
        });
      }
      
      // Registrar el acceso actual
      persona.ultimoAcceso = new Date();
      await persona.save();
      
      // ACCESO PERMITIDO
      return res.status(200).json({
        success: true,
        message: `✅ Acceso permitido`,
        result: 'success',
        tipo: tipoPersona, // 'trabajador' o 'participante' - necesario para el frontend
        persona: {
          nombre: `${persona.nombre} ${persona.apellido}`,
          ci: persona.ci,
          area: persona.areaTrabajo || persona.area,
          tipo: tipoPersona,
          sexo: persona.sexo,
          telefono: persona.telefono,
          ocupacion: persona.ocupacion,
          fechaRegistro: persona.createdAt,
          ultimoAcceso: persona.ultimoAcceso
        },
        validationDuration: Date.now() - startTime,
        systemActive: sistemaActivo
      });
      
    } catch (error) {
      console.error('❌ Error validando acceso:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        result: 'server_error',
        error: error.message
      });
    }
  },
  
  // **OBTENER ESTADO DEL SISTEMA**
  async getSystemStatus(req, res) {
    try {
      // Estadísticas de hoy
      const hoy = new Date();
      hoy.setHours(HORA_REINICIO, 0, 0, 0);
      
      const trabajadoresHoy = await Trabajador.count({
        where: {
          ultimoAcceso: {
            [Op.gte]: hoy
          }
        }
      });
      
      const participantesHoy = await Participante.count({
        where: {
          ultimoAcceso: {
            [Op.gte]: hoy
          }
        }
      });
      
      const totalTrabajadores = await Trabajador.count({
        where: { estado: 'activo' }
      });
      
      const totalParticipantes = await Participante.count({
        where: { estado: 'activo' }
      });
      
      return res.status(200).json({
        success: true,
        systemActive: sistemaActivo,
        horaReinicio: `${HORA_REINICIO}:00`,
        estadisticas: {
          trabajadoresHoy,
          participantesHoy,
          totalHoy: trabajadoresHoy + participantesHoy,
          totalTrabajadores,
          totalParticipantes
        }
      });
      
    } catch (error) {
      console.error('Error obteniendo estado del sistema:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estado',
        error: error.message
      });
    }
  },
  
  // **ACTIVAR/DESACTIVAR SISTEMA**
  async toggleSystem(req, res) {
    try {
      // Solo admin puede cambiar el estado
      if (req.user?.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden cambiar el estado del sistema'
        });
      }
      
      const { activo } = req.body;
      
      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'El parámetro "activo" debe ser booleano'
        });
      }
      
      sistemaActivo = activo;
      
      console.log(`🔄 Sistema de acceso ${activo ? 'ACTIVADO' : 'DESACTIVADO'} por ${req.user.firstName} ${req.user.lastName}`);
      
      return res.status(200).json({
        success: true,
        message: `Sistema ${activo ? 'activado' : 'desactivado'} correctamente`,
        systemActive: sistemaActivo
      });
      
    } catch (error) {
      console.error('Error cambiando estado del sistema:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al cambiar estado',
        error: error.message
      });
    }
  },
  
  // **HISTORIAL DE ACCESOS**
  async getAccessHistory(req, res) {
    try {
      const { limit = 50, tipo } = req.query;
      
      const hoy = new Date();
      hoy.setHours(HORA_REINICIO, 0, 0, 0);
      
      const whereClause = {
        ultimoAcceso: {
          [Op.gte]: hoy
        }
      };
      
      let history = [];
      
      if (!tipo || tipo === 'trabajador') {
        const trabajadores = await Trabajador.findAll({
          where: whereClause,
          order: [['ultimoAcceso', 'DESC']],
          limit: parseInt(limit)
        });
        
        history = history.concat(trabajadores.map(t => ({
          nombre: `${t.nombre} ${t.apellido}`,
          ci: t.ci,
          area: t.areaTrabajo,
          tipo: 'trabajador',
          ultimoAcceso: t.ultimoAcceso,
          telefono: t.telefono
        })));
      }
      
      if (!tipo || tipo === 'participante') {
        const participantes = await Participante.findAll({
          where: whereClause,
          order: [['ultimoAcceso', 'DESC']],
          limit: parseInt(limit)
        });
        
        history = history.concat(participantes.map(p => ({
          nombre: `${p.nombre} ${p.apellido}`,
          ci: p.ci,
          area: p.area,
          tipo: 'participante',
          ultimoAcceso: p.ultimoAcceso,
          telefono: p.telefono
        })));
      }
      
      // Ordenar por fecha descendente
      history.sort((a, b) => new Date(b.ultimoAcceso) - new Date(a.ultimoAcceso));
      
      return res.status(200).json({
        success: true,
        history: history.slice(0, parseInt(limit)),
        total: history.length
      });
      
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener historial',
        error: error.message
      });
    }
  }
  
};

module.exports = accessController;
