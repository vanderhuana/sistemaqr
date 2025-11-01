<template>
  <div class="backup-manager">
    <div class="backup-header">
      <h2>
        <i class="fas fa-database"></i>
        Gestión de Backups
      </h2>
      <p class="description">
        Exporta e importa copias de seguridad de la base de datos
      </p>
    </div>

    <!-- Sección de Exportar -->
    <div class="backup-section">
      <div class="section-header">
        <h3><i class="fas fa-download"></i> Exportar Backup</h3>
      </div>
      <div class="section-content">
        <p>Descarga una copia completa de la base de datos en formato SQL.</p>
        <button 
          @click="exportBackup" 
          class="btn btn-primary"
          :disabled="exportando"
        >
          <i class="fas fa-download"></i>
          {{ exportando ? 'Generando backup...' : 'Descargar Backup' }}
        </button>
      </div>
    </div>

    <!-- Sección de Importar -->
    <div class="backup-section">
      <div class="section-header">
        <h3><i class="fas fa-upload"></i> Importar Backup</h3>
      </div>
      <div class="section-content">
        <div class="warning-box">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>¡ADVERTENCIA!</strong> 
          Importar un backup reemplazará todos los datos actuales de la base de datos. 
          Esta acción no se puede deshacer.
        </div>
        
        <div class="file-upload">
          <input 
            type="file" 
            ref="fileInput"
            @change="handleFileSelect"
            accept=".sql"
            :disabled="importando"
            id="backup-file"
          >
          <label for="backup-file" class="file-label">
            <i class="fas fa-file-upload"></i>
            {{ selectedFile ? selectedFile.name : 'Seleccionar archivo .sql' }}
          </label>
        </div>

        <button 
          @click="importBackup" 
          class="btn btn-danger"
          :disabled="!selectedFile || importando"
        >
          <i class="fas fa-upload"></i>
          {{ importando ? 'Restaurando...' : 'Restaurar Backup' }}
        </button>
      </div>
    </div>

    <!-- Sección de Backups Guardados -->
    <div class="backup-section">
      <div class="section-header">
        <h3><i class="fas fa-list"></i> Backups Guardados en Servidor</h3>
        <button @click="loadBackupList" class="btn btn-small" :disabled="cargandoLista">
          <i class="fas fa-sync-alt" :class="{ 'rotating': cargandoLista }"></i>
          Actualizar
        </button>
      </div>
      <div class="section-content">
        <div v-if="cargandoLista" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Cargando lista...
        </div>

        <div v-else-if="backupList.length === 0" class="empty-state">
          <i class="fas fa-folder-open"></i>
          <p>No hay backups guardados en el servidor</p>
        </div>

        <div v-else class="backup-list">
          <table>
            <thead>
              <tr>
                <th>Archivo</th>
                <th>Tamaño</th>
                <th>Fecha de Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="backup in backupList" :key="backup.filename">
                <td>
                  <i class="fas fa-file-archive"></i>
                  {{ backup.filename }}
                </td>
                <td>{{ backup.sizeMB }} MB</td>
                <td>{{ formatDate(backup.createdAt) }}</td>
                <td>
                  <button 
                    @click="deleteBackup(backup.filename)" 
                    class="btn btn-small btn-danger"
                    title="Eliminar backup"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Mensajes de éxito/error -->
    <div v-if="mensaje" class="mensaje" :class="mensaje.tipo">
      <i :class="mensaje.tipo === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
      {{ mensaje.texto }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { backupService } from '../services/api';

export default {
  name: 'BackupManager',
  
  setup() {
    const exportando = ref(false);
    const importando = ref(false);
    const cargandoLista = ref(false);
    const selectedFile = ref(null);
    const fileInput = ref(null);
    const backupList = ref([]);
    const mensaje = ref(null);

    // Exportar backup
    const exportBackup = async () => {
      try {
        exportando.value = true;
        mensaje.value = null;

        const response = await backupService.exportBackup();
        
        // Crear un blob con los datos
        const blob = new Blob([response.data], { type: 'application/sql' });
        
        // Generar nombre de archivo con timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `sisqr6_backup_${timestamp}.sql`;
        
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        mensaje.value = {
          tipo: 'success',
          texto: 'Backup descargado exitosamente'
        };

        setTimeout(() => mensaje.value = null, 5000);
        
      } catch (error) {
        console.error('Error exportando backup:', error);
        mensaje.value = {
          tipo: 'error',
          texto: 'Error al exportar el backup: ' + (error.response?.data?.message || error.message)
        };
      } finally {
        exportando.value = false;
      }
    };

    // Manejar selección de archivo
    const handleFileSelect = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (!file.name.endsWith('.sql')) {
          mensaje.value = {
            tipo: 'error',
            texto: 'Por favor selecciona un archivo .sql válido'
          };
          selectedFile.value = null;
          return;
        }
        selectedFile.value = file;
        mensaje.value = null;
      }
    };

    // Importar backup
    const importBackup = async () => {
      if (!selectedFile.value) {
        return;
      }

      // Confirmar acción
      const confirmacion = confirm(
        '⚠️ ADVERTENCIA: Esta acción reemplazará TODOS los datos actuales de la base de datos.\n\n' +
        '¿Estás seguro de que deseas continuar?\n\n' +
        'Escribe "CONFIRMAR" para proceder:'
      );

      if (confirmacion !== 'CONFIRMAR') {
        mensaje.value = {
          tipo: 'error',
          texto: 'Importación cancelada'
        };
        return;
      }

      try {
        importando.value = true;
        mensaje.value = null;

        await backupService.importBackup(selectedFile.value);

        mensaje.value = {
          tipo: 'success',
          texto: 'Backup restaurado exitosamente. Recarga la página para ver los cambios.'
        };

        // Limpiar selección
        selectedFile.value = null;
        if (fileInput.value) {
          fileInput.value.value = '';
        }

        // Recargar lista de backups
        setTimeout(() => loadBackupList(), 2000);
        
      } catch (error) {
        console.error('Error importando backup:', error);
        mensaje.value = {
          tipo: 'error',
          texto: 'Error al restaurar el backup: ' + (error.response?.data?.message || error.message)
        };
      } finally {
        importando.value = false;
      }
    };

    // Cargar lista de backups
    const loadBackupList = async () => {
      try {
        cargandoLista.value = true;
        const response = await backupService.listBackups();
        backupList.value = response.data.backups || [];
      } catch (error) {
        console.error('Error cargando lista de backups:', error);
        mensaje.value = {
          tipo: 'error',
          texto: 'Error al cargar la lista de backups'
        };
      } finally {
        cargandoLista.value = false;
      }
    };

    // Eliminar backup
    const deleteBackup = async (filename) => {
      if (!confirm(`¿Estás seguro de que deseas eliminar el backup "${filename}"?`)) {
        return;
      }

      try {
        await backupService.deleteBackup(filename);
        mensaje.value = {
          tipo: 'success',
          texto: 'Backup eliminado exitosamente'
        };
        
        // Recargar lista
        loadBackupList();
        
      } catch (error) {
        console.error('Error eliminando backup:', error);
        mensaje.value = {
          tipo: 'error',
          texto: 'Error al eliminar el backup'
        };
      }
    };

    // Formatear fecha
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Cargar lista al montar el componente
    onMounted(() => {
      loadBackupList();
    });

    return {
      exportando,
      importando,
      cargandoLista,
      selectedFile,
      fileInput,
      backupList,
      mensaje,
      exportBackup,
      handleFileSelect,
      importBackup,
      loadBackupList,
      deleteBackup,
      formatDate
    };
  }
};
</script>

<style scoped>
.backup-manager {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.backup-header {
  text-align: center;
  margin-bottom: 30px;
}

.backup-header h2 {
  font-size: 28px;
  color: #2c3e50;
  margin-bottom: 10px;
}

.backup-header h2 i {
  color: #3498db;
  margin-right: 10px;
}

.description {
  color: #7f8c8d;
  font-size: 16px;
}

.backup-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ecf0f1;
}

.section-header h3 {
  font-size: 20px;
  color: #34495e;
  margin: 0;
}

.section-header h3 i {
  margin-right: 8px;
  color: #3498db;
}

.section-content {
  padding: 10px 0;
}

.section-content p {
  color: #7f8c8d;
  margin-bottom: 15px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn i {
  margin-right: 8px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(231, 76, 60, 0.3);
}

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.warning-box {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404;
}

.warning-box i {
  margin-right: 10px;
  color: #ffc107;
}

.file-upload {
  margin-bottom: 15px;
}

.file-upload input[type="file"] {
  display: none;
}

.file-label {
  display: inline-block;
  padding: 12px 24px;
  background: #95a5a6;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-label:hover {
  background: #7f8c8d;
}

.file-label i {
  margin-right: 8px;
}

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: #95a5a6;
}

.loading i, .empty-state i {
  font-size: 48px;
  margin-bottom: 15px;
  display: block;
}

.backup-list table {
  width: 100%;
  border-collapse: collapse;
}

.backup-list th {
  background: #ecf0f1;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
}

.backup-list td {
  padding: 12px;
  border-bottom: 1px solid #ecf0f1;
}

.backup-list tr:hover {
  background: #f8f9fa;
}

.backup-list td i {
  margin-right: 8px;
  color: #3498db;
}

.mensaje {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
  z-index: 1000;
}

.mensaje.success {
  background: #2ecc71;
  color: white;
}

.mensaje.error {
  background: #e74c3c;
  color: white;
}

.mensaje i {
  margin-right: 10px;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
