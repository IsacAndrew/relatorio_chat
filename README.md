# Controle de Erros de Pedidos

Sistema web interno para registrar, organizar e analisar erros de pedidos em lojas online (Shopee, Shein, TikTok Shop).

---

## ⚙️ Stack

| Componente | Tecnologia |
|---|---|
| Backend | Python / Flask |
| Banco de dados | SQLite (local) / PostgreSQL (produção) |
| Tempo real | Flask-SocketIO + gevent |
| Imagens | Cloudinary |
| Frontend | HTML + CSS + JS vanilla |
| Gráficos | Chart.js |
| Deploy | Render + GitHub |

---

## 🚀 Setup Local

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/erros-pedidos.git
cd erros-pedidos
```

### 2. Crie e ative um ambiente virtual
```bash
python -m venv venv
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 3. Instale as dependências
```bash
pip install -r requirements.txt
```

### 4. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com suas credenciais do Cloudinary e uma SECRET_KEY
```

### 5. Inicie o servidor
```bash
python app.py
```

Acesse: **http://localhost:5000**

### Usuários padrão
| Usuário | Senha |
|---|---|
| admin | admin123 |
| usuario | usuario123 |

> ⚠️ **Troque as senhas antes de subir para produção.** Para criar novos usuários ou alterar senhas, acesse o banco via SQLite (`erros_pedidos.db`) ou crie um endpoint temporário.

---

## 🌐 Deploy no Render

### Pré-requisitos
1. Conta no [Render](https://render.com)
2. Conta no [Cloudinary](https://cloudinary.com) (gratuita)
3. Repositório no GitHub

### Passo a passo

1. **Crie um Web Service** no Render apontando para seu repositório GitHub.

2. **Configurações do serviço:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn -k geventwebsocket.gunicorn.workers.GeventWebSocketWorker -w 1 --timeout 120 app:app`
   - **Python Version:** 3.11

3. **Adicione um banco PostgreSQL** no Render (aba "New → PostgreSQL") e copie a `Internal Database URL`.

4. **Defina as variáveis de ambiente** no Render:
   ```
   SECRET_KEY              = (string aleatória longa)
   DATABASE_URL            = (URL do PostgreSQL do Render)
   CLOUDINARY_CLOUD_NAME   = (seu cloud name)
   CLOUDINARY_API_KEY      = (sua API key)
   CLOUDINARY_API_SECRET   = (seu API secret)
   SOCKETIO_ASYNC_MODE     = gevent
   ```

5. **Deploy automático** a cada push na branch `main`.

> **Nota sobre inatividade:** O plano gratuito do Render coloca o serviço para dormir após 15 minutos. Para evitar isso, use o [UptimeRobot](https://uptimerobot.com) para fazer ping no seu domínio a cada 5 minutos.

---

## 📁 Estrutura de Pastas

```
erros_pedidos/
├── app.py              ← Ponto de entrada (factory)
├── config.py           ← Configurações centralizadas
├── catalogo.py         ← Modelos e cores (EDITE AQUI)
├── models.py           ← Modelos do banco de dados
├── extensions.py       ← Extensões Flask
├── requirements.txt
├── Procfile            ← Para o Render/Heroku
├── runtime.txt         ← Versão do Python
├── .env.example
├── routes/
│   ├── auth.py         ← Login / Logout
│   ├── occurrences.py  ← CRUD de ocorrências
│   ├── dashboard.py    ← Dashboard e API de gráficos
│   └── history.py      ← Histórico de auditoria
├── templates/
│   ├── base.html
│   ├── login.html
│   ├── dashboard.html
│   ├── occurrences.html
│   ├── new_occurrence.html
│   ├── edit_occurrence.html
│   └── history.html
└── static/
    ├── css/style.css
    └── js/
        ├── main.js         ← Socket.IO + utilitários
        ├── login.js
        ├── dashboard.js    ← Chart.js
        ├── occurrences.js  ← Listagem + formulários
        └── history.js      ← Histórico
```

---

## ✏️ Editando o Catálogo de Modelos e Cores

Abra `catalogo.py` e edite o dicionário `CATALOGO`:

```python
CATALOGO = {
    "Nome do Modelo": ["Cor 1", "Cor 2", "Cor 3"],
    "Outro Modelo":   ["Preta", "Branca", "Rosa"],
}
```

Nenhuma migração de banco necessária — o catálogo é fixo no código.

---

## 🔌 Eventos Socket.IO

| Evento | Direção | Payload |
|---|---|---|
| `nova_ocorrencia` | Server → Clients | Objeto da ocorrência |
| `ocorrencia_editada` | Server → Clients | Objeto da ocorrência |
| `ocorrencia_deletada` | Server → Clients | `{"id": <int>}` |

---

## 📝 Notas

- Exclusão é **lógica** (campo `deletado_em`) — os dados permanecem no banco para auditoria.
- O histórico registra automaticamente criação, edição e exclusão com os campos alterados.
- Imagens são armazenadas no Cloudinary. Se não configurado, o upload falhará silenciosamente e a ocorrência será salva sem print.
