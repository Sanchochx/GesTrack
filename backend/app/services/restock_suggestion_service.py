"""
Servicio de Sugerencias de Reabastecimiento
US-SUPP-015: Notificaciones de Reabastecimiento
"""
import math
from datetime import datetime, timedelta
from app import db
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.models.supplier_product import SupplierProduct
from app.models.restock_suggestion_dismissal import RestockSuggestionDismissal

# CA-4: Ventana de días usada para calcular el promedio de ventas diarias
SALES_LOOKBACK_DAYS = 30


class RestockSuggestionService:
    """Lógica de negocio para sugerencias de reabastecimiento"""

    @staticmethod
    def _average_daily_sales(product_id):
        """
        CA-4: Promedio de ventas diarias de un producto en los últimos
        SALES_LOOKBACK_DAYS días, a partir de los movimientos de inventario
        generados al crear pedidos ('order_reservation').
        """
        since = datetime.utcnow() - timedelta(days=SALES_LOOKBACK_DAYS)
        total_sold = db.session.query(
            db.func.coalesce(db.func.sum(-InventoryMovement.quantity), 0)
        ).filter(
            InventoryMovement.product_id == product_id,
            InventoryMovement.movement_type == 'order_reservation',
            InventoryMovement.created_at >= since,
            InventoryMovement.quantity < 0,
        ).scalar()

        return float(total_sold) / SALES_LOOKBACK_DAYS if total_sold else 0.0

    @staticmethod
    def _suggested_quantity(product, average_daily_sales):
        """
        CA-4: Cantidad sugerida — cubre la demanda proyectada de un mes según
        el promedio de ventas, con un mínimo para volver a superar el punto
        de reorden.
        """
        demand_based = math.ceil(average_daily_sales * SALES_LOOKBACK_DAYS) - product.stock_quantity
        reorder_based = product.reorder_point - product.stock_quantity
        return max(1, demand_based, reorder_based)

    @staticmethod
    def _preferred_supplier_info(product_id):
        """CA-3: Proveedor preferido sugerido para el producto (si existe)"""
        link = SupplierProduct.query.filter_by(product_id=product_id, is_preferred=True).first()
        if not link:
            # Si no hay un preferido explícito, sugerir el primer proveedor vinculado
            link = SupplierProduct.query.filter_by(product_id=product_id).first()
        if not link:
            return None

        return {
            'supplier_id': link.supplier_id,
            'supplier_name': link.supplier.company_name if link.supplier else None,
            'is_preferred': link.is_preferred,
            'preferential_price': float(link.preferential_price) if link.preferential_price is not None else None,
        }

    @staticmethod
    def get_suggestions(include_dismissed=False):
        """
        CA-1/CA-2/CA-3/CA-4: Genera la lista de sugerencias de reabastecimiento
        para productos activos con stock en o por debajo del punto de reorden.

        Args:
            include_dismissed: si es True, incluye también las sugerencias ya
                procesadas (marcadas con `is_dismissed=True` en la respuesta)

        Returns:
            list[dict]: sugerencias, más urgentes primero (menor stock relativo)
        """
        products = Product.query.filter(
            Product.is_active.is_(True),
            Product.deleted_at.is_(None),
            Product.stock_quantity <= Product.reorder_point,
        ).all()

        dismissals = {
            d.product_id: d
            for d in RestockSuggestionDismissal.query.filter(
                RestockSuggestionDismissal.product_id.in_([p.id for p in products])
            ).all()
        } if products else {}

        suggestions = []
        for product in products:
            dismissal = dismissals.get(product.id)
            # CA-7: la sugerencia reaparece si el stock empeoró desde que se procesó
            is_dismissed = bool(dismissal) and product.stock_quantity >= dismissal.stock_quantity_at_dismissal
            if is_dismissed and not include_dismissed:
                continue

            avg_daily_sales = RestockSuggestionService._average_daily_sales(product.id)
            suggestions.append({
                'product_id': product.id,
                'product_name': product.name,
                'product_sku': product.sku,
                'stock_quantity': product.stock_quantity,
                'reorder_point': product.reorder_point,
                'is_out_of_stock': product.is_out_of_stock(),
                'average_daily_sales': round(avg_daily_sales, 2),
                'suggested_quantity': RestockSuggestionService._suggested_quantity(product, avg_daily_sales),
                'preferred_supplier': RestockSuggestionService._preferred_supplier_info(product.id),
                'is_dismissed': is_dismissed,
                'dismissed_at': dismissal.dismissed_at.isoformat() if dismissal else None,
            })

        # Más urgentes primero: menor stock respecto al punto de reorden
        suggestions.sort(key=lambda s: s['stock_quantity'] - s['reorder_point'])
        return suggestions

    @staticmethod
    def dismiss_suggestion(product_id, user_id):
        """
        CA-7: Marca la sugerencia de un producto como procesada.

        Returns:
            RestockSuggestionDismissal: registro creado/actualizado

        Raises:
            ValueError: si el producto no existe
        """
        product = Product.query.get(product_id)
        if not product:
            raise ValueError('El producto no existe')

        dismissal = RestockSuggestionDismissal.query.filter_by(product_id=product_id).first()
        if dismissal:
            dismissal.stock_quantity_at_dismissal = product.stock_quantity
            dismissal.dismissed_by_id = user_id
            dismissal.dismissed_at = datetime.utcnow()
        else:
            dismissal = RestockSuggestionDismissal(
                product_id=product_id,
                dismissed_by_id=user_id,
                stock_quantity_at_dismissal=product.stock_quantity,
            )
            db.session.add(dismissal)

        db.session.commit()
        return dismissal

    @staticmethod
    def undismiss_suggestion(product_id):
        """CA-7: Vuelve a mostrar una sugerencia previamente procesada"""
        dismissal = RestockSuggestionDismissal.query.filter_by(product_id=product_id).first()
        if not dismissal:
            return False

        db.session.delete(dismissal)
        db.session.commit()
        return True
