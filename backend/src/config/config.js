module.exports = {
  // Configuración de la base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'sisqr6_db',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_jwt_secret_temporal',
    expiresIn: '24h'
  },

  // Configuración de la aplicación
  app: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  }
};