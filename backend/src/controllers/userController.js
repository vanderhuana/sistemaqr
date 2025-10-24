const bcrypt = require('bcryptjs');
const { User } = require('../models');

const userController = {
  // Obtener todos los usuarios (solo admin)
  async getAllUsers(req, res) {
    try {
      const usersRaw = await User.findAll({
        attributes: { exclude: ['password'] }, // No enviar contraseñas
        order: [['createdAt', 'DESC']]
      });
      
      // Mapear los usuarios para que coincidan con el frontend
      const users = usersRaw.map(user => ({
        id: user.id,
        nombre: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        rol: user.role,
        username: user.username,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
      
      res.json(users);
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        error: error.message 
      });
    }
  },

  // Crear nuevo usuario (solo admin)
  async createUser(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;

      // Validaciones
      if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ 
          message: 'Todos los campos son obligatorios' 
        });
      }

      if (!['admin', 'vendedor', 'control'].includes(rol)) {
        return res.status(400).json({ 
          message: 'Rol inválido. Debe ser: admin, vendedor o control' 
        });
      }

      // Dividir el nombre completo en firstName y lastName
      const nombreParts = nombre.trim().split(' ');
      const firstName = nombreParts[0];
      const lastName = nombreParts.slice(1).join(' ') || firstName; // Si no hay apellido, usar el nombre

      // Verificar si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ 
          message: 'Ya existe un usuario con ese email' 
        });
      }

      // NO encriptar manualmente - el modelo User lo hace automáticamente en beforeCreate
      
      // Crear usuario con los campos correctos del modelo
      const newUser = await User.create({
        username: email.split('@')[0], // Usar la parte antes del @ como username
        email,
        password, // Contraseña sin encriptar - el modelo se encarga
        firstName,
        lastName,
        role: rol // Usar 'role' en lugar de 'rol'
      });

      // Retornar usuario sin contraseña, mapeando los campos para el frontend
      const userResponse = {
        id: newUser.id,
        nombre: `${newUser.firstName} ${newUser.lastName}`.trim(),
        email: newUser.email,
        rol: newUser.role,
        username: newUser.username,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };

      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        error: error.message 
      });
    }
  },

  // Actualizar usuario (solo admin)
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { nombre, email, rol, password } = req.body;

      // Verificar que el usuario existe
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        });
      }

      // Preparar datos a actualizar
      const updateData = {};
      
      if (nombre) {
        const nombreParts = nombre.trim().split(' ');
        updateData.firstName = nombreParts[0];
        updateData.lastName = nombreParts.slice(1).join(' ') || nombreParts[0];
      }
      if (email) updateData.email = email;
      if (rol && ['admin', 'vendedor', 'control'].includes(rol)) {
        updateData.role = rol; // Usar 'role' en lugar de 'rol'
      }
      
      // Si se proporciona nueva contraseña, NO encriptar - el modelo lo hace automáticamente
      if (password) {
        updateData.password = password; // Sin encriptar - beforeUpdate se encarga
      }

      // Verificar email único si se está cambiando
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(409).json({ 
            message: 'Ya existe un usuario con ese email' 
          });
        }
      }

      // Actualizar usuario
      await user.update(updateData);

      // Retornar usuario actualizado sin contraseña, mapeando campos
      const userResponse = {
        id: user.id,
        nombre: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        rol: user.role,
        username: user.username,
        updatedAt: user.updatedAt
      };

      res.json(userResponse);
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        error: error.message 
      });
    }
  },

  // Eliminar usuario (solo admin)
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      // Verificar que el usuario existe
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        });
      }

      // No permitir que el admin se elimine a sí mismo
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({ 
          message: 'No puedes eliminar tu propia cuenta' 
        });
      }

      // Eliminar usuario
      await user.destroy();

      res.json({ 
        message: 'Usuario eliminado exitosamente' 
      });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        error: error.message 
      });
    }
  },

  // Obtener perfil del usuario actual
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(404).json({ 
          message: 'Usuario no encontrado' 
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({ 
        message: 'Error interno del servidor',
        error: error.message 
      });
    }
  }
};

module.exports = userController;