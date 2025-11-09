const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

// Crear directorio de backups si no existe
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Asegurar que el directorio existe
const ensureBackupDir = async () => {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
};

/**
 * Exportar backup de la base de datos
 */
const exportBackup = async (req, res) => {
  try {
    await ensureBackupDir();

    // Generar nombre único para el backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sisqr6_backup_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Obtener credenciales de la base de datos desde variables de entorno
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'sisqr6';
    const dbUser = process.env.DB_USER || 'sisqr6_user';
    const dbPassword = process.env.DB_PASSWORD || 'postgres123';

    // Comando pg_dump con credenciales
    // Para Windows, usamos SET en lugar de PGPASSWORD=
    const isWindows = process.platform === 'win32';
    const pgDumpCommand = isWindows
      ? `set PGPASSWORD=${dbPassword}&& pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${filepath}"`
      : `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F p -f "${filepath}"`;

    console.log('🔄 Generando backup de la base de datos...');

    // Ejecutar pg_dump
    await execAsync(pgDumpCommand);

    // Verificar que el archivo se creó
    const stats = await fs.stat(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup generado exitosamente: ${filename} (${fileSizeMB} MB)`);

    // Leer el archivo y enviarlo como descarga
    const backupData = await fs.readFile(filepath);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    // Enviar el archivo
    res.send(backupData);

    // Opcional: Eliminar el archivo después de enviarlo (comentar si quieres mantenerlo)
    // setTimeout(async () => {
    //   try {
    //     await fs.unlink(filepath);
    //     console.log(`🗑️  Archivo temporal eliminado: ${filename}`);
    //   } catch (err) {
    //     console.error('Error eliminando archivo temporal:', err);
    //   }
    // }, 5000);

  } catch (error) {
    console.error('❌ Error generando backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar el backup',
      error: error.message
    });
  }
};

/**
 * Importar backup a la base de datos
 */
/**
 * Importar backup a la base de datos
 */
const importBackup = async (req, res) => {
  try {
    // Verificar que se haya subido un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo de backup'
      });
    }

    await ensureBackupDir();

    const uploadedFile = req.file;
    const filepath = uploadedFile.path;

    console.log(`🔄 Restaurando backup desde: ${uploadedFile.originalname}`);

    // Leer el contenido del archivo SQL
    const sqlContent = await fs.readFile(filepath, 'utf8');
    
    if (!sqlContent || sqlContent.trim().length === 0) {
      throw new Error('El archivo de backup está vacío');
    }

    console.log(`📄 Archivo leído: ${(sqlContent.length / 1024).toFixed(2)} KB`);

    // Obtener credenciales de la base de datos
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'sisqr6';
    const dbUser = process.env.DB_USER || 'sisqr6_user';
    const dbPassword = process.env.DB_PASSWORD || 'postgres123';

    // Intentar primero con psql si está disponible
    const isWindows = process.platform === 'win32';
    
    try {
      // Buscar psql en rutas comunes de Windows
      const psqlPaths = [
        'psql',
        'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
        'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
        'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe',
        'C:\\Program Files\\PostgreSQL\\13\\bin\\psql.exe',
        'C:\\PostgreSQL\\16\\bin\\psql.exe',
        'C:\\PostgreSQL\\15\\bin\\psql.exe'
      ];

      let psqlCommand = null;
      
      // Intentar encontrar psql
      for (const psqlPath of psqlPaths) {
        try {
          if (isWindows) {
            await execAsync(`where "${psqlPath}" 2>nul`);
          } else {
            await execAsync(`which "${psqlPath}"`);
          }
          psqlCommand = psqlPath;
          console.log(`✅ psql encontrado en: ${psqlPath}`);
          break;
        } catch (e) {
          // Continuar buscando
        }
      }

      if (psqlCommand) {
        // Usar psql si está disponible
        const command = isWindows
          ? `set PGPASSWORD=${dbPassword}&& "${psqlCommand}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filepath}"`
          : `PGPASSWORD="${dbPassword}" "${psqlCommand}" -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filepath}"`;

        console.log('🔄 Ejecutando restauración con psql...');
        const { stdout, stderr } = await execAsync(command);

        console.log('✅ Backup restaurado exitosamente con psql');
        if (stdout) console.log('stdout:', stdout);
        if (stderr && !stderr.includes('NOTICE')) console.log('stderr:', stderr);
      } else {
        throw new Error('psql no encontrado, usando método alternativo');
      }

    } catch (psqlError) {
      console.log('⚠️  psql no disponible, usando método alternativo con pg...');
      
      // Método alternativo: ejecutar SQL directamente con pg
      const { Client } = require('pg');
      const client = new Client({
        host: dbHost,
        port: dbPort,
        database: dbName,
        user: dbUser,
        password: dbPassword
      });

      try {
        await client.connect();
        console.log('✅ Conectado a PostgreSQL');
        
        // Ejecutar el SQL en bloques para evitar timeouts
        const statements = sqlContent
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📊 Ejecutando ${statements.length} sentencias SQL...`);
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement && statement.length > 0) {
            try {
              await client.query(statement + ';');
              if ((i + 1) % 100 === 0) {
                console.log(`✓ Procesadas ${i + 1}/${statements.length} sentencias`);
              }
            } catch (stmtError) {
              // Ignorar errores de DROP TABLE si no existe
              if (!stmtError.message.includes('does not exist')) {
                console.error(`Error en sentencia ${i + 1}:`, stmtError.message);
              }
            }
          }
        }
        
        console.log('✅ Todas las sentencias ejecutadas');
        await client.end();
      } catch (clientError) {
        await client.end();
        throw clientError;
      }
    }

    // Eliminar archivo temporal
    try {
      await fs.unlink(filepath);
      console.log('🗑️  Archivo temporal eliminado');
    } catch (err) {
      console.error('Error eliminando archivo temporal:', err);
    }

    res.json({
      success: true,
      message: 'Backup restaurado exitosamente. Recarga la página para ver los cambios.',
      filename: uploadedFile.originalname
    });

  } catch (error) {
    console.error('❌ Error restaurando backup:', error);

    // Intentar eliminar el archivo temporal en caso de error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error eliminando archivo temporal:', err);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error al restaurar el backup',
      error: error.message
    });
  }
};

/**
 * Listar backups disponibles
 */
const listBackups = async (req, res) => {
  try {
    await ensureBackupDir();

    // Leer archivos del directorio de backups
    const files = await fs.readdir(BACKUP_DIR);

    // Filtrar solo archivos .sql
    const sqlFiles = files.filter(file => file.endsWith('.sql'));

    // Obtener información de cada archivo
    const backups = await Promise.all(
      sqlFiles.map(async (filename) => {
        const filepath = path.join(BACKUP_DIR, filename);
        const stats = await fs.stat(filepath);
        return {
          filename,
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
    );

    // Ordenar por fecha de creación (más reciente primero)
    backups.sort((a, b) => b.createdAt - a.createdAt);

    res.json({
      success: true,
      backups,
      total: backups.length
    });

  } catch (error) {
    console.error('❌ Error listando backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar backups',
      error: error.message
    });
  }
};

/**
 * Eliminar un backup específico
 */
const deleteBackup = async (req, res) => {
  try {
    const { filename } = req.params;

    // Validar que el filename no contenga caracteres peligrosos
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo inválido'
      });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    // Verificar que el archivo existe
    await fs.access(filepath);

    // Eliminar el archivo
    await fs.unlink(filepath);

    console.log(`🗑️  Backup eliminado: ${filename}`);

    res.json({
      success: true,
      message: 'Backup eliminado exitosamente',
      filename
    });

  } catch (error) {
    console.error('❌ Error eliminando backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el backup',
      error: error.message
    });
  }
};

/**
 * Descargar un backup específico del servidor
 */
const downloadBackup = async (req, res) => {
  try {
    const { filename } = req.params;

    // Validar que el filename no contenga caracteres peligrosos
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo inválido'
      });
    }

    const filepath = path.join(BACKUP_DIR, filename);

    // Verificar que el archivo existe
    await fs.access(filepath);

    // Obtener información del archivo
    const stats = await fs.stat(filepath);

    console.log(`📥 Descargando backup: ${filename} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', stats.size);

    // Enviar el archivo
    const fileBuffer = await fs.readFile(filepath);
    res.send(fileBuffer);

    console.log(`✅ Backup descargado: ${filename}`);

  } catch (error) {
    console.error('❌ Error descargando backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar el backup',
      error: error.message
    });
  }
};

/**
 * Limpiar todas las tablas de la base de datos
 */
const cleanDatabase = async (req, res) => {
  try {
    console.log('🗑️  Iniciando limpieza de la base de datos...');

    const { sequelize } = require('../config/database');
    
    // Lista de tablas en orden (respetando dependencias)
    const tablasEnOrden = [
      { nombre: 'ValidationLogs', displayName: 'Logs de Validación' },
      { nombre: 'tickets', displayName: 'Tickets' },
      { nombre: 'participantes', displayName: 'Participantes' },
      { nombre: 'trabajadores', displayName: 'Trabajadores' },
      { nombre: 'events', displayName: 'Eventos' },
      { nombre: 'empresas', displayName: 'Empresas' },
      { nombre: 'staff', displayName: 'Staff' }
    ];

    const resultado = {
      tablasLimpiadas: [],
      registrosEliminados: 0
    };

    for (const tabla of tablasEnOrden) {
      try {
        // Contar registros antes de eliminar
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${tabla.nombre}"`);
        const count = parseInt(countResult[0].count);
        
        if (count > 0) {
          // Truncar tabla y reiniciar secuencias
          await sequelize.query(`TRUNCATE TABLE "${tabla.nombre}" RESTART IDENTITY CASCADE`);
          console.log(`✅ ${tabla.displayName}: ${count} registros eliminados`);
          
          resultado.tablasLimpiadas.push({
            tabla: tabla.displayName,
            registros: count
          });
          resultado.registrosEliminados += count;
        } else {
          console.log(`ℹ️  ${tabla.displayName}: ya estaba vacía`);
        }
      } catch (error) {
        // Si la tabla no existe, continuar
        if (!error.message.includes('does not exist')) {
          console.error(`❌ Error en ${tabla.displayName}:`, error.message);
        }
      }
    }

    console.log('✅ Base de datos limpiada exitosamente');

    res.json({
      success: true,
      message: 'Base de datos limpiada exitosamente',
      tablasLimpiadas: resultado.tablasLimpiadas,
      totalRegistrosEliminados: resultado.registrosEliminados
    });

  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al limpiar la base de datos',
      error: error.message
    });
  }
};

module.exports = {
  exportBackup,
  importBackup,
  listBackups,
  deleteBackup,
  downloadBackup,
  cleanDatabase
};
