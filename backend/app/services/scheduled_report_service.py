"""
Servicio de Reportes Programados
US-REP-013: Exportación Masiva de Reportes (generación y envío automático por email)
"""
from datetime import datetime, timedelta
from app import db
from app.models.scheduled_report import ScheduledReport, ScheduledReportRun, FREQUENCIES
from app.services.report_service import ReportService
from app.utils.export_helper import ExportHelper
from app.services.email_service import EmailService

FILE_FORMATS = ('excel', 'pdf')


def _sales_period_export(params):
    data = ReportService.get_sales_by_period_report(**params)
    return data, ExportHelper.export_sales_by_period_report_to_excel(data['orders'], data['start_date'], data['end_date'])


def _top_products_export(params):
    data = ReportService.get_top_selling_products(**params)
    return data, ExportHelper.export_top_selling_products_to_excel(data['products'])


def _profit_margin_export(params):
    data = ReportService.get_profit_margin_analysis(**params)
    return data, ExportHelper.export_profit_margin_analysis_to_excel(data['products'])


def _inventory_export(params):
    data = ReportService.get_current_inventory_report(**params)
    return data, ExportHelper.export_current_inventory_report_to_excel(data['products'], data['generated_at'])


def _inventory_movements_export(params):
    data = ReportService.get_inventory_movements_report(**params)
    return data, ExportHelper.export_inventory_movements_report_to_excel(data['movements'], data['start_date'], data['end_date'])


def _low_stock_export(params):
    data = ReportService.get_low_stock_report()
    products = [
        {**p, 'supplier_name': p['preferred_supplier']['supplier_name'] if p['preferred_supplier'] else 'Sin proveedor asignado'}
        for p in data['products']
    ]
    return data, ExportHelper.export_low_stock_report_to_excel(products)


def _sales_by_seller_export(params):
    data = ReportService.get_sales_by_seller_report(**params)
    return data, ExportHelper.export_sales_by_seller_report_to_excel(data['sellers'])


def _customers_export(params):
    data = ReportService.get_customer_report(**params)
    return data, ExportHelper.export_customer_report_to_excel(data['top_customers'])


def _purchase_orders_export(params):
    data = ReportService.get_purchase_orders_report(**params)
    return data, ExportHelper.export_purchase_orders_report_to_excel(data['orders'], data['start_date'], data['end_date'])


def _sales_trends_export(params):
    data = ReportService.get_sales_trends_report()
    return data, ExportHelper.export_sales_trends_report_to_pdf(data)


# CA-3: Tipos de reporte disponibles para programar
REPORT_REGISTRY = {
    'sales-period': {'label': 'Ventas por Período', 'export_fn': _sales_period_export, 'format': 'excel'},
    'top-products': {'label': 'Productos Más Vendidos', 'export_fn': _top_products_export, 'format': 'excel'},
    'profit-margin': {'label': 'Análisis de Márgenes de Ganancia', 'export_fn': _profit_margin_export, 'format': 'excel'},
    'inventory': {'label': 'Inventario Actual', 'export_fn': _inventory_export, 'format': 'excel'},
    'inventory-movements': {'label': 'Movimientos de Inventario', 'export_fn': _inventory_movements_export, 'format': 'excel'},
    'low-stock': {'label': 'Productos con Stock Bajo', 'export_fn': _low_stock_export, 'format': 'excel'},
    'sales-by-seller': {'label': 'Desempeño de Ventas por Vendedor', 'export_fn': _sales_by_seller_export, 'format': 'excel'},
    'customers': {'label': 'Reporte de Clientes', 'export_fn': _customers_export, 'format': 'excel'},
    'purchase-orders': {'label': 'Órdenes de Compra a Proveedores', 'export_fn': _purchase_orders_export, 'format': 'excel'},
    'sales-trends': {'label': 'Tendencias de Ventas', 'export_fn': _sales_trends_export, 'format': 'pdf'},
}


class ScheduledReportService:
    """Lógica de negocio para la programación y ejecución de reportes automáticos"""

    @staticmethod
    def get_available_report_types():
        """CA-3: Lista de tipos de reporte disponibles para programar"""
        return [{'value': key, 'label': meta['label'], 'format': meta['format']} for key, meta in REPORT_REGISTRY.items()]

    @staticmethod
    def _compute_next_run(from_time, frequency):
        """CA-2: Calcula la próxima ejecución según la frecuencia configurada"""
        if frequency == 'daily':
            return from_time + timedelta(days=1)
        elif frequency == 'weekly':
            return from_time + timedelta(weeks=1)
        elif frequency == 'monthly':
            month = from_time.month + 1
            year = from_time.year + (1 if month > 12 else 0)
            month = 1 if month > 12 else month
            day = min(from_time.day, 28)
            return from_time.replace(year=year, month=month, day=day)
        raise ValueError('Frecuencia inválida. Use: daily, weekly o monthly')

    @staticmethod
    def create_schedule(name, report_type, frequency, recipients, created_by_id, parameters=None, file_format=None):
        """CA-1/CA-2/CA-3/CA-5: Crea una nueva programación de reporte"""
        if report_type not in REPORT_REGISTRY:
            raise ValueError(f'Tipo de reporte inválido. Use uno de: {", ".join(REPORT_REGISTRY.keys())}')
        if frequency not in FREQUENCIES:
            raise ValueError(f'Frecuencia inválida. Use: {", ".join(FREQUENCIES)}')
        if not recipients or not isinstance(recipients, list):
            raise ValueError('Debe especificar al menos un destinatario')

        now = datetime.utcnow()
        schedule = ScheduledReport(
            name=name,
            report_type=report_type,
            parameters=parameters or {},
            frequency=frequency,
            recipients=recipients,
            file_format=file_format or REPORT_REGISTRY[report_type]['format'],
            is_active=True,
            created_by_id=created_by_id,
            next_run_at=ScheduledReportService._compute_next_run(now, frequency),
        )
        db.session.add(schedule)
        db.session.commit()
        return schedule

    @staticmethod
    def update_schedule(schedule_id, **updates):
        """Actualiza nombre, parámetros, frecuencia o destinatarios de una programación"""
        schedule = ScheduledReport.query.get(schedule_id)
        if not schedule:
            raise ValueError('Reporte programado no encontrado')

        if 'name' in updates and updates['name']:
            schedule.name = updates['name']
        if 'parameters' in updates:
            schedule.parameters = updates['parameters'] or {}
        if 'recipients' in updates:
            if not updates['recipients']:
                raise ValueError('Debe especificar al menos un destinatario')
            schedule.recipients = updates['recipients']
        if 'file_format' in updates and updates['file_format']:
            if updates['file_format'] not in FILE_FORMATS:
                raise ValueError('Formato inválido. Use: excel o pdf')
            schedule.file_format = updates['file_format']
        if 'frequency' in updates and updates['frequency']:
            if updates['frequency'] not in FREQUENCIES:
                raise ValueError(f'Frecuencia inválida. Use: {", ".join(FREQUENCIES)}')
            schedule.frequency = updates['frequency']
            schedule.next_run_at = ScheduledReportService._compute_next_run(datetime.utcnow(), schedule.frequency)

        db.session.commit()
        return schedule

    @staticmethod
    def toggle_active(schedule_id, is_active):
        """CA-7: Activa o pausa una programación"""
        schedule = ScheduledReport.query.get(schedule_id)
        if not schedule:
            raise ValueError('Reporte programado no encontrado')

        schedule.is_active = is_active
        if is_active:
            schedule.next_run_at = ScheduledReportService._compute_next_run(datetime.utcnow(), schedule.frequency)
        db.session.commit()
        return schedule

    @staticmethod
    def delete_schedule(schedule_id):
        schedule = ScheduledReport.query.get(schedule_id)
        if not schedule:
            raise ValueError('Reporte programado no encontrado')
        db.session.delete(schedule)
        db.session.commit()

    @staticmethod
    def _execute(schedule):
        """
        CA-4/CA-6/CA-8: Genera el archivo del reporte, lo envía por email a los
        destinatarios configurados y registra el resultado en el historial.
        """
        meta = REPORT_REGISTRY.get(schedule.report_type)
        if not meta:
            raise ValueError(f'Tipo de reporte desconocido: {schedule.report_type}')

        _, response = meta['export_fn'](schedule.parameters or {})
        file_bytes = response.get_data()
        extension = 'pdf' if meta['format'] == 'pdf' else 'xlsx'
        mimetype = response.mimetype
        filename = f"{schedule.report_type}_{datetime.utcnow().strftime('%Y%m%d')}.{extension}"

        subject = f"GesTrack — {schedule.name}"
        html_content = (
            f"<p>Adjunto encontrarás el reporte programado <b>{schedule.name}</b> "
            f"({meta['label']}), generado automáticamente por GesTrack.</p>"
        )

        for recipient in schedule.recipients:
            EmailService.send_email_with_attachment(
                to_email=recipient,
                subject=subject,
                html_content=html_content,
                attachment_bytes=file_bytes,
                attachment_filename=filename,
                attachment_mimetype=mimetype,
            )

        return len(file_bytes)

    @staticmethod
    def run_now(schedule_id):
        """CA-1: Ejecuta una programación inmediatamente (fuera de su ciclo normal)"""
        schedule = ScheduledReport.query.get(schedule_id)
        if not schedule:
            raise ValueError('Reporte programado no encontrado')
        return ScheduledReportService._run_and_log(schedule, reschedule=False)

    @staticmethod
    def _run_and_log(schedule, reschedule=True):
        """CA-8: Ejecuta una programación y registra el resultado en el historial"""
        try:
            file_size = ScheduledReportService._execute(schedule)
            run = ScheduledReportRun(
                scheduled_report_id=schedule.id,
                status='success',
                recipients_sent=schedule.recipients,
                file_size_bytes=file_size,
            )
            schedule.last_run_at = datetime.utcnow()
            if reschedule:
                schedule.next_run_at = ScheduledReportService._compute_next_run(datetime.utcnow(), schedule.frequency)
        except Exception as e:
            run = ScheduledReportRun(
                scheduled_report_id=schedule.id,
                status='error',
                error_message=str(e),
            )
            schedule.last_run_at = datetime.utcnow()
            if reschedule:
                schedule.next_run_at = ScheduledReportService._compute_next_run(datetime.utcnow(), schedule.frequency)

        db.session.add(run)
        db.session.commit()
        return run

    @staticmethod
    def run_due_reports():
        """
        CA-1/CA-2: Ejecuta todas las programaciones activas cuya próxima ejecución
        ya se cumplió. Pensado para ser invocado periódicamente por el scheduler
        en background (ver app/scheduler.py).
        """
        now = datetime.utcnow()
        due = ScheduledReport.query.filter(
            ScheduledReport.is_active.is_(True), ScheduledReport.next_run_at <= now
        ).all()

        results = []
        for schedule in due:
            run = ScheduledReportService._run_and_log(schedule, reschedule=True)
            results.append(run)
        return results
