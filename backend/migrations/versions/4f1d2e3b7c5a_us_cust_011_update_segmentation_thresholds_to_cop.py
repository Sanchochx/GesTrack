"""US-CUST-011 Update segmentation thresholds to COP values

Revision ID: 4f1d2e3b7c5a
Revises: 3e2b1a4c9d8f
Create Date: 2026-02-23 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4f1d2e3b7c5a'
down_revision = '3e2b1a4c9d8f'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        "UPDATE customer_segmentation_config "
        "SET vip_threshold = 500000.00, frequent_threshold = 200000.00 "
        "WHERE id = 1"
    )


def downgrade():
    op.execute(
        "UPDATE customer_segmentation_config "
        "SET vip_threshold = 10000.00, frequent_threshold = 5000.00 "
        "WHERE id = 1"
    )
