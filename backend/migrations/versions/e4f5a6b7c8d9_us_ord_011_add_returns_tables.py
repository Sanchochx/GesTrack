"""US-ORD-011: Add returns and return_items tables

Revision ID: e4f5a6b7c8d9
Revises: d3e4f5a6b7c8
Create Date: 2026-07-17 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e4f5a6b7c8d9'
down_revision = 'd3e4f5a6b7c8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'returns',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('return_number', sa.String(length=20), nullable=False),
        sa.Column('order_id', sa.String(length=36), nullable=False),
        sa.Column('created_by_id', sa.String(length=36), nullable=False),
        sa.Column('approved_by_id', sa.String(length=36), nullable=True),
        sa.Column('reason', sa.String(length=100), nullable=False),
        sa.Column('reason_detail', sa.String(length=300), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('refund_method', sa.String(length=20), nullable=True),
        sa.Column('refund_reference', sa.String(length=200), nullable=True),
        sa.Column('return_date', sa.DateTime(), nullable=False),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id']),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id']),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('return_number'),
    )
    with op.batch_alter_table('returns', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_returns_order_id'), ['order_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_returns_return_number'), ['return_number'], unique=True)

    op.create_table(
        'return_items',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('return_id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('item_reason', sa.String(length=300), nullable=True),
        sa.Column('product_name', sa.String(length=200), nullable=False),
        sa.Column('product_sku', sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(['return_id'], ['returns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('return_items')
    with op.batch_alter_table('returns', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_returns_return_number'))
        batch_op.drop_index(batch_op.f('ix_returns_order_id'))
    op.drop_table('returns')
