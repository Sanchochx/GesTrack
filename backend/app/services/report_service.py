"""
Servicio de Reportes
US-REP-002: Reporte de Ventas Diarias
US-REP-003: Reporte de Ventas por Período
US-REP-004: Productos Más Vendidos
US-REP-005: Análisis de Márgenes de Ganancia
US-REP-006: Reporte de Inventario Actual
US-REP-007: Reporte de Movimientos de Inventario
US-REP-008: Reporte de Productos con Stock Bajo
US-REP-009: Reporte de Desempeño de Ventas por Vendedor
US-REP-010: Reporte de Clientes
US-REP-011: Análisis de Tendencias de Ventas
US-REP-012: Reporte de Órdenes de Compra a Proveedores
US-REP-015: Reporte de Devoluciones
"""
from datetime import datetime, timedelta
from collections import OrderedDict
from app import db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.category import Category
from app.models.inventory_movement import InventoryMovement
from app.models.user import User
from app.models.customer import Customer
from app.models.purchase_order import PurchaseOrder
from app.models.return_order import Return, ReturnItem
from app.services.restock_suggestion_service import RestockSuggestionService

# Estados considerados "venta" para efectos de los reportes — los pedidos
# cancelados se excluyen de las métricas de venta por defecto.
NON_SALE_STATUS = 'Cancelado'

# US-REP-003: Períodos predefinidos soportados
PERIOD_TYPES = ('daily', 'weekly', 'monthly', 'custom')
GROUP_BY_OPTIONS = ('day', 'week', 'month')

# US-REP-004: Períodos soportados para el reporte de productos más vendidos
# (incluye 'all' para ver el histórico completo, sin filtro de fecha)
TOP_PRODUCTS_PERIOD_TYPES = ('all', 'daily', 'weekly', 'monthly', 'custom')
TOP_PRODUCTS_SORT_OPTIONS = ('quantity', 'revenue', 'margin')

# US-REP-005: Umbrales del código de colores para el margen de ganancia (%)
# rojo (bajo): < MARGIN_LOW_THRESHOLD | amarillo (medio): entre ambos | verde (alto): >= MARGIN_HIGH_THRESHOLD
MARGIN_LOW_THRESHOLD = 15
MARGIN_HIGH_THRESHOLD = 40
MARGIN_ANALYSIS_SORT_OPTIONS = ('margin_pct', 'margin_dollar', 'total_profit')

# US-REP-015: Estado de devolución que se excluye por defecto de las métricas
# (una devolución rechazada no representa un producto/reembolso real)
RETURN_REJECTED_STATUS = 'Rechazada'

# US-REP-012: Estados de orden de compra
PURCHASE_ORDER_CANCELLED_STATUS = 'Cancelada'
PURCHASE_ORDER_RECEIVED_STATUS = 'Recibida'
PURCHASE_ORDER_TERMINAL_STATUSES = ('Recibida', 'Cancelada')

# US-REP-010: Días sin compras a partir de los cuales un cliente se considera "en riesgo"
CUSTOMER_AT_RISK_DAYS = 90
CUSTOMER_CATEGORIES = ('VIP', 'Frecuente', 'Regular')

# US-REP-006: Opciones soportadas para el reporte de inventario actual
INVENTORY_REPORT_STOCK_STATUSES = ('normal', 'low_stock', 'out_of_stock')
INVENTORY_REPORT_SORT_OPTIONS = ('name', 'stock', 'value')


class ReportService:
    """Lógica de negocio para reportes de ventas"""

    @staticmethod
    def get_daily_sales_report(report_date=None, status=None):
        """
        US-REP-002: Reporte de ventas de un día específico.

        CA-1: Total de ventas, cantidad de pedidos, ticket promedio
        CA-2: Detalle de pedidos del día
        CA-3: Comparación con el promedio diario del mes
        CA-4: Ventas por hora del día
        CA-5: Filtro por estado de pedido

        Args:
            report_date: fecha del reporte (date), default hoy
            status: filtrar por un estado específico (opcional) — si se omite,
                se excluyen los pedidos "Cancelado" de las métricas y el listado

        Returns:
            dict con métricas, listado de pedidos, desglose por hora y comparación mensual
        """
        # NOTA: created_at se almacena con datetime.utcnow() (naive UTC) en todo el
        # sistema, así que "hoy" debe calcularse en UTC, no con la hora local del servidor.
        report_date = report_date or datetime.utcnow().date()
        day_start = datetime.combine(report_date, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        query = Order.query.filter(Order.created_at >= day_start, Order.created_at < day_end)
        if status:
            query = query.filter(Order.status == status)
        else:
            query = query.filter(Order.status != NON_SALE_STATUS)

        orders = query.order_by(Order.created_at.asc()).all()

        total_sales = sum((float(o.total) for o in orders), 0.0)
        order_count = len(orders)
        avg_ticket = total_sales / order_count if order_count else 0.0

        orders_data = [
            {
                'id': o.id,
                'order_number': o.order_number,
                'customer_name': o.customer.nombre_razon_social if o.customer else None,
                'total': float(o.total) if o.total else 0.0,
                'status': o.status,
                'created_at': o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders
        ]

        # CA-4: Ventas por hora del día (0-23)
        hourly = {h: {'hour': h, 'total': 0.0, 'count': 0} for h in range(24)}
        for o in orders:
            h = o.created_at.hour
            hourly[h]['total'] += float(o.total) if o.total else 0.0
            hourly[h]['count'] += 1
        hourly_breakdown = [hourly[h] for h in range(24)]

        # CA-3: Comparación con el promedio diario del mes (mes a la fecha, excluyendo cancelados)
        month_start = datetime.combine(report_date.replace(day=1), datetime.min.time())
        month_query = Order.query.filter(
            Order.created_at >= month_start,
            Order.created_at < day_end,
            Order.status != NON_SALE_STATUS,
        )
        month_total = float(month_query.with_entities(
            db.func.coalesce(db.func.sum(Order.total), 0)
        ).scalar())
        days_elapsed = report_date.day
        monthly_daily_average = month_total / days_elapsed if days_elapsed else 0.0
        comparison_pct = (
            round(((total_sales - monthly_daily_average) / monthly_daily_average) * 100, 1)
            if monthly_daily_average > 0 else None
        )

        return {
            'date': report_date.isoformat(),
            'total_sales': round(total_sales, 2),
            'order_count': order_count,
            'average_ticket': round(avg_ticket, 2),
            'monthly_daily_average': round(monthly_daily_average, 2),
            'comparison_vs_monthly_average_pct': comparison_pct,
            'orders': orders_data,
            'hourly_breakdown': hourly_breakdown,
        }

    @staticmethod
    def _resolve_period_range(period, start_date, end_date):
        """
        US-REP-003 CA-1: Resuelve el rango de fechas (start_date, end_date) según
        el tipo de período seleccionado. Para 'custom' se requieren start_date y
        end_date explícitos.
        """
        today = datetime.utcnow().date()

        if period == 'daily':
            return today, today
        elif period == 'weekly':
            return today - timedelta(days=6), today
        elif period == 'monthly':
            return today.replace(day=1), today
        elif period == 'custom':
            if not start_date or not end_date:
                raise ValueError('start_date y end_date son requeridos para el período personalizado')
            if start_date > end_date:
                raise ValueError('start_date no puede ser posterior a end_date')
            return start_date, end_date
        else:
            raise ValueError('Período inválido. Use: daily, weekly, monthly o custom')

    @staticmethod
    def _bucket_key(day, group_by):
        """US-REP-003 CA-5: Calcula la clave de agrupación de una fecha."""
        if group_by == 'week':
            return (day - timedelta(days=day.weekday())).isoformat()
        elif group_by == 'month':
            return day.strftime('%Y-%m')
        return day.isoformat()

    @staticmethod
    def _generate_buckets(start_date, end_date, group_by):
        """US-REP-003 CA-5: Genera todas las claves de bucket en el rango, para
        que el gráfico de evolución incluya períodos sin ventas (valor 0)."""
        buckets = OrderedDict()

        if group_by == 'month':
            cursor = start_date.replace(day=1)
            while cursor <= end_date:
                buckets[cursor.strftime('%Y-%m')] = None
                cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)
        elif group_by == 'week':
            cursor = start_date - timedelta(days=start_date.weekday())
            while cursor <= end_date:
                buckets[cursor.isoformat()] = None
                cursor += timedelta(weeks=1)
        else:
            cursor = start_date
            while cursor <= end_date:
                buckets[cursor.isoformat()] = None
                cursor += timedelta(days=1)

        return list(buckets.keys())

    @staticmethod
    def get_sales_by_period_report(period='custom', start_date=None, end_date=None, group_by='day', status=None):
        """
        US-REP-003: Reporte de ventas por período personalizado.

        CA-1: Período diario, semanal, mensual o personalizado (rango de fechas)
        CA-2: Total de ventas, cantidad de pedidos, ticket promedio, productos vendidos
        CA-3: Evolución de ventas en el período (para gráfico)
        CA-4: Comparación con el período anterior (misma duración)
        CA-5: Agrupación por día, semana o mes
        CA-6: Top 10 productos más vendidos en el período

        Args:
            period: 'daily' | 'weekly' | 'monthly' | 'custom'
            start_date: fecha de inicio (date), requerida si period='custom'
            end_date: fecha de fin (date), requerida si period='custom'
            group_by: 'day' | 'week' | 'month'
            status: filtrar por un estado específico (opcional) — si se omite,
                se excluyen los pedidos "Cancelado"

        Returns:
            dict con métricas, evolución, comparación y top de productos
        """
        if period not in PERIOD_TYPES:
            raise ValueError('Período inválido. Use: daily, weekly, monthly o custom')
        if group_by not in GROUP_BY_OPTIONS:
            raise ValueError('Agrupación inválida. Use: day, week o month')

        range_start_date, range_end_date = ReportService._resolve_period_range(period, start_date, end_date)

        range_start = datetime.combine(range_start_date, datetime.min.time())
        range_end = datetime.combine(range_end_date, datetime.min.time()) + timedelta(days=1)

        query = Order.query.filter(Order.created_at >= range_start, Order.created_at < range_end)
        if status:
            query = query.filter(Order.status == status)
        else:
            query = query.filter(Order.status != NON_SALE_STATUS)

        orders = query.order_by(Order.created_at.asc()).all()

        total_sales = sum((float(o.total) for o in orders), 0.0)
        order_count = len(orders)
        avg_ticket = total_sales / order_count if order_count else 0.0
        products_sold = sum(item.quantity for o in orders for item in o.items)

        orders_data = [
            {
                'id': o.id,
                'order_number': o.order_number,
                'customer_name': o.customer.nombre_razon_social if o.customer else None,
                'total': float(o.total) if o.total else 0.0,
                'status': o.status,
                'created_at': o.created_at.isoformat() if o.created_at else None,
            }
            for o in orders
        ]

        # CA-3/CA-5: Evolución de ventas agrupada
        bucket_keys = ReportService._generate_buckets(range_start_date, range_end_date, group_by)
        bucket_totals = {k: 0.0 for k in bucket_keys}
        bucket_counts = {k: 0 for k in bucket_keys}
        for o in orders:
            key = ReportService._bucket_key(o.created_at.date(), group_by)
            if key in bucket_totals:
                bucket_totals[key] += float(o.total) if o.total else 0.0
                bucket_counts[key] += 1
        evolution = [
            {'period': k, 'total': round(bucket_totals[k], 2), 'order_count': bucket_counts[k]}
            for k in bucket_keys
        ]

        # CA-4: Comparación con el período inmediatamente anterior (misma duración)
        period_days = (range_end_date - range_start_date).days + 1
        prev_end_date = range_start_date - timedelta(days=1)
        prev_start_date = prev_end_date - timedelta(days=period_days - 1)
        prev_range_start = datetime.combine(prev_start_date, datetime.min.time())
        prev_range_end = datetime.combine(prev_end_date, datetime.min.time()) + timedelta(days=1)

        prev_query = Order.query.filter(Order.created_at >= prev_range_start, Order.created_at < prev_range_end)
        if status:
            prev_query = prev_query.filter(Order.status == status)
        else:
            prev_query = prev_query.filter(Order.status != NON_SALE_STATUS)

        prev_total_sales = float(prev_query.with_entities(
            db.func.coalesce(db.func.sum(Order.total), 0)
        ).scalar())
        prev_order_count = prev_query.count()
        comparison_pct = (
            round(((total_sales - prev_total_sales) / prev_total_sales) * 100, 1)
            if prev_total_sales > 0 else None
        )

        # CA-6: Top 10 productos más vendidos en el período
        top_products_query = (
            db.session.query(
                OrderItem.product_id,
                OrderItem.product_name,
                OrderItem.product_sku,
                db.func.sum(OrderItem.quantity).label('total_quantity'),
                db.func.sum(OrderItem.subtotal).label('total_revenue'),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.created_at >= range_start, Order.created_at < range_end)
        )
        if status:
            top_products_query = top_products_query.filter(Order.status == status)
        else:
            top_products_query = top_products_query.filter(Order.status != NON_SALE_STATUS)

        top_products_rows = (
            top_products_query
            .group_by(OrderItem.product_id, OrderItem.product_name, OrderItem.product_sku)
            .order_by(db.func.sum(OrderItem.quantity).desc())
            .limit(10)
            .all()
        )
        top_products = [
            {
                'product_id': row.product_id,
                'product_name': row.product_name,
                'product_sku': row.product_sku,
                'quantity_sold': int(row.total_quantity),
                'total_revenue': round(float(row.total_revenue), 2),
            }
            for row in top_products_rows
        ]

        return {
            'period': period,
            'start_date': range_start_date.isoformat(),
            'end_date': range_end_date.isoformat(),
            'group_by': group_by,
            'total_sales': round(total_sales, 2),
            'order_count': order_count,
            'average_ticket': round(avg_ticket, 2),
            'products_sold': products_sold,
            'previous_period': {
                'start_date': prev_start_date.isoformat(),
                'end_date': prev_end_date.isoformat(),
                'total_sales': round(prev_total_sales, 2),
                'order_count': prev_order_count,
            },
            'comparison_vs_previous_period_pct': comparison_pct,
            'evolution': evolution,
            'top_products': top_products,
            'orders': orders_data,
        }

    @staticmethod
    def get_top_selling_products(period='monthly', start_date=None, end_date=None,
                                  category_id=None, sort_by='quantity', status=None):
        """
        US-REP-004: Reporte de productos más vendidos.

        CA-1: Ranking de productos por cantidad vendida
        CA-2: Filtro por período de tiempo
        CA-3: Nombre, cantidad vendida, ingresos generados y margen de ganancia por producto
        CA-4: Top 10 productos para gráfico de barras
        CA-5: Ordenar por cantidad vendida, ingresos o margen
        CA-6: Filtro por categoría
        CA-7: Porcentaje de participación en ventas totales

        Args:
            period: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom'
            start_date: fecha de inicio (date), requerida si period='custom'
            end_date: fecha de fin (date), requerida si period='custom'
            category_id: filtrar por categoría (opcional)
            sort_by: 'quantity' | 'revenue' | 'margin'
            status: filtrar por un estado específico (opcional) — si se omite,
                se excluyen los pedidos "Cancelado"

        Returns:
            dict con el ranking completo, el top 10 para gráfico y los totales del período
        """
        if period not in TOP_PRODUCTS_PERIOD_TYPES:
            raise ValueError('Período inválido. Use: all, daily, weekly, monthly o custom')
        if sort_by not in TOP_PRODUCTS_SORT_OPTIONS:
            raise ValueError('Ordenamiento inválido. Use: quantity, revenue o margin')

        range_start = range_end = None
        range_start_date = range_end_date = None
        if period != 'all':
            range_start_date, range_end_date = ReportService._resolve_period_range(period, start_date, end_date)
            range_start = datetime.combine(range_start_date, datetime.min.time())
            range_end = datetime.combine(range_end_date, datetime.min.time()) + timedelta(days=1)

        base_query = (
            db.session.query(
                OrderItem.product_id,
                OrderItem.product_name,
                OrderItem.product_sku,
                Product.category_id,
                Category.name.label('category_name'),
                Product.cost_price,
                Product.sale_price,
                db.func.sum(OrderItem.quantity).label('total_quantity'),
                db.func.sum(OrderItem.subtotal).label('total_revenue'),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .outerjoin(Product, OrderItem.product_id == Product.id)
            .outerjoin(Category, Product.category_id == Category.id)
        )
        if range_start is not None:
            base_query = base_query.filter(Order.created_at >= range_start, Order.created_at < range_end)
        if status:
            base_query = base_query.filter(Order.status == status)
        else:
            base_query = base_query.filter(Order.status != NON_SALE_STATUS)

        grouped_query = base_query.group_by(
            OrderItem.product_id, OrderItem.product_name, OrderItem.product_sku,
            Product.category_id, Category.name, Product.cost_price, Product.sale_price,
        )

        # CA-7: el total de ventas del período se calcula SIN el filtro de categoría,
        # para que el % de participación refleje la venta total del negocio.
        all_rows = grouped_query.all()
        total_revenue_all = sum(float(r.total_revenue) for r in all_rows)

        rows = [r for r in all_rows if not category_id or r.category_id == category_id]

        total_quantity_period = sum(int(r.total_quantity) for r in rows)
        total_revenue_period = sum(float(r.total_revenue) for r in rows)

        products = []
        for r in rows:
            cost_price = float(r.cost_price) if r.cost_price else 0.0
            sale_price = float(r.sale_price) if r.sale_price else 0.0
            margin = round(((sale_price - cost_price) / cost_price) * 100, 2) if cost_price > 0 else 0.0
            revenue = round(float(r.total_revenue), 2)
            products.append({
                'product_id': r.product_id,
                'product_name': r.product_name,
                'product_sku': r.product_sku,
                'category_id': r.category_id,
                'category_name': r.category_name,
                'quantity_sold': int(r.total_quantity),
                'total_revenue': revenue,
                'profit_margin': margin,
                'sales_percentage': round((revenue / total_revenue_all) * 100, 2) if total_revenue_all > 0 else 0.0,
            })

        sort_key = {
            'quantity': lambda p: p['quantity_sold'],
            'revenue': lambda p: p['total_revenue'],
            'margin': lambda p: p['profit_margin'],
        }[sort_by]
        products.sort(key=sort_key, reverse=True)

        top_10_chart = sorted(products, key=lambda p: p['quantity_sold'], reverse=True)[:10]

        return {
            'period': period,
            'start_date': range_start_date.isoformat() if range_start_date else None,
            'end_date': range_end_date.isoformat() if range_end_date else None,
            'category_id': category_id,
            'sort_by': sort_by,
            'total_quantity_sold': total_quantity_period,
            'total_revenue': round(total_revenue_period, 2),
            'total_revenue_all_categories': round(total_revenue_all, 2),
            'products': products,
            'top_10_chart': top_10_chart,
        }

    @staticmethod
    def _last_n_month_starts(n):
        """Devuelve los primeros días de los últimos `n` meses (incluye el mes actual), ascendente."""
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        cursor = current_month_start
        for _ in range(n - 1):
            cursor = (cursor - timedelta(days=1)).replace(day=1)
        months = []
        for _ in range(n):
            months.append(cursor)
            cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)
        return months

    @staticmethod
    def _margin_color(margin_pct):
        """US-REP-005 CA-4: Código de colores según el margen de ganancia."""
        if margin_pct < MARGIN_LOW_THRESHOLD:
            return 'rojo'
        elif margin_pct < MARGIN_HIGH_THRESHOLD:
            return 'amarillo'
        return 'verde'

    @staticmethod
    def get_profit_margin_analysis(period='all', start_date=None, end_date=None,
                                    category_id=None, sort_by='margin_pct'):
        """
        US-REP-005: Análisis de márgenes de ganancia por producto.

        CA-1: Precio costo, precio venta, margen (% y $), unidades vendidas por producto
        CA-2: Ganancia total por producto (margen $ × unidades vendidas)
        CA-3: Ordenar por margen %, margen $ o ganancia total
        CA-4: Código de colores: verde (alto), amarillo (medio), rojo (bajo)
        CA-5: Distribución de productos por rango de margen (para gráfico)
        CA-6: Filtro por categoría
        CA-7: Filtro por rango de fechas (unidades vendidas solo del período)
        CA-8: Margen promedio general
        CA-9: Exportación a Excel

        Args:
            period: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom'
            start_date: fecha de inicio (date), requerida si period='custom'
            end_date: fecha de fin (date), requerida si period='custom'
            category_id: filtrar por categoría (opcional)
            sort_by: 'margin_pct' | 'margin_dollar' | 'total_profit'

        Returns:
            dict con la lista de productos, distribución por rango y margen promedio
        """
        if period not in TOP_PRODUCTS_PERIOD_TYPES:
            raise ValueError('Período inválido. Use: all, daily, weekly, monthly o custom')
        if sort_by not in MARGIN_ANALYSIS_SORT_OPTIONS:
            raise ValueError('Ordenamiento inválido. Use: margin_pct, margin_dollar o total_profit')

        range_start = range_end = None
        range_start_date = range_end_date = None
        if period != 'all':
            range_start_date, range_end_date = ReportService._resolve_period_range(period, start_date, end_date)
            range_start = datetime.combine(range_start_date, datetime.min.time())
            range_end = datetime.combine(range_end_date, datetime.min.time()) + timedelta(days=1)

        # CA-7: Unidades vendidas por producto, filtradas por período (si aplica)
        sales_query = (
            db.session.query(
                OrderItem.product_id,
                db.func.sum(OrderItem.quantity).label('units_sold'),
            )
            .join(Order, OrderItem.order_id == Order.id)
            .filter(Order.status != NON_SALE_STATUS)
        )
        if range_start is not None:
            sales_query = sales_query.filter(Order.created_at >= range_start, Order.created_at < range_end)

        units_sold_by_product = {
            row.product_id: int(row.units_sold)
            for row in sales_query.group_by(OrderItem.product_id).all()
        }

        # CA-1/CA-6: Catálogo de productos activos, opcionalmente filtrado por categoría
        products_query = Product.query.filter(Product.is_active.is_(True))
        if category_id:
            products_query = products_query.filter(Product.category_id == category_id)

        products = []
        for product in products_query.all():
            cost_price = float(product.cost_price) if product.cost_price else 0.0
            sale_price = float(product.sale_price) if product.sale_price else 0.0
            margin_pct = product.calculate_profit_margin()
            margin_dollar = round(sale_price - cost_price, 2)
            units_sold = units_sold_by_product.get(product.id, 0)
            total_profit = round(margin_dollar * units_sold, 2)

            products.append({
                'product_id': product.id,
                'product_name': product.name,
                'product_sku': product.sku,
                'category_id': product.category_id,
                'category_name': product.category.name if product.category else None,
                'cost_price': cost_price,
                'sale_price': sale_price,
                'margin_pct': margin_pct,
                'margin_dollar': margin_dollar,
                'units_sold': units_sold,
                'total_profit': total_profit,
                'margin_color': ReportService._margin_color(margin_pct),
            })

        sort_key = {
            'margin_pct': lambda p: p['margin_pct'],
            'margin_dollar': lambda p: p['margin_dollar'],
            'total_profit': lambda p: p['total_profit'],
        }[sort_by]
        products.sort(key=sort_key, reverse=True)

        # CA-5: Distribución de productos por rango de margen (mismos umbrales del código de colores)
        distribution = {'rojo': 0, 'amarillo': 0, 'verde': 0}
        for p in products:
            distribution[p['margin_color']] += 1
        margin_distribution = [
            {'range': 'Bajo (< {}%)'.format(MARGIN_LOW_THRESHOLD), 'color': 'rojo', 'count': distribution['rojo']},
            {'range': 'Medio ({}%-{}%)'.format(MARGIN_LOW_THRESHOLD, MARGIN_HIGH_THRESHOLD), 'color': 'amarillo', 'count': distribution['amarillo']},
            {'range': 'Alto (>= {}%)'.format(MARGIN_HIGH_THRESHOLD), 'color': 'verde', 'count': distribution['verde']},
        ]

        # CA-8: Margen promedio general (promedio simple del margen % de los productos listados)
        average_margin_pct = round(sum(p['margin_pct'] for p in products) / len(products), 2) if products else 0.0

        return {
            'period': period,
            'start_date': range_start_date.isoformat() if range_start_date else None,
            'end_date': range_end_date.isoformat() if range_end_date else None,
            'category_id': category_id,
            'sort_by': sort_by,
            'average_margin_pct': average_margin_pct,
            'margin_distribution': margin_distribution,
            'products': products,
        }

    @staticmethod
    def get_current_inventory_report(category_id=None, stock_status=None, sort_by='name'):
        """
        US-REP-006: Reporte del estado actual del inventario.

        CA-1: SKU, nombre, categoría, stock actual, valor en inventario por producto
        CA-2: Valor total del inventario
        CA-3: Filtro por categoría y por estado de stock (normal, bajo, sin stock)
        CA-4: Ordenar por nombre, stock o valor
        CA-5: Distribución de inventario por categoría (para gráfico)
        CA-6: Productos con stock bajo o sin stock quedan marcados (campo 'stock_status')
        CA-7: Exportación a Excel/CSV
        CA-8: Timestamp del reporte

        Args:
            category_id: filtrar por categoría (opcional)
            stock_status: 'normal' | 'low_stock' | 'out_of_stock' (opcional)
            sort_by: 'name' | 'stock' | 'value'

        Returns:
            dict con la lista de productos, valor total, distribución por categoría y timestamp
        """
        if stock_status and stock_status not in INVENTORY_REPORT_STOCK_STATUSES:
            raise ValueError('Estado de stock inválido. Use: normal, low_stock o out_of_stock')
        if sort_by not in INVENTORY_REPORT_SORT_OPTIONS:
            raise ValueError('Ordenamiento inválido. Use: name, stock o value')

        query = Product.query.filter(Product.is_active.is_(True))
        if category_id:
            query = query.filter(Product.category_id == category_id)

        products = []
        category_totals = OrderedDict()
        total_value = 0.0

        for product in query.all():
            status = product.get_stock_status()
            if stock_status and status != stock_status:
                continue

            cost_price = float(product.cost_price) if product.cost_price else 0.0
            item_value = round(cost_price * product.stock_quantity, 2)
            total_value += item_value

            category_name = product.category.name if product.category else 'Sin categoría'
            bucket = category_totals.setdefault(category_name, {'category_name': category_name, 'total_value': 0.0, 'product_count': 0})
            bucket['total_value'] += item_value
            bucket['product_count'] += 1

            products.append({
                'product_id': product.id,
                'sku': product.sku,
                'name': product.name,
                'category_id': product.category_id,
                'category_name': category_name,
                'stock_quantity': product.stock_quantity,
                'reorder_point': product.reorder_point,
                'item_value': item_value,
                'stock_status': status,
            })

        sort_key = {
            'name': lambda p: p['name'].lower(),
            'stock': lambda p: p['stock_quantity'],
            'value': lambda p: p['item_value'],
        }[sort_by]
        products.sort(key=sort_key, reverse=(sort_by != 'name'))

        # CA-5: Distribución del valor de inventario por categoría
        category_distribution = [
            {
                'category_name': c['category_name'],
                'total_value': round(c['total_value'], 2),
                'product_count': c['product_count'],
                'percentage': round((c['total_value'] / total_value) * 100, 2) if total_value > 0 else 0.0,
            }
            for c in category_totals.values()
        ]
        category_distribution.sort(key=lambda c: c['total_value'], reverse=True)

        status_counts = {'normal': 0, 'low_stock': 0, 'out_of_stock': 0}
        for p in products:
            status_counts[p['stock_status']] += 1

        return {
            'category_id': category_id,
            'stock_status': stock_status,
            'sort_by': sort_by,
            'total_value': round(total_value, 2),
            'total_products': len(products),
            'status_counts': status_counts,
            'category_distribution': category_distribution,
            'products': products,
            'generated_at': datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_inventory_movements_report(start_date=None, end_date=None, product_id=None,
                                        movement_type=None, user_id=None, category_id=None):
        """
        US-REP-007: Reporte de movimientos de inventario en un período.

        CA-1: Selección de rango de fechas
        CA-2: Fecha/hora, producto, tipo de movimiento, cantidad, usuario por movimiento
        CA-3: Filtro por producto, tipo de movimiento, usuario
        CA-4: Resumen de total de entradas, total de salidas, balance neto
        CA-5: Filtro por categoría de producto
        CA-6: Datos de entradas vs salidas por día (para gráfico)
        CA-7: Exportación a Excel/CSV
        CA-8: Movimientos ordenados cronológicamente

        Args:
            start_date: fecha de inicio (date), default hace 30 días
            end_date: fecha de fin (date), default hoy
            product_id: filtrar por producto (opcional)
            movement_type: filtrar por tipo de movimiento (opcional)
            user_id: filtrar por usuario (opcional)
            category_id: filtrar por categoría del producto (opcional)

        Returns:
            dict con la lista de movimientos, resumen de entradas/salidas y evolución diaria
        """
        end_date = end_date or datetime.utcnow().date()
        start_date = start_date or (end_date - timedelta(days=29))
        if start_date > end_date:
            raise ValueError('start_date no puede ser posterior a end_date')

        range_start = datetime.combine(start_date, datetime.min.time())
        range_end = datetime.combine(end_date, datetime.min.time()) + timedelta(days=1)

        query = (
            db.session.query(InventoryMovement, Product, User)
            .join(Product, InventoryMovement.product_id == Product.id)
            .join(User, InventoryMovement.user_id == User.id)
            .filter(InventoryMovement.created_at >= range_start, InventoryMovement.created_at < range_end)
        )
        if product_id:
            query = query.filter(InventoryMovement.product_id == product_id)
        if movement_type:
            query = query.filter(InventoryMovement.movement_type == movement_type)
        if user_id:
            query = query.filter(InventoryMovement.user_id == user_id)
        if category_id:
            query = query.filter(Product.category_id == category_id)

        # CA-8: orden cronológico ascendente
        rows = query.order_by(InventoryMovement.created_at.asc()).all()

        total_in = 0
        total_out = 0
        daily_buckets = OrderedDict()
        movements = []

        for movement, product, user in rows:
            if movement.quantity >= 0:
                total_in += movement.quantity
            else:
                total_out += abs(movement.quantity)

            day_key = movement.created_at.date().isoformat()
            bucket = daily_buckets.setdefault(day_key, {'date': day_key, 'in': 0, 'out': 0})
            if movement.quantity >= 0:
                bucket['in'] += movement.quantity
            else:
                bucket['out'] += abs(movement.quantity)

            movements.append({
                'id': movement.id,
                'created_at': movement.created_at.isoformat() if movement.created_at else None,
                'product_id': movement.product_id,
                'product_name': product.name,
                'product_sku': product.sku,
                'movement_type': movement.movement_type,
                'quantity': movement.quantity,
                'previous_stock': movement.previous_stock,
                'new_stock': movement.new_stock,
                'user_id': movement.user_id,
                'user_name': user.full_name,
                'reason': movement.reason,
                'reference': movement.reference,
            })

        return {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'product_id': product_id,
            'movement_type': movement_type,
            'user_id': user_id,
            'category_id': category_id,
            'summary': {
                'total_in': total_in,
                'total_out': total_out,
                'net_balance': total_in - total_out,
                'movement_count': len(movements),
            },
            'daily_evolution': list(daily_buckets.values()),
            'movements': movements,
        }

    @staticmethod
    def get_low_stock_report():
        """
        US-REP-008: Reporte de productos con stock bajo que necesitan reabastecimiento.

        CA-1: Productos con stock en o bajo el punto de reorden
        CA-2: Nombre, SKU, stock actual, punto de reorden, proveedor preferido, días
              estimados sin stock
        CA-3: Ordenado por urgencia (sin stock primero, luego por días estimados)
        CA-4: Cantidad sugerida de reorden basada en promedio de ventas
        CA-5: Agrupación por proveedor (se entrega el campo 'preferred_supplier' por
              producto para que el frontend agrupe, igual que en US-SUPP-015)
        CA-6: Creación de orden de compra directamente desde el reporte (frontend)
        CA-7: Exportación a Excel/CSV
        CA-8: Timestamp del reporte

        Reutiliza `RestockSuggestionService.get_suggestions()` (US-SUPP-015) como
        fuente de datos (proveedor preferido, cantidad sugerida) y añade el cálculo
        de días estimados sin stock y el ordenamiento por urgencia que pide esta US.

        Returns:
            dict con la lista de productos y el timestamp del reporte
        """
        suggestions = RestockSuggestionService.get_suggestions(include_dismissed=False)

        products = []
        for s in suggestions:
            avg_daily_sales = s['average_daily_sales']
            if s['stock_quantity'] <= 0:
                days_until_stockout = 0
            elif avg_daily_sales > 0:
                days_until_stockout = round(s['stock_quantity'] / avg_daily_sales, 1)
            else:
                days_until_stockout = None

            products.append({
                'product_id': s['product_id'],
                'product_name': s['product_name'],
                'product_sku': s['product_sku'],
                'stock_quantity': s['stock_quantity'],
                'reorder_point': s['reorder_point'],
                'is_out_of_stock': s['is_out_of_stock'],
                'average_daily_sales': avg_daily_sales,
                'days_until_stockout': days_until_stockout,
                'suggested_quantity': s['suggested_quantity'],
                'preferred_supplier': s['preferred_supplier'],
            })

        # CA-3: sin stock primero, luego ascendente por días estimados (sin datos de venta al final)
        products.sort(key=lambda p: (
            0 if p['is_out_of_stock'] else 1,
            p['days_until_stockout'] if p['days_until_stockout'] is not None else float('inf'),
        ))

        return {
            'total_products': len(products),
            'out_of_stock_count': sum(1 for p in products if p['is_out_of_stock']),
            'products': products,
            'generated_at': datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_sales_by_seller_report(period='monthly', start_date=None, end_date=None):
        """
        US-REP-009: Reporte de desempeño de ventas por vendedor.

        CA-1: Cantidad de pedidos, monto total vendido, ticket promedio por vendedor
        CA-2: Filtro por período de tiempo
        CA-3: Porcentaje de participación de cada vendedor en las ventas totales
        CA-4: Datos comparativos entre vendedores (para gráfico)
        CA-5: Top productos vendidos por cada vendedor
        CA-6: Detalle de pedidos por vendedor
        CA-7: Tasa de conversión (pedidos confirmados vs pendientes)
        CA-8: Exportación a PDF/Excel

        Args:
            period: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom'
            start_date: fecha de inicio (date), requerida si period='custom'
            end_date: fecha de fin (date), requerida si period='custom'

        Returns:
            dict con el desempeño por vendedor y el total de ventas del período
        """
        if period not in TOP_PRODUCTS_PERIOD_TYPES:
            raise ValueError('Período inválido. Use: all, daily, weekly, monthly o custom')

        range_start = range_end = None
        range_start_date = range_end_date = None
        if period != 'all':
            range_start_date, range_end_date = ReportService._resolve_period_range(period, start_date, end_date)
            range_start = datetime.combine(range_start_date, datetime.min.time())
            range_end = datetime.combine(range_end_date, datetime.min.time()) + timedelta(days=1)

        # CA-1/CA-6: Pedidos del período (excluyendo cancelados) con su vendedor
        query = db.session.query(Order, User).join(User, Order.created_by_id == User.id)
        if range_start is not None:
            query = query.filter(Order.created_at >= range_start, Order.created_at < range_end)
        query = query.filter(Order.status != NON_SALE_STATUS)

        orders_by_seller = OrderedDict()
        for order, seller in query.order_by(Order.created_at.asc()).all():
            bucket = orders_by_seller.setdefault(seller.id, {'seller': seller, 'orders': []})
            bucket['orders'].append(order)

        total_sales_all_sellers = sum(
            float(o.total) for b in orders_by_seller.values() for o in b['orders']
        )

        # CA-7: Tasa de conversión — se calcula sobre TODOS los pedidos (incluye cancelados
        # en el conteo de pendientes/confirmados no aplica, ya que solo se comparan esos dos estados)
        conversion_query = db.session.query(Order.created_by_id, Order.status).filter(
            Order.status.in_(['Confirmado', 'Pendiente'])
        )
        if range_start is not None:
            conversion_query = conversion_query.filter(Order.created_at >= range_start, Order.created_at < range_end)

        conversion_counts = {}
        for seller_id, status in conversion_query.all():
            counts = conversion_counts.setdefault(seller_id, {'Confirmado': 0, 'Pendiente': 0})
            counts[status] += 1

        sellers = []
        for seller_id, bucket in orders_by_seller.items():
            seller = bucket['seller']
            orders = bucket['orders']
            order_count = len(orders)
            total_sales = sum(float(o.total) for o in orders)
            average_ticket = total_sales / order_count if order_count else 0.0

            # CA-5: Top 5 productos vendidos por este vendedor
            order_ids = [o.id for o in orders]
            top_products_rows = (
                db.session.query(
                    OrderItem.product_id,
                    OrderItem.product_name,
                    OrderItem.product_sku,
                    db.func.sum(OrderItem.quantity).label('total_quantity'),
                    db.func.sum(OrderItem.subtotal).label('total_revenue'),
                )
                .filter(OrderItem.order_id.in_(order_ids))
                .group_by(OrderItem.product_id, OrderItem.product_name, OrderItem.product_sku)
                .order_by(db.func.sum(OrderItem.quantity).desc())
                .limit(5)
                .all()
            ) if order_ids else []

            top_products = [
                {
                    'product_id': row.product_id,
                    'product_name': row.product_name,
                    'product_sku': row.product_sku,
                    'quantity_sold': int(row.total_quantity),
                    'total_revenue': round(float(row.total_revenue), 2),
                }
                for row in top_products_rows
            ]

            counts = conversion_counts.get(seller_id, {'Confirmado': 0, 'Pendiente': 0})
            conversion_total = counts['Confirmado'] + counts['Pendiente']
            conversion_rate = round((counts['Confirmado'] / conversion_total) * 100, 2) if conversion_total > 0 else None

            sellers.append({
                'seller_id': seller.id,
                'seller_name': seller.full_name,
                'order_count': order_count,
                'total_sales': round(total_sales, 2),
                'average_ticket': round(average_ticket, 2),
                'sales_percentage': round((total_sales / total_sales_all_sellers) * 100, 2) if total_sales_all_sellers > 0 else 0.0,
                'conversion_rate': conversion_rate,
                'confirmed_count': counts['Confirmado'],
                'pending_count': counts['Pendiente'],
                'top_products': top_products,
                'orders': [
                    {
                        'id': o.id,
                        'order_number': o.order_number,
                        'customer_name': o.customer.nombre_razon_social if o.customer else None,
                        'total': float(o.total) if o.total else 0.0,
                        'status': o.status,
                        'created_at': o.created_at.isoformat() if o.created_at else None,
                    }
                    for o in orders
                ],
            })

        sellers.sort(key=lambda s: s['total_sales'], reverse=True)

        return {
            'period': period,
            'start_date': range_start_date.isoformat() if range_start_date else None,
            'end_date': range_end_date.isoformat() if range_end_date else None,
            'total_sales': round(total_sales_all_sellers, 2),
            'sellers': sellers,
        }

    @staticmethod
    def get_customer_report(period='monthly', start_date=None, end_date=None, at_risk_days=CUSTOMER_AT_RISK_DAYS):
        """
        US-REP-010: Reporte de la base de clientes.

        CA-1: Total de clientes, clientes activos (con compras en el período), nuevos clientes
        CA-2: Top 10 clientes por monto de compra
        CA-3: Distribución de clientes por nivel (VIP, Frecuente, Regular)
        CA-4: Frecuencia promedio de compra
        CA-5: Clientes en riesgo (sin compras en X días)
        CA-6: Filtro por período
        CA-7: Datos de nuevos clientes por mes (últimos 12 meses) y distribución por nivel
        CA-8: Exportación a Excel/CSV

        Args:
            period: 'all' | 'daily' | 'weekly' | 'monthly' | 'custom'
            start_date: fecha de inicio (date), requerida si period='custom'
            end_date: fecha de fin (date), requerida si period='custom'
            at_risk_days: días sin compras a partir de los cuales un cliente está "en riesgo"

        Returns:
            dict con métricas generales, top clientes, distribución por nivel y clientes en riesgo
        """
        if period not in TOP_PRODUCTS_PERIOD_TYPES:
            raise ValueError('Período inválido. Use: all, daily, weekly, monthly o custom')

        range_start = range_end = None
        range_start_date = range_end_date = None
        if period != 'all':
            range_start_date, range_end_date = ReportService._resolve_period_range(period, start_date, end_date)
            range_start = datetime.combine(range_start_date, datetime.min.time())
            range_end = datetime.combine(range_end_date, datetime.min.time()) + timedelta(days=1)

        total_customers = Customer.query.filter(Customer.is_active.is_(True)).count()

        # CA-1: Nuevos clientes registrados en el período
        new_customers_query = Customer.query.filter(Customer.is_active.is_(True))
        if range_start is not None:
            new_customers_query = new_customers_query.filter(Customer.created_at >= range_start, Customer.created_at < range_end)
        new_customers = new_customers_query.count()

        # CA-1: Clientes activos — con al menos un pedido no cancelado en el período
        active_query = db.session.query(Order.customer_id).filter(Order.status != NON_SALE_STATUS)
        if range_start is not None:
            active_query = active_query.filter(Order.created_at >= range_start, Order.created_at < range_end)
        active_customers = active_query.distinct().count()

        # CA-2: Top 10 clientes por monto de compra en el período
        top_customers_query = (
            db.session.query(
                Customer.id,
                Customer.nombre_razon_social,
                Customer.customer_category,
                db.func.sum(Order.total).label('total_spent'),
                db.func.count(Order.id).label('order_count'),
            )
            .join(Order, Order.customer_id == Customer.id)
            .filter(Order.status != NON_SALE_STATUS)
        )
        if range_start is not None:
            top_customers_query = top_customers_query.filter(Order.created_at >= range_start, Order.created_at < range_end)

        top_customers_rows = (
            top_customers_query
            .group_by(Customer.id, Customer.nombre_razon_social, Customer.customer_category)
            .order_by(db.func.sum(Order.total).desc())
            .limit(10)
            .all()
        )
        top_customers = [
            {
                'customer_id': row.id,
                'customer_name': row.nombre_razon_social,
                'customer_category': row.customer_category,
                'total_spent': round(float(row.total_spent), 2),
                'order_count': int(row.order_count),
            }
            for row in top_customers_rows
        ]

        # CA-3: Distribución de clientes por nivel
        category_counts = dict(
            db.session.query(Customer.customer_category, db.func.count(Customer.id))
            .filter(Customer.is_active.is_(True))
            .group_by(Customer.customer_category)
            .all()
        )
        category_distribution = [
            {
                'category': cat,
                'count': category_counts.get(cat, 0),
                'percentage': round((category_counts.get(cat, 0) / total_customers) * 100, 2) if total_customers > 0 else 0.0,
            }
            for cat in CUSTOMER_CATEGORIES
        ]

        # CA-4: Frecuencia promedio de compra — promedio (entre clientes con 2+ pedidos) de
        # los días transcurridos entre pedidos consecutivos
        order_dates_rows = (
            db.session.query(Order.customer_id, Order.created_at)
            .filter(Order.status != NON_SALE_STATUS)
            .order_by(Order.customer_id, Order.created_at.asc())
            .all()
        )
        dates_by_customer = OrderedDict()
        for customer_id, created_at in order_dates_rows:
            dates_by_customer.setdefault(customer_id, []).append(created_at)

        per_customer_avg_gaps = []
        for dates in dates_by_customer.values():
            if len(dates) < 2:
                continue
            gaps = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
            per_customer_avg_gaps.append(sum(gaps) / len(gaps))

        average_purchase_frequency_days = (
            round(sum(per_customer_avg_gaps) / len(per_customer_avg_gaps), 1) if per_customer_avg_gaps else None
        )

        # CA-5: Clientes en riesgo — su último pedido fue hace más de `at_risk_days` días
        last_order_rows = (
            db.session.query(Order.customer_id, db.func.max(Order.created_at).label('last_order_at'))
            .filter(Order.status != NON_SALE_STATUS)
            .group_by(Order.customer_id)
            .all()
        )
        risk_cutoff = datetime.utcnow() - timedelta(days=at_risk_days)
        at_risk_customer_ids = [row.customer_id for row in last_order_rows if row.last_order_at < risk_cutoff]

        at_risk_customers = []
        if at_risk_customer_ids:
            last_order_map = {row.customer_id: row.last_order_at for row in last_order_rows}
            customers = Customer.query.filter(
                Customer.id.in_(at_risk_customer_ids), Customer.is_active.is_(True)
            ).all()
            for c in customers:
                last_order_at = last_order_map[c.id]
                at_risk_customers.append({
                    'customer_id': c.id,
                    'customer_name': c.nombre_razon_social,
                    'customer_category': c.customer_category,
                    'last_order_at': last_order_at.isoformat(),
                    'days_since_last_order': (datetime.utcnow() - last_order_at).days,
                })
            at_risk_customers.sort(key=lambda c: c['days_since_last_order'], reverse=True)

        # CA-7: Nuevos clientes por mes (últimos 12 meses, independiente del filtro de período)
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        twelve_months_ago = current_month_start
        for _ in range(11):
            twelve_months_ago = (twelve_months_ago - timedelta(days=1)).replace(day=1)

        new_customers_rows = (
            db.session.query(Customer.created_at)
            .filter(Customer.is_active.is_(True), Customer.created_at >= twelve_months_ago)
            .all()
        )
        monthly_buckets = OrderedDict()
        cursor = twelve_months_ago
        for _ in range(12):
            monthly_buckets[cursor.strftime('%Y-%m')] = 0
            cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)
        for (created_at,) in new_customers_rows:
            key = created_at.strftime('%Y-%m')
            if key in monthly_buckets:
                monthly_buckets[key] += 1
        new_customers_by_month = [{'month': k, 'count': v} for k, v in monthly_buckets.items()]

        return {
            'period': period,
            'start_date': range_start_date.isoformat() if range_start_date else None,
            'end_date': range_end_date.isoformat() if range_end_date else None,
            'total_customers': total_customers,
            'active_customers': active_customers,
            'new_customers': new_customers,
            'average_purchase_frequency_days': average_purchase_frequency_days,
            'at_risk_days_threshold': at_risk_days,
            'at_risk_customers': at_risk_customers,
            'top_customers': top_customers,
            'category_distribution': category_distribution,
            'new_customers_by_month': new_customers_by_month,
            'generated_at': datetime.utcnow().isoformat(),
        }

    @staticmethod
    def get_sales_trends_report():
        """
        US-REP-011: Análisis de tendencias de ventas.

        CA-1: Ventas por mes de los últimos 12 meses (para gráfico de línea)
        CA-2: Meses pico y meses bajos
        CA-3: Tasa de crecimiento promedio mensual
        CA-4: Comparación año actual vs año anterior
        CA-5: Análisis de estacionalidad (promedio histórico por mes calendario)
        CA-6: Tendencias por categoría de producto
        CA-7: Proyección simple para los próximos 3 meses
        CA-8: Exportación de datos y gráficos a PDF

        Returns:
            dict con la evolución mensual, comparación anual, estacionalidad,
            tendencias por categoría y proyección
        """
        # CA-1: Ventas de los últimos 12 meses
        month_starts = ReportService._last_n_month_starts(12)
        window_start = month_starts[0]
        window_end = (month_starts[-1].replace(day=28) + timedelta(days=4)).replace(day=1)

        orders_rows = (
            db.session.query(Order.created_at, Order.total)
            .filter(Order.created_at >= window_start, Order.created_at < window_end, Order.status != NON_SALE_STATUS)
            .all()
        )

        monthly_totals = OrderedDict((m.strftime('%Y-%m'), 0.0) for m in month_starts)
        for created_at, total in orders_rows:
            key = created_at.strftime('%Y-%m')
            if key in monthly_totals:
                monthly_totals[key] += float(total) if total else 0.0

        monthly_sales = [{'month': k, 'total': round(v, 2)} for k, v in monthly_totals.items()]

        # CA-2: Mes pico y mes bajo
        peak_month = max(monthly_sales, key=lambda m: m['total'])
        low_month = min(monthly_sales, key=lambda m: m['total'])

        # CA-3: Tasa de crecimiento promedio mensual (% mes a mes, ignorando meses base en 0)
        growth_rates = []
        values = [m['total'] for m in monthly_sales]
        for i in range(1, len(values)):
            if values[i - 1] > 0:
                growth_rates.append((values[i] - values[i - 1]) / values[i - 1] * 100)
        average_monthly_growth_rate = round(sum(growth_rates) / len(growth_rates), 2) if growth_rates else None

        # CA-4: Comparación año actual vs año anterior (por mes calendario, Ene-Dic)
        current_year = datetime.utcnow().year
        previous_year = current_year - 1
        yoy_rows = (
            db.session.query(
                db.func.extract('year', Order.created_at).label('year'),
                db.func.extract('month', Order.created_at).label('month'),
                db.func.sum(Order.total).label('total'),
            )
            .filter(
                db.func.extract('year', Order.created_at).in_([current_year, previous_year]),
                Order.status != NON_SALE_STATUS,
            )
            .group_by('year', 'month')
            .all()
        )
        yoy_totals = {(int(row.year), int(row.month)): float(row.total or 0) for row in yoy_rows}
        yoy_comparison = [
            {
                'month': month_num,
                'current_year_total': round(yoy_totals.get((current_year, month_num), 0.0), 2),
                'previous_year_total': round(yoy_totals.get((previous_year, month_num), 0.0), 2),
            }
            for month_num in range(1, 13)
        ]

        # CA-5: Estacionalidad — promedio histórico de ventas por mes calendario (todos los años)
        seasonality_rows = (
            db.session.query(
                db.func.extract('month', Order.created_at).label('month'),
                db.func.extract('year', Order.created_at).label('year'),
                db.func.sum(Order.total).label('total'),
            )
            .filter(Order.status != NON_SALE_STATUS)
            .group_by('month', 'year')
            .all()
        )
        month_year_totals = OrderedDict()
        for row in seasonality_rows:
            month_year_totals.setdefault(int(row.month), []).append(float(row.total or 0))
        seasonality = [
            {
                'month': month_num,
                'average_total': round(sum(month_year_totals.get(month_num, [0])) / len(month_year_totals[month_num]), 2) if month_num in month_year_totals else 0.0,
                'years_with_data': len(month_year_totals.get(month_num, [])),
            }
            for month_num in range(1, 13)
        ]

        # CA-6: Tendencias por categoría de producto (últimos 12 meses, top 5 categorías por venta total)
        category_rows = (
            db.session.query(
                Category.id, Category.name, Order.created_at, OrderItem.subtotal,
            )
            .select_from(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .outerjoin(Product, OrderItem.product_id == Product.id)
            .outerjoin(Category, Product.category_id == Category.id)
            .filter(Order.created_at >= window_start, Order.created_at < window_end, Order.status != NON_SALE_STATUS)
            .all()
        )
        category_monthly = OrderedDict()
        category_totals = {}
        for category_id, category_name, created_at, subtotal in category_rows:
            name = category_name or 'Sin categoría'
            key = created_at.strftime('%Y-%m')
            bucket = category_monthly.setdefault(name, OrderedDict((m.strftime('%Y-%m'), 0.0) for m in month_starts))
            if key in bucket:
                bucket[key] += float(subtotal) if subtotal else 0.0
            category_totals[name] = category_totals.get(name, 0.0) + (float(subtotal) if subtotal else 0.0)

        top_categories = sorted(category_totals.items(), key=lambda kv: kv[1], reverse=True)[:5]
        category_trends = [
            {
                'category_name': name,
                'total': round(total, 2),
                'monthly': [{'month': k, 'total': round(v, 2)} for k, v in category_monthly[name].items()],
            }
            for name, total in top_categories
        ]

        # CA-7: Proyección simple para los próximos 3 meses (regresión lineal por mínimos cuadrados)
        n = len(values)
        x_values = list(range(n))
        x_mean = sum(x_values) / n
        y_mean = sum(values) / n
        numerator = sum((x_values[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x_values[i] - x_mean) ** 2 for i in range(n))
        slope = numerator / denominator if denominator > 0 else 0.0
        intercept = y_mean - slope * x_mean

        projection_month_starts = []
        cursor = month_starts[-1]
        for _ in range(3):
            cursor = (cursor.replace(day=28) + timedelta(days=4)).replace(day=1)
            projection_month_starts.append(cursor)

        projection = [
            {
                'month': m.strftime('%Y-%m'),
                'projected_total': round(max(0.0, slope * (n + i) + intercept), 2),
            }
            for i, m in enumerate(projection_month_starts)
        ]

        return {
            'monthly_sales': monthly_sales,
            'peak_month': peak_month,
            'low_month': low_month,
            'average_monthly_growth_rate': average_monthly_growth_rate,
            'current_year': current_year,
            'previous_year': previous_year,
            'yoy_comparison': yoy_comparison,
            'seasonality': seasonality,
            'category_trends': category_trends,
            'projection': projection,
        }

    @staticmethod
    def get_purchase_orders_report(supplier_id=None, status=None, start_date=None, end_date=None):
        """
        US-REP-012: Reporte de órdenes de compra a proveedores.

        CA-1: Número, proveedor, fecha, monto, estado por orden
        CA-2: Filtro por proveedor, estado, rango de fechas
        CA-3: Total de compras en el período
        CA-4: Distribución de gastos por proveedor
        CA-5: Tasa de cumplimiento por proveedor (órdenes a tiempo vs total recibidas)
        CA-6: Órdenes atrasadas
        CA-7: Compras por mes (para gráfico)
        CA-8: Exportación a Excel/CSV

        Args:
            supplier_id: filtrar por proveedor (opcional)
            status: filtrar por estado (opcional)
            start_date: fecha de inicio (date), default hace 12 meses
            end_date: fecha de fin (date), default hoy

        Returns:
            dict con la lista de órdenes, distribución por proveedor, cumplimiento,
            órdenes atrasadas y compras por mes
        """
        end_date = end_date or datetime.utcnow().date()
        start_date = start_date or ReportService._last_n_month_starts(12)[0].date()
        if start_date > end_date:
            raise ValueError('start_date no puede ser posterior a end_date')

        range_start = datetime.combine(start_date, datetime.min.time())
        range_end = datetime.combine(end_date, datetime.min.time()) + timedelta(days=1)

        query = PurchaseOrder.query.filter(
            PurchaseOrder.created_at >= range_start, PurchaseOrder.created_at < range_end
        )
        if supplier_id:
            query = query.filter(PurchaseOrder.supplier_id == supplier_id)
        if status:
            query = query.filter(PurchaseOrder.status == status)

        orders = query.order_by(PurchaseOrder.created_at.desc()).all()

        orders_data = [
            {
                'id': o.id,
                'order_number': o.order_number,
                'supplier_id': o.supplier_id,
                'supplier_name': o.supplier.company_name if o.supplier else None,
                'created_at': o.created_at.isoformat() if o.created_at else None,
                'expected_delivery_date': o.expected_delivery_date.isoformat() if o.expected_delivery_date else None,
                'received_at': o.received_at.isoformat() if o.received_at else None,
                'total': float(o.total) if o.total else 0.0,
                'status': o.status,
            }
            for o in orders
        ]

        # CA-3: Total de compras del período (excluye canceladas)
        non_cancelled = [o for o in orders if o.status != PURCHASE_ORDER_CANCELLED_STATUS]
        total_purchases = sum(float(o.total) for o in non_cancelled)

        # CA-4/CA-5: Distribución de gastos y tasa de cumplimiento por proveedor
        suppliers = OrderedDict()
        for o in orders:
            bucket = suppliers.setdefault(o.supplier_id, {
                'supplier_id': o.supplier_id,
                'supplier_name': o.supplier.company_name if o.supplier else 'Sin proveedor',
                'total_spent': 0.0,
                'order_count': 0,
                'received_orders': [],
            })
            bucket['order_count'] += 1
            if o.status != PURCHASE_ORDER_CANCELLED_STATUS:
                bucket['total_spent'] += float(o.total) if o.total else 0.0
            if o.status == PURCHASE_ORDER_RECEIVED_STATUS:
                bucket['received_orders'].append(o)

        supplier_distribution = []
        for bucket in suppliers.values():
            received = bucket['received_orders']
            on_time_count = sum(
                1 for o in received
                if not o.expected_delivery_date or (o.received_at and o.received_at.date() <= o.expected_delivery_date)
            )
            fulfillment_rate = round(on_time_count / len(received) * 100, 1) if received else None

            supplier_distribution.append({
                'supplier_id': bucket['supplier_id'],
                'supplier_name': bucket['supplier_name'],
                'total_spent': round(bucket['total_spent'], 2),
                'order_count': bucket['order_count'],
                'percentage': round((bucket['total_spent'] / total_purchases) * 100, 2) if total_purchases > 0 else 0.0,
                'fulfillment_rate': fulfillment_rate,
            })
        supplier_distribution.sort(key=lambda s: s['total_spent'], reverse=True)

        # CA-6: Órdenes atrasadas — no recibidas/canceladas y con fecha estimada vencida
        today = datetime.utcnow().date()
        overdue_orders = [
            {
                'id': o.id,
                'order_number': o.order_number,
                'supplier_name': o.supplier.company_name if o.supplier else None,
                'expected_delivery_date': o.expected_delivery_date.isoformat(),
                'days_overdue': (today - o.expected_delivery_date).days,
                'status': o.status,
            }
            for o in orders
            if o.status not in PURCHASE_ORDER_TERMINAL_STATUSES and o.expected_delivery_date and o.expected_delivery_date < today
        ]
        overdue_orders.sort(key=lambda o: o['days_overdue'], reverse=True)

        # CA-7: Compras por mes en el rango filtrado
        bucket_keys = ReportService._generate_buckets(start_date, end_date, 'month')
        monthly_totals = {k: 0.0 for k in bucket_keys}
        for o in non_cancelled:
            key = o.created_at.strftime('%Y-%m')
            if key in monthly_totals:
                monthly_totals[key] += float(o.total) if o.total else 0.0
        monthly_purchases = [{'month': k, 'total': round(monthly_totals[k], 2)} for k in bucket_keys]

        return {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'supplier_id': supplier_id,
            'status': status,
            'total_purchases': round(total_purchases, 2),
            'order_count': len(orders),
            'supplier_distribution': supplier_distribution,
            'overdue_orders': overdue_orders,
            'monthly_purchases': monthly_purchases,
            'orders': orders_data,
        }

    @staticmethod
    def get_returns_report(start_date=None, end_date=None, status=None):
        """
        US-REP-015: Reporte de devoluciones de productos.

        CA-1: Fecha, pedido, cliente, productos devueltos y motivo por devolución
        CA-2: Filtro por rango de fechas
        CA-3: Tasa de devolución (% de pedidos con devolución)
        CA-4: Productos con más devoluciones
        CA-5: Agrupación de devoluciones por motivo
        CA-6: Impacto económico de las devoluciones
        CA-7: Devoluciones por mes (para gráfico)
        CA-8: Exportación a Excel/CSV

        Args:
            start_date: fecha de inicio (date), default hace 12 meses
            end_date: fecha de fin (date), default hoy
            status: filtrar por estado de la devolución (opcional; sin filtro,
                se excluyen las devoluciones "Rechazada" de las métricas económicas)

        Returns:
            dict con la lista de devoluciones, tasa de devolución, productos y
            motivos más frecuentes, impacto económico y evolución mensual
        """
        end_date = end_date or datetime.utcnow().date()
        start_date = start_date or ReportService._last_n_month_starts(12)[0].date()
        if start_date > end_date:
            raise ValueError('start_date no puede ser posterior a end_date')

        range_start = datetime.combine(start_date, datetime.min.time())
        range_end = datetime.combine(end_date, datetime.min.time()) + timedelta(days=1)

        query = Return.query.filter(Return.return_date >= range_start, Return.return_date < range_end)
        if status:
            query = query.filter(Return.status == status)

        returns = query.order_by(Return.return_date.desc()).all()
        valid_returns = [r for r in returns if r.status != RETURN_REJECTED_STATUS] if not status else returns

        returns_data = [
            {
                'id': r.id,
                'return_number': r.return_number,
                'order_id': r.order_id,
                'order_number': r.order.order_number if r.order else None,
                'customer_name': r.order.customer.nombre_razon_social if r.order and r.order.customer else None,
                'return_date': r.return_date.isoformat() if r.return_date else None,
                'products': [{'product_name': i.product_name, 'quantity': i.quantity} for i in r.items],
                'reason': r.reason,
                'total_amount': float(r.total_amount) if r.total_amount else 0.0,
                'status': r.status,
            }
            for r in returns
        ]

        # CA-3: Tasa de devolución — % de pedidos del período con al menos una devolución válida
        total_orders = Order.query.filter(Order.created_at >= range_start, Order.created_at < range_end).count()
        orders_with_returns = len({r.order_id for r in valid_returns})
        return_rate = round((orders_with_returns / total_orders) * 100, 2) if total_orders > 0 else 0.0

        # CA-6: Impacto económico total
        total_economic_impact = round(sum(float(r.total_amount) for r in valid_returns), 2)

        # CA-4: Productos con más devoluciones
        product_stats = OrderedDict()
        for r in valid_returns:
            for item in r.items:
                bucket = product_stats.setdefault(item.product_id, {
                    'product_id': item.product_id,
                    'product_name': item.product_name,
                    'product_sku': item.product_sku,
                    'quantity_returned': 0,
                    'total_amount': 0.0,
                })
                bucket['quantity_returned'] += item.quantity
                bucket['total_amount'] += float(item.subtotal) if item.subtotal else 0.0
        top_returned_products = sorted(
            [{**p, 'total_amount': round(p['total_amount'], 2)} for p in product_stats.values()],
            key=lambda p: p['quantity_returned'], reverse=True
        )[:10]

        # CA-5: Devoluciones agrupadas por motivo
        reason_stats = OrderedDict()
        for r in valid_returns:
            bucket = reason_stats.setdefault(r.reason, {'reason': r.reason, 'count': 0, 'total_amount': 0.0})
            bucket['count'] += 1
            bucket['total_amount'] += float(r.total_amount) if r.total_amount else 0.0
        returns_by_reason = sorted(
            [{**b, 'total_amount': round(b['total_amount'], 2)} for b in reason_stats.values()],
            key=lambda b: b['count'], reverse=True
        )

        # CA-7: Devoluciones por mes
        bucket_keys = ReportService._generate_buckets(start_date, end_date, 'month')
        monthly_counts = {k: {'count': 0, 'total_amount': 0.0} for k in bucket_keys}
        for r in valid_returns:
            key = r.return_date.strftime('%Y-%m')
            if key in monthly_counts:
                monthly_counts[key]['count'] += 1
                monthly_counts[key]['total_amount'] += float(r.total_amount) if r.total_amount else 0.0
        monthly_returns = [
            {'month': k, 'count': v['count'], 'total_amount': round(v['total_amount'], 2)}
            for k, v in monthly_counts.items()
        ]

        return {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'status': status,
            'total_returns': len(returns),
            'return_rate': return_rate,
            'total_economic_impact': total_economic_impact,
            'top_returned_products': top_returned_products,
            'returns_by_reason': returns_by_reason,
            'monthly_returns': monthly_returns,
            'returns': returns_data,
        }
