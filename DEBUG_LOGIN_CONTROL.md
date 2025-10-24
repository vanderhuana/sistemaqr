# 🐛 DEBUG: Login del Rol Control

## Problema
El usuario con rol "control" no se está redirigiendo correctamente al dashboard de control después del login.

## Cambios Realizados

### 1. ✅ LoginView.vue
- Actualizado para redirigir correctamente según el rol
- Agregados logs detallados en la consola del navegador
- Control → `/control`
- Vendedor → `/vendedor`  
- Admin → `/dashboard`

### 2. ✅ Router.js
- Agregados logs extensivos para debuggear el flujo
- Ruta `/control` configurada correctamente con meta: `{ requiresAuth: true, requiresRole: 'control' }`
- Router guard actualizado con verificación de roles

### 3. ✅ QRScanner.vue
- Componente creado para solucionar error de importación
- Scanner QR funcional con cámara
- Compatible con HTTPS

## 📋 Pasos para Probar

### 1. Abrir la Consola del Navegador
Presiona `F12` o `Ctrl+Shift+I` para abrir las DevTools del navegador.

### 2. Ir a la pestaña Console
Verás todos los logs que hemos agregado con emojis.

### 3. Hacer Login con el Usuario Control

**Credenciales:**
- Email: `control@sisqr6.com`
- Password: `control123`

O usa el botón "Rellenar Control" en la página de login.

### 4. Observar los Logs en la Consola

Deberías ver algo como esto:

```
🔐 Respuesta de login: {success: true, token: "...", user: {...}}
👤 Usuario logueado: {id: 3, email: "control@sisqr6.com", role: "control", ...}
🎭 Rol del usuario: control
➡️ Redirigiendo a /control

🛣️ Router Guard - Navegando de /login a /control
📦 Usuario en localStorage: {"id":3,"email":"control@sisqr6.com","role":"control",...}
👤 Usuario parseado: {id: 3, email: "control@sisqr6.com", role: "control", ...}
🎭 Rol del usuario: control
🔒 Ruta requiere auth: true
🎯 Ruta requiere rol: control
✅ Permitiendo navegación a /control
```

## 🔍 Diagnóstico según los Logs

### Caso A: Si ves "⚠️ Rol incorrecto"
**Problema:** El rol del usuario en la base de datos no es "control"

**Solución:**
1. Verificar en la base de datos que el usuario tenga `role = 'control'`
2. O recrear la base de datos ejecutando el servidor backend (se ejecuta seedData automáticamente)

### Caso B: Si ves "⛔ No autenticado"
**Problema:** El usuario no se guardó correctamente en localStorage

**Solución:**
1. Verificar que `authStore.login()` retorne el usuario correctamente
2. Revisar que no haya errores en la respuesta del backend

### Caso C: Si ves "✅ Permitiendo navegación" pero no carga la vista
**Problema:** El componente DashboardControl tiene algún error

**Solución:**
1. Revisar la consola del navegador por errores de JavaScript
2. Verificar que todos los componentes importados existan

### Caso D: Loop infinito de redirección
**Problema:** El router guard está creando un ciclo

**Solución:**
1. El guard está redirigiendo control→control infinitamente
2. Revisar que la lógica del guard no entre en conflicto

## 🧪 Prueba Alternativa: Verificar desde la Consola

Abre la consola del navegador y ejecuta:

```javascript
// Ver usuario actual en localStorage
JSON.parse(localStorage.getItem('sisqr_user'))

// Ver token
localStorage.getItem('sisqr_token')

// Intentar navegar manualmente
window.location.href = '/control'
```

## 📸 Capturas de Pantalla Esperadas

1. **Login exitoso** → Logs en consola mostrando el usuario
2. **Router guard permitiendo** → Log "✅ Permitiendo navegación a /control"
3. **Dashboard Control** → Vista con sidebar verde oscuro, opciones: ESCANEAR QR, HISTORIAL, ESTADÍSTICAS

## 🛠️ Si Todo Falla

### Limpiar Cache y LocalStorage

```javascript
// Ejecutar en la consola del navegador:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Luego volver a hacer login.

### Verificar Base de Datos

Ejecuta esto en la terminal del backend:

```bash
# Forzar recreación de la base de datos
# El servidor automáticamente ejecuta seedData y crea los usuarios
cd backend
npm run dev
```

Esto recreará todos los usuarios incluyendo `control@sisqr6.com`.

## 📝 Reporte de Resultados

Por favor, copia y pega en el chat:

1. **Los logs que aparecen en la consola** cuando haces login
2. **La URL final** a la que te redirige
3. **Cualquier error** que aparezca en la consola (en rojo)

Esto me ayudará a identificar exactamente dónde está el problema.

---

**Estado Actual:**
- ✅ Código del LoginView corregido
- ✅ Router configurado correctamente
- ✅ Componente QRScanner creado
- ✅ Logs de debug agregados
- ⏳ Esperando prueba del usuario
