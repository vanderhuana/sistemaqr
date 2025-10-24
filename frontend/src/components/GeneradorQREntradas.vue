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
          max="1000"
          class="input-cantidad"
          placeholder="Ej: 50"
        />
        <small>Mínimo: 1 | Máximo: 1000</small>
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
        :disabled="generando || cantidad < 1 || cantidad > 1000"
        class="btn-generar"
      >
        <span v-if="!generando">🎫 Generar Entradas</span>
        <span v-else>⏳ Generando...</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="generando" class="loading">
      <div class="spinner"></div>
      <p>Generando {{ cantidad }} entradas...</p>
    </div>

    <!-- Resultado: Entradas generadas -->
    <div v-if="entradas && entradas.length > 0 && !generando" class="resultado">
      <div class="header-resultado">
        <h3>✅ {{ entradas.length }} Entradas Generadas</h3>
        <button @click="descargarPDF" class="btn-descargar">
          📄 Descargar PDF con QRs
        </button>
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
import { ref, nextTick } from 'vue';
import api from '../services/api';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

const cantidad = ref(50);
const tipo = ref('entrada_general');
const generando = ref(false);
const entradas = ref([]);
const alerta = ref({ mensaje: '', tipo: '' });

const mostrarAlerta = (mensaje, tipo) => {
  alerta.value = { mensaje, tipo };
  setTimeout(() => {
    alerta.value = { mensaje: '', tipo: '' };
  }, 5000);
};

const generarEntradas = async () => {
  if (cantidad.value < 1 || cantidad.value > 1000) {
    mostrarAlerta('La cantidad debe estar entre 1 y 1000', 'error');
    return;
  }

  generando.value = true;
  entradas.value = [];

  try {
    console.log('🎫 Generando entradas...', { cantidad: cantidad.value, tipo: tipo.value });
    
    const response = await api.post('/api/tickets/generar-lote', {
      cantidad: cantidad.value,
      tipo: tipo.value
    });

    console.log('📦 Respuesta del servidor:', response);
    console.log('📊 Datos recibidos:', response.data);

    // Validar respuesta del backend
    if (response.data && response.data.entradas && Array.isArray(response.data.entradas)) {
      entradas.value = response.data.entradas;
      console.log('✅ Entradas asignadas:', entradas.value.length);
      mostrarAlerta(`✅ ${entradas.value.length} entradas generadas exitosamente`, 'success');

      // Generar QRs en canvas
      await nextTick();
      await generarQRsCanvas();
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
          width: 180, // Aumentado para mejor vista previa
          margin: 2, // Margen de 2 módulos
          errorCorrectionLevel: 'H', // Nivel alto de corrección
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
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210; // A4 width en mm
    const pageHeight = 297; // A4 height en mm
    const margin = 10;
    const qrSize = 40; // Tamaño del QR en mm (aumentado a 40mm para mejor lectura)
    const cols = 4; // QRs por fila (4 columnas para dar más espacio)
    const rows = 6; // QRs por página (6 filas)
    const qrsPerPage = cols * rows; // 24 QRs por página
    
    const cellWidth = (pageWidth - 2 * margin) / cols;
    const cellHeight = (pageHeight - 2 * margin) / rows;

    let pageNum = 0;
    
    for (let i = 0; i < entradas.value.length; i++) {
      const entrada = entradas.value[i];
      const posInPage = i % qrsPerPage;
      
      // Nueva página si es necesario
      if (posInPage === 0 && i > 0) {
        pdf.addPage();
        pageNum++;
      }

      const row = Math.floor(posInPage / cols);
      const col = posInPage % cols;
      
      const x = margin + col * cellWidth;
      const y = margin + row * cellHeight;

      // Generar QR como data URL con máxima calidad
      const qrDataUrl = await QRCode.toDataURL(entrada.token, {
        width: 512, // Alta resolución para mejor lectura (512px)
        margin: 2, // Margen de 2 módulos para mejor detección
        errorCorrectionLevel: 'H', // Nivel alto (30% corrección) para máxima robustez
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Agregar QR al PDF
      const qrX = x + (cellWidth - qrSize) / 2;
      const qrY = y + 2;
      pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Agregar número de entrada
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(entrada.numero, x + cellWidth / 2, y + qrSize + 6, {
        align: 'center'
      });

      // Líneas de corte (punteadas)
      pdf.setLineDash([1, 1]);
      pdf.setDrawColor(200, 200, 200);
      
      // Línea horizontal superior
      if (row === 0) {
        pdf.line(x, y, x + cellWidth, y);
      }
      // Línea horizontal inferior
      pdf.line(x, y + cellHeight, x + cellWidth, y + cellHeight);
      
      // Línea vertical izquierda
      if (col === 0) {
        pdf.line(x, y, x, y + cellHeight);
      }
      // Línea vertical derecha
      pdf.line(x + cellWidth, y, x + cellWidth, y + cellHeight);
    }

    // Guardar PDF
    const fecha = new Date().toISOString().split('T')[0];
    pdf.save(`entradas-qr-${fecha}-${entradas.value.length}.pdf`);
    
    mostrarAlerta('✅ PDF descargado exitosamente', 'success');

  } catch (error) {
    console.error('Error generando PDF:', error);
    mostrarAlerta('❌ Error al generar PDF', 'error');
  }
};
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
}
</style>
