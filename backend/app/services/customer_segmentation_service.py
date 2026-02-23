"""
CustomerSegmentationService - Lógica de segmentación de clientes
US-CUST-011

Calcula y persiste la categoría de cada cliente (VIP, Frecuente, Regular)
basándose en el monto total gastado en pedidos no cancelados.
"""
from app import db
from sqlalchemy import func


def calculate_and_update_category(customer_id, order_id=None, commit=True):
    """
    Calcula la categoría del cliente a partir de sus pedidos y la persiste en DB.
    Registra el cambio en customer_category_history si la categoría varía.

    Args:
        customer_id (str): UUID del cliente
        order_id (str|None): UUID del pedido que disparó el recálculo (para trazabilidad)
        commit (bool): Si es True, hace db.session.commit()

    Returns:
        dict: { 'category': str, 'total_spent': float, 'changed': bool }
    """
    from app.models.customer import Customer
    from app.models.order import Order
    from app.models.customer_segmentation_config import CustomerSegmentationConfig
    from app.models.customer_category_history import CustomerCategoryHistory

    customer = Customer.query.get(customer_id)
    if not customer:
        return None

    config = CustomerSegmentationConfig.get_config()

    # Sumar pedidos no cancelados
    total_spent = db.session.query(func.sum(Order.total)).filter(
        Order.customer_id == customer_id,
        Order.status != 'Cancelado'
    ).scalar() or 0
    total_spent = float(total_spent)

    # Determinar nueva categoría
    if total_spent >= float(config.vip_threshold):
        new_category = 'VIP'
    elif total_spent >= float(config.frequent_threshold):
        new_category = 'Frecuente'
    else:
        new_category = 'Regular'

    old_category = customer.customer_category
    changed = old_category != new_category

    # Actualizar el campo en el modelo
    customer.customer_category = new_category

    # Registrar cambio de categoría si corresponde
    if changed:
        history = CustomerCategoryHistory(
            customer_id=customer_id,
            old_category=old_category,
            new_category=new_category,
            order_id=order_id,
            total_spent=total_spent,
        )
        db.session.add(history)

    if commit:
        db.session.commit()

    return {
        'category': new_category,
        'total_spent': total_spent,
        'changed': changed,
        'old_category': old_category,
    }


def recalculate_all_categories():
    """
    Recalcula la categoría de todos los clientes activos.
    Usado cuando el Admin cambia los umbrales de segmentación.

    Returns:
        dict: { 'updated': int, 'changed': int }
    """
    from app.models.customer import Customer

    customers = Customer.query.all()
    updated = 0
    changed = 0

    for customer in customers:
        result = calculate_and_update_category(customer.id, commit=False)
        if result:
            updated += 1
            if result['changed']:
                changed += 1

    db.session.commit()
    return {'updated': updated, 'changed': changed}


def get_segmentation_stats():
    """
    Retorna estadísticas de segmentación para el dashboard.

    Returns:
        dict con distribución, métricas por categoría y top VIP clientes
    """
    from app.models.customer import Customer
    from app.models.customer_segmentation_config import CustomerSegmentationConfig

    config = CustomerSegmentationConfig.get_config()

    # Distribución de categorías
    distribution_query = db.session.query(
        Customer.customer_category,
        func.count(Customer.id).label('count')
    ).group_by(Customer.customer_category).all()

    distribution = {row.customer_category: row.count for row in distribution_query}
    total_customers = sum(distribution.values())

    categories = ['VIP', 'Frecuente', 'Regular']
    distribution_data = []
    for cat in categories:
        count = distribution.get(cat, 0)
        distribution_data.append({
            'category': cat,
            'count': count,
            'percentage': round(count / total_customers * 100, 1) if total_customers > 0 else 0,
        })

    # Métricas por categoría: total gastado y promedio (de customers con datos reales)
    # Calculamos a partir del campo total_purchases sumado en la vista de lista
    # Por eficiencia, lo leemos del customer_category_history o directamente de orders
    from app.models.order import Order

    metrics_query = db.session.query(
        Customer.customer_category,
        func.count(Customer.id).label('count'),
        func.sum(Order.total).label('total_spent'),
    ).outerjoin(
        Order,
        (Order.customer_id == Customer.id) & (Order.status != 'Cancelado')
    ).group_by(Customer.customer_category).all()

    metrics = {}
    for row in metrics_query:
        cat = row.customer_category
        count = int(row.count or 0)
        total = float(row.total_spent or 0)
        avg = round(total / count, 2) if count > 0 else 0.0
        metrics[cat] = {
            'count': count,
            'total_spent': total,
            'avg_spent': avg,
        }

    metrics_data = []
    for cat in categories:
        m = metrics.get(cat, {'count': 0, 'total_spent': 0.0, 'avg_spent': 0.0})
        metrics_data.append({
            'category': cat,
            **m,
        })

    # Top 10 clientes VIP por gasto total
    top_vip_query = db.session.query(
        Customer.id,
        Customer.nombre_razon_social,
        Customer.correo,
        Customer.customer_category,
        func.sum(Order.total).label('total_spent'),
        func.count(Order.id).label('order_count'),
    ).join(
        Order,
        (Order.customer_id == Customer.id) & (Order.status != 'Cancelado')
    ).filter(
        Customer.customer_category == 'VIP'
    ).group_by(
        Customer.id, Customer.nombre_razon_social, Customer.correo, Customer.customer_category
    ).order_by(
        func.sum(Order.total).desc()
    ).limit(10).all()

    top_vip = [{
        'id': row.id,
        'nombre_razon_social': row.nombre_razon_social,
        'correo': row.correo,
        'total_spent': float(row.total_spent or 0),
        'order_count': int(row.order_count or 0),
    } for row in top_vip_query]

    return {
        'distribution': distribution_data,
        'metrics': metrics_data,
        'top_vip': top_vip,
        'total_customers': total_customers,
        'config': config.to_dict(),
    }
