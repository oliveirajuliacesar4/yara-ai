import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Terminal, ArrowLeft, Loader2, CheckCircle2, XCircle,
  Cpu, Brain, Code2, ShieldCheck, Wand2, BookOpen, Zap
} from "lucide-react";

type EntradaLog = {
  id: number;
  hora: string;
  tipo: "status" | "progresso" | "erro" | "completo" | "concluido" | "info";
  mensagem: string;
};

type EtapaInfo = {
  nome: string;
  icone: React.ElementType;
  descricao: string;
};

const ETAPAS: EtapaInfo[] = [
  { nome: "Memória", icone: Brain, descricao: "Consultando base de conhecimento" },
  { nome: "Geração", icone: Code2, descricao: "Gerando código completo" },
  { nome: "Extração", icone: Cpu, descricao: "Processando arquivos" },
  { nome: "Validação 1", icone: ShieldCheck, descricao: "Revisando qualidade" },
  { nome: "Refinamento", icone: Wand2, descricao: "Otimizando código" },
  { nome: "Validação 2", icone: ShieldCheck, descricao: "Segunda revisão" },
  { nome: "Aprendizado", icone: BookOpen, descricao: "Salvando na memória" },
];

function parseEtapaAtual(logs: EntradaLog[]): number {
  for (let i = logs.length - 1; i >= 0; i--) {
    const m = logs[i].mensagem.match(/^\[(\d+)\/\d+\]/);
    if (m) return parseInt(m[1], 10) - 1;
  }
  return -1;
}

export default function GerarProjeto() {
  const { id } = useParams();
  const projetoId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const fimLogsRef = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<EntradaLog[]>([]);
  const [progresso, setProgresso] = useState(0);
  const [gerando, setGerando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [iniciou, setIniciou] = useState(false);
  const [totalArquivos, setTotalArquivos] = useState(0);

  const { data: projeto } = useGetProject(projetoId, {
    query: {
      enabled: !!projetoId,
      queryKey: getGetProjectQueryKey(projetoId),
    },
  });

  useEffect(() => {
    if (projeto && !prompt && !iniciou) {
      setPrompt(
        `Gere uma aplicação completa e pronta para produção baseada nesta descrição:\n\n${projeto.description}`
      );
    }
  }, [projeto, prompt, iniciou]);

  useEffect(() => {
    fimLogsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const adicionarLog = (tipo: EntradaLog["tipo"], mensagem: string) => {
    setLogs((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), hora: new Date().toLocaleTimeString("pt-BR"), tipo, mensagem },
    ]);
  };

  const iniciarGeracao = async () => {
    if (!prompt.trim() || gerando) return;
    setGerando(true);
    setIniciou(true);
    setConcluido(false);
    setErro(false);
    setProgresso(3);
    setLogs([]);
    setTotalArquivos(0);
    adicionarLog("info", "YARA inicializada — iniciando pipeline de geração...");

    try {
      const resposta = await fetch(`/api/projects/${projetoId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });

      if (!resposta.ok) throw new Error("Falha ao iniciar a geração");
      if (!resposta.body) throw new Error("Sem corpo na resposta");

      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();

      while (true) {
        const { done, value } = await leitor.read();
        if (done) break;

        const fragmento = decodificador.decode(value, { stream: true });
        const linhas = fragmento.split("\n\n");

        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          try {
            const dados = JSON.parse(linha.substring(6));
            if (dados.type === "status") {
              adicionarLog("status", dados.message);
              setProgresso((prev) => Math.min(prev + 10, 92));
            } else if (dados.type === "progress") {
              // ignorar chunks brutos de streaming
            } else if (dados.type === "complete") {
              setTotalArquivos(dados.fileCount || 0);
              adicionarLog(
                "completo",
                `✓ ${dados.fileCount} arquivos gerados com sucesso.\n${dados.summary || ""}`
              );
              setProgresso(100);
            } else if (dados.type === "error") {
              adicionarLog("erro", `✗ ${dados.message}`);
              setErro(true);
              setGerando(false);
              return;
            } else if (dados.type === "done") {
              setConcluido(true);
              setGerando(false);
              queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projetoId) });
            }
          } catch {
            // ignorar erros de parsing SSE parciais
          }
        }
      }
    } catch (e: any) {
      adicionarLog("erro", `✗ ${e.message || "Erro inesperado"}`);
      setErro(true);
      setGerando(false);
    }
  };

  const etapaAtual = parseEtapaAtual(logs);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button
        variant="ghost"
        className="gap-2 -ml-4 text-muted-foreground hover:text-foreground"
        onClick={() => setLocation(`/projetos/${projetoId}`)}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Projeto
      </Button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          Geração do Sistema
        </h1>
        <p className="text-muted-foreground text-sm">
          A YARA usará 7 etapas de validação para criar seu sistema.
        </p>
      </div>

      {!iniciou ? (
        <Card className="p-6 space-y-6 border-primary/20 yara-glow">
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              Instruções para a YARA
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[180px] p-4 font-mono text-sm bg-secondary/40 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y placeholder:text-muted-foreground/50"
              placeholder="Descreva o sistema que deseja gerar em detalhes..."
              data-testid="input-prompt-geracao"
            />
          </div>

          {/* Preview das 7 etapas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {ETAPAS.map((etapa, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-secondary/30 border border-border/50 text-center">
                <etapa.icone className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-mono">{i + 1}. {etapa.nome}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={iniciarGeracao}
              disabled={!prompt.trim()}
              className="gap-2 font-bold px-8"
              data-testid="btn-confirmar-geracao"
            >
              <Zap className="w-5 h-5" />
              Iniciar Geração com YARA
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Barra de progresso */}
          <Card className="p-4 border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {gerando ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : concluido ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-sm font-mono font-medium text-primary uppercase tracking-wider">
                  {gerando
                    ? "Processando..."
                    : concluido
                    ? `Concluído — ${totalArquivos} arquivos`
                    : "Falhou"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">{progresso}%</span>
            </div>
            <Progress value={progresso} className="h-1.5" />
          </Card>

          {/* Pipeline das etapas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {ETAPAS.map((etapa, i) => {
              const ativa = i === etapaAtual && gerando;
              const concl = concluido || i < etapaAtual;
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                    ativa
                      ? "bg-primary/10 border-primary/40 yara-glow"
                      : concl
                      ? "bg-green-500/5 border-green-500/20"
                      : "bg-secondary/20 border-border/40"
                  }`}
                >
                  {concl ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : ativa ? (
                    <etapa.icone className="w-4 h-4 text-primary yara-pulse" />
                  ) : (
                    <etapa.icone className="w-4 h-4 text-muted-foreground/40" />
                  )}
                  <span
                    className={`text-xs font-mono ${
                      ativa
                        ? "text-primary"
                        : concl
                        ? "text-green-500"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {i + 1}. {etapa.nome}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Terminal de logs */}
          <Card className="overflow-hidden border-border">
            <div className="bg-secondary/60 px-4 py-2 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs font-mono text-muted-foreground ml-2">
                yara — pipeline de geração
              </span>
            </div>
            <div className="p-4 h-[400px] overflow-y-auto font-mono text-sm space-y-1.5 bg-[#080c14]">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 leading-relaxed">
                  <span className="text-muted-foreground/50 shrink-0 text-xs pt-0.5">{log.hora}</span>
                  <span
                    className={`break-words flex-1 ${
                      log.tipo === "erro"
                        ? "text-red-400"
                        : log.tipo === "completo" || log.tipo === "concluido"
                        ? "text-green-400"
                        : log.tipo === "status"
                        ? "text-primary"
                        : log.tipo === "info"
                        ? "text-accent-foreground"
                        : "text-foreground/70"
                    }`}
                  >
                    {log.mensagem}
                  </span>
                </div>
              ))}
              {gerando && (
                <div className="flex gap-3 text-primary/50">
                  <span className="text-xs">...</span>
                  <span className="yara-pulse">█</span>
                </div>
              )}
              <div ref={fimLogsRef} />
            </div>
          </Card>

          {(concluido || erro) && (
            <div className="flex justify-end gap-3">
              {erro && (
                <Button variant="outline" onClick={iniciarGeracao}>
                  Tentar Novamente
                </Button>
              )}
              <Button onClick={() => setLocation(`/projetos/${projetoId}`)} size="lg" className="gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Ver Sistema Gerado
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
