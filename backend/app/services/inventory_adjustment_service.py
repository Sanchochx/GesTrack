"""
Servicio para ajustes manuales de inventario

US-INV-002: Ajustes Manuales de Inventario
- CA-3: Validaciones
- CA-5: Registro en Historial
- CA-6: Actualización de Valor de Inventario
"""
from app import db
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from app.services.stock_service import StockService
from app.utils.constants import (
    ADJUSTMENT_TYPES,
    MOVEMENT_TYPES,
    SIGNIFICANT_ADJUSTMENT_THRESHOLD,
    NOTIFICATION_THRESHOLD,
    MIN_REASON_LENGTH,
    MAX_REASON_LENGTH
)
from datetime import datetime


class AdjustmentValidationError(Exception):
    """Excepción para errores de validación de ajustes"""
    pass


class InventoryAdjustmentService:
    """
    Servicio para manejar ajustes manuales de inventario
    """

    @staticmethod
    def validate_adjustment(product, adjustment_type, quantity, reason):
        """
        Valida un ajuste de inventario antes de aplicarlo (CA-3)

        Args:
            product: Instancia del producto
            adjustment_type: 'increase' o 'decrease'
            quantity: Cantidad del ajuste (debe ser positiva)
            reason: Motivo del ajuste

        Raises:
            AdjustmentValidationError: Si la validación falla
        """
        # CA-3: La cantidad debe ser mayor a 0
        if quantity <= 0:
            raise AdjustmentValidationError(
                "La cantidad de ajuste debe ser mayor a 0"
            )

        # CA-3: El motivo es obligatorio
        if not reason or not reason.strip():
            raise AdjustmentValidationError(
                "El motivo del ajuste es obligatorio"
            )

        # CA-3: Mínimo 10 caracteres para texto libre
        if len(reason.strip()) < MIN_REASON_LENGTH:
            raise AdjustmentValidationError(
                f"El motivo debe tener al menos {MIN_REASON_LENGTH} caracteres"
            )

        # Máximo de caracteres
        if len(reason) > MAX_REASON_LENGTH:
            raise AdjustmentValidationError(
                f"El motivo no puede exceder {MAX_REASON_LENGTH} caracteres"
            )

        # Calcular nuevo stock
        current_stock = product.stock_quantity
        if adjustment_type == ADJUSTMENT_TYPES['DECREASE']:
            new_stock = current_stock - quantity
        else:
            new_stock = current_stock + quantity

        # CA-3: No se permite stock negativo resultante
        if new_stock < 0:
            raise AdjustmentValidationError(
                f"El ajuste resultaría en stock negativo. "
                f"Stock actual: {current_stock}, cantidad a disminuir: {quantity}"
            )

        return True

    @staticmethod
    def requires_double_confirmation(product, adjustment_type, quantity):
        """
        Verifica si el ajuste requiere doble confirmación (CA-3)

        Args:
            product: Instancia del producto
            adjustment_type: 'increase' o 'decrease'
            quantity: Cantidad del ajuste

        Returns:
            bool: True si requiere doble confirmación
        """
        current_stock = product.stock_quantity

        # CA-3: Si la disminución es >50% del stock actual
        if adjustment_type == ADJUSTMENT_TYPES['DECREASE']:
            if current_stock > 0 and (quantity / current_stock) > SIGNIFICANT_ADJUSTMENT_THRESHOLD:
                return True

        return False

    @staticmethod
    def is_significant_adjustment(product, quantity):
        """
        Verifica si el ajuste es significativo (>20% del stock) - CA-7

        Args:
            product: Instancia del producto
            quantity: Cantidad del ajuste

        Returns:
            bool: True si es significativo
        """
        current_stock = product.stock_quantity
        if current_stock > 0:
            return (abs(quantity) / current_stock) > NOTIFICATION_THRESHOLD
        return False

    @staticmethod
    def calculate_inventory_value_impact(product, quantity, adjustment_type):
        """
        Calcula el impacto monetario del ajuste (CA-6)

        Args:
            product: Instancia del producto
            quantity: Cantidad del ajuste
            adjustment_type: 'increase' o 'decrease'

        Returns:
            dict: {
                'previous_value': valor anterior,
                'new_value': nuevo valor,
                'impact': impacto del ajuste
            }
        """
        cost_price = float(product.cost_price) if product.cost_price else 0.0
        current_stock = product.stock_quantity

        # Calcular valores
        previous_value = current_stock * cost_price

        if adjustment_type == ADJUSTMENT_TYPES['DECREASE']:
            new_stock = current_stock - quantity
        else:
            new_stock = current_stock + quantity

        new_value = new_stock * cost_price
        impact = new_value - previous_value

        return {
            'previous_value': round(previous_value, 2),
            'new_value': round(new_value, 2),
            'impact': round(impact, 2),
            'cost_price': cost_price
        }

    @staticmethod
    def create_manual_adjustment(product_id, adjustment_type, quantity, reason, user_id, confirmed=False):
        """
        Crea un ajuste manual de inventario (CA-1, CA-5)

        Args:
            product_id: ID del producto
            adjustment_type: 'increase' o 'decrease'
            quantity: Cantidad del ajuste
            reason: Motivo del ajuste
            user_id: ID del usuario que realiza el ajuste
            confirmed: Si el ajuste ya fue confirmado por el usuario

        Returns:
            dict: {
                'product': producto actualizado,
                'movement': movimiento creado,
                'requires_confirmation': bool,
                'value_impact': impacto monetario,
                'is_significant': bool
            }

        Raises:
            AdjustmentValidationError: Si la validación falla
        """
        try:
            # Obtener producto con bloqueo
            product = Product.query.filter_by(id=product_id).with_for_update().first()

            if not product:
                raise AdjustmentValidationError(f"Producto con ID {product_id} no encontrado")

            # Validar ajuste
            InventoryAdjustmentService.validate_adjustment(
                product, adjustment_type, quantity, reason
            )

            # Verificar si requiere doble confirmación
            requires_confirmation = InventoryAdjustmentService.requires_double_confirmation(
                product, adjustment_type, quantity
            )

            # Si requiere confirmación y no ha sido confirmado, retornar advertencia
            if requires_confirmation and not confirmed:
                value_impact = InventoryAdjustmentService.calculate_inventory_value_impact(
                    product, quantity, adjustment_type
                )

                return {
                    'requires_confirmation': True,
                    'product': product.to_dict(),
                    'value_impact': value_impact,
                    'is_significant': InventoryAdjustmentService.is_significant_adjustment(product, quantity),
                    'message': f"Este ajuste disminuirá el stock en más del {int(SIGNIFICANT_ADJUSTMENT_THRESHOLD * 100)}%. ¿Desea continuar?"
                }

            # Calcular cantidad con signo correcto
            if adjustment_type == ADJUSTMENT_TYPES['DECREASE']:
                quantity_change = -quantity
            else:
                quantity_change = quantity

            # Usar el StockService para actualizar el stock
            # Esto garantiza que se use optimistic locking y se emita el evento WebSocket
            updated_product, movement = StockService.update_stock(
                product_id=product_id,
                quantity_change=quantity_change,
                user_id=user_id,
                movement_type=MOVEMENT_TYPES['MANUAL_ADJUSTMENT'],
                reason=reason,
                notes=f"Ajuste manual: {adjustment_type}"
            )

            # Calcular impacto en valor del inventario
            value_impact = InventoryAdjustmentService.calculate_inventory_value_impact(
                product, abs(quantity_change), adjustment_type
            )

            # Verificar si es ajuste significativo
            is_significant = InventoryAdjustmentService.is_significant_adjustment(
                product, abs(quantity_change)
            )

            # Log para notificación (CA-7)
            if is_significant:
                print(f"⚠️ AJUSTE SIGNIFICATIVO: {product.name} - {quantity_change} unidades por usuario {user_id}")
                # Aquí se podría enviar una notificación real al administrador

            return {
                'product': updated_product.to_dict(),
                'movement': movement.to_dict(),
                'requires_confirmation': False,
                'value_impact': value_impact,
                'is_significant': is_significant,
                'message': 'Ajuste de inventario realizado correctamente'
            }

        except AdjustmentValidationError:
            db.session.rollback()
            raise

        except Exception as e:
            db.session.rollback()
            raise AdjustmentValidationError(f"Error al crear ajuste: {str(e)}")

    @staticmethod
    def get_adjustment_history(product_id=None, user_id=None, limit=50):
        """
        Obtiene historial de ajustes manuales

        Args:
            product_id: Filtrar por producto (opcional)
            user_id: Filtrar por usuario (opcional)
            limit: Número máximo de resultados

        Returns:
            list: Lista de movimientos de ajuste manual
        """
        query = InventoryMovement.query.filter_by(
            movement_type=MOVEMENT_TYPES['MANUAL_ADJUSTMENT']
        )

        if product_id:
            query = query.filter_by(product_id=product_id)

        if user_id:
            query = query.filter_by(user_id=user_id)

        movements = query.order_by(InventoryMovement.created_at.desc())\
            .limit(limit)\
            .all()

        return [movement.to_dict() for movement in movements]
