import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, generatedFilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { executarGeracaoYARA } from "../lib/yara-motor";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}

router.post("/:id/generate", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);

  // Validar GEMINI_API_KEY antes de qualquer coisa
  if (!process.env.GEMINI_API_KEY) {
    res.status(400).json({
      error: "GEMINI_API_KEY não configurada. Adicione sua chave do Google Gemini nos Secrets do Replit com o nome GEMINI_API_KEY."
    });
    return;
  }

  const [projeto] = await db
    .select()
    .from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
    .limit(1);

  if (!projeto) {
    res.status(404).json({ error: "Projeto não encontrado" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const enviarEvento = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await db.update(projectsTable).set({ status: "generating" }).where(eq(projectsTable.id, id));
    enviarEvento({ type: "status", message: "YARA inicializada. Iniciando processo de geração..." });

    const resultado = await executarGeracaoYARA(
      id,
      projeto.name,
      projeto.description,
      projeto.techStack || "React + Node.js (Express)",
      req.body.prompt || projeto.description,
      (evento) => {
        // Mapear eventos internos para formato SSE do frontend
        if (evento.type === "etapa") {
          enviarEvento({
            type: "status",
            message: `[${evento.numero}/${evento.total}] ${evento.etapa}: ${evento.mensagem}`,
          });
        } else if (evento.type === "status") {
          enviarEvento({ type: "status", message: evento.mensagem });
        } else if (evento.type === "progresso") {
          enviarEvento({ type: "progress", content: evento.content });
        } else if (evento.type === "erro") {
          enviarEvento({ type: "error", message: evento.mensagem });
        }
      }
    );

    if (!resultado) {
      await db.update(projectsTable).set({ status: "failed" }).where(eq(projectsTable.id, id));
      enviarEvento({ type: "done" });
      res.end();
      return;
    }

    enviarEvento({ type: "status", message: "Salvando arquivos gerados no banco de dados..." });

    // Salvar arquivos
    await db.delete(generatedFilesTable).where(eq(generatedFilesTable.projectId, id));
    for (const arquivo of resultado.files) {
      await db.insert(generatedFilesTable).values({
        projectId: id,
        path: arquivo.path,
        content: arquivo.content,
        language: arquivo.language,
      });
    }

    await db.update(projectsTable)
      .set({ status: "completed", generatedCode: resultado.summary })
      .where(eq(projectsTable.id, id));

    enviarEvento({
      type: "complete",
      summary: resultado.summary,
      fileCount: resultado.files.length,
    });
    enviarEvento({ type: "done" });
    res.end();
  } catch (err) {
    logger.error({ err }, "Erro na geração YARA");
    await db.update(projectsTable).set({ status: "failed" }).where(eq(projectsTable.id, id)).catch(() => {});
    enviarEvento({ type: "error", message: "Erro interno ao gerar sistema" });
    enviarEvento({ type: "done" });
    res.end();
  }
});

// Rota para listar logs de geração
router.get("/:id/logs", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  try {
    const [projeto] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
      .limit(1);
    if (!projeto) {
      res.status(404).json({ error: "Projeto não encontrado" });
      return;
    }
    const { logsTable } = await import("@workspace/db");
    const { eq: eqLog } = await import("drizzle-orm");
    const logs = await db.select().from(logsTable).where(eqLog(logsTable.projetoId, id)).orderBy(logsTable.criadoEm);
    res.json(logs);
  } catch (err) {
    logger.error({ err }, "Erro ao listar logs");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
