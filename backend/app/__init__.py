import os
from flask import Flask, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO
from app.config import config

# Inicialización de extensiones
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()  # US-INV-001 CA-3: WebSocket para actualizaciones en tiempo real


def create_app(config_name=None):
    """
    Factory function para crear la aplicación Flask

    Args:
        config_name: Nombre de la configuración a usar ('development', 'production', 'testing')

    Returns:
        Flask app configurada
    """
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Inicializar extensiones con la app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGIN'])

    # US-INV-001 CA-3: Configurar SocketIO para actualizaciones en tiempo real
    socketio.init_app(
        app,
        cors_allowed_origins=app.config['CORS_ORIGIN'],
        async_mode='threading',
        logger=True,
        engineio_logger=False
    )

    # Registrar blueprints
    from app.routes.auth import auth_bp
    from app.routes.categories import categories_bp
    from app.routes.products import products_bp
    from app.routes.stock import stock_bp  # US-INV-001 CA-3

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(categories_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(stock_bp)  # US-INV-001 CA-3

    # Manejador de errores global
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': {
                'code': 'NOT_FOUND',
                'message': 'El recurso solicitado no existe'
            }
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'Error interno del servidor'
            }
        }), 500

    # Health check endpoint
    @app.route('/health')
    def health():
        return jsonify({'status': 'healthy'}), 200

    # Endpoint para servir archivos estáticos (imágenes de productos)
    @app.route('/uploads/<path:filename>')
    def uploaded_file(filename):
        """
        Servir archivos subidos (imágenes de productos, etc.)
        Ejemplo: /uploads/products/10_2f39200a.png
        """
        upload_folder = app.config['UPLOAD_FOLDER']
        return send_from_directory(upload_folder, filename)

    return app
