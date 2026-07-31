"""US-SUPP-015: Add restock_suggestion_dismissals table

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-07-30 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4d5e6f7a8b9'
down_revision = 'b3c4d5e6f7a8'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'restock_suggestion_dismissals',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('product_id', sa.String(length=36), nullable=False),
        sa.Column('dismissed_by_id', sa.String(length=36), nullable=False),
        sa.Column('stock_quantity_at_dismissal', sa.Integer(), nullable=False),
        sa.Column('dismissed_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['dismissed_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_id', name='uq_restock_suggestion_dismissals_product'),
    )
    with op.batch_alter_table('restock_suggestion_dismissals', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_restock_suggestion_dismissals_product_id'), ['product_id'], unique=True)


def downgrade():
    with op.batch_alter_table('restock_suggestion_dismissals', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_restock_suggestion_dismissals_product_id'))
    op.drop_table('restock_suggestion_dismissals')
