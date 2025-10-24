const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la conexión a PostgreSQL
// Soporta DATABASE_URL (para DigitalOcean Managed DB) o variables individuales
let sequelize;

if (process.env.DATABASE_URL) {
  // Usar connection string completa (DigitalOcean Managed Database)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Necesario para algunos proveedores cloud
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
} else {
  // Usar variables de entorno individuales (desarrollo local)
  sequelize = new Sequelize({
    database: process.env.DB_NAME || 'sisqr6_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
}

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente.');
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    process.exit(1);
  }
};

// Función para sincronizar modelos (crear tablas)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log(`✅ Base de datos sincronizada ${force ? '(forzada)' : ''}.`);
  } catch (error) {
    console.error('❌ Error al sincronizar la base de datos:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
};