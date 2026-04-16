/**
 * main.js
 * ──────────────────────────────────────────────────────────────
 * Script global: inicializa a conexão Socket.IO e expõe
 * utilitários compartilhados por todas as páginas.
 * Carregado em base.html após o CDN do Socket.IO.
 */

// ─────────────────────────────────────────────────────────────
// 1. CONEXÃO SOCKET.IO
// ─────────────────────────────────────────────────────────────

/** Instância global da conexão Socket.IO */
const socket = io({
  transports: ["websocket", "polling"],  // tenta WS, cai em polling se precisar
  reconnection: true,
  reconnectionDelay: 1500,
  reconnectionAttempts: Infinity,
});

// ── Eventos de ciclo de vida da conexão ─────────────────────

socket.on("connect", () => {
  console.log("[Socket.IO] Conectado:", socket.id);
  _setRealtimeBadge(true);
});

socket.on("disconnect", (reason) => {
  console.warn("[Socket.IO] Desconectado:", reason);
  _setRealtimeBadge(false);
});

socket.on("reconnect", (tentativa) => {
  console.log("[Socket.IO] Reconectado após", tentativa, "tentativa(s)");
  _setRealtimeBadge(true);
});

/**
 * Atualiza o indicador visual "Tempo real" na navbar.
 * @param {boolean} conectado
 */
function _setRealtimeBadge(conectado) {
  const badge = document.getElementById("realtime-badge");
  const dot   = badge?.querySelector(".realtime-dot");
  const label = badge?.querySelector("span:last-child");
  if (!badge) return;

  if (conectado) {
    badge.style.borderColor = "rgba(34,197,94,0.3)";
    badge.style.color = "var(--success)";
    if (dot) dot.style.background = "var(--success)";
    if (label) label.textContent = "Tempo real";
  } else {
    badge.style.borderColor = "rgba(239,68,68,0.3)";
    badge.style.color = "var(--danger)";
    if (dot) { dot.style.background = "var(--danger)"; dot.style.animation = "none"; }
    if (label) label.textContent = "Reconectando...";
  }
}


// ─────────────────────────────────────────────────────────────
// 2. UTILITÁRIOS GLOBAIS
// ─────────────────────────────────────────────────────────────

/**
 * Formata uma data ISO (YYYY-MM-DD) para o padrão BR (DD/MM/YYYY).
 * @param {string} isoDate
 * @returns {string}
 */
function formatarData(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD.
 * @returns {string}
 */
function hojeISO() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Retorna a data de N dias atrás no formato YYYY-MM-DD.
 * @param {number} dias
 * @returns {string}
 */
function diasAtrasISO(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().split("T")[0];
}

/**
 * Faz uma requisição fetch com JSON e retorna o objeto parsed.
 * Lança erro em caso de resposta não-ok.
 * @param {string} url
 * @param {object} opts  Opções adicionais do fetch
 * @returns {Promise<object>}
 */
async function apiFetch(url, opts = {}) {
  const resp = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`[API] ${resp.status} ${resp.statusText}: ${text}`);
  }
  return resp.json();
}

/**
 * Exibe um toast de notificação temporário.
 * Útil para confirmar ações em tempo real.
 * @param {string} mensagem
 * @param {"success"|"info"|"error"} tipo
 */
function mostrarToast(mensagem, tipo = "info") {
  const container = document.getElementById("flash-container")
    || _criarFlashContainer();

  const icons = {
    success: "fa-check-circle",
    error:   "fa-xmark-circle",
    info:    "fa-info-circle",
  };

  const el = document.createElement("div");
  el.className = `flash flash-${tipo}`;
  el.innerHTML = `
    <i class="fa-solid ${icons[tipo] || icons.info}"></i>
    <span>${mensagem}</span>
    <button class="flash-close" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  container.appendChild(el);

  // Remove automaticamente após 4 segundos
  setTimeout(() => {
    el.style.animation = "slideOutRight 0.4s ease forwards";
    setTimeout(() => el.remove(), 400);
  }, 4000);
}

/** Cria o container de flash se não existir. */
function _criarFlashContainer() {
  const div = document.createElement("div");
  div.id = "flash-container";
  div.className = "flash-container";
  document.body.appendChild(div);
  return div;
}

// Expõe no escopo global
window.socket       = socket;
window.apiFetch     = apiFetch;
window.formatarData = formatarData;
window.hojeISO      = hojeISO;
window.diasAtrasISO = diasAtrasISO;
window.mostrarToast = mostrarToast;
