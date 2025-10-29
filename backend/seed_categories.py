"""
Script de seed para categoría por defecto
US-PROD-007 CA-7: Categoría por Defecto
"""
from app import create_app, db
from app.models.category import Category

def seed_default_category():
    """Crea la categoría por defecto 'General' si no existe"""
    app = create_app()

    with app.app_context():
        # Verificar si ya existe una categoría por defecto
        default_category = Category.query.filter_by(is_default=True).first()

        if not default_category:
            # Crear categoría por defecto
            general_category = Category(
                name='General',
                description='Categoría general para productos sin categorización específica',
                color='#6B7280',  # Gris neutral
                icon='folder',
                is_default=True
            )

            db.session.add(general_category)
            db.session.commit()

            print(f"[OK] Categoria por defecto 'General' creada con ID: {general_category.id}")
        else:
            print(f"[INFO] Ya existe una categoria por defecto: '{default_category.name}'")

if __name__ == '__main__':
    seed_default_category()
