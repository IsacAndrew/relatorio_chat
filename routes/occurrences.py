"""
routes/occurrences.py
─────────────────────────────────────────────────────────────────
Rotas de ocorrências:
 - Listagem (HTML + JSON)
 - Criação
 - Edição
 - Exclusão (lógica)
 - Upload de print via Cloudinary
 - Emissão de eventos Socket.IO em tempo real
"""

import json
from datetime  import datetime, date, time as dtime

import cloudinary.uploader
from flask       import (Blueprint, render_template, request,
                         redirect, url_for, flash, jsonify, current_app)
from flask_login import login_required, current_user

from extensions  import db, socketio
from models      import Occurrence, History
from catalogo    import CATALOGO, TIPOS_ERRO

occurrences_bp = Blueprint("occurrences", __name__)


# ───────────────────────────────────────────────────────────────
# HELPER: registra histórico
# ───────────────────────────────────────────────────────────────

def _registrar_historico(ocorrencia: Occurrence, acao: str, detalhes: dict):
    """Cria um registro de auditoria para a ocorrência."""
    h = History(
        ocorrencia_id = ocorrencia.id,
        usuario_id    = current_user.id,
        acao          = acao,
    )
    h.detalhes = detalhes
    db.session.add(h)


# ───────────────────────────────────────────────────────────────
# HELPER: faz upload do print para o Cloudinary
# ───────────────────────────────────────────────────────────────

def _upload_print(arquivo) -> tuple:
    """
    Faz upload de imagem para o Cloudinary.
    Retorna (url, public_id) ou (None, None) em caso de falha.
    """
    try:
        resultado = cloudinary.uploader.upload(
            arquivo,
            folder      = "erros_pedidos",
            resource_type = "image",
        )
        return resultado["secure_url"], resultado["public_id"]
    except Exception as e:
        current_app.logger.error(f"Cloudinary upload error: {e}")
        return None, None


# ───────────────────────────────────────────────────────────────
# HELPER: valida extensão do arquivo
# ───────────────────────────────────────────────────────────────

def _extensao_permitida(filename: str) -> bool:
    allowed = current_app.config["ALLOWED_EXTENSIONS"]
    return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed


# ═══════════════════════════════════════════════════════════════
# LISTAGEM
# ═══════════════════════════════════════════════════════════════

@occurrences_bp.route("/ocorrencias")
@login_required
def listar():
    """Página de listagem de ocorrências."""
    # Carrega apenas as ativas (não excluídas)
    ocorrencias = (
        Occurrence.query
        .filter(Occurrence.deletado_em.is_(None))
        .order_by(Occurrence.criado_em.desc())
        .all()
    )
    return render_template(
        "occurrences.html",
        ocorrencias = ocorrencias,
        catalogo    = CATALOGO,
        tipos_erro  = TIPOS_ERRO,
    )


# ───────────────────────────────────────────────────────────────
# API — retorna lista em JSON (usado pelo JS em tempo real)
# ───────────────────────────────────────────────────────────────

@occurrences_bp.route("/api/ocorrencias")
@login_required
def api_listar():
    """Retorna ocorrências ativas como JSON."""
    ocorrencias = (
        Occurrence.query
        .filter(Occurrence.deletado_em.is_(None))
        .order_by(Occurrence.criado_em.desc())
        .all()
    )
    return jsonify([o.to_dict() for o in ocorrencias])


# ═══════════════════════════════════════════════════════════════
# CRIAÇÃO
# ═══════════════════════════════════════════════════════════════

@occurrences_bp.route("/ocorrencias/nova", methods=["GET", "POST"])
@login_required
def nova():
    """Exibe e processa o formulário de nova ocorrência."""

    if request.method == "GET":
        return render_template(
            "new_occurrence.html",
            catalogo   = CATALOGO,
            tipos_erro = TIPOS_ERRO,
            hoje       = date.today().strftime("%Y-%m-%d"),
            hora_atual = datetime.now().strftime("%H:%M"),
        )

    # ── POST: processa formulário ──────────────────────────────
    modelo      = request.form.get("modelo", "").strip()
    tipo_erro   = request.form.get("tipo_erro", "").strip()
    data_str    = request.form.get("data_ocorrido", "").strip()
    hora_str    = request.form.get("hora_ocorrido", "").strip()
    nome_cliente  = request.form.get("nome_cliente", "").strip() or None
    link_conversa = request.form.get("link_conversa", "").strip() or None

    # kit[] e cor[] podem ter tamanhos diferentes (selects desabilitados não são enviados).
    # Usamos iteração independente: um par válido exige kit E cor não-vazios.
    kits_lista  = request.form.getlist("kit[]")
    cores_lista = request.form.getlist("cor[]")
    pares = []

    # Caso as listas tenham o mesmo tamanho → zip normal
    if len(kits_lista) == len(cores_lista):
        for k, c in zip(kits_lista, cores_lista):
            k = k.strip(); c = c.strip()
            if k and c:
                pares.append(f"{k} - {c}")
    else:
        # Listas com tamanhos diferentes: usa apenas os itens não-vazios de cada lista
        # emparelhando pela posição dos itens preenchidos
        kits_validos  = [k.strip() for k in kits_lista  if k.strip()]
        cores_validas = [c.strip() for c in cores_lista if c.strip()]
        for k, c in zip(kits_validos, cores_validas):
            pares.append(f"{k} - {c}")

    cor = ", ".join(pares) if pares else ""

    # Validação básica dos campos obrigatórios
    erros = []
    if not modelo:    erros.append("Modelo é obrigatório.")
    if not cor:       erros.append("Selecione o kit e a combinação de cores.")
    if not tipo_erro: erros.append("Tipo de erro é obrigatório.")
    if not data_str:  erros.append("Data do ocorrido é obrigatória.")
    if not hora_str:  erros.append("Hora do ocorrido é obrigatória.")

    if erros:
        for e in erros:
            flash(e, "error")
        return render_template(
            "new_occurrence.html",
            catalogo=CATALOGO, tipos_erro=TIPOS_ERRO,
            hoje=date.today().strftime("%Y-%m-%d"),
            hora_atual=datetime.now().strftime("%H:%M"),
        )

    # Converte data e hora
    try:
        data_ocorrido = datetime.strptime(data_str, "%Y-%m-%d").date()
        hora_ocorrido = datetime.strptime(hora_str, "%H:%M").time()
    except ValueError:
        flash("Data ou hora inválidas.", "error")
        return redirect(url_for("occurrences.nova"))

    # ── Upload do print (opcional) ─────────────────────────────
    print_url       = None
    print_public_id = None
    arquivo = request.files.get("print_conversa")

    if arquivo and arquivo.filename:
        if not _extensao_permitida(arquivo.filename):
            flash("Formato de imagem não permitido. Use PNG, JPG, JPEG ou WEBP.", "error")
            return redirect(url_for("occurrences.nova"))
        print_url, print_public_id = _upload_print(arquivo)
        if not print_url:
            flash("Erro no upload da imagem. Tente novamente.", "error")
            return redirect(url_for("occurrences.nova"))

    # ── Salva ocorrência ───────────────────────────────────────
    oc = Occurrence(
        modelo          = modelo,
        cor             = cor,
        tipo_erro       = tipo_erro,
        data_ocorrido   = data_ocorrido,
        hora_ocorrido   = hora_ocorrido,
        nome_cliente    = nome_cliente,
        link_conversa   = link_conversa,
        print_url       = print_url,
        print_public_id = print_public_id,
        criado_por_id   = current_user.id,
    )
    db.session.add(oc)
    db.session.flush()  # Garante que oc.id esteja disponível

    # Registra no histórico
    _registrar_historico(oc, "criacao", {
        "modelo":    modelo,
        "cor":       cor,
        "tipo_erro": tipo_erro,
    })

    db.session.commit()

    # ── Emite evento Socket.IO para todos os clientes ──────────
    socketio.emit("nova_ocorrencia", oc.to_dict())

    flash("Ocorrência registrada com sucesso!", "success")
    return redirect(url_for("occurrences.listar"))


# ═══════════════════════════════════════════════════════════════
# EDIÇÃO
# ═══════════════════════════════════════════════════════════════

@occurrences_bp.route("/ocorrencias/<int:oc_id>/editar", methods=["GET", "POST"])
@login_required
def editar(oc_id: int):
    """Exibe e processa o formulário de edição de ocorrência."""

    oc = Occurrence.query.filter_by(id=oc_id, deletado_em=None).first_or_404()

    if request.method == "GET":
        return render_template(
            "edit_occurrence.html",
            oc         = oc,
            catalogo   = CATALOGO,
            tipos_erro = TIPOS_ERRO,
        )

    # ── POST: salva alterações ─────────────────────────────────
    novo_modelo      = request.form.get("modelo", "").strip()
    novo_tipo_erro   = request.form.get("tipo_erro", "").strip()
    data_str         = request.form.get("data_ocorrido", "").strip()
    hora_str         = request.form.get("hora_ocorrido", "").strip()
    novo_nome        = request.form.get("nome_cliente", "").strip() or None
    novo_link        = request.form.get("link_conversa", "").strip() or None

    kits_lista  = request.form.getlist("kit[]")
    cores_lista = request.form.getlist("cor[]")
    pares = []
    if len(kits_lista) == len(cores_lista):
        for k, c in zip(kits_lista, cores_lista):
            k = k.strip(); c = c.strip()
            if k and c:
                pares.append(f"{k} - {c}")
    else:
        kits_validos  = [k.strip() for k in kits_lista  if k.strip()]
        cores_validas = [c.strip() for c in cores_lista if c.strip()]
        for k, c in zip(kits_validos, cores_validas):
            pares.append(f"{k} - {c}")
    nova_cor = ", ".join(pares) if pares else ""

    try:
        nova_data = datetime.strptime(data_str, "%Y-%m-%d").date()
        nova_hora = datetime.strptime(hora_str, "%H:%M").time()
    except ValueError:
        flash("Data ou hora inválidas.", "error")
        return redirect(url_for("occurrences.editar", oc_id=oc_id))

    # Registra o que mudou (para o histórico de auditoria)
    mudancas = {}

    def _registra_mudanca(campo, velho, novo):
        if str(velho or "") != str(novo or ""):
            mudancas[campo] = {"antes": str(velho or ""), "depois": str(novo or "")}

    _registra_mudanca("modelo",        oc.modelo,        novo_modelo)
    _registra_mudanca("cor",           oc.cor,           nova_cor)
    _registra_mudanca("tipo_erro",     oc.tipo_erro,     novo_tipo_erro)
    _registra_mudanca("data_ocorrido", oc.data_ocorrido, nova_data)
    _registra_mudanca("hora_ocorrido", oc.hora_ocorrido, nova_hora)
    _registra_mudanca("nome_cliente",  oc.nome_cliente,  novo_nome)
    _registra_mudanca("link_conversa", oc.link_conversa, novo_link)

    # ── Troca de print (opcional) ──────────────────────────────
    arquivo = request.files.get("print_conversa")
    if arquivo and arquivo.filename:
        if not _extensao_permitida(arquivo.filename):
            flash("Formato de imagem não permitido.", "error")
            return redirect(url_for("occurrences.editar", oc_id=oc_id))

        # Apaga print antigo do Cloudinary (se existir)
        if oc.print_public_id:
            try:
                cloudinary.uploader.destroy(oc.print_public_id)
            except Exception:
                pass  # não bloqueia se falhar

        nova_url, novo_public_id = _upload_print(arquivo)
        if not nova_url:
            flash("Erro no upload da imagem. Tente novamente.", "error")
            return redirect(url_for("occurrences.editar", oc_id=oc_id))

        mudancas["print"] = {"antes": "print anterior", "depois": "novo print"}
        oc.print_url       = nova_url
        oc.print_public_id = novo_public_id

    # ── Aplica as mudanças ─────────────────────────────────────
    oc.modelo        = novo_modelo
    oc.cor           = nova_cor
    oc.tipo_erro     = novo_tipo_erro
    oc.data_ocorrido = nova_data
    oc.hora_ocorrido = nova_hora
    oc.nome_cliente  = novo_nome
    oc.link_conversa = novo_link
    oc.atualizado_em = datetime.utcnow()

    if mudancas:
        _registrar_historico(oc, "edicao", mudancas)

    db.session.commit()

    # Emite evento de atualização para todos os clientes
    socketio.emit("ocorrencia_editada", oc.to_dict())

    flash("Ocorrência atualizada com sucesso!", "success")
    return redirect(url_for("occurrences.listar"))


# ═══════════════════════════════════════════════════════════════
# EXCLUSÃO (lógica)
# ═══════════════════════════════════════════════════════════════

@occurrences_bp.route("/api/ocorrencias/<int:oc_id>/deletar", methods=["DELETE"])
@login_required
def deletar(oc_id: int):
    """
    Exclusão lógica via AJAX.
    Marca deletado_em; a ocorrência permanece no banco para auditoria.
    """
    oc = Occurrence.query.filter_by(id=oc_id, deletado_em=None).first_or_404()

    oc.deletado_em = datetime.utcnow()
    _registrar_historico(oc, "exclusao", {
        "modelo":    oc.modelo,
        "cor":       oc.cor,
        "tipo_erro": oc.tipo_erro,
    })

    db.session.commit()

    # Emite evento para remover da lista em todos os clientes
    socketio.emit("ocorrencia_deletada", {"id": oc_id})

    return jsonify({"ok": True, "id": oc_id})


# ═══════════════════════════════════════════════════════════════
# API — catálogo (para dropdowns dinâmicos)
# ═══════════════════════════════════════════════════════════════

@occurrences_bp.route("/api/catalogo")
@login_required
def api_catalogo():
    """Retorna CATALOGO e TIPOS_ERRO como JSON."""
    return jsonify({
        "catalogo":   CATALOGO,
        "tipos_erro": TIPOS_ERRO,
    })
