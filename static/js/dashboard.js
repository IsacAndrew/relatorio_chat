/**
 * dashboard.js
 */

let chartTiposErro = null;
let chartModelos   = null;

const CORES_GRAFICO = [
  "#3b82f6","#f59e0b","#22c55e","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#ec4899","#84cc16","#14b8a6",
];

Chart.defaults.color = "#94a3b8";
Chart.defaults.borderColor = "rgba(59,130,246,0.08)";
Chart.defaults.font.family = "'DM Sans','Sora',sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = "rgba(14,31,61,0.95)";
Chart.defaults.plugins.tooltip.borderColor = "rgba(59,130,246,0.3)";
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.legend.display = false;


// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════
const dashboardApp = (() => {

  function init() {
    const hoje  = hojeISO();
    const inicio = diasAtrasISO(30);
    document.getElementById("data-inicio").value = inicio;
    document.getElementById("data-fim").value    = hoje;
    _carregarDados(inicio, hoje);
    socket.on("nova_ocorrencia",     () => _recarregarAtual());
    socket.on("ocorrencia_editada",  () => _recarregarAtual());
    socket.on("ocorrencia_deletada", () => _recarregarAtual());
  }

  function filtrar() {
    const inicio = document.getElementById("data-inicio").value;
    const fim    = document.getElementById("data-fim").value;
    if (!inicio || !fim) { mostrarToast("Selecione um período válido.", "error"); return; }
    if (inicio > fim)    { mostrarToast("Data início maior que data fim.", "error"); return; }
    _carregarDados(inicio, fim);
  }

  function resetarFiltro() {
    const inicio = diasAtrasISO(30);
    const fim    = hojeISO();
    document.getElementById("data-inicio").value = inicio;
    document.getElementById("data-fim").value    = fim;
    _carregarDados(inicio, fim);
  }

  function _recarregarAtual() {
    const inicio = document.getElementById("data-inicio").value;
    const fim    = document.getElementById("data-fim").value;
    if (inicio && fim) _carregarDados(inicio, fim);
  }

  async function _carregarDados(inicio, fim) {
    try {
      const data = await apiFetch(`/api/dashboard?data_inicio=${inicio}&data_fim=${fim}`);
      _renderizarDados(data);
    } catch (err) {
      console.error("[Dashboard]", err);
      mostrarToast("Erro ao carregar os dados.", "error");
    }
  }

  function _renderizarDados(data) {
    _animarNumero("kpi-total-valor", data.total);

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

  // ── Pizza ─────────────────────────────────────────────────
  function _renderizarPizza(dados) {
    const ctx = document.getElementById("chart-tipos-erro")?.getContext("2d");
    if (!ctx) return;
    if (chartTiposErro) chartTiposErro.destroy();
    chartTiposErro = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: dados.labels,
        datasets: [{
          data: dados.values,
          backgroundColor: CORES_GRAFICO.slice(0, dados.labels.length),
          borderColor: "rgba(14,31,61,0.8)",
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: "62%",
        animation: { animateRotate: true, duration: 800 },
        plugins: { tooltip: { callbacks: { label: (c) => ` ${c.label}: ${c.raw} ocorrência(s)` } } },
      },
    });
    _renderizarLegendaPizza(dados);
  }

  function _renderizarLegendaPizza(dados) {
    const container = document.getElementById("legend-tipos-erro");
    if (!container) return;
    const total = dados.values.reduce((a, b) => a + b, 0);
    container.innerHTML = dados.labels.map((label, i) => {
      const pct = total > 0 ? ((dados.values[i] / total) * 100).toFixed(1) : 0;
      return `<div class="legend-item">
        <span class="legend-dot" style="background:${CORES_GRAFICO[i]}"></span>
        <span class="legend-label">${label}</span>
        <span class="legend-count">${dados.values[i]} <small style="color:var(--text-muted)">(${pct}%)</small></span>
      </div>`;
    }).join("");
  }

  // ── Barras horizontais ────────────────────────────────────
  function _renderizarBarras(canvasId, dados) {
    const ctx = document.getElementById(canvasId)?.getContext("2d");
    if (!ctx) return;
    const prev = Chart.getChart(canvasId);
    if (prev) prev.destroy();

    const altura = Math.max(140, dados.labels.length * 44);
    ctx.canvas.parentElement.style.height = `${altura}px`;

    const cores = dados.labels.map((_, i) =>
      `rgba(59,130,246,${Math.max(0.5, 1 - (i / dados.labels.length) * 0.45)})`
    );
    new Chart(ctx, {
      type: "bar",
      data: { labels: dados.labels, datasets: [{
        data: dados.values, backgroundColor: cores,
        borderColor: "rgba(59,130,246,0.5)", borderWidth: 1,
        borderRadius: 6, borderSkipped: false,
      }]},
      options: {
        indexAxis: "y", responsive: true, maintainAspectRatio: false,
        animation: { duration: 700, easing: "easeOutQuart" },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize:1, precision:0 }, grid: { color:"rgba(59,130,246,0.07)" } },
          y: { ticks: { font:{size:12}, callback:(v,i) => { const l=dados.labels[i]; return l.length>22?l.slice(0,22)+"…":l; } }, grid:{display:false} },
        },
        plugins: { tooltip: { callbacks: { label: (c) => ` ${c.raw} ocorrência(s)` } } },
      },
    });
  }

  // ── Cores detalhado — visual agrupado por modelo ──────────

  function _hashColor(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
    return `hsl(${Math.abs(h) % 360},62%,58%)`;
  }

  function _renderizarCoresDetalhado(lista) {
    const container = document.getElementById("cores-detalhado-container");
    if (!container) return;

    if (!lista || lista.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:32px;font-size:.88rem;">Sem dados no período.</p>`;
      return;
    }

    const maxTotal = lista[0].total;
    const grupos = {};
    const ordem  = [];
    lista.forEach(item => {
      if (!grupos[item.modelo]) { grupos[item.modelo] = []; ordem.push(item.modelo); }
      grupos[item.modelo].push(item);
    });

    const rankGlobal = {};
    lista.forEach((item, i) => { rankGlobal[`${item.modelo}||${item.cor}`] = i; });

    let html = "";
    ordem.forEach(modelo => {
      const itens      = grupos[modelo];
      const totModelo  = itens.reduce((s, i) => s + i.total, 0);
      const corModelo  = _hashColor(modelo);

      html += `<div class="cor-grupo">
        <div class="cor-grupo-header">
          <span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;display:inline-block;
                       background:${corModelo};box-shadow:0 0 5px ${corModelo}99;"></span>
          <span class="cor-grupo-nome" title="${modelo}">${modelo}</span>
          <span class="cor-grupo-total-badge">${totModelo} erro${totModelo>1?"s":""}</span>
        </div>`;

      itens.forEach(item => {
        const rank   = rankGlobal[`${item.modelo}||${item.cor}`];
        const pct    = maxTotal > 0 ? (item.total / maxTotal) * 100 : 0;
        const corDot = _hashColor(item.cor);
        const rankHtml = rank === 0
          ? `<span class="cor-rank-badge cor-rank-1">1º</span>`
          : rank === 1 ? `<span class="cor-rank-badge cor-rank-2">2º</span>`
          : rank === 2 ? `<span class="cor-rank-badge cor-rank-3">3º</span>`
          : `<span class="cor-rank-badge cor-rank-n">${rank+1}º</span>`;

        html += `<div class="cor-item">
          ${rankHtml}
          <span class="cor-bolinha" style="background:${corDot};box-shadow:0 0 4px ${corDot}66;"></span>
          <span class="cor-item-nome">${item.cor}</span>
          <div class="cor-item-bar-wrap">
            <div class="cor-item-bar-track">
              <div class="cor-item-bar-fill" style="background:${corDot};width:0%;" data-w="${pct.toFixed(1)}"></div>
            </div>
            <span class="cor-item-count">${item.total}</span>
          </div>
        </div>`;
      });

      html += `</div>`;
    });

    container.innerHTML = html;

    // Anima barras com stagger
    requestAnimationFrame(() => {
      container.querySelectorAll(".cor-item-bar-fill").forEach((bar, i) => {
        setTimeout(() => { bar.style.width = bar.dataset.w + "%"; }, i * 30);
      });
    });
  }

  // ── Anima KPI ─────────────────────────────────────────────
  function _animarNumero(id, fim) {
    const el = document.getElementById(id);
    if (!el) return;
    const ini = parseInt(el.textContent) || 0;
    const steps = 30;
    const inc = (fim - ini) / steps;
    let s = 0;
    const t = setInterval(() => {
      s++;
      el.textContent = Math.round(ini + inc * s);
      if (s >= steps) { el.textContent = fim; clearInterval(t); }
    }, 600 / steps);
  }

  return { init, filtrar, resetarFiltro };
})();


// ═══════════════════════════════════════════════════════════════
// EASTER EGG — CAMPO MINADO (CTRL + ~)
// ═══════════════════════════════════════════════════════════════
const minesweeperEgg = (() => {

  const ROWS = 9, COLS = 9, MINES = 10;
  let board = [], revealed = [], flagged = [], gameOver = false, gameWon = false;
  let timerInterval = null, seconds = 0, firstClick = true;

  // ── Inicia / reinicia o jogo ───────────────────────────────
  function _novoJogo() {
    clearInterval(timerInterval);
    seconds = 0; firstClick = true; gameOver = false; gameWon = false;
    board    = Array.from({length: ROWS}, () => Array(COLS).fill(0));
    revealed = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    flagged  = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    _renderizar();
    _atualizarTimer();
  }

  // ── Coloca minas evitando a primeira célula clicada ────────
  function _colocarMinas(evitarR, evitarC) {
    let colocadas = 0;
    while (colocadas < MINES) {
      const r = Math.floor(Math.random() * ROWS);
      const c = Math.floor(Math.random() * COLS);
      if (board[r][c] === -1) continue;
      if (Math.abs(r - evitarR) <= 1 && Math.abs(c - evitarC) <= 1) continue;
      board[r][c] = -1;
      colocadas++;
    }
    // Calcula números
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (board[r][c] === -1) continue;
      let count = 0;
      _vizinhos(r, c).forEach(([nr, nc]) => { if (board[nr][nc] === -1) count++; });
      board[r][c] = count;
    }
  }

  function _vizinhos(r, c) {
    const v = [];
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) v.push([nr, nc]);
    }
    return v;
  }

  // ── Clique esquerdo: revelar ───────────────────────────────
  function _revelar(r, c) {
    if (gameOver || gameWon || revealed[r][c] || flagged[r][c]) return;

    if (firstClick) {
      firstClick = false;
      _colocarMinas(r, c);
      timerInterval = setInterval(() => {
        seconds++;
        const el = document.getElementById("ms-timer");
        if (el) el.textContent = String(seconds).padStart(3, "0");
      }, 1000);
    }

    if (board[r][c] === -1) {
      // Explodiu
      gameOver = true;
      clearInterval(timerInterval);
      revealed[r][c] = true;
      _renderizar();
      // Revela todas as minas
      setTimeout(() => {
        for (let i = 0; i < ROWS; i++) for (let j = 0; j < COLS; j++)
          if (board[i][j] === -1) revealed[i][j] = true;
        _renderizar();
        document.getElementById("ms-face").textContent = "💀";
      }, 200);
      return;
    }

    // Flood-fill para células vazias
    const fila = [[r, c]];
    while (fila.length) {
      const [cr, cc] = fila.shift();
      if (revealed[cr][cc]) continue;
      revealed[cr][cc] = true;
      if (board[cr][cc] === 0)
        _vizinhos(cr, cc).forEach(([nr, nc]) => {
          if (!revealed[nr][nc] && !flagged[nr][nc]) fila.push([nr, nc]);
        });
    }

    _verificarVitoria();
    _renderizar();
  }

  // ── Clique direito: bandeira ───────────────────────────────
  function _alternarBandeira(r, c, e) {
    e.preventDefault();
    if (gameOver || gameWon || revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    _atualizarContadorMinas();
    _renderizar();
  }

  function _verificarVitoria() {
    let count = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++)
      if (revealed[r][c] && board[r][c] !== -1) count++;
    if (count === ROWS * COLS - MINES) {
      gameWon = true;
      clearInterval(timerInterval);
      document.getElementById("ms-face").textContent = "😎";
    }
  }

  function _atualizarContadorMinas() {
    const el = document.getElementById("ms-mines");
    if (!el) return;
    const flags = flagged.flat().filter(Boolean).length;
    el.textContent = String(Math.max(0, MINES - flags)).padStart(3, "0");
  }

  function _atualizarTimer() {
    const el = document.getElementById("ms-timer");
    if (el) el.textContent = "000";
    _atualizarContadorMinas();
  }

  // ── Renderiza o tabuleiro ──────────────────────────────────
  function _renderizar() {
    const grid = document.getElementById("ms-grid");
    if (!grid) return;

    const NUMS = ["","1","2","3","4","5","6","7","8"];
    const NUM_COLORS = ["","#3b82f6","#22c55e","#ef4444","#7c3aed","#b91c1c","#0891b2","#000","#6b7280"];

    grid.innerHTML = "";
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement("div");
        cell.className = "ms-cell";

        if (revealed[r][c]) {
          cell.classList.add("ms-revealed");
          if (board[r][c] === -1) {
            cell.textContent = "💣";
            cell.classList.add("ms-mine");
          } else if (board[r][c] > 0) {
            cell.textContent = NUMS[board[r][c]];
            cell.style.color = NUM_COLORS[board[r][c]];
            cell.style.fontWeight = "700";
          }
        } else if (flagged[r][c]) {
          cell.textContent = "🚩";
          cell.classList.add("ms-flagged");
        } else {
          cell.classList.add("ms-hidden");
        }

        const _r = r, _c = c;
        cell.addEventListener("click",       () => _revelar(_r, _c));
        cell.addEventListener("contextmenu", (e) => _alternarBandeira(_r, _c, e));
        grid.appendChild(cell);
      }
    }
  }

  // ── Modal HTML ─────────────────────────────────────────────
  function _criarModal() {
    const overlay = document.createElement("div");
    overlay.id = "ms-overlay";
    overlay.innerHTML = `
      <div id="ms-modal">
        <div id="ms-header">
          <span id="ms-mines" class="ms-counter">010</span>
          <button id="ms-face" onclick="minesweeperEgg.novoJogo()">🙂</button>
          <span id="ms-timer" class="ms-counter">000</span>
          <button id="ms-close" onclick="minesweeperEgg.fechar()">✕</button>
        </div>
        <div id="ms-grid"></div>
        <div id="ms-footer">CTRL+~ para fechar · clique direito = 🚩</div>
      </div>`;
    document.body.appendChild(overlay);

    // Clique no overlay fecha
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) fechar();
    });
  }

  // ── API pública ────────────────────────────────────────────
  function abrir() {
    let overlay = document.getElementById("ms-overlay");
    if (!overlay) { _criarModal(); overlay = document.getElementById("ms-overlay"); }
    overlay.style.display = "flex";
    _novoJogo();
  }

  function fechar() {
    clearInterval(timerInterval);
    const overlay = document.getElementById("ms-overlay");
    if (overlay) overlay.style.display = "none";
  }

  function novoJogo() {
    document.getElementById("ms-face").textContent = "🙂";
    _novoJogo();
  }

  // ── Listener do atalho CTRL + ~ ────────────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && (e.key === "`" || e.key === "~")) {
      e.preventDefault();
      const overlay = document.getElementById("ms-overlay");
      if (overlay && overlay.style.display !== "none") fechar();
      else abrir();
    }
    if (e.key === "Escape") fechar();
  });

  return { abrir, fechar, novoJogo };
})();


// ═══════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => dashboardApp.init());
