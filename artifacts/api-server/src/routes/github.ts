import { Router } from "express";
import { Octokit } from "@octokit/rest";
import { db } from "@workspace/db";
import { projectsTable, generatedFilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  if (!(req.session as any).userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  next();
}

router.post("/:id/github", requireAuth, async (req, res) => {
  const userId = (req.session as any).userId;
  const id = Number(req.params.id);
  const { repoName, descricao, privado = false } = req.body;

  if (!repoName || repoName.length < 2) {
    res.status(400).json({ error: "Nome do repositório inválido" });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(400).json({ error: "Token do GitHub não configurado" });
    return;
  }

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

    if (projeto.status !== "completed") {
      res.status(400).json({ error: "O projeto precisa estar concluído para publicar no GitHub" });
      return;
    }

    const arquivos = await db
      .select()
      .from(generatedFilesTable)
      .where(eq(generatedFilesTable.projectId, id));

    if (arquivos.length === 0) {
      res.status(400).json({ error: "Nenhum arquivo gerado para publicar" });
      return;
    }

    const octokit = new Octokit({ auth: token });

    // Obter usuário autenticado no GitHub
    const { data: ghUser } = await octokit.rest.users.getAuthenticated();

    // Criar repositório
    const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
      name: repoName,
      description: descricao || projeto.description.substring(0, 200),
      private: privado,
      auto_init: false,
    });

    // Fazer upload dos arquivos
    for (const arquivo of arquivos) {
      try {
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: ghUser.login,
          repo: repoName,
          path: arquivo.path,
          message: `feat: adicionar ${arquivo.path}`,
          content: Buffer.from(arquivo.content).toString("base64"),
        });
      } catch (err) {
        logger.warn({ err, arquivo: arquivo.path }, "Falha ao enviar arquivo");
      }
    }

    // Adicionar README da YARA
    const readmeYara = `# ${projeto.name}\n\n${projeto.description}\n\n---\n\n## Gerado pela YARA\n\nEste sistema foi gerado automaticamente pela plataforma **YARA - Gerador de Sistemas IA**.\n\n**Stack:** ${projeto.techStack || "Detectado automaticamente"}\n\n**Arquivos gerados:** ${arquivos.length}\n\n**Data de geração:** ${new Date(projeto.updatedAt).toLocaleDateString("pt-BR")}\n\n---\n\n*Desenvolvido com YARA IA — https://yara.ia*\n`;

    try {
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: ghUser.login,
        repo: repoName,
        path: "YARA.md",
        message: "feat: adicionar informações da YARA",
        content: Buffer.from(readmeYara).toString("base64"),
      });
    } catch {}

    // Salvar URL do repositório no projeto
    await db.update(projectsTable)
      .set({ githubUrl: repo.html_url })
      .where(eq(projectsTable.id, id));

    logger.info({ repoUrl: repo.html_url, projetoId: id }, "Projeto publicado no GitHub");

    res.json({
      url: repo.html_url,
      repoName: repo.full_name,
      mensagem: `Projeto publicado com sucesso! ${arquivos.length} arquivos enviados.`,
    });
  } catch (err: any) {
    logger.error({ err }, "Erro ao publicar no GitHub");
    const mensagem = err?.status === 422
      ? "Repositório já existe com esse nome. Escolha outro nome."
      : err?.message || "Erro ao publicar no GitHub";
    res.status(400).json({ error: mensagem });
  }
});

export default router;
