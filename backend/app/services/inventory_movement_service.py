"""
Servicio para gestión de historial de movimientos de inventario

US-INV-003: Historial de Movimientos de Stock
- CA-1: Vista general de historial
- CA-3: Filtros avanzados
- CA-4: Historial por producto
"""
from app import db
from app.models.inventory_movement import InventoryMovement
from app.models.product import Product
from app.models.user import User
from app.models.category import Category
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta


class InventoryMovementService:
    """Servicio para manejar consultas de movimientos de inventario"""

    @staticmethod
    def get_movements(
        date_from=None,
        date_to=None,
        movement_type=None,
        product_id=None,
        user_id=None,
        category_id=None,
        page=1,
        per_page=50
    ):
        """
        Obtiene movimientos de inventario con filtros (CA-1, CA-3)

        Args:
            date_from: Fecha inicial (datetime or ISO string)
            date_to: Fecha final (datetime or ISO string)
            movement_type: Tipo de movimiento (string o lista)
            product_id: ID del producto
            user_id: ID del usuario
            category_id: ID de categoría
            page: Número de página
            per_page: Registros por página (máximo 100)

        Returns:
            dict: {
                'movements': [...],
                'total': int,
                'pages': int,
                'current_page': int,
                'per_page': int
            }
        """
        # Limitar per_page a máximo 100
        per_page = min(per_page, 100)

        # Construir query base con joins
        query = db.session.query(InventoryMovement)\
            .join(Product, InventoryMovement.product_id == Product.id)\
            .join(User, InventoryMovement.user_id == User.id)\
            .add_columns(
                Product.name.label('product_name'),
                Product.sku.label('product_sku'),
                Product.category_id.label('product_category_id'),
                User.full_name.label('user_name')
            )

        # Aplicar filtros
        filters = []

        # Filtro de fecha desde
        if date_from:
            if isinstance(date_from, str):
                date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            filters.append(InventoryMovement.created_at >= date_from)

        # Filtro de fecha hasta
        if date_to:
            if isinstance(date_to, str):
                date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            # Incluir todo el día final
            if date_to.hour == 0 and date_to.minute == 0:
                date_to = date_to + timedelta(days=1) - timedelta(seconds=1)
            filters.append(InventoryMovement.created_at <= date_to)

        # Filtro de tipo de movimiento (puede ser string o lista)
        if movement_type:
            if isinstance(movement_type, list):
                filters.append(InventoryMovement.movement_type.in_(movement_type))
            else:
                filters.append(InventoryMovement.movement_type == movement_type)

        # Filtro de producto
        if product_id:
            filters.append(InventoryMovement.product_id == product_id)

        # Filtro de usuario
        if user_id:
            filters.append(InventoryMovement.user_id == user_id)

        # Filtro de categoría (a través del producto)
        if category_id:
            filters.append(Product.category_id == category_id)

        # Aplicar todos los filtros
        if filters:
            query = query.filter(and_(*filters))

        # Ordenar por fecha descendente (más recientes primero)
        query = query.order_by(desc(InventoryMovement.created_at))

        # Ejecutar paginación
        pagination = query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )

        # Formatear resultados
        movements = []
        for movement, product_name, product_sku, product_category_id, user_name in pagination.items:
            movement_dict = movement.to_dict()
            movement_dict['product_name'] = product_name
            movement_dict['product_sku'] = product_sku
            movement_dict['product_category_id'] = product_category_id
            movement_dict['user_name'] = user_name
            movements.append(movement_dict)

        return {
            'movements': movements,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': pagination.page,
            'per_page': pagination.per_page
        }

    @staticmethod
    def get_movements_by_product(product_id, page=1, per_page=50):
        """
        Obtiene el historial de movimientos de un producto específico (CA-4)

        Args:
            product_id: ID del producto
            page: Número de página
            per_page: Registros por página

        Returns:
            dict: Similar a get_movements() pero solo para un producto
        """
        return InventoryMovementService.get_movements(
            product_id=product_id,
            page=page,
            per_page=per_page
        )

    @staticmethod
    def get_stock_evolution(product_id, date_from=None, date_to=None, limit=100):
        """
        Obtiene la evolución del stock de un producto para graficar (CA-4)

        Args:
            product_id: ID del producto
            date_from: Fecha inicial
            date_to: Fecha final
            limit: Máximo de puntos de datos

        Returns:
            list: [
                {
                    'date': datetime,
                    'stock': int,
                    'movement_type': str,
                    'quantity': int
                },
                ...
            ]
        """
        # Construir query
        query = InventoryMovement.query.filter_by(product_id=product_id)

        # Filtros de fecha
        if date_from:
            if isinstance(date_from, str):
                date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(InventoryMovement.created_at >= date_from)

        if date_to:
            if isinstance(date_to, str):
                date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            if date_to.hour == 0 and date_to.minute == 0:
                date_to = date_to + timedelta(days=1) - timedelta(seconds=1)
            query = query.filter(InventoryMovement.created_at <= date_to)

        # Ordenar cronológicamente (del más antiguo al más reciente)
        query = query.order_by(InventoryMovement.created_at.asc())

        # Limitar resultados
        movements = query.limit(limit).all()

        # Formatear para gráfico
        evolution = []
        for movement in movements:
            evolution.append({
                'date': movement.created_at.isoformat() if movement.created_at else None,
                'stock': movement.new_stock,
                'movement_type': movement.movement_type,
                'quantity': movement.quantity
            })

        return evolution

    @staticmethod
    def get_movement_details(movement_id):
        """
        Obtiene detalles completos de un movimiento específico (CA-5)

        Args:
            movement_id: ID del movimiento

        Returns:
            dict: Detalles completos del movimiento
        """
        movement = InventoryMovement.query.get(movement_id)
        if not movement:
            return None

        # Obtener información relacionada
        product = Product.query.get(movement.product_id)
        user = User.query.get(movement.user_id)

        movement_dict = movement.to_dict()
        movement_dict['product'] = {
            'id': product.id,
            'name': product.name,
            'sku': product.sku,
            'current_stock': product.stock_quantity
        } if product else None

        movement_dict['user'] = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role
        } if user else None

        return movement_dict

    @staticmethod
    def get_movement_statistics(date_from=None, date_to=None):
        """
        Obtiene estadísticas de movimientos en un período

        Args:
            date_from: Fecha inicial
            date_to: Fecha final

        Returns:
            dict: Estadísticas agregadas
        """
        query = db.session.query(
            InventoryMovement.movement_type,
            func.count(InventoryMovement.id).label('count'),
            func.sum(func.abs(InventoryMovement.quantity)).label('total_quantity')
        )

        # Filtros de fecha
        if date_from:
            if isinstance(date_from, str):
                date_from = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.filter(InventoryMovement.created_at >= date_from)

        if date_to:
            if isinstance(date_to, str):
                date_to = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            if date_to.hour == 0 and date_to.minute == 0:
                date_to = date_to + timedelta(days=1) - timedelta(seconds=1)
            query = query.filter(InventoryMovement.created_at <= date_to)

        # Agrupar por tipo
        results = query.group_by(InventoryMovement.movement_type).all()

        # Formatear resultados
        statistics = {
            'by_type': [],
            'total_movements': 0,
            'total_quantity': 0
        }

        for movement_type, count, total_quantity in results:
            statistics['by_type'].append({
                'movement_type': movement_type,
                'count': count,
                'total_quantity': int(total_quantity) if total_quantity else 0
            })
            statistics['total_movements'] += count
            statistics['total_quantity'] += int(total_quantity) if total_quantity else 0

        return statistics

    @staticmethod
    def get_recent_movements(limit=10):
        """
        Obtiene los movimientos más recientes

        Args:
            limit: Número de movimientos

        Returns:
            list: Movimientos recientes
        """
        movements = db.session.query(InventoryMovement)\
            .join(Product, InventoryMovement.product_id == Product.id)\
            .join(User, InventoryMovement.user_id == User.id)\
            .add_columns(
                Product.name.label('product_name'),
                Product.sku.label('product_sku'),
                User.full_name.label('user_name')
            )\
            .order_by(desc(InventoryMovement.created_at))\
            .limit(limit)\
            .all()

        result = []
        for movement, product_name, product_sku, user_name in movements:
            movement_dict = movement.to_dict()
            movement_dict['product_name'] = product_name
            movement_dict['product_sku'] = product_sku
            movement_dict['user_name'] = user_name
            result.append(movement_dict)

        return result
