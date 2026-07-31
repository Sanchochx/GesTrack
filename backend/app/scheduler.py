"""
Scheduler en background para reportes programados
US-REP-013: Exportación Masiva de Reportes

Usa APScheduler para revisar periódicamente si hay reportes programados
pendientes de ejecución (dentro del mismo proceso de la app, sin
infraestructura adicional como Celery/Redis).
"""
import logging
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

# Cada cuántos minutos se revisan las programaciones pendientes
CHECK_INTERVAL_MINUTES = 15

_scheduler = None


def _run_due_reports_job(app):
    with app.app_context():
        from app.services.scheduled_report_service import ScheduledReportService
        try:
            results = ScheduledReportService.run_due_reports()
            if results:
                logger.info('US-REP-013: %d reporte(s) programado(s) ejecutado(s)', len(results))
        except Exception:
            logger.exception('US-REP-013: Error al ejecutar reportes programados')


def start_scheduler(app):
    """
    Inicia el job en background que revisa reportes programados pendientes.
    Se debe llamar una sola vez por proceso (ver guard en app/__init__.py).
    """
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    _scheduler = BackgroundScheduler(daemon=True)
    _scheduler.add_job(
        func=_run_due_reports_job,
        args=[app],
        trigger='interval',
        minutes=CHECK_INTERVAL_MINUTES,
        id='scheduled_reports_check',
        replace_existing=True,
    )
    _scheduler.start()
    logger.info('US-REP-013: Scheduler de reportes programados iniciado (cada %d min)', CHECK_INTERVAL_MINUTES)
    return _scheduler
