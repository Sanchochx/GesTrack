"""
Servicio de gestión de pedidos
US-ORD-001: Crear Pedido
"""
from app import db
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory_movement import InventoryMovement
from app.services.stock_service import InsufficientStockError, StockUpdateError
from decimal import Decimal
from datetime import datetime


class OrderService:
    """Servicio para gestionar pedidos"""

    @staticmethod
    def create_order(data, user_id):
        """
        CA-8: Crea un nuevo pedido con validación de stock y movimientos de inventario.

        Args:
            data: Datos validados del pedido (del schema)
            user_id: ID del usuario que crea el pedido

        Returns:
            Order: Pedido creado

        Raises:
            ValueError: Si el cliente no existe o no está activo
            InsufficientStockError: Si no hay stock suficiente
            StockUpdateError: Error al actualizar stock
        """
        try:
            # 1. Validar cliente
            customer = Customer.query.get(data['customer_id'])
            if not customer:
                raise ValueError('Cliente no encontrado')
            if not customer.is_active:
                raise ValueError('El cliente no está activo')

            # 2. Bloquear productos y validar stock
            items_data = data['items']
            product_ids = [item['product_id'] for item in items_data]

            products = Product.query.filter(
                Product.id.in_(product_ids)
            ).with_for_update().all()

            products_map = {p.id: p for p in products}

            # Verificar que todos los productos existen
            for item in items_data:
                if item['product_id'] not in products_map:
                    raise ValueError(f'Producto no encontrado: {item["product_id"]}')

            # 3. Validar stock para TODOS los items antes de modificar
            stock_errors = []
            for item in items_data:
                product = products_map[item['product_id']]
                quantity = int(item['quantity'])
                if product.stock_quantity < quantity:
                    stock_errors.append({
                        'product_id': product.id,
                        'product_name': product.name,
                        'requested': quantity,
                        'available': product.stock_quantity,
                    })

            if stock_errors:
                error = InsufficientStockError(
                    f'Stock insuficiente para {len(stock_errors)} producto(s)',
                )
                error.details = stock_errors
                raise error

            # 4. Generar número de pedido
            order_number = Order.generate_order_number()

            # 5. Calcular totales
            subtotal = Decimal('0')
            order_items = []

            for item in items_data:
                product = products_map[item['product_id']]
                qty = int(item['quantity'])
                price = Decimal(str(item['unit_price']))
                item_subtotal = price * qty
                subtotal += item_subtotal

                order_items.append(OrderItem(
                    product_id=product.id,
                    quantity=qty,
                    unit_price=price,
                    subtotal=item_subtotal,
                    product_name=product.name,
                    product_sku=product.sku,
                ))

            tax_percentage = Decimal(str(data.get('tax_percentage', 0) or 0))
            shipping_cost = Decimal(str(data.get('shipping_cost', 0) or 0))
            discount_amount = Decimal(str(data.get('discount_amount', 0) or 0))
            tax_amount = subtotal * (tax_percentage / Decimal('100'))
            total = subtotal + tax_amount + shipping_cost - discount_amount

            # 6. Crear pedido
            order = Order(
                order_number=order_number,
                customer_id=data['customer_id'],
                created_by_id=user_id,
                status='Pendiente',
                payment_status='Pendiente',
                subtotal=subtotal,
                tax_percentage=tax_percentage,
                tax_amount=tax_amount,
                shipping_cost=shipping_cost,
                discount_amount=discount_amount,
                discount_justification=data.get('discount_justification'),
                total=total,
                notes=data.get('notes'),
                items=order_items,
            )

            db.session.add(order)
            db.session.flush()  # Populates order.id before referencing it in status_history

            # 7. CA-10: Reducir stock y registrar movimientos de inventario
            # US-INV-008 CA-1: Usar tipo 'order_reservation' y actualizar reserved_stock
            # Se hace directamente (sin StockService) para mantener atomicidad
            for item in items_data:
                product = products_map[item['product_id']]
                qty = int(item['quantity'])

                previous_stock = product.stock_quantity
                new_stock = previous_stock - qty

                # Actualizar stock disponible y stock reservado (CA-1)
                product.stock_quantity = new_stock
                product.reserved_stock = product.reserved_stock + qty  # CA-1: Registrar como reservado
                product.stock_last_updated = datetime.utcnow()
                product.last_updated_by_id = user_id
                product.version += 1

                # CA-8: Crear movimiento tipo 'order_reservation' vinculado al pedido
                movement = InventoryMovement(
                    product_id=product.id,
                    user_id=user_id,
                    movement_type='order_reservation',
                    quantity=-qty,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=f'Reserva de stock - Pedido {order_number}',
                    reference=order_number,
                    related_order_id=order.id,
                )
                db.session.add(movement)

            # 8. Crear entrada de historial de estado
            status_entry = OrderStatusHistory(
                order_id=order.id,
                changed_by_id=user_id,
                status='Pendiente',
                notes='Pedido creado',
            )
            db.session.add(status_entry)

            db.session.commit()
            return order

        except (ValueError, InsufficientStockError):
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f'Error al crear pedido: {str(e)}')

    @staticmethod
    def cancel_order(order_id, user_id, notes=None):
        """
        US-INV-008 CA-3: Cancela un pedido en estado Pendiente y restaura el stock.

        Args:
            order_id: ID del pedido a cancelar
            user_id: ID del usuario que cancela
            notes: Motivo de cancelación (opcional)

        Returns:
            Order: Pedido cancelado

        Raises:
            ValueError: Si el pedido no existe o no está en estado Pendiente
            StockUpdateError: Error al restaurar stock
        """
        try:
            # 1. Obtener pedido
            order = Order.query.get(order_id)
            if not order:
                raise ValueError('Pedido no encontrado')
            if order.status != 'Pendiente':
                raise ValueError(
                    f'Solo se pueden cancelar pedidos en estado Pendiente. '
                    f'Estado actual: {order.status}'
                )

            # 2. Obtener los items con lock pesimista sobre los productos (CA-5)
            product_ids = [item.product_id for item in order.items]
            products = Product.query.filter(
                Product.id.in_(product_ids)
            ).with_for_update().all()
            products_map = {p.id: p for p in products}

            # 3. Restaurar stock y crear movimientos de cancelación (CA-3, CA-8)
            order_number = order.order_number
            for item in order.items:
                product = products_map.get(item.product_id)
                if not product:
                    continue

                qty = item.quantity
                previous_stock = product.stock_quantity
                new_stock = previous_stock + qty

                # Restaurar stock disponible y reducir reservado
                product.stock_quantity = new_stock
                product.reserved_stock = max(0, product.reserved_stock - qty)
                product.stock_last_updated = datetime.utcnow()
                product.last_updated_by_id = user_id
                product.version += 1

                # CA-8: Movimiento tipo 'order_cancellation'
                movement = InventoryMovement(
                    product_id=product.id,
                    user_id=user_id,
                    movement_type='order_cancellation',
                    quantity=qty,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=f'Cancelación de pedido {order_number}',
                    reference=order_number,
                    related_order_id=order.id,
                )
                db.session.add(movement)

            # 4. Actualizar estado del pedido
            order.status = 'Cancelado'

            # 5. Registrar en historial de estados
            status_entry = OrderStatusHistory(
                order_id=order.id,
                changed_by_id=user_id,
                status='Cancelado',
                notes=notes or 'Pedido cancelado por el usuario',
            )
            db.session.add(status_entry)

            db.session.commit()
            return order

        except ValueError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f'Error al cancelar pedido: {str(e)}')

    @staticmethod
    def update_order_status(order_id, new_status, user_id, notes=None):
        """
        US-INV-008 CA-4: Actualiza el estado de un pedido.

        Para el estado 'Entregado': solo reduce reserved_stock, no modifica stock_quantity
        (el stock ya fue reducido al crear el pedido).

        Transiciones válidas:
            Pendiente -> Confirmado, Cancelado
            Confirmado -> Procesando, Cancelado
            Procesando -> Enviado, Cancelado
            Enviado -> Entregado, Cancelado
            Entregado -> (ninguna)
            Cancelado -> (ninguna)

        Args:
            order_id: ID del pedido
            new_status: Nuevo estado
            user_id: ID del usuario que actualiza
            notes: Notas del cambio de estado (opcional)

        Returns:
            Order: Pedido actualizado

        Raises:
            ValueError: Si la transición no es válida
            StockUpdateError: Error al actualizar stock
        """
        # Transiciones válidas por estado
        VALID_TRANSITIONS = {
            'Pendiente': ['Confirmado', 'Cancelado'],
            'Confirmado': ['Procesando', 'Cancelado'],
            'Procesando': ['Enviado', 'Cancelado'],
            'Enviado': ['Entregado', 'Cancelado'],
            'Entregado': [],
            'Cancelado': [],
        }

        try:
            order = Order.query.get(order_id)
            if not order:
                raise ValueError('Pedido no encontrado')

            current_status = order.status
            allowed = VALID_TRANSITIONS.get(current_status, [])

            if new_status not in allowed:
                raise ValueError(
                    f'Transición inválida de "{current_status}" a "{new_status}". '
                    f'Transiciones permitidas: {allowed or "ninguna"}'
                )

            # Si se cancela, usar cancel_order para manejar el stock
            if new_status == 'Cancelado':
                return OrderService.cancel_order(order_id, user_id, notes)

            # CA-4: Para 'Entregado', reducir reserved_stock (stock ya fue reducido al crear)
            if new_status == 'Entregado':
                product_ids = [item.product_id for item in order.items]
                products = Product.query.filter(
                    Product.id.in_(product_ids)
                ).with_for_update().all()
                products_map = {p.id: p for p in products}

                for item in order.items:
                    product = products_map.get(item.product_id)
                    if product:
                        # CA-4: El stock ya fue reducido al crear el pedido.
                        # Solo se actualiza reserved_stock: la reserva se convierte en definitiva
                        product.reserved_stock = max(0, product.reserved_stock - item.quantity)
                        product.stock_last_updated = datetime.utcnow()
                        product.last_updated_by_id = user_id

            # Actualizar estado del pedido
            order.status = new_status

            # Registrar en historial
            status_entry = OrderStatusHistory(
                order_id=order.id,
                changed_by_id=user_id,
                status=new_status,
                notes=notes or f'Estado actualizado a {new_status}',
            )
            db.session.add(status_entry)

            db.session.commit()
            return order

        except ValueError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f'Error al actualizar estado del pedido: {str(e)}')

    @staticmethod
    def validate_stock_availability(items):
        """
        CA-3: Valida disponibilidad de stock sin bloquear.

        Args:
            items: Lista de {product_id, quantity}

        Returns:
            dict: { available: bool, items: [...] }
        """
        result_items = []
        all_available = True

        for item in items:
            product = Product.query.get(item['product_id'])
            if not product:
                result_items.append({
                    'product_id': item['product_id'],
                    'product_name': 'Producto no encontrado',
                    'requested': item.get('quantity', 0),
                    'available': 0,
                    'sufficient': False,
                })
                all_available = False
                continue

            requested = int(item.get('quantity', 0))
            sufficient = product.stock_quantity >= requested

            if not sufficient:
                all_available = False

            result_items.append({
                'product_id': product.id,
                'product_name': product.name,
                'requested': requested,
                'available': product.stock_quantity,
                'sufficient': sufficient,
            })

        return {
            'available': all_available,
            'items': result_items,
        }
