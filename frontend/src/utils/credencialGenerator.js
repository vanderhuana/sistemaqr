import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Genera una credencial en PDF con el diseño de FEIPOBOL
 * @param {Object} participante - Datos del participante
 * @param {Object} datosFormulario - Datos del formulario
 * @param {string} empresaNombre - Nombre de la empresa/stand
 * @param {string} tipoCredencial - 'PARTICIPANTE' o 'TRABAJADOR'
 */
export async function generarCredencialPDF(participante, datosFormulario, empresaNombre = '', tipoCredencial = 'PARTICIPANTE') {
  return new Promise((resolve, reject) => {
    try {
      // Crear contenedor temporal para la credencial
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      document.body.appendChild(container)

      // Obtener URL de la imagen de fondo y del logo
      const registroImg = new URL('../assets/registro.png', import.meta.url).href
      const logoImg = new URL('../assets/logo02.png', import.meta.url).href

      // Generar URL del QR con mayor tamaño para mejor lectura
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
        participante.token || participante.qrCode || participante.id
      )}`

      // Formatear fecha de validez
      const fechaInicio = new Date()
      const fechaFin = new Date()
      fechaFin.setDate(fechaFin.getDate() + 13) // Válido por 13 días

      const formatoFecha = (fecha) => {
        return fecha.toLocaleDateString('es-BO', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      }

      // Crear HTML de la credencial (sin la imagen de fondo, solo contenido)
      container.innerHTML = `
        <div id="credencial-pdf" style="
          width: 1080px;
          height: 1920px;
          position: relative;
          background: transparent;
          font-family: Arial, sans-serif;
        ">
          <!-- Cuadro superior SOLO con "PASE DE ACCESO: PARTICIPANTE" (SIN nombre grande) -->
          <div style="
            position: absolute;
            top: 340px;
            left: 85px;
            width: 910px;
            height: 240px;
            background-color: transparent;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
          ">
            <div style="
              font-size: 28px;
              font-weight: normal;
              color: #000;
              margin-bottom: 8px;
              text-align: center;
            ">PASE DE ACCESO:</div>
            
            <div style="
              font-size: 56px;
              font-weight: 900;
              color: #000;
              display: flex;
              align-items: center;
              gap: 15px;
              margin: 0;
            ">
              <span style="font-size: 58px;">👤</span>
              <span>${tipoCredencial}</span>
            </div>
          </div>

          <!-- Datos del participante (MÁS ARRIBA y TEXTO MÁS GRANDE) -->
          <div style="
            position: absolute;
            top: 680px;
            left: 220px;
            width: 640px;
            height: 400px;
            background-color: transparent;
            padding: 0;
            box-sizing: border-box;
          ">
            <div style="
              font-size: 34px;
              font-weight: bold;
              color: #000;
              margin-bottom: 14px;
              line-height: 1.3;
            ">NOMBRE: ${(participante.nombre || datosFormulario.nombre || '').toUpperCase()} ${(participante.apellido || datosFormulario.apellido || '').toUpperCase()}</div>
            
            ${(participante.ci || datosFormulario.ci) ? `
            <div style="
              font-size: 34px;
              font-weight: bold;
              color: #000;
              margin-bottom: 14px;
            ">CI: ${participante.ci || datosFormulario.ci}</div>
            ` : ''}
            
            ${tipoCredencial === 'TRABAJADOR' && (participante.areaTrabajo || datosFormulario.areaTrabajo) ? `
            <div style="
              font-size: 34px;
              font-weight: bold;
              color: #000;
              margin-bottom: 14px;
            ">AREA: ${(participante.areaTrabajo || datosFormulario.areaTrabajo || '').toUpperCase()}</div>
            ` : ''}
            
            ${tipoCredencial === 'PARTICIPANTE' && empresaNombre ? `
            <div style="
              font-size: 32px;
              font-weight: bold;
              color: #000;
              margin-bottom: 14px;
              line-height: 1.3;
            ">EMPRESA/STAND: ${empresaNombre.toUpperCase()}</div>
            ` : ''}
            
            <div style="
              font-size: 30px;
              font-weight: bold;
              color: #000;
              margin-top: 20px;
              line-height: 1.4;
            ">Valido del ${formatoFecha(fechaInicio)}<br>al ${formatoFecha(fechaFin)}</div>
          </div>

          <!-- QR Code (MÁS GRANDE - CENTRADO y MÁS ARRIBA) -->
          <div style="
            position: absolute;
            top: 1145px;
            left: 52%;
            transform: translateX(-50%);
            width: 480px;
            height: 480px;
            background: white;
            border: 10px solid #000;
            border-radius: 20px;
            padding: 15px;
            box-sizing: border-box;
          ">
            <img src="${qrUrl}" style="width: 100%; height: 100%; border-radius: 12px; display: block;" />
          </div>

          <!-- Nota inferior -->
          <div style="
            position: absolute;
            bottom: 95px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 24px;
            color: #000;
            font-weight: bold;
            letter-spacing: 0.8px;
          ">•   EL CODIGO QR DEL CREDENCIAL ES UNICO Y PERSONAL NO LO COMPARTAS SOLO VALIDO PARA UN INGRESO POR DÍA •</div>
        </div>
      `

      // Cargar la imagen de fondo primero
      const fondoImg = new Image()
      fondoImg.crossOrigin = 'anonymous'
      fondoImg.onload = () => {
        // Crear canvas para combinar fondo + contenido
        const canvas = document.createElement('canvas')
        canvas.width = 1080
        canvas.height = 1920
        const ctx = canvas.getContext('2d')
        
        // Dibujar imagen de fondo
        ctx.drawImage(fondoImg, 0, 0, 1080, 1920)
        
        // Esperar a que cargue el QR
        const qrImg = container.querySelector('img')
        qrImg.crossOrigin = 'anonymous'
        
        const finalizarPDF = () => {
          setTimeout(() => {
            html2canvas(container.querySelector('#credencial-pdf'), {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: null
            }).then(contentCanvas => {
              // Combinar fondo + contenido
              ctx.drawImage(contentCanvas, 0, 0, 1080, 1920)
              
              // Crear PDF en orientación vertical (portrait)
              const pdf = new jsPDF('portrait', 'mm', [108, 192])
              
              const imgData = canvas.toDataURL('image/png', 1.0)
              pdf.addImage(imgData, 'PNG', 0, 0, 108, 192)

              // Descargar PDF
              const nombreArchivo = `Credencial-${tipoCredencial}-${datosFormulario.nombre}-${datosFormulario.apellido}.pdf`
              pdf.save(nombreArchivo)

              // Limpiar
              document.body.removeChild(container)
              resolve()
            }).catch(error => {
              document.body.removeChild(container)
              reject(error)
            })
          }, 800)
        }
        
        if (qrImg.complete) {
          finalizarPDF()
        } else {
          qrImg.onload = finalizarPDF
          qrImg.onerror = finalizarPDF
        }
      }
      
      fondoImg.onerror = () => {
        console.error('Error cargando imagen de fondo')
        reject(new Error('No se pudo cargar la imagen de fondo'))
      }
      
      fondoImg.src = registroImg

    } catch (error) {
      console.error('Error generando credencial:', error)
      reject(error)
    }
  })
}
