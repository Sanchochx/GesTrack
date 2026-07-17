"""
Servicio de gestión de devoluciones de pedidos
US-ORD-011: Procesamiento de Devoluciones
"""
from app import db
from app.models.order import Order, OrderStatusHistory
from app.models.return_order import Return, ReturnItem
from app.models.product import Product
from app.services.stock_service import StockUpdateError
from app.utils.constants import RETURN_WINDOW_DAYS
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy import func


class ReturnService:
    """Servicio para gestionar devoluciones"""

    @staticmethod
    def get_eligibility(order):
        """
        CA-1: Determina si un pedido es elegible para devoluciones.

        Returns:
            dict: { eligible: bool, message: str|None, delivered_at: datetime|None }
        """
        if order.status != 'Entregado':
            return {
                'eligible': False,
                'message': 'Solo se pueden procesar devoluciones de pedidos entregados',
                'delivered_at': None,
            }

        delivered_entry = (
            order.status_history
            .filter_by(status='Entregado')
            .order_by(OrderStatusHistory.created_at.desc())
            .first()
        )
        delivered_at = delivered_entry.created_at if delivered_entry else order.updated_at

        deadline = delivered_at + timedelta(days=RETURN_WINDOW_DAYS)
        if datetime.utcnow() > deadline:
            return {
                'eligible': False,
                'message': 'Este pedido ya no acepta devoluciones',
                'delivered_at': delivered_at,
            }

        return {'eligible': True, 'message': None, 'delivered_at': delivered_at}

    @staticmethod
    def _already_returned_quantities(order_id):
        """CA-12: Cantidad ya devuelta (o en trámite) por producto, excluyendo devoluciones rechazadas"""
        rows = (
            db.session.query(ReturnItem.product_id, func.sum(ReturnItem.quantity))
            .join(Return, Return.id == ReturnItem.return_id)
            .filter(Return.order_id == order_id, Return.status != 'Rechazada')
            .group_by(ReturnItem.product_id)
            .all()
        )
        return {product_id: int(qty) for product_id, qty in rows}

    @staticmethod
    def create_return(order_id, data, user_id):
        """
        CA-2 a CA-6, CA-12: Crea una devolución para un pedido entregado.

        Args:
            order_id: ID del pedido
            data: Datos validados (ReturnCreateSchema)
            user_id: ID del usuario que crea la devolución

        Returns:
            Return: Devolución creada

        Raises:
            ValueError: Si el pedido no es elegible o las cantidades son inválidas
        """
        try:
            order = Order.query.get(order_id)
            if not order:
                raise ValueError('Pedido no encontrado')

            eligibility = ReturnService.get_eligibility(order)
            if not eligibility['eligible']:
                raise ValueError(eligibility['message'])

            order_items_map = {item.product_id: item for item in order.items}
            already_returned = ReturnService._already_returned_quantities(order_id)

            requested_items = data['items']
            total_amount = Decimal('0')
            return_items = []

            for req_item in requested_items:
                product_id = req_item['product_id']
                quantity = int(req_item['quantity'])

                order_item = order_items_map.get(product_id)
                if not order_item:
                    raise ValueError(f'El producto no pertenece a este pedido: {product_id}')

                already_qty = already_returned.get(product_id, 0)
                remaining = order_item.quantity - already_qty

                if quantity > remaining:
                    raise ValueError(
                        f'No se puede devolver más cantidad de la comprada para '
                        f'"{order_item.product_name}". Cantidad disponible para devolución: {remaining}'
                    )

                unit_price = Decimal(str(order_item.unit_price))
                subtotal = unit_price * quantity
                total_amount += subtotal

                return_items.append(ReturnItem(
                    product_id=product_id,
                    quantity=quantity,
                    unit_price=unit_price,
                    subtotal=subtotal,
                    item_reason=req_item.get('item_reason'),
                    product_name=order_item.product_name,
                    product_sku=order_item.product_sku,
                ))

            reason = data['reason']
            reason_detail = data.get('reason_detail') if reason == 'Otro' else None

            return_obj = Return(
                return_number=Return.generate_return_number(),
                order_id=order.id,
                created_by_id=user_id,
                reason=reason,
                reason_detail=reason_detail,
                notes=data.get('notes'),
                total_amount=total_amount,
                status='Pendiente',
                items=return_items,
            )

            db.session.add(return_obj)
            db.session.commit()
            return return_obj

        except ValueError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f'Error al crear la devolución: {str(e)}')

    @staticmethod
    def update_status(return_id, data, user_id, user_role):
        """
        CA-7, CA-8, CA-9: Aprueba o rechaza una devolución.

        Al aprobar: incrementa stock y registra movimientos de inventario.
        Al rechazar: solo actualiza el estado (requiere rol Admin).

        Args:
            return_id: ID de la devolución
            data: Datos validados (ReturnStatusUpdateSchema)
            user_id: ID del usuario que procesa
            user_role: Rol del usuario actual

        Returns:
            Return: Devolución actualizada

        Raises:
            ValueError: Si la devolución no existe, ya fue procesada, o el rol no lo permite
        """
        try:
            return_obj = Return.query.get(return_id)
            if not return_obj:
                raise ValueError('Devolución no encontrada')

            if return_obj.status != 'Pendiente':
                raise ValueError(f'Esta devolución ya fue procesada (estado: {return_obj.status})')

            new_status = data['status']

            # CA-8: Solo Admin puede rechazar devoluciones
            if new_status == 'Rechazada' and user_role != 'Admin':
                raise ValueError('Solo un Administrador puede rechazar devoluciones')

            if new_status == 'Aprobada':
                product_ids = [item.product_id for item in return_obj.items]
                products = Product.query.filter(
                    Product.id.in_(product_ids)
                ).with_for_update().all()
                products_map = {p.id: p for p in products}

                # CA-7: Incrementar stock y registrar movimientos de inventario
                from app.models.inventory_movement import InventoryMovement

                for item in return_obj.items:
                    product = products_map.get(item.product_id)
                    if not product:
                        continue

                    previous_stock = product.stock_quantity
                    new_stock = previous_stock + item.quantity

                    product.stock_quantity = new_stock
                    product.stock_last_updated = datetime.utcnow()
                    product.last_updated_by_id = user_id
                    product.version += 1

                    movement = InventoryMovement(
                        product_id=product.id,
                        user_id=user_id,
                        movement_type='Devolución',
                        quantity=item.quantity,
                        previous_stock=previous_stock,
                        new_stock=new_stock,
                        reason=f'Devolución aprobada - {return_obj.return_number}',
                        reference=return_obj.return_number,
                        related_order_id=return_obj.order_id,
                        notes=item.item_reason or return_obj.reason,
                    )
                    db.session.add(movement)

                # CA-9: Registrar método de compensación
                return_obj.refund_method = data.get('refund_method')
                return_obj.refund_reference = data.get('refund_reference')

            return_obj.status = new_status
            return_obj.approved_by_id = user_id
            return_obj.approved_at = datetime.utcnow()

            db.session.commit()
            return return_obj

        except ValueError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            raise StockUpdateError(f'Error al procesar la devolución: {str(e)}')

    @staticmethod
    def list_order_returns(order_id):
        """CA-10: Lista devoluciones de un pedido específico"""
        return (
            Return.query
            .filter_by(order_id=order_id)
            .order_by(Return.created_at.desc())
            .all()
        )
