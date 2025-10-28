from marshmallow import Schema, fields, validates, ValidationError, post_load
from app.utils.validators import validate_password_strength, validate_email_format, validate_role
from app.models.user import User
from app import db
from flask import current_app


class UserRegistrationSchema(Schema):
    """
    Schema de validación para registro de usuarios
    Implementa los criterios de aceptación CA-1, CA-2, CA-3
    """
    full_name = fields.Str(required=True, error_messages={
        'required': 'El nombre completo es obligatorio'
    })
    email = fields.Email(required=True, error_messages={
        'required': 'El email es obligatorio',
        'invalid': 'El formato del email no es válido'
    })
    password = fields.Str(required=True, load_only=True, error_messages={
        'required': 'La contraseña es obligatoria'
    })
    role = fields.Str(required=True, error_messages={
        'required': 'El rol es obligatorio'
    })

    @validates('full_name')
    def validate_full_name(self, value):
        """Valida que el nombre completo no esté vacío y tenga longitud válida"""
        if not value or value.strip() == '':
            raise ValidationError('El nombre completo no puede estar vacío')
        if len(value) > 100:
            raise ValidationError('El nombre completo no puede exceder 100 caracteres')

    @validates('email')
    def validate_email_uniqueness(self, value):
        """Valida que el email sea único en el sistema (CA-3)"""
        # Validar formato (sin verificar deliverability en testing)
        check_deliverability = not current_app.config.get('TESTING', False)
        is_valid, normalized_email, error = validate_email_format(value, check_deliverability)
        if not is_valid:
            raise ValidationError(f'Formato de email inválido: {error}')

        # Validar unicidad
        existing_user = User.query.filter_by(email=normalized_email).first()
        if existing_user:
            raise ValidationError('Este email ya está registrado')

    @validates('password')
    def validate_password(self, value):
        """Valida la fortaleza de la contraseña (CA-2)"""
        is_valid, errors = validate_password_strength(value)
        if not is_valid:
            raise ValidationError(errors)

    @validates('role')
    def validate_user_role(self, value):
        """Valida que el rol sea uno de los permitidos"""
        if not validate_role(value):
            raise ValidationError(
                'Rol inválido. Debe ser: Admin, Gerente de Almacén, o Personal de Ventas'
            )


class UserSchema(Schema):
    """
    Schema para representación de usuarios (sin contraseña)
    """
    id = fields.Str(dump_only=True)
    full_name = fields.Str()
    email = fields.Email()
    role = fields.Str()
    is_active = fields.Boolean()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class UserProfileUpdateSchema(Schema):
    """
    Schema de validación para actualización de perfil de usuario
    US-AUTH-004 - CA-3, CA-4: Name and email editing with validation
    """
    full_name = fields.Str(required=False, allow_none=True)
    email = fields.Email(required=False, allow_none=True, error_messages={
        'invalid': 'El formato del email no es válido'
    })

    @validates('full_name')
    def validate_full_name(self, value):
        """Valida que el nombre completo tenga longitud válida (CA-3)"""
        if value is not None:
            if not value or value.strip() == '':
                raise ValidationError('El nombre completo no puede estar vacío')
            if len(value) < 3:
                raise ValidationError('El nombre completo debe tener al menos 3 caracteres')
            if len(value) > 100:
                raise ValidationError('El nombre completo no puede exceder 100 caracteres')


class UserPasswordChangeSchema(Schema):
    """
    Schema de validación para cambio de contraseña
    US-AUTH-004 - CA-5: Password change with validations
    """
    current_password = fields.Str(required=True, load_only=True, error_messages={
        'required': 'La contraseña actual es obligatoria'
    })
    new_password = fields.Str(required=True, load_only=True, error_messages={
        'required': 'La nueva contraseña es obligatoria'
    })
    confirm_password = fields.Str(required=True, load_only=True, error_messages={
        'required': 'La confirmación de contraseña es obligatoria'
    })

    @validates('new_password')
    def validate_new_password(self, value):
        """Valida la fortaleza de la nueva contraseña (CA-5)"""
        is_valid, errors = validate_password_strength(value)
        if not is_valid:
            raise ValidationError(errors)


# Instancias de schemas para uso en rutas
user_registration_schema = UserRegistrationSchema()
user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_profile_update_schema = UserProfileUpdateSchema()
user_password_change_schema = UserPasswordChangeSchema()
