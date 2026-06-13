const STORAGE_KEYS = {
  users: "atlas_one_users",
  session: "atlas_one_session",
  state: "atlas_one_state",
  subscription: "atlas_one_subscription",
};

const API_BASE_URL = (
  window.ATLAS_CONFIG?.API_BASE_URL ||
  window.ATLAS_API_BASE_URL ||
  window.location.origin
).replace(/\/$/, "");

const demoUser = {
  name: "Isis",
  email: "isis@atlas.one",
  password: "atlas123",
};

const pageTitles = {
  dashboard: "Dashboard Inteligente",
  assistant: "Atlas AI",
  atlas: "Meu Atlas",
  health: "Saúde",
  habits: "Hábitos",
  goals: "Metas",
  productivity: "Produtividade",
  finance: "Finanças",
  calendar: "Agenda Inteligente",
  analytics: "Dashboard Analítico",
  plans: "Planos Atlas One",
  reports: "Relatórios",
};

const planCatalog = {
  free: {
    id: "free",
    name: "Atlas Free",
    monthly: 0,
    yearly: 0,
    tagline: "Ideal para novos usuários.",
    button: "Começar Gratuitamente",
    features: [
      "Dashboard básico",
      "Agenda e calendário",
      "Até 20 conversas com IA por dia",
      "Até 10 metas",
      "Até 10 hábitos",
      "Controle financeiro manual",
      "Relatórios básicos",
    ],
    limitations: [
      "Sem Open Finance",
      "Sem PDFs avançados",
      "Sem memória avançada da IA",
      "Sem sincronizações premium",
    ],
  },
  plus: {
    id: "plus",
    name: "Atlas Plus",
    monthly: 24.9,
    yearly: 239.9,
    tag: "Mais Popular",
    tagline: "7 dias grátis. Sem cobrança antecipada.",
    button: "Assinar Atlas Plus",
    popular: true,
    features: [
      "Tudo do Free",
      "Conversas ilimitadas com IA",
      "Memória inteligente",
      "Planos criados automaticamente",
      "Relatórios avançados",
      "Exportação PDF",
      "Metas e hábitos ilimitados",
      "Dashboard avançado",
      "Insights inteligentes",
      "Sincronização completa de calendários",
    ],
  },
  pro: {
    id: "pro",
    name: "Atlas Pro",
    monthly: 49.9,
    yearly: 479.9,
    tag: "Profissionais e Alta Performance",
    tagline: "7 dias grátis para acelerar sua rotina.",
    button: "Assinar Atlas Pro",
    features: [
      "Tudo do Plus",
      "Open Finance",
      "Múltiplas contas bancárias",
      "Análise financeira avançada",
      "IA com contexto expandido",
      "Relatórios executivos",
      "Planejamento financeiro inteligente",
      "Planejamento de carreira",
      "Planejamento de estudos",
      "Planejamento de saúde",
      "Prioridade de processamento da IA",
    ],
  },
  elite: {
    id: "elite",
    name: "Atlas One Elite",
    monthly: 99.9,
    yearly: 999.9,
    tag: "Experiência Completa",
    tagline: "Para quem quer o Atlas no nível máximo.",
    button: "Entrar para o Elite",
    features: [
      "Tudo do Pro",
      "IA premium",
      "Memória de longo prazo expandida",
      "Assistente pessoal avançada",
      "Automações inteligentes",
      "Planejamento anual completo",
      "Relatórios estratégicos completos",
      "Recursos beta antecipados",
      "Atendimento prioritário",
    ],
  },
};

const comparisonRows = [
  ["Dashboard básico", true, true, true, true],
  ["Conversas ilimitadas com IA", false, true, true, true],
  ["Memória inteligente", false, true, true, true],
  ["Exportação PDF", false, true, true, true],
  ["Open Finance", false, false, true, true],
  ["Múltiplas contas bancárias", false, false, true, true],
  ["Relatórios executivos", false, false, true, true],
  ["IA premium e memória expandida", false, false, false, true],
  ["Automações inteligentes", false, false, false, true],
  ["Atendimento prioritário", false, false, false, true],
];

const defaultData = {
  aiEndpoint: `${API_BASE_URL}/api/atlas-ai`,
  events: [
    { id: "ev-1", time: "09:00", title: "Revisar prioridades da semana", type: "Produtividade" },
    { id: "ev-2", time: "15:00", title: "Dentista", type: "Saúde" },
    { id: "ev-3", time: "20:00", title: "Treino funcional", type: "Bem-estar" },
  ],
  reminders: [
    { id: "rem-1", title: "Tomar vitamina D", due: "08:00", critical: false },
    { id: "rem-2", title: "Conta de energia vence hoje", due: "18:00", critical: true },
  ],
  insights: [
    { title: "Sono em recuperação", text: "Seu sono médio subiu para 7h12. Mantenha o horário de dormir por mais 3 dias." },
    { title: "Meta financeira", text: "Você está perto de atingir sua reserva mensal. Faltam R$ 410 para fechar o ciclo." },
    { title: "Produtividade", text: "Você concluiu 85% das tarefas planejadas e rende melhor entre 09h e 11h." },
  ],
  habits: [
    { id: "water", title: "Beber 2L de água", streak: 12, done: true, completion: 86 },
    { id: "reading", title: "Ler 20 minutos", streak: 8, done: false, completion: 72 },
    { id: "study", title: "Estudar inglês", streak: 21, done: true, completion: 91 },
    { id: "training", title: "Treinar", streak: 5, done: false, completion: 64 },
  ],
  goals: [
    { id: "goal-1", title: "Emagrecer 10kg", description: "Foco em treino, água, proteína e sono regular.", progress: 43, deadline: "31 ago", category: "Saúde" },
    { id: "goal-2", title: "Economizar R$5000", description: "Reserva para viagem e fundo de segurança.", progress: 61, deadline: "15 out", category: "Finanças" },
    { id: "goal-3", title: "Estudar 200 horas", description: "Plano de estudo com ciclos semanais e revisão.", progress: 87, deadline: "30 jun", category: "Produtividade" },
  ],
  meds: [
    { name: "Vitamina D", dose: "1 cápsula", schedule: "08:00", status: "Tomado" },
    { name: "Ômega 3", dose: "2 cápsulas", schedule: "13:00", status: "Pendente" },
    { name: "Magnésio", dose: "1 comprimido", schedule: "20:00", status: "Agendado" },
  ],
  healthMetrics: [
    ["Peso", "68,4 kg"],
    ["IMC", "23,1"],
    ["Pressão arterial", "118/76"],
    ["Glicemia", "91 mg/dL"],
    ["Sono", "7h12"],
    ["Água ingerida", "1,6L"],
  ],
  transactions: [
    { id: "tr-1", type: "income", description: "Salário", category: "Salário", amount: 8500, date: todayIso() },
    { id: "tr-2", type: "expense", description: "Aluguel", category: "Aluguel", amount: 1800, date: todayIso() },
    { id: "tr-3", type: "expense", description: "Mercado", category: "Alimentação", amount: 620, date: todayIso() },
    { id: "tr-4", type: "expense", description: "Consulta", category: "Saúde", amount: 280, date: todayIso() },
  ],
  recurring: [
    { id: "rec-1", name: "Internet", amount: 119, frequency: "Mensal" },
    { id: "rec-2", name: "Energia", amount: 218, frequency: "Mensal" },
  ],
  financeGoals: [
    { id: "fg-1", name: "Reserva de emergência", target: 12000, saved: 6850, deadline: "2026-12-31" },
  ],
  openFinanceConnected: false,
  bankAccounts: [],
  tasks: {
    backlog: [
      { id: "task-1", title: "Organizar exames para consulta", priority: "Alta" },
      { id: "task-2", title: "Montar lista de compras", priority: "Média" },
    ],
    doing: [{ id: "task-3", title: "Plano de estudo semanal", priority: "Alta" }],
    done: [{ id: "task-4", title: "Registrar peso da semana", priority: "Baixa" }],
  },
  records: [
    { id: "rec-atlas-1", type: "Plano", title: "Plano financeiro inicial", content: "Reservar R$ 700 no início do mês, reduzir delivery e revisar assinaturas.", createdAt: new Date().toISOString(), done: false },
    { id: "rec-atlas-2", type: "Rotina", title: "Rotina de saúde", content: "Treino 3x por semana, 2L de água por dia e sono antes das 23h.", createdAt: new Date().toISOString(), done: false },
  ],
  payments: [],
  calendarIntegrations: {
    Google: true,
    Outlook: true,
    Apple: false,
  },
};

const state = {
  users: loadJson(STORAGE_KEYS.users, { [demoUser.email]: { name: demoUser.name, password: demoUser.password } }),
  session: loadJson(STORAGE_KEYS.session, null),
  data: mergeData(defaultData, loadJson(STORAGE_KEYS.state, {})),
  subscription: mergeSubscription(loadJson(STORAGE_KEYS.subscription, null)),
  activeSection: "dashboard",
  atlasFilter: "all",
  extractFilter: "month",
  billing: "monthly",
  checkoutPlan: null,
  checkoutStep: 1,
  pomodoroRunning: false,
  pomodoroRemaining: 25 * 60,
  pomodoroInterval: null,
};

const els = mapElements([
  "toast", "authScreen", "appScreen", "loginForm", "signupForm", "toggleAuth", "authSwitchText",
  "loginEmail", "loginPassword", "signupName", "signupEmail", "signupPassword", "loginError",
  "signupError", "demoLogin", "mobileMenu", "pageTitle", "todayLabel", "userName", "userInitial",
  "dashboard-title", "daySummary", "metricEvents", "metricEventsText", "metricReminders",
  "metricRemindersText", "metricBalance", "metricBalanceText", "metricMemories", "todayTimeline",
  "insightList", "habitSnapshot", "goalSnapshot", "financeBars", "achievementList", "chatMessages",
  "aiForm", "aiInput", "aiCreatedItems", "saveAiEndpoint", "aiEndpoint", "sideMemoryCount",
  "atlasTabs", "atlasRecords", "clearAtlasDone", "medicationList", "healthMetrics", "wellnessRings",
  "examUpload", "habitList", "habitCalendar", "habitAchievements", "goalsGrid", "kanbanBoard",
  "pomodoroButton", "pomodoroTimer", "eisenhowerMatrix", "transactionForm", "transactionType",
  "transactionDescription", "transactionCategory", "transactionAmount", "extractList", "recurringForm",
  "recurringName", "recurringAmount", "recurringFrequency", "recurringList", "financeGoalForm",
  "financeGoalName", "financeGoalTarget", "financeGoalSaved", "financeGoalDeadline", "financeGoalList",
  "financeIncome", "financeExpense", "financeTotalBalance", "financeCategoryList", "openFinanceButton",
  "financeInsightButton", "weekPlanner", "calendarIntegrations", "atlasChart", "atlasScore",
  "analyticsModules", "reportForm", "reportType", "reportMonth", "reportYear", "reportRange",
  "plansGrid", "billingToggle", "comparisonBody", "subscriptionSummary", "paymentHistory",
  "gatewayList", "upgradePlanButton", "downgradePlanButton", "cancelPlanButton", "checkoutModal",
  "checkoutTitle", "closeCheckout", "checkoutForm", "checkoutPlanSummary", "checkoutName",
  "checkoutEmail", "checkoutDocument", "paymentMethod", "paymentGateway", "checkoutConfirmation",
  "finishCheckout", "upgradeModal", "upgradeTitle", "upgradeMessage", "closeUpgrade",
  "upgradeModalButton", "stayFreeButton", "accountButton", "accountPanel", "closeAccount",
  "logoutButton", "syncButton", "notificationsButton",
]);

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function mergeData(base, incoming) {
  const merged = { ...base, ...incoming };
  merged.tasks = { ...base.tasks, ...(incoming.tasks || {}) };
  merged.calendarIntegrations = { ...base.calendarIntegrations, ...(incoming.calendarIntegrations || {}) };
  merged.aiEndpoint = `${API_BASE_URL}/api/atlas-ai`;
  Object.keys(base).forEach((key) => {
    if (Array.isArray(base[key]) && !Array.isArray(merged[key])) merged[key] = base[key];
  });
  return merged;
}

function mergeSubscription(incoming) {
  return {
    plan: incoming?.plan || "free",
    billing: incoming?.billing || "monthly",
    status: incoming?.status || "Ativo",
    nextCharge: incoming?.nextCharge || "Sem cobrança",
    paymentMethod: incoming?.paymentMethod || "Nenhum",
    gateway: incoming?.gateway || "Nenhum",
    trialEndsAt: incoming?.trialEndsAt || null,
  };
}

function mapElements(ids) {
  return ids.reduce((acc, key) => {
    const domId = key === "dashboard-title" ? "dashboard-title" : key;
    const prop = key === "dashboard-title" ? "dashboardTitle" : key;
    acc[prop] = document.getElementById(domId);
    return acc;
  }, {});
}

function saveAll() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
  localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state.data));
  localStorage.setItem(STORAGE_KEYS.subscription, JSON.stringify(state.subscription));
  if (state.session) localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(state.session));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function icon(name) {
  return `<i data-lucide="${name}"></i>`;
}

function renderIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");
  window.clearTimeout(els.toast._timer);
  els.toast._timer = window.setTimeout(() => els.toast.classList.add("hidden"), 3200);
}

function normalize(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function currentName() {
  return state.session?.name || demoUser.name;
}

function setError(element, message) {
  element.textContent = message;
  if (message) window.setTimeout(() => (element.textContent = ""), 3600);
}

function login(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  const user = state.users[cleanEmail];
  if (!user || user.password !== password.trim()) {
    setError(els.loginError, "Email ou senha inválidos.");
    return;
  }
  state.session = { email: cleanEmail, name: user.name };
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(state.session));
  openApp();
}

function signup(name, email, password) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanName || !cleanEmail || password.trim().length < 6) {
    setError(els.signupError, "Informe nome, email e senha com pelo menos 6 caracteres.");
    return;
  }
  if (state.users[cleanEmail]) {
    setError(els.signupError, "Este email já possui uma conta.");
    return;
  }
  state.users[cleanEmail] = { name: cleanName, password: password.trim() };
  state.session = { email: cleanEmail, name: cleanName };
  saveAll();
  openApp();
}

function openApp() {
  els.authScreen.classList.add("hidden");
  els.appScreen.classList.remove("hidden");
  updateIdentity();
  navigateTo(state.activeSection);
  renderAll();
}

function logout() {
  state.session = null;
  localStorage.removeItem(STORAGE_KEYS.session);
  els.accountPanel.classList.add("hidden");
  els.appScreen.classList.add("hidden");
  els.authScreen.classList.remove("hidden");
}

function updateIdentity() {
  const name = currentName();
  els.userName.textContent = name;
  els.userInitial.textContent = name.charAt(0).toUpperCase();
  els.dashboardTitle.textContent = `Bom dia, ${name}.`;
  els.todayLabel.textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date());
}

function navigateTo(sectionName) {
  state.activeSection = sectionName;
  document.querySelectorAll(".app-section").forEach((section) => section.classList.toggle("active", section.id === sectionName));
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.section === sectionName));
  els.pageTitle.textContent = pageTitles[sectionName] || "Atlas One";
  document.body.classList.remove("menu-open");
  renderIcons();
}

function getFinanceSummary() {
  const income = state.data.transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = state.data.transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  return { income, expense, balance: income - expense };
}

function getPlanRank(plan = state.subscription.plan) {
  return { free: 0, plus: 1, pro: 2, elite: 3 }[plan] ?? 0;
}

function requirePlan(minPlan, featureName) {
  if (getPlanRank() >= getPlanRank(minPlan)) return true;
  const plan = planCatalog[minPlan];
  els.upgradeTitle.textContent = "Recurso premium";
  els.upgradeMessage.textContent = `${featureName} está disponível no ${plan.name}. Faça upgrade para desbloquear este recurso.`;
  els.upgradeModalButton.dataset.targetPlan = minPlan;
  els.upgradeModal.classList.remove("hidden");
  return false;
}

function progressRow(title, subtitle, progress, iconName) {
  return `
    <div class="stack-row">
      <div class="stack-row-icon">${icon(iconName)}</div>
      <div style="flex:1">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(subtitle)}</p>
        <div class="progress-track" style="margin-top:10px"><span style="width:${Math.min(progress, 100)}%"></span></div>
      </div>
      <strong>${Math.round(progress)}%</strong>
    </div>
  `;
}

function addRecord(type, title, content, extra = {}) {
  const record = { id: id("atlas"), type, title, content, createdAt: new Date().toISOString(), done: false, ...extra };
  state.data.records.push(record);
  saveAll();
  return record;
}

function renderDashboard() {
  const summary = getFinanceSummary();
  const weeklyGoal = state.data.goals.length ? Math.round(state.data.goals.reduce((sum, goal) => sum + Number(goal.progress || 0), 0) / state.data.goals.length) : 0;
  els.metricEvents.textContent = state.data.events.length;
  els.metricEventsText.textContent = state.data.events[0] ? `Próximo: ${state.data.events[0].title} às ${state.data.events[0].time}` : "Nenhum compromisso hoje";
  els.metricReminders.textContent = state.data.reminders.length;
  els.metricRemindersText.textContent = `${state.data.reminders.filter((item) => item.critical).length} alerta crítico hoje`;
  els.metricBalance.textContent = money(summary.balance);
  els.metricBalanceText.textContent = summary.balance >= 0 ? "Saldo positivo no mês" : "Atenção ao saldo mensal";
  els.metricMemories.textContent = state.data.records.length;
  els.sideMemoryCount.textContent = `${state.data.records.length} memórias`;
  els.daySummary.textContent = `Hoje você possui ${state.data.events.length} compromissos, ${state.data.reminders.length} lembretes, ${state.data.habits.filter((h) => h.done).length} hábitos concluídos e ${weeklyGoal}% de progresso médio nas metas.`;

  els.todayTimeline.innerHTML = [...state.data.events, ...state.data.reminders.map((item) => ({ time: item.due, title: item.title, type: item.critical ? "Alerta" : "Lembrete" }))]
    .sort((a, b) => String(a.time).localeCompare(String(b.time)))
    .map((item) => `<div class="timeline-item"><span class="timeline-time">${escapeHtml(item.time)}</span><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.type)}</p></div></div>`)
    .join("") || `<div class="empty-state">Nenhum movimento hoje.</div>`;

  els.insightList.innerHTML = buildContextInsights().map((item) => `<div class="insight-card"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.text)}</p></div>`).join("");
  els.habitSnapshot.innerHTML = state.data.habits.slice(0, 3).map((habit) => progressRow(habit.title, `${habit.streak} dias de sequência`, habit.completion, "repeat-2")).join("");
  els.goalSnapshot.innerHTML = state.data.goals.slice(0, 3).map((goal) => progressRow(goal.title, `Prazo: ${goal.deadline}`, goal.progress, "target")).join("");
  renderFinanceBars();
  els.achievementList.innerHTML = ["21 dias estudando", "Sono consistente", "Orçamento revisado"].map((item) => `<div class="achievement">${icon("badge-check")} ${escapeHtml(item)}</div>`).join("");
}

function buildContextInsights() {
  const summary = getFinanceSummary();
  const habitsDone = state.data.habits.filter((habit) => habit.done).length;
  return [
    { title: "Visão do mês", text: `Saldo atual de ${money(summary.balance)} com ${state.data.goals.length} metas ativas e ${state.data.records.length} registros na memória.` },
    { title: "Hábitos", text: `Você concluiu ${habitsDone} de ${state.data.habits.length} hábitos hoje. Manter sequência aumenta o Índice Atlas.` },
    { title: "Finanças", text: summary.balance > 0 ? "Você está positivo no mês. Considere direcionar parte do saldo para sua meta financeira." : "Seu saldo está negativo. Revise gastos variáveis e recorrências." },
  ];
}

function renderFinanceBars() {
  const expenses = state.data.transactions.filter((item) => item.type === "expense");
  const byCategory = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});
  const max = Math.max(1, ...Object.values(byCategory));
  els.financeBars.innerHTML = Object.entries(byCategory).map(([category, value]) => `
    <div class="bar-row">
      <span>${escapeHtml(category)}</span>
      <div class="bar-fill"><span style="width:${Math.max(8, (value / max) * 100)}%"></span></div>
      <strong>${money(value)}</strong>
    </div>
  `).join("") || `<div class="empty-state">Sem despesas cadastradas.</div>`;
}

function renderAssistant() {
  if (!els.chatMessages.dataset.ready) {
    els.chatMessages.dataset.ready = "true";
    addChatMessage("ai", "Olá. Sou o Atlas AI. Posso responder perguntas, criar planos, metas, rotinas, eventos, relatórios e consultar seus dados já registrados.");
  }
  els.aiEndpoint.value = state.data.aiEndpoint || "";
  els.aiCreatedItems.innerHTML = state.data.records.slice(-6).reverse().map((item) => `
    <div class="stack-row">
      <div><strong>${escapeHtml(item.type)}</strong><p>${escapeHtml(item.title)}</p></div>
      ${icon("check-circle-2")}
    </div>
  `).join("") || `<div class="empty-state">Nenhuma memória criada ainda.</div>`;
}

function addChatMessage(role, text) {
  const message = document.createElement("div");
  message.className = `message ${role}`;
  message.innerHTML = `<div class="message-bubble">${escapeHtml(text)}</div>`;
  els.chatMessages.appendChild(message);
  els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
}

async function handleAiCommand(rawText) {
  const text = rawText.trim();
  if (!text) return;
  addChatMessage("user", text);

  let response = "";
  if (state.data.aiEndpoint) {
    try {
      const res = await fetch(state.data.aiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context: buildAiContext() }),
      });
      if (res.ok) {
        const payload = await res.json();
        applyAtlasAiPayload(payload);
        response = payload.reply || payload.message || "";
      } else {
        const payload = await res.json().catch(() => ({}));
        toast(payload.error || "Atlas AI real indisponível. Usando resposta local.");
      }
    } catch {
      response = "";
    }
  }

  if (!response) response = localAiResponse(text);
  addChatMessage("ai", response);
  saveAll();
  renderAll();
}

function applyAtlasAiPayload(payload) {
  const records = Array.isArray(payload.records) ? payload.records : [];
  records.forEach((record) => {
    addRecord(record.type || "Plano", record.title || "Registro Atlas AI", record.content || payload.reply || "Conteúdo criado pela IA.");
  });

  const actions = payload.actions || {};
  (actions.goals || []).forEach((goal) => {
    state.data.goals.push({
      id: id("goal"),
      title: goal.title || "Meta criada pela IA",
      description: goal.description || "Meta criada pela Atlas AI.",
      progress: Number(goal.progress || 0),
      deadline: goal.deadline || "90 dias",
      category: goal.category || "Atlas AI",
    });
  });
  (actions.reminders || []).forEach((reminder) => {
    state.data.reminders.push({
      id: id("rem"),
      title: reminder.title || "Lembrete criado pela IA",
      due: reminder.due || "09:00",
      critical: Boolean(reminder.critical),
    });
  });
  (actions.events || []).forEach((event) => {
    state.data.events.push({
      id: id("ev"),
      title: event.title || "Evento criado pela IA",
      time: event.time || "10:00",
      type: event.type || "Agenda",
    });
  });
  (actions.tasks || []).forEach((task) => {
    state.data.tasks.backlog.push({
      id: id("task"),
      title: task.title || "Tarefa criada pela IA",
      priority: task.priority || "Média",
    });
  });
}

function buildAiContext() {
  return {
    user: currentName(),
    subscription: state.subscription,
    finance: getFinanceSummary(),
    goals: state.data.goals,
    habits: state.data.habits,
    records: state.data.records.slice(-12),
    events: state.data.events,
    reminders: state.data.reminders,
  };
}

function localAiResponse(text) {
  const n = normalize(text);
  if (n.includes("como estou indo") || n.includes("meu mes")) {
    const s = getFinanceSummary();
    const content = `Resumo do mês: saldo ${money(s.balance)}, ${state.data.goals.length} metas ativas, ${state.data.habits.filter((h) => h.done).length} hábitos concluídos hoje e ${state.data.events.length} eventos na agenda.`;
    addRecord("Relatório", "Resumo inteligente do mês", content);
    return content;
  }
  if (n.includes("rotina") || n.includes("academia") || n.includes("treino")) {
    const content = "Treino 3x por semana, caminhada leve nos dias livres, 2L de água, proteína nas refeições e revisão semanal de evolução.";
    addRecord("Rotina", "Rotina de academia", content);
    return `Rotina criada e salva no Meu Atlas: ${content}`;
  }
  if (n.includes("financeiro") || n.includes("economizar")) {
    const content = "Reservar 15% da renda no início do mês, limitar delivery, revisar assinaturas e acompanhar gastos fixos semanalmente.";
    addRecord("Plano", "Plano financeiro", content);
    return `Plano financeiro salvo no Meu Atlas: ${content}`;
  }
  if (n.includes("estudo")) {
    const content = "Blocos de 45 minutos, revisão espaçada, simulados aos sábados e meta semanal de 5 horas.";
    addRecord("Plano", "Plano de estudo", content);
    return `Plano de estudo salvo: ${content}`;
  }
  if (n.includes("meta")) {
    const title = n.includes("emagrecer") ? "Meta para emagrecer" : "Meta criada pelo Atlas AI";
    state.data.goals.push({ id: id("goal"), title, description: "Meta criada pela IA com acompanhamento semanal.", progress: 10, deadline: "90 dias", category: "Atlas AI" });
    addRecord("Meta", title, "Meta registrada com progresso inicial de 10% e revisão semanal.");
    return "Meta criada, salva no Meu Atlas e adicionada ao módulo de Metas.";
  }
  if (n.includes("lembre") || n.includes("remedio")) {
    const time = text.match(/\b\d{1,2}h\b|\b\d{1,2}:\d{2}\b/)?.[0]?.replace("h", ":00") || "20:00";
    state.data.reminders.push({ id: id("rem"), title: "Tomar remédio", due: time, critical: true });
    addRecord("Evento", "Lembrete de medicamento", `Tomar remédio às ${time}.`);
    return `Lembrete criado para ${time} e salvo no Meu Atlas.`;
  }
  if (n.includes("marque") || n.includes("reuniao") || n.includes("dentista")) {
    const title = n.includes("dentista") ? "Dentista" : "Reunião";
    const time = text.match(/\b\d{1,2}h\b|\b\d{1,2}:\d{2}\b/)?.[0]?.replace("h", ":00") || "10:00";
    state.data.events.push({ id: id("ev"), time, title, type: "Agenda" });
    addRecord("Evento", title, `${title} agendado às ${time}.`);
    return `${title} agendado às ${time} e salvo na Central Atlas.`;
  }
  if (n.includes("relatorio")) {
    const content = "Relatório gerado com visão de saúde, hábitos, finanças, metas e produtividade.";
    addRecord("Relatório", "Relatório Atlas AI", content);
    return `${content} Você pode exportar em PDF na seção Relatórios se estiver no Atlas Plus ou superior.`;
  }
  addRecord("Plano", "Solicitação registrada", text);
  return "Registrei sua solicitação no Meu Atlas e gerei um próximo passo para acompanhamento.";
}

function renderAtlas() {
  const records = state.data.records.filter((record) => state.atlasFilter === "all" || record.type === state.atlasFilter);
  els.atlasRecords.innerHTML = records.map((record) => `
    <article class="record-card">
      <header><div><span class="record-badge">${escapeHtml(record.type)}</span><h3>${escapeHtml(record.title)}</h3></div></header>
      <p>${escapeHtml(record.content)}</p>
      <p>${new Date(record.createdAt).toLocaleString("pt-BR")}${record.done ? " • Concluído" : ""}</p>
      <div class="record-actions">
        <button class="mini-action" data-record-edit="${record.id}" type="button">Editar</button>
        <button class="mini-action" data-record-done="${record.id}" type="button">${record.done ? "Reabrir" : "Concluir"}</button>
        <button class="mini-action danger" data-record-delete="${record.id}" type="button">Excluir</button>
      </div>
    </article>
  `).join("") || `<div class="empty-state">Nenhum registro nesta categoria.</div>`;
}

function renderHealth() {
  els.medicationList.innerHTML = state.data.meds.map((med) => `<div class="table-row"><div><strong>${escapeHtml(med.name)}</strong><p>${escapeHtml(med.dose)} • ${escapeHtml(med.schedule)}</p></div><span>${escapeHtml(med.status)}</span></div>`).join("");
  els.healthMetrics.innerHTML = state.data.healthMetrics.map(([label, value]) => `<div class="metric-line"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  els.wellnessRings.innerHTML = [{ label: "Água", value: "80%" }, { label: "Sono", value: "72%" }].map((ring) => `<div class="ring"><strong style="--value:${ring.value}">${ring.value}</strong><span>${ring.label}</span></div>`).join("");
}

function renderHabits() {
  els.habitList.innerHTML = state.data.habits.map((habit) => `<div class="habit-row ${habit.done ? "done" : ""}"><div><strong>${escapeHtml(habit.title)}</strong><p>${habit.streak} dias de sequência • ${habit.completion}% de consistência</p></div><button type="button" data-habit="${habit.id}" aria-label="Alternar hábito">${icon(habit.done ? "check" : "circle")}</button></div>`).join("");
  els.habitCalendar.innerHTML = Array.from({ length: 21 }, (_, index) => `<div class="mini-day ${index % 3 !== 1 ? "done" : ""}">${index + 1}</div>`).join("");
  els.habitAchievements.innerHTML = ["Leitura consistente", "Semana hidratada", "Treino retomado", "Estudo nível ouro"].map((item) => `<div class="achievement">${icon("trophy")} ${escapeHtml(item)}</div>`).join("");
}

function renderGoals() {
  els.goalsGrid.innerHTML = state.data.goals.map((goal) => `<article class="goal-card"><header><div><h3>${escapeHtml(goal.title)}</h3><p>${escapeHtml(goal.description)}</p></div><span class="goal-percent">${goal.progress}%</span></header><div class="progress-track"><span style="width:${goal.progress}%"></span></div><p><strong>${escapeHtml(goal.category)}</strong> • Prazo: ${escapeHtml(goal.deadline)}</p></article>`).join("");
}

function renderProductivity() {
  const columns = [["backlog", "A fazer"], ["doing", "Em andamento"], ["done", "Concluído"]];
  els.kanbanBoard.innerHTML = columns.map(([key, label]) => `<div class="kanban-column"><h4>${label}</h4>${state.data.tasks[key].map((task) => `<div class="task-card"><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.priority)}</span></div>`).join("")}</div>`).join("");
  els.eisenhowerMatrix.innerHTML = [["Fazer agora", "Dentista, conta de energia, revisão do orçamento."], ["Agendar", "Treino, estudo, consulta de rotina."], ["Delegar", "Compras recorrentes e pesquisas simples."], ["Eliminar", "Reuniões sem pauta e notificações duplicadas."]].map(([title, text]) => `<div class="matrix-cell"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div>`).join("");
}

function renderFinance() {
  const summary = getFinanceSummary();
  els.financeIncome.textContent = money(summary.income);
  els.financeExpense.textContent = money(summary.expense);
  els.financeTotalBalance.textContent = money(summary.balance);
  els.transactionCategory.innerHTML = getCategories(els.transactionType.value).map((cat) => `<option>${cat}</option>`).join("");
  renderExtract();
  els.recurringList.innerHTML = state.data.recurring.map((item) => `<div class="stack-row"><div><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.frequency)}</p></div><strong>${money(item.amount)}</strong></div>`).join("") || `<div class="empty-state">Sem gastos fixos.</div>`;
  els.financeGoalList.innerHTML = state.data.financeGoals.map((goal) => {
    const progress = Math.min(100, (goal.saved / goal.target) * 100);
    return progressRow(goal.name, `Restante: ${money(goal.target - goal.saved)} • Prazo: ${goal.deadline}`, progress, "piggy-bank");
  }).join("") || `<div class="empty-state">Sem metas financeiras.</div>`;
  renderFinanceCategoryList();
}

function getCategories(type) {
  return type === "income"
    ? ["Salário", "Freelance", "Comissão", "Benefícios", "Outros"]
    : ["Aluguel", "Água", "Energia", "Internet", "Transporte", "Alimentação", "Saúde", "Educação", "Outros"];
}

function renderExtract() {
  const now = new Date();
  const filtered = state.data.transactions.filter((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    if (state.extractFilter === "today") return item.date === todayIso();
    if (state.extractFilter === "week") return (now - date) / 86400000 <= 7;
    if (state.extractFilter === "month") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    return true;
  });
  els.extractList.innerHTML = filtered.slice().reverse().map((item) => `<div class="extract-row"><div><strong>${escapeHtml(item.description)}</strong><p>${escapeHtml(item.category)} • ${new Date(`${item.date}T00:00:00`).toLocaleDateString("pt-BR")}</p></div><span class="${item.type === "income" ? "money-in" : "money-out"}">${item.type === "income" ? "+" : "-"} ${money(item.amount)}</span><button class="mini-action danger" data-transaction-delete="${item.id}" type="button">Excluir</button></div>`).join("") || `<div class="empty-state">Nenhuma transação no filtro.</div>`;
}

function renderFinanceCategoryList() {
  const expenses = state.data.transactions.filter((item) => item.type === "expense");
  const byCategory = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});
  const max = Math.max(1, ...Object.values(byCategory));
  els.financeCategoryList.innerHTML = Object.entries(byCategory).map(([category, value]) => `<div class="finance-category-row"><strong>${escapeHtml(category)}</strong><div class="bar-fill"><span style="width:${Math.max(8, (value / max) * 100)}%"></span></div><span>${money(value)}</span></div>`).join("") || `<div class="empty-state">Sem despesas categorizadas.</div>`;
}

function renderCalendar() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  els.weekPlanner.innerHTML = days.map((day, index) => `<div class="week-day"><strong>${day}</strong>${state.data.events.filter((_, i) => i % 5 === index).map((event) => `<div class="week-event">${escapeHtml(event.time)} ${escapeHtml(event.title)}</div>`).join("") || `<div class="week-event">Livre</div>`}</div>`).join("");
  els.calendarIntegrations.innerHTML = Object.entries(state.data.calendarIntegrations).map(([name, connected]) => `<div><i data-lucide="${name === "Apple" ? "smartphone" : name === "Outlook" ? "mail" : "calendar"}"></i><span>${name} Calendar</span><strong>${connected ? "Ativo" : "Pendente"}</strong><button class="mini-action" data-calendar="${name}" type="button">${connected ? "Desconectar" : "Conectar"}</button></div>`).join("");
}

function renderAnalytics() {
  const score = Math.min(98, Math.max(55, 65 + state.data.habits.filter((h) => h.done).length * 5 + Math.round(getFinanceSummary().balance / 1000)));
  els.atlasScore.textContent = score;
  const values = [72, 78, 74, 83, score - 3, score - 1, score];
  els.atlasChart.innerHTML = values.map((value, index) => {
    const left = 6 + index * 14;
    const height = value * 2.7;
    return `<span class="chart-bar" style="left:${left}%;height:${height}px"></span><span class="chart-point" style="left:calc(${left + 4.5}% - 6px);bottom:${height + 12}px"></span>`;
  }).join("");
  els.analyticsModules.innerHTML = [["Saúde", "82%", "Sono e hidratação em alta"], ["Hábitos", `${state.data.habits.filter((h) => h.done).length}/${state.data.habits.length}`, "Hábitos concluídos hoje"], ["Produtividade", "76%", "Pico de foco às 09h"], ["Finanças", money(getFinanceSummary().balance), "Saldo mensal"], ["Metas", `${state.data.goals.length}`, "Metas em andamento"]].map(([title, value, detail]) => `<div class="analytics-card"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong><p>${escapeHtml(detail)}</p></div>`).join("");
}

function renderReports() {
  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  els.reportMonth.innerHTML = months.map((month, index) => `<option value="${index + 1}">${month}</option>`).join("");
  els.reportMonth.value = String(new Date().getMonth() + 1);
  els.reportYear.value = new Date().getFullYear();
}

function renderPlans() {
  els.plansGrid.innerHTML = Object.values(planCatalog).map((plan) => {
    const price = state.billing === "yearly" ? plan.yearly : plan.monthly;
    const period = state.billing === "yearly" ? "/ano" : "/mês";
    const isCurrent = state.subscription.plan === plan.id;
    return `
      <article class="plan-card ${plan.popular ? "popular" : ""}">
        ${plan.tag ? `<span class="plan-tag">${escapeHtml(plan.tag)}</span>` : ""}
        <div><h3>${escapeHtml(plan.name)}</h3><p>${escapeHtml(plan.tagline)}</p></div>
        <div class="plan-price"><strong>${money(price)}</strong><span>${period}</span></div>
        ${plan.id === "plus" && state.billing === "yearly" ? `<p class="plan-annual">20% de desconto anual</p>` : ""}
        ${["plus", "pro"].includes(plan.id) ? `<p class="plan-annual">7 dias grátis, sem cobrança antecipada</p>` : ""}
        <button class="button ${plan.popular ? "button-primary" : "button-soft"}" data-plan-select="${plan.id}" type="button">${isCurrent ? "Plano atual" : escapeHtml(plan.button)}</button>
        <ul>${plan.features.map((feature) => `<li>${icon("check")} ${escapeHtml(feature)}</li>`).join("")}</ul>
        ${plan.limitations ? `<ul class="plan-limitations">${plan.limitations.map((feature) => `<li>${icon("minus-circle")} ${escapeHtml(feature)}</li>`).join("")}</ul>` : ""}
      </article>
    `;
  }).join("");

  els.comparisonBody.innerHTML = comparisonRows.map((row) => `<tr><td>${escapeHtml(row[0])}</td>${row.slice(1).map((value) => `<td>${value ? `<span class="comparison-check">✓</span>` : `<span class="comparison-minus">-</span>`}</td>`).join("")}</tr>`).join("");
  renderSubscription();
}

function renderSubscription() {
  const plan = planCatalog[state.subscription.plan];
  els.subscriptionSummary.innerHTML = `
    <div><span>Plano atual</span><strong>${escapeHtml(plan.name)}</strong></div>
    <div><span>Próxima cobrança</span><strong>${escapeHtml(state.subscription.nextCharge)}</strong></div>
    <div><span>Método</span><strong>${escapeHtml(state.subscription.paymentMethod)}</strong></div>
    <div><span>Status</span><strong>${escapeHtml(state.subscription.status)}</strong></div>
  `;
  els.paymentHistory.innerHTML = state.data.payments.slice().reverse().map((payment) => `<div class="stack-row"><div><strong>${escapeHtml(payment.plan)}</strong><p>${escapeHtml(payment.date)} • ${escapeHtml(payment.gateway)}</p></div><strong>${money(payment.amount)}</strong></div>`).join("") || `<div class="empty-state">Nenhum pagamento registrado.</div>`;
  els.gatewayList.innerHTML = ["Mercado Pago", "Asaas", "Stripe"].map((gateway) => `<div><i data-lucide="landmark"></i><span>${gateway}</span><strong>Preparado</strong></div>`).join("");
}

function renderAll() {
  renderDashboard();
  renderAssistant();
  renderAtlas();
  renderHealth();
  renderHabits();
  renderGoals();
  renderProductivity();
  renderFinance();
  renderCalendar();
  renderAnalytics();
  renderReports();
  renderPlans();
  updatePomodoroTimer();
  renderIcons();
}

function openCheckout(planId) {
  const plan = planCatalog[planId];
  state.checkoutPlan = planId;
  state.checkoutStep = 1;
  els.checkoutTitle.textContent = plan.id === "free" ? "Ativar Atlas Free" : `Assinar ${plan.name}`;
  els.checkoutName.value = currentName();
  els.checkoutEmail.value = state.session?.email || demoUser.email;
  renderCheckoutStep();
  els.checkoutModal.classList.remove("hidden");
}

function renderCheckoutStep() {
  const plan = planCatalog[state.checkoutPlan];
  const price = state.billing === "yearly" ? plan.yearly : plan.monthly;
  els.checkoutPlanSummary.innerHTML = `<strong>${escapeHtml(plan.name)}</strong><p>${money(price)} ${state.billing === "yearly" ? "por ano" : "por mês"}</p><p>${escapeHtml(plan.tagline)}</p>`;
  document.querySelectorAll("[data-checkout-step]").forEach((step) => step.classList.toggle("active", Number(step.dataset.checkoutStep) === state.checkoutStep));
  document.querySelectorAll("[data-step-label]").forEach((label) => label.classList.toggle("active", Number(label.dataset.stepLabel) <= state.checkoutStep));
}

function completeCheckout() {
  const plan = planCatalog[state.checkoutPlan];
  const amount = state.billing === "yearly" ? plan.yearly : plan.monthly;
  state.subscription = {
    plan: plan.id,
    billing: state.billing,
    status: plan.id === "free" ? "Ativo" : "Teste grátis ativo",
    nextCharge: plan.id === "free" ? "Sem cobrança" : datePlusDays(7),
    paymentMethod: plan.id === "free" ? "Nenhum" : els.paymentMethod.value,
    gateway: plan.id === "free" ? "Nenhum" : els.paymentGateway.value,
    trialEndsAt: ["plus", "pro"].includes(plan.id) ? datePlusDays(7) : null,
  };
  if (plan.id !== "free") {
    state.data.payments.push({ id: id("pay"), plan: plan.name, amount, gateway: els.paymentGateway.value, date: new Date().toLocaleDateString("pt-BR"), status: "Teste grátis" });
    fetch(`${API_BASE_URL}/api/payments/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: plan.id,
        billing: state.billing,
        amount,
        method: els.paymentMethod.value,
        gateway: els.paymentGateway.value,
        customer: {
          name: els.checkoutName.value,
          email: els.checkoutEmail.value,
          document: els.checkoutDocument.value,
        },
      }),
    })
      .then((res) => res.json().catch(() => ({})))
      .then((payload) => {
        if (payload.checkoutUrl) window.location.href = payload.checkoutUrl;
      })
      .catch(() => {});
  }
  saveAll();
  els.checkoutConfirmation.textContent = `${plan.name} ativado. ${plan.id === "free" ? "Você está no plano gratuito." : "Seu teste grátis de 7 dias começou."}`;
  renderAll();
}

function datePlusDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("pt-BR");
}

function generateReport() {
  if (!requirePlan("plus", "Exportação PDF avançada")) return;
  const type = els.reportType.value;
  const summary = getFinanceSummary();
  const reportHtml = `
    <html><head><title>Relatório Atlas One</title><link href="style.css" rel="stylesheet"></head>
    <body><main class="print-report">
      <div class="report-logo"><div><h1>Atlas One</h1><p>Relatório ${escapeHtml(type)} • ${escapeHtml(els.reportMonth.options[els.reportMonth.selectedIndex].text)} ${escapeHtml(els.reportYear.value)}</p></div><strong>Personal OS</strong></div>
      <div class="report-grid">
        <div class="report-box"><span>Receitas</span><h2>${money(summary.income)}</h2></div>
        <div class="report-box"><span>Despesas</span><h2>${money(summary.expense)}</h2></div>
        <div class="report-box"><span>Saldo</span><h2>${money(summary.balance)}</h2></div>
      </div>
      <h2>Resumo Atlas AI</h2><p>${escapeHtml(buildContextInsights()[0].text)}</p>
      <table><thead><tr><th>Item</th><th>Categoria</th><th>Valor</th></tr></thead><tbody>
        ${state.data.transactions.map((item) => `<tr><td>${escapeHtml(item.description)}</td><td>${escapeHtml(item.category)}</td><td>${money(item.amount)}</td></tr>`).join("")}
      </tbody></table>
    </main><script>window.print();</script></body></html>`;
  const win = window.open("", "_blank");
  win.document.write(reportHtml);
  win.document.close();
  addRecord("Relatório", `Relatório ${type}`, `Relatório exportado para PDF em ${new Date().toLocaleDateString("pt-BR")}.`);
  saveAll();
  toast("Relatório aberto para impressão em PDF.");
}

async function connectOpenFinance() {
  if (!requirePlan("pro", "Open Finance")) return;
  try {
    const res = await fetch(`${API_BASE_URL}/api/open-finance/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: state.session?.email || demoUser.email }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      toast(payload.setup || "Open Finance em fase de integração.");
      addRecord("Relatório", "Open Finance em fase de integração", "Este recurso depende de provedor credenciado e consentimento bancário em produção.");
      renderAll();
      return;
    }
  } catch {
    toast("Open Finance em fase de integração.");
    addRecord("Relatório", "Open Finance em fase de integração", "Backend ou provedor Open Finance indisponível no momento.");
    renderAll();
    return;
  }
  state.data.openFinanceConnected = true;
  addRecord("Relatório", "Open Finance autorizado", "Consentimento iniciado pelo provedor credenciado. A sincronização real deve ocorrer pelo backend de produção.");
  saveAll();
  renderAll();
  toast("Open Finance autorizado pelo provedor.");
}

function togglePomodoro() {
  state.pomodoroRunning = !state.pomodoroRunning;
  if (state.pomodoroRunning) {
    if (state.pomodoroRemaining === 0) state.pomodoroRemaining = 25 * 60;
    els.pomodoroButton.innerHTML = `${icon("pause")} Pausar`;
    state.pomodoroInterval = window.setInterval(() => {
      state.pomodoroRemaining = Math.max(0, state.pomodoroRemaining - 1);
      updatePomodoroTimer();
      if (state.pomodoroRemaining === 0) {
        window.clearInterval(state.pomodoroInterval);
        state.pomodoroRunning = false;
        els.pomodoroButton.innerHTML = `${icon("rotate-ccw")} Reiniciar`;
        addRecord("Relatório", "Pomodoro concluído", "Ciclo de foco finalizado com sucesso.");
        renderAll();
      }
    }, 1000);
  } else {
    window.clearInterval(state.pomodoroInterval);
    els.pomodoroButton.innerHTML = `${icon("play")} Iniciar`;
  }
  renderIcons();
}

function updatePomodoroTimer() {
  const minutes = Math.floor(state.pomodoroRemaining / 60).toString().padStart(2, "0");
  const seconds = (state.pomodoroRemaining % 60).toString().padStart(2, "0");
  els.pomodoroTimer.textContent = `${minutes}:${seconds}`;
}

function bindEvents() {
  els.loginForm.addEventListener("submit", (event) => { event.preventDefault(); login(els.loginEmail.value, els.loginPassword.value); });
  els.signupForm.addEventListener("submit", (event) => { event.preventDefault(); signup(els.signupName.value, els.signupEmail.value, els.signupPassword.value); });
  els.demoLogin.addEventListener("click", () => login(demoUser.email, demoUser.password));
  els.toggleAuth.addEventListener("click", () => {
    const signupVisible = !els.signupForm.classList.contains("hidden");
    els.signupForm.classList.toggle("hidden", signupVisible);
    els.loginForm.classList.toggle("hidden", !signupVisible);
    els.authSwitchText.textContent = signupVisible ? "Ainda não tem conta?" : "Já tem conta?";
    els.toggleAuth.textContent = signupVisible ? "Criar conta" : "Entrar";
  });
  els.mobileMenu.addEventListener("click", () => document.body.classList.toggle("menu-open"));
  els.accountButton.addEventListener("click", () => els.accountPanel.classList.remove("hidden"));
  els.closeAccount.addEventListener("click", () => els.accountPanel.classList.add("hidden"));
  els.logoutButton.addEventListener("click", logout);
  els.syncButton.addEventListener("click", () => { addRecord("Relatório", "Sincronização manual", "Dados locais sincronizados e insights recalculados."); renderAll(); toast("Dados sincronizados."); });
  els.notificationsButton.addEventListener("click", () => { navigateTo("atlas"); toast("Notificações registradas na Central Atlas."); });
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => navigateTo(button.dataset.section)));
  els.aiForm.addEventListener("submit", (event) => { event.preventDefault(); const text = els.aiInput.value; els.aiInput.value = ""; handleAiCommand(text); });
  els.saveAiEndpoint.addEventListener("click", () => { state.data.aiEndpoint = els.aiEndpoint.value.trim(); saveAll(); toast("Endpoint de IA salvo."); });
  els.pomodoroButton.addEventListener("click", togglePomodoro);
  els.transactionType.addEventListener("change", () => renderFinance());
  els.transactionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.data.transactions.push({ id: id("tr"), type: els.transactionType.value, description: els.transactionDescription.value, category: els.transactionCategory.value, amount: Number(els.transactionAmount.value), date: todayIso() });
    els.transactionForm.reset();
    saveAll();
    renderAll();
  });
  els.recurringForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.data.recurring.push({ id: id("rec"), name: els.recurringName.value, amount: Number(els.recurringAmount.value), frequency: els.recurringFrequency.value });
    els.recurringForm.reset();
    saveAll();
    renderAll();
  });
  els.financeGoalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    state.data.financeGoals.push({ id: id("fg"), name: els.financeGoalName.value, target: Number(els.financeGoalTarget.value), saved: Number(els.financeGoalSaved.value), deadline: els.financeGoalDeadline.value });
    els.financeGoalForm.reset();
    saveAll();
    renderAll();
  });
  els.openFinanceButton.addEventListener("click", connectOpenFinance);
  els.financeInsightButton.addEventListener("click", () => handleAiCommand("Gere um plano financeiro para economizar este mês"));
  els.reportForm.addEventListener("submit", (event) => { event.preventDefault(); generateReport(); });
  els.clearAtlasDone.addEventListener("click", () => { state.data.records = state.data.records.filter((record) => !record.done); saveAll(); renderAll(); toast("Registros concluídos removidos."); });
  els.examUpload.addEventListener("change", () => {
    const file = els.examUpload.files[0];
    if (!file) return;
    addRecord("Relatório", "Análise de exame", `Arquivo ${file.name} registrado. Esta análise não substitui avaliação profissional.`);
    renderAll();
    toast("Exame registrado na Central Atlas.");
  });
  els.billingToggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-billing]");
    if (!button) return;
    state.billing = button.dataset.billing;
    els.billingToggle.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
    renderPlans();
  });
  els.checkoutForm.addEventListener("click", (event) => {
    if (!event.target.closest("[data-next-checkout]")) return;
    if (state.checkoutStep === 3) completeCheckout();
    state.checkoutStep = Math.min(4, state.checkoutStep + 1);
    renderCheckoutStep();
  });
  els.closeCheckout.addEventListener("click", () => els.checkoutModal.classList.add("hidden"));
  els.finishCheckout.addEventListener("click", () => { els.checkoutModal.classList.add("hidden"); navigateTo("plans"); });
  els.closeUpgrade.addEventListener("click", () => els.upgradeModal.classList.add("hidden"));
  els.stayFreeButton.addEventListener("click", () => els.upgradeModal.classList.add("hidden"));
  els.upgradeModalButton.addEventListener("click", () => { const target = els.upgradeModalButton.dataset.targetPlan || "plus"; els.upgradeModal.classList.add("hidden"); navigateTo("plans"); openCheckout(target); });
  els.upgradePlanButton.addEventListener("click", () => openCheckout(state.subscription.plan === "free" ? "plus" : state.subscription.plan === "plus" ? "pro" : "elite"));
  els.downgradePlanButton.addEventListener("click", () => openCheckout(state.subscription.plan === "elite" ? "pro" : state.subscription.plan === "pro" ? "plus" : "free"));
  els.cancelPlanButton.addEventListener("click", () => { state.subscription = mergeSubscription({ plan: "free" }); saveAll(); renderAll(); toast("Assinatura cancelada. Atlas Free ativado."); });

  document.addEventListener("click", (event) => {
    const quick = event.target.closest(".quick-command");
    if (quick) {
      navigateTo("assistant");
      els.aiInput.value = "";
      handleAiCommand(quick.dataset.command);
    }
    const habitButton = event.target.closest("[data-habit]");
    if (habitButton) {
      const habit = state.data.habits.find((item) => item.id === habitButton.dataset.habit);
      if (habit) {
        habit.done = !habit.done;
        habit.streak = Math.max(0, habit.streak + (habit.done ? 1 : -1));
        habit.completion = Math.min(100, Math.max(0, habit.completion + (habit.done ? 2 : -2)));
        saveAll();
        renderAll();
      }
    }
    const recordEdit = event.target.closest("[data-record-edit]");
    if (recordEdit) {
      const record = state.data.records.find((item) => item.id === recordEdit.dataset.recordEdit);
      if (record) {
        const next = window.prompt("Editar registro", record.content);
        if (next !== null) {
          record.content = next;
          saveAll();
          renderAll();
        }
      }
    }
    const recordDone = event.target.closest("[data-record-done]");
    if (recordDone) {
      const record = state.data.records.find((item) => item.id === recordDone.dataset.recordDone);
      if (record) {
        record.done = !record.done;
        saveAll();
        renderAll();
      }
    }
    const recordDelete = event.target.closest("[data-record-delete]");
    if (recordDelete) {
      state.data.records = state.data.records.filter((item) => item.id !== recordDelete.dataset.recordDelete);
      saveAll();
      renderAll();
    }
    const transactionDelete = event.target.closest("[data-transaction-delete]");
    if (transactionDelete) {
      state.data.transactions = state.data.transactions.filter((item) => item.id !== transactionDelete.dataset.transactionDelete);
      saveAll();
      renderAll();
    }
    const filter = event.target.closest("[data-extract-filter]");
    if (filter) {
      state.extractFilter = filter.dataset.extractFilter;
      document.querySelectorAll("[data-extract-filter]").forEach((item) => item.classList.toggle("active", item === filter));
      renderFinance();
    }
    const atlasFilter = event.target.closest("[data-atlas-filter]");
    if (atlasFilter) {
      state.atlasFilter = atlasFilter.dataset.atlasFilter;
      els.atlasTabs.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === atlasFilter));
      renderAtlas();
    }
    const calendar = event.target.closest("[data-calendar]");
    if (calendar) {
      const key = calendar.dataset.calendar;
      if (!requirePlan("plus", "Sincronização completa de calendários")) return;
      state.data.calendarIntegrations[key] = !state.data.calendarIntegrations[key];
      saveAll();
      renderCalendar();
      toast(`${key} Calendar atualizado.`);
    }
    const planButton = event.target.closest("[data-plan-select]");
    if (planButton) openCheckout(planButton.dataset.planSelect);
  });
}

function init() {
  saveAll();
  bindEvents();
  renderIcons();
  if (state.session && state.users[state.session.email]) openApp();
}

init();
