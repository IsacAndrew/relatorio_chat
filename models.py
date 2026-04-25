"""
models.py
─────────────────────────────────────────────────────────────────
Modelos do banco de dados usando SQLAlchemy.
Tabelas: users, occurrences, history
"""

import json
from datetime import datetime, date, time

from flask_login import UserMixin
from extensions import db, bcrypt


# ═══════════════════════════════════════════════════════════════
# USUÁRIO
# ═══════════════════════════════════════════════════════════════

class User(UserMixin, db.Model):
    """Usuário do sistema. Todos têm as mesmas permissões."""

    __tablename__ = "users"

    id           = db.Column(db.Integer, primary_key=True)
    username     = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    criado_em    = db.Column(db.DateTime, default=datetime.utcnow)

    # Relacionamentos
    ocorrencias = db.relationship("Occurrence", backref="criador", lazy=True,
                                  foreign_keys="Occurrence.criado_por_id")
    historicos  = db.relationship("History", backref="usuario", lazy=True)

    def set_password(self, senha_plana: str):
        """Gera hash da senha e armazena."""
        self.password_hash = bcrypt.generate_password_hash(senha_plana).decode("utf-8")

    def check_password(self, senha_plana: str) -> bool:
        """Verifica se a senha bate com o hash armazenado."""
        return bcrypt.check_password_hash(self.password_hash, senha_plana)

    def __repr__(self):
        return f"<User {self.username}>"


# ═══════════════════════════════════════════════════════════════
# OCORRÊNCIA
# ═══════════════════════════════════════════════════════════════

class Occurrence(db.Model):
    """
    Registro de um erro de pedido.
    Suporta exclusão lógica (deletado_em != None).
    """

    __tablename__ = "occurrences"

    id              = db.Column(db.Integer, primary_key=True)

    # ── Campos obrigatórios ───────────────────────────────────
    modelo          = db.Column(db.String(120), nullable=False)
    #kit             = db.Column(db.String(20),  nullable=True)   # ex: "Kit 2"
    cor             = db.Column(db.String(80),  nullable=False)
    tipo_erro       = db.Column(db.String(80),  nullable=False)
    data_ocorrido   = db.Column(db.Date,        nullable=False)
    hora_ocorrido   = db.Column(db.Time,        nullable=False)

    # ── Campos opcionais ──────────────────────────────────────
    nome_cliente    = db.Column(db.String(200), nullable=True)
    link_conversa   = db.Column(db.Text,        nullable=True)
    print_url       = db.Column(db.Text,        nullable=True)
    print_public_id = db.Column(db.String(256), nullable=True)
    plataforma      = db.Column(db.String(50),  nullable=True)  # TikTok Shop | Shopee | Shein

    # ── Metadados ─────────────────────────────────────────────
    criado_por_id   = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    criado_em       = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    atualizado_em   = db.Column(db.DateTime, default=datetime.utcnow,
                                onupdate=datetime.utcnow, nullable=False)
    deletado_em     = db.Column(db.DateTime, nullable=True)  # None = ativo

    # Relacionamento com histórico
    historicos = db.relationship("History", backref="ocorrencia", lazy=True)

    @property
    def ativo(self) -> bool:
        """True se a ocorrência não foi excluída."""
        return self.deletado_em is None

    def to_dict(self) -> dict:
        """Serializa para JSON (uso nas APIs e Socket.IO)."""
        return {
            "id":             self.id,
            "modelo":         self.modelo,
            #"kit":            self.kit or "",
            "cor":            self.cor,
            "tipo_erro":      self.tipo_erro,
            "data_ocorrido":  self.data_ocorrido.strftime("%d/%m/%Y"),
            "hora_ocorrido":  self.hora_ocorrido.strftime("%H:%M"),
            "nome_cliente":   self.nome_cliente or "",
            "link_conversa":  self.link_conversa or "",
            "print_url":      self.print_url or "",
            "plataforma":     self.plataforma or "",
            "criado_por":     self.criador.username if self.criador else "",
            "criado_em":      self.criado_em.strftime("%d/%m/%Y %H:%M"),
            "atualizado_em":  self.atualizado_em.strftime("%d/%m/%Y %H:%M"),
        }

    def __repr__(self):
        return f"<Occurrence #{self.id} {self.modelo}/{self.cor}>"


# ═══════════════════════════════════════════════════════════════
# HISTÓRICO / AUDITORIA
# ═══════════════════════════════════════════════════════════════

class History(db.Model):
    """
    Log de auditoria.
    Registra cada criação, edição e exclusão de ocorrência.
    """

    __tablename__ = "history"

    id             = db.Column(db.Integer, primary_key=True)
    ocorrencia_id  = db.Column(db.Integer, db.ForeignKey("occurrences.id"), nullable=False)
    usuario_id     = db.Column(db.Integer, db.ForeignKey("users.id"),       nullable=False)

    # Ação: "criacao" | "edicao" | "exclusao"
    acao           = db.Column(db.String(20), nullable=False)

    # JSON com detalhes da mudança (campos alterados, valores antigos/novos)
    detalhes_json  = db.Column(db.Text, nullable=True)

    criado_em      = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    @property
    def detalhes(self) -> dict:
        """Desserializa o JSON de detalhes."""
        if self.detalhes_json:
            return json.loads(self.detalhes_json)
        return {}

    @detalhes.setter
    def detalhes(self, valor: dict):
        """Serializa o dict como JSON."""
        self.detalhes_json = json.dumps(valor, ensure_ascii=False)

    def to_dict(self) -> dict:
        """Serializa para JSON."""
        return {
            "id":            self.id,
            "ocorrencia_id": self.ocorrencia_id,
            "usuario":       self.usuario.username if self.usuario else "",
            "acao":          self.acao,
            "detalhes":      self.detalhes,
            "criado_em":     self.criado_em.strftime("%d/%m/%Y %H:%M:%S"),
        }

    def __repr__(self):
        return f"<History #{self.id} {self.acao} oc#{self.ocorrencia_id}>"
