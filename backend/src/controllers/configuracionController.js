const { Configuracion } = require('../models');

/**
 * Obtener todas las configuraciones
 */
exports.getAll = async (req, res) => {
  try {
    const configuraciones = await Configuracion.findAll({
      order: [['clave', 'ASC']]
    });

    // Convertir a objeto clave-valor
    const config = {};
    configuraciones.forEach(c => {
      // Convertir valor según el tipo
      if (c.tipo === 'boolean') {
        config[c.clave] = c.valor === 'true';
      } else if (c.tipo === 'number') {
        config[c.clave] = parseFloat(c.valor);
      } else if (c.tipo === 'json') {
        try {
          config[c.clave] = JSON.parse(c.valor);
        } catch (e) {
          config[c.clave] = c.valor;
        }
      } else {
        config[c.clave] = c.valor;
      }
    });

    res.json({
      success: true,
      data: config,
      raw: configuraciones
    });
  } catch (error) {
    console.error('❌ Error obteniendo configuraciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuraciones'
    });
  }
};

/**
 * Obtener una configuración específica por clave
 */
exports.getByKey = async (req, res) => {
  try {
    const { clave } = req.params;
    const config = await Configuracion.findOne({ where: { clave } });

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada'
      });
    }

    // Convertir valor según tipo
    let valor = config.valor;
    if (config.tipo === 'boolean') {
      valor = config.valor === 'true';
    } else if (config.tipo === 'number') {
      valor = parseFloat(config.valor);
    } else if (config.tipo === 'json') {
      try {
        valor = JSON.parse(config.valor);
      } catch (e) {
        valor = config.valor;
      }
    }

    res.json({
      success: true,
      data: {
        clave: config.clave,
        valor,
        descripcion: config.descripcion,
        tipo: config.tipo
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener configuración'
    });
  }
};

/**
 * Actualizar o crear configuración
 */
exports.set = async (req, res) => {
  try {
    const { clave, valor, descripcion, tipo } = req.body;

    if (!clave || valor === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Clave y valor son requeridos'
      });
    }

    // Convertir valor a string para almacenar
    let valorString;
    if (typeof valor === 'boolean') {
      valorString = valor.toString();
    } else if (typeof valor === 'object') {
      valorString = JSON.stringify(valor);
    } else {
      valorString = String(valor);
    }

    const [config, created] = await Configuracion.findOrCreate({
      where: { clave },
      defaults: {
        clave,
        valor: valorString,
        descripcion: descripcion || null,
        tipo: tipo || 'string'
      }
    });

    if (!created) {
      // Actualizar si ya existe
      config.valor = valorString;
      if (descripcion) config.descripcion = descripcion;
      if (tipo) config.tipo = tipo;
      await config.save();
    }

    res.json({
      success: true,
      message: created ? 'Configuración creada' : 'Configuración actualizada',
      data: config
    });
  } catch (error) {
    console.error('❌ Error guardando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar configuración'
    });
  }
};

/**
 * Toggle para habilitar/deshabilitar formularios
 */
exports.toggleFormulario = async (req, res) => {
  try {
    const { tipo } = req.params; // 'participantes', 'trabajadores' o 'feipobol'
    const { activo } = req.body;

    if (!['participantes', 'trabajadores', 'feipobol'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo inválido. Use: participantes, trabajadores o feipobol'
      });
    }

    const clave = `formulario_${tipo}_activo`;
    const valorString = String(activo);

    const [config, created] = await Configuracion.findOrCreate({
      where: { clave },
      defaults: {
        clave,
        valor: valorString,
        descripcion: `Habilita/deshabilita el formulario de registro de ${tipo}`,
        tipo: 'boolean'
      }
    });

    if (!created) {
      config.valor = valorString;
      await config.save();
    }

    console.log(`🔄 Formulario ${tipo}: ${activo ? 'ACTIVADO' : 'DESACTIVADO'}`);

    res.json({
      success: true,
      message: `Formulario de ${tipo} ${activo ? 'activado' : 'desactivado'}`,
      data: {
        tipo,
        activo
      }
    });
  } catch (error) {
    console.error('❌ Error toggling formulario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado del formulario'
    });
  }
};

/**
 * Inicializar configuraciones por defecto
 */
exports.initDefaults = async () => {
  try {
    const defaults = [
      {
        clave: 'formulario_participantes_activo',
        valor: 'true',
        descripcion: 'Habilita/deshabilita el formulario de registro de participantes',
        tipo: 'boolean'
      },
      {
        clave: 'formulario_trabajadores_activo',
        valor: 'true',
        descripcion: 'Habilita/deshabilita el formulario de registro de trabajadores',
        tipo: 'boolean'
      },
      {
        clave: 'formulario_feipobol_activo',
        valor: 'true',
        descripcion: 'Habilita/deshabilita el formulario de registro de FEIPOBOL',
        tipo: 'boolean'
      }
    ];

    for (const def of defaults) {
      await Configuracion.findOrCreate({
        where: { clave: def.clave },
        defaults: def
      });
    }

    console.log('✅ Configuraciones por defecto inicializadas');
  } catch (error) {
    console.error('❌ Error inicializando configuraciones:', error);
  }
};
