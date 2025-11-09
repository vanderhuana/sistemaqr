# Assets - Sistema de Premios FEIPOBOL

Esta carpeta contiene:

## ⚠️ IMPORTANTE - ARCHIVO REQUERIDO
**NECESITAS AGREGAR:** `modal_premio.png` - Plantilla base para generar imágenes de premios

### Cómo agregar la plantilla:
1. Busca o crea una imagen PNG de 800x600 píxeles (o similar)
2. Puede ser un fondo decorativo, logo de FEIPOBOL, o diseño personalizado
3. Guárdala como `modal_premio.png` en esta carpeta
4. El sistema generará automáticamente text sobre esta imagen

### Ejemplo de comando para crear imagen de prueba:
```powershell
# Si tienes ImageMagick instalado:
magick -size 800x600 xc:lightblue -pointsize 48 -fill darkblue -gravity center -annotate +0+0 "FEIPOBOL\n2025" modal_premio.png
```

## Imágenes Generadas
- `generated/` - Carpeta donde se almacenan las imágenes de premios generadas dinámicamente
- Formato: `premio_[numeroSorteo]_[timestamp].jpg`

## Estructura
```
assets/
├── modal_premio.png          # ⚠️ AGREGAR ESTE ARCHIVO
├── generated/                # Imágenes generadas automáticamente
│   ├── premio_10_1699200000000.jpg
│   ├── premio_25_1699200001000.jpg
│   └── ...
└── README.md                 # Este archivo
```

## Uso
Las imágenes generadas se sirven a través del endpoint:
`GET /api/assets/generated/[filename]`

## Troubleshooting
- Si ves "No se encontró la plantilla modal_premio.png", agrega la imagen
- Reinicia el servidor backend después de agregar la plantilla
- Verifica que la imagen tenga permisos de lectura