"""
Servicio de Alertas de Stock Crítico

US-INV-007: Alerta de Stock Crítico
- CA-1: Detección automática de stock cero
- CA-8: Resolución automática de alertas
"""
from app import db
from app.models.inventory_alert import InventoryAlert
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from datetime import datetime
from sqlalchemy import func


class CriticalStockAlertService:
    """
    Servicio para gestionar alertas de stock crítico (stock = 0)

    Funcionalidades:
    - Crear alertas automáticamente cuando stock llega a 0
    - Resolver alertas cuando stock se recupera
    - Obtener productos sin stock con información relevante
    - Métricas de alertas activas
    """

    ALERT_TYPE_OUT_OF_STOCK = 'out_of_stock'

    @staticmethod
    def check_and_create_alert(product_id, previous_stock, new_stock, user_id=None):
        """
        Verifica si se debe crear una alerta de stock cero (CA-1)

        Se crea una alerta cuando:
        - El stock anterior era > 0 Y el nuevo stock es 0

        Args:
            product_id: ID del producto
            previous_stock: Stock antes del cambio
            new_stock: Stock después del cambio
            user_id: ID del usuario que causó el cambio (opcional)

        Returns:
            InventoryAlert o None: La alerta creada o None si no aplica
        """
        # Solo crear alerta si el stock llega a 0 desde un valor positivo
        if previous_stock > 0 and new_stock == 0:
            product = Product.query.get(product_id)
            if not product:
                return None

            # Verificar si ya existe una alerta activa para este producto
            existing_alert = InventoryAlert.query.filter_by(
                product_id=product_id,
                alert_type=CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
                is_active=True
            ).first()

            if existing_alert:
                return existing_alert

            # Crear nueva alerta
            alert = InventoryAlert(
                product_id=product_id,
                alert_type=CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
                current_stock=0,
                reorder_point=product.reorder_point,
                is_active=True
            )

            db.session.add(alert)
            db.session.commit()

            return alert

        return None

    @staticmethod
    def check_and_resolve_alert(product_id, previous_stock, new_stock):
        """
        Verifica si se debe resolver una alerta de stock cero (CA-8)

        Se resuelve una alerta cuando:
        - El stock anterior era 0 Y el nuevo stock es > 0

        Args:
            product_id: ID del producto
            previous_stock: Stock antes del cambio
            new_stock: Stock después del cambio

        Returns:
            int: Número de alertas resueltas
        """
        # Solo resolver si el stock se recupera desde 0
        if previous_stock == 0 and new_stock > 0:
            alerts = InventoryAlert.query.filter_by(
                product_id=product_id,
                alert_type=CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
                is_active=True
            ).all()

            resolved_count = 0
            for alert in alerts:
                alert.is_active = False
                alert.resolved_at = datetime.utcnow()
                resolved_count += 1

            if resolved_count > 0:
                db.session.commit()

            return resolved_count

        return 0

    @staticmethod
    def get_out_of_stock_products(page=1, per_page=20, sort_by='created_at', sort_order='asc'):
        """
        Obtiene todos los productos sin stock con información relevante (CA-4)

        Args:
            page: Número de página
            per_page: Productos por página
            sort_by: Campo para ordenar ('created_at', 'product_name', 'category')
            sort_order: Dirección ('asc', 'desc')

        Returns:
            dict: Datos paginados de productos sin stock
        """
        from app.models.category import Category

        # Query base: productos activos con stock = 0
        query = db.session.query(
            Product,
            InventoryAlert.created_at.label('out_of_stock_since'),
            Category.name.label('category_name')
        ).outerjoin(
            InventoryAlert,
            db.and_(
                InventoryAlert.product_id == Product.id,
                InventoryAlert.alert_type == CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
                InventoryAlert.is_active == True
            )
        ).join(
            Category, Product.category_id == Category.id
        ).filter(
            Product.stock_quantity == 0,
            Product.is_active == True
        )

        # Aplicar ordenamiento
        if sort_by == 'product_name':
            order_col = Product.name
        elif sort_by == 'category':
            order_col = Category.name
        elif sort_by == 'sku':
            order_col = Product.sku
        else:  # created_at por defecto
            order_col = InventoryAlert.created_at

        if sort_order == 'desc':
            query = query.order_by(order_col.desc().nullslast())
        else:
            query = query.order_by(order_col.asc().nullsfirst())

        # Paginación
        total = query.count()
        products_data = query.offset((page - 1) * per_page).limit(per_page).all()

        # Formatear resultados
        results = []
        for product, out_of_stock_since, category_name in products_data:
            # Obtener último movimiento que causó stock 0
            last_movement = InventoryMovement.query.filter_by(
                product_id=product.id
            ).filter(
                InventoryMovement.new_stock == 0
            ).order_by(
                InventoryMovement.created_at.desc()
            ).first()

            product_data = {
                'id': product.id,
                'sku': product.sku,
                'name': product.name,
                'image_url': product.image_url,
                'category_id': product.category_id,
                'category_name': category_name,
                'reorder_point': product.reorder_point,
                'cost_price': float(product.cost_price) if product.cost_price else 0,
                'sale_price': float(product.sale_price) if product.sale_price else 0,
                'out_of_stock_since': out_of_stock_since.isoformat() if out_of_stock_since else None,
                'last_movement': last_movement.to_dict() if last_movement else None,
            }
            results.append(product_data)

        return {
            'products': results,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }

    @staticmethod
    def get_out_of_stock_count():
        """
        Obtiene el conteo de productos sin stock (CA-2)

        Returns:
            int: Número de productos sin stock
        """
        return Product.query.filter(
            Product.stock_quantity == 0,
            Product.is_active == True
        ).count()

    @staticmethod
    def get_active_alerts_count():
        """
        Obtiene el conteo de alertas activas de stock cero

        Returns:
            int: Número de alertas activas
        """
        return InventoryAlert.query.filter_by(
            alert_type=CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
            is_active=True
        ).count()

    @staticmethod
    def get_alert_statistics():
        """
        Obtiene estadísticas de alertas de stock crítico (CA-8)

        Returns:
            dict: Estadísticas de alertas
        """
        # Alertas activas
        active_count = InventoryAlert.query.filter_by(
            alert_type=CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
            is_active=True
        ).count()

        # Alertas resueltas (últimos 30 días)
        thirty_days_ago = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        thirty_days_ago = thirty_days_ago.replace(day=thirty_days_ago.day - 30 if thirty_days_ago.day > 30 else 1)

        resolved_count = InventoryAlert.query.filter(
            InventoryAlert.alert_type == CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
            InventoryAlert.is_active == False,
            InventoryAlert.resolved_at >= thirty_days_ago
        ).count()

        # Tiempo promedio en stock 0 (alertas resueltas)
        resolved_alerts = InventoryAlert.query.filter(
            InventoryAlert.alert_type == CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
            InventoryAlert.is_active == False,
            InventoryAlert.resolved_at.isnot(None)
        ).all()

        avg_time_hours = 0
        if resolved_alerts:
            total_hours = sum(
                (alert.resolved_at - alert.created_at).total_seconds() / 3600
                for alert in resolved_alerts
            )
            avg_time_hours = round(total_hours / len(resolved_alerts), 1)

        return {
            'active_alerts': active_count,
            'resolved_last_30_days': resolved_count,
            'avg_resolution_time_hours': avg_time_hours,
            'out_of_stock_products': CriticalStockAlertService.get_out_of_stock_count()
        }

    @staticmethod
    def get_alerts_history(page=1, per_page=20, include_resolved=True):
        """
        Obtiene historial de alertas de stock crítico

        Args:
            page: Número de página
            per_page: Alertas por página
            include_resolved: Si incluir alertas resueltas

        Returns:
            dict: Historial paginado de alertas
        """
        query = InventoryAlert.query.filter_by(
            alert_type=CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK
        )

        if not include_resolved:
            query = query.filter_by(is_active=True)

        query = query.order_by(InventoryAlert.created_at.desc())

        total = query.count()
        alerts = query.offset((page - 1) * per_page).limit(per_page).all()

        return {
            'alerts': [alert.to_dict() for alert in alerts],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': (total + per_page - 1) // per_page
            }
        }

    @staticmethod
    def sync_existing_out_of_stock_products():
        """
        Sincroniza productos existentes sin stock que no tienen alerta (migración)

        Útil para crear alertas para productos que ya estaban en stock 0
        antes de implementar esta funcionalidad.

        Returns:
            int: Número de alertas creadas
        """
        # Obtener productos sin stock que no tienen alerta activa
        products_without_alerts = db.session.query(Product).outerjoin(
            InventoryAlert,
            db.and_(
                InventoryAlert.product_id == Product.id,
                InventoryAlert.alert_type == CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
                InventoryAlert.is_active == True
            )
        ).filter(
            Product.stock_quantity == 0,
            Product.is_active == True,
            InventoryAlert.id.is_(None)
        ).all()

        alerts_created = 0
        for product in products_without_alerts:
            alert = InventoryAlert(
                product_id=product.id,
                alert_type=CriticalStockAlertService.ALERT_TYPE_OUT_OF_STOCK,
                current_stock=0,
                reorder_point=product.reorder_point,
                is_active=True
            )
            db.session.add(alert)
            alerts_created += 1

        if alerts_created > 0:
            db.session.commit()

        return alerts_created
