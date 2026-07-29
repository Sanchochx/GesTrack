"""
Servicio de Órdenes de Compra
US-SUPP-005: Crear Orden de Compra
US-SUPP-007: Gestionar Estados de Orden de Compra
US-SUPP-008: Recibir Mercancía (Actualizar Inventario)
US-SUPP-010: Editar Orden de Compra
"""
from app import db
from app.models.purchase_order import (
    PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatusHistory, PurchaseOrderEditAudit
)
from app.models.supplier import Supplier
from app.models.product import Product
from app.services.stock_service import StockService
from decimal import Decimal
from datetime import datetime
from sqlalchemy import func, asc, desc

# US-SUPP-007 CA-1: Estados disponibles para órdenes de compra
PURCHASE_ORDER_STATUSES = ['Pendiente', 'Confirmada', 'En Tránsito', 'Recibida', 'Cancelada']
# CA-6: "Recibida" solo se alcanza a través del flujo dedicado de recepción de mercancía (US-SUPP-008)
TERMINAL_STATUSES = ['Recibida', 'Cancelada']
# US-SUPP-008 CA-4: Razones de discrepancia al recibir mercancía
DISCREPANCY_REASONS = ['Faltante', 'Sobrante', 'Daño']
# US-SUPP-010 CA-7: Umbral (%) de cambio en el total a partir del cual se considera "significativo"
SIGNIFICANT_CHANGE_THRESHOLD = 20


class PurchaseOrderService:
    """Lógica de negocio para gestión de órdenes de compra"""

    @staticmethod
    def list_purchase_orders(page=1, per_page=20, sort_by='created_at', sort_order='desc'):
        """
        US-SUPP-006 CA-2/CA-3: Lista órdenes de compra paginadas y ordenadas,
        con métricas de total de órdenes y monto total.

        Args:
            page: número de página (1-indexado)
            per_page: cantidad de órdenes por página
            sort_by: campo de ordenamiento ('created_at', 'supplier', 'total', 'status')
            sort_order: dirección ('asc' o 'desc')

        Returns:
            (pagination, metrics): objeto de paginación de SQLAlchemy y dict de métricas
        """
        needs_supplier = sort_by == 'supplier'
        query = PurchaseOrder.query
        if needs_supplier:
            query = query.join(PurchaseOrder.supplier)

        sort_columns = {
            'created_at': PurchaseOrder.created_at,
            'supplier': Supplier.company_name,
            'total': PurchaseOrder.total,
            'status': PurchaseOrder.status,
        }
        sort_column = sort_columns.get(sort_by, PurchaseOrder.created_at)
        direction = desc if sort_order == 'desc' else asc
        query = query.order_by(direction(sort_column))

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        # CA-6: Total de órdenes y monto total (sobre el total de registros, no solo la página)
        total_amount = db.session.query(
            func.coalesce(func.sum(PurchaseOrder.total), 0)
        ).scalar()
        metrics = {
            'total_orders': PurchaseOrder.query.count(),
            'total_amount': float(total_amount),
        }

        return pagination, metrics

    @staticmethod
    def get_purchase_order_by_id(purchase_order_id):
        """
        US-SUPP-008 CA-2: Obtiene una orden de compra por su ID (con sus items),
        necesaria para mostrar los productos ordenados al momento de recibir mercancía.

        Args:
            purchase_order_id: ID de la orden de compra

        Returns:
            PurchaseOrder: orden de compra encontrada o None si no existe
        """
        return PurchaseOrder.query.get(purchase_order_id)

    @staticmethod
    def create_purchase_order(data, current_user_id):
        """
        CA-1 a CA-10: Crea una nueva orden de compra con sus items.

        Args:
            data: dict validado por PurchaseOrderCreateSchema
            current_user_id: ID del usuario que crea la orden

        Returns:
            PurchaseOrder: orden de compra creada

        Raises:
            ValueError: si el proveedor o algún producto no existe
        """
        supplier = Supplier.query.get(data['supplier_id'])
        if not supplier:
            raise ValueError('El proveedor seleccionado no existe')

        items_data = data['items']
        product_ids = [item['product_id'] for item in items_data]
        products = {p.id: p for p in Product.query.filter(Product.id.in_(product_ids)).all()}

        missing_ids = set(product_ids) - set(products.keys())
        if missing_ids:
            raise ValueError('Uno o más productos seleccionados no existen')

        # CA-4: Calcular subtotal de cada item y de la orden
        subtotal = Decimal('0')
        order_items = []
        for item_data in items_data:
            product = products[item_data['product_id']]
            quantity = item_data['quantity_ordered']
            unit_cost = Decimal(str(item_data['unit_cost']))
            item_subtotal = quantity * unit_cost
            subtotal += item_subtotal

            order_items.append(PurchaseOrderItem(
                product_id=product.id,
                quantity_ordered=quantity,
                unit_cost=unit_cost,
                subtotal=item_subtotal,
                product_name=product.name,
                product_sku=product.sku,
            ))

        # CA-5/CA-6: Costo de envío y total
        shipping_cost = Decimal(str(data.get('shipping_cost') or 0))
        total = subtotal + shipping_cost

        # CA-7: Número de orden único
        order_number = PurchaseOrder.generate_order_number()

        purchase_order = PurchaseOrder(
            order_number=order_number,
            supplier_id=supplier.id,
            created_by_id=current_user_id,
            status='Pendiente',  # CA-8
            expected_delivery_date=data.get('expected_delivery_date'),  # CA-10
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,
            items=order_items,
        )

        db.session.add(purchase_order)
        db.session.commit()
        return purchase_order

    @staticmethod
    def update_status(purchase_order_id, new_status, current_user_id, notes=None):
        """
        US-SUPP-007: Actualiza el estado de una orden de compra y registra el historial.

        CA-1: Estados disponibles: Pendiente, Confirmada, En Tránsito, Recibida, Cancelada
        CA-2: Se puede avanzar o retroceder libremente entre Pendiente/Confirmada/En Tránsito
        CA-3: Se registra fecha/hora y usuario de cada cambio
        CA-5: Se pueden agregar notas al cambiar estado
        CA-6: Solo el estado "Recibida" actualiza el inventario — se alcanza únicamente a
              través del flujo dedicado de recepción de mercancía (US-SUPP-008), no desde aquí
        CA-7: "Cancelada" se puede establecer desde cualquier estado previo no terminal

        Args:
            purchase_order_id: ID de la orden de compra
            new_status: Nuevo estado deseado
            current_user_id: ID del usuario que realiza el cambio
            notes: Notas opcionales del cambio

        Returns:
            PurchaseOrder: orden de compra actualizada

        Raises:
            ValueError: si la orden no existe o la transición no es válida
        """
        purchase_order = PurchaseOrder.query.get(purchase_order_id)
        if not purchase_order:
            raise ValueError('La orden de compra no existe')

        if new_status not in PURCHASE_ORDER_STATUSES:
            raise ValueError(f'Estado inválido. Valores permitidos: {", ".join(PURCHASE_ORDER_STATUSES)}')

        if purchase_order.status in TERMINAL_STATUSES:
            raise ValueError(f'No se puede cambiar el estado de una orden en estado "{purchase_order.status}"')

        if new_status == 'Recibida':
            raise ValueError(
                'El estado "Recibida" solo se puede establecer mediante el registro de recepción de mercancía'
            )

        if new_status == purchase_order.status:
            raise ValueError('La orden ya se encuentra en ese estado')

        previous_status = purchase_order.status
        purchase_order.status = new_status

        history = PurchaseOrderStatusHistory(
            purchase_order_id=purchase_order.id,
            changed_by_id=current_user_id,
            previous_status=previous_status,
            status=new_status,
            notes=notes,
        )
        db.session.add(history)
        db.session.commit()
        return purchase_order

    @staticmethod
    def update_purchase_order(purchase_order_id, data, current_user_id):
        """
        US-SUPP-010: Edita una orden de compra existente.

        CA-1: Solo se pueden editar órdenes en estado "Pendiente"
        CA-2: Se pueden agregar o eliminar productos
        CA-3: Se pueden modificar cantidades y precios
        CA-4: Se recalculan totales automáticamente
        CA-5: Se registra la modificación con fecha/hora y usuario (PurchaseOrderEditAudit)
        CA-6: No se pueden editar órdenes confirmadas o recibidas
        CA-7: Se retorna un diff para que el cliente muestre advertencia si hay cambios significativos

        Args:
            purchase_order_id: ID de la orden de compra a editar
            data: dict validado por PurchaseOrderUpdateSchema
            current_user_id: ID del usuario que edita

        Returns:
            tuple: (PurchaseOrder, dict) — orden actualizada y diff de auditoría

        Raises:
            ValueError: si la orden no existe, no está "Pendiente", o el proveedor/productos son inválidos
        """
        purchase_order = PurchaseOrder.query.get(purchase_order_id)
        if not purchase_order:
            raise ValueError('La orden de compra no existe')

        # CA-1/CA-6: Solo se pueden editar órdenes en estado "Pendiente"
        if purchase_order.status != 'Pendiente':
            raise ValueError(
                f'Esta orden no puede editarse porque está en estado "{purchase_order.status}"'
            )

        supplier = Supplier.query.get(data['supplier_id'])
        if not supplier:
            raise ValueError('El proveedor seleccionado no existe')

        items_data = data['items']
        product_ids = [item['product_id'] for item in items_data]
        products = {p.id: p for p in Product.query.filter(Product.id.in_(product_ids)).all()}
        missing_ids = set(product_ids) - set(products.keys())
        if missing_ids:
            raise ValueError('Uno o más productos seleccionados no existen')

        # Snapshot "antes" para el diff de auditoría (CA-5/CA-7)
        old_items_map = {item.product_id: item for item in purchase_order.items}
        previous_total = Decimal(str(purchase_order.total)) if purchase_order.total else Decimal('0')
        previous_supplier_id = purchase_order.supplier_id

        # CA-2/CA-3/CA-4: Recalcular items y totales
        subtotal = Decimal('0')
        new_product_ids = {item['product_id'] for item in items_data}
        old_product_ids = set(old_items_map.keys())

        removed_product_ids = old_product_ids - new_product_ids
        for item in list(purchase_order.items):
            if item.product_id in removed_product_ids:
                purchase_order.items.remove(item)
                db.session.delete(item)

        for item_data in items_data:
            pid = item_data['product_id']
            quantity = item_data['quantity_ordered']
            unit_cost = Decimal(str(item_data['unit_cost']))
            item_subtotal = quantity * unit_cost
            subtotal += item_subtotal

            existing = old_items_map.get(pid)
            if existing:
                existing.quantity_ordered = quantity
                existing.unit_cost = unit_cost
                existing.subtotal = item_subtotal
            else:
                product = products[pid]
                purchase_order.items.append(PurchaseOrderItem(
                    product_id=product.id,
                    quantity_ordered=quantity,
                    unit_cost=unit_cost,
                    subtotal=item_subtotal,
                    product_name=product.name,
                    product_sku=product.sku,
                ))

        shipping_cost = Decimal(str(data.get('shipping_cost') or 0))
        new_total = subtotal + shipping_cost

        purchase_order.supplier_id = supplier.id
        purchase_order.subtotal = subtotal
        purchase_order.shipping_cost = shipping_cost
        purchase_order.total = new_total
        purchase_order.expected_delivery_date = data.get('expected_delivery_date')

        # CA-5/CA-7: Registro de auditoría con diff antes/después
        changes = PurchaseOrderService._build_edit_diff(
            previous_supplier_id, purchase_order.supplier_id,
            previous_total, new_total,
            old_items_map, items_data,
        )
        audit = PurchaseOrderEditAudit(
            purchase_order_id=purchase_order.id,
            edited_by_id=current_user_id,
            changes=changes,
        )
        db.session.add(audit)

        db.session.commit()
        return purchase_order, changes

    @staticmethod
    def _build_edit_diff(previous_supplier_id, new_supplier_id, previous_total, new_total,
                          old_items_map, new_items_data):
        """CA-5/CA-7: Construye un diff legible de los cambios aplicados a la orden"""
        total_change_pct = 0
        if previous_total > 0:
            total_change_pct = float(abs(new_total - previous_total) / previous_total * 100)

        changes = {
            'total': {'before': float(previous_total), 'after': float(new_total)},
        }

        if previous_supplier_id != new_supplier_id:
            changes['supplier_id'] = {'before': previous_supplier_id, 'after': new_supplier_id}

        new_items_map = {i['product_id']: i for i in new_items_data}
        old_ids = set(old_items_map.keys())
        new_ids = set(new_items_map.keys())

        items_added = [
            {
                'product_id': pid,
                'quantity_ordered': int(new_items_map[pid]['quantity_ordered']),
                'unit_cost': float(new_items_map[pid]['unit_cost']),
            }
            for pid in (new_ids - old_ids)
        ]
        items_removed = [
            {
                'product_id': pid,
                'product_name': old_items_map[pid].product_name,
                'quantity_ordered': old_items_map[pid].quantity_ordered,
                'unit_cost': float(old_items_map[pid].unit_cost),
            }
            for pid in (old_ids - new_ids)
        ]
        items_modified = []
        for pid in (old_ids & new_ids):
            old_item = old_items_map[pid]
            new_item = new_items_map[pid]
            qty_changed = old_item.quantity_ordered != int(new_item['quantity_ordered'])
            cost_changed = Decimal(str(old_item.unit_cost)) != Decimal(str(new_item['unit_cost']))
            if qty_changed or cost_changed:
                items_modified.append({
                    'product_id': pid,
                    'product_name': old_item.product_name,
                    'quantity_ordered': {'before': old_item.quantity_ordered, 'after': int(new_item['quantity_ordered'])},
                    'unit_cost': {'before': float(old_item.unit_cost), 'after': float(new_item['unit_cost'])},
                })

        changes['items_added'] = items_added
        changes['items_removed'] = items_removed
        changes['items_modified'] = items_modified

        # CA-7: Se considera un cambio significativo si el total varía más del umbral,
        # o si se agregaron/eliminaron productos
        changes['significant'] = (
            total_change_pct > SIGNIFICANT_CHANGE_THRESHOLD
            or len(items_added) > 0
            or len(items_removed) > 0
        )

        return changes

    @staticmethod
    def receive_purchase_order(purchase_order_id, items_data, current_user_id):
        """
        US-SUPP-008: Registra la recepción de mercancía de una orden de compra.

        CA-1: Solo se puede recibir órdenes en estado "En Tránsito"
        CA-3: La cantidad recibida puede diferir de la solicitada
        CA-4: Si hay discrepancia, se solicita razón (Faltante, Sobrante, Daño)
        CA-5: El stock de cada producto se incrementa según la cantidad recibida
        CA-6: La orden cambia a estado "Recibida"
        CA-7: Se registra la fecha de recepción
        CA-8: Se actualiza el historial de movimientos de inventario (vía StockService)

        Args:
            purchase_order_id: ID de la orden de compra
            items_data: lista validada por PurchaseOrderReceiveSchema
                [{item_id, quantity_received, discrepancy_reason, discrepancy_notes}]
            current_user_id: ID del usuario que registra la recepción

        Returns:
            PurchaseOrder: orden de compra actualizada

        Raises:
            ValueError: si la orden no existe, no está "En Tránsito", o los items son inválidos
        """
        purchase_order = PurchaseOrder.query.get(purchase_order_id)
        if not purchase_order:
            raise ValueError('La orden de compra no existe')

        if purchase_order.status != 'En Tránsito':
            raise ValueError('Solo se pueden recibir órdenes en estado "En Tránsito"')

        items_by_id = {item.id: item for item in purchase_order.items}
        received_ids = {entry['item_id'] for entry in items_data}
        if received_ids != set(items_by_id.keys()):
            raise ValueError('Debe reportar la recepción de todos los productos de la orden')

        # CA-4: Validar discrepancias antes de aplicar cambios de stock
        for entry in items_data:
            item = items_by_id[entry['item_id']]
            if entry['quantity_received'] != item.quantity_ordered and not entry.get('discrepancy_reason'):
                raise ValueError(
                    f'Debe indicar la razón de la discrepancia para "{item.product_name}" '
                    f'(solicitado: {item.quantity_ordered}, recibido: {entry["quantity_received"]})'
                )

        for entry in items_data:
            item = items_by_id[entry['item_id']]
            quantity_received = entry['quantity_received']

            item.quantity_received = quantity_received
            item.discrepancy_reason = entry.get('discrepancy_reason')
            item.discrepancy_notes = entry.get('discrepancy_notes')

            # CA-5/CA-8: Incrementar stock y registrar movimiento de inventario
            if quantity_received > 0:
                StockService.update_stock(
                    product_id=item.product_id,
                    quantity_change=quantity_received,
                    user_id=current_user_id,
                    movement_type='Compra',
                    reason=f'Recepción de mercancía - Orden {purchase_order.order_number}',
                    reference=purchase_order.order_number,
                    notes=entry.get('discrepancy_notes'),
                )

        # CA-6/CA-7: Cambiar estado y registrar fecha de recepción
        previous_status = purchase_order.status
        purchase_order.status = 'Recibida'
        purchase_order.received_at = datetime.utcnow()

        history = PurchaseOrderStatusHistory(
            purchase_order_id=purchase_order.id,
            changed_by_id=current_user_id,
            previous_status=previous_status,
            status='Recibida',
            notes='Mercancía recibida',
        )
        db.session.add(history)
        db.session.commit()
        return purchase_order
