"""add inventory movements indexes

Revision ID: 53c4be16db29
Revises: 3488fe0cb2be
Create Date: 2025-11-09 11:46:35.939616

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '53c4be16db29'
down_revision = '3488fe0cb2be'
branch_labels = None
depends_on = None


def upgrade():
    # US-INV-003: Add indexes for efficient querying of inventory movements

    # Index for date-based queries (most common filter)
    op.create_index(
        'idx_inventory_movements_created',
        'inventory_movements',
        ['created_at'],
        postgresql_ops={'created_at': 'DESC'}
    )

    # Index for product-specific queries
    op.create_index(
        'idx_inventory_movements_product',
        'inventory_movements',
        ['product_id']
    )

    # Index for filtering by movement type
    op.create_index(
        'idx_inventory_movements_type',
        'inventory_movements',
        ['movement_type']
    )

    # Composite index for common query pattern (product + date)
    op.create_index(
        'idx_inventory_movements_product_date',
        'inventory_movements',
        ['product_id', 'created_at']
    )


def downgrade():
    # Remove indexes in reverse order
    op.drop_index('idx_inventory_movements_product_date', table_name='inventory_movements')
    op.drop_index('idx_inventory_movements_type', table_name='inventory_movements')
    op.drop_index('idx_inventory_movements_product', table_name='inventory_movements')
    op.drop_index('idx_inventory_movements_created', table_name='inventory_movements')
