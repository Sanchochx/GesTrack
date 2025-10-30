"""
Script para migrar las URLs de imágenes existentes
Agrega el prefijo /uploads/ a las image_url en la base de datos
"""
from app import create_app, db
from app.models.product import Product

def migrate_image_urls():
    """Migrar URLs de imágenes para incluir prefijo /uploads/"""
    app = create_app()

    with app.app_context():
        # Obtener todos los productos con imágenes
        products = Product.query.filter(
            Product.image_url.isnot(None),
            ~Product.image_url.like('/uploads/%')
        ).all()

        if not products:
            print("[OK] No hay productos que migrar. Todas las URLs ya tienen el prefijo correcto.")
            return

        print(f"Productos a migrar: {len(products)}")
        print("-" * 60)

        migrated = 0
        for product in products:
            old_url = product.image_url
            # Agregar prefijo /uploads/ si no existe
            product.image_url = f'/uploads/{old_url}'
            migrated += 1

            print(f"Producto: {product.name} (SKU: {product.sku})")
            print(f"  Antes: {old_url}")
            print(f"  Despues: {product.image_url}")
            print()

        # Guardar cambios
        try:
            db.session.commit()
            print("=" * 60)
            print(f"[OK] Migracion completada exitosamente!")
            print(f"Total de productos migrados: {migrated}")
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error al guardar cambios: {str(e)}")

if __name__ == '__main__':
    migrate_image_urls()
