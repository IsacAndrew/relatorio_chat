/**
 * login.js
 * ──────────────────────────────────────────────────────────────
 * Lógica da tela de login:
 *  - Animação de loading no botão ao submeter
 *  - Toggle de visibilidade da senha
 *  - Enter no campo de usuário foca a senha
 */

// ─────────────────────────────────────────────────────────────
// TOGGLE DE SENHA
// ─────────────────────────────────────────────────────────────

/**
 * Alterna a visibilidade do campo de senha
 * e troca o ícone do olho.
 */
function togglePassword() {
  const campo    = document.getElementById("password");
  const icone    = document.getElementById("eye-icon");

  if (!campo) return;

  if (campo.type === "password") {
    campo.type = "text";
    icone?.classList.replace("fa-eye", "fa-eye-slash");
  } else {
    campo.type = "password";
    icone?.classList.replace("fa-eye-slash", "fa-eye");
  }
}

// ─────────────────────────────────────────────────────────────
// FORMULÁRIO
// ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const form    = document.getElementById("login-form");
  const btnText = document.querySelector(".btn-text");
  const btnLoad = document.querySelector(".btn-loading");
  const btnSub  = document.getElementById("btn-login");

  // Ao submeter, exibe loading no botão
  form?.addEventListener("submit", (e) => {
    const username = document.getElementById("username")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!username || !password) {
      e.preventDefault();
      // Anima os campos vazios
      if (!username) _shakeInput("username");
      if (!password) _shakeInput("password");
      return;
    }

    // Desabilita botão para evitar duplo clique
    if (btnSub) btnSub.disabled = true;
    if (btnText) btnText.style.display = "none";
    if (btnLoad) btnLoad.style.display = "flex";
  });

  // Enter no campo usuário foca a senha
  document.getElementById("username")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      document.getElementById("password")?.focus();
    }
  });

  // Foca automaticamente no campo de usuário
  document.getElementById("username")?.focus();
});

/**
 * Animação de "shake" para campos inválidos.
 * @param {string} id — ID do campo
 */
function _shakeInput(id) {
  const campo = document.getElementById(id);
  if (!campo) return;
  campo.style.borderColor = "var(--danger)";
  campo.style.animation = "none";

  // Cria a animação de shake inline se não existir
  if (!document.getElementById("shake-style")) {
    const style = document.createElement("style");
    style.id = "shake-style";
    style.textContent = `
      @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%,60% { transform: translateX(-6px); }
        40%,80% { transform: translateX(6px); }
      }
    `;
    document.head.appendChild(style);
  }
  campo.style.animation = "shake 0.4s ease";
  setTimeout(() => {
    campo.style.animation = "";
    campo.style.borderColor = "";
  }, 800);
}
