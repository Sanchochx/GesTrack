"""
Servicio de Proveedores
US-SUPP-001: Registrar Proveedor
US-SUPP-002: Listar Proveedores
US-SUPP-004: Editar Proveedor
US-SUPP-014: Productos por Proveedor
"""
from app import db
from app.models.supplier import Supplier
from app.models.category import Category
from app.models.product import Product
from app.models.supplier_product import SupplierProduct
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem

SORTABLE_FIELDS = {
    'company_name': Supplier.company_name,
    'created_at': Supplier.created_at,
}


class SupplierService:
    """Lógica de negocio para gestión de proveedores"""

    @staticmethod
    def list_suppliers(page=1, per_page=20, sort_by='company_name', order='asc', search=None):
        """
        Lista proveedores paginados y ordenados

        US-SUPP-013 CA-1: Búsqueda por nombre de empresa o email (parcial, case-insensitive)

        Args:
            page: número de página (1-indexado)
            per_page: cantidad de proveedores por página
            sort_by: campo de ordenamiento ('company_name' o 'created_at')
            order: dirección de ordenamiento ('asc' o 'desc')
            search: texto de búsqueda sobre company_name o email (opcional)

        Returns:
            Pagination: objeto de paginación de SQLAlchemy con los proveedores
        """
        sort_column = SORTABLE_FIELDS.get(sort_by, Supplier.company_name)
        if order == 'desc':
            sort_column = sort_column.desc()

        query = Supplier.query
        if search:
            term = f'%{search.strip()}%'
            query = query.filter(
                db.or_(
                    Supplier.company_name.ilike(term),
                    Supplier.email.ilike(term),
                )
            )

        query = query.order_by(sort_column)
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

    @staticmethod
    def get_last_purchase_price(supplier_id, product_id):
        """
        US-SUPP-014 CA-4: Último precio de compra de un producto a un proveedor,
        calculado a partir del historial de órdenes de compra (más reciente primero).
        """
        last_item = (
            PurchaseOrderItem.query
            .join(PurchaseOrder, PurchaseOrderItem.purchase_order_id == PurchaseOrder.id)
            .filter(
                PurchaseOrder.supplier_id == supplier_id,
                PurchaseOrderItem.product_id == product_id,
            )
            .order_by(PurchaseOrder.created_at.desc())
            .first()
        )
        return float(last_item.unit_cost) if last_item else None

    @staticmethod
    def list_supplier_products(supplier_id):
        """
        US-SUPP-014 CA-1: Lista los productos que provee un proveedor, con precio
        preferencial, indicador de preferido y último precio de compra.

        Args:
            supplier_id: ID del proveedor

        Returns:
            list[dict]: vínculos producto-proveedor, o None si el proveedor no existe
        """
        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            return None

        links = SupplierProduct.query.filter_by(supplier_id=supplier_id).all()
        return [
            link.to_dict(last_purchase_price=SupplierService.get_last_purchase_price(supplier_id, link.product_id))
            for link in links
        ]

    @staticmethod
    def link_product(supplier_id, data):
        """
        US-SUPP-014 CA-2/CA-3/CA-5: Vincula un producto a un proveedor, con precio
        preferencial opcional e indicador de proveedor preferido.

        Args:
            supplier_id: ID del proveedor
            data: dict validado por SupplierProductLinkSchema

        Returns:
            SupplierProduct: vínculo creado

        Raises:
            ValueError: si el proveedor/producto no existen o el vínculo ya existe
        """
        supplier = Supplier.query.get(supplier_id)
        if not supplier:
            raise ValueError('El proveedor no existe')

        product = Product.query.get(data['product_id'])
        if not product:
            raise ValueError('El producto no existe')

        existing = SupplierProduct.query.filter_by(
            supplier_id=supplier_id, product_id=data['product_id']
        ).first()
        if existing:
            raise ValueError('Este producto ya está vinculado a este proveedor')

        is_preferred = data.get('is_preferred', False)
        if is_preferred:
            SupplierService._clear_preferred_supplier(data['product_id'])

        link = SupplierProduct(
            supplier_id=supplier_id,
            product_id=data['product_id'],
            preferential_price=data.get('preferential_price'),
            is_preferred=is_preferred,
        )
        db.session.add(link)
        db.session.commit()
        return link

    @staticmethod
    def update_supplier_product(supplier_id, product_id, data):
        """
        US-SUPP-014 CA-3/CA-5: Actualiza el precio preferencial y/o el indicador de
        proveedor preferido de un vínculo producto-proveedor existente.

        Args:
            supplier_id: ID del proveedor
            product_id: ID del producto
            data: dict validado por SupplierProductUpdateSchema

        Returns:
            SupplierProduct: vínculo actualizado, o None si no existe

        Raises:
            ValueError: si el vínculo no existe
        """
        link = SupplierProduct.query.filter_by(supplier_id=supplier_id, product_id=product_id).first()
        if not link:
            return None

        if 'preferential_price' in data:
            link.preferential_price = data['preferential_price']

        if data.get('is_preferred'):
            SupplierService._clear_preferred_supplier(product_id, exclude_supplier_id=supplier_id)
            link.is_preferred = True
        elif 'is_preferred' in data:
            link.is_preferred = False

        db.session.commit()
        return link

    @staticmethod
    def unlink_product(supplier_id, product_id):
        """
        US-SUPP-014: Elimina el vínculo entre un proveedor y un producto.

        Returns:
            bool: True si se eliminó, False si no existía
        """
        link = SupplierProduct.query.filter_by(supplier_id=supplier_id, product_id=product_id).first()
        if not link:
            return False

        db.session.delete(link)
        db.session.commit()
        return True

    @staticmethod
    def _clear_preferred_supplier(product_id, exclude_supplier_id=None):
        """US-SUPP-014 CA-5: Solo un proveedor puede ser el preferido por producto"""
        query = SupplierProduct.query.filter_by(product_id=product_id, is_preferred=True)
        if exclude_supplier_id:
            query = query.filter(SupplierProduct.supplier_id != exclude_supplier_id)
        query.update({'is_preferred': False})
