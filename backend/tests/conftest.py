import pytest
from app import create_app, db


@pytest.fixture
def app():
    """Crea una aplicación de prueba"""
    app = create_app('testing')

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Crea un cliente de prueba"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Crea un CLI runner de prueba"""
    return app.test_cli_runner()
