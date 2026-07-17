"""US-SUPP-001: Add suppliers table and supplier_categories association table

Revision ID: a7b8c9d0e1f2
Revises: f5a6b7c8d9e0
Create Date: 2026-07-17 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a7b8c9d0e1f2'
down_revision = 'f5a6b7c8d9e0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'suppliers',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('company_name', sa.String(length=200), nullable=False),
        sa.Column('contact_name', sa.String(length=200), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=False),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('website', sa.String(length=300), nullable=True),
        sa.Column('payment_bank', sa.String(length=100), nullable=True),
        sa.Column('payment_account', sa.String(length=50), nullable=True),
        sa.Column('payment_terms', sa.String(length=200), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    with op.batch_alter_table('suppliers', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_suppliers_company_name'), ['company_name'], unique=False)
        batch_op.create_index(batch_op.f('ix_suppliers_email'), ['email'], unique=True)
        batch_op.create_index(batch_op.f('ix_suppliers_is_active'), ['is_active'], unique=False)

    op.create_table(
        'supplier_categories',
        sa.Column('supplier_id', sa.String(length=36), nullable=False),
        sa.Column('category_id', sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id']),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.PrimaryKeyConstraint('supplier_id', 'category_id'),
    )


def downgrade():
    op.drop_table('supplier_categories')
    with op.batch_alter_table('suppliers', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_suppliers_is_active'))
        batch_op.drop_index(batch_op.f('ix_suppliers_email'))
        batch_op.drop_index(batch_op.f('ix_suppliers_company_name'))
    op.drop_table('suppliers')
