<template>
  <div class="generador-qr">
    <header class="header-generador">
      <h2>🎫 Generador de Entradas QR</h2>
      <p class="descripcion">Genera códigos QR para pegar en entradas físicas</p>
    </header>

    <!-- Alerta de resultado -->
    <div v-if="alerta.mensaje" :class="['alerta', alerta.tipo]">
      {{ alerta.mensaje }}
    </div>

    <!-- Formulario de generación -->
    <div class="form-generacion">
      <div class="form-group">
        <label for="cantidad">Cantidad de entradas a generar:</label>
        <input 
          type="number" 
          id="cantidad"
          v-model.number="cantidad"
          :disabled="generando"
          min="1"
          max="5000"
          class="input-cantidad"
          placeholder="Ej: 50"
        />
        <small>Mínimo: 1 | Máximo: 5000</small>
      </div>

      <div class="form-group">
        <label for="tipo">Tipo de entrada:</label>
        <select 
          id="tipo"
          v-model="tipo"
          :disabled="generando"
          class="input-tipo"
        >
          <option value="entrada_general">Entrada General</option>
          <option value="entrada_vip">Entrada VIP</option>
          <option value="entrada_estudiante">Entrada Estudiante</option>
          <option value="entrada_nino">Entrada Niño</option>
        </select>
      </div>

      <button 
        @click="generarEntradas" 
        :disabled="generando || cantidad < 1 || cantidad > 5000"
        class="btn-generar"
      >
        <span v-if="!generando">🎫 Generar Entradas</span>
        <span v-else>⏳ Generando...</span>
      </button>
    </div>

    <!-- Loading con progreso -->
    <div v-if="generando" class="loading">
      <div class="spinner"></div>
      <p>{{ progresoMensaje }}</p>
      <div v-if="progresoActual > 0" class="barra-progreso">
        <div class="barra-progreso-fill" :style="{ width: progresoActual + '%' }"></div>
      </div>
    </div>

    <!-- Sección de Validaciones -->
    <div v-if="!generando" class="seccion-validaciones">
      <div class="header-validaciones">
        <h3>📊 Validaciones de Códigos QR</h3>
        <div class="controles-validaciones">
          <select v-model="filtroValidacion" class="filtro-validacion">
            <option value="todas">📋 Todas las validaciones</option>
            <option value="exitosas">✅ Validaciones exitosas</option>
            <option value="fallidas">❌ Validaciones fallidas</option>
            <option value="ya_usado">🔁 QR ya utilizado</option>
            <option value="invalido">⚠️ QR inválido</option>
          </select>
          <button @click="cargarValidaciones" class="btn-recargar" :disabled="cargandoValidaciones">
            <span v-if="!cargandoValidaciones">🔄 Actualizar</span>
            <span v-else>⏳ Cargando...</span>
          </button>
          <button @click="exportarValidacionesExcel" class="btn-excel" :disabled="validaciones.length === 0">
            📊 Exportar a Excel
          </button>
        </div>
      </div>

      <div v-if="cargandoValidaciones" class="loading-validaciones">
        <div class="spinner-small"></div>
        <p>Cargando validaciones...</p>
      </div>

      <div v-else-if="validacionesFiltradas.length > 0" class="tabla-validaciones">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Ticket #</th>
              <th>Estado</th>
              <th>Resultado</th>
              <th>Validado Por</th>
              <th>Ubicación</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="val in validacionesFiltradas.slice(0, 50)" :key="val.id">
              <td>{{ formatearFecha(val.validatedAt) }}</td>
              <td>{{ val.Ticket?.numero || 'N/A' }}</td>
              <td>
                <span :class="['badge-estado', val.isValid ? 'exitoso' : 'fallido']">
                  {{ val.isValid ? '✅ Válido' : '❌ Inválido' }}
                </span>
              </td>
              <td>
                <span :class="['badge-resultado', getClaseResultado(val.validationResult)]">
                  {{ getTextoResultado(val.validationResult) }}
                </span>
              </td>
              <td>{{ val.Validator?.nombre || 'Sistema' }}</td>
              <td>{{ val.location || '-' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-if="validacionesFiltradas.length > 50" class="mas-validaciones">
          Mostrando 50 de {{ validacionesFiltradas.length }} validaciones. <strong>Exporta a Excel para ver todas.</strong>
        </p>
      </div>

      <div v-else class="sin-validaciones">
        <p>📭 No hay validaciones registradas aún</p>
        <small>Los escaneos de QR aparecerán aquí automáticamente</small>
      </div>
    </div>

    <!-- Resultado: Entradas generadas -->
    <div v-if="entradas && entradas.length > 0 && !generando" class="resultado">
      <div class="header-resultado">
        <h3>✅ {{ entradas.length }} Entradas Generadas</h3>
        <button @click="descargarPDF" class="btn-descargar">
          📄 Descargar PDF con QRs
        </button>
      </div>

      <!-- Advertencia para lotes grandes -->
      <div v-if="entradas.length > 2000" class="alerta warning">
        ⚠️ ADVERTENCIA: Generar PDF con {{ entradas.length }} QRs puede tomar varios minutos y consumir mucha memoria. 
        Se recomienda cerrar otras pestañas del navegador.
      </div>

      <!-- Preview de QRs -->
      <div class="preview-qrs">
        <p class="info-preview">Vista previa de las primeras 12 entradas:</p>
        <div class="grid-qrs">
          <div 
            v-for="entrada in entradas.slice(0, 12)" 
            :key="entrada.id"
            class="qr-card"
          >
            <canvas :id="'qr-' + entrada.id"></canvas>
            <p class="numero-entrada">{{ entrada.numero }}</p>
          </div>
        </div>
        <p v-if="entradas.length > 12" class="mas-entradas">
          +{{ entradas.length - 12 }} entradas más en el PDF
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted } from 'vue';
import api from '../services/api';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const cantidad = ref(50);
const tipo = ref('entrada_general');
const generando = ref(false);
const entradas = ref([]);
const alerta = ref({ mensaje: '', tipo: '' });
const progresoMensaje = ref('');
const progresoActual = ref(0);

// Estado para validaciones
const validaciones = ref([]);
const cargandoValidaciones = ref(false);
const filtroValidacion = ref('todas');

const mostrarAlerta = (mensaje, tipo) => {
  alerta.value = { mensaje, tipo };
  setTimeout(() => {
    alerta.value = { mensaje: '', tipo: '' };
  }, 5000);
};

const generarEntradas = async () => {
  if (cantidad.value < 1 || cantidad.value > 5000) {
    mostrarAlerta('La cantidad debe estar entre 1 y 5000', 'error');
    return;
  }

  generando.value = true;
  entradas.value = [];
  progresoActual.value = 0;
  progresoMensaje.value = `Generando ${cantidad.value} entradas en el servidor...`;

  try {
    console.log('🎫 Generando entradas...', { cantidad: cantidad.value, tipo: tipo.value });
    
    progresoActual.value = 10;
    const response = await api.post('/api/tickets/generar-lote', {
      cantidad: cantidad.value,
      tipo: tipo.value
    });

    progresoActual.value = 50;
    progresoMensaje.value = 'Entradas generadas, creando códigos QR...';

    console.log('📦 Respuesta del servidor:', response);
    console.log('📊 Datos recibidos:', response.data);

    // Validar respuesta del backend
    if (response.data && response.data.entradas && Array.isArray(response.data.entradas)) {
      entradas.value = response.data.entradas;
      console.log('✅ Entradas asignadas:', entradas.value.length);
      
      progresoActual.value = 60;
      progresoMensaje.value = 'Generando vista previa de QRs...';

      // Generar QRs en canvas (solo preview)
      await nextTick();
      await generarQRsCanvas();
      
      progresoActual.value = 100;
      mostrarAlerta(`✅ ${entradas.value.length} entradas generadas exitosamente`, 'success');
    } else {
      console.error('❌ Respuesta del backend sin entradas:', response.data);
      console.error('❌ Estructura recibida:', JSON.stringify(response.data, null, 2));
      mostrarAlerta('Error: El servidor no devolvió entradas válidas', 'error');
    }

  } catch (error) {
    console.error('❌ Error generando entradas:', error);
    console.error('❌ Detalles del error:', error.response?.data);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Headers:', error.response?.headers);
    mostrarAlerta(
      error.response?.data?.message || error.message || 'Error al generar entradas',
      'error'
    );
  } finally {
    generando.value = false;
    progresoActual.value = 0;
    progresoMensaje.value = '';
  }
};

const generarQRsCanvas = async () => {
  // Validar que entradas existe y tiene elementos
  if (!entradas.value || !Array.isArray(entradas.value) || entradas.value.length === 0) {
    console.warn('No hay entradas para generar QRs en canvas');
    return;
  }

  // Solo generar preview de las primeras 12
  const entradasPreview = entradas.value.slice(0, 12);
  
  for (const entrada of entradasPreview) {
    try {
      const canvas = document.getElementById('qr-' + entrada.id);
      if (canvas) {
        await QRCode.toCanvas(canvas, entrada.token, {
          width: 120, // Reducido para vista previa más compacta
          margin: 1, // Margen reducido a 1 módulo
          errorCorrectionLevel: 'M', // Nivel medio de corrección (15%)
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }
    } catch (error) {
      console.error('Error generando QR en canvas:', error);
    }
  }
};

const descargarPDF = async () => {
  // Validar que hay entradas para generar el PDF
  if (!entradas.value || !Array.isArray(entradas.value) || entradas.value.length === 0) {
    mostrarAlerta('No hay entradas para generar el PDF', 'error');
    return;
  }

  try {
    generando.value = true;
    progresoActual.value = 0;
    progresoMensaje.value = 'Preparando PDF...';

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210; // A4 width en mm
    const pageHeight = 297; // A4 height en mm
    const margin = 10;
    
    // Dimensiones del contorno/celda (líneas segmentadas)
    const cellWidth = 35; // 3.5 cm de ancho
    const cellHeight = 35; // 3.5 cm de alto
    
    // Tamaño del QR (más grande, pero dentro del contorno)
    const qrSize = 32; // QR de 3.2cm (deja margen dentro del contorno de 3.5x3.5cm)
    
    // Calcular cuántos QRs caben por página
    const cols = Math.floor((pageWidth - 2 * margin) / cellWidth); // ~5 columnas
    const rows = Math.floor((pageHeight - 2 * margin) / cellHeight); // ~7 filas
    const qrsPerPage = cols * rows;

    let pageNum = 0;
    
    // Procesar en lotes pequeños para no sobrecargar memoria
    const batchSize = 10; // Procesar 10 QRs a la vez
    
    for (let i = 0; i < entradas.value.length; i++) {
      const entrada = entradas.value[i];
      const posInPage = i % qrsPerPage;
      
      // Actualizar progreso
      if (i % batchSize === 0) {
        const progreso = Math.floor((i / entradas.value.length) * 90) + 10;
        progresoActual.value = progreso;
        progresoMensaje.value = `Generando PDF... ${i + 1}/${entradas.value.length} QRs (Página ${Math.floor(i / qrsPerPage) + 1})`;
        
        // Pequeña pausa cada lote para liberar memoria y actualizar UI
        await new Promise(resolve => setTimeout(resolve, 0));
        await nextTick();
      }
      
      // Nueva página si es necesario
      if (posInPage === 0 && i > 0) {
        pdf.addPage();
        pageNum++;
      }

      const row = Math.floor(posInPage / cols);
      const col = posInPage % cols;
      
      const x = margin + col * cellWidth;
      const y = margin + row * cellHeight;

      try {
        // Generar QR con configuración optimizada
        const qrDataUrl = await QRCode.toDataURL(entrada.token, {
          width: 300, // Alta resolución para calidad de impresión
          margin: 1,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Centrar QR dentro del contorno de 3.5 x 3.5 cm
        const qrX = x + (cellWidth - qrSize) / 2;
        const qrY = y + (cellHeight - qrSize) / 2 + 2; // QR más abajo para espacio del número arriba
        
        pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // Agregar número de entrada ARRIBA del QR
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(entrada.numero, x + cellWidth / 2, y + 3, {
          align: 'center'
        });

        // Líneas de corte (punteadas) - contorno de 3.1 x 3.2 cm
        pdf.setLineDash([1, 1.5]); // Patrón de línea segmentada
        pdf.setDrawColor(180, 180, 180); // Color gris claro
        pdf.setLineWidth(0.1); // Línea delgada
        
        // Rectángulo completo del contorno
        pdf.rect(x, y, cellWidth, cellHeight);
        
      } catch (qrError) {
        console.error(`Error generando QR ${i}:`, qrError);
        // Continuar con el siguiente en caso de error
      }
    }

    progresoActual.value = 95;
    progresoMensaje.value = 'Guardando PDF...';
    
    // Pequeña pausa antes de guardar
    await new Promise(resolve => setTimeout(resolve, 100));

    // Guardar PDF
    const fecha = new Date().toISOString().split('T')[0];
    pdf.save(`entradas-qr-${fecha}-${entradas.value.length}.pdf`);
    
    progresoActual.value = 100;
    
    mostrarAlerta('✅ PDF descargado exitosamente', 'success');

  } catch (error) {
    console.error('Error generando PDF:', error);
    mostrarAlerta('Error al generar el PDF', 'error');
  } finally {
    generando.value = false;
    progresoActual.value = 0;
    progresoMensaje.value = '';
  }
};

// === FUNCIONES PARA VALIDACIONES ===

const validacionesFiltradas = computed(() => {
  if (filtroValidacion.value === 'todas') {
    return validaciones.value;
  } else if (filtroValidacion.value === 'exitosas') {
    return validaciones.value.filter(v => v.isValid);
  } else if (filtroValidacion.value === 'fallidas') {
    return validaciones.value.filter(v => !v.isValid);
  } else if (filtroValidacion.value === 'ya_usado') {
    return validaciones.value.filter(v => v.validationResult === 'already_used');
  } else if (filtroValidacion.value === 'invalido') {
    return validaciones.value.filter(v => v.validationResult === 'invalid_qr');
  }
  return validaciones.value;
});

const cargarValidaciones = async () => {
  try {
    cargandoValidaciones.value = true;
    const response = await api.get('/api/events/validations');
    
    if (response.data && response.data.validations) {
      validaciones.value = response.data.validations;
    }
  } catch (error) {
    console.error('Error cargando validaciones:', error);
    mostrarAlerta('Error al cargar validaciones', 'error');
  } finally {
    cargandoValidaciones.value = false;
  }
};

const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  const date = new Date(fecha);
  return date.toLocaleString('es-BO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getClaseResultado = (resultado) => {
  const clases = {
    'success': 'exito',
    'already_used': 'ya-usado',
    'expired': 'expirado',
    'invalid_event': 'evento-invalido',
    'invalid_qr': 'qr-invalido',
    'event_not_started': 'no-iniciado',
    'event_finished': 'finalizado',
    'ticket_refunded': 'reembolsado',
    'access_denied': 'denegado'
  };
  return clases[resultado] || 'otro';
};

const getTextoResultado = (resultado) => {
  const textos = {
    'success': '✓ Exitoso',
    'already_used': '🔁 Ya usado',
    'expired': '⏰ Expirado',
    'invalid_event': '❌ Evento inválido',
    'invalid_qr': '⚠️ QR inválido',
    'event_not_started': '📅 No iniciado',
    'event_finished': '🏁 Finalizado',
    'ticket_refunded': '💰 Reembolsado',
    'access_denied': '🚫 Denegado'
  };
  return textos[resultado] || resultado;
};

const exportarValidacionesExcel = () => {
  if (validacionesFiltradas.value.length === 0) {
    mostrarAlerta('No hay validaciones para exportar', 'error');
    return;
  }

  try {
    // Preparar datos para Excel
    const datosExcel = validacionesFiltradas.value.map(val => ({
      'Fecha y Hora': formatearFecha(val.validatedAt),
      'Ticket #': val.Ticket?.numero || 'N/A',
      'Estado': val.isValid ? 'Válido' : 'Inválido',
      'Resultado': getTextoResultado(val.validationResult),
      'Tipo': val.validationType || '-',
      'Validado Por': val.Validator?.nombre || 'Sistema',
      'Usuario': val.Validator?.username || '-',
      'Ubicación': val.location || '-',
      'IP': val.ipAddress || '-',
      'Intento #': val.attemptNumber || 1,
      'Duración (ms)': val.validationDuration || '-',
      'Error': val.errorDetails || '-'
    }));

    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datosExcel);

    // Ajustar anchos de columna
    const colWidths = [
      { wch: 18 }, // Fecha y Hora
      { wch: 15 }, // Ticket #
      { wch: 10 }, // Estado
      { wch: 15 }, // Resultado
      { wch: 12 }, // Tipo
      { wch: 20 }, // Validado Por
      { wch: 15 }, // Usuario
      { wch: 20 }, // Ubicación
      { wch: 15 }, // IP
      { wch: 10 }, // Intento #
      { wch: 15 }, // Duración
      { wch: 30 }  // Error
    ];
    ws['!cols'] = colWidths;

    // Agregar hoja al libro
    XLSX.utils.book_append_sheet(wb, ws, 'Validaciones QR');

    // Generar nombre de archivo
    const fecha = new Date().toISOString().split('T')[0];
    const filtro = filtroValidacion.value;
    const nombreArchivo = `validaciones-qr-${filtro}-${fecha}.xlsx`;

    // Descargar archivo
    XLSX.writeFile(wb, nombreArchivo);

    mostrarAlerta(`✅ Excel exportado: ${validacionesFiltradas.value.length} validaciones`, 'success');
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    mostrarAlerta('Error al exportar a Excel', 'error');
  }
};

// Cargar validaciones al montar el componente
onMounted(() => {
  cargarValidaciones();
});
</script>

<style scoped>
.generador-qr {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-generador {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #6B9080 0%, #5A7D6F 100%);
  color: white;
  border-radius: 12px;
}

.header-generador h2 {
  margin: 0 0 10px 0;
  font-size: 2rem;
}

.descripcion {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
}

.alerta {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alerta.success {
  background: #D4EDDA;
  color: #155724;
  border: 2px solid #28a745;
}

.alerta.error {
  background: #F8D7DA;
  color: #721C24;
  border: 2px solid #dc3545;
}

.alerta.warning {
  background: #FFF3CD;
  color: #856404;
  border: 2px solid #ffc107;
  margin: 15px 0;
}

.form-generacion {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 1rem;
}

.input-cantidad,
.input-tipo {
  width: 100%;
  padding: 12px;
  border: 2px solid #DDD;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.input-cantidad:focus,
.input-tipo:focus {
  outline: none;
  border-color: #6B9080;
  box-shadow: 0 0 0 3px rgba(107, 144, 128, 0.1);
}

.input-cantidad:disabled,
.input-tipo:disabled {
  background: #F5F5F5;
  cursor: not-allowed;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 0.85rem;
}

.btn-generar {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #6B9080 0%, #5A7D6F 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.btn-generar:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.btn-generar:disabled {
  background: #CCC;
  cursor: not-allowed;
  transform: none;
}

.loading {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #6B9080;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.barra-progreso {
  width: 100%;
  max-width: 400px;
  height: 20px;
  background: #e0e0e0;
  border-radius: 10px;
  overflow: hidden;
  margin: 15px auto 0;
}

.barra-progreso-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
  border-radius: 10px;
}

.resultado {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-resultado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 2px solid #EEE;
}

.header-resultado h3 {
  margin: 0;
  color: #28a745;
  font-size: 1.5rem;
}

.btn-descargar {
  padding: 12px 24px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-descargar:hover {
  background: #c82333;
  transform: scale(1.05);
}

.preview-qrs {
  margin-top: 20px;
}

.info-preview {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
  font-size: 0.95rem;
}

.grid-qrs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.qr-card {
  background: #F9F9F9;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  border: 2px dashed #DDD;
  transition: all 0.3s ease;
}

.qr-card:hover {
  border-color: #6B9080;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.qr-card canvas {
  width: 100%;
  height: auto;
  margin-bottom: 10px;
}

.numero-entrada {
  margin: 0;
  font-weight: 700;
  color: #333;
  font-size: 0.9rem;
}

.mas-entradas {
  text-align: center;
  color: #666;
  font-weight: 600;
  padding: 15px;
  background: #F0F0F0;
  border-radius: 8px;
  margin-top: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .generador-qr {
    padding: 15px;
  }

  .header-generador h2 {
    font-size: 1.5rem;
  }

  .form-generacion {
    padding: 20px;
  }

  .header-resultado {
    flex-direction: column;
    gap: 15px;
  }

  .btn-descargar {
    width: 100%;
  }

  .grid-qrs {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 15px;
  }
}

@media (max-width: 480px) {
  .grid-qrs {
    grid-template-columns: repeat(2, 1fr);
  }

  .controles-validaciones {
    flex-direction: column;
  }

  .filtro-validacion,
  .btn-recargar,
  .btn-excel {
    width: 100%;
  }
}

/* === ESTILOS PARA SECCIÓN DE VALIDACIONES === */
.seccion-validaciones {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.header-validaciones {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #EEE;
  flex-wrap: wrap;
  gap: 15px;
}

.header-validaciones h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.controles-validaciones {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filtro-validacion {
  padding: 10px 15px;
  border: 2px solid #DDD;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.filtro-validacion:focus {
  outline: none;
  border-color: #6B9080;
}

.btn-recargar {
  padding: 10px 20px;
  background: linear-gradient(135deg, #17A2B8, #138496);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-recargar:hover:not(:disabled) {
  background: linear-gradient(135deg, #138496, #117A8B);
  transform: translateY(-2px);
}

.btn-recargar:disabled {
  background: #CCC;
  cursor: not-allowed;
}

.btn-excel {
  padding: 10px 20px;
  background: linear-gradient(135deg, #28A745, #218838);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.btn-excel:hover:not(:disabled) {
  background: linear-gradient(135deg, #218838, #1E7E34);
  transform: translateY(-2px);
}

.btn-excel:disabled {
  background: #CCC;
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-validaciones {
  text-align: center;
  padding: 40px;
}

.spinner-small {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #6B9080;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.tabla-validaciones {
  overflow-x: auto;
}

.tabla-validaciones table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabla-validaciones thead {
  background: #F8F9FA;
}

.tabla-validaciones th {
  padding: 12px;
  text-align: left;
  font-weight: 700;
  color: #333;
  border-bottom: 2px solid #DDD;
}

.tabla-validaciones td {
  padding: 12px;
  border-bottom: 1px solid #EEE;
  vertical-align: middle;
}

.tabla-validaciones tr:hover {
  background: #F8F9FA;
}

.badge-estado {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.badge-estado.exitoso {
  background: #D4EDDA;
  color: #155724;
}

.badge-estado.fallido {
  background: #F8D7DA;
  color: #721C24;
}

.badge-resultado {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-resultado.exito {
  background: #D1F2EB;
  color: #0C5460;
}

.badge-resultado.ya-usado {
  background: #FFF3CD;
  color: #856404;
}

.badge-resultado.expirado,
.badge-resultado.finalizado {
  background: #E2E3E5;
  color: #383D41;
}

.badge-resultado.evento-invalido,
.badge-resultado.qr-invalido,
.badge-resultado.denegado {
  background: #F8D7DA;
  color: #721C24;
}

.badge-resultado.no-iniciado {
  background: #D1ECF1;
  color: #0C5460;
}

.badge-resultado.reembolsado {
  background: #D6D8DB;
  color: #1B1E21;
}

.sin-validaciones {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.sin-validaciones p {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.sin-validaciones small {
  font-size: 0.9rem;
  color: #999;
}

.mas-validaciones {
  text-align: center;
  margin-top: 15px;
  padding: 15px;
  background: #F0F0F0;
  border-radius: 8px;
  color: #666;
}

.mas-validaciones strong {
  color: #28A745;
}
</style>
