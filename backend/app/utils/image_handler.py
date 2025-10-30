"""
Utilidad para manejo de imágenes de productos
Validación, optimización y almacenamiento de imágenes
"""
import os
import uuid
from werkzeug.utils import secure_filename
from PIL import Image
import io


# CA-5: Configuración de imágenes
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_IMAGE_WIDTH = 1200
MAX_IMAGE_HEIGHT = 1200
DEFAULT_PRODUCT_IMAGE = 'default-product.png'


def allowed_file(filename):
    """
    CA-5: Verificar si la extensión del archivo es permitida

    Args:
        filename: Nombre del archivo

    Returns:
        bool: True si la extensión es permitida
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_image_size(file_storage):
    """
    CA-5: Validar que el tamaño del archivo no exceda el límite

    Args:
        file_storage: Objeto FileStorage de Flask

    Returns:
        tuple: (is_valid, error_message)
    """
    # Obtener tamaño del archivo
    file_storage.seek(0, os.SEEK_END)
    file_size = file_storage.tell()
    file_storage.seek(0)  # Resetear posición

    if file_size > MAX_FILE_SIZE:
        return False, f'La imagen no debe superar {MAX_FILE_SIZE / (1024 * 1024)}MB'

    return True, None


def optimize_image(image_file, max_width=MAX_IMAGE_WIDTH, max_height=MAX_IMAGE_HEIGHT):
    """
    CA-5: Optimizar imagen (redimensionar si es muy grande)

    Args:
        image_file: Objeto de archivo de imagen
        max_width: Ancho máximo
        max_height: Alto máximo

    Returns:
        BytesIO: Imagen optimizada en memoria
    """
    try:
        # Abrir imagen
        img = Image.open(image_file)

        # Convertir RGBA a RGB si es necesario (para JPG)
        if img.mode == 'RGBA':
            # Crear fondo blanco
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])  # 3 es el canal alpha
            img = background

        # Redimensionar si excede límites
        if img.width > max_width or img.height > max_height:
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

        # Guardar en memoria
        output = io.BytesIO()
        img_format = 'JPEG' if image_file.filename.lower().endswith(('.jpg', '.jpeg')) else 'PNG'
        img.save(output, format=img_format, quality=85, optimize=True)
        output.seek(0)

        return output

    except Exception as e:
        raise ValueError(f'Error al procesar imagen: {str(e)}')


def save_product_image(file_storage, sku, upload_folder):
    """
    CA-5: Guardar imagen de producto

    Args:
        file_storage: Objeto FileStorage de Flask
        sku: SKU del producto (para nombrar archivo)
        upload_folder: Carpeta base de uploads

    Returns:
        tuple: (success, filename_or_error)
    """
    try:
        # Validar extensión
        if not allowed_file(file_storage.filename):
            return False, 'Formato de archivo no permitido. Usa JPG, PNG o WEBP'

        # Validar tamaño
        is_valid, error_msg = validate_image_size(file_storage)
        if not is_valid:
            return False, error_msg

        # Optimizar imagen
        optimized_image = optimize_image(file_storage)

        # Generar nombre de archivo: {sku}_{timestamp}.{extension}
        timestamp = uuid.uuid4().hex[:8]
        extension = secure_filename(file_storage.filename).rsplit('.', 1)[1].lower()
        filename = f"{secure_filename(sku)}_{timestamp}.{extension}"

        # Crear ruta completa
        products_folder = os.path.join(upload_folder, 'products')
        os.makedirs(products_folder, exist_ok=True)
        filepath = os.path.join(products_folder, filename)

        # Guardar archivo optimizado
        with open(filepath, 'wb') as f:
            f.write(optimized_image.getbuffer())

        # Retornar URL completa con prefijo /uploads/ para acceso desde frontend
        return True, f'/uploads/products/{filename}'

    except Exception as e:
        return False, f'Error al guardar imagen: {str(e)}'


def delete_product_image(image_url, upload_folder):
    """
    Eliminar imagen de producto

    Args:
        image_url: URL relativa de la imagen (ej: 'products/ABC123_12345.jpg')
        upload_folder: Carpeta base de uploads

    Returns:
        bool: True si se eliminó exitosamente
    """
    try:
        if not image_url or image_url == DEFAULT_PRODUCT_IMAGE:
            return True

        filepath = os.path.join(upload_folder, image_url)
        if os.path.exists(filepath):
            os.remove(filepath)
            return True

        return False

    except Exception:
        return False


def get_default_product_image():
    """
    CA-5: Obtener URL de imagen por defecto

    Returns:
        str: URL de imagen por defecto
    """
    return f'/uploads/products/default/{DEFAULT_PRODUCT_IMAGE}'
