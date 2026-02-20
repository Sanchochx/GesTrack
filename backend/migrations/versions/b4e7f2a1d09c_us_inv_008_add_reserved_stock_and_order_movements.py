"""US-INV-008: Add reserved_stock to products and related_order_id to inventory_movements

Revision ID: b4e7f2a1d09c
Revises: a3f9c8b21e05
Create Date: 2026-02-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b4e7f2a1d09c'
down_revision = 'a3f9c8b21e05'
branch_labels = None
depends_on = None


def upgrade():
    # CA-1: Agregar campo reserved_stock a tabla products
    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.add_column(sa.Column('reserved_stock', sa.Integer(), nullable=False, server_default='0'))

    # CA-8: Agregar related_order_id a inventory_movements para vincular movimientos a pedidos
    with op.batch_alter_table('inventory_movements', schema=None) as batch_op:
        batch_op.add_column(sa.Column('related_order_id', sa.String(length=36), nullable=True))


def downgrade():
    with op.batch_alter_table('inventory_movements', schema=None) as batch_op:
        batch_op.drop_column('related_order_id')

    with op.batch_alter_table('products', schema=None) as batch_op:
        batch_op.drop_column('reserved_stock')
