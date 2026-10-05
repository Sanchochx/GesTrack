# 1. Usamos una versión oficial y ligera de Node.js
FROM node:20-alpine

# 2. Definimos la carpeta de trabajo dentro de la cápsula
WORKDIR /app

# 3. Copiamos los archivos de dependencias primero para optimizar la caché
COPY package*.json ./

# 4. Instalamos las dependencias de Node
RUN npm install

# 5. Copiamos el resto de tu código fuente
COPY . .

# 6. Exponemos el puerto (Cambia el 3000 por 5173 si usas Vite, o 4200 para Angular)
EXPOSE 5173

# 7. Comando para arrancar tu proyecto (Puede ser "npm start" dependiendo de tu framework)
# Si usas npm:
CMD ["npm", "run", "dev", "--", "--host"]
