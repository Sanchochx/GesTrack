import os
from app import create_app, db, socketio

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    # US-INV-001 CA-3: Usar socketio.run para soporte de WebSockets
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
