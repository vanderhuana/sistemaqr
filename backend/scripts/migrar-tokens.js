/**
 * Script para migrar qrCode a token en participantes y trabajadores existentes
 * 
 * Este script NO es necesario si:
 * - Acabas de crear el sistema
 * - No tienes registros antiguos
 * - Vas a registrar nuevas personas
 * 
 * EJECUTAR SOLO UNA VEZ: node scripts/migrar-tokens.js
 */

const { sequelize, Participante, Trabajador } = require('../src/models');

async function migrarTokens() {
  try {
    console.log('🚀 Iniciando migración de tokens...\n');
    
    // 1. Migrar Participantes
    console.log('📋 Migrando Participantes...');
    const participantes = await Participante.findAll();
    
    let participantesActualizados = 0;
    for (const participante of participantes) {
      // Si el participante ya tiene token válido, saltar
      if (participante.token && participante.token.length === 36) {
        console.log(`  ✓ Participante ${participante.nombre} ${participante.apellido} ya tiene token válido`);
        continue;
      }
      
      // Si tiene qrCode, intentar usarlo como token si es UUID
      if (participante.qrCode) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(participante.qrCode)) {
          console.log(`  → Usando qrCode como token para ${participante.nombre} ${participante.apellido}`);
          // El token ya se generó automáticamente, solo limpiamos qrCode
          participante.qrCode = null;
          await participante.save();
          participantesActualizados++;
        } else {
          console.log(`  ⚠️ qrCode no es UUID válido para ${participante.nombre} ${participante.apellido}, se generó nuevo token automáticamente`);
          participante.qrCode = null;
          await participante.save();
          participantesActualizados++;
        }
      } else {
        console.log(`  → Token generado automáticamente para ${participante.nombre} ${participante.apellido}`);
        await participante.save(); // Forzar guardado para generar token si no existe
        participantesActualizados++;
      }
    }
    
    console.log(`\n✅ Participantes actualizados: ${participantesActualizados}/${participantes.length}\n`);
    
    // 2. Migrar Trabajadores
    console.log('👷 Migrando Trabajadores...');
    const trabajadores = await Trabajador.findAll();
    
    let trabajadoresActualizados = 0;
    for (const trabajador of trabajadores) {
      // Si el trabajador ya tiene token válido, saltar
      if (trabajador.token && trabajador.token.length === 36) {
        console.log(`  ✓ Trabajador ${trabajador.nombre} ${trabajador.apellido} ya tiene token válido`);
        continue;
      }
      
      console.log(`  → Token generado automáticamente para ${trabajador.nombre} ${trabajador.apellido}`);
      await trabajador.save(); // Forzar guardado para generar token si no existe
      trabajadoresActualizados++;
    }
    
    console.log(`\n✅ Trabajadores actualizados: ${trabajadoresActualizados}/${trabajadores.length}\n`);
    
    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`   - Participantes: ${participantesActualizados} actualizados de ${participantes.length} totales`);
    console.log(`   - Trabajadores: ${trabajadoresActualizados} actualizados de ${trabajadores.length} totales`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
migrarTokens();
