import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

/**
 * Genera una credencial en formato JPEG con el diseño de FEIPOBOL
 * @param {Object} participante - Datos del participante
 * @param {Object} datosFormulario - Datos del formulario
 * @param {string} empresaNombre - Nombre de la empresa/stand
 * @param {string} tipoCredencial - 'PARTICIPANTE' o 'TRABAJADOR'
 */
export async function generarCredencialPDF(participante, datosFormulario, empresaNombre = '', tipoCredencial = 'PARTICIPANTE') {
  return new Promise(async (resolve, reject) => {
    try {
      // Generar QR localmente usando la librería qrcode
      // IMPORTANTE: Usar el mismo qrCode que generó el backend
      const qrData = participante.qrCode || participante.id || `FALLBACK-${datosFormulario.ci}-${Date.now()}`
      
      console.log('Generando QR con datos:', qrData) // Para debug
      
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 600,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      })

      // Crear contenedor temporal para la credencial
      const container = document.createElement('div')
      container.style.position = 'fixed'
      container.style.left = '-9999px'
      container.style.top = '0'
      document.body.appendChild(container)

      // Obtener URL de la imagen de fondo y del logo
      const registroImg = new URL('../assets/registro.png', import.meta.url).href
      const logoImg = new URL('../assets/logo02.png', import.meta.url).href

      // Fechas específicas de FEIPOBOL 2025
      const fechaInicio = new Date(2025, 0, 13) // 13 de enero 2025
      const fechaFin = new Date(2025, 0, 25)     // 25 de enero 2025

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
            <img src="${qrDataUrl}" style="width: 100%; height: 100%; border-radius: 12px; display: block;" />
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
        
        // El QR ya está como Data URL, no necesita carga adicional
        // Esperar un momento para que el DOM se actualice
        setTimeout(() => {
          html2canvas(container.querySelector('#credencial-pdf'), {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
          }).then(contentCanvas => {
            // Combinar fondo + contenido
            ctx.drawImage(contentCanvas, 0, 0, 1080, 1920)
            
            // Convertir canvas a imagen JPEG con alta calidad
            const imgData = canvas.toDataURL('image/jpeg', 0.95)
            
            // Crear enlace de descarga para JPEG
            const link = document.createElement('a')
            const nombreArchivo = `Credencial-${tipoCredencial}-${datosFormulario.nombre}-${datosFormulario.apellido}.jpg`
            link.download = nombreArchivo
            link.href = imgData
            link.click()

            // Limpiar
            document.body.removeChild(container)
            resolve()
          }).catch(error => {
            document.body.removeChild(container)
            reject(error)
          })
        }, 500)
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
