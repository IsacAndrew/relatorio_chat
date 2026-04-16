"""
routes/auth.py
─────────────────────────────────────────────────────────────────
Rotas de autenticação: login e logout.
"""

from flask           import Blueprint, render_template, request, redirect, url_for, flash
from flask_login     import login_user, logout_user, login_required, current_user
from models          import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/", methods=["GET"])
def index():
    """Redireciona raiz para dashboard (ou login se não autenticado)."""
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.dashboard"))
    return redirect(url_for("auth.login"))


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    """Exibe e processa o formulário de login."""

    # Redireciona se já estiver logado
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.dashboard"))

    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")

        if not username or not password:
            flash("Preencha usuário e senha.", "error")
            return render_template("login.html")

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            # Login bem-sucedido — sessão persistente
            login_user(user, remember=True)
            next_page = request.args.get("next")
            return redirect(next_page or url_for("dashboard.dashboard"))

        flash("Usuário ou senha incorretos.", "error")

    return render_template("login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    """Encerra a sessão do usuário."""
    logout_user()
    flash("Você saiu do sistema.", "info")
    return redirect(url_for("auth.login"))
