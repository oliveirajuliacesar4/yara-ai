import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/status", (_req, res) => {
  res.json({
    openai: !!process.env.OPENAI_API_KEY,
    github: !!(process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN),
    database: !!process.env.DATABASE_URL,
  });
});

export default router;
