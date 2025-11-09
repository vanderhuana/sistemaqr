const { RegistroFeipobol, GanadorFeipobol } = require('../src/models');

async function resetearNumeroSorteo() {
  try {
    console.log('🔄 Reseteando números de sorteo...\n');
    
    // Eliminar TODOS los registros y ganadores para empezar limpio
    await GanadorFeipobol.destroy({ where: {} });
    console.log('✅ Ganadores eliminados');
    
    await RegistroFeipobol.destroy({ where: {} });
    console.log('✅ Registros eliminados');
    
    console.log('\n🎉 Base de datos limpia');
    console.log('📝 El próximo participante que se registre recibirá el número #1');
    console.log('🏆 Y GANARÁ el premio "televizor" automáticamente\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetearNumeroSorteo();
