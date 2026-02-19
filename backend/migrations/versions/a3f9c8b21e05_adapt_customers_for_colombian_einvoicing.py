"""Adapt customers table for Colombian electronic invoicing (DIAN)

Revision ID: a3f9c8b21e05
Revises: eb12df1838d0
Create Date: 2026-02-19 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3f9c8b21e05'
down_revision = 'eb12df1838d0'
branch_labels = None
depends_on = None


def upgrade():
    # Use batch_alter_table for SQLite compatibility
    with op.batch_alter_table('customers', schema=None) as batch_op:
        # Drop old indexes first
        batch_op.drop_index('ix_customers_email')

        # Drop old columns
        batch_op.drop_column('full_name')
        batch_op.drop_column('email')
        batch_op.drop_column('phone')
        batch_op.drop_column('secondary_phone')
        batch_op.drop_column('address_street')
        batch_op.drop_column('address_city')
        batch_op.drop_column('address_postal_code')
        batch_op.drop_column('address_country')

        # Add new columns
        batch_op.add_column(sa.Column('tipo_documento', sa.String(length=10), nullable=False, server_default='CC'))
        batch_op.add_column(sa.Column('numero_documento', sa.String(length=20), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('nombre_razon_social', sa.String(length=200), nullable=False, server_default=''))
        batch_op.add_column(sa.Column('tipo_contribuyente', sa.String(length=30), nullable=False, server_default='Persona Natural'))
        batch_op.add_column(sa.Column('regimen_fiscal', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('responsabilidad_tributaria', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('pais', sa.String(length=100), nullable=False, server_default='Colombia'))
        batch_op.add_column(sa.Column('departamento', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('municipio_ciudad', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('direccion', sa.String(length=300), nullable=True))
        batch_op.add_column(sa.Column('telefono_movil', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('correo', sa.String(length=100), nullable=False, server_default=''))

        # Create new indexes
        batch_op.create_index(batch_op.f('ix_customers_numero_documento'), ['numero_documento'], unique=True)
        batch_op.create_index(batch_op.f('ix_customers_correo'), ['correo'], unique=True)


def downgrade():
    with op.batch_alter_table('customers', schema=None) as batch_op:
        # Drop new indexes
        batch_op.drop_index(batch_op.f('ix_customers_correo'))
        batch_op.drop_index(batch_op.f('ix_customers_numero_documento'))

        # Drop new columns
        batch_op.drop_column('correo')
        batch_op.drop_column('telefono_movil')
        batch_op.drop_column('direccion')
        batch_op.drop_column('municipio_ciudad')
        batch_op.drop_column('departamento')
        batch_op.drop_column('pais')
        batch_op.drop_column('responsabilidad_tributaria')
        batch_op.drop_column('regimen_fiscal')
        batch_op.drop_column('tipo_contribuyente')
        batch_op.drop_column('nombre_razon_social')
        batch_op.drop_column('numero_documento')
        batch_op.drop_column('tipo_documento')

        # Restore old columns
        batch_op.add_column(sa.Column('address_country', sa.String(length=100), nullable=False, server_default='México'))
        batch_op.add_column(sa.Column('address_postal_code', sa.String(length=20), nullable=False, server_default=''))
        batch_op.add_column(sa.Column('address_city', sa.String(length=100), nullable=False, server_default=''))
        batch_op.add_column(sa.Column('address_street', sa.String(length=300), nullable=False, server_default=''))
        batch_op.add_column(sa.Column('secondary_phone', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('phone', sa.String(length=20), nullable=False, server_default=''))
        batch_op.add_column(sa.Column('email', sa.String(length=100), nullable=False, server_default=''))
        batch_op.add_column(sa.Column('full_name', sa.String(length=200), nullable=False, server_default=''))

        batch_op.create_index(batch_op.f('ix_customers_email'), ['email'], unique=True)
