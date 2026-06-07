import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "@workspace/db";
import { conversationsTable, chatMessagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}

function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY não configurada");
  return new GoogleGenAI({ apiKey });
}

const MODELO = "gemini-2.0-flash";

const SISTEMA_CHAT = `Você é a YARA — uma engenheira de software sênior especializada em sistemas web, APIs, banco de dados e arquitetura de software.

Você é direta, técnica, precisa e gentil. Responde em Português brasileiro.
Quando mostrar código, use blocos de código com a linguagem indicada.
Você pode ajudar com: dúvidas de código, revisão de arquitetura, debugging, boas práticas, sugestões de tecnologias, e explicações técnicas em geral.
Quando apropriado, ofereça exemplos práticos e completos.`;

// Listar conversas
router.get("/conversations", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  try {
    const conversas = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.userId, userId))
      .orderBy(desc(conversationsTable.updatedAt));
    res.json(conversas);
  } catch (err) {
    logger.error({ err }, "Erro ao listar conversas");
    res.status(500).json({ error: "Erro interno" });
  }
});

// Criar nova conversa
router.post("/conversations", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  try {
    const [conversa] = await db
      .insert(conversationsTable)
      .values({ userId, title: "Nova conversa" })
      .returning();
    res.status(201).json(conversa);
  } catch (err) {
    logger.error({ err }, "Erro ao criar conversa");
    res.status(500).json({ error: "Erro interno" });
  }
});

// Obter conversa com mensagens
router.get("/conversations/:id", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  try {
    const [conversa] = await db
      .select()
      .from(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)))
      .limit(1);
    if (!conversa) {
      res.status(404).json({ error: "Conversa não encontrada" });
      return;
    }
    const mensagens = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, id))
      .orderBy(chatMessagesTable.createdAt);
    res.json({ ...conversa, messages: mensagens });
  } catch (err) {
    logger.error({ err }, "Erro ao obter conversa");
    res.status(500).json({ error: "Erro interno" });
  }
});

// Renomear conversa
router.patch("/conversations/:id", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  const { title } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Título inválido" });
    return;
  }
  try {
    const [conversa] = await db
      .update(conversationsTable)
      .set({ title: title.trim().substring(0, 100) })
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)))
      .returning();
    if (!conversa) {
      res.status(404).json({ error: "Conversa não encontrada" });
      return;
    }
    res.json(conversa);
  } catch (err) {
    logger.error({ err }, "Erro ao renomear conversa");
    res.status(500).json({ error: "Erro interno" });
  }
});

// Deletar conversa
router.delete("/conversations/:id", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  try {
    await db
      .delete(conversationsTable)
      .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)));
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Erro ao deletar conversa");
    res.status(500).json({ error: "Erro interno" });
  }
});

// Enviar mensagem com streaming SSE
router.post("/conversations/:id/messages", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const conversationId = Number(req.params.id);
  const { content } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "Mensagem vazia" });
    return;
  }

  // Verificar que a conversa pertence ao usuário
  const [conversa] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, conversationId), eq(conversationsTable.userId, userId)))
    .limit(1);

  if (!conversa) {
    res.status(404).json({ error: "Conversa não encontrada" });
    return;
  }

  // Salvar mensagem do usuário
  await db.insert(chatMessagesTable).values({
    conversationId,
    role: "user",
    content: content.trim(),
  });

  // Carregar histórico de mensagens (últimas 20 para contexto)
  const historico = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.conversationId, conversationId))
    .orderBy(chatMessagesTable.createdAt)
    .limit(20);

  // Configurar SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const gemini = getGemini();

    // Montar histórico no formato Gemini
    const contents = historico.map((m) => ({
      role: m.role as "user" | "model",
      parts: [{ text: m.content }],
    }));

    const stream = await gemini.models.generateContentStream({
      model: MODELO,
      contents: [
        { role: "user", parts: [{ text: SISTEMA_CHAT }] },
        { role: "model", parts: [{ text: "Entendido! Sou a YARA, sua engenheira de software. Como posso ajudar?" }] },
        ...contents,
      ],
      config: { maxOutputTokens: 4096, temperature: 0.7 },
    });

    let respostaCompleta = "";
    for await (const chunk of stream) {
      const texto = chunk.text;
      if (texto) {
        respostaCompleta += texto;
        sendEvent({ type: "chunk", content: texto });
      }
    }

    // Salvar resposta da IA no banco
    await db.insert(chatMessagesTable).values({
      conversationId,
      role: "model",
      content: respostaCompleta,
    });

    // Auto-nomear conversa se for a primeira mensagem do usuário
    const isFirstMessage = historico.filter((m) => m.role === "user").length === 1;
    if (isFirstMessage && conversa.title === "Nova conversa") {
      try {
        const nomeRes = await gemini.models.generateContent({
          model: MODELO,
          contents: [{
            role: "user",
            parts: [{
              text: `Gere um título curto (máximo 6 palavras, sem aspas) para uma conversa que começa com: "${content.trim().substring(0, 200)}"`
            }]
          }],
          config: { maxOutputTokens: 30, temperature: 0.5 },
        });
        const titulo = (nomeRes.text || "").trim().replace(/^["']|["']$/g, "").substring(0, 80);
        if (titulo) {
          await db.update(conversationsTable)
            .set({ title: titulo })
            .where(eq(conversationsTable.id, conversationId));
          sendEvent({ type: "title", title: titulo });
        }
      } catch {
        // ignorar falha no auto-nome
      }
    }

    // Atualizar updatedAt da conversa
    await db.update(conversationsTable)
      .set({ updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversationId));

    sendEvent({ type: "done" });
    res.end();
  } catch (err: any) {
    logger.error({ err }, "Erro no chat Gemini");
    sendEvent({ type: "error", message: err.message || "Erro ao processar mensagem" });
    res.end();
  }
});

export default router;
