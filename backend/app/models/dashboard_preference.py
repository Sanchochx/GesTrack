"""
Modelo de Preferencias de Dashboard Personalizable
US-REP-014: Dashboard Personalizable
"""
from app import db
from datetime import datetime
import uuid


class DashboardPreference(db.Model):
    """Configuración de widgets del dashboard, guardada por usuario"""

    __tablename__ = 'dashboard_preferences'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, unique=True, index=True)

    # CA-1/CA-3/CA-7: Lista ordenada de widgets: [{ "widget_type": "daily_sales", "size": "half" }, ...]
    widgets = db.Column(db.JSON, nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def __repr__(self):
        return f'<DashboardPreference user={self.user_id} widgets={len(self.widgets or [])}>'

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'widgets': self.widgets or [],
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
