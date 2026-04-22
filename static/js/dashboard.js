/**
 * dashboard.js
 * ──────────────────────────────────────────────────────────────
 * Lógica do dashboard:
 *  - Carrega dados da API e renderiza gráficos com Chart.js
 *  - Escuta eventos Socket.IO e atualiza gráficos automaticamente
 *  - Filtro por intervalo de datas
 */

// ─────────────────────────────────────────────────────────────
// INSTÂNCIAS DOS GRÁFICOS (mantidas para destruir/recriar)
// ─────────────────────────────────────────────────────────────
let chartTiposErro = null;
let chartModelos   = null;
let chartCores     = null;

// ─────────────────────────────────────────────────────────────
// PALETA DE CORES DOS GRÁFICOS
// ─────────────────────────────────────────────────────────────
const CORES_GRAFICO = [
  "#3b82f6", "#f59e0b", "#22c55e",
  "#ef4444", "#8b5cf6", "#06b6d4",
  "#f97316", "#ec4899", "#84cc16",
  "#14b8a6",
];

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÃO PADRÃO DO CHART.JS (tema escuro)
// ─────────────────────────────────────────────────────────────
Chart.defaults.color = "#94a3b8";
Chart.defaults.borderColor = "rgba(59,130,246,0.08)";
Chart.defaults.font.family = "'DM Sans', 'Sora', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = "rgba(14,31,61,0.95)";
Chart.defaults.plugins.tooltip.borderColor = "rgba(59,130,246,0.3)";
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.legend.display = false;  // legendas customizadas


// ═════════════════════════════════════════════════════════════
// MÓDULO PRINCIPAL
// ═════════════════════════════════════════════════════════════
const dashboardApp = (() => {

  // ── Inicialização ──────────────────────────────────────────

  function init() {
    // Define datas padrão nos inputs
    const hoje  = hojeISO();
    const inicio = diasAtrasISO(30);

    document.getElementById("data-inicio").value = inicio;
    document.getElementById("data-fim").value    = hoje;

    // Primeira carga
    _carregarDados(inicio, hoje);

    // Escuta eventos Socket.IO para atualizar automaticamente
    socket.on("nova_ocorrencia",     () => _recarregarAtual());
    socket.on("ocorrencia_editada",  () => _recarregarAtual());
    socket.on("ocorrencia_deletada", () => _recarregarAtual());
  }

  // ── Filtrar por período ────────────────────────────────────

  function filtrar() {
    const inicio = document.getElementById("data-inicio").value;
    const fim    = document.getElementById("data-fim").value;

    if (!inicio || !fim) {
      mostrarToast("Selecione um período válido.", "error");
      return;
    }
    if (inicio > fim) {
      mostrarToast("A data de início não pode ser maior que a data fim.", "error");
      return;
    }
    _carregarDados(inicio, fim);
  }

  function resetarFiltro() {
    const inicio = diasAtrasISO(30);
    const fim    = hojeISO();
    document.getElementById("data-inicio").value = inicio;
    document.getElementById("data-fim").value    = fim;
    _carregarDados(inicio, fim);
  }

  // ── Recarrega com os filtros atuais (chamado pelo Socket.IO) ─

  function _recarregarAtual() {
    const inicio = document.getElementById("data-inicio").value;
    const fim    = document.getElementById("data-fim").value;
    if (inicio && fim) _carregarDados(inicio, fim);
  }

  // ── Busca dados da API ─────────────────────────────────────

  async function _carregarDados(inicio, fim) {
    try {
      const url  = `/api/dashboard?data_inicio=${inicio}&data_fim=${fim}`;
      const data = await apiFetch(url);
      _renderizarDados(data);
    } catch (err) {
      console.error("[Dashboard] Erro ao carregar dados:", err);
      mostrarToast("Erro ao carregar os dados do dashboard.", "error");
    }
  }

  // ── Renderiza todos os componentes visuais ─────────────────

  function _renderizarDados(data) {
    // KPIs
    _animarNumero("kpi-total-valor", data.total);
    document.getElementById("kpi-periodo-valor").textContent =
      `${data.data_inicio} → ${data.data_fim}`;

    const empty = document.getElementById("dashboard-empty");
    const grid  = document.querySelector(".charts-grid");

    if (data.total === 0) {
      if (grid)  grid.style.display = "none";
      if (empty) empty.style.display = "block";
      return;
    }

    if (grid)  grid.style.display = "";
    if (empty) empty.style.display = "none";

    _renderizarPizza(data.tipos_erro);
    _renderizarBarras("chart-modelos", data.modelos);
    _renderizarCoresDetalhado(data.cores_detalhado || []);
  }

  // ── Gráfico de pizza (tipos de erro) ──────────────────────

  function _renderizarPizza(dados) {
    const ctx = document.getElementById("chart-tipos-erro")?.getContext("2d");
    if (!ctx) return;

    // Destrói instância anterior para evitar sobreposição
    if (chartTiposErro) chartTiposErro.destroy();

    chartTiposErro = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels:   dados.labels,
        datasets: [{
          data:            dados.values,
          backgroundColor: CORES_GRAFICO.slice(0, dados.labels.length),
          borderColor:     "rgba(14,31,61,0.8)",
          borderWidth:     3,
          hoverOffset:     8,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        cutout:              "62%",
        animation: { animateRotate: true, duration: 800 },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} ocorrência(s)`,
            },
          },
        },
      },
    });

    // Legenda customizada
    _renderizarLegendaPizza(dados);
  }

  function _renderizarLegendaPizza(dados) {
    const container = document.getElementById("legend-tipos-erro");
    if (!container) return;

    const total = dados.values.reduce((a, b) => a + b, 0);
    container.innerHTML = dados.labels.map((label, i) => {
      const pct = total > 0 ? ((dados.values[i] / total) * 100).toFixed(1) : 0;
      return `
        <div class="legend-item">
          <span class="legend-dot" style="background:${CORES_GRAFICO[i]}"></span>
          <span class="legend-label">${label}</span>
          <span class="legend-count">${dados.values[i]} <small style="color:var(--text-muted)">(${pct}%)</small></span>
        </div>
      `;
    }).join("");
  }

  // ── Gráfico de barras horizontais ─────────────────────────

  function _renderizarBarras(canvasId, dados) {
    const ctx = document.getElementById(canvasId)?.getContext("2d");
    if (!ctx) return;

    // Destrói instância anterior
    const instanciaAtual = Chart.getChart(canvasId);
    if (instanciaAtual) instanciaAtual.destroy();

    // Altura dinâmica baseada na quantidade de itens
    const alturaItem = 44;
    const alturaMin  = 140;
    const altura = Math.max(alturaMin, dados.labels.length * alturaItem);
    ctx.canvas.parentElement.style.height = `${altura}px`;

    // Gera cores com opacidade degradê (mais intenso no topo)
    const cores = dados.labels.map((_, i) => {
      const opacidade = Math.max(0.5, 1 - (i / dados.labels.length) * 0.45);
      return `rgba(59, 130, 246, ${opacidade})`;
    });

    new Chart(ctx, {
      type: "bar",
      data: {
        labels:   dados.labels,
        datasets: [{
          data:            dados.values,
          backgroundColor: cores,
          borderColor:     "rgba(59,130,246,0.5)",
          borderWidth:     1,
          borderRadius:    6,
          borderSkipped:   false,
        }],
      },
      options: {
        indexAxis:           "y",   // barras horizontais
        responsive:          true,
        maintainAspectRatio: false,
        animation:           { duration: 700, easing: "easeOutQuart" },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
            },
            grid: { color: "rgba(59,130,246,0.07)" },
          },
          y: {
            ticks: {
              font: { size: 12 },
              // Trunca labels muito longos
              callback: (val, idx) => {
                const label = dados.labels[idx];
                return label.length > 22 ? label.slice(0, 22) + "…" : label;
              },
            },
            grid: { display: false },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw} ocorrência(s)`,
            },
          },
        },
      },
    });
  }

  // ── Card: Cores com Mais Erros — visual agrupado por modelo ──

  /**
   * Gera uma cor HSL consistente a partir de uma string (hash simples).
   * Garante que cada cor/modelo sempre receba a mesma cor visual.
   */
  function _hashColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 65%, 58%)`;
  }

  /**
   * Renderiza o card de cores agrupado por modelo.
   * @param {Array} lista — [{modelo, cor, total}, ...]
   */
  function _renderizarCoresDetalhado(lista) {
    const container = document.getElementById("cores-detalhado-container");
    if (!container) return;

    if (!lista || lista.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:24px;font-size:0.88rem;">Sem dados no período.</p>`;
      return;
    }

    // Máximo global para calcular % das barras
    const maxTotal = lista[0].total;

    // Agrupa por modelo preservando ordem (já vem ordenado por total desc)
    const grupos = {};
    const ordemModelos = [];
    lista.forEach(item => {
      if (!grupos[item.modelo]) {
        grupos[item.modelo] = [];
        ordemModelos.push(item.modelo);
      }
      grupos[item.modelo].push(item);
    });

    // Rank global (posição no array original)
    const rankGlobal = {};
    lista.forEach((item, i) => {
      const key = `${item.modelo}||${item.cor}`;
      if (rankGlobal[key] === undefined) rankGlobal[key] = i;
    });

    // Monta HTML
    let html = "";
    ordemModelos.forEach(modelo => {
      const itens = grupos[modelo];
      const totalModelo = itens.reduce((s, i) => s + i.total, 0);
      const corModelo   = _hashColor(modelo);

      html += `
        <div class="cor-grupo">
          <div class="cor-grupo-header">
            <span class="cor-grupo-dot" style="background:${corModelo};width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block;box-shadow:0 0 6px ${corModelo}88;"></span>
            <span class="cor-grupo-nome" title="${modelo}">${modelo}</span>
            <span class="cor-grupo-total-badge">${totalModelo} erro${totalModelo > 1 ? "s" : ""}</span>
          </div>
      `;

      itens.forEach(item => {
        const rank = rankGlobal[`${item.modelo}||${item.cor}`];
        const pct  = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
        const corDot = _hashColor(item.cor);

        let rankHtml = "";
        if      (rank === 0) rankHtml = `<span class="cor-rank-badge cor-rank-1">1º</span>`;
        else if (rank === 1) rankHtml = `<span class="cor-rank-badge cor-rank-2">2º</span>`;
        else if (rank === 2) rankHtml = `<span class="cor-rank-badge cor-rank-3">3º</span>`;
        else                 rankHtml = `<span class="cor-rank-badge cor-rank-n">${rank + 1}º</span>`;

        html += `
          <div class="cor-item" data-pct="${pct.toFixed(1)}">
            ${rankHtml}
            <span class="cor-bolinha" style="background:${corDot};box-shadow:0 0 5px ${corDot}66;"></span>
            <span class="cor-item-nome">${item.cor}</span>
            <div class="cor-item-bar-wrap">
              <div class="cor-item-bar-track">
                <div class="cor-item-bar-fill" style="background:${corDot};width:0%;" data-width="${pct.toFixed(1)}"></div>
              </div>
              <span class="cor-item-count">${item.total}</span>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    });

    container.innerHTML = html;

    // Anima as barras com stagger (delay escalonado)
    requestAnimationFrame(() => {
      const barras = container.querySelectorAll(".cor-item-bar-fill");
      barras.forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = bar.dataset.width + "%";
        }, i * 35);
      });
    });
  }

  // ── Anima o número do KPI ──────────────────────────────────

  function _animarNumero(elementId, valorFinal) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const valorAtual = parseInt(el.textContent) || 0;
    const duracao    = 600;
    const passos     = 30;
    const intervalo  = duracao / passos;
    const incremento = (valorFinal - valorAtual) / passos;
    let passo = 0;

    const timer = setInterval(() => {
      passo++;
      const valor = Math.round(valorAtual + incremento * passo);
      el.textContent = valor;
      if (passo >= passos) {
        el.textContent = valorFinal;
        clearInterval(timer);
      }
    }, intervalo);
  }

  // ── API pública do módulo ──────────────────────────────────
  return { init, filtrar, resetarFiltro };
})();


// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => dashboardApp.init());
