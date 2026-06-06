import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useGetProject, getGetProjectQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Terminal, ArrowLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";

type EntradaLog = {
  id: number;
  hora: string;
  tipo: "status" | "progresso" | "erro" | "completo" | "concluido" | "info";
  mensagem: string;
};

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
  const [prompt, setPrompt] = useState("");
  const [iniciou, setIniciou] = useState(false);

  const { data: projeto } = useGetProject(projetoId, {
    query: {
      enabled: !!projetoId,
      queryKey: getGetProjectQueryKey(projetoId)
    }
  });

  useEffect(() => {
    if (projeto && !prompt && !iniciou) {
      setPrompt(`Gere uma aplicação pronta para produção com base nesta descrição:\n\n${projeto.description}`);
    }
  }, [projeto, prompt, iniciou]);

  useEffect(() => {
    fimLogsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const adicionarLog = (tipo: EntradaLog["tipo"], mensagem: string) => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      hora: new Date().toLocaleTimeString("pt-BR"),
      tipo,
      mensagem
    }]);
  };

  const iniciarGeracao = async () => {
    if (!prompt.trim() || gerando) return;

    setGerando(true);
    setIniciou(true);
    setConcluido(false);
    setProgresso(5);
    setLogs([]);
    adicionarLog("info", "Inicializando arquiteto de IA...");

    try {
      const resposta = await fetch(`/api/projects/${projetoId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });

      if (!resposta.ok) {
        throw new Error("Falha ao iniciar a geração");
      }

      if (!resposta.body) {
        throw new Error("Sem corpo na resposta");
      }

      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();

      while (true) {
        const { done, value } = await leitor.read();
        if (done) break;

        const fragmento = decodificador.decode(value, { stream: true });
        const linhas = fragmento.split("\n\n");

        for (const linha of linhas) {
          if (linha.startsWith("data: ")) {
            try {
              const dados = JSON.parse(linha.substring(6));

              if (dados.type === "status") {
                adicionarLog("status", dados.message);
                setProgresso(prev => Math.min(prev + 5, 90));
              } else if (dados.type === "progress") {
                adicionarLog("progresso", `Escrevendo: \n${dados.content.substring(0, 100)}...`);
              } else if (dados.type === "complete") {
                adicionarLog("completo", `Geração concluída. ${dados.fileCount} arquivos criados.\n${dados.summary}`);
                setProgresso(100);
              } else if (dados.type === "error") {
                adicionarLog("erro", dados.message);
                setGerando(false);
                return;
              } else if (dados.type === "done") {
                setConcluido(true);
                setGerando(false);
                adicionarLog("concluido", "Sistema pronto.");
                queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projetoId) });
              }
            } catch (e) {
              // ignorar erros de parsing de SSE parciais
            }
          }
        }
      }
    } catch (erro: any) {
      adicionarLog("erro", erro.message || "Ocorreu um erro inesperado");
      setGerando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => setLocation(`/projetos/${projetoId}`)}>
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Projeto
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Geração do Sistema</h1>
        <p className="text-muted-foreground">A IA está pronta para construir sua aplicação.</p>
      </div>

      {!iniciou ? (
        <Card className="p-6 space-y-6 border-primary/20 bg-card">
          <div className="space-y-4">
            <h3 className="font-medium text-lg flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Instruções para a IA
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[200px] p-4 font-mono text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-foreground resize-y"
              placeholder="Descreva o sistema que deseja gerar..."
              data-testid="input-prompt-geracao"
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={iniciarGeracao}
              disabled={!prompt.trim() || gerando}
              className="font-bold text-md px-8"
              data-testid="btn-confirmar-geracao"
            >
              Iniciar Geração
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="flex-1">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium font-mono text-primary uppercase tracking-wider">
                  {gerando ? "Processando..." : concluido ? "Concluído" : "Falhou"}
                </span>
                <span className="text-sm text-muted-foreground font-mono">{progresso}%</span>
              </div>
              <Progress value={progresso} className="h-2" />
            </div>
            <div className="w-12 flex justify-center">
              {gerando ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : concluido ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-destructive" />
              )}
            </div>
          </div>

          <Card className="bg-[#0d1117] border-border overflow-hidden">
            <div className="bg-[#161b22] px-4 py-2 border-b border-border flex items-center gap-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground">Saída do Terminal</span>
            </div>
            <div className="p-4 h-[500px] overflow-y-auto font-mono text-sm space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <span className="text-muted-foreground shrink-0">{log.hora}</span>
                  <span className={`whitespace-pre-wrap break-words ${
                    log.tipo === "erro" ? "text-destructive" :
                    log.tipo === "completo" || log.tipo === "concluido" ? "text-green-400" :
                    log.tipo === "status" ? "text-primary" :
                    "text-gray-300"
                  }`}>
                    {log.mensagem}
                  </span>
                </div>
              ))}
              {gerando && (
                <div className="flex gap-4 animate-pulse text-muted-foreground">
                  <span>...</span>
                  <span>_</span>
                </div>
              )}
              <div ref={fimLogsRef} />
            </div>
          </Card>

          {concluido && (
            <div className="flex justify-end pt-4">
              <Button onClick={() => setLocation(`/projetos/${projetoId}`)} size="lg">
                Ver Sistema Gerado
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
