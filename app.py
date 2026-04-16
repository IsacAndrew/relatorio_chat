"""
app.py
─────────────────────────────────────────────────────────────────
Ponto de entrada da aplicação Flask.
Registra blueprints, configura extensões e inicia o servidor.
"""

import cloudinary
from flask import Flask

from config     import Config
from extensions import db, login_manager, socketio, bcrypt


def create_app() -> Flask:
    """Factory da aplicação Flask."""

    app = Flask(__name__)
    app.config.from_object(Config)

    # ── Inicializa extensões ───────────────────────────────────
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)
    socketio.init_app(
        app,
        async_mode=app.config["SOCKETIO_ASYNC_MODE"],
        cors_allowed_origins="*",          # ajuste para seu domínio em prod
        logger=False,
        engineio_logger=False,
    )

    # ── Configuração do Flask-Login ────────────────────────────
    login_manager.login_view      = "auth.login"
    login_manager.login_message   = "Faça login para acessar esta página."
    login_manager.login_message_category = "info"

    # ── Configura Cloudinary ───────────────────────────────────
    cloudinary.config(
        cloud_name = app.config["CLOUDINARY_CLOUD_NAME"],
        api_key    = app.config["CLOUDINARY_API_KEY"],
        api_secret = app.config["CLOUDINARY_API_SECRET"],
        secure     = True,
    )

    # ── Registra blueprints ────────────────────────────────────
    from routes.auth        import auth_bp
    from routes.occurrences import occurrences_bp
    from routes.dashboard   import dashboard_bp
    from routes.history     import history_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(occurrences_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(history_bp)

    # ── Cria as tabelas (se não existirem) ─────────────────────
    with app.app_context():
        db.create_all()
        _seed_users_if_empty()

    return app


def _seed_users_if_empty():
    """
    Cria usuários padrão se o banco estiver vazio.
    IMPORTANTE: troque as senhas antes de colocar em produção.
    """
    from models import User

    if User.query.count() == 0:
        usuarios_iniciais = [
            ("admin",  "admin123"),
            ("usuario", "usuario123"),
        ]
        for nome, senha in usuarios_iniciais:
            u = User(username=nome)
            u.set_password(senha)
            db.session.add(u)
        db.session.commit()
        print("[SEED] Usuários padrão criados: admin / usuario")


# ── Carrega usuário para o Flask-Login ────────────────────────────
@login_manager.user_loader
def load_user(user_id: str):
    from models import User
    return User.query.get(int(user_id))


# ── Instância global (usada pelo Gunicorn) ─────────────────────────
app = create_app()


if __name__ == "__main__":
    # Modo de desenvolvimento local
    socketio.run(app, debug=True, host="0.0.0.0", port=5000)
