const { sequelize } = require('../config/database');

// Importar todos los modelos
const User = require('./User');
const Event = require('./Event');
const Ticket = require('./Ticket');
const ValidationLog = require('./ValidationLog');
const Staff = require('./Staff')(sequelize);
const Trabajador = require('./Trabajador')(sequelize);
const Participante = require('./Participante')(sequelize);
const Empresa = require('./Empresa')(sequelize);
const RegistroFeipobol = require('./RegistroFeipobol')(sequelize);
const PremioFeipobol = require('./PremioFeipobol')(sequelize);
const GanadorFeipobol = require('./GanadorFeipobol')(sequelize);
const Configuracion = require('./Configuracion')(sequelize);

// Configurar las asociaciones entre modelos

// **RELACIONES DE USER**
// Un usuario puede crear muchos eventos (como administrador)
User.hasMany(Event, {
  foreignKey: 'createdBy',
  as: 'CreatedEvents'
});

Event.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'Creator'
});

// Un usuario puede vender muchas entradas (como vendedor)
User.hasMany(Ticket, {
  foreignKey: 'sellerId',
  as: 'SoldTickets'
});

Ticket.belongsTo(User, {
  foreignKey: 'sellerId',
  as: 'Seller'
});

// Un usuario puede validar muchas entradas (como control)
User.hasMany(Ticket, {
  foreignKey: 'validatedBy',
  as: 'ValidatedTickets'
});

Ticket.belongsTo(User, {
  foreignKey: 'validatedBy',
  as: 'Validator'
});

// **RELACIONES DE EVENT**
// Un evento puede tener muchas entradas
Event.hasMany(Ticket, {
  foreignKey: 'eventId',
  as: 'Tickets',
  onDelete: 'RESTRICT' // No permitir eliminar eventos con entradas
});

Ticket.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'Event'
});

// **RELACIONES DEL VALIDATION LOG**
// Un ticket puede tener muchos logs de validación
Ticket.hasMany(ValidationLog, {
  foreignKey: 'ticketId',
  as: 'ValidationLogs'
});

ValidationLog.belongsTo(Ticket, {
  foreignKey: 'ticketId',
  as: 'Ticket'
});

// Un usuario (validador) puede tener muchos logs
User.hasMany(ValidationLog, {
  foreignKey: 'validatedBy',
  as: 'ValidationLogs'
});

ValidationLog.belongsTo(User, {
  foreignKey: 'validatedBy',
  as: 'Validator'
});

// Un evento puede tener muchos logs de validación (a través de tickets)
Event.hasMany(ValidationLog, {
  foreignKey: 'eventId',
  as: 'ValidationLogs'
});

ValidationLog.belongsTo(Event, {
  foreignKey: 'eventId',
  as: 'Event'
});

// **RELACIONES DE EMPRESA Y PARTICIPANTES**
// Una empresa puede tener muchos participantes
Empresa.hasMany(Participante, {
  foreignKey: 'empresaId',
  as: 'Participantes',
  onDelete: 'SET NULL'
});

Participante.belongsTo(Empresa, {
  foreignKey: 'empresaId',
  as: 'Empresa'
});

// **RELACIONES DE EMPRESA Y REGISTROS FEIPOBOL**
// (Sin relación directa - simplificado)

// **RELACIONES DEL SISTEMA DE SORTEO FEIPOBOL**
// Un premio puede tener un ganador
PremioFeipobol.hasOne(GanadorFeipobol, {
  foreignKey: 'premioId',
  as: 'Ganador',
  onDelete: 'RESTRICT'
});

GanadorFeipobol.belongsTo(PremioFeipobol, {
  foreignKey: 'premioId',
  as: 'Premio'
});

// Un registro puede ser ganador de un premio
RegistroFeipobol.hasOne(GanadorFeipobol, {
  foreignKey: 'registroId',
  as: 'PremioGanado',
  onDelete: 'RESTRICT'
});

GanadorFeipobol.belongsTo(RegistroFeipobol, {
  foreignKey: 'registroId',
  as: 'Registro'
});

// Función para sincronizar todos los modelos
const syncModels = async (force = false) => {
  try {
    if (force) {
      console.log('⚠️  ADVERTENCIA: Recreando tablas (se perderán datos)...');
    } else {
      console.log('🔄 Sincronizando modelos (preservando datos)...');
    }
    
    // Solo forzar si se pasa explícitamente force=true
    await sequelize.sync({ force: force });
    console.log('🎉 Todos los modelos sincronizados correctamente');
    
    return true;
  } catch (error) {
    console.error('❌ Error sincronizando modelos:', error);
    throw error;
  }
};

// Función para crear datos de prueba (seed data)
const seedData = async () => {
  try {
    // Verificar si ya existen datos
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('📊 Ya existen datos en la base de datos');
      return;
    }
    
    console.log('🌱 Creando datos de prueba...');
    
    // Crear usuario administrador por defecto
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@sisqr6.com',
      password: 'admin123',
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: 'admin',
      phone: '+1234567890'
    });
    
    console.log('👤 Usuario administrador creado');
    
    // Crear usuarios de prueba
    await User.create({
      username: 'vendedor1',
      email: 'vendedor@sisqr6.com',
      password: 'vendedor123',
      firstName: 'Juan',
      lastName: 'Vendedor',
      role: 'vendedor'
    });
    
    await User.create({
      username: 'control1',
      email: 'control@sisqr6.com',
      password: 'control123',
      firstName: 'María',
      lastName: 'Control',
      role: 'control'
    });
    
    console.log('👥 Usuarios de prueba creados');
    
    // Crear evento de prueba
    const testEvent = await Event.create({
      name: 'Evento de Prueba',
      description: 'Evento para probar el sistema de entradas',
      location: 'Centro de Convenciones',
      startDate: new Date(Date.now() - 1 * 60 * 60 * 1000), // Comenzó hace 1 hora
      endDate: new Date(Date.now() + 3 * 60 * 60 * 1000), // Termina en 3 horas
      maxCapacity: 100,
      basePrice: 25.00,
      status: 'active',
      createdBy: adminUser.id,
      priceRanges: [
        {
          startTime: '09:00',
          endTime: '12:00',
          price: 20.00
        },
        {
          startTime: '12:00',
          endTime: '18:00',
          price: 25.00
        },
        {
          startTime: '18:00',
          endTime: '23:00',
          price: 30.00
        }
      ]
    });
    
    console.log('🎉 Evento de prueba creado');
    
    // Crear tickets de prueba para el evento
    const vendedorUser = await User.findOne({ where: { role: 'vendedor' } });
    
    // Importar función de generación de QR único
    const { generateUniqueQRCode } = require('../utils/qrUtils');
    
    const testTickets = [
      {
        qrCode: generateUniqueQRCode(null, testEvent.id),
        ticketNumber: 'E000001',
        buyerName: 'Juan Pérez',
        buyerEmail: 'juan@ejemplo.com',
        buyerPhone: '70000001',
        salePrice: 25.00,
        saleDate: new Date(),
        paymentMethod: 'cash',
        status: 'active',
        eventId: testEvent.id,
        sellerId: vendedorUser.id
      },
      {
        qrCode: generateUniqueQRCode(null, testEvent.id),
        ticketNumber: 'E000002',
        buyerName: 'María García',
        buyerEmail: 'maria@ejemplo.com',
        buyerPhone: '70000002',
        salePrice: 30.00,
        saleDate: new Date(),
        paymentMethod: 'card',
        status: 'active',
        eventId: testEvent.id,
        sellerId: vendedorUser.id
      }
    ];

    await Ticket.bulkCreate(testTickets);
    console.log('🎫 Tickets de prueba creados');
    console.log('✅ Datos de prueba creados exitosamente');
    
  } catch (error) {
    console.error('❌ Error creando datos de prueba:', error);
    throw error;
  }
};

// Exportar todos los modelos y funciones
module.exports = {
  sequelize,
  User,
  Event,
  Ticket,
  ValidationLog,
  Staff,
  Trabajador,
  Participante,
  Empresa,
  RegistroFeipobol,
  PremioFeipobol,
  GanadorFeipobol,
  Configuracion,
  syncModels,
  seedData
};