"""
Modelo de Sugerencia de Reabastecimiento Procesada
US-SUPP-015: Notificaciones de Reabastecimiento
"""
from app import db
from datetime import datetime
import uuid


class RestockSuggestionDismissal(db.Model):
    """
    Registra que un gerente de almacén marcó como procesada la sugerencia de
    reabastecimiento de un producto. La sugerencia reaparece automáticamente
    si el stock disponible empeora respecto al momento en que se procesó.
    """

    __tablename__ = 'restock_suggestion_dismissals'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    product_id = db.Column(db.String(36), db.ForeignKey('products.id'), nullable=False, unique=True, index=True)
    dismissed_by_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    # Stock disponible al momento de procesar la sugerencia — si el stock actual
    # cae por debajo de este valor, se considera que la situación empeoró y la
    # sugerencia vuelve a mostrarse.
    stock_quantity_at_dismissal = db.Column(db.Integer, nullable=False)

    dismissed_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relaciones
    product = db.relationship('Product')
    dismissed_by = db.relationship('User', foreign_keys=[dismissed_by_id])

    def __repr__(self):
        return f'<RestockSuggestionDismissal product={self.product_id}>'
