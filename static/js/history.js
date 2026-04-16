/**
 * history.js
 * ──────────────────────────────────────────────────────────────
 * Lógica da tela de histórico de auditoria:
 *  - Busca registros via API com filtro de datas
 *  - Paginação
 *  - Renderização de detalhes de edição (campos alterados)
 */

const historyApp = (() => {

  // Estado da paginação
  let _paginaAtual = 1;
  const _porPagina = 50;

  // Datas atuais do filtro
  let _dataInicio = "";
  let _dataFim    = "";

  // ── Inicialização ──────────────────────────────────────────

  function init() {
    // Define datas padrão
    const hoje   = hojeISO();
    const inicio = diasAtrasISO(30);

    _dataInicio = inicio;
    _dataFim    = hoje;

    document.getElementById("hist-inicio").value = inicio;
    document.getElementById("hist-fim").value    = hoje;

    // Carrega primeira página
    _buscarPagina(1);
  }

  // ── Busca com filtro de data ───────────────────────────────

  function buscar() {
    _dataInicio = document.getElementById("hist-inicio").value;
    _dataFim    = document.getElementById("hist-fim").value;

    if (!_dataInicio || !_dataFim) {
      mostrarToast("Selecione um período válido.", "error");
      return;
    }
    _buscarPagina(1);
  }

  function resetar() {
    const hoje   = hojeISO();
    const inicio = diasAtrasISO(30);
    document.getElementById("hist-inicio").value = inicio;
    document.getElementById("hist-fim").value    = hoje;
    _dataInicio = inicio;
    _dataFim    = hoje;
    _buscarPagina(1);
  }

  function paginaAnterior() {
    if (_paginaAtual > 1) _buscarPagina(_paginaAtual - 1);
  }

  function proximaPagina() {
    _buscarPagina(_paginaAtual + 1);
  }

  // ── Chamada à API ──────────────────────────────────────────

  async function _buscarPagina(pagina) {
    _paginaAtual = pagina;
    const url = `/api/historico?data_inicio=${_dataInicio}&data_fim=${_dataFim}&pagina=${pagina}&por_pagina=${_porPagina}`;

    const tbody = document.getElementById("tbody-historico");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="td-loading">
            <i class="fa-solid fa-spinner fa-spin"></i> Carregando...
          </td>
        </tr>`;
    }

    try {
      const data = await apiFetch(url);
      _renderizarTabela(data);
    } catch (err) {
      console.error("[Histórico] Erro:", err);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="td-empty">
              <i class="fa-solid fa-circle-exclamation" style="color:var(--danger)"></i>
              Erro ao carregar o histórico.
            </td>
          </tr>`;
      }
    }
  }

  // ── Renderiza a tabela ─────────────────────────────────────

  function _renderizarTabela(data) {
    const tbody   = document.getElementById("tbody-historico");
    const summary = document.getElementById("history-summary");
    const paginacao = document.getElementById("pagination");

    if (!tbody) return;

    // Resumo
    if (summary) {
      summary.style.display = "block";
      document.getElementById("history-total-label").textContent =
        `${data.total} registro(s) encontrado(s)`;
    }

    // Sem resultados
    if (data.registros.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="td-empty">
            <div class="empty-state-inline">
              <i class="fa-solid fa-inbox"></i>
              <span>Nenhum registro encontrado para o período selecionado.</span>
            </div>
          </td>
        </tr>`;
      if (paginacao) paginacao.style.display = "none";
      return;
    }

    // Preenche as linhas
    tbody.innerHTML = "";
    data.registros.forEach((reg) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="td-data">${reg.criado_em}</td>
        <td><span class="badge-user">${reg.usuario}</span></td>
        <td>${_badgeAcao(reg.acao)}</td>
        <td class="td-ocorrencia">#${reg.ocorrencia_id}</td>
        <td>${_renderizarDetalhes(reg)}</td>
      `;
      tbody.appendChild(tr);
    });

    // Paginação
    const totalPaginas = Math.ceil(data.total / _porPagina);
    if (totalPaginas > 1) {
      if (paginacao) paginacao.style.display = "flex";
      document.getElementById("pagination-info").textContent =
        `Página ${data.pagina} de ${totalPaginas}`;

      const btnAnterior = document.getElementById("btn-anterior");
      const btnProximo  = document.getElementById("btn-proximo");
      if (btnAnterior) btnAnterior.disabled = data.pagina <= 1;
      if (btnProximo)  btnProximo.disabled  = data.pagina >= totalPaginas;
    } else {
      if (paginacao) paginacao.style.display = "none";
    }
  }

  // ── Helpers visuais ────────────────────────────────────────

  /** Retorna o badge HTML da ação. */
  function _badgeAcao(acao) {
    const labels = {
      criacao:  "Criação",
      edicao:   "Edição",
      exclusao: "Exclusão",
    };
    return `<span class="badge-acao badge-${acao}">${labels[acao] || acao}</span>`;
  }

  /**
   * Renderiza os detalhes da ação de forma legível.
   * Para edições: mostra campo → antes → depois.
   * Para criações/exclusões: mostra os dados principais.
   */
  function _renderizarDetalhes(reg) {
    const det = reg.detalhes || {};

    if (reg.acao === "edicao") {
      // Mostra apenas os campos que mudaram
      const campos = Object.keys(det);
      if (campos.length === 0) return "<span style='color:var(--text-muted)'>—</span>";

      const nomesCampos = {
        modelo:        "Modelo",
        cor:           "Cor",
        tipo_erro:     "Tipo de erro",
        data_ocorrido: "Data",
        hora_ocorrido: "Hora",
        nome_cliente:  "Cliente",
        link_conversa: "Link",
        print:         "Print",
      };

      return `<div class="td-detalhes-list">` +
        campos.map((campo) => {
          const nome   = nomesCampos[campo] || campo;
          const antes  = det[campo].antes  || "—";
          const depois = det[campo].depois || "—";
          return `
            <div class="detalhe-item">
              <span class="detalhe-campo">${nome}:</span>
              <span class="detalhe-antes">${antes}</span>
              <i class="fa-solid fa-arrow-right" style="font-size:0.75rem;color:var(--text-muted)"></i>
              <span class="detalhe-depois">${depois}</span>
            </div>`;
        }).join("") +
        `</div>`;
    }

    // Criação / Exclusão: mostra modelo, cor, tipo
    if (det.modelo || det.tipo_erro) {
      return `
        <div class="td-detalhes-list">
          <div class="detalhe-item">
            <span class="detalhe-campo">Modelo:</span>
            <span>${det.modelo || "—"}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-campo">Cor:</span>
            <span>${det.cor || "—"}</span>
          </div>
          <div class="detalhe-item">
            <span class="detalhe-campo">Tipo:</span>
            <span>${det.tipo_erro || "—"}</span>
          </div>
        </div>`;
    }

    return "<span style='color:var(--text-muted)'>—</span>";
  }

  // ── API pública ────────────────────────────────────────────
  return { init, buscar, resetar, paginaAnterior, proximaPagina };
})();


// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tbody-historico")) historyApp.init();
});
