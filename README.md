# Sistema de Venta y Validación de Entradas con QR

## Descripción
Sistema web completo para la venta y validación de entradas mediante códigos QR, con roles de usuario, reportes y dashboard administrativo.

## Estructura del Proyecto

```
sisqr6/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Lógica de controladores
│   │   ├── models/         # Modelos de base de datos
│   │   ├── routes/         # Definición de rutas
│   │   ├── middleware/     # Middleware personalizado
│   │   ├── config/         # Configuración de la aplicación
│   │   └── utils/          # Utilidades y helpers
│   ├── package.json
│   └── server.js
├── frontend/               # Aplicación Vue.js
└── README.md
```

## Tecnologías

### Backend
- **Framework**: Node.js + Express
- **Base de datos**: PostgreSQL
- **ORM**: Sequelize
- **Autenticación**: JWT + Bcrypt
- **Generación QR**: qrcode
- **Reportes**: pdfkit, exceljs

### Frontend
- **Framework**: Vue.js
- **UI**: Vuetify
- **Validación QR**: vue-qrcode-reader
- **Gráficos**: Chart.js

## Roles de Usuario

1. **Administrador**: Gestión completa del sistema
2. **Vendedor**: Registro de ventas y generación de entradas
3. **Control**: Validación de entradas en puerta

## Instalación y Configuración

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run serve
```

## Estado del Desarrollo

- [x] Estructura básica del proyecto
- [ ] Configuración del backend
- [ ] Base de datos PostgreSQL
- [ ] Sistema de autenticación
- [ ] Gestión de eventos
- [ ] Generación de entradas QR
- [ ] Validación QR móvil
- [ ] Dashboard y reportes
- [ ] Frontend Vue.js