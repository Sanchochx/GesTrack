"""
Servicio de Proveedores
US-SUPP-001: Registrar Proveedor
US-SUPP-002: Listar Proveedores
US-SUPP-004: Editar Proveedor
"""
from app import db
from app.models.supplier import Supplier
from app.models.category import Category

SORTABLE_FIELDS = {
    'company_name': Supplier.company_name,
    'created_at': Supplier.created_at,
}


class SupplierService:
    """Lógica de negocio para gestión de proveedores"""

    @staticmethod
    def list_suppliers(page=1, per_page=20, sort_by='company_name', order='asc'):
        """
        Lista proveedores paginados y ordenados

        Args:
            page: número de página (1-indexado)
            per_page: cantidad de proveedores por página
            sort_by: campo de ordenamiento ('company_name' o 'created_at')
            order: dirección de ordenamiento ('asc' o 'desc')

        Returns:
            Pagination: objeto de paginación de SQLAlchemy con los proveedores
        """
        sort_column = SORTABLE_FIELDS.get(sort_by, Supplier.company_name)
        if order == 'desc':
            sort_column = sort_column.desc()

        query = Supplier.query.order_by(sort_column)
        return query.paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def get_supplier_by_id(supplier_id):
        """
        Obtiene un proveedor por su ID con métricas de órdenes de compra

        Args:
            supplier_id: ID del proveedor

        Returns:
            Supplier: proveedor encontrado o None si no existe
        """
        return Supplier.query.get(supplier_id)

    @staticmethod
    def create_supplier(data):
        """
        Registra un nuevo proveedor

        Args:
            data: dict validado por SupplierCreateSchema

        Returns:
            Supplier: proveedor creado

        Raises:
            ValueError: si el email ya está registrado
        """
        if not Supplier.validate_email_unique(data['email']):
            raise ValueError('Este correo ya está registrado por otro proveedor')

        categories = []
        category_ids = data.get('category_ids') or []
        if category_ids:
            categories = Category.query.filter(Category.id.in_(category_ids)).all()

        supplier = Supplier(
            company_name=data['company_name'].strip(),
            contact_name=data['contact_name'].strip(),
            email=data['email'].strip().lower(),
            phone=data['phone'].strip(),
            address=data.get('address', '').strip() if data.get('address') else None,
            website=data.get('website', '').strip() if data.get('website') else None,
            payment_bank=data.get('payment_bank', '').strip() if data.get('payment_bank') else None,
            payment_account=data.get('payment_account', '').strip() if data.get('payment_account') else None,
            payment_terms=data.get('payment_terms', '').strip() if data.get('payment_terms') else None,
            categories=categories,
        )

        db.session.add(supplier)
        db.session.commit()
        return supplier

    @staticmethod
    def update_supplier(supplier_id, data):
        """
        Actualiza un proveedor existente

        Args:
            supplier_id: ID del proveedor a actualizar
            data: dict validado por SupplierUpdateSchema (solo campos enviados)

        Returns:
            Supplier: proveedor actualizado, o None si no existe

        Raises:
            ValueError: si el nuevo email ya está registrado por otro proveedor
        """
        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            return None

        if 'email' in data:
            new_email = data['email'].strip().lower()
            if not Supplier.validate_email_unique(new_email, exclude_id=supplier_id):
                raise ValueError('Este correo ya está registrado por otro proveedor')
            supplier.email = new_email

        if 'company_name' in data:
            supplier.company_name = data['company_name'].strip()
        if 'contact_name' in data:
            supplier.contact_name = data['contact_name'].strip()
        if 'phone' in data:
            supplier.phone = data['phone'].strip()
        if 'address' in data:
            supplier.address = data['address'].strip() if data['address'] else None
        if 'website' in data:
            supplier.website = data['website'].strip() if data['website'] else None
        if 'payment_bank' in data:
            supplier.payment_bank = data['payment_bank'].strip() if data['payment_bank'] else None
        if 'payment_account' in data:
            supplier.payment_account = data['payment_account'].strip() if data['payment_account'] else None
        if 'payment_terms' in data:
            supplier.payment_terms = data['payment_terms'].strip() if data['payment_terms'] else None
        if 'category_ids' in data:
            category_ids = data['category_ids'] or []
            supplier.categories = Category.query.filter(Category.id.in_(category_ids)).all() if category_ids else []

        db.session.commit()
        return supplier
