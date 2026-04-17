"""
catalogo.py
─────────────────────────────────────────────────────────────────
Catálogo de modelos organizados por kits e combinações de cores.
Pra adicionar um modelo, kit ou cor: é só editar o dicionário abaixo.

REGRA: CATALOGO = { "Modelo": { "Kit N": ["Cor1", "Cor1/Cor2", ...] } }
"""

# Aqui fica tudo que a gente vende, separadinho por modelo e kit
CATALOGO = {
    "Baby Cropped": {
        "Kit 1": [
            "Amarelo", "Preto", "Rosa", "Marrom", "Vermelho",
        ],
    },

    "Baby Look": {
        "Kit 1": [
            "Amarelo", "Azul Bebe", "Marrom", "Branco", "Preto", "Rosa",
            "Vermelho", "Verde Band.", "Amarelo Band.", "Azul Band.",
        ],
        "Kit 2": [
            "Amarelo/Azul", "Amarelo/Lilás", "Amarelo/Marrom", "Amarelo/Branco",
            "Amarelo/Preto", "Azul/Lilás", "Azul/Marrom", "Lilás/Rosa",
            "Marrom/Lilás", "Marrom/Branco", "Marrom/Preto", "Marrom/Rosa",
            "Marrom/Vermelho", "Branco/Azul", "Branco/Lilás", "Branco/Preto",
            "Branco/Rosa", "Branco/Vermelho", "Preto/Lilás", "Preto/Rosa",
            "Preto/Vermelho", "Rosa/Amarelo", "Rosa/Azul", "Rosa/Vermelho",
            "Vermelho/Amarelo", "Vermelho/Azul", "Vermelho/Lilás",
        ],
        "Kit 3": [
            "Rosa/Vermelho/Amarelo", "Rosa/Branco/Vermelho", "Rosa/Lilás/Vermelho",
            "Rosa/Lilás/Branco", "Rosa/Lilas/Amarelo", "Rosa/Amarelo/Branco",
            "Preto/Rosa/Azul", "Preto/Branco/Lilás", "Preto/Branco/Azul",
            "Preto/Marrom/Vermelho", "Preto/Marrom/Azul", "Preto/Amarelo/Rosa",
            "Preto/Amarelo/Lilás", "Verm./Verm./Verm.", "Rosa/Rosa/Rosa",
            "Preto/Preto/Preto", "Branco/Branco/Branco", "Marrom/Marrom/Marrom",
            "Lilás/Lilás/Lilás", "Azul/Azul/Azul", "Amarelo/Amarelo/Amarelo",
            "Verde Band./Amarelo Band./Azul Band.",
        ],
        "Kit 4": [
            "Amarelo/Azul/Rosa/Preto", "Azul/Amarelo/Branco/Vermelho",
            "Azul/Lilás/Marrom/Vermelho", "Branco/Vermelho/Amarelo/Lilás",
            "Preto/Azul/Amarelo/Lilás", "Rosa/Amarelo/Branco/Vermelho",
            "Preto/Azul/Branco/Vermelho", "Marrom/Lilas/Amarelo/Branco",
            "Marrom/Azul/Amarelo/Rosa", "Marrom/Rosa/Lilás/Vermelho",
            "Preto/Marrom/Rosa/Lilás", "Marrom/Rosa/Lilás/Branco",
            "Preto/Marrom/Azul/Rosa", "Preto/Marrom/Amarelo/Lilás",
            "Preto/Marrom/Branco/Vermelho", "Preto/Rosa/Lilás/Branco",
            "Lilás/Branco/Vermelho/Preto", "Preto/Branco/Marrom/Amarelo",
            "Branco/Lilás/Azul/Rosa", "Branco/Preto/Azul/Rosa",
            "Azul/Amarelo/Rosa/Lilás",
        ],
        "Kit 5": [
            "Azul/Rosa/Vermelho/Amarelo/Branco", "Azul/Amarelo/Branco/Preto/Rosa",
            "Marrom/Azul/Rosa/Lilás/Amarelo", "Preto/Marrom/Azul/Rosa/Lilás",
            "Preto/Marrom/Branco/Vermelho/Lilás", "Azul/Rosa/Lilás/Amarelo/Branco",
            "Preto/Marrom/Azul/Rosa/Amarelo", "Preto/Marrom/Rosa/Lilás/Amarelo",
            "Rosa/Lilás/Vermelho/Amarelo/Branco",
        ],
    },

    "Baby Tee": {
        "Kit 1": [
            "Preto", "Branco", "Rosa", "Azul Bebe", "Vermelho",
            "Vinho", "Azul Marinho", "Cinza", "Marrom",
        ],
        "Kit 2": [
            "Preto/Marrom", "Preto/Vermelho", "Preto/Azul Marinho", "Preto/Vinho",
            "Marrom/Branco", "Marrom/Vermelho", "Marrom/Azul Marinho", "Marrom/Vinho",
            "Branco/Vermelho", "Branco/Azul Marinho", "Preto/Branco",
            "Vermelho/Azul Marinho", "Vermelho/Vinho", "Azul/Vinho", "Branco/Vinho",
        ],
        "Kit 3": [
            "Preto/Preto/Preto", "Preto/Marrom/Vermelho", "Preto/Marrom/Azul Marinho",
            "Preto/Marrom/Vinho", "Preto/Branco/Vermelho", "Preto/Branco/Azul Marinho",
            "Preto/Branco/Vinho", "Preto/Vermelho/Azul Marinho", "Preto/Vermelho/Vinho",
            "Preto/Azul Marinho/Vinho", "Marrom/Branco/Vermelho",
            "Marrom/Branco/Azul Marinho", "Marrom/Branco/Vinho",
            "Marrom/Vermelho/Azul Marinho", "Preto/Marrom/Branco",
            "Marrom/Azul Marinho/Vinho", "Branco/Vermelho/Azul Marinho",
            "Branco/Vermelho/Vinho", "Branco/Azul Marinho/Vinho",
            "Vermelho/Azul Marinho/Vinho", "Marrom/Vermelho/Vinho",
        ],
        "Kit 4": [
            "Preto/Marrom/Branco/Vinho", "Branco/Vermelho/Azul Marinho/Vinho",
            "Preto/Branco/Vermelho/Azul Marinho", "Preto/Branco/Azul Marinho/Vinho",
            "Preto/Vermelho/Azul Marinho/Vinho", "Preto/Marrom/Vermelho/Azul Marinho",
            "Preto/Marrom/Azul Marinho/Vinho", "Preto/Branco/Vermelho/Vinho",
            "Marrom/Branco/Vermelho/Azul Marinho", "Marrom/Branco/Vermelho/Vinho",
            "Preto/Marrom/Branco/Vermelho", "Preto/Marrom/Branco/Azul Marinho",
            "Marrom/Vermelho/Azul Marinho/Vinho", "Marrom/Branco/Azul Marinho/Vinho",
            "Preto/Marrom/Vermelho/Vinho",
        ],
        "Kit 5": [
            "Marrom/Preto/Branco/Vermelho/Azul Marinho",
            "Marrom/Preto/Branco/Vermelho/Vinho",
            "Marrom/Preto/Branco/Azul Marinho",
            "Marrom/Preto/Vermelho/Azul Marinho/Vinho",
            "Preto/Branco/Vermelho/Azul Marinho/Vinho",
            "Marrom/Branco/Vermelho/Azul Marinho/Vinho",
        ],
        "Kit 6": [
            "Preto/Azul Marinho/Vermelho/Vinho/Branco/Marrom",
        ],
    },

    "Blusinha Manga Longa": {
        "Kit 1": [
            "Preto", "Verde", "Marrom", "Vinho", "Azul Marinho",
        ],
        "Kit 2": [
            "Preto/Vinho", "Verde/Azul Marinho", "Verde/Vinho", "Verde/Verde",
            "Preto/Marrom", "Marrom/Azul Marinho", "Marrom/Vinho",
            "Azul Marinho/Azul Marinho", "Azul Marinho/Vinho", "Preto/Azul Marinho",
            "Vinho/Vinho", "Preto/Preto", "Preto/Verde", "Marrom/Marrom", "Verde/Marrom",
        ],
    },

    "Blusinha Regata": {
        "Kit 1": [
            "Vinho", "Marrom", "Azul Marinho", "Preto", "Vermelho",
            "Azul Band.", "Amarelo Band.", "Verde Band.",
        ],
        "Kit 2": [
            "Marrom/Azul Marinho", "Marrom/Vermelho", "Marrom/Vinho",
            "Azul Marinho/Vermelho", "Azul Marinho/Preto", "Vermelho/Vinho",
            "Azul Marinho/Vinho", "Marrom/Preto", "Preto/Vermelho", "Preto/Vinho",
            "Marrom/Marrom", "Azul Marinho/Azul Marinho", "Preto/Preto",
            "Vinho/Vinho", "Vermelho/Vermelho",
        ],
        "Kit 3": [
            "Marrom/Azul Marinho/Vinho", "Vermelho/Azul Marinho/Vinho",
            "Vermelho/Azul Marinho/Preto", "Azul Marinho/Vinho/Preto",
            "Azul Marinho/Marrom/Preto", "Vermelho/Vinho/Preto",
            "Amarelo Band./Verde Band./Azul Band.", "Marrom/Azul Marinho/Preto",
            "Marrom/Azul Marinho/Vermelho", "Preto/Marrom/Vermelho",
            "Marrom/Vinho/Preto", "Vinho/Marrom/Vermelho",
        ],
        "Kit 4": [
            "Azul Marinho/Vermelho/Vinho/Preto", "Marrom/Azul Marinho/Vermelho/Vinho",
            "Marrom/Vermelho/Vinho/Preto", "Marrom/Azul Marinho/Vermelho/Preto",
            "Verde Band./Azul Band./Amarelo Band./Preto",
        ],
        "Kit 5": [
            "Marrom/Azul Marinho/Vinho/Preto/Vermelho",
            "Marrom/Preto/Vermelho/Vinho/Azul Marinho",
        ],
    },

    "Body Gola Quadrada": {
        "Kit 1": [
            "Azul Marinho", "Marrom", "Preto", "Cinza",
        ],
        "Kit 2": [
            "Marrom/Marrom", "Preto/Cinza", "Marrom/Preto", "Cinza/Cinza",
            "Marrom/Azul Marinho", "Marrom/Cinza", "Cinza/Azul Marinho",
            "Preto/Azul Marinho", "Azul Marinho/Azul Marinho", "Preto/Preto",
        ],
        "Kit 3": [
            "Cinza/Preto/Marrom", "Azul Marinho/Marrom/Preto",
            "Azul Marinho/Cinza/Preto", "Azul Marinho/Cinza/Marrom",
        ],
        "Kit 4": [
            "Azul Marinho/Marrom/Preto/Cinza",
        ],
    },

    "Body Manga Curta": {
        "Kit 1": [
            "Vinho", "Marrom", "Azul Marinho", "Branco", "Preto", "Cinza",
        ],
        "Kit 2": [
            "Branco/Marrom", "Azul Marinho/Cinza", "Azul Marinho/Preto",
            "Branco/Azul Marinho", "Preto/Preto", "Vinho/Preto", "Preto/Cinza",
            "Marrom/Marrom", "Marrom/Cinza", "Cinza/Cinza", "Branco/Preto",
            "Marrom/Azul Marinho", "Branco/Cinza",
        ],
        "Kit 3": [
            "Marrom/Azul Marinho/Preto", "Preto/Cinza/Marrom", "Preto/Azul Marinho/Cinza",
            "Marrom/Azul Marinho/Cinza", "Branco/Preto/Cinza", "Branco/Marrom/Preto",
            "Branco/Marrom/Azul Marinho", "Branco/Azul Marinho/Preto",
            "Branco/Marrom/Cinza", "Marrom/Azul Marinho/Cinza", 
        ],
        "Kit 4": [
            "Branco/Marrom/Azul Marinho/Preto", "Cinza/Marrom/Azul Marinho/Preto",
            "Cinza/Branco/Preto/Azul Marinho", "Cinza/Branco/Marrom/Preto",
            "Cinza/Branco/Marrom/Azul Marinho",
        ],
        "Kit 5":[
            "Cinza/Preto/Azul Marinho/Marrom/Branco"
        ],
    },

    "Body Regata": {
        "Kit 1": [
            "Marrom", "Branco", "Preto", "Cinza", "Azul Marinho",
        ],
        "Kit 2": [
            "Preto/Branco", "Azul Marinho/Preto", "Cinza/Branco", "Cinza/Marrom",
            "Cinza/Azul Marinho", "Branco/Marrom", "Branco/Azul Marinho",
            "Marrom/Azul Marinho", "Preto/Marrom", "Preto/Cinza",
        ],
    },

    "Blusinha Costa Nua": {
        "Kit 1": [
            "Vermelho", "Azul Bebê", "Marrom", "Verde", "Preto",
        ],
    },

    "Cropped Manga Longa": {
        "Kit 1": [
            "Preto", "Marrom",
        ],
        "Kit 2": [
            "Preto/Marrom",
        ],
    },

    "Body Gola Alta": {
        "Kit 1": [
            "Preto", "Bege", "Marrom", "Cinza",
        ],
        "Kit 2": [
            "Bege/Bege", "Bege/Preto", "Bege/Cinza",
            "Marrom/Cinza", "Preto/Cinza", "Marrom/Preto",
        ],
        "Kit 3": [
            "Bege/Marrom/Preto", "Preto/Cinza/Bege",
            "Marrom/Cinza/Bege", "Preto/Cinza/Marrom",
        ],
        "Kit 4": [
            "Bege/Marrom/Preto/Cinza",
        ],
    },

    "Mula Manca": {
        "Kit 1": [
            "Preto", "Vermelho", "Azul Bebê", "Rosa", "Branco",
        ],
        "Kit 2": [
            "Preto/Vermelho", "Preto/Azul Bebê", "Preto/Rosa", "Marrom/Branco",
            "Marrom/Vermelho", "Marrom/Azul Bebê", "Marrom/Rosa", "Branco/Vermelho",
            "Branco/Azul Bebê", "Branco/Rosa", "Vermelho/Azul Bebê", "Vermelho/Rosa",
            "Azul/Bebê", "Preto/Branco", "Preto/Marrom",
        ],
    },

    "Top Academia": {
        "Kit 1": [
            "Marrom", "Cinza", "Branco", "Azul Marinho", "Lilás", "Preto",
            "Amarelo", "Bege", "Azul Bebê", "Vermelho", "Vinho",
        ],
    },

    "Top Faixa": {
        "Kit 1": [
            "Preto", "Azul Marinho", "Marrom", "Branco", "Cinza",
        ],
        "Kit 2": [
            "Azul Marinho/Cinza", "Marrom/Cinza", "Branco/Cinza", "Branco/Marrom",
            "Marrom/Azul Marinho", "Preto/Azul Marinho", "Branco/Azul Marinho",
            "Branco/Preto", "Marrom/Preto",
        ],
        "Kit 3": [
            "Preto/Cinza/Marrom", "Branco/Marrom/Preto", "Branco/Marrom/Azul Marinho",
            "Marrom/Azul Marinho/Preto", "Marrom/Azul Marinho/Cinza",
            "Branco/Marrom/Cinza", "Branco/Azul Marinho/Preto", "Branco/Preto/Cinza",
        ],
        "Kit 4": [
            "Branco/Preto/Azul Marinho/Cinza/Marrom",
        ],
    },

    "Blusinha T-Shirt": {
        "Kit 1": [
            "Vinho", "Azul Marinho", "Marrom", "Verde", "Preto",
        ],
        "Kit 5": [
            "Vinho/Azul Marinho/Marrom/Verde/Preto",
        ],
    },
}

# Tipos de erro disponíveis no formulário — edite se precisar adicionar algum
TIPOS_ERRO = [
    "Erro de cor",
    "Erro de modelo",
    "Erro de Modelo e Cor"
    "Produto faltando",
    "Produto Danificado",
]
