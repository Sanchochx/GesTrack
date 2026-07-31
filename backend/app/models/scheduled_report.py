"""
Modelo de Reportes Programados
US-REP-013: Exportación Masiva de Reportes (envío automático por email)
"""
from app import db
from datetime import datetime
import uuid

# Tipos de frecuencia soportados
FREQUENCIES = ('daily', 'weekly', 'monthly')


class ScheduledReport(db.Model):
    """Configuración de un reporte que se genera y envía por email periódicamente"""

    __tablename__ = 'scheduled_reports'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    name = db.Column(db.String(200), nullable=False)
    report_type = db.Column(db.String(50), nullable=False)
    parameters = db.Column(db.JSON, nullable=True)
    frequency = db.Column(db.String(20), nullable=False)
    recipients = db.Column(db.JSON, nullable=False)
    file_format = db.Column(db.String(10), nullable=False, default='excel')
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    next_run_at = db.Column(db.DateTime, nullable=False)
    last_run_at = db.Column(db.DateTime, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by = db.relationship('User', foreign_keys=[created_by_id])
    runs = db.relationship(
        'ScheduledReportRun', backref='scheduled_report',
        lazy='dynamic', cascade='all, delete-orphan',
        order_by='ScheduledReportRun.run_at.desc()',
    )

    def __repr__(self):
        return f'<ScheduledReport {self.name} ({self.report_type}, {self.frequency})>'

    def to_dict(self, include_history=False):
        data = {
            'id': self.id,
            'name': self.name,
            'report_type': self.report_type,
            'parameters': self.parameters or {},
            'frequency': self.frequency,
            'recipients': self.recipients or [],
            'file_format': self.file_format,
            'is_active': self.is_active,
            'created_by_id': self.created_by_id,
            'created_by_name': self.created_by.full_name if self.created_by else None,
            'next_run_at': self.next_run_at.isoformat() if self.next_run_at else None,
            'last_run_at': self.last_run_at.isoformat() if self.last_run_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_history:
            data['history'] = [r.to_dict() for r in self.runs.limit(20).all()]
        return data


class ScheduledReportRun(db.Model):
    """Registro de una ejecución (exitosa o fallida) de un reporte programado"""

    __tablename__ = 'scheduled_report_runs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scheduled_report_id = db.Column(
        db.String(36), db.ForeignKey('scheduled_reports.id', ondelete='CASCADE'), nullable=False
    )

    run_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    status = db.Column(db.String(20), nullable=False)
    error_message = db.Column(db.Text, nullable=True)
    recipients_sent = db.Column(db.JSON, nullable=True)
    file_size_bytes = db.Column(db.Integer, nullable=True)

    def __repr__(self):
        return f'<ScheduledReportRun {self.scheduled_report_id} {self.status}>'

    def to_dict(self):
        return {
            'id': self.id,
            'scheduled_report_id': self.scheduled_report_id,
            'run_at': self.run_at.isoformat() if self.run_at else None,
            'status': self.status,
            'error_message': self.error_message,
            'recipients_sent': self.recipients_sent or [],
            'file_size_bytes': self.file_size_bytes,
        }
