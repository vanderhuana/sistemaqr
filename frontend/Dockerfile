# Frontend Dockerfile para SISQR6
# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Etapa 2: Servir con nginx
FROM nginx:alpine

# Instalar wget para healthcheck y openssl para certificados
RUN apk add --no-cache wget openssl

# Copiar build al directorio de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Crear directorio para certificados SSL
RUN mkdir -p /etc/nginx/ssl

# Copiar certificados SSL (deben estar en el contexto de build)
COPY ssl/server.pfx /tmp/server.pfx

# Extraer certificados CRT y KEY del PFX
RUN openssl pkcs12 -in /tmp/server.pfx -clcerts -nokeys -out /etc/nginx/ssl/server.crt -passin pass:sisfipo2024 -passout pass:sisfipo2024 && \
    openssl pkcs12 -in /tmp/server.pfx -nocerts -nodes -out /etc/nginx/ssl/server.key -passin pass:sisfipo2024 && \
    rm /tmp/server.pfx && \
    chmod 600 /etc/nginx/ssl/server.key

# Copiar configuración personalizada de nginx con HTTPS
COPY nginx-https.conf /etc/nginx/conf.d/default.conf

# Exponer puertos HTTP y HTTPS
EXPOSE 80
EXPOSE 443

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
