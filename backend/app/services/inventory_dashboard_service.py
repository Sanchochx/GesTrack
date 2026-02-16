"""
Servicio para el Dashboard de Inventario

US-INV-010: Dashboard de Inventario
- CA-1: KPIs principales
- CA-3: Top 10 productos con menor stock
- CA-7: Estadísticas adicionales
"""
from app import db
from app.models.product import Product
from app.models.category import Category
from app.models.inventory_movement import InventoryMovement
from sqlalchemy import func, and_, case
from datetime import datetime, timedelta


class InventoryDashboardService:

    @staticmethod
    def get_kpis():
        """
        US-INV-010 CA-1: Métricas principales del dashboard

        Returns:
            dict con total_products, total_value, low_stock_count,
            out_of_stock_count y cambios vs período anterior
        """
        # KPIs actuales
        result = db.session.query(
            func.count(Product.id).label('total_products'),
            func.coalesce(func.sum(Product.cost_price * Product.stock_quantity), 0).label('total_value'),
            func.coalesce(func.sum(Product.stock_quantity), 0).label('total_units'),
            func.count(case(
                (and_(
                    Product.stock_quantity <= Product.reorder_point,
                    Product.stock_quantity > 0
                ), Product.id)
            )).label('low_stock_count'),
            func.count(case(
                (Product.stock_quantity == 0, Product.id)
            )).label('out_of_stock_count')
        ).filter(
            and_(
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).first()

        total_products = result.total_products or 0
        total_value = round(float(result.total_value or 0), 2)
        total_units = int(result.total_units or 0)
        low_stock_count = int(result.low_stock_count or 0)
        out_of_stock_count = int(result.out_of_stock_count or 0)

        # Cambios vs mes anterior: contar productos creados en último mes
        one_month_ago = datetime.utcnow() - timedelta(days=30)
        new_products = Product.query.filter(
            and_(
                Product.is_active == True,
                Product.deleted_at.is_(None),
                Product.created_at >= one_month_ago
            )
        ).count()

        # Movimientos del último mes para tendencia
        movements_count = InventoryMovement.query.filter(
            InventoryMovement.created_at >= one_month_ago
        ).count()

        return {
            'total_products': total_products,
            'new_products_30d': new_products,
            'total_value': total_value,
            'formatted_value': f"${total_value:,.2f}",
            'total_units': total_units,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'movements_30d': movements_count,
            'calculated_at': datetime.utcnow().isoformat()
        }

    @staticmethod
    def get_low_stock_top(limit=10):
        """
        US-INV-010 CA-3: Top productos con menor stock

        Ordenados por diferencia entre stock actual y punto de reorden (más críticos primero)
        """
        products = db.session.query(
            Product.id,
            Product.sku,
            Product.name,
            Product.stock_quantity,
            Product.reorder_point,
            Product.min_stock_level,
            Product.cost_price,
            Product.sale_price,
            Product.image_url,
            Category.name.label('category_name')
        ).outerjoin(
            Category, Product.category_id == Category.id
        ).filter(
            and_(
                Product.is_active == True,
                Product.deleted_at.is_(None),
                Product.stock_quantity > 0
            )
        ).order_by(
            Product.stock_quantity.asc(),
            Product.reorder_point.desc()
        ).limit(limit).all()

        result = []
        for p in products:
            stock_status = 'normal'
            if p.stock_quantity <= p.reorder_point:
                stock_status = 'low_stock'

            result.append({
                'id': p.id,
                'sku': p.sku,
                'name': p.name,
                'stock_quantity': p.stock_quantity,
                'reorder_point': p.reorder_point,
                'min_stock_level': p.min_stock_level,
                'cost_price': float(p.cost_price) if p.cost_price else 0,
                'sale_price': float(p.sale_price) if p.sale_price else 0,
                'image_url': p.image_url,
                'category_name': p.category_name or 'Sin categoría',
                'stock_status': stock_status,
                'stock_deficit': max(0, p.reorder_point - p.stock_quantity)
            })

        return result

    @staticmethod
    def get_additional_stats(days=30):
        """
        US-INV-010 CA-7: Estadísticas adicionales

        Returns:
            dict con rotación, días de inventario, movimientos totales, productos inactivos
        """
        now = datetime.utcnow()
        period_start = now - timedelta(days=days)

        # Movimientos totales del período
        movements_total = InventoryMovement.query.filter(
            InventoryMovement.created_at >= period_start
        ).count()

        # Movimientos por tipo
        movements_by_type = db.session.query(
            InventoryMovement.movement_type,
            func.count(InventoryMovement.id).label('count'),
            func.coalesce(func.sum(func.abs(InventoryMovement.quantity)), 0).label('total_units')
        ).filter(
            InventoryMovement.created_at >= period_start
        ).group_by(
            InventoryMovement.movement_type
        ).all()

        type_stats = {}
        for m in movements_by_type:
            type_stats[m.movement_type] = {
                'count': m.count,
                'total_units': int(m.total_units)
            }

        # Productos sin movimientos en 90+ días (inactivos)
        ninety_days_ago = now - timedelta(days=90)
        products_with_recent_movements = db.session.query(
            InventoryMovement.product_id
        ).filter(
            InventoryMovement.created_at >= ninety_days_ago
        ).distinct().subquery()

        inactive_products = Product.query.filter(
            and_(
                Product.is_active == True,
                Product.deleted_at.is_(None),
                ~Product.id.in_(
                    db.session.query(products_with_recent_movements.c.product_id)
                )
            )
        ).count()

        # Valor total actual para referencia
        total_value_result = db.session.query(
            func.coalesce(func.sum(Product.cost_price * Product.stock_quantity), 0)
        ).filter(
            and_(
                Product.is_active == True,
                Product.deleted_at.is_(None),
                Product.stock_quantity > 0
            )
        ).scalar()

        total_value = round(float(total_value_result or 0), 2)

        # Promedio de movimientos diarios
        avg_daily_movements = round(movements_total / max(days, 1), 1)

        return {
            'period_days': days,
            'movements_total': movements_total,
            'movements_by_type': type_stats,
            'avg_daily_movements': avg_daily_movements,
            'inactive_products_90d': inactive_products,
            'total_inventory_value': total_value,
            'calculated_at': now.isoformat()
        }
