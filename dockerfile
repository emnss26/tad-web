FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
# Copiar package.json del frontend
COPY tad-web-frontend/package*.json ./
RUN npm install
# Copiar código fuente y compilar
COPY tad-web-frontend/ ./
RUN npm run build

# --- ETAPA 2: Construir el Backend ---
FROM node:18-alpine as backend-build
WORKDIR /app/backend
# Copiar package.json del backend
COPY tad-web-backend/package*.json ./
RUN npm install
# Copiar código fuente y compilar TS a JS
COPY tad-web-backend/ ./
RUN npm run build

# --- ETAPA 3: Imagen Final de Producción ---
FROM node:18-alpine
WORKDIR /app

# Copiar dependencias de producción del backend
COPY tad-web-backend/package*.json ./
RUN npm install --production

# Copiar el backend compilado
COPY --from=backend-build /app/backend/dist ./dist

# Copiar el frontend compilado (estáticos) a una carpeta que el backend pueda leer
# NOTA: Ajustamos la ruta para que coincida con lo que pusimos en server.ts
COPY --from=frontend-build /app/frontend/dist ../tad-web-frontend/dist

# Exponer el puerto
EXPOSE 8080

# Variables de entorno por defecto
ENV PORT=8080
ENV NODE_ENV=production

# Ejecutar
CMD ["node", "dist/server.js"]