"""
Servicio para Configuración de Puntos de Reorden
US-INV-004 CA-4 y CA-5: Configuración masiva y sugerencias inteligentes
"""
from app import db
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from datetime import datetime, timedelta
from sqlalchemy import func, and_
import math


class ReorderPointService:
    """
    Servicio para gestionar configuraciones de puntos de reorden

    Funcionalidades:
    - Configuración masiva por categoría
    - Sugerencias inteligentes basadas en histórico de ventas
    - Validaciones de puntos de reorden
    """

    @staticmethod
    def calculate_suggested_reorder_point(product_id, lead_time_days=7, safety_stock_days=3):
        """
        US-INV-004 CA-5: Calcular sugerencia de punto de reorden

        Fórmula: (Ventas promedio diarias × Días de reabastecimiento) + Stock de seguridad

        Args:
            product_id: ID del producto
            lead_time_days: Tiempo de reabastecimiento en días (default: 7)
            safety_stock_days: Días de stock de seguridad adicional (default: 3)

        Returns:
            dict: {
                'suggested_reorder_point': int,
                'average_daily_sales': float,
                'lead_time_days': int,
                'safety_stock': int,
                'calculation_details': str
            }
        """
        # Obtener producto
        product = Product.query.get(product_id)
        if not product:
            return None

        # Calcular ventas de los últimos 30 días
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        # Obtener movimientos de tipo 'venta' (cantidad negativa)
        sales_movements = InventoryMovement.query.filter(
            and_(
                InventoryMovement.product_id == product_id,
                InventoryMovement.movement_type == 'venta',
                InventoryMovement.created_at >= thirty_days_ago
            )
        ).all()

        # Calcular total de unidades vendidas (tomar valor absoluto)
        total_sold = sum(abs(movement.quantity) for movement in sales_movements)

        # Calcular promedio diario
        average_daily_sales = total_sold / 30 if total_sold > 0 else 0

        # Calcular stock de seguridad
        safety_stock = math.ceil(average_daily_sales * safety_stock_days)

        # Calcular punto de reorden sugerido
        suggested_reorder_point = math.ceil(
            (average_daily_sales * lead_time_days) + safety_stock
        )

        # Asegurar que no sea menor a 1 si hay ventas
        if average_daily_sales > 0 and suggested_reorder_point < 1:
            suggested_reorder_point = 1

        # Si no hay ventas históricas, sugerir un valor base
        if average_daily_sales == 0:
            suggested_reorder_point = 10  # Valor default

        calculation_details = (
            f"Ventas promedio diarias: {average_daily_sales:.2f} unidades\n"
            f"Tiempo de reabastecimiento: {lead_time_days} días\n"
            f"Stock de seguridad: {safety_stock} unidades ({safety_stock_days} días)\n"
            f"Fórmula: ({average_daily_sales:.2f} × {lead_time_days}) + {safety_stock} = {suggested_reorder_point}"
        )

        return {
            'product_id': product_id,
            'product_name': product.name,
            'suggested_reorder_point': suggested_reorder_point,
            'average_daily_sales': round(average_daily_sales, 2),
            'lead_time_days': lead_time_days,
            'safety_stock': safety_stock,
            'safety_stock_days': safety_stock_days,
            'total_sold_last_30_days': total_sold,
            'calculation_details': calculation_details,
            'current_reorder_point': product.reorder_point
        }

    @staticmethod
    def bulk_update_reorder_points_by_category(
        category_id,
        reorder_point,
        overwrite_existing=True,
        user_id=None
    ):
        """
        US-INV-004 CA-4: Actualizar puntos de reorden masivamente por categoría

        Args:
            category_id: ID de la categoría
            reorder_point: Nuevo punto de reorden
            overwrite_existing: Si True, sobrescribe todos los productos.
                               Si False, solo actualiza productos con valor default (10)
            user_id: ID del usuario que realiza la operación (opcional)

        Returns:
            dict: {
                'success': bool,
                'products_updated': int,
                'products_skipped': int,
                'products': [...]
            }
        """
        # Validar punto de reorden
        if not isinstance(reorder_point, int) or reorder_point < 0:
            return {
                'success': False,
                'error': 'Punto de reorden debe ser un número entero positivo o cero'
            }

        if reorder_point > 10000:
            return {
                'success': False,
                'error': 'Punto de reorden no puede ser mayor a 10,000 unidades'
            }

        # Obtener productos de la categoría
        query = Product.query.filter(
            Product.category_id == category_id,
            Product.is_active == True,
            Product.deleted_at.is_(None)
        )

        if not overwrite_existing:
            # Solo productos con punto de reorden default (10)
            query = query.filter(Product.reorder_point == 10)

        products = query.all()

        if not products:
            return {
                'success': False,
                'error': 'No se encontraron productos para actualizar en esta categoría'
            }

        # Actualizar productos
        updated_products = []
        skipped_products = []

        for product in products:
            old_reorder_point = product.reorder_point

            if not overwrite_existing and old_reorder_point != 10:
                skipped_products.append({
                    'id': product.id,
                    'name': product.name,
                    'sku': product.sku,
                    'reason': 'Ya tiene punto de reorden personalizado'
                })
                continue

            product.reorder_point = reorder_point
            updated_products.append({
                'id': product.id,
                'name': product.name,
                'sku': product.sku,
                'old_reorder_point': old_reorder_point,
                'new_reorder_point': reorder_point
            })

        # Guardar cambios
        try:
            db.session.commit()
            return {
                'success': True,
                'products_updated': len(updated_products),
                'products_skipped': len(skipped_products),
                'updated_products': updated_products,
                'skipped_products': skipped_products
            }
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': f'Error al actualizar productos: {str(e)}'
            }

    @staticmethod
    def get_products_by_category_for_preview(category_id):
        """
        US-INV-004 CA-4: Obtener productos de una categoría para preview

        Args:
            category_id: ID de la categoría

        Returns:
            list: Lista de productos con información básica
        """
        products = Product.query.filter(
            Product.category_id == category_id,
            Product.is_active == True,
            Product.deleted_at.is_(None)
        ).all()

        return [{
            'id': product.id,
            'name': product.name,
            'sku': product.sku,
            'current_reorder_point': product.reorder_point,
            'stock_quantity': product.stock_quantity,
            'stock_status': product.get_stock_status()
        } for product in products]

    @staticmethod
    def validate_reorder_point(reorder_point, stock_quantity=None):
        """
        US-INV-004 CA-6: Validar punto de reorden

        Args:
            reorder_point: Valor a validar
            stock_quantity: Stock actual (opcional)

        Returns:
            dict: {
                'valid': bool,
                'error': str (si no es válido),
                'warning': str (si tiene advertencias)
            }
        """
        result = {'valid': True, 'error': None, 'warning': None}

        # Validar tipo
        if not isinstance(reorder_point, int):
            try:
                reorder_point = int(reorder_point)
            except (ValueError, TypeError):
                result['valid'] = False
                result['error'] = 'Punto de reorden debe ser un número entero'
                return result

        # Validar rango
        if reorder_point < 0:
            result['valid'] = False
            result['error'] = 'Punto de reorden no puede ser negativo'
            return result

        if reorder_point > 10000:
            result['valid'] = False
            result['error'] = 'Punto de reorden no puede ser mayor a 10,000 unidades'
            return result

        # Warning si es 0
        if reorder_point == 0:
            result['warning'] = 'No recibirás alertas de reorden para este producto'

        # Validar contra stock actual
        if stock_quantity is not None and reorder_point >= stock_quantity:
            result['warning'] = 'El stock actual ya está por debajo del punto de reorden'

        return result

    @staticmethod
    def get_products_at_or_below_reorder_point():
        """
        Obtener productos que están en o debajo del punto de reorden

        Returns:
            list: Lista de productos con información relevante
        """
        products = Product.query.filter(
            Product.stock_quantity <= Product.reorder_point,
            Product.is_active == True,
            Product.deleted_at.is_(None)
        ).all()

        return [{
            'id': product.id,
            'name': product.name,
            'sku': product.sku,
            'stock_quantity': product.stock_quantity,
            'reorder_point': product.reorder_point,
            'difference': product.reorder_point - product.stock_quantity,
            'stock_status': product.get_stock_status(),
            'category': product.category.name if product.category else None
        } for product in products]
