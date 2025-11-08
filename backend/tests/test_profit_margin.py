"""
US-PROD-010 CA-1: Tests unitarios para cálculo de margen de ganancia

Este módulo contiene tests para validar el cálculo correcto del margen de ganancia
según la fórmula: Margen (%) = ((Precio Venta - Precio Costo) / Precio Costo) × 100
"""

import pytest
from decimal import Decimal
from app import create_app, db
from app.models.product import Product
from app.models.category import Category


@pytest.fixture
def app_context():
    """Fixture para crear contexto de aplicación con base de datos de prueba"""
    app = create_app('testing')

    with app.app_context():
        db.create_all()

        # Crear categoría de prueba
        category = Category(name="Test Category", description="For testing")
        db.session.add(category)
        db.session.commit()

        yield app, category

        db.session.remove()
        db.drop_all()


class TestProfitMarginCalculation:
    """Tests para el método calculate_profit_margin del modelo Product"""

    def test_positive_margin_50_percent(self, app_context):
        """
        CA-1: Test margen positivo del 50%
        Costo $100, Venta $150 = 50.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 1",
            description="Test description",
            sku="TEST-001",
            cost_price=Decimal('100.00'),
            sale_price=Decimal('150.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 50.00
        assert isinstance(margin, float)

    def test_positive_margin_20_percent(self, app_context):
        """
        CA-1: Test margen positivo del 20%
        Costo $50, Venta $60 = 20.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 2",
            description="Test description",
            sku="TEST-002",
            cost_price=Decimal('50.00'),
            sale_price=Decimal('60.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 20.00
        assert isinstance(margin, float)

    def test_zero_margin(self, app_context):
        """
        CA-1: Test margen cero (sin ganancia ni pérdida)
        Costo $80, Venta $80 = 0.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 3",
            description="Test description",
            sku="TEST-003",
            cost_price=Decimal('80.00'),
            sale_price=Decimal('80.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 0.00
        assert isinstance(margin, float)

    def test_negative_margin(self, app_context):
        """
        CA-1: Test margen negativo (pérdida)
        Costo $100, Venta $90 = -10.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 4",
            description="Test description",
            sku="TEST-004",
            cost_price=Decimal('100.00'),
            sale_price=Decimal('90.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == -10.00
        assert isinstance(margin, float)

    def test_margin_with_decimals_rounding(self, app_context):
        """
        CA-1 y CA-2: Test redondeo a 2 decimales
        Costo $33.33, Venta $50.00 = 50.015... → 50.02%
        """
        app, category = app_context

        product = Product(
            name="Test Product 5",
            description="Test description",
            sku="TEST-005",
            cost_price=Decimal('33.33'),
            sale_price=Decimal('50.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        # Verificar que tiene exactamente 2 decimales
        assert round(margin, 2) == margin
        assert margin == 50.02

    def test_zero_cost_price_edge_case(self, app_context):
        """
        CA-1: Test edge case - división por cero cuando cost_price = 0
        Debe retornar 0.0 para evitar error
        """
        app, category = app_context

        product = Product(
            name="Test Product 6",
            description="Test description",
            sku="TEST-006",
            cost_price=Decimal('0.00'),
            sale_price=Decimal('100.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 0.0
        assert isinstance(margin, float)

    def test_none_cost_price(self, app_context):
        """
        CA-1: Test edge case - cost_price es None
        Debe retornar 0.0 para manejar valores nulos
        """
        app, category = app_context

        product = Product(
            name="Test Product 7",
            description="Test description",
            sku="TEST-007",
            cost_price=None,
            sale_price=Decimal('100.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 0.0
        assert isinstance(margin, float)

    def test_none_sale_price(self, app_context):
        """
        CA-1: Test edge case - sale_price es None
        Debe retornar 0.0 para manejar valores nulos
        """
        app, category = app_context

        product = Product(
            name="Test Product 8",
            description="Test description",
            sku="TEST-008",
            cost_price=Decimal('50.00'),
            sale_price=None,
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 0.0
        assert isinstance(margin, float)

    def test_high_margin_100_percent(self, app_context):
        """
        CA-1: Test margen alto del 100%
        Costo $50, Venta $100 = 100.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 9",
            description="Test description",
            sku="TEST-009",
            cost_price=Decimal('50.00'),
            sale_price=Decimal('100.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 100.00
        assert isinstance(margin, float)

    def test_very_low_margin_5_percent(self, app_context):
        """
        CA-1: Test margen muy bajo del 5%
        Costo $100, Venta $105 = 5.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 10",
            description="Test description",
            sku="TEST-010",
            cost_price=Decimal('100.00'),
            sale_price=Decimal('105.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 5.00
        assert isinstance(margin, float)

    def test_margin_color_classification_green(self, app_context):
        """
        CA-3: Test que margen > 30% debería ser clasificado como "verde" (excelente)
        Costo $100, Venta $140 = 40.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 11",
            description="Test description",
            sku="TEST-011",
            cost_price=Decimal('100.00'),
            sale_price=Decimal('140.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 40.00
        assert margin > 30  # Clasificación verde

    def test_margin_color_classification_yellow(self, app_context):
        """
        CA-3: Test que margen entre 15-30% debería ser clasificado como "amarillo" (aceptable)
        Costo $100, Venta $120 = 20.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 12",
            description="Test description",
            sku="TEST-012",
            cost_price=Decimal('100.00'),
            sale_price=Decimal('120.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 20.00
        assert 15 <= margin <= 30  # Clasificación amarilla

    def test_margin_color_classification_red(self, app_context):
        """
        CA-3: Test que margen < 15% debería ser clasificado como "rojo" (bajo)
        Costo $100, Venta $110 = 10.00%
        """
        app, category = app_context

        product = Product(
            name="Test Product 13",
            description="Test description",
            sku="TEST-013",
            cost_price=Decimal('100.00'),
            sale_price=Decimal('110.00'),
            stock_actual=10,
            stock_min=5,
            category_id=category.id
        )

        margin = product.calculate_profit_margin()

        assert margin == 10.00
        assert margin < 15  # Clasificación roja
