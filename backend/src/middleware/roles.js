// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
          message: 'Debes estar autenticado para acceder a este recurso'
        });
      }
      
      // Convertir a array si es un string
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      // Verificar si el usuario tiene uno de los roles permitidos
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Acceso denegado',
          message: `Se requiere rol: ${roles.join(' o ')}. Tu rol actual: ${req.user.role}`,
          requiredRoles: roles,
          userRole: req.user.role
        });
      }
      
      next();
    } catch (error) {
      console.error('Error en verificación de roles:', error);
      return res.status(500).json({
        error: 'Error interno',
        message: 'Error verificando permisos'
      });
    }
  };
};

// Middleware específicos para cada rol
const requireAdmin = requireRole('admin');
const requireVendedor = requireRole(['admin', 'vendedor']);
const requireControl = requireRole(['admin', 'control']);

// Middleware que permite a admin + cualquier otro rol específico
const requireAdminOr = (role) => requireRole(['admin', role]);

// Middleware para verificar que el usuario puede acceder a sus propios datos
const requireOwnershipOrAdmin = (userIdField = 'userId') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
          message: 'Debes estar autenticado'
        });
      }
      
      // Los admins pueden acceder a todo
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Obtener el ID del usuario del parámetro o body
      const targetUserId = req.params[userIdField] || 
                          req.body[userIdField] || 
                          req.query[userIdField];
      
      // Si no hay ID específico, el usuario accede a sus propios datos
      if (!targetUserId || targetUserId === req.user.id) {
        return next();
      }
      
      // Si el ID no coincide con el usuario actual, denegar acceso
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes acceder a tus propios datos'
      });
      
    } catch (error) {
      console.error('Error verificando propiedad:', error);
      return res.status(500).json({
        error: 'Error interno',
        message: 'Error verificando permisos de propiedad'
      });
    }
  };
};

// Middleware para logs de acceso por roles
const logRoleAccess = (req, res, next) => {
  if (req.user) {
    console.log(`🔐 Acceso: ${req.user.role} (${req.user.username}) -> ${req.method} ${req.originalUrl}`);
  }
  next();
};

// Función helper para verificar permisos específicos
const hasPermission = (user, requiredRole) => {
  if (!user || !user.role) return false;
  
  // Admin siempre tiene todos los permisos
  if (user.role === 'admin') return true;
  
  // Verificar rol específico
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  
  return user.role === requiredRole;
};

// Constantes de roles para usar en la aplicación
const ROLES = {
  ADMIN: 'admin',
  VENDEDOR: 'vendedor',
  CONTROL: 'control'
};

// Jerarquía de permisos (un rol incluye los permisos de roles inferiores)
const ROLE_HIERARCHY = {
  admin: ['admin', 'vendedor', 'control'],
  vendedor: ['vendedor'],
  control: ['control']
};

// Verificar si un rol tiene permisos de otro rol
const hasRolePermission = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;
  
  const permissions = ROLE_HIERARCHY[userRole] || [];
  return permissions.includes(requiredRole);
};

module.exports = {
  requireRole,
  requireAdmin,
  requireVendedor,
  requireControl,
  requireAdminOr,
  requireOwnershipOrAdmin,
  logRoleAccess,
  hasPermission,
  hasRolePermission,
  ROLES,
  ROLE_HIERARCHY
};