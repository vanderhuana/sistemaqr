const { User } = require('../src/models');
const { sequelize } = require('../src/config/database');
const { Op } = require('sequelize');

const defaultUsers = [
  {
    username: 'admin',
    email: 'admin@feipobol.bo',
    password: 'Feipobol2025!',
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'admin',
    phone: '+591 70000000',
    isActive: true
  },
  {
    username: 'vendedor',
    email: 'vendedor@feipobol.bo',
    password: 'Vendedor2025!',
    firstName: 'Usuario',
    lastName: 'Vendedor',
    role: 'vendedor',
    phone: '+591 70000001',
    isActive: true
  },
  {
    username: 'control',
    email: 'control@feipobol.bo',
    password: 'Control2025!',
    firstName: 'Usuario',
    lastName: 'Control',
    role: 'control',
    phone: '+591 70000002',
    isActive: true
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Iniciando creación de usuarios por defecto...');
    
    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');
    
    // Verificar que la tabla existe
    await User.sync();
    console.log('✅ Tabla de usuarios sincronizada');
    
    for (const userData of defaultUsers) {
      try {
        // Verificar si el usuario ya existe por email
        const existingUser = await User.findOne({
          where: { email: userData.email }
        });
        
        if (existingUser) {
          console.log(`⚠️  Usuario ${userData.username} ya existe, actualizando...`);
          
          // Actualizar usuario existente (sin cambiar password)
          await existingUser.update({
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role,
            phone: userData.phone,
            isActive: userData.isActive
          });
          
          console.log(`✅ Usuario ${userData.username} actualizado`);
        } else {
          // Crear nuevo usuario
          const newUser = await User.create(userData);
          console.log(`✅ Usuario ${userData.username} creado con ID: ${newUser.id}`);
        }
      } catch (userError) {
        console.error(`❌ Error procesando usuario ${userData.username}:`, userError.message);
        console.error('Detalles:', userError);
      }
    }
    
    console.log('🎉 Proceso de creación de usuarios completado');
    
    // Mostrar resumen
    const totalUsers = await User.count();
    const adminCount = await User.count({ where: { role: 'admin' } });
    const vendedorCount = await User.count({ where: { role: 'vendedor' } });
    const controlCount = await User.count({ where: { role: 'control' } });
    
    console.log('\n📊 RESUMEN DE USUARIOS:');
    console.log(`   Total: ${totalUsers}`);
    console.log(`   Administradores: ${adminCount}`);
    console.log(`   Vendedores: ${vendedorCount}`);
    console.log(`   Control: ${controlCount}`);
    
  } catch (error) {
    console.error('❌ Error en el proceso de seed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión a la base de datos cerrada');
    process.exit(0);
  }
}

// Ejecutar el script solo si se llama directamente
if (require.main === module) {
  seedUsers();
}

module.exports = { seedUsers, defaultUsers };