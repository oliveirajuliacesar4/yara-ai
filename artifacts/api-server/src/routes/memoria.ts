import { Router } from "express";
import { db } from "@workspace/db";
import { memoriaTable, logsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    const memorias = await db
      .select()
      .from(memoriaTable)
      .orderBy(memoriaTable.usos);
    res.json(memorias);
  } catch (err) {
    logger.error({ err }, "Erro ao listar memórias");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
