"""US-SUPP-014: Add supplier_products table

Revision ID: b3c4d5e6f7a8
Revises: a2b3c4d5e6f7
Create Date: 2026-07-30 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b3c4d5e6f7a8'
down_revision = 'a2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'supplier_products',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('supplier_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('preferential_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('is_preferred', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('supplier_id', 'product_id', name='uq_supplier_products_supplier_product'),
    )
    with op.batch_alter_table('supplier_products', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_supplier_products_supplier_id'), ['supplier_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_supplier_products_product_id'), ['product_id'], unique=False)


def downgrade():
    with op.batch_alter_table('supplier_products', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_supplier_products_product_id'))
        batch_op.drop_index(batch_op.f('ix_supplier_products_supplier_id'))
    op.drop_table('supplier_products')
