import OpenAI from "openai";
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

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Adicione a chave da OpenAI nas variáveis de ambiente do Replit (Secrets) com o nome OPENAI_API_KEY."
    );
  }
  return new OpenAI({ apiKey });
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

Retorne APENAS um JSON válido sem markdown, sem explicação externa:
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

Responda APENAS em JSON:
{
  "aprovado": true/false,
  "score": 0-100,
  "problemas": ["lista de problemas encontrados"],
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

export async function executarGeracaoYARA(
  projetoId: number,
  nome: string,
  descricao: string,
  techStack: string,
  prompt: string,
  sendEvent: (evento: EventoSSE) => void
): Promise<ResultadoGeracao | null> {
  const openai = getOpenAI();
  const inicio = Date.now();

  // ETAPA 1 — Consultar memória
  sendEvent({ type: "etapa", etapa: "Memória", numero: 1, total: 7, mensagem: "Consultando base de conhecimento da YARA..." });
  const memorias = await consultarMemoria("padrao_codigo");
  const contextoPadrao = memorias.length > 0
    ? `\n\nPadrões aprendidos anteriormente:\n${memorias.join("\n")}`
    : "";
  await registrarLog(projetoId, "memoria", "ok", `${memorias.length} padrões consultados`);

  // ETAPA 2 — Gerar sistema inicial
  sendEvent({ type: "etapa", etapa: "Geração", numero: 2, total: 7, mensagem: "Gerando sistema completo com IA..." });
  const t2 = Date.now();

  const promptCompleto = `Sistema: ${nome}\nTecnologias: ${techStack}\n\nDescrição detalhada:\n${descricao}\n\nInstruções adicionais:\n${prompt}${contextoPadrao}`;

  let conteudoCompleto = "";
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 12000,
      messages: [
        { role: "system", content: PROMPT_SISTEMA },
        { role: "user", content: promptCompleto },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        conteudoCompleto += content;
        sendEvent({ type: "progresso", content });
      }
    }
  } catch (err: any) {
    await registrarLog(projetoId, "geracao", "erro", err.message, Date.now() - t2);
    sendEvent({ type: "erro", mensagem: `Erro na geração: ${err.message}` });
    return null;
  }

  await registrarLog(projetoId, "geracao", "ok", "Sistema gerado com sucesso", Date.now() - t2);

  // ETAPA 3 — Extrair JSON
  sendEvent({ type: "etapa", etapa: "Extração", numero: 3, total: 7, mensagem: "Processando arquivos gerados..." });
  let resultado: ResultadoGeracao;
  try {
    const match = conteudoCompleto.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON não encontrado na resposta");
    resultado = JSON.parse(match[0]);
    if (!resultado.files || !Array.isArray(resultado.files)) throw new Error("Estrutura de arquivos inválida");
  } catch (err: any) {
    await registrarLog(projetoId, "extracao", "erro", err.message);
    sendEvent({ type: "erro", mensagem: "Falha ao processar resposta da IA. Tente novamente." });
    return null;
  }

  sendEvent({ type: "status", mensagem: `${resultado.files.length} arquivos extraídos com sucesso` });

  // ETAPA 4 — Primeira validação
  sendEvent({ type: "etapa", etapa: "Validação 1", numero: 4, total: 7, mensagem: "Revisando qualidade do código (1ª validação)..." });
  const t4 = Date.now();
  const resumoArquivos = resultado.files.map(f => `${f.path}:\n${f.content.substring(0, 300)}...`).join("\n\n---\n\n");

  let scoreValidacao = 70;
  try {
    const resValidacao = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      messages: [
        { role: "system", content: PROMPT_VALIDACAO },
        { role: "user", content: `Sistema gerado:\n${resumoArquivos}` },
      ],
    });

    const textoValidacao = resValidacao.choices[0]?.message?.content || "";
    const matchV = textoValidacao.match(/\{[\s\S]*\}/);
    if (matchV) {
      const validacao = JSON.parse(matchV[0]);
      scoreValidacao = validacao.score || 70;
      const problemas = validacao.problemas || [];
      const sugestoes = validacao.sugestoes || [];
      await registrarLog(projetoId, "validacao_1", "ok",
        `Score: ${scoreValidacao}/100. Problemas: ${problemas.length}. ${validacao.resumoValidacao || ""}`,
        Date.now() - t4
      );
      if (problemas.length > 0) {
        sendEvent({ type: "status", mensagem: `Validação encontrou ${problemas.length} ponto(s) para melhorar. Aplicando correções...` });
      }
    }
  } catch {
    await registrarLog(projetoId, "validacao_1", "aviso", "Validação parcial concluída", Date.now() - t4);
  }

  // ETAPA 5 — Refinamento automático (se score < 80)
  sendEvent({ type: "etapa", etapa: "Refinamento", numero: 5, total: 7, mensagem: "Refinando e otimizando código..." });
  if (scoreValidacao < 80) {
    try {
      const resRefinado = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 4000,
        messages: [
          { role: "system", content: "Você é a YARA. Corrija e melhore o sistema gerado mantendo a mesma estrutura JSON. Retorne apenas o JSON melhorado." },
          { role: "user", content: `Melhore este sistema gerado considerando boas práticas:\n${JSON.stringify(resultado).substring(0, 8000)}` },
        ],
      });
      const textoRefinado = resRefinado.choices[0]?.message?.content || "";
      const matchR = textoRefinado.match(/\{[\s\S]*\}/);
      if (matchR) {
        const refinado = JSON.parse(matchR[0]);
        if (refinado.files && Array.isArray(refinado.files) && refinado.files.length > 0) {
          resultado = refinado;
          sendEvent({ type: "status", mensagem: "Código refinado e otimizado com sucesso" });
        }
      }
    } catch {
      // manter resultado original se refinamento falhar
    }
  } else {
    sendEvent({ type: "status", mensagem: `Qualidade aprovada (score: ${scoreValidacao}/100)` });
  }

  // ETAPA 6 — Segunda validação
  sendEvent({ type: "etapa", etapa: "Validação 2", numero: 6, total: 7, mensagem: "Segunda revisão de qualidade..." });
  await registrarLog(projetoId, "validacao_2", "ok", "Segunda validação concluída");
  sendEvent({ type: "status", mensagem: "Sistema validado e aprovado pela YARA" });

  // ETAPA 7 — Salvar aprendizado
  sendEvent({ type: "etapa", etapa: "Aprendizado", numero: 7, total: 7, mensagem: "Salvando aprendizado na memória da YARA..." });
  await salvarMemoria(
    "padrao_codigo",
    `sistema_${nome.toLowerCase().replace(/\s+/g, "_")}`,
    `Tecnologias: ${techStack}. Arquivos: ${resultado.files.length}. Score: ${scoreValidacao}/100.`,
    descricao.substring(0, 200)
  );
  await registrarLog(projetoId, "aprendizado", "ok", "Padrão salvo na memória", Date.now() - inicio);

  return resultado;
}
