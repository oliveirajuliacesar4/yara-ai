import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetProject,
  useListProjectFiles,
  useDeleteProject,
  getGetProjectQueryKey,
  getListProjectFilesQueryKey
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Terminal, FileCode2, Play, Trash2, ArrowLeft, Activity, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DetalhesProjeto() {
  const { id } = useParams();
  const projetoId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();

  const [arquivoSelecionado, setArquivoSelecionado] = useState<string | null>(null);

  const { data: projeto, isLoading: carregandoProjeto } = useGetProject(projetoId, {
    query: {
      enabled: !!projetoId,
      queryKey: getGetProjectQueryKey(projetoId)
    }
  });

  const { data: arquivos, isLoading: carregandoArquivos } = useListProjectFiles(projetoId, {
    query: {
      enabled: !!projetoId && projeto?.status === "completed",
      queryKey: getListProjectFilesQueryKey(projetoId)
    }
  });

  const excluirProjeto = useDeleteProject({
    mutation: {
      onSuccess: () => {
        setLocation("/painel");
      }
    }
  });

  const aoExcluir = () => {
    if (confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
      excluirProjeto.mutate({ id: projetoId });
    }
  };

  const obterIconeStatus = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "generating": return <Activity className="w-4 h-4 text-primary animate-pulse" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Terminal className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const traduzirStatus = (status: string) => {
    switch (status) {
      case "completed": return "Concluído";
      case "generating": return "Gerando";
      case "failed": return "Falhou";
      default: return "Pendente";
    }
  };

  if (carregandoProjeto) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <Button className="mt-4" onClick={() => setLocation("/painel")}>Voltar ao Painel</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 -ml-4" onClick={() => setLocation("/painel")}>
          <ArrowLeft className="w-4 h-4" />
          Painel
        </Button>
        <div className="flex gap-2">
          {projeto.status === "pending" || projeto.status === "failed" ? (
            <Button onClick={() => setLocation(`/projetos/${projeto.id}/gerar`)} className="gap-2" data-testid="btn-iniciar-geracao">
              <Play className="w-4 h-4" />
              Gerar Código
            </Button>
          ) : projeto.status === "generating" ? (
            <Button disabled variant="outline" className="gap-2">
              <Activity className="w-4 h-4 animate-pulse text-primary" />
              Gerando...
            </Button>
          ) : null}
          <Button variant="destructive" size="icon" onClick={aoExcluir} data-testid="btn-excluir-projeto">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{projeto.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Criado em {format(new Date(projeto.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="flex gap-2 items-center px-3 py-1">
                  {obterIconeStatus(projeto.status)}
                  <span>{traduzirStatus(projeto.status)}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 whitespace-pre-wrap">{projeto.description}</p>
            </CardContent>
          </Card>

          {projeto.status === "completed" && (
            <Card className="min-h-[500px] flex flex-col overflow-hidden">
              <CardHeader className="bg-secondary/50 border-b border-border py-3">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-primary" />
                  Código Gerado
                </CardTitle>
              </CardHeader>
              <div className="flex flex-1 overflow-hidden">
                {/* Explorador de Arquivos */}
                <div className="w-64 border-r border-border bg-secondary/20 p-2 overflow-y-auto">
                  {carregandoArquivos ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : arquivos && arquivos.length > 0 ? (
                    <div className="space-y-1">
                      {arquivos.map(arquivo => (
                        <button
                          key={arquivo.id}
                          onClick={() => setArquivoSelecionado(arquivo.path)}
                          data-testid={`arquivo-${arquivo.id}`}
                          className={`w-full text-left px-3 py-2 text-sm font-mono rounded-md transition-colors truncate ${
                            arquivoSelecionado === arquivo.path
                              ? "bg-primary/20 text-primary"
                              : "hover:bg-secondary text-muted-foreground"
                          }`}
                        >
                          {arquivo.path}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-4 text-center">Nenhum arquivo gerado</div>
                  )}
                </div>

                {/* Conteúdo do Arquivo */}
                <div className="flex-1 bg-[#0d1117] overflow-auto relative">
                  {arquivoSelecionado ? (
                    <pre className="p-4 text-sm font-mono text-gray-300">
                      <code>
                        {arquivos?.find(f => f.path === arquivoSelecionado)?.content || ""}
                      </code>
                    </pre>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FileCode2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Selecione um arquivo para visualizar o conteúdo</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Tecnologias</div>
                <Badge variant="secondary" className="font-mono">{projeto.techStack || "Detecção automática"}</Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">ID do Projeto</div>
                <div className="font-mono text-sm">{projeto.id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Última Atualização</div>
                <div className="text-sm">{format(new Date(projeto.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
              </div>
              {projeto.generatedCode && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Resumo</div>
                  <div className="text-sm text-foreground/80">{projeto.generatedCode}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
