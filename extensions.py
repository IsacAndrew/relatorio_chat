"""
extensions.py
─────────────────────────────────────────────────────────────────
Instâncias das extensões Flask criadas aqui para evitar
importações circulares.
Importadas em app.py e nos models.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_login      import LoginManager
from flask_socketio   import SocketIO
from flask_bcrypt     import Bcrypt

db           = SQLAlchemy()
login_manager = LoginManager()
socketio     = SocketIO()
bcrypt       = Bcrypt()
