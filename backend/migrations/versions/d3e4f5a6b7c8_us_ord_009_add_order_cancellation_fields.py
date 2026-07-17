"""US-ORD-009: Add cancellation fields to orders table

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-07-17 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd3e4f5a6b7c8'
down_revision = 'c2d3e4f5a6b7'
branch_labels = None
depends_on = None


def upgrade():
    # CA-5: Campos de cancelación en orders
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('cancelled_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('cancellation_reason', sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column('refund_pending', sa.Boolean(), nullable=False, server_default=sa.false()))

    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.alter_column('refund_pending', server_default=None)


def downgrade():
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.drop_column('refund_pending')
        batch_op.drop_column('cancellation_reason')
        batch_op.drop_column('cancelled_at')
