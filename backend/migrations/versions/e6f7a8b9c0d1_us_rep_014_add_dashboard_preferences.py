"""US-REP-014: Add dashboard_preferences table

Revision ID: e6f7a8b9c0d1
Revises: d5e6f7a8b9c0
Create Date: 2026-07-30 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e6f7a8b9c0d1'
down_revision = 'd5e6f7a8b9c0'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'dashboard_preferences',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('widgets', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_dashboard_preferences_user'),
    )
    with op.batch_alter_table('dashboard_preferences', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_dashboard_preferences_user_id'), ['user_id'], unique=True)


def downgrade():
    with op.batch_alter_table('dashboard_preferences', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_dashboard_preferences_user_id'))
    op.drop_table('dashboard_preferences')
