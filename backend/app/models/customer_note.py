"""Modelo de Nota del Cliente
US-CUST-009: Notas del Cliente
"""
from app import db
from datetime import datetime
import uuid


class CustomerNote(db.Model):
    """Nota adjunta al perfil de un cliente. Append-only (no eliminación)."""

    __tablename__ = 'customer_notes'

    # Primary Key
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Foreign Keys
    customer_id = db.Column(
        db.String(36),
        db.ForeignKey('customers.id', ondelete='CASCADE'),
        nullable=False,
        index=True
    )
    created_by_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True
    )
    updated_by_id = db.Column(
        db.String(36),
        db.ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True
    )

    # Content
    content = db.Column(db.Text, nullable=False)
    is_important = db.Column(db.Boolean, default=False, nullable=False)

    # Timestamps (updated_at = NULL means never edited)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=True)

    # Composite index for chronological queries
    __table_args__ = (
        db.Index('ix_customer_notes_customer_created', 'customer_id', 'created_at'),
    )

    # Relationships
    customer = db.relationship('Customer', back_populates='customer_notes')
    created_by = db.relationship('User', foreign_keys=[created_by_id], lazy='joined')
    updated_by = db.relationship('User', foreign_keys=[updated_by_id], lazy='joined')

    def __repr__(self):
        return f'<CustomerNote {self.id[:8]} for customer {self.customer_id[:8]}>'

    def to_dict(self, current_user_id=None):
        """Convertir nota a diccionario"""
        creator_name = None
        creator_initials = '?'
        if self.created_by:
            creator_name = self.created_by.full_name
            parts = creator_name.split()
            if len(parts) >= 2:
                creator_initials = (parts[0][0] + parts[-1][0]).upper()
            elif parts:
                creator_initials = parts[0][:2].upper()

        editor_name = None
        if self.updated_by:
            editor_name = self.updated_by.full_name

        can_edit = (current_user_id is not None and self.created_by_id == current_user_id)

        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'content': self.content,
            'is_important': self.is_important,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by_id': self.created_by_id,
            'creator_name': creator_name,
            'creator_initials': creator_initials,
            'editor_name': editor_name,
            'was_edited': self.updated_at is not None,
            'can_edit': can_edit,
        }
