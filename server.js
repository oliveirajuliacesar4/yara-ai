const express = require("express");
const path = require("path");
const fs = require("fs");

loadEnvFile();

const PORT = process.env.PORT || 3000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const STATIC_DIR = path.join(__dirname, "public");
const INDEX_FILE = path.join(STATIC_DIR, "index.html");
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || `http://localhost:${PORT}`;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || PUBLIC_APP_URL)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "";
const rateBuckets = new Map();
const memoryMetrics = {
  aiRequests: 0,
  apiErrors: 0,
  payments: 0,
  subscriptions: 0,
  logs: [],
};

assertOfficialFrontend();

console.log("[YARA] Server starting");
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use(express.static(STATIC_DIR, { index: false }));

app.get("/", (req, res) => {
  res.sendFile(INDEX_FILE);
});

app.use("/api", (req, res, next) => {
  if (handleCors(req, res)) return;
  if (!allowRate(req)) {
    return json(req, res, 429, { error: "Muitas requisições. Tente novamente em instantes." });
  }
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/admin/metrics", asyncHandler(handleAdminMetrics));
app.post("/api/yara-ai", asyncHandler(handleYaraAi));
app.post("/api/payments/checkout", asyncHandler(handlePaymentCheckout));
app.post("/api/open-finance/connect", asyncHandler(handleOpenFinance));
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.use(async (error, req, res, next) => {
  if (res.headersSent) return next(error);
  memoryMetrics.apiErrors += 1;
  await audit("api_error", "Erro interno no backend YARA AI.", { message: error.message }).catch(() => {});
  return json(req, res, 500, { error: "Erro interno da API YARA." });
});

app.listen(PORT, () => {
  console.log("[YARA] rodando na porta", PORT);
});

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      next(error);
    }
  };
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!process.env[key]) process.env[key] = valueParts.join("=").trim();
  }
}

function assertOfficialFrontend() {
  if (!fs.existsSync(INDEX_FILE)) {
    throw new Error("[YARA] public/index.html is required. Refusing to start without the official frontend.");
  }

  const indexHtml = fs.readFileSync(INDEX_FILE, "utf8");
  const hasYaraMarker = indexHtml.includes("YARA AI");
  const legacyMarkers = [
    [97, 116, 108, 97, 115],
    [65, 116, 108, 97, 115, 32, 79, 110, 101],
    [65, 116, 108, 97, 115, 32, 65, 73],
    [97, 116, 108, 97, 115, 46, 111, 110, 101],
    [97, 116, 108, 97, 115, 111, 110, 101],
    [97, 112, 105, 47, 97, 116, 108, 97, 115],
    [65, 84, 76, 65, 83, 95, 67, 79, 78, 70, 73, 71],
    [65, 84, 76, 65, 83, 95, 65, 80, 73, 95, 66, 65, 83, 69, 95, 85, 82, 76],
  ].map((codes) => String.fromCharCode(...codes));

  if (!hasYaraMarker) {
    throw new Error("[YARA] public/index.html is not the official YARA frontend. Refusing to serve stale static files.");
  }

  for (const filePath of listStaticFiles(STATIC_DIR)) {
    const contents = fs.readFileSync(filePath, "utf8").toLowerCase();
    const hasLegacyMarker = legacyMarkers.some((marker) => contents.includes(marker.toLowerCase()));
    if (hasLegacyMarker) {
      throw new Error(`[YARA] Legacy frontend marker detected in ${path.relative(__dirname, filePath)}. Refusing to start.`);
    }
  }

  const legacyDist = path.join(__dirname, "dist");
  if (fs.existsSync(legacyDist)) {
    console.warn("[YARA] dist/ exists but is ignored. Static frontend is served only from public/.");
  }
}

function listStaticFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listStaticFiles(entryPath));
      continue;
    }
    if (/\.(html|css|js)$/i.test(entry.name)) files.push(entryPath);
  }
  return files;
}

function handleCors(req, res) {
  const origin = req.headers.origin || "";
  const allowed = !origin || ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin);
  const requestPath = req.originalUrl || req.url;
  if (allowed) {
    res.setHeader("Access-Control-Allow-Origin", origin || ALLOWED_ORIGINS[0] || "*");
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Yara-User");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  if (!allowed && requestPath.startsWith("/api/")) {
    json(req, res, 403, { error: "Origem não autorizada." });
    return true;
  }
  return false;
}

function allowRate(req) {
  const requestPath = req.originalUrl || req.url;
  if (!requestPath.startsWith("/api/")) return true;
  const id = req.headers["x-yara-user"] || req.socket.remoteAddress || "anonymous";
  const now = Date.now();
  const windowMs = 60_000;
  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE || 60);
  const bucket = rateBuckets.get(id) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(id, bucket);
  return bucket.count <= limit;
}

async function handleYaraAi(req, res) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return json(req, res, 503, { error: "YARA AI indisponível. A chave da OpenAI não foi configurada no servidor." });
  }

  const body = await readJson(req);
  const message = String(body.message || "").trim();
  const context = body.context || {};

  if (!message) return json(req, res, 400, { error: "Mensagem vazia." });

  memoryMetrics.aiRequests += 1;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      instructions: buildYaraInstructions(),
      input: [
        {
          role: "user",
          content:
            `Mensagem do usuário:\n${message}\n\n` +
            `Contexto atual da YARA AI em JSON:\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    memoryMetrics.apiErrors += 1;
    await audit("openai_error", "Falha ao chamar OpenAI.", { status: response.status });
    return json(req, res, response.status, {
      error: "Falha ao gerar resposta da IA.",
      reason: classifyOpenAIError(response.status, payload),
    });
  }

  const rawText = extractOpenAIText(payload);
  const parsed = parseYaraJson(rawText);
  await saveAiMessage({
    prompt: message,
    reply: parsed.reply,
    model: OPENAI_MODEL,
    usage: payload.usage,
  });
  return json(req, res, 200, parsed);
}

function getOpenAIKey() {
  let key = String(process.env.OPENAI_API_KEY || "").trim();
  key = key.replace(/^OPENAI_API_KEY\s*=\s*/i, "").trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

function classifyOpenAIError(status, payload) {
  const message = String(payload?.error?.message || "").toLowerCase();
  if (status === 401) return "openai_key_invalid_or_missing";
  if (status === 403) return "openai_key_without_access";
  if (status === 404 || message.includes("model")) return "openai_model_unavailable";
  if (status === 429) return "openai_rate_or_quota_limit";
  return "openai_request_failed";
}

function buildYaraInstructions() {
  return [
    "Você é a YARA AI, assistente inteligente da aplicação YARA.",
    "Responda em português do Brasil com tom claro, premium, prático e contextual.",
    "Use o contexto enviado para consultar metas, hábitos, finanças, agenda, saúde, assinatura e memórias.",
    "Quando faltar informação crítica, faça perguntas objetivas antes de assumir.",
    "Quando criar planos, entregue detalhes úteis e salve a estrutura em records/actions.",
    "Planos de treino incluem objetivo, nível, dias, divisão semanal, exercícios, séries, repetições, descanso, aquecimento, alongamento e evolução.",
    "Planos alimentares incluem refeições, substituições, lista de compras e aviso de que não substitui nutricionista.",
    "Planos financeiros incluem renda, gastos, dívidas, metas, valor para guardar, previsão e alertas.",
    "Planos de estudo incluem matéria, prazo, dificuldade, cronograma, revisão, simulados e metas diárias.",
    "Rotinas incluem horários, compromissos, hábitos, pausas, alarmes, tarefas e calendário.",
    "Sempre informe onde algo foi salvo na YARA.",
    "Para saúde, inclua: Esta análise não substitui avaliação profissional.",
    "Retorne somente JSON válido, sem markdown, no formato fornecido.",
    JSON.stringify({
      reply: "Resposta final ao usuário.",
      records: [{ type: "Plano|Meta|Rotina|Evento|Relatório|Lista|Análise", title: "Título", content: "Conteúdo salvo" }],
      actions: {
        goals: [{ title: "Meta", description: "Descrição", progress: 0, deadline: "90 dias", category: "YARA AI" }],
        reminders: [{ title: "Lembrete", due: "20:00", critical: true }],
        events: [{ title: "Evento", time: "10:00", type: "Agenda" }],
        tasks: [{ title: "Tarefa", priority: "Média" }],
      },
    }),
  ].join("\n");
}

function extractOpenAIText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n").trim();
}

function parseYaraJson(rawText) {
  try {
    return normalizeYaraPayload(JSON.parse(rawText));
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return normalizeYaraPayload(JSON.parse(match[0]));
      } catch {
        // Ignore and fallback.
      }
    }
    return normalizeYaraPayload({ reply: rawText, records: [], actions: {} });
  }
}

function normalizeYaraPayload(payload) {
  return {
    reply: String(payload.reply || "Resposta gerada pela YARA AI."),
    records: Array.isArray(payload.records) ? payload.records : [],
    actions: {
      goals: Array.isArray(payload.actions?.goals) ? payload.actions.goals : [],
      reminders: Array.isArray(payload.actions?.reminders) ? payload.actions.reminders : [],
      events: Array.isArray(payload.actions?.events) ? payload.actions.events : [],
      tasks: Array.isArray(payload.actions?.tasks) ? payload.actions.tasks : [],
    },
  };
}

async function handlePaymentCheckout(req, res) {
  const body = await readJson(req);
  const gateway = String(body.gateway || "").toLowerCase();
  const amount = Math.round(Number(body.amount || 0) * 100);

  if (gateway.includes("stripe") && process.env.STRIPE_SECRET_KEY) {
    const checkoutUrl = await createStripeCheckout(body, amount);
    memoryMetrics.payments += 1;
    memoryMetrics.subscriptions += 1;
    return json(req, res, 200, { gateway: "Stripe", checkoutUrl });
  }

  if (gateway.includes("mercado") && process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    const checkoutUrl = await createMercadoPagoPreference(body);
    memoryMetrics.payments += 1;
    memoryMetrics.subscriptions += 1;
    return json(req, res, 200, { gateway: "Mercado Pago", checkoutUrl });
  }

  if (gateway.includes("asaas") && process.env.ASAAS_API_KEY) {
    const checkoutUrl = await createAsaasPayment(body);
    memoryMetrics.payments += 1;
    memoryMetrics.subscriptions += 1;
    return json(req, res, 200, { gateway: "Asaas", checkoutUrl });
  }

  return json(req, res, 501, {
    error: "Gateway sem credenciais de produção.",
    setup: "Configure STRIPE_SECRET_KEY, MERCADO_PAGO_ACCESS_TOKEN ou ASAAS_API_KEY no servidor.",
  });
}

async function createStripeCheckout(body, amountInCents) {
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${PUBLIC_APP_URL}?checkout=success`,
    cancel_url: `${PUBLIC_APP_URL}?checkout=cancel`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][product_data][name]": `YARA AI ${body.plan}`,
    "line_items[0][price_data][unit_amount]": String(amountInCents),
    customer_email: body.customer?.email || "",
  });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("Falha ao criar checkout Stripe.");
  return payload.url;
}

async function createMercadoPagoPreference(body) {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ title: `YARA AI ${body.plan}`, quantity: 1, unit_price: Number(body.amount), currency_id: "BRL" }],
      payer: { email: body.customer?.email },
      back_urls: {
        success: `${PUBLIC_APP_URL}?checkout=success`,
        failure: `${PUBLIC_APP_URL}?checkout=failure`,
        pending: `${PUBLIC_APP_URL}?checkout=pending`,
      },
      auto_return: "approved",
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("Falha ao criar checkout Mercado Pago.");
  return payload.init_point || payload.sandbox_init_point;
}

async function createAsaasPayment(body) {
  const response = await fetch("https://api.asaas.com/v3/paymentLinks", {
    method: "POST",
    headers: {
      access_token: process.env.ASAAS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `YARA AI ${body.plan}`,
      description: `Assinatura YARA AI ${body.plan}`,
      value: Number(body.amount),
      billingType: mapAsaasBilling(body.method),
      chargeType: "DETACHED",
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("Falha ao criar checkout Asaas.");
  return payload.url;
}

function mapAsaasBilling(method = "") {
  if (/pix/i.test(method)) return "PIX";
  if (/d[eé]bito/i.test(method)) return "DEBIT_CARD";
  return "CREDIT_CARD";
}

async function handleOpenFinance(req, res) {
  await readJson(req);
  return json(req, res, 202, {
    status: "integration_pending",
    message: "Open Finance em fase de integração. A conexão real exige provedor credenciado e fluxo de consentimento.",
  });
}

async function handleAdminMetrics(req, res) {
  const auth = req.headers.authorization || "";
  if (!ADMIN_TOKEN || auth !== `Bearer ${ADMIN_TOKEN}`) {
    return json(req, res, 401, { error: "Acesso admin não autorizado." });
  }

  const dbStats = await getDbStats();
  return json(req, res, 200, {
    users: dbStats.users,
    aiRequests: dbStats.aiRequests || memoryMetrics.aiRequests,
    apiErrors: memoryMetrics.apiErrors,
    estimatedCost: dbStats.estimatedCost || "N/D",
    subscriptions: dbStats.subscriptions || memoryMetrics.subscriptions,
    payments: dbStats.payments || memoryMetrics.payments,
    logs: dbStats.logs.length ? dbStats.logs : memoryMetrics.logs.slice(-20).reverse(),
  });
}

let pgPoolPromise;
async function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pgPoolPromise) {
    pgPoolPromise = import("pg").then(({ Pool }) => new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false } }));
  }
  return pgPoolPromise;
}

async function saveAiMessage({ prompt, reply, model, usage }) {
  const pool = await getPool().catch(() => null);
  if (!pool) return;
  await pool.query(
    "insert into ai_messages(prompt, reply, model, tokens_input, tokens_output) values ($1, $2, $3, $4, $5)",
    [prompt, reply, model, usage?.input_tokens || 0, usage?.output_tokens || 0]
  );
}

async function getDbStats() {
  const pool = await getPool().catch(() => null);
  if (!pool) return { users: 0, aiRequests: 0, subscriptions: 0, payments: 0, estimatedCost: "N/D", logs: [] };
  const [users, ai, subscriptions, payments, logs] = await Promise.all([
    pool.query("select count(*)::int as count from users").catch(() => ({ rows: [{ count: 0 }] })),
    pool.query("select count(*)::int as count from ai_messages").catch(() => ({ rows: [{ count: 0 }] })),
    pool.query("select count(*)::int as count from subscriptions").catch(() => ({ rows: [{ count: 0 }] })),
    pool.query("select count(*)::int as count from payments").catch(() => ({ rows: [{ count: 0 }] })),
    pool.query("select type, message, created_at from audit_logs order by created_at desc limit 20").catch(() => ({ rows: [] })),
  ]);
  return {
    users: users.rows[0].count,
    aiRequests: ai.rows[0].count,
    subscriptions: subscriptions.rows[0].count,
    payments: payments.rows[0].count,
    estimatedCost: "Configure cálculo por modelo",
    logs: logs.rows,
  };
}

async function audit(type, message, metadata = {}) {
  const log = { type, message, created_at: new Date().toISOString() };
  memoryMetrics.logs.push(log);
  const pool = await getPool().catch(() => null);
  if (!pool) return;
  await pool.query("insert into audit_logs(type, message, metadata) values ($1, $2, $3)", [type, message, metadata]).catch(() => {});
}

function readJson(req) {
  if (req.body !== undefined) return Promise.resolve(req.body || {});
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload muito grande."));
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function json(req, res, status, body) {
  if (typeof res.status === "function") {
    return res.status(status).type("application/json; charset=utf-8").send(JSON.stringify(body));
  }
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  return res.end(JSON.stringify(body));
}
