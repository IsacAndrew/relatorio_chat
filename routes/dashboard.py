"""
routes/dashboard.py
─────────────────────────────────────────────────────────────────
Dashboard com gráficos de análise de erros.
Endpoint HTML + API JSON para os dados dos gráficos.
"""

from datetime   import date, datetime, timedelta
from collections import Counter

from flask       import Blueprint, render_template, request, jsonify
from flask_login import login_required

from models import Occurrence

dashboard_bp = Blueprint("dashboard", __name__)


# ═══════════════════════════════════════════════════════════════
# PÁGINA DO DASHBOARD
# ═══════════════════════════════════════════════════════════════

@dashboard_bp.route("/dashboard")
@login_required
def dashboard():
    """Renderiza a página do dashboard com os gráficos."""
    return render_template("dashboard.html")


# ═══════════════════════════════════════════════════════════════
# API — dados para os gráficos
# ═══════════════════════════════════════════════════════════════

@dashboard_bp.route("/api/dashboard")
@login_required
def api_dados():
    """
    Retorna dados agregados para os gráficos.

    Query params:
      - data_inicio (YYYY-MM-DD) — padrão: 30 dias atrás
      - data_fim    (YYYY-MM-DD) — padrão: hoje
    """

    # ── Lê e valida parâmetros de data ─────────────────────────
    hoje    = date.today()
    padrao_inicio = hoje - timedelta(days=30)

    try:
        data_inicio = datetime.strptime(
            request.args.get("data_inicio", padrao_inicio.strftime("%Y-%m-%d")),
            "%Y-%m-%d"
        ).date()
    except ValueError:
        data_inicio = padrao_inicio

    try:
        data_fim = datetime.strptime(
            request.args.get("data_fim", hoje.strftime("%Y-%m-%d")),
            "%Y-%m-%d"
        ).date()
    except ValueError:
        data_fim = hoje

    # ── Consulta ocorrências ativas no período ─────────────────
    ocorrencias = (
        Occurrence.query
        .filter(
            Occurrence.deletado_em.is_(None),
            Occurrence.data_ocorrido >= data_inicio,
            Occurrence.data_ocorrido <= data_fim,
        )
        .all()
    )

    total = len(ocorrencias)

    # ── Contagens ──────────────────────────────────────────────
    contagem_modelos    = Counter(o.modelo    for o in ocorrencias)
    contagem_cores      = Counter(o.cor       for o in ocorrencias)
    contagem_tipo_erro  = Counter(o.tipo_erro for o in ocorrencias)

    # ── Ordena do maior para o menor (ranking decrescente) ─────
    def _ordenar(counter: Counter) -> dict:
        """Retorna {'labels': [...], 'values': [...]} ordenado desc."""
        items  = counter.most_common()   # já ordena decrescente
        labels = [item[0] for item in items]
        values = [item[1] for item in items]
        return {"labels": labels, "values": values}

    return jsonify({
        "total":       total,
        "data_inicio": data_inicio.strftime("%d/%m/%Y"),
        "data_fim":    data_fim.strftime("%d/%m/%Y"),
        "modelos":     _ordenar(contagem_modelos),
        "cores":       _ordenar(contagem_cores),
        "tipos_erro":  _ordenar(contagem_tipo_erro),
    })
