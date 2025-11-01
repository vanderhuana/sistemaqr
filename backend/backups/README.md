# Directorio de Backups

Este directorio almacena temporalmente los archivos de backup de la base de datos PostgreSQL.

## Archivos generados

Los backups se generan automáticamente con el siguiente formato de nombre:
```
sisqr6_backup_YYYY-MM-DDTHH-MM-SS.sql
```

## Gestión

- Los backups se pueden descargar a través del módulo "BACKUP/RESTORE" en el panel de administración
- Solo usuarios con rol `admin` pueden crear, descargar y eliminar backups
- Los backups contienen la estructura completa de la base de datos y todos los datos

## Seguridad

⚠️ **IMPORTANTE**: Los archivos de backup contienen información sensible. Asegúrate de:
- Mantener este directorio fuera del control de versiones (.gitignore)
- No compartir backups sin cifrar
- Eliminar backups antiguos periódicamente
- Almacenar backups importantes en ubicaciones seguras fuera del servidor

## Restauración

Para restaurar un backup manualmente desde línea de comandos:

```bash
# Desde el contenedor de Docker
docker exec -i sisqr6-postgres psql -U sisqr6_user -d sisqr6 < backup_file.sql

# Directamente en el servidor
PGPASSWORD="postgres123" psql -h localhost -U sisqr6_user -d sisqr6 < backup_file.sql
```

## Espacio en disco

Monitorea regularmente el espacio ocupado por backups antiguos:
```bash
du -sh backups/
ls -lh backups/
```
