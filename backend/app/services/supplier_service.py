"""
Servicio de Proveedores
US-SUPP-001: Registrar Proveedor
"""
from app import db
from app.models.supplier import Supplier
from app.models.category import Category


class SupplierService:
    """Lógica de negocio para gestión de proveedores"""

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
