"""
Servicio de gestión de pedidos
US-ORD-001: Crear Pedido
US-ORD-004: Estado de Pago del Pedido
US-ORD-013: Validación de Stock al Crear Pedido
"""
import logging
from app import db
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.order_edit_audit import OrderEditAudit
from app.models.product import Product
from app.models.customer import Customer
from app.models.inventory_movement import InventoryMovement
from app.models.payment import Payment
from app.services.stock_service import InsufficientStockError, StockUpdateError
from app.utils.constants import DISCOUNT_AUTHORIZATION_THRESHOLD
from decimal import Decimal
from datetime import datetime, date

logger = logging.getLogger(__name__)


class OrderConflictError(Exception):
    """US-ORD-008: El pedido fue modificado por otro usuario (bloqueo optimista)"""
    pass


class DiscountAuthorizationError(Exception):
    """US-ORD-014 CA-7: Descuento >20% requiere autorización de Admin"""
    pass


def _compute_discount(subtotal, data, user_role, user_id):
    """
    US-ORD-014: Calcula el monto de descuento a partir de discount_type/discount_value,
    valida el subtotal y la autorización requerida para descuentos > 20%.

    Returns:
        dict con discount_amount, discount_type, discount_value, discount_reason,
        discount_justification (texto legible) y discount_authorized_by_id.
    """
    discount_type = data.get('discount_type')
    discount_value = Decimal(str(data.get('discount_value', 0) or 0))

    if discount_value <= 0 or not discount_type:
        return {
            'discount_amount': Decimal('0'),
            'discount_type': None,
            'discount_value': None,
            'discount_reason': None,
            'discount_justification': None,
            'discount_authorized_by_id': None,
        }

    if discount_type == 'percentage':
        discount_amount = (subtotal * (discount_value / Decimal('100'))).quantize(Decimal('0.01'))
    else:
        discount_amount = discount_value

    # CA-11: El descuento no puede exceder el subtotal
    if discount_amount > subtotal:
        raise ValueError('El descuento no puede ser mayor al subtotal')

    discount_pct = (discount_amount / subtotal * 100) if subtotal > 0 else Decimal('0')

    reason = data.get('discount_reason')
    discount_justification = (
        data.get('discount_reason_detail').strip()
        if reason == 'Otro' and data.get('discount_reason_detail')
        else reason
    )

    authorized_by_id = None
    if discount_pct > DISCOUNT_AUTHORIZATION_THRESHOLD:
        # CA-7: Solo Admin puede aplicar descuentos mayores al 20%
        if user_role != 'Admin':
            raise DiscountAuthorizationError(
                f'Descuentos mayores al {DISCOUNT_AUTHORIZATION_THRESHOLD}% requieren autorización '
                f'de un Administrador'
            )
        authorized_by_id = user_id

    return {
        'discount_amount': discount_amount,
        'discount_type': discount_type,
        'discount_value': discount_value,
        'discount_reason': reason,
        'discount_justification': discount_justification,
        'discount_authorized_by_id': authorized_by_id,
    }


class OrderService:
    """Servicio para gestionar pedidos"""

    @staticmethod
    def create_order(data, user_id, user_role=None):
        """
        CA-8: Crea un nuevo pedido con validación de stock y movimientos de inventario.

        Args:
            data: Datos validados del pedido (del schema)
            user_id: ID del usuario que crea el pedido
            user_role: Rol del usuario que crea el pedido (US-ORD-014 CA-7)

        Returns:
            Order: Pedido creado

        Raises:
            ValueError: Si el cliente no existe o no está activo
            InsufficientStockError: Si no hay stock suficiente
            DiscountAuthorizationError: Si el descuento excede el 20% y el usuario no es Admin
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
                # CA-10: Registrar intentos de sobreventa para análisis de demanda no satisfecha
                for err in stock_errors:
                    logger.warning(
                        'Intento de sobreventa: usuario=%s producto=%s (%s) solicitado=%s disponible=%s',
                        user_id, err['product_name'], err['product_id'],
                        err['requested'], err['available'],
                    )
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

            # US-ORD-014 CA-1 a CA-3, CA-6, CA-7, CA-9: Calcular y validar descuento
            discount = _compute_discount(subtotal, data, user_role, user_id)
            discount_amount = discount['discount_amount']

            # CA-4: Impuesto se calcula sobre el subtotal después del descuento
            net_subtotal = subtotal - discount_amount
            tax_amount = net_subtotal * (tax_percentage / Decimal('100'))
            total = net_subtotal + tax_amount + shipping_cost

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
                discount_justification=discount['discount_justification'],
                discount_type=discount['discount_type'],
                discount_value=discount['discount_value'],
                discount_reason=discount['discount_reason'],
                discount_authorized_by_id=discount['discount_authorized_by_id'],
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
                previous_status=None,
                status='Pendiente',
                notes='Pedido creado',
            )
            db.session.add(status_entry)

            db.session.commit()
            return order

        except (ValueError, InsufficientStockError, DiscountAuthorizationError):
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f'Error al crear pedido: {str(e)}')

    @staticmethod
    def update_order(order_id, data, user_id, user_role=None):
        """
        US-ORD-008: Edita un pedido existente (CA-1, CA-3 a CA-10).

        Args:
            order_id: ID del pedido a editar
            data: Datos validados del pedido (del schema OrderUpdateSchema)
            user_id: ID del usuario que edita
            user_role: Rol del usuario que edita (US-ORD-014 CA-7/CA-10)

        Returns:
            tuple: (Order, dict) — pedido actualizado y diff de auditoría

        Raises:
            ValueError: Estado no editable, cliente inválido, o justificación faltante
            OrderConflictError: El pedido fue modificado por otro usuario
            InsufficientStockError: Si no hay stock suficiente para el aumento solicitado
            DiscountAuthorizationError: Si el descuento excede el 20% y el usuario no es Admin
            StockUpdateError: Error al actualizar stock
        """
        try:
            order = Order.query.get(order_id)
            if not order:
                raise ValueError('Pedido no encontrado')

            # CA-1: Solo pedidos Pendiente o Confirmado se pueden editar
            if order.status not in ('Pendiente', 'Confirmado'):
                raise ValueError(
                    f'Este pedido no puede editarse porque está en estado "{order.status}"'
                )

            # CA-10 (Notas técnicas): Bloqueo optimista usando updated_at
            expected_updated_at = data.get('expected_updated_at')
            if expected_updated_at:
                current_updated_at = order.updated_at.isoformat() if order.updated_at else None
                if current_updated_at and expected_updated_at != current_updated_at:
                    raise OrderConflictError(
                        'El pedido fue modificado por otro usuario. Recargue la página e intente de nuevo.'
                    )

            # CA-3: Validar cliente
            customer = Customer.query.get(data['customer_id'])
            if not customer:
                raise ValueError('Cliente no encontrado')
            if not customer.is_active:
                raise ValueError('El cliente no está activo')

            # Snapshot "antes" para comparación de totales (CA-8) y auditoría (CA-10)
            old_items_map = {item.product_id: item for item in order.items}
            previous_total = Decimal(str(order.total)) if order.total else Decimal('0')
            previous_customer_id = order.customer_id

            new_items_data = data['items']
            new_product_ids = {item['product_id'] for item in new_items_data}
            old_product_ids = set(old_items_map.keys())
            all_product_ids = new_product_ids | old_product_ids

            # Bloquear todos los productos afectados (agregados, eliminados o modificados)
            products = Product.query.filter(
                Product.id.in_(all_product_ids)
            ).with_for_update().all()
            products_map = {p.id: p for p in products}

            for pid in all_product_ids:
                if pid not in products_map:
                    raise ValueError(f'Producto no encontrado: {pid}')

            # CA-4/CA-5/CA-6: Calcular deltas de stock (positivo = requiere reducir stock)
            deltas = {}
            for pid in all_product_ids:
                old_qty = old_items_map[pid].quantity if pid in old_items_map else 0
                new_item = next((i for i in new_items_data if i['product_id'] == pid), None)
                new_qty = int(new_item['quantity']) if new_item else 0
                deltas[pid] = new_qty - old_qty

            # CA-6/CA-9: Validar stock disponible para incrementos, con datos actuales (locked)
            stock_errors = []
            for pid, delta in deltas.items():
                if delta > 0:
                    product = products_map[pid]
                    if product.stock_quantity < delta:
                        stock_errors.append({
                            'product_id': pid,
                            'product_name': product.name,
                            'requested': delta,
                            'available': product.stock_quantity,
                        })

            if stock_errors:
                # CA-10: Registrar intentos de sobreventa para análisis de demanda no satisfecha
                for err in stock_errors:
                    logger.warning(
                        'Intento de sobreventa (edición de pedido %s): usuario=%s producto=%s (%s) '
                        'solicitado=%s disponible=%s',
                        order.order_number, user_id, err['product_name'], err['product_id'],
                        err['requested'], err['available'],
                    )
                error = InsufficientStockError(
                    f'Stock insuficiente para {len(stock_errors)} producto(s)',
                )
                error.details = stock_errors
                raise error

            # CA-7: Justificación requerida si algún precio unitario cambia >10%
            price_changes = []
            for new_item in new_items_data:
                pid = new_item['product_id']
                old_item = old_items_map.get(pid)
                if old_item is None:
                    continue
                old_price = Decimal(str(old_item.unit_price))
                new_price = Decimal(str(new_item['unit_price']))
                if old_price > 0:
                    change_pct = abs((new_price - old_price) / old_price) * 100
                    if change_pct > 10:
                        price_changes.append({
                            'product_id': pid,
                            'product_name': old_item.product_name,
                            'old_price': float(old_price),
                            'new_price': float(new_price),
                        })

            if price_changes:
                price_justification = data.get('price_justification')
                if not price_justification or not price_justification.strip():
                    names = ', '.join(pc['product_name'] for pc in price_changes)
                    raise ValueError(
                        f'Se requiere justificación: el precio cambió más del 10% para: {names}'
                    )

            # CA-8: Recalcular totales
            subtotal = Decimal('0')
            for item in new_items_data:
                qty = int(item['quantity'])
                price = Decimal(str(item['unit_price']))
                subtotal += price * qty

            tax_percentage = Decimal(str(data.get('tax_percentage', 0) or 0))
            shipping_cost = Decimal(str(data.get('shipping_cost', 0) or 0))

            # US-ORD-014 CA-10: Recalcular descuento (requiere nueva justificación/autorización si cambió)
            discount = _compute_discount(subtotal, data, user_role, user_id)
            discount_amount = discount['discount_amount']

            # CA-4: Impuesto se calcula sobre el subtotal después del descuento
            net_subtotal = subtotal - discount_amount
            tax_amount = net_subtotal * (tax_percentage / Decimal('100'))
            new_total = net_subtotal + tax_amount + shipping_cost

            # --- Aplicar cambios dentro de la transacción ---

            # 1. Ajustar stock y crear movimientos de inventario por producto con delta != 0
            for pid, delta in deltas.items():
                if delta == 0:
                    continue
                product = products_map[pid]
                previous_stock = product.stock_quantity
                new_stock = previous_stock - delta
                product.stock_quantity = new_stock
                product.reserved_stock = max(0, product.reserved_stock + delta)
                product.stock_last_updated = datetime.utcnow()
                product.last_updated_by_id = user_id
                product.version += 1

                movement = InventoryMovement(
                    product_id=product.id,
                    user_id=user_id,
                    movement_type='order_edit',
                    quantity=-delta,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=f'Ajuste por edición de pedido {order.order_number}',
                    reference=order.order_number,
                    related_order_id=order.id,
                )
                db.session.add(movement)

            # 2. CA-5: Eliminar items de productos que salieron del pedido
            removed_product_ids = old_product_ids - new_product_ids
            for item in list(order.items):
                if item.product_id in removed_product_ids:
                    order.items.remove(item)
                    db.session.delete(item)

            # 3. CA-4/CA-6/CA-7: Actualizar items existentes y agregar nuevos
            for new_item in new_items_data:
                pid = new_item['product_id']
                qty = int(new_item['quantity'])
                price = Decimal(str(new_item['unit_price']))
                product = products_map[pid]
                existing = old_items_map.get(pid)
                if existing:
                    existing.quantity = qty
                    existing.unit_price = price
                    existing.subtotal = price * qty
                else:
                    order.items.append(OrderItem(
                        product_id=product.id,
                        quantity=qty,
                        unit_price=price,
                        subtotal=price * qty,
                        product_name=product.name,
                        product_sku=product.sku,
                    ))

            # 4. Actualizar cliente y totales del pedido (CA-3, CA-8)
            order.customer_id = data['customer_id']
            order.subtotal = subtotal
            order.tax_percentage = tax_percentage
            order.tax_amount = tax_amount
            order.shipping_cost = shipping_cost
            order.discount_amount = discount_amount
            order.discount_justification = discount['discount_justification']
            order.discount_type = discount['discount_type']
            order.discount_value = discount['discount_value']
            order.discount_reason = discount['discount_reason']
            order.discount_authorized_by_id = discount['discount_authorized_by_id']
            order.total = new_total
            order.notes = data.get('notes')

            # 5. CA-10: Registro de auditoría con diff antes/después
            changes = OrderService._build_edit_diff(
                previous_customer_id, order.customer_id,
                previous_total, new_total,
                old_items_map, new_items_data,
            )
            audit = OrderEditAudit(
                order_id=order.id,
                edited_by_id=user_id,
                changes=changes,
                edit_reason=data.get('edit_reason'),
            )
            db.session.add(audit)

            db.session.commit()
            return order, changes

        except (ValueError, InsufficientStockError, OrderConflictError, DiscountAuthorizationError):
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f'Error al editar pedido: {str(e)}')

    @staticmethod
    def _build_edit_diff(previous_customer_id, new_customer_id, previous_total, new_total,
                          old_items_map, new_items_data):
        """CA-10: Construye un diff legible de los cambios aplicados al pedido"""
        changes = {
            'total': {'before': float(previous_total), 'after': float(new_total)},
        }

        if previous_customer_id != new_customer_id:
            changes['customer_id'] = {'before': previous_customer_id, 'after': new_customer_id}

        new_items_map = {i['product_id']: i for i in new_items_data}
        old_ids = set(old_items_map.keys())
        new_ids = set(new_items_map.keys())

        items_added = [
            {
                'product_id': pid,
                'quantity': int(new_items_map[pid]['quantity']),
                'unit_price': float(new_items_map[pid]['unit_price']),
            }
            for pid in (new_ids - old_ids)
        ]

        items_removed = [
            {
                'product_id': pid,
                'product_name': old_items_map[pid].product_name,
                'quantity': old_items_map[pid].quantity,
                'unit_price': float(old_items_map[pid].unit_price),
            }
            for pid in (old_ids - new_ids)
        ]

        items_modified = []
        for pid in (old_ids & new_ids):
            old_item = old_items_map[pid]
            new_item = new_items_map[pid]
            old_qty, new_qty = old_item.quantity, int(new_item['quantity'])
            old_price, new_price = float(old_item.unit_price), float(new_item['unit_price'])
            if old_qty != new_qty or old_price != new_price:
                items_modified.append({
                    'product_id': pid,
                    'product_name': old_item.product_name,
                    'quantity': {'before': old_qty, 'after': new_qty},
                    'unit_price': {'before': old_price, 'after': new_price},
                })

        if items_added:
            changes['items_added'] = items_added
        if items_removed:
            changes['items_removed'] = items_removed
        if items_modified:
            changes['items_modified'] = items_modified

        return changes

    @staticmethod
    def cancel_order(order_id, user_id, cancellation_reason=None):
        """
        US-ORD-009: Cancela un pedido desde cualquier estado excepto Entregado o Cancelado,
        y restaura el stock.

        Args:
            order_id: ID del pedido a cancelar
            user_id: ID del usuario que cancela
            cancellation_reason: Motivo de cancelación (opcional)

        Returns:
            Order: Pedido cancelado

        Raises:
            ValueError: Si el pedido no existe o ya está Entregado/Cancelado
            StockUpdateError: Error al restaurar stock
        """
        try:
            # 1. Obtener pedido
            order = Order.query.get(order_id)
            if not order:
                raise ValueError('Pedido no encontrado')
            if order.status == 'Entregado':
                raise ValueError('Los pedidos entregados no pueden cancelarse')
            if order.status == 'Cancelado':
                raise ValueError('Este pedido ya está cancelado')

            # 2. Obtener los items con lock pesimista sobre los productos (CA-5)
            product_ids = [item.product_id for item in order.items]
            products = Product.query.filter(
                Product.id.in_(product_ids)
            ).with_for_update().all()
            products_map = {p.id: p for p in products}

            # 3. Restaurar stock y crear movimientos de cancelación (CA-4)
            order_number = order.order_number
            reason_text = cancellation_reason or 'Pedido cancelado por el usuario'
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

                # CA-4: Movimiento tipo 'order_cancellation'
                movement = InventoryMovement(
                    product_id=product.id,
                    user_id=user_id,
                    movement_type='order_cancellation',
                    quantity=qty,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=f'Devolución por cancelación de pedido {order_number}',
                    reference=order_number,
                    related_order_id=order.id,
                    notes=reason_text,
                )
                db.session.add(movement)

            # 4. CA-6: Marcar reembolso pendiente si el pedido tiene pagos registrados
            active_payments = order.payments.filter_by(is_deleted=False).all()
            amount_paid = sum(Decimal(str(p.amount)) for p in active_payments)

            # 5. Actualizar estado y datos de cancelación del pedido (CA-5, CA-6)
            previous_status = order.status
            order.status = 'Cancelado'
            order.cancelled_at = datetime.utcnow()
            order.cancellation_reason = reason_text
            order.refund_pending = amount_paid > 0

            # 6. Registrar en historial de estados
            status_entry = OrderStatusHistory(
                order_id=order.id,
                changed_by_id=user_id,
                previous_status=previous_status,
                status='Cancelado',
                notes=reason_text,
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
    def register_payment(order_id, data, user_id):
        """
        US-ORD-004 CA-2/CA-4/CA-6/CA-7: Registra un pago para un pedido.

        Args:
            order_id: ID del pedido
            data: Datos validados del pago (amount, payment_method, payment_date, notes)
            user_id: ID del usuario que registra el pago

        Returns:
            tuple: (Payment, Order) — pago creado y pedido actualizado

        Raises:
            ValueError: Si el pedido no existe, está cancelado, o el monto excede el saldo
        """
        try:
            order = Order.query.get(order_id)
            if not order:
                raise ValueError('Pedido no encontrado')

            if order.status == 'Cancelado':
                raise ValueError('No se puede registrar pago en un pedido cancelado')

            # Calcular saldo pendiente actual
            active_payments = order.payments.filter_by(is_deleted=False).all()
            amount_paid = sum(Decimal(str(p.amount)) for p in active_payments)
            total = Decimal(str(order.total)) if order.total else Decimal('0')
            pending_balance = total - amount_paid

            new_amount = Decimal(str(data['amount']))

            # CA-7: Validar que el monto no supere el saldo pendiente
            if new_amount > pending_balance:
                raise ValueError(
                    f'El monto excede el saldo pendiente de ${pending_balance:,.2f}. '
                    f'Solo puede registrar hasta ${pending_balance:,.2f}'
                )

            # CA-2: Usar fecha de hoy si no se especificó
            payment_date = data.get('payment_date') or date.today()

            # Crear registro de pago
            payment = Payment(
                order_id=order.id,
                created_by_id=user_id,
                amount=new_amount,
                payment_method=data['payment_method'],
                payment_date=payment_date,
                notes=data.get('notes'),
            )
            db.session.add(payment)

            # CA-6: Actualizar payment_status automáticamente
            new_total_paid = amount_paid + new_amount
            if new_total_paid >= total:
                order.payment_status = 'Pagado'
            else:
                order.payment_status = 'Parcialmente Pagado'

            db.session.commit()
            return payment, order

        except ValueError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f'Error al registrar pago: {str(e)}')

    @staticmethod
    def update_order_status(order_id, new_status, user_id, notes=None, force_delivery=False):
        """
        US-INV-008 CA-4: Actualiza el estado de un pedido.
        US-ORD-004 CA-8: Restricción por saldo pendiente con override para Admin.

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
            force_delivery: Si True, permite marcar como Entregado aunque haya saldo pendiente (solo Admin)

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

            # CA-8: No permitir 'Entregado' si hay saldo pendiente (a menos que force_delivery)
            if new_status == 'Entregado' and order.payment_status != 'Pagado':
                if not force_delivery:
                    # Calcular saldo pendiente para el mensaje
                    active_payments = order.payments.filter_by(is_deleted=False).all()
                    amount_paid = sum(Decimal(str(p.amount)) for p in active_payments)
                    total = Decimal(str(order.total)) if order.total else Decimal('0')
                    pending_balance = total - amount_paid
                    raise ValueError(
                        f'No se puede marcar el pedido como Entregado con saldo pendiente de '
                        f'${pending_balance:,.2f}. '
                        f'Registre el pago completo o use la opción de forzar entrega (solo Admin).'
                    )

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

            # Registrar en historial con previous_status (CA-5)
            status_entry = OrderStatusHistory(
                order_id=order.id,
                changed_by_id=user_id,
                previous_status=current_status,
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
