const { PremioFeipobol, GanadorFeipobol, RegistroFeipobol } = require('../src/models');

async function verificarPremios() {
  try {
    console.log('🔍 Verificando premios en la base de datos...\n');
    
    // Obtener todos los premios
    const premios = await PremioFeipobol.findAll({
      order: [['numeroSorteo', 'ASC']]
    });

    if (premios.length === 0) {
      console.log('❌ NO HAY PREMIOS CONFIGURADOS');
      console.log('📝 Para crear un premio, ve al panel de administración');
      return;
    }

    console.log(`📊 Total de premios: ${premios.length}\n`);

    for (const premio of premios) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🏆 Premio #${premio.numeroSorteo}`);
      console.log(`   Nombre: ${premio.nombrePremio}`);
      console.log(`   Descripción: ${premio.descripcionPremio || 'N/A'}`);
      console.log(`   Valor: Bs. ${premio.valorPremio || 0}`);
      console.log(`   Estado: ${premio.activo ? '✅ ACTIVO' : '❌ INACTIVO'}`);
      
      // Verificar si ya tiene ganador
      const ganador = await GanadorFeipobol.findOne({
        where: { premioId: premio.id },
        include: [{
          model: RegistroFeipobol,
          as: 'Registro'
        }]
      });

      if (ganador) {
        console.log(`   👤 Ganador: ${ganador.Registro.nombre} ${ganador.Registro.apellido}`);
        console.log(`   📅 Fecha ganado: ${ganador.fechaGanado}`);
      } else {
        console.log(`   ⏳ Sin ganador aún`);
      }
    }

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Mostrar último número de sorteo asignado
    const ultimoNumero = await RegistroFeipobol.max('numeroSorteo') || 0;
    console.log(`🔢 Último número de sorteo asignado: ${ultimoNumero}`);
    console.log(`🔢 Próximo participante recibirá el número: ${ultimoNumero + 1}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificarPremios();
