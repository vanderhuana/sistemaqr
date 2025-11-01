const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const {
  exportBackup,
  importBackup,
  listBackups,
  deleteBackup
} = require('../controllers/backupController');

// Debug: verificar que todas las funciones estén definidas
console.log('🔍 Verificando importaciones de backup:');
console.log('authenticateToken:', typeof authenticateToken);
console.log('requireAdmin:', typeof requireAdmin);
console.log('exportBackup:', typeof exportBackup);
console.log('importBackup:', typeof importBackup);
console.log('listBackups:', typeof listBackups);
console.log('deleteBackup:', typeof deleteBackup);

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../backups'));
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    cb(null, `uploaded_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // Límite de 100MB
  },
  fileFilter: function (req, file, cb) {
    // Solo aceptar archivos .sql
    if (path.extname(file.originalname).toLowerCase() === '.sql') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos .sql'));
    }
  }
});

/**
 * @route   POST /api/backup/export
 * @desc    Exportar backup de la base de datos
 * @access  Private (Admin only)
 */
router.post('/export', authenticateToken, requireAdmin, exportBackup);

/**
 * @route   POST /api/backup/import
 * @desc    Importar backup a la base de datos
 * @access  Private (Admin only)
 */
router.post('/import', authenticateToken, requireAdmin, upload.single('backup'), importBackup);

/**
 * @route   GET /api/backup/list
 * @desc    Listar backups disponibles
 * @access  Private (Admin only)
 */
router.get('/list', authenticateToken, requireAdmin, listBackups);

/**
 * @route   DELETE /api/backup/:filename
 * @desc    Eliminar un backup específico
 * @access  Private (Admin only)
 */
router.delete('/:filename', authenticateToken, requireAdmin, deleteBackup);

module.exports = router;
