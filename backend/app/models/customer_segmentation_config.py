"""
CustomerSegmentationConfig - Configuración de rangos para segmentación de clientes
US-CUST-011 CA-1 & CA-7
"""
from app import db
from datetime import datetime


class CustomerSegmentationConfig(db.Model):
    """
    Tabla de configuración de rangos de segmentación de clientes.
    Single-row config pattern: siempre existe exactamente un registro (id=1).
    """
    __tablename__ = 'customer_segmentation_config'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    # Umbral mínimo de gasto total para ser VIP
    vip_threshold = db.Column(db.Numeric(10, 2), nullable=False, default=500000.00)

    # Umbral mínimo de gasto total para ser Frecuente
    frequent_threshold = db.Column(db.Numeric(10, 2), nullable=False, default=200000.00)

    updated_at = db.Column(db.DateTime, nullable=True)
    updated_by = db.Column(db.String(36), nullable=True)

    def to_dict(self):
        return {
            'vip_threshold': float(self.vip_threshold),
            'frequent_threshold': float(self.frequent_threshold),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'updated_by': self.updated_by,
        }

    @classmethod
    def get_config(cls):
        """Obtiene la configuración actual, creando un registro por defecto si no existe."""
        config = cls.query.first()
        if not config:
            config = cls(vip_threshold=500000.00, frequent_threshold=200000.00)
            db.session.add(config)
            db.session.commit()
        return config
