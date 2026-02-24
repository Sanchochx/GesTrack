"""US-ORD-003: add previous_status to order_status_history

Revision ID: a1b2c3d4e5f6
Revises: 4f1d2e3b7c5a
Create Date: 2026-02-23 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '4f1d2e3b7c5a'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('order_status_history', schema=None) as batch_op:
        batch_op.add_column(sa.Column('previous_status', sa.String(length=50), nullable=True))


def downgrade():
    with op.batch_alter_table('order_status_history', schema=None) as batch_op:
        batch_op.drop_column('previous_status')
