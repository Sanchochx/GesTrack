"""
Seed script for test data
Creates categories and products with various stock levels for testing.
Deletes all existing users so you can create your own.

Usage: python seed_test_data.py
"""

import uuid
from datetime import datetime, timedelta
from decimal import Decimal
import random

from app import create_app, db
from app.models.user import User
from app.models.category import Category
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement


def clear_all_data():
    """Clears all data from the database"""
    print("Clearing existing data...")

    # Delete in order of dependencies
    InventoryMovement.query.delete()
    Product.query.delete()
    Category.query.delete()
    User.query.delete()

    db.session.commit()
    print("  - All data cleared")


def seed_categories():
    """Creates sample categories"""
    print("Creating categories...")

    categories_data = [
        {
            'name': 'Electronica',
            'description': 'Dispositivos electronicos, computadoras, celulares y accesorios',
            'color': '#2196F3',
            'icon': 'computer',
            'is_default': False
        },
        {
            'name': 'Hogar y Cocina',
            'description': 'Electrodomesticos, utensilios y articulos para el hogar',
            'color': '#4CAF50',
            'icon': 'home',
            'is_default': False
        },
        {
            'name': 'Ropa y Accesorios',
            'description': 'Vestimenta, calzado y accesorios de moda',
            'color': '#E91E63',
            'icon': 'checkroom',
            'is_default': False
        },
        {
            'name': 'Deportes',
            'description': 'Equipamiento deportivo, ropa deportiva y accesorios',
            'color': '#FF9800',
            'icon': 'sports_soccer',
            'is_default': False
        },
        {
            'name': 'Oficina',
            'description': 'Suministros de oficina, papeleria y mobiliario',
            'color': '#9C27B0',
            'icon': 'business_center',
            'is_default': False
        },
        {
            'name': 'Alimentos',
            'description': 'Productos alimenticios y bebidas',
            'color': '#795548',
            'icon': 'restaurant',
            'is_default': False
        },
        {
            'name': 'General',
            'description': 'Categoria general para productos sin categorizacion especifica',
            'color': '#6B7280',
            'icon': 'inventory_2',
            'is_default': True
        }
    ]

    categories = {}
    for cat_data in categories_data:
        category = Category(**cat_data)
        db.session.add(category)
        categories[cat_data['name']] = category

    db.session.commit()
    print(f"  - Created {len(categories)} categories")
    return categories


def seed_products(categories):
    """Creates sample products with various stock levels"""
    print("Creating products...")

    products_data = [
        # Electronica - Mix of stock levels
        {'sku': 'ELEC-001', 'name': 'Laptop HP Pavilion 15', 'category': 'Electronica',
         'cost_price': 1800000, 'sale_price': 2499000, 'stock': 25, 'reorder': 10,
         'description': 'Laptop HP con procesador Intel Core i5, 8GB RAM, 256GB SSD'},
        {'sku': 'ELEC-002', 'name': 'Monitor Samsung 24', 'category': 'Electronica',
         'cost_price': 450000, 'sale_price': 699000, 'stock': 8, 'reorder': 10,
         'description': 'Monitor Full HD 1080p con panel IPS'},
        {'sku': 'ELEC-003', 'name': 'Teclado Mecanico RGB', 'category': 'Electronica',
         'cost_price': 170000, 'sale_price': 299000, 'stock': 0, 'reorder': 15,
         'description': 'Teclado mecanico gaming con switches azules'},
        {'sku': 'ELEC-004', 'name': 'Mouse Inalambrico Logitech', 'category': 'Electronica',
         'cost_price': 95000, 'sale_price': 159000, 'stock': 50, 'reorder': 20,
         'description': 'Mouse ergonomico con conexion USB'},
        {'sku': 'ELEC-005', 'name': 'Audifonos Bluetooth Sony', 'category': 'Electronica',
         'cost_price': 300000, 'sale_price': 499000, 'stock': 5, 'reorder': 8,
         'description': 'Audifonos over-ear con cancelacion de ruido'},
        {'sku': 'ELEC-006', 'name': 'Cargador USB-C 65W', 'category': 'Electronica',
         'cost_price': 55000, 'sale_price': 119000, 'stock': 100, 'reorder': 30,
         'description': 'Cargador rapido compatible con laptops y celulares'},
        {'sku': 'ELEC-007', 'name': 'Webcam HD 1080p', 'category': 'Electronica',
         'cost_price': 130000, 'sale_price': 229000, 'stock': 0, 'reorder': 10,
         'description': 'Camara web para videoconferencias'},

        # Hogar y Cocina
        {'sku': 'HOME-001', 'name': 'Licuadora Oster 600W', 'category': 'Hogar y Cocina',
         'cost_price': 150000, 'sale_price': 269000, 'stock': 20, 'reorder': 8,
         'description': 'Licuadora de 10 velocidades con vaso de vidrio'},
        {'sku': 'HOME-002', 'name': 'Cafetera Programable', 'category': 'Hogar y Cocina',
         'cost_price': 200000, 'sale_price': 349000, 'stock': 3, 'reorder': 5,
         'description': 'Cafetera de 12 tazas con temporizador'},
        {'sku': 'HOME-003', 'name': 'Set de Ollas Antiadherentes', 'category': 'Hogar y Cocina',
         'cost_price': 300000, 'sale_price': 499000, 'stock': 15, 'reorder': 5,
         'description': 'Set de 8 piezas con recubrimiento ceramico'},
        {'sku': 'HOME-004', 'name': 'Tostadora 4 Rebanadas', 'category': 'Hogar y Cocina',
         'cost_price': 110000, 'sale_price': 189000, 'stock': 0, 'reorder': 6,
         'description': 'Tostadora con control de temperatura'},
        {'sku': 'HOME-005', 'name': 'Aspiradora Robot', 'category': 'Hogar y Cocina',
         'cost_price': 580000, 'sale_price': 989000, 'stock': 7, 'reorder': 4,
         'description': 'Robot aspirador con mapeo inteligente'},

        # Ropa y Accesorios
        {'sku': 'ROPA-001', 'name': 'Camiseta Polo Algodon', 'category': 'Ropa y Accesorios',
         'cost_price': 42000, 'sale_price': 85000, 'stock': 80, 'reorder': 25,
         'description': 'Camiseta polo 100% algodon, varios colores'},
        {'sku': 'ROPA-002', 'name': 'Jeans Slim Fit', 'category': 'Ropa y Accesorios',
         'cost_price': 95000, 'sale_price': 185000, 'stock': 45, 'reorder': 15,
         'description': 'Pantalon de mezclilla corte slim'},
        {'sku': 'ROPA-003', 'name': 'Zapatillas Running Nike', 'category': 'Ropa y Accesorios',
         'cost_price': 230000, 'sale_price': 389000, 'stock': 12, 'reorder': 10,
         'description': 'Zapatillas deportivas con tecnologia Air'},
        {'sku': 'ROPA-004', 'name': 'Cinturon de Cuero', 'category': 'Ropa y Accesorios',
         'cost_price': 52000, 'sale_price': 110000, 'stock': 2, 'reorder': 8,
         'description': 'Cinturon de cuero genuino con hebilla metalica'},
        {'sku': 'ROPA-005', 'name': 'Gorra Deportiva', 'category': 'Ropa y Accesorios',
         'cost_price': 28000, 'sale_price': 62000, 'stock': 60, 'reorder': 20,
         'description': 'Gorra ajustable con visera curva'},

        # Deportes
        {'sku': 'DEP-001', 'name': 'Balon de Futbol Adidas', 'category': 'Deportes',
         'cost_price': 75000, 'sale_price': 135000, 'stock': 30, 'reorder': 10,
         'description': 'Balon oficial tamano 5'},
        {'sku': 'DEP-002', 'name': 'Mancuernas 10kg (Par)', 'category': 'Deportes',
         'cost_price': 130000, 'sale_price': 239000, 'stock': 18, 'reorder': 8,
         'description': 'Par de mancuernas de hierro fundido'},
        {'sku': 'DEP-003', 'name': 'Yoga Mat Premium', 'category': 'Deportes',
         'cost_price': 68000, 'sale_price': 135000, 'stock': 4, 'reorder': 10,
         'description': 'Tapete de yoga antideslizante 6mm'},
        {'sku': 'DEP-004', 'name': 'Banda de Resistencia Set', 'category': 'Deportes',
         'cost_price': 42000, 'sale_price': 95000, 'stock': 0, 'reorder': 15,
         'description': 'Set de 5 bandas con diferentes resistencias'},
        {'sku': 'DEP-005', 'name': 'Botella Deportiva 1L', 'category': 'Deportes',
         'cost_price': 25000, 'sale_price': 62000, 'stock': 75, 'reorder': 25,
         'description': 'Botella de agua con tapa flip'},

        # Oficina
        {'sku': 'OFIC-001', 'name': 'Silla Ergonomica', 'category': 'Oficina',
         'cost_price': 450000, 'sale_price': 779000, 'stock': 10, 'reorder': 5,
         'description': 'Silla de oficina con soporte lumbar'},
        {'sku': 'OFIC-002', 'name': 'Escritorio Ajustable', 'category': 'Oficina',
         'cost_price': 780000, 'sale_price': 1390000, 'stock': 6, 'reorder': 3,
         'description': 'Escritorio con altura ajustable electrico'},
        {'sku': 'OFIC-003', 'name': 'Pack Boligrafos (12)', 'category': 'Oficina',
         'cost_price': 8500, 'sale_price': 22000, 'stock': 150, 'reorder': 50,
         'description': 'Pack de 12 boligrafos tinta azul'},
        {'sku': 'OFIC-004', 'name': 'Organizador de Escritorio', 'category': 'Oficina',
         'cost_price': 52000, 'sale_price': 115000, 'stock': 22, 'reorder': 10,
         'description': 'Organizador con compartimentos multiples'},
        {'sku': 'OFIC-005', 'name': 'Lampara LED de Escritorio', 'category': 'Oficina',
         'cost_price': 88000, 'sale_price': 165000, 'stock': 1, 'reorder': 8,
         'description': 'Lampara con brillo ajustable y USB'},

        # Alimentos
        {'sku': 'ALIM-001', 'name': 'Cafe Molido Premium 500g', 'category': 'Alimentos',
         'cost_price': 25000, 'sale_price': 52000, 'stock': 40, 'reorder': 20,
         'description': 'Cafe 100% arabica tostado medio'},
        {'sku': 'ALIM-002', 'name': 'Aceite de Oliva Extra Virgen 1L', 'category': 'Alimentos',
         'cost_price': 35000, 'sale_price': 68000, 'stock': 25, 'reorder': 12,
         'description': 'Aceite de oliva primera presion en frio'},
        {'sku': 'ALIM-003', 'name': 'Chocolate Oscuro 70% (Pack 5)', 'category': 'Alimentos',
         'cost_price': 20000, 'sale_price': 45000, 'stock': 0, 'reorder': 15,
         'description': 'Barras de chocolate oscuro premium'},
        {'sku': 'ALIM-004', 'name': 'Miel de Abeja Organica 500g', 'category': 'Alimentos',
         'cost_price': 22000, 'sale_price': 48000, 'stock': 18, 'reorder': 10,
         'description': 'Miel pura sin procesar'},
        {'sku': 'ALIM-005', 'name': 'Te Verde (100 bolsitas)', 'category': 'Alimentos',
         'cost_price': 16000, 'sale_price': 38000, 'stock': 55, 'reorder': 20,
         'description': 'Te verde japones en bolsitas'},
    ]

    products = []
    for prod_data in products_data:
        category = categories[prod_data['category']]
        product = Product(
            sku=prod_data['sku'],
            name=prod_data['name'],
            description=prod_data['description'],
            cost_price=Decimal(str(prod_data['cost_price'])),
            sale_price=Decimal(str(prod_data['sale_price'])),
            stock_quantity=prod_data['stock'],
            reorder_point=prod_data['reorder'],
            min_stock_level=prod_data['reorder'],  # Same as reorder for simplicity
            category_id=category.id,
            is_active=True
        )
        db.session.add(product)
        products.append(product)

    db.session.commit()

    # Count stock levels
    normal = sum(1 for p in products if p.stock_quantity > p.reorder_point)
    low = sum(1 for p in products if 0 < p.stock_quantity <= p.reorder_point)
    out = sum(1 for p in products if p.stock_quantity == 0)

    print(f"  - Created {len(products)} products:")
    print(f"    - {normal} with normal stock")
    print(f"    - {low} with low stock")
    print(f"    - {out} out of stock")

    return products


def seed_inventory_movements(products):
    """Creates sample inventory movements for history"""
    print("Creating inventory movements...")

    movement_types = ['Stock Inicial', 'Entrada', 'Ajuste']
    reasons = [
        'Stock inicial del sistema',
        'Recepción de mercancía',
        'Conteo físico',
        'Ajuste por inventario',
        'Corrección de error'
    ]

    movements_created = 0

    for product in products:
        if product.stock_quantity > 0:
            # Create initial stock movement
            initial_movement = InventoryMovement(
                product_id=product.id,
                movement_type='Stock Inicial',
                quantity=product.stock_quantity,
                previous_stock=0,
                new_stock=product.stock_quantity,
                reason='Stock inicial del sistema',
                notes=f'Carga inicial de inventario para {product.name}',
                created_at=datetime.utcnow() - timedelta(days=random.randint(30, 60))
            )
            db.session.add(initial_movement)
            movements_created += 1

            # Add some random movements for products with higher stock
            if product.stock_quantity > 20 and random.random() > 0.5:
                # Random entry
                qty = random.randint(5, 20)
                prev_stock = product.stock_quantity - qty
                entry_movement = InventoryMovement(
                    product_id=product.id,
                    movement_type='Entrada',
                    quantity=qty,
                    previous_stock=prev_stock,
                    new_stock=product.stock_quantity,
                    reason='Recepción de mercancía',
                    reference=f'PO-{random.randint(1000, 9999)}',
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 15))
                )
                db.session.add(entry_movement)
                movements_created += 1

    db.session.commit()
    print(f"  - Created {movements_created} inventory movements")


def main():
    """Main function to seed the database"""
    print("\n" + "=" * 50)
    print("GesTrack - Database Seeder")
    print("=" * 50 + "\n")

    app = create_app()

    with app.app_context():
        # Clear existing data
        clear_all_data()

        # Create new data
        categories = seed_categories()
        products = seed_products(categories)
        # Skip inventory movements since they require a user_id
        # Movements will be created automatically when you make adjustments
        print("Skipping inventory movements (require user)")
        print("  - Movements will be created when you make stock adjustments")

        # Summary
        print("\n" + "=" * 50)
        print("SEED COMPLETED SUCCESSFULLY!")
        print("=" * 50)
        print("\nDatabase now contains:")
        print(f"  - {Category.query.count()} categories")
        print(f"  - {Product.query.count()} products")
        print(f"  - 0 inventory movements (will be created on stock changes)")
        print(f"  - 0 users (create your own via /register)")
        print("\nStock Summary:")

        total_value = sum(
            float(p.cost_price) * p.stock_quantity
            for p in Product.query.all()
        )
        print(f"  - Total inventory value: ${total_value:,.0f} COP")

        out_of_stock = Product.query.filter(Product.stock_quantity == 0).count()
        low_stock = Product.query.filter(
            Product.stock_quantity > 0,
            Product.stock_quantity <= Product.reorder_point
        ).count()
        normal_stock = Product.query.filter(
            Product.stock_quantity > Product.reorder_point
        ).count()

        print(f"  - Products out of stock: {out_of_stock}")
        print(f"  - Products with low stock: {low_stock}")
        print(f"  - Products with normal stock: {normal_stock}")
        print("\n")


if __name__ == '__main__':
    main()
