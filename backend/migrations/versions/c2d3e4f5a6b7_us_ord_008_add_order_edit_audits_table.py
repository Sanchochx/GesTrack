"""US-ORD-008: Add order_edit_audits table for order edit auditing

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-07-17 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c2d3e4f5a6b7'
down_revision = 'b1c2d3e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    # CA-10: Crear tabla order_edit_audits
    op.create_table(
        'order_edit_audits',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('edited_by_id', sa.String(length=36), nullable=False),
        sa.Column('changes', sa.JSON(), nullable=False),
        sa.Column('edit_reason', sa.Text(), nullable=True),
        sa.Column('edited_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['edited_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_order_edit_audits_order_id'), 'order_edit_audits', ['order_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_order_edit_audits_order_id'), table_name='order_edit_audits')
    op.drop_table('order_edit_audits')
