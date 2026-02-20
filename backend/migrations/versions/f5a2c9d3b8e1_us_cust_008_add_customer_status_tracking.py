"""US-CUST-008: Add customer status tracking fields for inactivation/reactivation

Revision ID: f5a2c9d3b8e1
Revises: a3f9c8b21e05
Create Date: 2026-02-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f5a2c9d3b8e1'
down_revision = 'b4e7f2a1d09c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('customers', schema=None) as batch_op:
        batch_op.add_column(sa.Column('inactivated_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('inactivated_by', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('inactivation_reason', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('reactivated_at', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('reactivated_by', sa.String(length=36), nullable=True))
        batch_op.add_column(sa.Column('reactivation_reason', sa.Text(), nullable=True))
        batch_op.create_index(batch_op.f('ix_customers_is_active'), ['is_active'], unique=False)


def downgrade():
    with op.batch_alter_table('customers', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_customers_is_active'))
        batch_op.drop_column('reactivation_reason')
        batch_op.drop_column('reactivated_by')
        batch_op.drop_column('reactivated_at')
        batch_op.drop_column('inactivation_reason')
        batch_op.drop_column('inactivated_by')
        batch_op.drop_column('inactivated_at')
