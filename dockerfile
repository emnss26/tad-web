# --- ETAPA 1: Construir el Frontend ---
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
# Copiar dependencias e instalar
COPY tad-web-frontend/package*.json ./
RUN npm ci
# Copiar código y construir
COPY tad-web-frontend/ ./
RUN npm run build

# --- ETAPA 2: Construir el Backend ---
FROM node:18-alpine as backend-build
WORKDIR /app/backend
# Copiar dependencias e instalar
COPY tad-web-backend/package*.json ./
RUN npm ci
# Copiar código y construir
COPY tad-web-backend/ ./
RUN npm run build

# --- ETAPA 3: Imagen Final de Producción ---
FROM node:18-alpine
WORKDIR /app

# 1. Instalar solo dependencias de producción
COPY tad-web-backend/package*.json ./
RUN npm ci --only=production

# 2. Copiar el backend compilado (carpeta dist)
COPY --from=backend-build /app/backend/dist ./dist

# 3. Copiar el frontend compilado a la carpeta 'public' que espera el server.ts
COPY --from=frontend-build /app/frontend/dist ./public

# Exponer puerto
EXPOSE 8080

# Variables de entorno por defecto
ENV PORT=8080
ENV NODE_ENV=production

# Comando de arranque
CMD ["node", "dist/server.js"]