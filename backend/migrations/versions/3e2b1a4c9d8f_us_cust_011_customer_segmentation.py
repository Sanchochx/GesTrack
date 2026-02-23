"""US-CUST-011 Add customer segmentation fields and tables

Revision ID: 3e2b1a4c9d8f
Revises: 94472240294a
Create Date: 2026-02-23 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3e2b1a4c9d8f'
down_revision = '94472240294a'
branch_labels = None
depends_on = None


def upgrade():
    # Add customer_category column to customers table
    with op.batch_alter_table('customers', schema=None) as batch_op:
        batch_op.add_column(sa.Column(
            'customer_category',
            sa.String(length=20),
            nullable=False,
            server_default='Regular'
        ))
        batch_op.create_index(
            batch_op.f('ix_customers_customer_category'),
            ['customer_category'],
            unique=False
        )

    # Create customer_segmentation_config table (single-row config)
    op.create_table(
        'customer_segmentation_config',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('vip_threshold', sa.Numeric(precision=10, scale=2), nullable=False, server_default='500000.00'),
        sa.Column('frequent_threshold', sa.Numeric(precision=10, scale=2), nullable=False, server_default='200000.00'),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('updated_by', sa.String(length=36), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create customer_category_history table (CA-8)
    op.create_table(
        'customer_category_history',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('customer_id', sa.String(length=36), nullable=False),
        sa.Column('old_category', sa.String(length=20), nullable=True),
        sa.Column('new_category', sa.String(length=20), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=True),
        sa.Column('total_spent', sa.Numeric(precision=12, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('customer_category_history', schema=None) as batch_op:
        batch_op.create_index(
            'ix_cust_cat_hist_customer_id',
            ['customer_id'],
            unique=False
        )
        batch_op.create_index(
            'ix_cust_cat_hist_created_at',
            ['created_at'],
            unique=False
        )


def downgrade():
    with op.batch_alter_table('customer_category_history', schema=None) as batch_op:
        batch_op.drop_index('ix_cust_cat_hist_created_at')
        batch_op.drop_index('ix_cust_cat_hist_customer_id')
    op.drop_table('customer_category_history')

    op.drop_table('customer_segmentation_config')

    with op.batch_alter_table('customers', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_customers_customer_category'))
        batch_op.drop_column('customer_category')
