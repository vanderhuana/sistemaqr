# GUÍA: Problema "Ya ingresó" en primer escaneo

## 🐛 Diagnóstico del problema

Cuando escaneas un QR de participante por primera vez y muestra "Ya ingresó", significa que:

1. **El campo `ultimoAcceso` ya tiene una fecha de hoy** en la base de datos
2. La lógica verifica si `ultimoAcceso` >= 10:00 AM de hoy

## 🔍 Verificar en la base de datos

Conecta al contenedor PostgreSQL y verifica:

```powershell
# En tu PC
docker exec -it sisqr6-postgres psql -U sisqr6_user -d sisqr6

# Verificar participantes que "ya ingresaron hoy"
SELECT nombre, apellido, ci, "ultimoAcceso", estado 
FROM participantes 
WHERE "ultimoAcceso" >= CURRENT_DATE;

# Verificar trabajadores que "ya ingresaron hoy"
SELECT nombre, apellido, ci, "ultimoAcceso", estado 
FROM trabajadores 
WHERE "ultimoAcceso" >= CURRENT_DATE;

# Salir
\q
```

## 🔧 Soluciones

### Opción 1: Resetear accesos manualmente (para pruebas)

```sql
-- Resetear TODOS los accesos de participantes
UPDATE participantes SET "ultimoAcceso" = NULL;

-- Resetear TODOS los accesos de trabajadores
UPDATE trabajadores SET "ultimoAcceso" = NULL;

-- O resetear solo uno específico por CI:
UPDATE participantes SET "ultimoAcceso" = NULL WHERE ci = '12345678';
```

### Opción 2: Agregar funcionalidad de reset en el admin

Te voy a crear un endpoint y botón en el dashboard admin para resetear accesos.

## ⏰ Cómo funciona la lógica

La lógica de "ya ingresó" funciona así:

1. **Hora de reinicio:** 10:00 AM cada día
2. **Si escaneas ANTES de las 10:00 AM:**
   - Se compara con 10:00 AM del día anterior
   - Si `ultimoAcceso` >= 10:00 AM de ayer → Ya ingresó

3. **Si escaneas DESPUÉS de las 10:00 AM:**
   - Se compara con 10:00 AM de hoy
   - Si `ultimoAcceso` >= 10:00 AM de hoy → Ya ingresó

## 📝 Ejemplo

- **Hora actual:** 30 Oct 2025, 3:00 PM
- **Última hora de reinicio:** 30 Oct 2025, 10:00 AM
- **Último acceso del participante:** 30 Oct 2025, 2:00 PM

Como `2:00 PM >= 10:00 AM`, el sistema dice "Ya ingresó hoy".

---

**¿Quieres que agregue un botón para resetear accesos desde el admin?**
