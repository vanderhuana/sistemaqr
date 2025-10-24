# Configuración de Servidor de Red Local - SISQR6

## 🌐 Información de Red
- **IP del Servidor:** 192.168.1.3
- **Puerto Backend:** 3000
- **Puerto Frontend:** 5173

## 📱 URLs de Acceso

### Desde esta máquina (localhost):
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Desde otros dispositivos en la red:
- Frontend: http://192.168.1.3:5173
- Backend API: http://192.168.1.3:3000

## 🔥 Configuración del Firewall de Windows

### Opción 1: Abrir puertos automáticamente (PowerShell como Administrador)

Ejecuta estos comandos en PowerShell como Administrador:

```powershell
# Permitir puerto 3000 (Backend)
New-NetFirewallRule -DisplayName "SISQR6 Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Permitir puerto 5173 (Frontend Vite)
New-NetFirewallRule -DisplayName "SISQR6 Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Opción 2: Configuración manual del Firewall

1. Abre "Firewall de Windows Defender con seguridad avanzada"
2. Haz clic en "Reglas de entrada"
3. Clic en "Nueva regla..." en el panel derecho
4. Selecciona "Puerto" → Siguiente
5. Selecciona "TCP" y escribe "3000" → Siguiente
6. Selecciona "Permitir la conexión" → Siguiente
7. Marca todas las opciones (Dominio, Privado, Público) → Siguiente
8. Nombre: "SISQR6 Backend Puerto 3000" → Finalizar
9. Repite los pasos para el puerto 5173 (Frontend)

### Opción 3: Deshabilitar temporalmente el firewall (NO RECOMENDADO)

Solo para pruebas rápidas:
```powershell
# Deshabilitar (como Administrador)
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# Volver a habilitar después
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

## 🚀 Iniciar los Servidores

### 1. Iniciar Backend (Terminal 1)
```powershell
cd backend
node server.js
```

Deberías ver:
```
🚀 Servidor corriendo en puerto 3000
📱 Modo: development
🌐 Local: http://localhost:3000
🌐 Red: http://192.168.1.3:3000
💡 Otros dispositivos pueden acceder usando: http://192.168.1.3:3000
```

### 2. Iniciar Frontend (Terminal 2)
```powershell
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.3:5173/
  ➜  press h + enter to show help
```

## 📱 Conectar desde Otros Dispositivos

### Smartphones/Tablets/Otras PCs en la misma red WiFi:

1. **Asegúrate** que estén conectados a la misma red WiFi
2. **Abre el navegador** en el dispositivo
3. **Navega a:** `http://192.168.1.3:5173`

### Para escanear QR desde móviles:
- El lector QR debe poder acceder a `http://192.168.1.3:3000/api`
- El frontend ya está configurado para usar el proxy correcto

## 🔍 Verificar Conectividad

### Desde otro dispositivo:

```bash
# Probar si el backend responde
curl http://192.168.1.3:3000/api

# O abre en navegador:
http://192.168.1.3:3000/api
```

### Desde esta máquina:

```powershell
# Verificar que los puertos estén abiertos
Test-NetConnection -ComputerName 192.168.1.3 -Port 3000
Test-NetConnection -ComputerName 192.168.1.3 -Port 5173

# Ver reglas del firewall
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*SISQR6*" }
```

## 🛠️ Troubleshooting

### El dispositivo no puede conectarse:

1. **Verifica que estén en la misma red:**
   - Ambos dispositivos deben estar en la red 192.168.1.x
   - Usa `ipconfig` en Windows o `ifconfig` en Linux/Mac

2. **Verifica el firewall:**
   - Los puertos 3000 y 5173 deben estar abiertos
   - Ejecuta el comando de verificación arriba

3. **Verifica que los servidores estén corriendo:**
   - Backend debe estar en `http://192.168.1.3:3000`
   - Frontend debe estar en `http://192.168.1.3:5173`

4. **Si usas router con aislamiento de clientes:**
   - Algunos routers tienen "Aislamiento AP" o "Client Isolation"
   - Desactívalo en la configuración del router

5. **Prueba con el firewall deshabilitado temporalmente:**
   - Si funciona, el problema es el firewall
   - Vuelve a habilitar y configura las reglas correctamente

## 📝 Notas Importantes

- ⚠️ Esta configuración es solo para red local (LAN)
- ⚠️ NO exponer estos puertos a Internet sin seguridad adicional
- ⚠️ Cambiar JWT_SECRET y passwords en producción
- ✅ Asegúrate de que PostgreSQL esté corriendo
- ✅ Los QR generados funcionarán desde cualquier dispositivo en la red
- ✅ El sistema de acceso diario funcionará correctamente

## 🔐 Seguridad Adicional (Opcional)

Para producción o exposición a Internet:
- Usar HTTPS con certificados SSL
- Implementar rate limiting
- Usar variables de entorno seguras
- Configurar autenticación adicional
- Usar VPN para acceso remoto seguro
