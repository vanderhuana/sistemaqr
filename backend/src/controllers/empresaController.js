const { Empresa, Participante } = require('../models');

// Obtener todas las empresas con su cupo usado
const getAllEmpresas = async (req, res) => {
  try {
    const empresas = await Empresa.findAll({
      order: [['nombre', 'ASC']],
      include: [{
        model: Participante,
        as: 'Participantes',
        attributes: ['id']
      }]
    });

    // Formatear respuesta con cupo usado
    const empresasConCupo = empresas.map(empresa => {
      const cupoUsado = empresa.Participantes ? empresa.Participantes.length : 0;
      return {
        id: empresa.id,
        nombre: empresa.nombre,
        cupoTotal: empresa.cupoTotal,
        cupoUsado: cupoUsado,
        cupoDisponible: empresa.cupoTotal - cupoUsado,
        activo: empresa.activo,
        estado: cupoUsado >= empresa.cupoTotal ? 'completo' : 'disponible',
        createdAt: empresa.createdAt,
        updatedAt: empresa.updatedAt
      };
    });

    res.json({
      success: true,
      data: empresasConCupo
    });
  } catch (error) {
    console.error('Error obteniendo empresas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las empresas',
      details: error.message
    });
  }
};

// Obtener solo empresas con cupo disponible (para el formulario de registro)
const getEmpresasDisponibles = async (req, res) => {
  try {
    // Headers para prevenir caché
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    const empresas = await Empresa.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']],
      include: [{
        model: Participante,
        as: 'Participantes',
        attributes: ['id']
      }]
    });

    // Filtrar solo las que tienen cupo disponible
    const empresasDisponibles = empresas
      .map(empresa => {
        const cupoUsado = empresa.Participantes ? empresa.Participantes.length : 0;
        return {
          id: empresa.id,
          nombre: empresa.nombre,
          cupoTotal: empresa.cupoTotal,
          cupoUsado: cupoUsado,
          cupoDisponible: empresa.cupoTotal - cupoUsado
        };
      })
      .filter(empresa => empresa.cupoDisponible > 0);

    console.log(`📊 Empresas disponibles: ${empresasDisponibles.length} de ${empresas.length} activas`);

    res.json({
      success: true,
      data: empresasDisponibles,
      timestamp: new Date().toISOString() // Agregar timestamp para debugging
    });
  } catch (error) {
    console.error('Error obteniendo empresas disponibles:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las empresas disponibles',
      details: error.message
    });
  }
};

// Crear nueva empresa
const createEmpresa = async (req, res) => {
  try {
    const { nombre, cupoTotal } = req.body;

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'El nombre de la empresa/stand es requerido'
      });
    }

    if (!cupoTotal || cupoTotal < 1) {
      return res.status(400).json({
        success: false,
        error: 'El cupo total debe ser mayor a 0'
      });
    }

    // Verificar si ya existe una empresa con ese nombre
    const empresaExistente = await Empresa.findOne({
      where: { nombre: nombre.trim() }
    });

    if (empresaExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una empresa/stand con ese nombre'
      });
    }

    // Crear empresa
    const empresa = await Empresa.create({
      nombre: nombre.trim(),
      cupoTotal: parseInt(cupoTotal),
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Empresa/Stand creada exitosamente',
      data: {
        id: empresa.id,
        nombre: empresa.nombre,
        cupoTotal: empresa.cupoTotal,
        cupoUsado: 0,
        cupoDisponible: empresa.cupoTotal,
        activo: empresa.activo,
        estado: 'disponible'
      }
    });
  } catch (error) {
    console.error('Error creando empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la empresa/stand',
      details: error.message
    });
  }
};

// Actualizar empresa
const updateEmpresa = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, cupoTotal, activo } = req.body;

    const empresa = await Empresa.findByPk(id, {
      include: [{
        model: Participante,
        as: 'Participantes',
        attributes: ['id']
      }]
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: 'Empresa/Stand no encontrada'
      });
    }

    const cupoUsado = empresa.Participantes ? empresa.Participantes.length : 0;

    // Si se está reduciendo el cupo, verificar que no sea menor al cupo usado
    if (cupoTotal && parseInt(cupoTotal) < cupoUsado) {
      return res.status(400).json({
        success: false,
        error: `No se puede reducir el cupo a ${cupoTotal}. Ya hay ${cupoUsado} participantes registrados.`
      });
    }

    // Verificar nombre duplicado si se está cambiando
    if (nombre && nombre.trim() !== empresa.nombre) {
      const empresaExistente = await Empresa.findOne({
        where: { nombre: nombre.trim() }
      });

      if (empresaExistente) {
        return res.status(400).json({
          success: false,
          error: 'Ya existe una empresa/stand con ese nombre'
        });
      }
    }

    // Actualizar empresa
    if (nombre) empresa.nombre = nombre.trim();
    if (cupoTotal) empresa.cupoTotal = parseInt(cupoTotal);
    if (typeof activo === 'boolean') empresa.activo = activo;

    await empresa.save();

    res.json({
      success: true,
      message: 'Empresa/Stand actualizada exitosamente',
      data: {
        id: empresa.id,
        nombre: empresa.nombre,
        cupoTotal: empresa.cupoTotal,
        cupoUsado: cupoUsado,
        cupoDisponible: empresa.cupoTotal - cupoUsado,
        activo: empresa.activo,
        estado: cupoUsado >= empresa.cupoTotal ? 'completo' : 'disponible'
      }
    });
  } catch (error) {
    console.error('Error actualizando empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la empresa/stand',
      details: error.message
    });
  }
};

// Eliminar empresa
const deleteEmpresa = async (req, res) => {
  try {
    const { id } = req.params;

    const empresa = await Empresa.findByPk(id, {
      include: [{
        model: Participante,
        as: 'Participantes',
        attributes: ['id']
      }]
    });

    if (!empresa) {
      return res.status(404).json({
        success: false,
        error: 'Empresa/Stand no encontrada'
      });
    }

    const cupoUsado = empresa.Participantes ? empresa.Participantes.length : 0;

    // No permitir eliminar si tiene participantes asociados
    if (cupoUsado > 0) {
      return res.status(400).json({
        success: false,
        error: `No se puede eliminar la empresa/stand. Tiene ${cupoUsado} participantes registrados.`,
        suggestion: 'Puedes desactivarla en lugar de eliminarla.'
      });
    }

    await empresa.destroy();

    res.json({
      success: true,
      message: 'Empresa/Stand eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar la empresa/stand',
      details: error.message
    });
  }
};

module.exports = {
  getAllEmpresas,
  getEmpresasDisponibles,
  createEmpresa,
  updateEmpresa,
  deleteEmpresa
};
