# 1. Usa un sistema operativo Linux mínimo con Python preinstalado
FROM python:3.12-slim

# 2. Define la carpeta principal dentro del contenedor
WORKDIR /app

# 3. Copia solo el archivo de requerimientos primero (optimiza la velocidad de futuras construcciones)
COPY requirements.txt .

# 4. Instala todas las dependencias (Flask, SQLAlchemy, etc.)
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copia el resto del código de tu proyecto al contenedor
COPY . .

# 6. Expone el puerto por defecto de Flask
EXPOSE 5000

# 7. Ejecuta el servidor cuando el contenedor se inicie
CMD ["python3", "run.py"]
