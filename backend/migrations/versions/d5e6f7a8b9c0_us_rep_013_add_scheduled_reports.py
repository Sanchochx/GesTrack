"""US-REP-013: Add scheduled_reports and scheduled_report_runs tables

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-07-30 22:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5e6f7a8b9c0'
down_revision = 'c4d5e6f7a8b9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'scheduled_reports',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('parameters', sa.JSON(), nullable=True),
        sa.Column('frequency', sa.String(length=20), nullable=False),
        sa.Column('recipients', sa.JSON(), nullable=False),
        sa.Column('file_format', sa.String(length=10), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_by_id', sa.String(length=36), nullable=False),
        sa.Column('next_run_at', sa.DateTime(), nullable=False),
        sa.Column('last_run_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'scheduled_report_runs',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('scheduled_report_id', sa.String(length=36), nullable=False),
        sa.Column('run_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('recipients_sent', sa.JSON(), nullable=True),
        sa.Column('file_size_bytes', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['scheduled_report_id'], ['scheduled_reports.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade():
    op.drop_table('scheduled_report_runs')
    op.drop_table('scheduled_reports')
