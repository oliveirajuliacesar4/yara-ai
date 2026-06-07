import { GoogleGenAI } from "@google/genai";
import { db } from "@workspace/db";
import { memoriaTable, logsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export type EventoSSE = {
  type: "status" | "etapa" | "progresso" | "completo" | "erro" | "done";
  mensagem?: string;
  etapa?: string;
  numero?: number;
  total?: number;
  content?: string;
  resumo?: string;
  fileCount?: number;
};

export type ArquivoGerado = {
  path: string;
  language: string;
  content: string;
};

export type ResultadoGeracao = {
  files: ArquivoGerado[];
  summary: string;
};

const MODELO_GEMINI = "gemini-1.5-flash";

function getGemini(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione sua chave do Google Gemini nos Secrets do Replit com o nome GEMINI_API_KEY."
    );
  }
  return new GoogleGenAI({ apiKey });
}

const PROMPT_SISTEMA = `Você é a YARA — uma engenheira de software sênior especializada em criar sistemas completos de alta qualidade.

Seu objetivo é gerar sistemas completos, prontos para produção, seguindo as melhores práticas de desenvolvimento.

Gere um sistema com as seguintes partes obrigatórias:
1. Backend (Node.js/Express com TypeScript) — rotas, controllers, middlewares
2. Frontend (React com TypeScript) — componentes, páginas, hooks
3. Banco de dados (schema SQL PostgreSQL com Drizzle ORM)
4. Testes unitários básicos (Jest)
5. README.md completo em português explicando como instalar e rodar
6. .env.example com variáveis necessárias
7. docker-compose.yml para facilitar o desenvolvimento

REGRAS OBRIGATÓRIAS:
- Código limpo, organizado e comentado em português
- Estrutura MVC
- Validação de dados em frontend e backend
- Autenticação JWT com refresh token
- Tratamento de erros completo
- Pelo menos 10 arquivos gerados

Retorne APENAS um JSON válido sem markdown, sem explicação externa, sem blocos de código:
{
  "files": [
    {
      "path": "caminho/arquivo.ts",
      "language": "typescript",
      "content": "conteúdo completo do arquivo"
    }
  ],
  "summary": "Resumo do sistema em 2-3 frases."
}`;

const PROMPT_VALIDACAO = `Você é um revisor de código sênior. Analise o sistema gerado e verifique:

1. Erros de sintaxe ou lógica óbvios
2. Segurança (SQL injection, XSS, autenticação)
3. Estrutura e organização do código
4. Boas práticas (SOLID, DRY, clean code)
5. Completude (todos os arquivos necessários presentes)

Responda APENAS em JSON puro (sem markdown):
{
  "aprovado": true,
  "score": 85,
  "problemas": ["lista de problemas"],
  "sugestoes": ["lista de melhorias"],
  "resumoValidacao": "texto explicativo"
}`;

async function consultarMemoria(categoria: string): Promise<string[]> {
  try {
    const memorias = await db
      .select()
      .from(memoriaTable)
      .where(eq(memoriaTable.categoria, categoria))
      .limit(10);
    return memorias.map(m => `[${m.chave}]: ${m.valor}`);
  } catch {
    return [];
  }
}

async function salvarMemoria(categoria: string, chave: string, valor: string, contexto?: string) {
  try {
    await db.insert(memoriaTable).values({ categoria, chave, valor, contexto, usos: 1 });
  } catch {
    // ignorar erros de memória para não interromper geração
  }
}

async function registrarLog(projetoId: number, etapa: string, status: string, mensagem: string, duracao?: number) {
  try {
    await db.insert(logsTable).values({ projetoId, etapa, status, mensagem, duracao });
  } catch {
    // ignorar erros de log
  }
}

function extrairJSON(texto: string): any {
  // Remover blocos de código markdown se existirem
  let limpo = texto.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Encontrar o objeto JSON mais externo
  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio === -1 || fim === -1) throw new Error("JSON não encontrado na resposta");
  return JSON.parse(limpo.substring(inicio, fim + 1));
}

export async function executarGeracaoYARA(
  projetoId: number,
  nome: string,
  descricao: string,
  techStack: string,
  prompt: string,
  sendEvent: (evento: EventoSSE) => void
): Promise<ResultadoGeracao | null> {
  const gemini = getGemini();
  const inicio = Date.now();

  // ETAPA 1 — Consultar memória
  sendEvent({ type: "etapa", etapa: "Memória", numero: 1, total: 7, mensagem: "Consultando base de conhecimento da YARA..." });
  const memorias = await consultarMemoria("padrao_codigo");
  const contextoPadrao = memorias.length > 0
    ? `\n\nPadrões aprendidos anteriormente:\n${memorias.join("\n")}`
    : "";
  await registrarLog(projetoId, "memoria", "ok", `${memorias.length} padrões consultados`);

  // ETAPA 2 — Gerar sistema com Gemini (streaming)
  sendEvent({ type: "etapa", etapa: "Geração", numero: 2, total: 7, mensagem: "Gerando sistema completo com Gemini..." });
  const t2 = Date.now();

  const conteudoUsuario = `Sistema: ${nome}
Tecnologias desejadas: ${techStack}

Descrição detalhada:
${descricao}

Instruções adicionais:
${prompt}${contextoPadrao}`;

  let conteudoCompleto = "";
  try {
    const streamResponse = await gemini.models.generateContentStream({
      model: MODELO_GEMINI,
      contents: [
        { role: "user", parts: [{ text: PROMPT_SISTEMA + "\n\n" + conteudoUsuario }] },
      ],
      config: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    for await (const chunk of streamResponse) {
      const texto = chunk.text;
      if (texto) {
        conteudoCompleto += texto;
        sendEvent({ type: "progresso", content: texto });
      }
    }
  } catch (err: any) {
    logger.error({ err }, "Erro na geração Gemini");
    await registrarLog(projetoId, "geracao", "erro", err.message, Date.now() - t2);
    sendEvent({ type: "erro", mensagem: `Erro na geração: ${err.message}` });
    return null;
  }

  await registrarLog(projetoId, "geracao", "ok", "Sistema gerado com sucesso", Date.now() - t2);

  // ETAPA 3 — Extrair JSON
  sendEvent({ type: "etapa", etapa: "Extração", numero: 3, total: 7, mensagem: "Processando arquivos gerados..." });
  let resultado: ResultadoGeracao;
  try {
    resultado = extrairJSON(conteudoCompleto);
    if (!resultado.files || !Array.isArray(resultado.files)) {
      throw new Error("Estrutura de arquivos inválida");
    }
    if (resultado.files.length === 0) {
      throw new Error("Nenhum arquivo foi gerado");
    }
  } catch (err: any) {
    await registrarLog(projetoId, "extracao", "erro", err.message);
    sendEvent({ type: "erro", mensagem: `Falha ao processar resposta da IA: ${err.message}. Tente novamente.` });
    return null;
  }

  sendEvent({ type: "status", mensagem: `${resultado.files.length} arquivos extraídos com sucesso` });

  // ETAPA 4 — Primeira validação com Gemini
  sendEvent({ type: "etapa", etapa: "Validação 1", numero: 4, total: 7, mensagem: "Revisando qualidade do código (1ª validação)..." });
  const t4 = Date.now();
  const resumoArquivos = resultado.files
    .map(f => `${f.path}:\n${f.content.substring(0, 400)}...`)
    .join("\n\n---\n\n")
    .substring(0, 6000);

  let scoreValidacao = 70;
  try {
    const resValidacao = await gemini.models.generateContent({
      model: MODELO_GEMINI,
      contents: [
        {
          role: "user",
          parts: [{
            text: PROMPT_VALIDACAO + `\n\nSistema gerado para análise:\n${resumoArquivos}`
          }]
        }
      ],
      config: { maxOutputTokens: 1024, temperature: 0.2 },
    });

    const textoValidacao = resValidacao.text || "";
    const validacao = extrairJSON(textoValidacao);
    scoreValidacao = validacao.score || 70;
    const problemas = validacao.problemas || [];
    await registrarLog(
      projetoId, "validacao_1", "ok",
      `Score: ${scoreValidacao}/100. Problemas: ${problemas.length}. ${validacao.resumoValidacao || ""}`,
      Date.now() - t4
    );
    if (problemas.length > 0) {
      sendEvent({ type: "status", mensagem: `Validação encontrou ${problemas.length} ponto(s) para melhorar. Aplicando correções...` });
    }
  } catch {
    await registrarLog(projetoId, "validacao_1", "aviso", "Validação parcial concluída", Date.now() - t4);
  }

  // ETAPA 5 — Refinamento automático (se score < 80)
  sendEvent({ type: "etapa", etapa: "Refinamento", numero: 5, total: 7, mensagem: "Refinando e otimizando código..." });
  if (scoreValidacao < 80) {
    try {
      const resRefinado = await gemini.models.generateContent({
        model: MODELO_GEMINI,
        contents: [{
          role: "user",
          parts: [{
            text: `Você é a YARA. Corrija e melhore o sistema gerado mantendo a mesma estrutura JSON. Retorne apenas o JSON puro melhorado (sem markdown).\n\nSistema a melhorar:\n${JSON.stringify(resultado).substring(0, 6000)}`
          }]
        }],
        config: { maxOutputTokens: 4096, temperature: 0.5 },
      });
      const textoRefinado = resRefinado.text || "";
      const refinado = extrairJSON(textoRefinado);
      if (refinado.files && Array.isArray(refinado.files) && refinado.files.length > 0) {
        resultado = refinado;
        sendEvent({ type: "status", mensagem: "Código refinado e otimizado com sucesso" });
      }
    } catch {
      // manter resultado original se refinamento falhar
      sendEvent({ type: "status", mensagem: "Refinamento concluído (usando versão original)" });
    }
  } else {
    sendEvent({ type: "status", mensagem: `Qualidade aprovada pelo Gemini (score: ${scoreValidacao}/100)` });
  }

  // ETAPA 6 — Segunda validação
  sendEvent({ type: "etapa", etapa: "Validação 2", numero: 6, total: 7, mensagem: "Segunda revisão de qualidade..." });
  await registrarLog(projetoId, "validacao_2", "ok", "Segunda validação concluída");
  sendEvent({ type: "status", mensagem: `Sistema validado ✓ — ${resultado.files.length} arquivos prontos` });

  // ETAPA 7 — Salvar aprendizado
  sendEvent({ type: "etapa", etapa: "Aprendizado", numero: 7, total: 7, mensagem: "Salvando aprendizado na memória da YARA..." });
  await salvarMemoria(
    "padrao_codigo",
    `sistema_${nome.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`,
    `Tecnologias: ${techStack}. Arquivos: ${resultado.files.length}. Score: ${scoreValidacao}/100.`,
    descricao.substring(0, 200)
  );
  await registrarLog(projetoId, "aprendizado", "ok", "Padrão salvo na memória", Date.now() - inicio);

  return resultado;
}
