# ✅ Checklist Pre-Despliegue - SISQR6

Usa este checklist para asegurarte de que todo está listo antes de subir a producción.

## 📦 Archivos y Configuración

- [x] **Dockerfile backend** creado (`backend/Dockerfile`)
- [x] **Dockerfile frontend** creado (`frontend/Dockerfile`)
- [x] **docker-compose.yml** creado (para testing local)
- [x] **.dockerignore** para backend y frontend
- [x] **.gitignore** actualizado
- [x] **.env.example** con todas las variables documentadas
- [x] **nginx.conf** para el frontend
- [x] **Database config** soporta DATABASE_URL
- [x] **Frontend API** configurado con VITE_API_URL

## 🔒 Seguridad

- [ ] Cambiar `JWT_SECRET` por uno generado aleatoriamente (mínimo 32 caracteres)
- [ ] Verificar que `.env` está en `.gitignore`
- [ ] Asegurar que contraseñas de base de datos sean fuertes
- [ ] Verificar que certificados SSL/TLS no estén en el repo
- [ ] Revisar que no haya credenciales hardcodeadas en el código

## 🗄️ Base de Datos

- [ ] Base de datos PostgreSQL creada en DigitalOcean
- [ ] Connection string guardada de forma segura
- [ ] Verificar que `sslmode=require` esté en la connection string
- [ ] Script de seeds listo (`npm run seed:users`)
- [ ] Backups automáticos configurados

## 🚀 Deployment

- [ ] Código subido a GitHub/GitLab
- [ ] Branch `main` está actualizado
- [ ] App creada en DigitalOcean App Platform
- [ ] Variables de entorno configuradas en App Platform:
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` (connection string completa)
  - [ ] `JWT_SECRET` (aleatorio de 32+ chars)
  - [ ] `FRONTEND_URL` (URL del frontend)
  - [ ] `VITE_API_URL` (URL del backend)
- [ ] Componente Backend configurado
- [ ] Componente Frontend configurado
- [ ] Dominio configurado (opcional)

## ✅ Testing Post-Deploy

- [ ] Frontend carga correctamente
- [ ] Backend responde en `/api/health`
- [ ] Conexión a base de datos exitosa (ver logs)
- [ ] Seeds ejecutados (`npm run seed:users`)
- [ ] Login funciona con usuario admin
- [ ] Login funciona con usuario vendedor
- [ ] Login funciona con usuario control
- [ ] Dashboard admin carga correctamente
- [ ] Dashboard vendedor carga correctamente
- [ ] Dashboard control carga correctamente
- [ ] Venta de entrada funciona
- [ ] Generación de QR funciona
- [ ] Escáner QR funciona
- [ ] Validación de entrada funciona

## 📊 Monitoreo

- [ ] Logs del backend accesibles
- [ ] Logs del frontend accesibles
- [ ] Alertas configuradas en DigitalOcean
- [ ] Plan de backup verificado
- [ ] Plan de escalabilidad definido

## 📝 Documentación

- [ ] README.md actualizado con instrucciones
- [ ] DEPLOY.md con información técnica
- [ ] GUIA_DIGITALOCEAN.md con pasos detallados
- [ ] Credenciales de usuarios documentadas
- [ ] URLs de producción documentadas

## 🎯 Funcionalidades Críticas

- [ ] Sistema puede generar 30,000 QR codes
- [ ] QR codes son únicos (sin duplicados)
- [ ] Validación de QR en tiempo real
- [ ] Control de acceso para trabajadores
- [ ] Control de acceso para participantes
- [ ] Reportes de ventas
- [ ] Estadísticas en dashboard

## 🔧 Configuración de Producción

- [ ] `NODE_ENV=production` configurado
- [ ] Logging desactivado en producción (no console.log sensibles)
- [ ] CORS configurado correctamente
- [ ] Rate limiting activado
- [ ] HTTPS forzado
- [ ] Headers de seguridad configurados (Helmet)

## 👥 Usuarios y Permisos

- [ ] Usuario admin creado
- [ ] Usuario vendedor creado
- [ ] Usuario control creado
- [ ] Contraseñas predeterminadas cambiadas
- [ ] Roles verificados

## 💰 Costos y Presupuesto

- [ ] Plan de DigitalOcean revisado (~$25-40/mes)
- [ ] Presupuesto aprobado
- [ ] Método de pago configurado
- [ ] Alertas de facturación configuradas

---

## 🚨 Antes de Ir a Producción

**IMPORTANTE**: Prueba todo en el ambiente de staging primero:

1. Hacer un deploy de prueba
2. Ejecutar todos los tests
3. Verificar que todo funcione
4. Hacer rollback si hay problemas
5. Documentar cualquier issue encontrado

---

## 📞 Contactos de Emergencia

- **Desarrollador Principal**: [Nombre y contacto]
- **Soporte DigitalOcean**: https://cloud.digitalocean.com/support/tickets
- **Equipo FEIPOBOL**: [Contacto]

---

## ✅ Firma de Aprobación

- [ ] **Desarrollador**: _____________ Fecha: _______
- [ ] **Project Manager**: _____________ Fecha: _______
- [ ] **Cliente/FEIPOBOL**: _____________ Fecha: _______

---

**Última actualización**: Octubre 24, 2025
