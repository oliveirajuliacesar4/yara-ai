const config = window.YARA_CONFIG || {};
const API_BASE_URL = (config.API_BASE_URL || window.location.origin).replace(/\/$/, "");

const els = {
  aiForm: document.getElementById("aiForm"),
  aiInput: document.getElementById("aiInput"),
  aiResponse: document.getElementById("aiResponse"),
  refreshStatus: document.getElementById("refreshStatus"),
  serverStatus: document.getElementById("serverStatus"),
  serverDetail: document.getElementById("serverDetail"),
  statusDot: document.getElementById("statusDot"),
};

if (window.lucide) {
  window.lucide.createIcons();
}

els.refreshStatus.addEventListener("click", checkHealth);
els.aiForm.addEventListener("submit", handleAskYara);
checkHealth();

async function checkHealth() {
  setStatus("checking", "Verificando...", "Consultando /api/health.");
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Falha no healthcheck.");
    setStatus("online", "Online", "API da YARA respondendo normalmente.");
  } catch (error) {
    setStatus("offline", "Indisponível", "Não foi possível conectar à API agora.");
  }
}

async function handleAskYara(event) {
  event.preventDefault();
  const message = els.aiInput.value.trim();
  if (!message) return;

  renderResponse("Processando", "A YARA está analisando sua solicitação...");
  els.aiInput.value = "";

  try {
    const response = await fetch(`${API_BASE_URL}/api/yara-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        context: {
          product: "YARA AI",
          source: "web",
          timestamp: new Date().toISOString(),
        },
      }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Falha ao chamar a IA.");
    renderResponse("Resposta da YARA", payload.reply || "Resposta recebida.");
  } catch (error) {
    renderResponse("YARA indisponível", error.message);
  }
}

function setStatus(state, title, detail) {
  els.statusDot.dataset.state = state;
  els.serverStatus.textContent = title;
  els.serverDetail.textContent = detail;
}

function renderResponse(title, message) {
  els.aiResponse.innerHTML = `<span>${escapeHtml(title)}</span><p>${escapeHtml(message)}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
