import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import os
from datetime import datetime


class EmailService:
    """
    Servicio de Email
    US-AUTH-006: Envío de emails para recuperación de contraseña

    Este servicio maneja el envío de correos electrónicos usando SMTP.
    Para desarrollo, se recomienda usar MailHog, Mailtrap o similar.
    """

    # Configuración SMTP desde variables de entorno
    SMTP_HOST = os.getenv('SMTP_HOST', 'localhost')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '1025'))  # 1025 para MailHog
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'false').lower() == 'true'

    # Remitente por defecto
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@gestrack.com')
    FROM_NAME = os.getenv('FROM_NAME', 'GesTrack')

    # URL base del frontend
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    @classmethod
    def send_email(cls, to_email, subject, html_content, text_content=None):
        """
        Envía un email

        Args:
            to_email: Dirección de correo del destinatario
            subject: Asunto del email
            html_content: Contenido HTML del email
            text_content: Contenido en texto plano (opcional, fallback)

        Returns:
            bool: True si se envió exitosamente, False en caso contrario

        Raises:
            Exception: Si hay un error al enviar el email
        """
        try:
            # Crear mensaje
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = formataddr((cls.FROM_NAME, cls.FROM_EMAIL))
            msg['To'] = to_email
            msg['Date'] = formataddr((None, datetime.utcnow().isoformat()))

            # Agregar contenido en texto plano (fallback)
            if text_content:
                part1 = MIMEText(text_content, 'plain', 'utf-8')
                msg.attach(part1)

            # Agregar contenido HTML
            part2 = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(part2)

            # Conectar al servidor SMTP
            if cls.SMTP_USE_TLS:
                server = smtplib.SMTP(cls.SMTP_HOST, cls.SMTP_PORT)
                server.starttls()
            else:
                server = smtplib.SMTP(cls.SMTP_HOST, cls.SMTP_PORT)

            # Login si se proporcionaron credenciales
            if cls.SMTP_USERNAME and cls.SMTP_PASSWORD:
                server.login(cls.SMTP_USERNAME, cls.SMTP_PASSWORD)

            # Enviar email
            server.send_message(msg)
            server.quit()

            print(f"Email enviado exitosamente a {to_email}")
            return True

        except Exception as e:
            print(f"Error al enviar email a {to_email}: {str(e)}")
            # En desarrollo, no fallar silenciosamente
            raise Exception(f"Error al enviar email: {str(e)}")

    @classmethod
    def send_password_reset_email(cls, user_email, user_name, reset_token):
        """
        Envía el email de recuperación de contraseña
        US-AUTH-006 CA-4: Email de recuperación

        Args:
            user_email: Email del usuario
            user_name: Nombre del usuario
            reset_token: Token de recuperación

        Returns:
            bool: True si se envió exitosamente

        Raises:
            Exception: Si hay un error al enviar
        """
        # Construir URL de reset
        reset_url = f"{cls.FRONTEND_URL}/reset-password?token={reset_token}"

        # Asunto
        subject = "Recuperación de contraseña - GesTrack"

        # Contenido HTML
        html_content = cls._get_password_reset_html(user_name, reset_url)

        # Contenido en texto plano (fallback)
        text_content = f"""
Hola {user_name},

Recibimos una solicitud para restablecer la contraseña de tu cuenta en GesTrack.

Para restablecer tu contraseña, haz clic en el siguiente enlace:
{reset_url}

Este enlace es válido por 1 hora.

Si no solicitaste restablecer tu contraseña, puedes ignorar este correo electrónico de forma segura. Tu contraseña no será cambiada.

Por tu seguridad, nunca compartas este enlace con nadie.

Saludos,
El equipo de GesTrack
        """

        # Enviar email
        return cls.send_email(user_email, subject, html_content, text_content)

    @classmethod
    def send_password_changed_notification(cls, user_email, user_name):
        """
        Envía notificación cuando la contraseña ha sido cambiada
        US-AUTH-006 CA-9: Notificación de cambio

        Args:
            user_email: Email del usuario
            user_name: Nombre del usuario

        Returns:
            bool: True si se envió exitosamente

        Raises:
            Exception: Si hay un error al enviar
        """
        # Obtener fecha y hora actual
        change_datetime = datetime.utcnow().strftime('%d/%m/%Y a las %H:%M UTC')

        # Asunto
        subject = "Tu contraseña ha sido actualizada - GesTrack"

        # Contenido HTML
        html_content = cls._get_password_changed_html(user_name, change_datetime)

        # Contenido en texto plano (fallback)
        text_content = f"""
Hola {user_name},

Tu contraseña de GesTrack ha sido actualizada exitosamente el {change_datetime}.

Si realizaste este cambio, no necesitas hacer nada más.

Si NO fuiste tú quien cambió la contraseña, contacta inmediatamente con el administrador del sistema para proteger tu cuenta.

Saludos,
El equipo de GesTrack
        """

        # Enviar email
        return cls.send_email(user_email, subject, html_content, text_content)

    @staticmethod
    def _get_password_reset_html(user_name, reset_url):
        """
        Template HTML para email de recuperación de contraseña

        Args:
            user_name: Nombre del usuario
            reset_url: URL de recuperación

        Returns:
            str: HTML del email
        """
        return f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 20px;
            color: #333333;
        }}
        .message {{
            margin-bottom: 30px;
            color: #666666;
            font-size: 16px;
        }}
        .button-container {{
            text-align: center;
            margin: 35px 0;
        }}
        .button {{
            display: inline-block;
            padding: 14px 35px;
            background-color: #667eea;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.3s;
        }}
        .button:hover {{
            background-color: #5568d3;
        }}
        .expiry-notice {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            margin: 25px 0;
            font-size: 14px;
            color: #856404;
        }}
        .security-notice {{
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 12px 15px;
            margin: 25px 0;
            font-size: 14px;
            color: #721c24;
        }}
        .footer {{
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 13px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }}
        .footer-text {{
            margin: 5px 0;
        }}
        .link-fallback {{
            margin-top: 25px;
            font-size: 13px;
            color: #6c757d;
            word-break: break-all;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hola {user_name},
            </div>

            <div class="message">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>GesTrack</strong>.
            </div>

            <div class="message">
                Para continuar con el proceso y crear una nueva contraseña, haz clic en el botón de abajo:
            </div>

            <div class="button-container">
                <a href="{reset_url}" class="button">Restablecer Contraseña</a>
            </div>

            <div class="expiry-notice">
                <strong>⏰ Nota importante:</strong> Este enlace es válido por <strong>1 hora</strong>. Después de este tiempo, deberás solicitar un nuevo enlace de recuperación.
            </div>

            <div class="security-notice">
                <strong>🛡️ Seguridad:</strong> Si no solicitaste restablecer tu contraseña, puedes ignorar este correo electrónico de forma segura. Tu contraseña no será cambiada.
            </div>

            <div class="message" style="margin-top: 30px;">
                <strong>Consejos de seguridad:</strong>
                <ul style="margin-left: 20px; color: #666666;">
                    <li>Nunca compartas este enlace con nadie</li>
                    <li>Usa una contraseña fuerte y única</li>
                    <li>No uses la misma contraseña en múltiples sitios</li>
                </ul>
            </div>

            <div class="link-fallback">
                <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p><a href="{reset_url}" style="color: #667eea;">{reset_url}</a></p>
            </div>
        </div>

        <div class="footer">
            <div class="footer-text">
                Este correo fue enviado por <strong>GesTrack</strong>
            </div>
            <div class="footer-text">
                Sistema de Gestión de Inventario y Pedidos
            </div>
        </div>
    </div>
</body>
</html>
        """

    @staticmethod
    def _get_password_changed_html(user_name, change_datetime):
        """
        Template HTML para notificación de cambio de contraseña

        Args:
            user_name: Nombre del usuario
            change_datetime: Fecha y hora del cambio

        Returns:
            str: HTML del email
        """
        return f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contraseña Actualizada</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            margin-bottom: 20px;
            color: #333333;
        }}
        .message {{
            margin-bottom: 20px;
            color: #666666;
            font-size: 16px;
        }}
        .success-notice {{
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
        }}
        .success-notice strong {{
            color: #155724;
            display: block;
            margin-bottom: 8px;
        }}
        .success-notice p {{
            color: #155724;
            margin: 5px 0;
        }}
        .warning-notice {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
        }}
        .warning-notice strong {{
            color: #856404;
            display: block;
            margin-bottom: 8px;
        }}
        .warning-notice p {{
            color: #856404;
            margin: 5px 0;
        }}
        .footer {{
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 13px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
        }}
        .footer-text {{
            margin: 5px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Contraseña Actualizada</h1>
        </div>

        <div class="content">
            <div class="greeting">
                Hola {user_name},
            </div>

            <div class="success-notice">
                <strong>✅ Cambio Exitoso</strong>
                <p>Tu contraseña de GesTrack ha sido actualizada exitosamente.</p>
                <p><strong>Fecha y hora:</strong> {change_datetime}</p>
            </div>

            <div class="message">
                Si realizaste este cambio, no necesitas hacer nada más. Tu cuenta está segura y puedes continuar usando GesTrack normalmente.
            </div>

            <div class="warning-notice">
                <strong>⚠️ ¿No fuiste tú?</strong>
                <p>Si <strong>NO</strong> realizaste este cambio, contacta inmediatamente con el administrador del sistema para proteger tu cuenta.</p>
            </div>

            <div class="message" style="margin-top: 30px;">
                <strong>Recomendaciones de seguridad:</strong>
                <ul style="margin-left: 20px; color: #666666;">
                    <li>Nunca compartas tu contraseña con nadie</li>
                    <li>Usa contraseñas únicas para cada servicio</li>
                    <li>Cambia tu contraseña regularmente</li>
                    <li>Activa la autenticación de dos factores si está disponible</li>
                </ul>
            </div>
        </div>

        <div class="footer">
            <div class="footer-text">
                Este correo fue enviado por <strong>GesTrack</strong>
            </div>
            <div class="footer-text">
                Sistema de Gestión de Inventario y Pedidos
            </div>
        </div>
    </div>
</body>
</html>
        """
