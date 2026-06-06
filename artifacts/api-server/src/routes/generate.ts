import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, generatedFilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import OpenAI from "openai";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey });
}

const SYSTEM_PROMPT = `Você é um engenheiro de software sênior especializado em gerar sistemas completos.
Dado o pedido do usuário, gere um sistema web completo com as seguintes partes:
1. Backend (Node.js/Express com TypeScript)
2. Frontend (React com TypeScript)
3. Banco de dados (schema SQL PostgreSQL)
4. README.md explicando como rodar

Retorne APENAS um JSON válido no seguinte formato exato (sem markdown, sem explicação fora do JSON):
{
  "files": [
    {
      "path": "caminho/do/arquivo.ts",
      "language": "typescript",
      "content": "conteúdo do arquivo aqui"
    }
  ],
  "summary": "Resumo do sistema gerado em 2-3 frases."
}

Gere pelo menos 8 arquivos cobrindo backend, frontend, banco de dados e documentação.
Mantenha o código limpo, organizado e funcional.`;

router.post("/:id/generate", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);

  const [project] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Projeto não encontrado" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await db.update(projectsTable).set({ status: "generating" }).where(eq(projectsTable.id, id));
    sendEvent({ type: "status", message: "Iniciando geração com IA..." });

    const userPrompt = `Sistema: ${project.name}\n\nDescrição: ${project.description}\n\nRequisito adicional: ${req.body.prompt || project.description}`;

    sendEvent({ type: "status", message: "Analisando requisitos..." });

    let fullContent = "";
    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 8000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      stream: true,
    });

    sendEvent({ type: "status", message: "Gerando código..." });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullContent += content;
        sendEvent({ type: "progress", content });
      }
    }

    sendEvent({ type: "status", message: "Processando arquivos gerados..." });

    let parsed: { files: Array<{ path: string; language: string; content: string }>; summary: string };
    try {
      const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      logger.error("Failed to parse AI response");
      await db.update(projectsTable).set({ status: "failed" }).where(eq(projectsTable.id, id));
      sendEvent({ type: "error", message: "Falha ao processar resposta da IA" });
      sendEvent({ type: "done" });
      res.end();
      return;
    }

    await db.delete(generatedFilesTable).where(eq(generatedFilesTable.projectId, id));
    for (const file of parsed.files) {
      await db.insert(generatedFilesTable).values({
        projectId: id,
        path: file.path,
        content: file.content,
        language: file.language,
      });
    }

    await db.update(projectsTable)
      .set({ status: "completed", generatedCode: parsed.summary })
      .where(eq(projectsTable.id, id));

    sendEvent({ type: "complete", summary: parsed.summary, fileCount: parsed.files.length });
    sendEvent({ type: "done" });
    res.end();
  } catch (err) {
    logger.error({ err }, "Error generating system");
    await db.update(projectsTable).set({ status: "failed" }).where(eq(projectsTable.id, id)).catch(() => {});
    sendEvent({ type: "error", message: "Erro interno ao gerar sistema" });
    sendEvent({ type: "done" });
    res.end();
  }
});

export default router;
