"""
Servicio de Reportes
US-REP-002: Reporte de Ventas Diarias
US-REP-003: Reporte de Ventas por Período
"""
from datetime import datetime, timedelta
from collections import OrderedDict
from app import db
from app.models.order import Order, OrderItem

# Estados considerados "venta" para efectos de los reportes — los pedidos
# cancelados se excluyen de las métricas de venta por defecto.
NON_SALE_STATUS = 'Cancelado'

# US-REP-003: Períodos predefinidos soportados
PERIOD_TYPES = ('daily', 'weekly', 'monthly', 'custom')
GROUP_BY_OPTIONS = ('day', 'week', 'month')


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
