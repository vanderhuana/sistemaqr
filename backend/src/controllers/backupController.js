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

    // Obtener credenciales de la base de datos
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'sisqr6';
    const dbUser = process.env.DB_USER || 'sisqr6_user';
    const dbPassword = process.env.DB_PASSWORD || 'postgres123';

    // Comando psql para restaurar
    // Para Windows, usamos SET en lugar de PGPASSWORD=
    const isWindows = process.platform === 'win32';
    const psqlCommand = isWindows
      ? `set PGPASSWORD=${dbPassword}&& psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filepath}"`
      : `PGPASSWORD="${dbPassword}" psql -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f "${filepath}"`;

    // Ejecutar psql
    const { stdout, stderr } = await execAsync(psqlCommand);

    console.log('✅ Backup restaurado exitosamente');
    if (stdout) console.log('stdout:', stdout);
    if (stderr) console.log('stderr:', stderr);

    // Eliminar archivo temporal
    try {
      await fs.unlink(filepath);
      console.log('🗑️  Archivo temporal eliminado');
    } catch (err) {
      console.error('Error eliminando archivo temporal:', err);
    }

    res.json({
      success: true,
      message: 'Backup restaurado exitosamente',
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

module.exports = {
  exportBackup,
  importBackup,
  listBackups,
  deleteBackup
};
