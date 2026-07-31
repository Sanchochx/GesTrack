"""US-SUPP-011: Add cancellation fields to purchase_orders table

Revision ID: a2b3c4d5e6f7
Revises: 9b29156e5ee0
Create Date: 2026-07-30 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a2b3c4d5e6f7'
down_revision = '9b29156e5ee0'
branch_labels = None
depends_on = None


def upgrade():
    # Campos de cancelación en purchase_orders
    with op.batch_alter_table('purchase_orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cancelled_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('cancelled_by_id', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('cancellation_reason', sa.String(length=500), nullable=True))
        batch_op.create_foreign_key(
            'fk_purchase_orders_cancelled_by_id_users',
            'users', ['cancelled_by_id'], ['id']
        )


def downgrade():
    with op.batch_alter_table('purchase_orders', schema=None) as batch_op:
        batch_op.drop_constraint('fk_purchase_orders_cancelled_by_id_users', type_='foreignkey')
        batch_op.drop_column('cancellation_reason')
        batch_op.drop_column('cancelled_by_id')
        batch_op.drop_column('cancelled_at')
