const { sequelize } = require('../src/config/database');

/**
 * Script para limpiar todas las tablas de la base de datos
 * Útil ANTES de restaurar un backup
 */

async function limpiarBaseDatos() {
  try {
    console.log('🗑️  Iniciando limpieza de la base de datos...\n');

    // Desactivar restricciones de claves foráneas temporalmente
    await sequelize.query('SET CONSTRAINTS ALL DEFERRED');

    // Lista de tablas a limpiar en orden (respetando dependencias)
    const tablasEnOrden = [
      'validation_logs',
      'tickets',
      'participantes',
      'trabajadores',
      'events',
      'empresas',
      'staff',
      'users'
    ];

    for (const tabla of tablasEnOrden) {
      try {
        console.log(`🔄 Limpiando tabla: ${tabla}...`);
        
        // Contar registros antes de eliminar
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tabla}"`);
        const count = countResult[0].count;
        
        if (count > 0) {
          // Truncar tabla y reiniciar secuencias
          await sequelize.query(`TRUNCATE TABLE "${tabla}" RESTART IDENTITY CASCADE`);
          console.log(`✅ ${tabla}: ${count} registros eliminados`);
        } else {
          console.log(`ℹ️  ${tabla}: ya está vacía`);
        }
      } catch (error) {
        // Si la tabla no existe, continuar
        if (error.message.includes('does not exist')) {
          console.log(`⚠️  ${tabla}: no existe (omitida)`);
        } else {
          console.error(`❌ Error en ${tabla}:`, error.message);
        }
      }
    }

    console.log('\n✅ Base de datos limpiada exitosamente');
    console.log('💡 Ahora puedes restaurar tu backup desde el dashboard\n');

  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar
console.log('═══════════════════════════════════════════════════════');
console.log('   🗑️  LIMPIEZA DE BASE DE DATOS SISQR6');
console.log('═══════════════════════════════════════════════════════\n');
console.log('⚠️  ADVERTENCIA: Esta acción eliminará TODOS los datos\n');

// Confirmar antes de ejecutar
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('¿Estás seguro? Escribe "SI" para continuar: ', async (respuesta) => {
  if (respuesta.toUpperCase() === 'SI') {
    await limpiarBaseDatos();
  } else {
    console.log('❌ Operación cancelada');
  }
  readline.close();
  process.exit(0);
});
