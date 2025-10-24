const { User } = require('../models');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// Registro de nuevo usuario
const register = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    
    const { username, email, password, firstName, lastName, phone, role } = req.body;
    
    // Verificar si el usuario ya existe
    const { Op } = require('sequelize');
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { username }
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'Usuario ya existe',
        message: existingUser.email === email ? 
          'Ya existe un usuario con este email' : 
          'Ya existe un usuario con este nombre de usuario'
      });
    }
    
    // Solo los admins pueden asignar roles específicos
    let userRole = 'vendedor'; // rol por defecto
    if (req.user && req.user.role === 'admin' && role) {
      userRole = role;
    }
    
    // Crear nuevo usuario
    const newUser = await User.create({
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role: userRole
    });
    
    // Generar tokens
    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    
    // Actualizar último login
    await newUser.update({ lastLogin: new Date() });
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser.getPublicData(),
      token,
      refreshToken
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el usuario'
    });
  }
};

// Login de usuario
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    
    const { login, password } = req.body;
    
    // Buscar usuario por email o username
    const user = await User.findByLogin(login);
    
    if (!user) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email/usuario o contraseña incorrectos'
      });
    }
    
    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Cuenta desactivada',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
      });
    }
    
    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Email/usuario o contraseña incorrectos'
      });
    }
    
    // Generar tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Actualizar último login
    await user.update({ lastLogin: new Date() });
    
    res.json({
      message: 'Login exitoso',
      user: user.getPublicData(),
      token,
      refreshToken
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo procesar el login'
    });
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    res.json({
      message: 'Perfil obtenido exitosamente',
      user: req.user.getPublicData()
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el perfil'
    });
  }
};

// Actualizar perfil del usuario
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    
    const { firstName, lastName, phone, preferences } = req.body;
    const user = req.user;
    
    // Actualizar campos permitidos
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (preferences !== undefined) updateData.preferences = preferences;
    
    await user.update(updateData);
    await user.reload();
    
    res.json({
      message: 'Perfil actualizado exitosamente',
      user: user.getPublicData()
    });
    
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el perfil'
    });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: errors.array()
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    
    // Verificar contraseña actual
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta'
      });
    }
    
    // Actualizar contraseña
    await user.update({ password: newPassword });
    
    res.json({
      message: 'Contraseña cambiada exitosamente'
    });
    
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo cambiar la contraseña'
    });
  }
};

// Refrescar token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Token requerido',
        message: 'Se requiere un refresh token'
      });
    }
    
    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(400).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es un refresh token'
      });
    }
    
    // Buscar usuario
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Usuario no encontrado o inactivo',
        message: 'No se pudo refrescar el token'
      });
    }
    
    // Generar nuevos tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    res.json({
      message: 'Token refrescado exitosamente',
      token: newToken,
      refreshToken: newRefreshToken
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token inválido',
        message: 'El refresh token no es válido o ha expirado'
      });
    }
    
    console.error('Error refrescando token:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo refrescar el token'
    });
  }
};

// Logout (invalidar token - esto sería mejor con una blacklist)
const logout = async (req, res) => {
  try {
    // En una implementación completa, aquí agregaríamos el token a una blacklist
    res.json({
      message: 'Logout exitoso'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo procesar el logout'
    });
  }
};

// Verificar estado de autenticación
const verifyAuth = async (req, res) => {
  try {
    res.json({
      message: 'Token válido',
      user: req.user.getPublicData(),
      authenticated: true
    });
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      authenticated: false
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logout,
  verifyAuth
};