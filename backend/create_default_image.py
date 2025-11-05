"""
Script para crear imagen placeholder por defecto
US-PROD-009 CA-8: Placeholder por defecto
"""
from PIL import Image, ImageDraw, ImageFont
import os

def create_default_product_image():
    """
    Crea una imagen placeholder por defecto para productos sin imagen
    """
    # Dimensiones de la imagen
    width, height = 400, 400

    # Crear imagen con fondo gris claro
    img = Image.new('RGB', (width, height), color='#f5f5f5')
    draw = ImageDraw.Draw(img)

    # Dibujar un rectángulo con borde
    border_color = '#cccccc'
    border_width = 3
    draw.rectangle(
        [(border_width, border_width), (width - border_width, height - border_width)],
        outline=border_color,
        width=border_width
    )

    # Dibujar un icono simple de imagen (rectángulo con círculo y línea)
    icon_size = 120
    icon_x = (width - icon_size) // 2
    icon_y = (height - icon_size) // 2 - 20

    # Rectángulo del icono
    draw.rectangle(
        [(icon_x, icon_y), (icon_x + icon_size, icon_y + icon_size)],
        outline='#9e9e9e',
        width=3
    )

    # Círculo (sol/luna en la esquina)
    circle_radius = 15
    circle_x = icon_x + 20
    circle_y = icon_y + 20
    draw.ellipse(
        [(circle_x - circle_radius, circle_y - circle_radius),
         (circle_x + circle_radius, circle_y + circle_radius)],
        fill='#9e9e9e'
    )

    # Línea de horizonte (montañas simplificadas)
    draw.line(
        [(icon_x, icon_y + icon_size - 30),
         (icon_x + 40, icon_y + icon_size - 60),
         (icon_x + 70, icon_y + icon_size - 40),
         (icon_x + icon_size, icon_y + icon_size - 70)],
        fill='#9e9e9e',
        width=3
    )

    # Agregar texto
    try:
        # Intentar usar una fuente, si no está disponible usar la por defecto
        from PIL import ImageFont
        font = ImageFont.truetype("arial.ttf", 24)
    except:
        font = ImageFont.load_default()

    text = "Sin imagen"
    # Obtener tamaño del texto para centrarlo
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_x = (width - text_width) // 2
    text_y = icon_y + icon_size + 30

    draw.text((text_x, text_y), text, fill='#757575', font=font)

    # Guardar imagen
    output_path = os.path.join('backend', 'uploads', 'products', 'default', 'default-product.png')
    img.save(output_path, 'PNG', quality=95)
    print(f'Imagen placeholder creada: {output_path}')

    return output_path

if __name__ == '__main__':
    create_default_product_image()
