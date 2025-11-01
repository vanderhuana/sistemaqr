# Backend Dockerfile para SISQR6
FROM node:20-alpine

# Instalar wget para healthcheck y postgresql-client para backups
RUN apk add --no-cache wget postgresql-client

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Crear directorio para uploads si no existe
RUN mkdir -p uploads

# Exponer puertos HTTP y HTTPS
EXPOSE 3000
EXPOSE 3443

# Variables de entorno por defecto (se sobrescriben en producción)
ENV NODE_ENV=production
ENV PORT=3000
ENV HTTPS_PORT=3443

# Comando de inicio
CMD ["node", "server.js"]
