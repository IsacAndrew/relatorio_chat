/**
 * occurrences.js
 * ──────────────────────────────────────────────────────────────
 * Lógica das telas de ocorrências:
 *  - Listagem: filtros locais (texto, tipo, modelo, data) + tempo real
 *  - Formulário de criação: múltiplas cores (até 6), preview de imagem,
 *    confirmação sem print
 *  - Formulário de edição: mesmas funcionalidades
 *  - Exclusão via AJAX com modal de confirmação
 */

// ═════════════════════════════════════════════════════════════
// MÓDULO DA LISTAGEM (occurrences.html)
// ═════════════════════════════════════════════════════════════
const occurrencesApp = (() => {

  let _idParaDeletar = null;

  // ── Inicialização ──────────────────────────────────────────

  function init() {
    const tbody = document.getElementById("tbody-ocorrencias");
    if (!tbody) return;

    socket.on("nova_ocorrencia", (oc) => {
      _adicionarLinha(oc);
      _atualizarContador(1);
      mostrarToast(`Nova ocorrência: ${oc.modelo} — ${oc.cor}`, "success");
    });

    socket.on("ocorrencia_editada", (oc) => {
      _atualizarLinha(oc);
      mostrarToast(`Ocorrência #${oc.id} atualizada.`, "info");
    });

    socket.on("ocorrencia_deletada", ({ id }) => {
      _removerLinha(id);
      _atualizarContador(-1);
      mostrarToast(`Ocorrência #${id} excluída.`, "info");
    });
  }

  // ── Filtro local na tabela (texto + tipo + modelo + data) ──

  function filtrarTabela() {
    const busca        = document.getElementById("filtro-busca")?.value.toLowerCase() || "";
    const tipoFiltro   = document.getElementById("filtro-tipo-erro")?.value || "";
    const modeloFiltro = document.getElementById("filtro-modelo")?.value || "";
    const dataInicio   = document.getElementById("filtro-data-inicio")?.value || "";
    const dataFim      = document.getElementById("filtro-data-fim")?.value || "";

    const linhas = document.querySelectorAll(".tr-ocorrencia");
    let visiveis = 0;

    linhas.forEach((tr) => {
      const modelo  = tr.dataset.modelo?.toLowerCase()  || "";
      const cor     = tr.dataset.cor?.toLowerCase()     || "";
      const tipo    = tr.dataset.tipo   || "";
      const cliente = tr.dataset.cliente?.toLowerCase() || "";
      const dataOc  = tr.dataset.data   || "";  // formato YYYY-MM-DD

      const matchBusca  = !busca || modelo.includes(busca) || cor.includes(busca) || cliente.includes(busca);
      const matchTipo   = !tipoFiltro   || tipo === tipoFiltro;
      const matchModelo = !modeloFiltro || tr.dataset.modelo === modeloFiltro;
      const matchDataI  = !dataInicio   || dataOc >= dataInicio;
      const matchDataF  = !dataFim      || dataOc <= dataFim;

      const visivel = matchBusca && matchTipo && matchModelo && matchDataI && matchDataF;
      tr.style.display = visivel ? "" : "none";
      if (visivel) visiveis++;
    });

    // Linha "sem resultado"
    let trSemResultado = document.getElementById("tr-sem-resultado");
    if (visiveis === 0) {
      if (!trSemResultado) {
        trSemResultado = document.createElement("tr");
        trSemResultado.id = "tr-sem-resultado";
        trSemResultado.innerHTML = `
          <td colspan="9" class="td-empty">
            <div class="empty-state-inline">
              <i class="fa-solid fa-filter-circle-xmark"></i>
              <span>Nenhuma ocorrência encontrada para este filtro.</span>
            </div>
          </td>`;
        document.getElementById("tbody-ocorrencias")?.appendChild(trSemResultado);
      }
    } else {
      trSemResultado?.remove();
    }
  }

  function limparFiltros() {
    ["filtro-busca", "filtro-tipo-erro", "filtro-modelo",
     "filtro-data-inicio", "filtro-data-fim"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    filtrarTabela();
  }

  // ── Confirmação de exclusão ────────────────────────────────

  function confirmarExclusao(id, descricao) {
    _idParaDeletar = id;
    const msg = document.getElementById("modal-delete-msg");
    if (msg) msg.textContent = `Excluir "${descricao}"? Esta ação não pode ser desfeita.`;

    const btnConfirmar = document.getElementById("btn-confirmar-delete");
    if (btnConfirmar) btnConfirmar.onclick = () => _executarExclusao(id);

    document.getElementById("modal-delete").style.display = "flex";
  }

  function fecharModal() {
    document.getElementById("modal-delete").style.display = "none";
    _idParaDeletar = null;
  }

  async function _executarExclusao(id) {
    fecharModal();
    try {
      await apiFetch(`/api/ocorrencias/${id}/deletar`, { method: "DELETE" });
    } catch (err) {
      console.error("[Exclusão] Erro:", err);
      mostrarToast("Erro ao excluir a ocorrência. Tente novamente.", "error");
    }
  }

  // ── Manipulação da tabela (tempo real) ────────────────────

  function _adicionarLinha(oc) {
    const tbody = document.getElementById("tbody-ocorrencias");
    if (!tbody) return;

    document.getElementById("tr-empty")?.remove();

    const tipoCss = oc.tipo_erro.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");

    // Modelo com link (se tiver)
    const modeloHtml = oc.link_conversa
      ? `<a href="${oc.link_conversa}" target="_blank" class="modelo-link" title="Abrir conversa">
           ${oc.modelo} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem;"></i>
         </a>`
      : oc.modelo;

    // Data DD/MM/YYYY → YYYY-MM-DD para data-data
    const dataISO = oc.data_ocorrido.split("/").reverse().join("-");

    const tr = document.createElement("tr");
    tr.className = "tr-ocorrencia tr-new-flash";
    tr.dataset.id      = oc.id;
    tr.dataset.modelo  = oc.modelo;
    tr.dataset.cor     = oc.cor;
    tr.dataset.tipo    = oc.tipo_erro;
    tr.dataset.cliente = oc.nome_cliente || "";
    tr.dataset.data    = dataISO;

    tr.innerHTML = `
      <td class="td-id">#${oc.id}</td>
      <td class="td-modelo">${modeloHtml}</td>
      <td><span class="badge-cor">${oc.cor}</span></td>
      <td><span class="badge-tipo badge-tipo-${tipoCss}">${oc.tipo_erro}</span></td>
      <td class="td-data">${oc.data_ocorrido}<br/><small>${oc.hora_ocorrido}</small></td>
      <td>${oc.nome_cliente || "—"}</td>
      <td class="td-print">
        ${oc.print_url
          ? `<a href="${oc.print_url}" target="_blank" class="btn-print-link" title="Ver print"><i class="fa-solid fa-image"></i></a>`
          : `<span class="no-print">—</span>`}
      </td>
      <td><span class="badge-user">${oc.criado_por}</span></td>
      <td class="td-actions">
        <a href="/ocorrencias/${oc.id}/editar" class="btn-icon btn-edit" title="Editar">
          <i class="fa-solid fa-pen-to-square"></i>
        </a>
        <button class="btn-icon btn-delete"
          onclick="occurrencesApp.confirmarExclusao(${oc.id}, '${oc.modelo} — ${oc.cor}')"
          title="Excluir">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>`;

    tbody.insertBefore(tr, tbody.firstChild);
  }

  function _atualizarLinha(oc) {
    const tr = document.querySelector(`[data-id="${oc.id}"]`);
    if (!tr) return;

    tr.dataset.modelo  = oc.modelo;
    tr.dataset.cor     = oc.cor;
    tr.dataset.tipo    = oc.tipo_erro;
    tr.dataset.cliente = oc.nome_cliente || "";

    const tipoCss = oc.tipo_erro.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");
    const modeloHtml = oc.link_conversa
      ? `<a href="${oc.link_conversa}" target="_blank" class="modelo-link">${oc.modelo} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem;"></i></a>`
      : oc.modelo;

    tr.querySelector(".td-modelo").innerHTML = modeloHtml;
    tr.querySelector(".badge-cor").textContent = oc.cor;
    tr.querySelector(".badge-tipo").textContent = oc.tipo_erro;
    tr.querySelector(".badge-tipo").className   = `badge-tipo badge-tipo-${tipoCss}`;
    tr.querySelector(".td-data").innerHTML = `${oc.data_ocorrido}<br/><small>${oc.hora_ocorrido}</small>`;

    tr.classList.remove("tr-new-flash");
    void tr.offsetWidth;
    tr.classList.add("tr-new-flash");
  }

  function _removerLinha(id) {
    const tr = document.querySelector(`[data-id="${id}"]`);
    if (!tr) return;
    tr.classList.add("tr-remove");
    setTimeout(() => tr.remove(), 400);
  }

  function _atualizarContador(delta) {
    const el = document.getElementById("count-label");
    if (!el) return;
    el.textContent = Math.max(0, parseInt(el.textContent || "0") + delta);
  }

  return { init, filtrarTabela, limparFiltros, confirmarExclusao, fecharModal };
})();


// ═════════════════════════════════════════════════════════════
// MÓDULO DE MÚLTIPLAS CORES
// Compartilhado entre nova ocorrência e edição
// ═════════════════════════════════════════════════════════════
const coresApp = (() => {

  const MAX_CORES = 6;
  let _contador = 0;   // índice incremental para IDs únicos das linhas
  let _total    = 0;   // quantidade atual de linhas de cor visíveis

  /** Retorna as cores disponíveis do modelo atualmente selecionado. */
  function _getCoresDoModelo() {
    const modelo = document.getElementById("modelo")?.value;
    return (window.CATALOGO || {})[modelo] || [];
  }

  /** Adiciona uma linha de seleção de cor ao container. */
  function adicionar(valorInicial = "") {
    if (_total >= MAX_CORES) return;

    const container = document.getElementById("cores-container");
    if (!container) return;

    const idx = _contador++;
    _total++;

    const row = document.createElement("div");
    row.className = "cor-row";
    row.id = `cor-row-${idx}`;

    // Número ordinal
    const num = document.createElement("span");
    num.className = "cor-num";
    num.textContent = _total;
    row.appendChild(num);

    // Select de cores
    const cores = _getCoresDoModelo();
    const select = document.createElement("select");
    select.name = "cor[]";
    select.className = "cor-select";
    select.required = true;

    const optVazio = new Option("— Selecione a cor —", "");
    select.appendChild(optVazio);

    cores.forEach(cor => {
      const opt = new Option(cor, cor);
      if (cor === valorInicial) opt.selected = true;
      select.appendChild(opt);
    });

    select.disabled = cores.length === 0;
    row.appendChild(select);

    // Botão remover
    const btnRem = document.createElement("button");
    btnRem.type = "button";
    btnRem.className = "btn-remove-cor";
    btnRem.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    btnRem.onclick = () => remover(idx);
    row.appendChild(btnRem);

    container.appendChild(row);
    _atualizarBotoes();
  }

  /** Remove uma linha de cor pelo seu idx. */
  function remover(idx) {
    const row = document.getElementById(`cor-row-${idx}`);
    if (!row) return;
    row.remove();
    _total--;
    _renumerarLinhas();
    _atualizarBotoes();
  }

  /** Renumera os círculos ordinais após remoção. */
  function _renumerarLinhas() {
    document.querySelectorAll(".cor-row").forEach((row, i) => {
      const num = row.querySelector(".cor-num");
      if (num) num.textContent = i + 1;
    });
  }

  /** Repovoar todos os selects com cores do novo modelo. */
  function repovoarSelects() {
    const cores = _getCoresDoModelo();

    document.querySelectorAll(".cor-select").forEach(select => {
      const valorAtual = select.value;
      select.innerHTML = "";
      select.appendChild(new Option("— Selecione a cor —", ""));

      cores.forEach(cor => {
        const opt = new Option(cor, cor);
        if (cor === valorAtual) opt.selected = true;
        select.appendChild(opt);
      });

      select.disabled = cores.length === 0;
    });
  }

  /** Atualiza visibilidade dos botões remover e do botão adicionar. */
  function _atualizarBotoes() {
    const rows = document.querySelectorAll(".cor-row");

    // Oculta o botão remover quando só há 1 linha
    rows.forEach(row => {
      const btn = row.querySelector(".btn-remove-cor");
      if (btn) btn.style.display = rows.length > 1 ? "flex" : "none";
    });

    const btnAdd = document.getElementById("btn-add-cor");
    const hint   = document.getElementById("cores-hint");

    if (btnAdd) btnAdd.disabled = _total >= MAX_CORES;
    if (hint)   hint.style.display = _total >= MAX_CORES ? "block" : "none";
  }

  /** Inicializa o container com uma lista de cores (vazia ou existentes). */
  function inicializar(coresIniciais = [""]) {
    _contador = 0;
    _total    = 0;
    const container = document.getElementById("cores-container");
    if (container) container.innerHTML = "";

    const lista = coresIniciais.length > 0 ? coresIniciais : [""];
    lista.forEach(cor => adicionar(cor.trim()));
  }

  return { adicionar, remover, repovoarSelects, inicializar, _atualizarBotoes };
})();


// ═════════════════════════════════════════════════════════════
// MÓDULO DO FORMULÁRIO DE NOVA OCORRÊNCIA
// ═════════════════════════════════════════════════════════════
const novaOcorrenciaApp = (() => {

  let _printSelecionado = false;
  let _confirmarEnvio   = false;

  function init() {
    const form = document.getElementById("form-nova");
    if (!form) return;

    form.addEventListener("submit", _interceptarEnvio);

    // Inicia com 1 linha de cor vazia
    coresApp.inicializar([""]);

    // Se o modelo já tem valor (ex: reload após erro de validação)
    const modeloSelect = document.getElementById("modelo");
    if (modeloSelect?.value) atualizarCores();
  }

  /** Chamado quando o select de modelo muda. */
  function atualizarCores() {
    const modeloSelect = document.getElementById("modelo");
    const modelo       = modeloSelect?.value || "";
    const catalogo     = window.CATALOGO || {};
    const cores        = catalogo[modelo] || [];

    // Repovoar TODOS os selects de cor existentes no container
    document.querySelectorAll(".cor-select").forEach(select => {
      const valorAtual = select.value;
      select.innerHTML = "";

      const optVazio = document.createElement("option");
      optVazio.value = "";
      optVazio.textContent = "— Selecione a cor —";
      select.appendChild(optVazio);

      cores.forEach(cor => {
        const opt = document.createElement("option");
        opt.value = cor;
        opt.textContent = cor;
        if (cor === valorAtual) opt.selected = true;
        select.appendChild(opt);
      });

      // Habilita se houver modelo selecionado com cores
      select.disabled = (cores.length === 0);
    });

    // Mostra botão "adicionar cor" apenas após modelo ser escolhido
    const btnAdd = document.getElementById("btn-add-cor");
    if (btnAdd) btnAdd.style.display = modelo ? "" : "none";

    coresApp._atualizarBotoes();
  }

  function adicionarCor() { coresApp.adicionar(); }

  // ── Preview de imagem ──────────────────────────────────────

  function previewImagem(input) {
    const arquivo = input.files[0];
    if (!arquivo) return;
    _printSelecionado = true;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById("preview-img").src = e.target.result;
      document.getElementById("preview-container").style.display = "flex";
      document.getElementById("upload-area").style.display = "none";
    };
    reader.readAsDataURL(arquivo);
  }

  function removerImagem() {
    _printSelecionado = false;
    document.getElementById("print_conversa").value = "";
    document.getElementById("preview-container").style.display = "none";
    document.getElementById("upload-area").style.display = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    const arquivos = event.dataTransfer.files;
    if (arquivos.length > 0) {
      const input = document.getElementById("print_conversa");
      input.files = arquivos;
      previewImagem(input);
    }
  }

  // ── Intercepta envio para avisar sobre print ausente ──────

  function _interceptarEnvio(e) {
    if (_confirmarEnvio)   return;  // já confirmado
    if (_printSelecionado) return;  // tem print, ok
    e.preventDefault();
    document.getElementById("modal-sem-print").style.display = "flex";
  }

  function cancelarSemPrint() {
    document.getElementById("modal-sem-print").style.display = "none";
    _confirmarEnvio = false;
  }

  function confirmarSemPrint() {
    document.getElementById("modal-sem-print").style.display = "none";
    _confirmarEnvio = true;
    document.getElementById("form-nova")?.submit();
  }

  return { init, atualizarCores, adicionarCor, previewImagem, removerImagem,
           handleDrop, cancelarSemPrint, confirmarSemPrint };
})();


// ═════════════════════════════════════════════════════════════
// MÓDULO DO FORMULÁRIO DE EDIÇÃO
// ═════════════════════════════════════════════════════════════
const editarApp = (() => {

  function init() {
    if (!document.getElementById("form-editar")) return;

    // Cores existentes: "Preto, Branco" → ["Preto", "Branco"]
    const coresIniciais = window.CORES_ATUAIS || [""];
    coresApp.inicializar(coresIniciais);
  }

  function atualizarCores() {
    const modeloSelect = document.getElementById("modelo");
    const modelo       = modeloSelect?.value || "";
    const catalogo     = window.CATALOGO || {};
    const cores        = catalogo[modelo] || [];

    document.querySelectorAll(".cor-select").forEach(select => {
      const valorAtual = select.value;
      select.innerHTML = "";

      const optVazio = document.createElement("option");
      optVazio.value = "";
      optVazio.textContent = "— Selecione a cor —";
      select.appendChild(optVazio);

      cores.forEach(cor => {
        const opt = document.createElement("option");
        opt.value = cor;
        opt.textContent = cor;
        if (cor === valorAtual) opt.selected = true;
        select.appendChild(opt);
      });

      select.disabled = (cores.length === 0);
    });

    coresApp._atualizarBotoes();
  }

  function adicionarCor()          { coresApp.adicionar(); }
  function previewImagem(input)    { novaOcorrenciaApp.previewImagem(input); }
  function removerImagem()         { novaOcorrenciaApp.removerImagem(); }
  function handleDrop(e)           { novaOcorrenciaApp.handleDrop(e); }

  return { init, atualizarCores, adicionarCor, previewImagem, removerImagem, handleDrop };
})();


// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO — detecta qual tela está ativa
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tbody-ocorrencias")) occurrencesApp.init();
  if (document.getElementById("form-nova"))         novaOcorrenciaApp.init();
  if (document.getElementById("form-editar"))       editarApp.init();

  // Fecha modais clicando no overlay
  document.getElementById("modal-delete")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-delete") occurrencesApp.fecharModal();
  });
  document.getElementById("modal-sem-print")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-sem-print") novaOcorrenciaApp.cancelarSemPrint();
  });
});
