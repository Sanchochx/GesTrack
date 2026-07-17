"""
Rutas API para gestión de Proveedores
US-SUPP-001: Registrar Proveedor
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.schemas.supplier_schema import supplier_create_schema, supplier_response_schema
from app.services.supplier_service import SupplierService
from app.utils.decorators import require_role
from marshmallow import ValidationError
from sqlalchemy.exc import IntegrityError
from app import db

suppliers_bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')


@suppliers_bp.route('', methods=['POST'])
@jwt_required()
@require_role(['Admin', 'Gerente de Almacén'])
def create_supplier():
    """
    POST /api/suppliers
    Registra un nuevo proveedor

    Body:
        - company_name: Nombre de la empresa - requerido
        - contact_name: Nombre de contacto - requerido
        - email: Correo electrónico - requerido, único
        - phone: Teléfono - requerido
        - address: Dirección - opcional
        - website: Sitio web - opcional
        - category_ids: Lista de IDs de categorías que provee - opcional
        - payment_bank: Banco - opcional
        - payment_account: Cuenta - opcional
        - payment_terms: Condiciones de pago - opcional
    """
    try:
        data = supplier_create_schema.load(request.json)
        supplier = SupplierService.create_supplier(data)

        return jsonify({
            'success': True,
            'data': supplier_response_schema.dump(supplier),
            'message': f'Proveedor {supplier.company_name} registrado correctamente'
        }), 201

    except ValidationError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'VALIDATION_ERROR',
                'message': 'Error de validación',
                'details': e.messages
            }
        }), 400

    except ValueError as e:
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_EMAIL',
                'message': str(e),
                'field': 'email'
            }
        }), 400

    except IntegrityError:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'DUPLICATE_EMAIL',
                'message': 'Este correo ya está registrado',
                'field': 'email'
            }
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': str(e)
            }
        }), 500
