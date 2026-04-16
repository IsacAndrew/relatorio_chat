"""
config.py
─────────────────────────────────────────────────────────────────
Configuração central da aplicação.
Lê variáveis de ambiente do arquivo .env (desenvolvimento) ou
das variáveis de ambiente do servidor (produção no Render).
"""

import os
from dotenv import load_dotenv

# Carrega o .env se existir (desenvolvimento local)
load_dotenv()


class Config:
    # ── Segurança ──────────────────────────────────────────────
    SECRET_KEY = os.environ.get("SECRET_KEY", "chave-local-insegura-troque-em-prod")

    # ── Banco de Dados ─────────────────────────────────────────
    # Suporta PostgreSQL (Render) e SQLite (local).
    # No Render, defina DATABASE_URL como env var.
    _db_url = os.environ.get("DATABASE_URL", "")

    if _db_url.startswith("postgres://"):
        # Render usa postgres://, mas SQLAlchemy exige postgresql://
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = _db_url or "sqlite:///erros_pedidos.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── Cloudinary ─────────────────────────────────────────────
    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY    = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")

    # ── SocketIO ───────────────────────────────────────────────
    # "gevent" para produção com gunicorn; "threading" para dev local
    SOCKETIO_ASYNC_MODE = os.environ.get("SOCKETIO_ASYNC_MODE", "gevent")

    # ── Upload ─────────────────────────────────────────────────
    # Tipos de imagem aceitos no upload do print
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB
