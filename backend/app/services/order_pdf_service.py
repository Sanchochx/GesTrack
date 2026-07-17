"""
Servicio de generación de PDF de pedidos
US-ORD-012: CA-9 - Exportar Pedido a PDF
"""
import io
import re
import unicodedata

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
)
from reportlab.lib.enums import TA_RIGHT, TA_CENTER

from app.utils.constants import COMPANY_INFO


def _format_currency(amount):
    return '${:,.0f}'.format(amount or 0)


def _format_date(dt):
    if not dt:
        return '-'
    meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ]
    return f'{dt.day} de {meses[dt.month - 1]} de {dt.year}'


class OrderPdfService:
    """CA-9: Genera un PDF con el mismo formato del pedido imprimible (CA-2 a CA-6)"""

    @staticmethod
    def generate_pdf(order):
        """
        Genera el PDF de un pedido.

        Args:
            order: Instancia del modelo Order

        Returns:
            io.BytesIO con el contenido del PDF
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=letter,
            topMargin=2 * cm, bottomMargin=2 * cm,
            leftMargin=2 * cm, rightMargin=2 * cm,
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('TitleRight', parent=styles['Heading2'], alignment=TA_RIGHT)
        normal_right = ParagraphStyle('NormalRight', parent=styles['Normal'], alignment=TA_RIGHT)
        bold = ParagraphStyle('Bold', parent=styles['Normal'], fontName='Helvetica-Bold')
        signature_style = ParagraphStyle('Signature', parent=styles['Normal'], alignment=TA_CENTER)

        elements = []

        # CA-2: Cabecera (empresa a la izquierda, datos del pedido a la derecha)
        header_data = [[
            Paragraph(
                f"<b>{COMPANY_INFO['name']}</b><br/>{COMPANY_INFO['address']}<br/>"
                f"{COMPANY_INFO['phone']} · {COMPANY_INFO['email']}",
                styles['Normal'],
            ),
            Paragraph(
                f"<b>PEDIDO</b><br/><b>{order.order_number}</b><br/>"
                f"Fecha: {_format_date(order.created_at)}<br/>Estado: {order.status}",
                title_style,
            ),
        ]]
        header_table = Table(header_data, colWidths=[9 * cm, 9 * cm])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 0.5 * cm))

        # CA-3: Información del cliente
        customer = order.customer
        address_parts = [customer.direccion, customer.municipio_ciudad, customer.departamento] if customer else []
        address = ', '.join([p for p in address_parts if p]) or '-'
        elements.append(Paragraph('<b>Entregar a</b>', styles['Normal']))
        elements.append(Paragraph(customer.nombre_razon_social if customer else '-', styles['Normal']))
        elements.append(Paragraph(address, styles['Normal']))
        elements.append(Paragraph(f'Teléfono: {customer.telefono_movil if customer else "-"}', styles['Normal']))
        elements.append(Paragraph(f'Email: {customer.correo if customer else "-"}', styles['Normal']))
        elements.append(Spacer(1, 0.5 * cm))

        # CA-4: Tabla de productos
        table_data = [['Cant.', 'Producto', 'SKU', 'Precio Unit.', 'Subtotal']]
        for item in order.items:
            table_data.append([
                str(item.quantity),
                item.product_name,
                item.product_sku,
                _format_currency(float(item.unit_price)),
                _format_currency(float(item.subtotal)),
            ])
        items_table = Table(table_data, colWidths=[1.8 * cm, 6.5 * cm, 3 * cm, 3.3 * cm, 3.4 * cm])
        items_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('BACKGROUND', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (3, 0), (4, -1), 'RIGHT'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 0.5 * cm))

        # CA-5: Desglose de totales, alineado a la derecha
        totals_data = [['Subtotal', _format_currency(float(order.subtotal))]]
        if order.discount_amount:
            totals_data.append(['Descuento', f'-{_format_currency(float(order.discount_amount))}'])
            totals_data.append([
                'Subtotal neto',
                _format_currency(float(order.subtotal) - float(order.discount_amount)),
            ])
        if order.tax_percentage:
            totals_data.append([f'IVA ({float(order.tax_percentage)}%)', _format_currency(float(order.tax_amount))])
        if order.shipping_cost:
            totals_data.append(['Envío', _format_currency(float(order.shipping_cost))])
        totals_data.append(['TOTAL', _format_currency(float(order.total))])

        totals_table = Table(totals_data, colWidths=[4 * cm, 4 * cm], hAlign='RIGHT')
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
            ('TOPPADDING', (0, -1), (-1, -1), 6),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
        ]))
        elements.append(totals_table)
        elements.append(Spacer(1, 0.5 * cm))

        # US-ORD-014 CA-9: Motivo del descuento aplicado
        if order.discount_amount and order.discount_justification:
            elements.append(Paragraph('<b>Motivo del descuento</b>', styles['Normal']))
            elements.append(Paragraph(order.discount_justification, styles['Normal']))
            elements.append(Spacer(1, 0.3 * cm))

        # CA-6: Información adicional
        if order.notes:
            elements.append(Paragraph('<b>Notas</b>', styles['Normal']))
            elements.append(Paragraph(order.notes, styles['Normal']))
            elements.append(Spacer(1, 0.3 * cm))

        elements.append(Paragraph(COMPANY_INFO['terms'], styles['Italic']))
        elements.append(Spacer(1, 2 * cm))

        signature_table = Table(
            [[
                Paragraph('_____________________<br/>Firma del Vendedor', signature_style),
                Paragraph('_____________________<br/>Firma del Cliente', signature_style),
            ]],
            colWidths=[9 * cm, 9 * cm],
        )
        elements.append(signature_table)

        doc.build(elements)
        buffer.seek(0)
        return buffer

    @staticmethod
    def build_filename(order):
        """CA-9: Nombre de archivo 'Pedido_ORD-XXXX_[Cliente].pdf', sin caracteres especiales"""
        customer_name = order.customer.nombre_razon_social if order.customer else 'Cliente'
        normalized = unicodedata.normalize('NFKD', customer_name).encode('ascii', 'ignore').decode('ascii')
        safe_name = re.sub(r'[^A-Za-z0-9]+', '_', normalized).strip('_') or 'Cliente'
        return f'Pedido_{order.order_number}_{safe_name}.pdf'
