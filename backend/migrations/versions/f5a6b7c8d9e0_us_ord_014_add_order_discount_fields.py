"""US-ORD-014: Add discount type/value/reason/authorization fields to orders

Revision ID: f5a6b7c8d9e0
Revises: e4f5a6b7c8d9
Create Date: 2026-07-17 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f5a6b7c8d9e0'
down_revision = 'e4f5a6b7c8d9'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.add_column(sa.Column('discount_type', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=True))
        batch_op.add_column(sa.Column('discount_reason', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('discount_authorized_by_id', sa.String(length=36), nullable=True))
        batch_op.create_foreign_key(
            'fk_orders_discount_authorized_by_id_users',
            'users', ['discount_authorized_by_id'], ['id']
        )


def downgrade():
    with op.batch_alter_table('orders', schema=None) as batch_op:
        batch_op.drop_constraint('fk_orders_discount_authorized_by_id_users', type_='foreignkey')
        batch_op.drop_column('discount_authorized_by_id')
        batch_op.drop_column('discount_reason')
        batch_op.drop_column('discount_value')
        batch_op.drop_column('discount_type')
