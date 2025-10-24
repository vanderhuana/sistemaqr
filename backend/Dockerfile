# Backend Dockerfile para SISQR6
FROM node:20-alpine

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

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto (se sobrescriben en producción)
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["node", "server.js"]
