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

            # 7. CA-10: Reducir stock y registrar movimientos de inventario
            # Se hace directamente (sin StockService) para mantener atomicidad
            for item in items_data:
                product = products_map[item['product_id']]
                qty = int(item['quantity'])

                previous_stock = product.stock_quantity
                new_stock = previous_stock - qty

                # Actualizar stock del producto
                product.stock_quantity = new_stock
                product.stock_last_updated = datetime.utcnow()
                product.last_updated_by_id = user_id
                product.version += 1

                # Crear movimiento de inventario
                movement = InventoryMovement(
                    product_id=product.id,
                    user_id=user_id,
                    movement_type='Venta',
                    quantity=-qty,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reason=f'Venta - Pedido {order_number}',
                    reference=order_number,
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
