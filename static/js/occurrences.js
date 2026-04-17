/**
 * occurrences.js
 * ──────────────────────────────────────────────────────────────
 * Lógica das telas de ocorrências:
 *  - Listagem: filtros locais + tempo real via Socket.IO
 *  - Formulário de criação: cascata Modelo → Kit → Combinação de cor
 *  - Formulário de edição: mesma lógica, pré-seleciona dados existentes
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

    // Escuta eventos do Socket.IO pra atualizar a lista em tempo real
    socket.on("nova_ocorrencia",    (oc)      => { _adicionarLinha(oc); _atualizarContador(1); mostrarToast(`Nova ocorrência: ${oc.modelo} — ${oc.cor}`, "success"); });
    socket.on("ocorrencia_editada", (oc)      => { _atualizarLinha(oc); mostrarToast(`Ocorrência #${oc.id} atualizada.`, "info"); });
    socket.on("ocorrencia_deletada",({ id }) => { _removerLinha(id);  _atualizarContador(-1); mostrarToast(`Ocorrência #${id} excluída.`, "info"); });
  }

  // ── Filtro local (texto + tipo + modelo + data) ────────────

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
      const dataOc  = tr.dataset.data   || "";

      const matchBusca  = !busca        || modelo.includes(busca) || cor.includes(busca) || cliente.includes(busca);
      const matchTipo   = !tipoFiltro   || tipo === tipoFiltro;
      const matchModelo = !modeloFiltro || tr.dataset.modelo === modeloFiltro;
      const matchDataI  = !dataInicio   || dataOc >= dataInicio;
      const matchDataF  = !dataFim      || dataOc <= dataFim;

      const visivel = matchBusca && matchTipo && matchModelo && matchDataI && matchDataF;
      tr.style.display = visivel ? "" : "none";
      if (visivel) visiveis++;
    });

    // Exibe linha de "sem resultado" se nenhuma linha passar no filtro
    let trVazia = document.getElementById("tr-sem-resultado");
    if (visiveis === 0) {
      if (!trVazia) {
        trVazia = document.createElement("tr");
        trVazia.id = "tr-sem-resultado";
        trVazia.innerHTML = `
          <td colspan="9" class="td-empty">
            <div class="empty-state-inline">
              <i class="fa-solid fa-filter-circle-xmark"></i>
              <span>Nenhuma ocorrência encontrada para este filtro.</span>
            </div>
          </td>`;
        document.getElementById("tbody-ocorrencias")?.appendChild(trVazia);
      }
    } else {
      trVazia?.remove();
    }
  }

  function limparFiltros() {
    ["filtro-busca","filtro-tipo-erro","filtro-modelo",
     "filtro-data-inicio","filtro-data-fim"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    filtrarTabela();
  }

  // ── Modal de confirmação de exclusão ──────────────────────

  function confirmarExclusao(id, descricao) {
    _idParaDeletar = id;
    const msg = document.getElementById("modal-delete-msg");
    if (msg) msg.textContent = `Excluir "${descricao}"? Esta ação não pode ser desfeita.`;
    document.getElementById("btn-confirmar-delete").onclick = () => _executarExclusao(id);
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

  // ── Manipulação da tabela em tempo real ───────────────────

  function _adicionarLinha(oc) {
    const tbody = document.getElementById("tbody-ocorrencias");
    if (!tbody) return;

    document.getElementById("tr-empty")?.remove();

    const tipoCss = oc.tipo_erro.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");

    // Modelo vira link se tiver link da conversa
    const modeloHtml = oc.link_conversa
      ? `<a href="${oc.link_conversa}" target="_blank" class="modelo-link" title="Abrir conversa">
           ${oc.modelo} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem;"></i>
         </a>`
      : oc.modelo;

    // A data vem como DD/MM/YYYY e preciso no formato YYYY-MM-DD pro dataset
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
    tr.querySelector(".badge-cor").textContent  = oc.cor;
    tr.querySelector(".badge-tipo").textContent = oc.tipo_erro;
    tr.querySelector(".badge-tipo").className   = `badge-tipo badge-tipo-${tipoCss}`;
    tr.querySelector(".td-data").innerHTML = `${oc.data_ocorrido}<br/><small>${oc.hora_ocorrido}</small>`;

    // Animação de flash pra indicar que a linha mudou
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
// MÓDULO DE KITS + CORES
// Cascata: Modelo → Kit → Combinação de cor
// Compartilhado entre nova ocorrência e edição
// ═════════════════════════════════════════════════════════════
const coresApp = (() => {

  const MAX_CORES = 6;
  let _contador = 0;  // índice incremental pra IDs únicos das linhas
  let _total    = 0;  // quantidade atual de linhas visíveis

  // Pega o modelo que tá selecionado no momento
  function _getModelo() {
    return document.getElementById("modelo")?.value || "";
  }

  // Retorna o objeto { "Kit 1": [...], "Kit 2": [...] } do modelo
  function _getKitsDoModelo(modelo) {
    return (window.CATALOGO || {})[modelo] || {};
  }

  // Dado um modelo e uma cor armazenada, descobre qual kit ela pertence
  // Útil na edição pra pré-selecionar o kit correto
  function _getKitDaCor(modelo, cor) {
    const kits = _getKitsDoModelo(modelo);
    for (const [kit, cores] of Object.entries(kits)) {
      if (cores.includes(cor)) return kit;
    }
    return null;
  }

  // Preenche as opções do select de kit com base no modelo
  function _preencherKitSelect(kitSelect, modelo, kitSelecionado) {
    const kits = _getKitsDoModelo(modelo);
    const nomes = Object.keys(kits);

    kitSelect.innerHTML = "";

    if (!modelo || nomes.length === 0) {
      kitSelect.appendChild(new Option("— Kit —", ""));
      kitSelect.disabled = true;
      return;
    }

    // Placeholder só aparece se tiver mais de 1 kit pra escolher
    if (nomes.length > 1) {
      kitSelect.appendChild(new Option("— Kit —", ""));
    }

    nomes.forEach(kit => {
      const opt = new Option(kit, kit);
      if (kit === kitSelecionado) opt.selected = true;
      kitSelect.appendChild(opt);
    });

    kitSelect.disabled = false;

    // Auto-seleciona se só existe 1 kit — menos clique pra usuária
    if (nomes.length === 1 && !kitSelecionado) {
      kitSelect.value = nomes[0];
    }
  }

  // Preenche as opções do select de cor com base no kit escolhido
  function _preencherCorSelect(corSelect, modelo, kit, corSelecionada) {
    const kits = _getKitsDoModelo(modelo);
    const cores = (kit && kits[kit]) ? kits[kit] : [];

    corSelect.innerHTML = "";

    if (cores.length === 0) {
      corSelect.appendChild(new Option(kit ? "— Selecione a combinação —" : "— Selecione o kit primeiro —", ""));
      corSelect.disabled = true;
      return;
    }

    corSelect.appendChild(new Option("— Selecione a combinação —", ""));
    cores.forEach(cor => {
      const opt = new Option(cor, cor);
      if (cor === corSelecionada) opt.selected = true;
      corSelect.appendChild(opt);
    });
    corSelect.disabled = false;
  }

  // Adiciona uma linha de cor (kit-select + cor-select) no container
  function adicionar(kitInicial = "", valorInicial = "") {
    if (_total >= MAX_CORES) return;

    const container = document.getElementById("cores-container");
    if (!container) return;

    const idx    = _contador++;
    const modelo = _getModelo();
    _total++;

    const row = document.createElement("div");
    row.className = "cor-row";
    row.id = `cor-row-${idx}`;

    // Numeração ordinal da linha
    const num = document.createElement("span");
    num.className = "cor-num";
    num.textContent = _total;
    row.appendChild(num);

    // Select do kit
    const kitSelect = document.createElement("select");
    kitSelect.className = "kit-select";
    _preencherKitSelect(kitSelect, modelo, kitInicial);

    // Quando mudar o kit, recarrego as cores daquele kit
    kitSelect.addEventListener("change", () => {
      _preencherCorSelect(corSelect, _getModelo(), kitSelect.value, "");
      _atualizarBotoes();
    });
    row.appendChild(kitSelect);

    // Select da combinação de cor — esse é o que vai pro backend
    const corSelect = document.createElement("select");
    corSelect.name      = "cor[]";
    corSelect.className = "cor-select";
    corSelect.required  = true;
    _preencherCorSelect(corSelect, modelo, kitSelect.value, valorInicial);
    row.appendChild(corSelect);

    // Botão de remover a linha
    const btnRem = document.createElement("button");
    btnRem.type      = "button";
    btnRem.className = "btn-remove-cor";
    btnRem.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    btnRem.onclick   = () => remover(idx);
    row.appendChild(btnRem);

    container.appendChild(row);
    _atualizarBotoes();
  }

  // Remove a linha pelo seu índice
  function remover(idx) {
    const row = document.getElementById(`cor-row-${idx}`);
    if (!row) return;
    row.remove();
    _total--;
    _renumerarLinhas();
    _atualizarBotoes();
  }

  // Renumera os círculos após uma remoção pra não ter buraco na numeração
  function _renumerarLinhas() {
    document.querySelectorAll(".cor-row").forEach((row, i) => {
      const num = row.querySelector(".cor-num");
      if (num) num.textContent = i + 1;
    });
  }

  // Quando o modelo muda: limpa tudo e recomeça com 1 linha em branco
  function repovoarSelects() {
    _contador = 0;
    _total    = 0;
    const container = document.getElementById("cores-container");
    if (container) container.innerHTML = "";
    adicionar();
  }

  // Controla visibilidade do botão remover e do hint de máximo
  function _atualizarBotoes() {
    const rows = document.querySelectorAll(".cor-row");

    // O botão remover só aparece quando tem mais de 1 linha
    rows.forEach(row => {
      const btn = row.querySelector(".btn-remove-cor");
      if (btn) btn.style.display = rows.length > 1 ? "flex" : "none";
    });

    const btnAdd = document.getElementById("btn-add-cor");
    const hint   = document.getElementById("cores-hint");
    if (btnAdd) btnAdd.disabled = _total >= MAX_CORES;
    if (hint)   hint.style.display = _total >= MAX_CORES ? "block" : "none";
  }

  // Inicializa com uma lista de cores existentes (edição) ou 1 linha vazia (criação)
  function inicializar(coresIniciais = [""]) {
    _contador = 0;
    _total    = 0;
    const container = document.getElementById("cores-container");
    if (container) container.innerHTML = "";

    const modelo = _getModelo();
    const lista  = coresIniciais.length > 0 ? coresIniciais : [""];

    lista.forEach(cor => {
      // Descobre automaticamente qual kit aquela cor pertence
      const kit = cor ? _getKitDaCor(modelo, cor.trim()) : "";
      adicionar(kit || "", cor.trim());
    });
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

    // Inicia com 1 linha em branco — modelo ainda não foi escolhido
    coresApp.inicializar([""]);
  }

  // Chamado quando o select de modelo muda
  function atualizarCores() {
    const modelo  = document.getElementById("modelo")?.value;
    const btnAdd  = document.getElementById("btn-add-cor");

    // Mostra o botão "adicionar cor" só depois que o modelo foi escolhido
    if (btnAdd) btnAdd.style.display = modelo ? "" : "none";

    // Recarrega as linhas de kit + cor do zero pro novo modelo
    coresApp.repovoarSelects();
  }

  function adicionarCor() { coresApp.adicionar(); }

  // ── Preview da imagem selecionada ─────────────────────────

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

  // ── Intercepta o envio pra avisar quando não tem print ────

  function _interceptarEnvio(e) {
    if (_confirmarEnvio)   return;
    if (_printSelecionado) return;
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

  return {
    init, atualizarCores, adicionarCor,
    previewImagem, removerImagem, handleDrop,
    cancelarSemPrint, confirmarSemPrint,
  };
})();


// ═════════════════════════════════════════════════════════════
// MÓDULO DO FORMULÁRIO DE EDIÇÃO
// ═════════════════════════════════════════════════════════════
const editarApp = (() => {

  function init() {
    if (!document.getElementById("form-editar")) return;

    // Cores armazenadas como "Bege/Preto, Marrom/Cinza" → ["Bege/Preto", "Marrom/Cinza"]
    const coresIniciais = window.CORES_ATUAIS || [""];
    coresApp.inicializar(coresIniciais);
  }

  // Quando muda o modelo na edição, recomeça as linhas de cor
  function atualizarCores() { coresApp.repovoarSelects(); }

  function adicionarCor()       { coresApp.adicionar(); }
  function previewImagem(input) { novaOcorrenciaApp.previewImagem(input); }
  function removerImagem()      { novaOcorrenciaApp.removerImagem(); }
  function handleDrop(e)        { novaOcorrenciaApp.handleDrop(e); }

  return { init, atualizarCores, adicionarCor, previewImagem, removerImagem, handleDrop };
})();


// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO — detecta qual tela tá ativa pelo elemento chave
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tbody-ocorrencias")) occurrencesApp.init();
  if (document.getElementById("form-nova"))         novaOcorrenciaApp.init();
  if (document.getElementById("form-editar"))       editarApp.init();

  // Fecha o modal clicando no overlay escuro ao redor
  document.getElementById("modal-delete")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-delete") occurrencesApp.fecharModal();
  });
  document.getElementById("modal-sem-print")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-sem-print") novaOcorrenciaApp.cancelarSemPrint();
  });
});
