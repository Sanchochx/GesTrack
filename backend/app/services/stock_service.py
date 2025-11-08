"""
Servicio de gestión de stock con soporte para tiempo real y concurrencia

US-INV-001: Seguimiento de Stock en Tiempo Real
- CA-5: Manejo de Concurrencia con Optimistic Locking
- CA-4: Timestamp de Última Actualización
"""
from app import db
from app.models.product import Product
from app.models.inventory_movement import InventoryMovement
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import StaleDataError


class StockUpdateError(Exception):
    """Excepción personalizada para errores de actualización de stock"""
    pass


class ConcurrencyError(StockUpdateError):
    """Excepción para errores de concurrencia (optimistic locking)"""
    pass


class InsufficientStockError(StockUpdateError):
    """Excepción cuando no hay suficiente stock"""
    pass


class StockService:
    """
    Servicio para gestionar actualizaciones de stock con:
    - Optimistic Locking (CA-5)
    - Tracking de última actualización (CA-4)
    - Registro de movimientos en historial
    """

    @staticmethod
    def update_stock(product_id, quantity_change, user_id, movement_type, reason=None, reference=None, notes=None, expected_version=None):
        """
        Actualiza el stock de un producto con optimistic locking (CA-5)

        Args:
            product_id: ID del producto
            quantity_change: Cambio en la cantidad (positivo para incremento, negativo para decremento)
            user_id: ID del usuario que realiza el cambio
            movement_type: Tipo de movimiento ('Entrada', 'Salida', 'Ajuste', etc.)
            reason: Razón del cambio
            reference: Referencia externa (número de orden, etc.)
            notes: Notas adicionales
            expected_version: Versión esperada del producto (para optimistic locking)

        Returns:
            tuple: (producto actualizado, movimiento creado)

        Raises:
            ConcurrencyError: Si la versión no coincide (otro usuario modificó el stock)
            InsufficientStockError: Si no hay suficiente stock para la operación
            StockUpdateError: Para otros errores de actualización
        """
        try:
            # Obtener el producto con bloqueo a nivel de fila
            product = Product.query.filter_by(id=product_id).with_for_update().first()

            if not product:
                raise StockUpdateError(f"Producto con ID {product_id} no encontrado")

            # CA-5: Verificar versión para optimistic locking
            if expected_version is not None and product.version != expected_version:
                raise ConcurrencyError(
                    f"El stock fue modificado por otro usuario. "
                    f"Versión esperada: {expected_version}, versión actual: {product.version}. "
                    f"Por favor, recarga los datos e intenta nuevamente."
                )

            # Calcular nuevo stock
            previous_stock = product.stock_quantity
            new_stock = previous_stock + quantity_change

            # Validar que el stock no sea negativo
            if new_stock < 0:
                raise InsufficientStockError(
                    f"Stock insuficiente. Stock actual: {previous_stock}, "
                    f"cambio solicitado: {quantity_change}, resultado: {new_stock}"
                )

            # Actualizar el stock del producto
            product.stock_quantity = new_stock

            # CA-4: Actualizar timestamp y usuario de última modificación
            product.stock_last_updated = datetime.utcnow()
            product.last_updated_by_id = user_id

            # CA-5: Incrementar versión para optimistic locking
            product.version += 1

            # Crear registro de movimiento en el historial
            movement = InventoryMovement(
                product_id=product.id,
                user_id=user_id,
                movement_type=movement_type,
                quantity=quantity_change,
                previous_stock=previous_stock,
                new_stock=new_stock,
                reason=reason,
                reference=reference,
                notes=notes
            )

            # Guardar cambios
            db.session.add(movement)
            db.session.commit()

            return product, movement

        except (ConcurrencyError, InsufficientStockError):
            db.session.rollback()
            raise

        except IntegrityError as e:
            db.session.rollback()
            raise StockUpdateError(f"Error de integridad en la base de datos: {str(e)}")

        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f"Error al actualizar stock: {str(e)}")

    @staticmethod
    def get_stock_history(product_id, limit=50):
        """
        Obtiene el historial de movimientos de stock de un producto

        Args:
            product_id: ID del producto
            limit: Número máximo de movimientos a retornar

        Returns:
            list: Lista de movimientos ordenados por fecha (más reciente primero)
        """
        movements = InventoryMovement.query.filter_by(product_id=product_id)\
            .order_by(InventoryMovement.created_at.desc())\
            .limit(limit)\
            .all()

        return [movement.to_dict() for movement in movements]

    @staticmethod
    def get_product_with_stock_info(product_id):
        """
        Obtiene un producto con toda su información de stock (CA-4, CA-6)

        Args:
            product_id: ID del producto

        Returns:
            dict: Información completa del producto incluyendo última actualización
        """
        product = Product.query.get(product_id)

        if not product:
            return None

        product_data = product.to_dict()

        # Agregar información adicional de stock
        product_data['stock_status'] = product.get_stock_status()
        product_data['is_low_stock'] = product.is_low_stock()
        product_data['is_out_of_stock'] = product.is_out_of_stock()

        return product_data

    @staticmethod
    def adjust_stock_manually(product_id, new_stock_quantity, user_id, reason, notes=None):
        """
        Ajuste manual de stock (establecer cantidad específica)

        Args:
            product_id: ID del producto
            new_stock_quantity: Nueva cantidad de stock
            user_id: ID del usuario
            reason: Razón del ajuste
            notes: Notas adicionales

        Returns:
            tuple: (producto actualizado, movimiento creado)
        """
        product = Product.query.get(product_id)

        if not product:
            raise StockUpdateError(f"Producto con ID {product_id} no encontrado")

        # Calcular el cambio necesario
        quantity_change = new_stock_quantity - product.stock_quantity

        return StockService.update_stock(
            product_id=product_id,
            quantity_change=quantity_change,
            user_id=user_id,
            movement_type='Ajuste Manual',
            reason=reason,
            notes=notes
        )

    @staticmethod
    def retry_with_latest_version(product_id, quantity_change, user_id, movement_type, reason=None, reference=None, notes=None, max_retries=3):
        """
        Intenta actualizar el stock con reintentos automáticos en caso de conflicto de concurrencia

        Args:
            product_id: ID del producto
            quantity_change: Cambio en la cantidad
            user_id: ID del usuario
            movement_type: Tipo de movimiento
            reason: Razón del cambio
            reference: Referencia externa
            notes: Notas adicionales
            max_retries: Número máximo de reintentos

        Returns:
            tuple: (producto actualizado, movimiento creado)

        Raises:
            ConcurrencyError: Si se excede el número máximo de reintentos
        """
        retries = 0

        while retries < max_retries:
            try:
                # Obtener la versión actual del producto
                product = Product.query.get(product_id)
                if not product:
                    raise StockUpdateError(f"Producto con ID {product_id} no encontrado")

                # Intentar actualizar con la versión actual
                return StockService.update_stock(
                    product_id=product_id,
                    quantity_change=quantity_change,
                    user_id=user_id,
                    movement_type=movement_type,
                    reason=reason,
                    reference=reference,
                    notes=notes,
                    expected_version=product.version
                )

            except ConcurrencyError:
                retries += 1
                if retries >= max_retries:
                    raise ConcurrencyError(
                        f"No se pudo actualizar el stock después de {max_retries} intentos. "
                        "Por favor, intenta nuevamente más tarde."
                    )
                # Esperar un momento antes de reintentar
                # (en producción, considerar usar exponential backoff)
                continue

        raise ConcurrencyError("Error inesperado en el proceso de reintentos")
