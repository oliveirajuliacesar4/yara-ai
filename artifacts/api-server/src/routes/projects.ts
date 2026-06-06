import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable, generatedFilesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { logger } from "../lib/logger";
import { CreateProjectBody, UpdateProjectBody } from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}

router.get("/stats", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  try {
    const projects = await db.select().from(projectsTable).where(eq(projectsTable.userId, userId));
    const total = projects.length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const generating = projects.filter((p) => p.status === "generating").length;
    const failed = projects.filter((p) => p.status === "failed").length;
    res.json({ total, completed, generating, failed });
  } catch (err) {
    logger.error({ err }, "Error fetching stats");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  try {
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.userId, userId))
      .orderBy(projectsTable.createdAt);
    res.json(projects);
  } catch (err) {
    logger.error({ err }, "Error listing projects");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  try {
    const [project] = await db
      .insert(projectsTable)
      .values({ userId, name: parsed.data.name, description: parsed.data.description, techStack: parsed.data.techStack ?? null, status: "pending" })
      .returning();
    res.status(201).json(project);
  } catch (err) {
    logger.error({ err }, "Error creating project");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
      .limit(1);
    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado" });
      return;
    }
    res.json(project);
  } catch (err) {
    logger.error({ err }, "Error fetching project");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.patch("/:id", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }
  try {
    const [existing] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Projeto não encontrado" });
      return;
    }
    const [updated] = await db
      .update(projectsTable)
      .set({ ...parsed.data })
      .where(eq(projectsTable.id, id))
      .returning();
    res.json(updated);
  } catch (err) {
    logger.error({ err }, "Error updating project");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  try {
    const [existing] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "Projeto não encontrado" });
      return;
    }
    await db.delete(generatedFilesTable).where(eq(generatedFilesTable.projectId, id));
    await db.delete(projectsTable).where(eq(projectsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Error deleting project");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

router.get("/:id/files", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  try {
    const [project] = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.id, id), eq(projectsTable.userId, userId)))
      .limit(1);
    if (!project) {
      res.status(404).json({ error: "Projeto não encontrado" });
      return;
    }
    const files = await db.select().from(generatedFilesTable).where(eq(generatedFilesTable.projectId, id));
    res.json(files);
  } catch (err) {
    logger.error({ err }, "Error fetching files");
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;
