"""
routes/history.py
─────────────────────────────────────────────────────────────────
Histórico de auditoria do sistema.
Exibe todas as ações (criação, edição, exclusão) com filtro por data.
"""

from datetime import datetime, date, timedelta

from flask       import Blueprint, render_template, request, jsonify
from flask_login import login_required

from models import History

history_bp = Blueprint("history", __name__)


# ═══════════════════════════════════════════════════════════════
# PÁGINA DE HISTÓRICO
# ═══════════════════════════════════════════════════════════════

@history_bp.route("/historico")
@login_required
def historico():
    """Renderiza a página de histórico/auditoria."""
    return render_template("history.html")


# ═══════════════════════════════════════════════════════════════
# API — lista de registros de histórico
# ═══════════════════════════════════════════════════════════════

@history_bp.route("/api/historico")
@login_required
def api_historico():
    """
    Retorna registros de histórico como JSON.

    Query params:
      - data_inicio (YYYY-MM-DD)
      - data_fim    (YYYY-MM-DD)
      - pagina      (int, padrão 1)
      - por_pagina  (int, padrão 50)
    """

    hoje    = date.today()
    padrao_inicio = hoje - timedelta(days=30)

    try:
        data_inicio = datetime.strptime(
            request.args.get("data_inicio", padrao_inicio.strftime("%Y-%m-%d")),
            "%Y-%m-%d"
        )
    except ValueError:
        data_inicio = datetime.combine(padrao_inicio, datetime.min.time())

    try:
        data_fim_date = datetime.strptime(
            request.args.get("data_fim", hoje.strftime("%Y-%m-%d")),
            "%Y-%m-%d"
        ).date()
        # Inclui o dia inteiro de data_fim
        data_fim = datetime.combine(data_fim_date, datetime.max.time())
    except ValueError:
        data_fim = datetime.combine(hoje, datetime.max.time())

    pagina    = int(request.args.get("pagina", 1))
    por_pagina = min(int(request.args.get("por_pagina", 50)), 200)  # máximo 200

    # ── Consulta com paginação ─────────────────────────────────
    query = (
        History.query
        .filter(
            History.criado_em >= data_inicio,
            History.criado_em <= data_fim,
        )
        .order_by(History.criado_em.desc())
    )

    total    = query.count()
    registros = query.offset((pagina - 1) * por_pagina).limit(por_pagina).all()

    return jsonify({
        "total":       total,
        "pagina":      pagina,
        "por_pagina":  por_pagina,
        "registros":   [r.to_dict() for r in registros],
    })
