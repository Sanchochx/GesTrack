import re
from email_validator import validate_email as email_lib_validate, EmailNotValidError


def validate_password_strength(password):
    """
    Valida la fortaleza de una contraseña según los criterios de CA-2:
    - Mínimo 8 caracteres
    - Al menos una mayúscula
    - Al menos una minúscula
    - Al menos un número

    Args:
        password: Contraseña a validar

    Returns:
        tuple: (is_valid: bool, errors: list)
    """
    errors = []

    if len(password) < 8:
        errors.append('La contraseña debe tener mínimo 8 caracteres')

    if not re.search(r'[A-Z]', password):
        errors.append('La contraseña debe contener al menos una mayúscula')

    if not re.search(r'[a-z]', password):
        errors.append('La contraseña debe contener al menos una minúscula')

    if not re.search(r'\d', password):
        errors.append('La contraseña debe contener al menos un número')

    is_valid = len(errors) == 0
    return is_valid, errors


def calculate_password_strength(password):
    """
    Calcula el nivel de fortaleza de una contraseña

    Args:
        password: Contraseña a evaluar

    Returns:
        str: 'debil', 'media', 'fuerte', 'muy_fuerte'
    """
    score = 0

    # Longitud
    if len(password) >= 8:
        score += 1
    if len(password) >= 12:
        score += 1
    if len(password) >= 16:
        score += 1

    # Caracteres
    if re.search(r'[a-z]', password):
        score += 1
    if re.search(r'[A-Z]', password):
        score += 1
    if re.search(r'\d', password):
        score += 1
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 1

    if score <= 2:
        return 'debil'
    elif score <= 4:
        return 'media'
    elif score <= 6:
        return 'fuerte'
    else:
        return 'muy_fuerte'


def validate_email_format(email, check_deliverability=True):
    """
    Valida el formato de un email usando email-validator

    Args:
        email: Email a validar
        check_deliverability: Si False, solo valida el formato sin verificar DNS

    Returns:
        tuple: (is_valid: bool, normalized_email: str or None, error: str or None)
    """
    try:
        validation = email_lib_validate(email, check_deliverability=check_deliverability)
        return True, validation.normalized, None
    except EmailNotValidError as e:
        return False, None, str(e)


def validate_role(role):
    """
    Valida que el rol sea uno de los permitidos

    Args:
        role: Rol a validar

    Returns:
        bool: True si el rol es válido
    """
    valid_roles = ['Admin', 'Gerente de Almacén', 'Personal de Ventas']
    return role in valid_roles
