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
    "Baby Cropped": [
        "Amarelo",
        "Preto", 
        "Rosa", 
        "Marrom", 
        "Vermelho", 
    ],
    "Baby Look": [
        "Amarelo", 
        "Azul", 
        "Lilás", 
        "Marrom", 
        "Off-White", 
        "Preto", 
        "Rosa", 
        "Vermelho", 
        "Verde Band.", 
        "Amarelo Band",
        "Azul Band.", 
    ],
    "Baby Tee": [
        "Preto", 
        "Branco", 
        "Rosa", 
        "Azul Bebe", 
        "Vermelho", 
        "Vinho", 
        "Azul Marinho", 
        "Cinza", 
        "Marrom", 
    ], 
    "Blusinha Manga Longa": [
        "Preto", 
        "Verde", 
        "Marrom", 
        "Vinho", 
        "Azul Marinho", 
    ], 
    "Blusinha Regata": [
        "Vinho", 
        "Marrom", 
        "Azul Marinho", 
        "Preto", 
        "Vermelho", 
        "Azul Band.", 
        "Amarelo Band.", 
        "Verde Band.", 
    ], 
    "Body Gola Quadrada": [
        "Marrom", 
        "Azul Marinho" ,
        "Cinza", 
        "Preto", 
    ], 
    "Body Manga Curta": [
        "Vinho", 
        "Marrom", 
        "Azul Marinho", 
        "Branco", 
        "Cinza", 
        "Preto", 
    ],
    "Body Regata": [
        "Marrom", 
        "Branco", 
        "Preto", 
        "Cinza", 
        "Azul Marinho", 
    ], 
    "Blusinha Costa Nua": [
        "Vermelho", 
        "Azul Bebe", 
        "Marrom" ,
        "Verde" ,
        "Preto",
    ], 
    "Cropped Manga Longa": [
        "Marrom", 
        "Preto", 
    ], 
    "Body Gola Alta": [
        "Preto", 
        "Bege", 
        "Marrom", 
        "Cinza", 
    ], 
    "Mula MAnca": [
        "Preto", 
        "Vermelho", 
        "Azul Bebe", 
        "Rosa", 
        "Branco", 
    ], 
    "Top Academia": [
        "Marrom", 
        "Cinza", 
        "Branco", 
        "Azul Marinho", 
        "Lilás", 
        "Preto", 
        "Amarelo", 
        "Bege", 
        "Azul Bebe" ,
        "Vermelho", 
        "Vinho", 
    ], 
    "Top Tube Faixa": [
        "Preto" ,
        "Azul Marinho"
        "Marrom", 
        "Branco", 
        "Cinza", 
    ], 
    "Blusinha T-Shirt": [
        "Vinho", 
        "Azul Marinho" ,
        "Marrom", 
        "Verde", 
        "Preto", 
    ],
}

# ─────────────────────────────────────────────────────────────────
# Tipos de erro (também fixos — edite se necessário)
# ─────────────────────────────────────────────────────────────────

TIPOS_ERRO = [
    "Erro de Cor",
    "Erro de Modelo",
    "Produto Faltando",
    "Produto Danificado", 
]
