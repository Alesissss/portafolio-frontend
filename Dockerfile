FROM node:22-alpine AS build

# Permite inyectar la URL del backend en producción durante el build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- ETAPA DE PRODUCCIÓN ---
FROM nginx:stable-alpine

# Configuración para que React Router funcione sin dar errores 404
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copia los archivos compilados de la etapa anterior a Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Ajuste de seguridad: Correr Nginx sin privilegios de root
RUN touch /var/run/nginx.pid && \
    chown -R 1000:1000 /var/run/nginx.pid /var/cache/nginx /var/log/nginx /usr/share/nginx/html

USER 1000

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]