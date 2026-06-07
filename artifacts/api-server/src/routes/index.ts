import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import generateRouter from "./generate";
import githubRouter from "./github";
import memoriaRouter from "./memoria";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/projects", projectsRouter);
router.use("/projects", generateRouter);
router.use("/projects", githubRouter);
router.use("/memoria", memoriaRouter);
router.use("/chat", chatRouter);

export default router;
