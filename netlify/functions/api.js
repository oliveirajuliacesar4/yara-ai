const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || process.env.URL || "";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || PUBLIC_APP_URL || "*")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

const metrics = {
  aiRequests: 0,
  apiErrors: 0,
  payments: 0,
  subscriptions: 0,
  logs: [],
};

exports.handler = async (event) => {
  const cors = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  try {
    const path = event.path.replace(/^\/\.netlify\/functions\/api/, "").replace(/^\/api/, "") || "/";

    if (event.httpMethod === "GET" && path === "/health") {
      return json(
        200,
        {
          status: "ok",
          service: "yara-ai-netlify-api",
          integrations: {
            openai: Boolean(getOpenAIKey()),
            model: OPENAI_MODEL,
          },
        },
        cors,
      );
    }

    if (event.httpMethod === "GET" && path === "/admin/metrics") {
      return handleAdminMetrics(event, cors);
    }

    if (event.httpMethod === "POST" && path === "/yara-ai") {
      return await handleYaraAi(event, cors);
    }

    if (event.httpMethod === "POST" && path === "/payments/checkout") {
      return await handlePaymentCheckout(event, cors);
    }

    if (event.httpMethod === "POST" && path === "/open-finance/connect") {
      return json(
        202,
        {
          status: "integration_pending",
          message:
            "Open Finance em fase de integração. A conexão real exige provedor credenciado e consentimento bancário.",
        },
        cors
      );
    }

    return json(404, { error: "Endpoint não encontrado." }, cors);
  } catch (error) {
    metrics.apiErrors += 1;
    log("api_error", "Erro interno na API serverless.");
    return json(500, { error: "Erro interno da API YARA." }, cors);
  }
};

async function handleYaraAi(event, cors) {
  const apiKey = getOpenAIKey();
  if (!apiKey) {
    return json(503, { error: "YARA AI indisponível. OPENAI_API_KEY não configurada no backend." }, cors);
  }

  const body = parseBody(event);
  const message = String(body.message || "").trim();
  if (!message) return json(400, { error: "Mensagem vazia." }, cors);

  metrics.aiRequests += 1;

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
            `Contexto atual da YARA AI em JSON:\n${JSON.stringify(body.context || {}, null, 2)}`,
        },
      ],
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    metrics.apiErrors += 1;
    log("openai_error", `Falha OpenAI status ${response.status}.`);
    return json(response.status, { error: "Falha ao gerar resposta da IA.", reason: classifyOpenAIError(response.status, payload) }, cors);
  }

  return json(200, parseYaraJson(extractOpenAIText(payload)), cors);
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

async function handlePaymentCheckout(event, cors) {
  const body = parseBody(event);
  const gateway = String(body.gateway || "").toLowerCase();

  if (gateway.includes("stripe") && process.env.STRIPE_SECRET_KEY) {
    const checkoutUrl = await createStripeCheckout(body);
    metrics.payments += 1;
    metrics.subscriptions += 1;
    return json(200, { gateway: "Stripe", checkoutUrl }, cors);
  }

  if (gateway.includes("mercado") && process.env.MERCADO_PAGO_ACCESS_TOKEN) {
    const checkoutUrl = await createMercadoPagoPreference(body);
    metrics.payments += 1;
    metrics.subscriptions += 1;
    return json(200, { gateway: "Mercado Pago", checkoutUrl }, cors);
  }

  if (gateway.includes("asaas") && process.env.ASAAS_API_KEY) {
    const checkoutUrl = await createAsaasPayment(body);
    metrics.payments += 1;
    metrics.subscriptions += 1;
    return json(200, { gateway: "Asaas", checkoutUrl }, cors);
  }

  return json(501, { error: "Gateway sem credenciais de produção configuradas." }, cors);
}

function handleAdminMetrics(event, cors) {
  if (!ADMIN_TOKEN || event.headers.authorization !== `Bearer ${ADMIN_TOKEN}`) {
    return json(401, { error: "Acesso admin não autorizado." }, cors);
  }
  return json(
    200,
    {
      users: "N/D",
      aiRequests: metrics.aiRequests,
      apiErrors: metrics.apiErrors,
      estimatedCost: "Configure cálculo por modelo",
      subscriptions: metrics.subscriptions,
      payments: metrics.payments,
      logs: metrics.logs.slice(-20).reverse(),
    },
    cors
  );
}

function buildYaraInstructions() {
  return [
    "Você é a YARA AI, assistente inteligente da aplicação YARA.",
    "Responda em português do Brasil com tom claro, premium, prático e contextual.",
    "Use o contexto enviado para consultar metas, hábitos, finanças, agenda, saúde, assinatura e memórias.",
    "Quando faltar informação crítica, faça perguntas objetivas antes de assumir.",
    "Quando criar planos, entregue detalhes úteis e salve a estrutura em records/actions.",
    "Sempre informe onde algo foi salvo na YARA.",
    "Para saúde, inclua: Esta análise não substitui avaliação profissional.",
    "Retorne somente JSON válido, sem markdown.",
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
        // Fallback below.
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

async function createStripeCheckout(body) {
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${PUBLIC_APP_URL}?checkout=success`,
    cancel_url: `${PUBLIC_APP_URL}?checkout=cancel`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][product_data][name]": `YARA AI ${body.plan}`,
    "line_items[0][price_data][unit_amount]": String(Math.round(Number(body.amount || 0) * 100)),
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
      billingType: /pix/i.test(body.method || "") ? "PIX" : /d[eé]bito/i.test(body.method || "") ? "DEBIT_CARD" : "CREDIT_CARD",
      chargeType: "DETACHED",
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error("Falha ao criar checkout Asaas.");
  return payload.url;
}

function corsHeaders(event) {
  const origin = event.headers.origin || "";
  const allowed = ALLOWED_ORIGINS.includes("*") || !origin || ALLOWED_ORIGINS.includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin || "*" : "null",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Yara-User",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function parseBody(event) {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    return {};
  }
}

function json(statusCode, body, headers) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function log(type, message) {
  metrics.logs.push({ type, message, created_at: new Date().toISOString() });
}
