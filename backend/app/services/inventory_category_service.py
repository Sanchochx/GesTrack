"""
US-INV-006: Vista de Inventario por Categoría
Servicio para gestionar la vista de inventario agrupado por categorías
"""

from sqlalchemy import func, and_, or_, case, desc, asc
from app.models.category import Category
from app.models.product import Product
from app import db


class InventoryCategoryService:
    """
    Servicio para obtener y gestionar la vista de inventario por categorías
    """

    @staticmethod
    def get_categories_with_stats(filters=None, sort_by='name', sort_order='asc'):
        """
        US-INV-006 CA-1, CA-4: Obtiene lista de categorías con estadísticas de inventario

        Args:
            filters (dict): Filtros opcionales
                - search_term (str): Búsqueda por nombre de categoría
                - has_low_stock (bool): Solo categorías con productos en stock bajo
                - has_out_of_stock (bool): Solo categorías con productos sin stock
            sort_by (str): Campo de ordenamiento (name, value, products, low_stock)
            sort_order (str): Orden (asc, desc)

        Returns:
            list: Lista de categorías con estadísticas agregadas
        """
        filters = filters or {}

        # CA-1: Query base con agregaciones por categoría
        query = db.session.query(
            Category.id.label('category_id'),
            Category.name.label('category_name'),
            Category.color.label('category_color'),
            Category.icon.label('category_icon'),
            func.count(Product.id).label('total_products'),
            func.coalesce(
                func.sum(
                    case(
                        (Product.stock_quantity > 0, 1),
                        else_=0
                    )
                ),
                0
            ).label('products_in_stock'),
            func.coalesce(
                func.sum(
                    case(
                        (and_(
                            Product.stock_quantity <= Product.reorder_point,
                            Product.stock_quantity > 0
                        ), 1),
                        else_=0
                    )
                ),
                0
            ).label('products_low_stock'),
            func.coalesce(
                func.sum(
                    case(
                        (Product.stock_quantity == 0, 1),
                        else_=0
                    )
                ),
                0
            ).label('products_out_of_stock'),
            func.coalesce(
                func.sum(Product.cost_price * Product.stock_quantity),
                0
            ).label('total_value'),
            func.coalesce(
                func.sum(Product.stock_quantity),
                0
            ).label('total_units')
        ).outerjoin(
            Product,
            and_(
                Category.id == Product.category_id,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).group_by(
            Category.id,
            Category.name,
            Category.color,
            Category.icon
        )

        # CA-4: Aplicar filtros
        if 'search_term' in filters and filters['search_term']:
            search = f"%{filters['search_term']}%"
            query = query.filter(Category.name.ilike(search))

        # Aplicar filtros de stock (requiere HAVING debido a agregaciones)
        having_conditions = []

        if filters.get('has_low_stock'):
            having_conditions.append(
                func.sum(
                    case(
                        (and_(
                            Product.stock_quantity <= Product.reorder_point,
                            Product.stock_quantity > 0
                        ), 1),
                        else_=0
                    )
                ) > 0
            )

        if filters.get('has_out_of_stock'):
            having_conditions.append(
                func.sum(
                    case(
                        (Product.stock_quantity == 0, 1),
                        else_=0
                    )
                ) > 0
            )

        if having_conditions:
            query = query.having(or_(*having_conditions))

        # CA-4: Aplicar ordenamiento
        sort_mapping = {
            'name': Category.name,
            'value': func.sum(Product.cost_price * Product.stock_quantity),
            'products': func.count(Product.id),
            'low_stock': func.sum(
                case(
                    (and_(
                        Product.stock_quantity <= Product.reorder_point,
                        Product.stock_quantity > 0
                    ), 1),
                    else_=0
                )
            )
        }

        sort_field = sort_mapping.get(sort_by, Category.name)

        if sort_order == 'desc':
            query = query.order_by(desc(sort_field))
        else:
            query = query.order_by(asc(sort_field))

        # Ejecutar query
        results = query.all()

        # Formatear resultados
        categories = []
        for row in results:
            total_value = float(row.total_value) if row.total_value else 0.0

            categories.append({
                'category_id': row.category_id,
                'category_name': row.category_name,
                'category_color': row.category_color,
                'category_icon': row.category_icon,
                'total_products': int(row.total_products),
                'products_in_stock': int(row.products_in_stock),
                'products_low_stock': int(row.products_low_stock),
                'products_out_of_stock': int(row.products_out_of_stock),
                'total_value': round(total_value, 2),
                'formatted_value': f"${total_value:,.2f}",
                'total_units': int(row.total_units)
            })

        return categories

    @staticmethod
    def get_category_products(category_id):
        """
        US-INV-006 CA-3: Obtiene lista detallada de productos de una categoría

        Args:
            category_id (str): ID de la categoría

        Returns:
            list: Lista de productos con detalles de inventario
        """
        # Verificar que la categoría existe
        category = Category.query.get(category_id)
        if not category:
            raise ValueError(f"Categoría con ID {category_id} no encontrada")

        # Query de productos con stock_status calculado
        products = Product.query.filter(
            and_(
                Product.category_id == category_id,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).all()

        # Formatear resultados
        product_list = []
        for product in products:
            item_value = float(product.cost_price) * product.stock_quantity

            # CA-3: Determinar stock_status
            if product.stock_quantity == 0:
                stock_status = 'out_of_stock'
            elif product.stock_quantity <= product.reorder_point:
                stock_status = 'low_stock'
            else:
                stock_status = 'in_stock'

            product_list.append({
                'id': product.id,
                'sku': product.sku,
                'name': product.name,
                'stock_quantity': product.stock_quantity,
                'reorder_point': product.reorder_point,
                'cost_price': float(product.cost_price),
                'item_value': round(item_value, 2),
                'formatted_value': f"${item_value:,.2f}",
                'image_url': product.image_url,
                'stock_status': stock_status
            })

        # CA-3: Ordenar por stock_status (críticos primero), luego por stock
        status_priority = {'out_of_stock': 0, 'low_stock': 1, 'in_stock': 2}
        product_list.sort(key=lambda x: (status_priority[x['stock_status']], x['stock_quantity']))

        return product_list

    @staticmethod
    def get_overall_metrics():
        """
        US-INV-006 CA-6: Obtiene métricas generales del inventario por categorías

        Returns:
            dict: Métricas generales
        """
        # Obtener total de categorías
        total_categories = Category.query.count()

        # Obtener total de productos activos
        total_products = Product.query.filter(
            and_(
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).count()

        # Categorías con al menos un producto con stock bajo
        categories_with_low_stock = db.session.query(
            func.count(func.distinct(Product.category_id))
        ).filter(
            and_(
                Product.stock_quantity <= Product.reorder_point,
                Product.stock_quantity > 0,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).scalar() or 0

        # Categorías con todos sus productos sin stock
        # (categorías que tienen productos, pero todos están en stock 0)
        categories_out_of_stock = db.session.query(
            func.count(func.distinct(Product.category_id))
        ).filter(
            and_(
                Product.stock_quantity == 0,
                Product.is_active == True,
                Product.deleted_at.is_(None)
            )
        ).scalar() or 0

        # Valor total del inventario
        total_value_result = db.session.query(
            func.sum(Product.cost_price * Product.stock_quantity)
        ).filter(
            and_(
                Product.is_active == True,
                Product.deleted_at.is_(None),
                Product.stock_quantity > 0
            )
        ).scalar()

        total_value = float(total_value_result) if total_value_result else 0.0

        return {
            'total_categories': total_categories,
            'total_products': total_products,
            'categories_with_low_stock': categories_with_low_stock,
            'categories_out_of_stock': categories_out_of_stock,
            'total_value': round(total_value, 2),
            'formatted_value': f"${total_value:,.2f}"
        }
