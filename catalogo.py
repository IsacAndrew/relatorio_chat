"""
catalogo.py
─────────────────────────────────────────────────────────────────
Catálogo fixo de modelos e suas cores disponíveis.
Editável manualmente — basta alterar o dicionário abaixo.

REGRA: cada chave é um modelo; o valor é a lista de cores.
Não use tuplas nem estruturas complexas.
"""

# ─────────────────────────────────────────────────────────────────
# ⚙️  EDITE AQUI: adicione, remova ou renomeie modelos e cores
# ─────────────────────────────────────────────────────────────────

CATALOGO = {
    "Vestido Floral Manga Curta": [
        "Preto",
        "Branco",
        "Rosa",
        "Vinho",
        "Azul Marinho",
        "Verde",
    ],
    "Vestido Liso Manga Longa": [
        "Preto",
        "Branco",
        "Cinza",
        "Caramelo",
        "Vinho",
    ],
    "Blusa Cropped": [
        "Preto",
        "Branco",
        "Rosa",
        "Lilás",
        "Verde",
        "Amarelo",
    ],
    "Calça Palazzo": [
        "Preto",
        "Bege",
        "Marinho",
        "Vinho",
        "Cinza",
    ],
    "Conjunto Coordenado": [
        "Preto",
        "Branco",
        "Rosa",
        "Cinza",
        "Caramelo",
    ],
    "Short Saia Jeans": [
        "Azul Claro",
        "Azul Escuro",
        "Preto",
        "Branco",
    ],
    "Macacão Liso": [
        "Preto",
        "Branco",
        "Vinho",
        "Verde",
        "Azul Marinho",
    ],
    "Saia Midi Estampada": [
        "Floral Rosa",
        "Floral Azul",
        "Listrado",
        "Xadrez",
        "Animal Print",
    ],
    "Kimono": [
        "Preto",
        "Branco",
        "Estampado Floral",
        "Tie-Dye",
    ],
    "Top Alcinha": [
        "Preto",
        "Branco",
        "Rosa",
        "Nude",
        "Vinho",
        "Verde",
    ],
}

# ─────────────────────────────────────────────────────────────────
# Tipos de erro (também fixos — edite se necessário)
# ─────────────────────────────────────────────────────────────────

TIPOS_ERRO = [
    "Erro de cor/modelo",
    "Produto faltando",
]
