"""
Servicio para cálculo del valor total del inventario

US-INV-005: Valor Total del Inventario
- CA-1: Cálculo del valor total
- CA-3: Desglose por categoría
- CA-4: Evolución temporal
- CA-5: Métricas adicionales
"""
from app import db
from app.models.product import Product
from app.models.category import Category
from app.models.inventory_value_history import InventoryValueHistory
from app.models.inventory_movement import InventoryMovement
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from decimal import Decimal


class InventoryValueService:
    """
    Servicio para gestionar el valor del inventario
    """

    @staticmethod
    def calculate_total_value():
        """
        US-INV-005 CA-1: Calcula el valor total del inventario

        Fórmula: Σ (precio_costo × stock_actual) para todos los productos
        - Solo productos con stock > 0
        - Excluye productos inactivos o eliminados

        Returns:
            dict: {
                'total_value': float (con 2 decimales),
                'total_products': int (cantidad de productos únicos con stock),
                'total_quantity': int (suma total de unidades),
                'calculated_at': str (timestamp ISO),
                'formatted_value': str (formato moneda $X,XXX,XXX.XX)
            }
        """
        # Query optimizada usando agregación SQL
        result = db.session.query(
            func.sum(Product.cost_price * Product.stock_quantity).label('total_value'),
            func.count(Product.id).label('total_products'),
            func.sum(Product.stock_quantity).label('total_quantity')
        ).filter(
            and_(
                Product.stock_quantity > 0,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).first()

        total_value = float(result.total_value) if result.total_value else 0.0
        total_products = result.total_products if result.total_products else 0
        total_quantity = result.total_quantity if result.total_quantity else 0

        # Redondear a 2 decimales (CA-1)
        total_value = round(total_value, 2)

        # Formatear como moneda (CA-1)
        formatted_value = f"${total_value:,.2f}"

        return {
            'total_value': total_value,
            'total_products': total_products,
            'total_quantity': total_quantity,
            'calculated_at': datetime.utcnow().isoformat(),
            'formatted_value': formatted_value
        }

    @staticmethod
    def get_value_by_category():
        """
        US-INV-005 CA-3: Calcula el valor del inventario desglosado por categoría

        Returns:
            list: [
                {
                    'category_id': str,
                    'category_name': str,
                    'total_value': float,
                    'product_count': int,
                    'total_quantity': int,
                    'percentage': float (porcentaje del total),
                    'formatted_value': str
                },
                ...
            ]
        """
        # Obtener valor total primero para calcular porcentajes
        total_inventory_value = InventoryValueService.calculate_total_value()['total_value']

        # Query agrupada por categoría
        results = db.session.query(
            Category.id,
            Category.name,
            Category.color,
            Category.icon,
            func.sum(Product.cost_price * Product.stock_quantity).label('total_value'),
            func.count(Product.id).label('product_count'),
            func.sum(Product.stock_quantity).label('total_quantity')
        ).join(
            Product, Category.id == Product.category_id
        ).filter(
            and_(
                Product.stock_quantity > 0,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).group_by(
            Category.id,
            Category.name,
            Category.color,
            Category.icon
        ).order_by(
            func.sum(Product.cost_price * Product.stock_quantity).desc()
        ).all()

        categories_breakdown = []
        for row in results:
            total_value = float(row.total_value) if row.total_value else 0.0
            total_value = round(total_value, 2)

            # Calcular porcentaje del total (CA-3)
            percentage = (total_value / total_inventory_value * 100) if total_inventory_value > 0 else 0.0
            percentage = round(percentage, 2)

            categories_breakdown.append({
                'category_id': row.id,
                'category_name': row.name,
                'category_color': row.color,
                'category_icon': row.icon,
                'total_value': total_value,
                'product_count': row.product_count,
                'total_quantity': row.total_quantity,
                'percentage': percentage,
                'formatted_value': f"${total_value:,.2f}"
            })

        return categories_breakdown

    @staticmethod
    def get_top_products_by_value(limit=10):
        """
        US-INV-005 CA-5: Obtiene los productos de mayor valor en inventario

        Args:
            limit: Número de productos a retornar (default: 10)

        Returns:
            list: [
                {
                    'product_id': str,
                    'sku': str,
                    'name': str,
                    'cost_price': float,
                    'stock_quantity': int,
                    'total_value': float (cost_price × stock),
                    'formatted_value': str,
                    'category_name': str
                },
                ...
            ]
        """
        products = db.session.query(
            Product.id,
            Product.sku,
            Product.name,
            Product.cost_price,
            Product.stock_quantity,
            Category.name.label('category_name'),
            (Product.cost_price * Product.stock_quantity).label('total_value')
        ).join(
            Category, Product.category_id == Category.id
        ).filter(
            and_(
                Product.stock_quantity > 0,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).order_by(
            (Product.cost_price * Product.stock_quantity).desc()
        ).limit(limit).all()

        top_products = []
        for p in products:
            total_value = float(p.total_value) if p.total_value else 0.0
            total_value = round(total_value, 2)

            top_products.append({
                'product_id': p.id,
                'sku': p.sku,
                'name': p.name,
                'cost_price': float(p.cost_price) if p.cost_price else 0.0,
                'stock_quantity': p.stock_quantity,
                'total_value': total_value,
                'formatted_value': f"${total_value:,.2f}",
                'category_name': p.category_name
            })

        return top_products

    @staticmethod
    def save_snapshot(trigger_reason='scheduled'):
        """
        US-INV-005 CA-4: Guarda un snapshot del valor actual del inventario

        Args:
            trigger_reason: Razón del snapshot ('scheduled', 'significant_change', 'manual')

        Returns:
            InventoryValueHistory: Instancia guardada
        """
        # Calcular valor actual
        current_value = InventoryValueService.calculate_total_value()

        # Contar categorías con stock
        categories_count = db.session.query(
            func.count(func.distinct(Product.category_id))
        ).filter(
            and_(
                Product.stock_quantity > 0,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).scalar() or 0

        # Crear snapshot
        snapshot = InventoryValueHistory(
            snapshot_date=datetime.utcnow(),
            total_value=current_value['total_value'],
            total_products=current_value['total_products'],
            total_quantity=current_value['total_quantity'],
            categories_count=categories_count,
            trigger_reason=trigger_reason
        )

        db.session.add(snapshot)
        db.session.commit()

        return snapshot

    @staticmethod
    def get_value_evolution(period='7d', date_from=None, date_to=None):
        """
        US-INV-005 CA-4: Obtiene la evolución del valor del inventario en el tiempo

        Args:
            period: Período predefinido ('7d', '30d', '3m', '1y') o 'custom'
            date_from: Fecha inicial (para período custom)
            date_to: Fecha final (para período custom)

        Returns:
            list: [
                {
                    'snapshot_date': str (ISO),
                    'total_value': float,
                    'total_products': int,
                    'total_quantity': int,
                    'formatted_value': str
                },
                ...
            ]
        """
        # Calcular fechas según período
        if period == 'custom' and date_from and date_to:
            start_date = datetime.fromisoformat(date_from)
            end_date = datetime.fromisoformat(date_to)
        else:
            end_date = datetime.utcnow()
            if period == '7d':
                start_date = end_date - timedelta(days=7)
            elif period == '30d':
                start_date = end_date - timedelta(days=30)
            elif period == '3m':
                start_date = end_date - timedelta(days=90)
            elif period == '1y':
                start_date = end_date - timedelta(days=365)
            else:
                start_date = end_date - timedelta(days=7)  # Default

        # Obtener snapshots en el rango
        snapshots = InventoryValueHistory.query.filter(
            and_(
                InventoryValueHistory.snapshot_date >= start_date,
                InventoryValueHistory.snapshot_date <= end_date
            )
        ).order_by(
            InventoryValueHistory.snapshot_date.asc()
        ).all()

        evolution = []
        for snapshot in snapshots:
            total_value = float(snapshot.total_value) if snapshot.total_value else 0.0

            evolution.append({
                'snapshot_date': snapshot.snapshot_date.isoformat(),
                'total_value': total_value,
                'total_products': snapshot.total_products,
                'total_quantity': snapshot.total_quantity,
                'formatted_value': f"${total_value:,.2f}"
            })

        return evolution

    @staticmethod
    def calculate_inventory_metrics():
        """
        US-INV-005 CA-5: Calcula métricas adicionales del inventario

        Returns:
            dict: {
                'inventory_turnover': float (rotación de inventario),
                'days_of_inventory': float (días de inventario),
                'top_categories': list (top 5 categorías por valor),
                'stock_distribution': dict (distribución por estado de stock)
            }
        """
        # Para calcular rotación necesitaríamos datos de ventas
        # Por ahora retornamos None o 0 para estas métricas
        # Se implementarán cuando tengamos el módulo de ventas (Epic 4)

        # Top 5 categorías
        top_categories = InventoryValueService.get_value_by_category()[:5]

        # Distribución de stock por estado
        stock_distribution = db.session.query(
            func.count(Product.id).label('count'),
            func.sum(
                db.case(
                    (Product.stock_quantity == 0, 1),
                    else_=0
                )
            ).label('out_of_stock'),
            func.sum(
                db.case(
                    (and_(Product.stock_quantity > 0, Product.stock_quantity <= Product.reorder_point), 1),
                    else_=0
                )
            ).label('low_stock'),
            func.sum(
                db.case(
                    (Product.stock_quantity > Product.reorder_point, 1),
                    else_=0
                )
            ).label('normal_stock')
        ).filter(
            and_(
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).first()

        return {
            'inventory_turnover': None,  # Se implementará con módulo de ventas
            'days_of_inventory': None,  # Se implementará con módulo de ventas
            'top_categories': top_categories,
            'stock_distribution': {
                'out_of_stock': int(stock_distribution.out_of_stock or 0),
                'low_stock': int(stock_distribution.low_stock or 0),
                'normal_stock': int(stock_distribution.normal_stock or 0),
                'total': int(stock_distribution.count or 0)
            }
        }

    @staticmethod
    def get_value_change_from_previous_period(period='7d'):
        """
        US-INV-005 CA-2: Calcula el cambio de valor vs período anterior

        Args:
            period: Período para comparar ('7d', '30d', '3m', '1y')

        Returns:
            dict: {
                'current_value': float,
                'previous_value': float,
                'change_amount': float,
                'change_percentage': float,
                'direction': str ('increase', 'decrease', 'no_change')
            }
        """
        # Valor actual
        current_value_data = InventoryValueService.calculate_total_value()
        current_value = current_value_data['total_value']

        # Calcular fecha del snapshot anterior
        if period == '7d':
            days_ago = 7
        elif period == '30d':
            days_ago = 30
        elif period == '3m':
            days_ago = 90
        elif period == '1y':
            days_ago = 365
        else:
            days_ago = 7

        target_date = datetime.utcnow() - timedelta(days=days_ago)

        # Buscar el snapshot más cercano a la fecha objetivo
        previous_snapshot = InventoryValueHistory.query.filter(
            InventoryValueHistory.snapshot_date <= target_date
        ).order_by(
            InventoryValueHistory.snapshot_date.desc()
        ).first()

        if previous_snapshot:
            previous_value = float(previous_snapshot.total_value) if previous_snapshot.total_value else 0.0
        else:
            previous_value = 0.0

        # Calcular cambio
        change_amount = current_value - previous_value
        change_amount = round(change_amount, 2)

        # Calcular porcentaje de cambio
        if previous_value > 0:
            change_percentage = (change_amount / previous_value) * 100
            change_percentage = round(change_percentage, 2)
        else:
            change_percentage = 0.0

        # Determinar dirección
        if change_amount > 0:
            direction = 'increase'
        elif change_amount < 0:
            direction = 'decrease'
        else:
            direction = 'no_change'

        return {
            'current_value': current_value,
            'previous_value': previous_value,
            'change_amount': change_amount,
            'change_percentage': change_percentage,
            'direction': direction,
            'formatted_current': f"${current_value:,.2f}",
            'formatted_previous': f"${previous_value:,.2f}",
            'formatted_change': f"${abs(change_amount):,.2f}"
        }
