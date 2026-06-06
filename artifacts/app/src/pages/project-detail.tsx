import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetProject,
  useListProjectFiles,
  useDeleteProject,
  usePublishToGithub,
  getGetProjectQueryKey,
  getListProjectFilesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Terminal, FileCode2, Play, Trash2, ArrowLeft, Activity,
  CheckCircle2, XCircle, Github, ExternalLink, Copy, Check,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function obterIconeStatus(status: string) {
  switch (status) {
    case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "generating": return <Activity className="w-4 h-4 text-primary animate-pulse" />;
    case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
    default: return <Terminal className="w-4 h-4 text-muted-foreground" />;
  }
}

function traduzirStatus(status: string) {
  switch (status) {
    case "completed": return "Concluído";
    case "generating": return "Gerando";
    case "failed": return "Falhou";
    default: return "Pendente";
  }
}

function variantStatus(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed": return "default";
    case "failed": return "destructive";
    default: return "secondary";
  }
}

export default function DetalhesProjeto() {
  const { id } = useParams();
  const projetoId = parseInt(id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [arquivoSelecionado, setArquivoSelecionado] = useState<string | null>(null);
  const [copiadoArquivo, setCopiadoArquivo] = useState(false);
  const [modalGithub, setModalGithub] = useState(false);
  const [repoNome, setRepoNome] = useState("");
  const [repoPrivado, setRepoPrivado] = useState(false);
  const [githubErro, setGithubErro] = useState("");
  const [githubSucesso, setGithubSucesso] = useState<string | null>(null);

  const { data: projeto, isLoading: carregandoProjeto } = useGetProject(projetoId, {
    query: { enabled: !!projetoId, queryKey: getGetProjectQueryKey(projetoId) },
  });

  const { data: arquivos, isLoading: carregandoArquivos } = useListProjectFiles(projetoId, {
    query: {
      enabled: !!projetoId && projeto?.status === "completed",
      queryKey: getListProjectFilesQueryKey(projetoId),
    },
  });

  const excluirProjeto = useDeleteProject({
    mutation: { onSuccess: () => setLocation("/painel") },
  });

  const publicarGithub = usePublishToGithub({
    mutation: {
      onSuccess: (data) => {
        setGithubSucesso(data.url);
        setGithubErro("");
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projetoId) });
      },
      onError: (err: any) => {
        setGithubErro(err?.response?.data?.error || "Erro ao publicar no GitHub");
      },
    },
  });

  const aoExcluir = () => {
    if (confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
      excluirProjeto.mutate({ id: projetoId });
    }
  };

  const aoPublicarGithub = () => {
    if (!repoNome.trim() || repoNome.length < 2) {
      setGithubErro("Nome do repositório deve ter pelo menos 2 caracteres");
      return;
    }
    setGithubErro("");
    setGithubSucesso(null);
    publicarGithub.mutate({
      id: projetoId,
      data: { repoName: repoNome.trim(), privado: repoPrivado },
    });
  };

  const copiarConteudo = () => {
    const conteudo = arquivos?.find((f) => f.path === arquivoSelecionado)?.content;
    if (conteudo) {
      navigator.clipboard.writeText(conteudo);
      setCopiadoArquivo(true);
      setTimeout(() => setCopiadoArquivo(false), 2000);
    }
  };

  const abrirModalGithub = () => {
    if (projeto) {
      setRepoNome(
        projeto.name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
    setGithubErro("");
    setGithubSucesso(null);
    setModalGithub(true);
  };

  if (carregandoProjeto) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <Button className="mt-4" onClick={() => setLocation("/painel")}>
          Voltar ao Painel
        </Button>
      </div>
    );
  }

  const arquivoAtual = arquivos?.find((f) => f.path === arquivoSelecionado);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Topo */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="ghost"
          className="gap-2 -ml-4 text-muted-foreground hover:text-foreground"
          onClick={() => setLocation("/painel")}
        >
          <ArrowLeft className="w-4 h-4" />
          Painel
        </Button>
        <div className="flex gap-2 flex-wrap">
          {projeto.status === "completed" && (
            <>
              {projeto.githubUrl ? (
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href={projeto.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                    Ver no GitHub
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-white"
                  onClick={abrirModalGithub}
                  data-testid="btn-publicar-github"
                >
                  <Github className="w-4 h-4" />
                  Publicar no GitHub
                </Button>
              )}
            </>
          )}
          {(projeto.status === "pending" || projeto.status === "failed") && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => setLocation(`/projetos/${projeto.id}/gerar`)}
              data-testid="btn-iniciar-geracao"
            >
              <Play className="w-4 h-4" />
              Gerar com YARA
            </Button>
          )}
          {projeto.status === "generating" && (
            <Button disabled variant="outline" size="sm" className="gap-2">
              <Activity className="w-4 h-4 animate-pulse text-primary" />
              Gerando...
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={aoExcluir}
            data-testid="btn-excluir-projeto"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Grid de conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl mb-1 truncate">{projeto.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    Criado em{" "}
                    {format(new Date(projeto.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </div>
                <Badge variant={variantStatus(projeto.status)} className="flex gap-1.5 items-center shrink-0">
                  {obterIconeStatus(projeto.status)}
                  {traduzirStatus(projeto.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 whitespace-pre-wrap text-sm leading-relaxed">
                {projeto.description}
              </p>
            </CardContent>
          </Card>

          {/* Explorador de arquivos */}
          {projeto.status === "completed" && (
            <Card className="min-h-[520px] flex flex-col overflow-hidden border-border">
              <CardHeader className="bg-secondary/40 border-b border-border py-2.5 px-4">
                <CardTitle className="text-xs font-mono flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <FileCode2 className="w-3.5 h-3.5 text-primary" />
                  Arquivos Gerados
                  {arquivos && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {arquivos.length} arquivos
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <div className="flex flex-1 overflow-hidden">
                {/* Lista de arquivos */}
                <div className="w-56 border-r border-border bg-secondary/10 p-1.5 overflow-y-auto shrink-0">
                  {carregandoArquivos ? (
                    <div className="space-y-1.5 p-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-7 w-full" />
                      ))}
                    </div>
                  ) : arquivos && arquivos.length > 0 ? (
                    <div className="space-y-0.5">
                      {arquivos.map((arquivo) => (
                        <button
                          key={arquivo.id}
                          onClick={() => setArquivoSelecionado(arquivo.path)}
                          data-testid={`arquivo-${arquivo.id}`}
                          className={`w-full text-left px-2.5 py-1.5 text-xs font-mono rounded transition-colors truncate ${
                            arquivoSelecionado === arquivo.path
                              ? "bg-primary/20 text-primary"
                              : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {arquivo.path}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-4 text-center">
                      Nenhum arquivo encontrado
                    </div>
                  )}
                </div>

                {/* Conteúdo do arquivo */}
                <div className="flex-1 bg-[#080c14] overflow-auto relative">
                  {arquivoAtual ? (
                    <>
                      <div className="sticky top-0 bg-[#0d1117] border-b border-border/50 px-3 py-1.5 flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground">
                          {arquivoAtual.path}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs gap-1"
                          onClick={copiarConteudo}
                        >
                          {copiadoArquivo ? (
                            <><Check className="w-3 h-3 text-green-500" /> Copiado</>
                          ) : (
                            <><Copy className="w-3 h-3" /> Copiar</>
                          )}
                        </Button>
                      </div>
                      <pre className="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
                        <code>{arquivoAtual.content}</code>
                      </pre>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <FileCode2 className="w-10 h-10 mx-auto mb-3 opacity-10" />
                        <p className="text-sm">Selecione um arquivo</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                Configuração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Stack de Tecnologias</div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {projeto.techStack || "Detecção automática"}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">ID do Projeto</div>
                <div className="font-mono text-sm text-foreground/70">#{projeto.id}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Última Atualização</div>
                <div className="text-sm text-foreground/70">
                  {format(new Date(projeto.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </div>
              </div>
              {projeto.generatedCode && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Resumo da YARA</div>
                  <div className="text-xs text-foreground/70 leading-relaxed">
                    {projeto.generatedCode}
                  </div>
                </div>
              )}
              {projeto.githubUrl && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Repositório GitHub</div>
                  <a
                    href={projeto.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs flex items-center gap-1"
                  >
                    <Github className="w-3 h-3" />
                    {projeto.githubUrl.replace("https://github.com/", "")}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {projeto.status === "pending" || projeto.status === "failed" ? (
            <Card className="border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Este projeto ainda não foi gerado. Clique para iniciar a YARA.
              </p>
              <Button
                className="w-full gap-2"
                size="sm"
                onClick={() => setLocation(`/projetos/${projeto.id}/gerar`)}
              >
                <Play className="w-4 h-4" />
                Gerar com YARA
              </Button>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Modal GitHub */}
      <Dialog open={modalGithub} onOpenChange={setModalGithub}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              Publicar no GitHub
            </DialogTitle>
            <DialogDescription>
              A YARA criará um repositório e enviará todos os {arquivos?.length || 0} arquivos gerados automaticamente.
            </DialogDescription>
          </DialogHeader>

          {githubSucesso ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Publicado com sucesso!</span>
              </div>
              <a
                href={githubSucesso}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm break-all"
              >
                <ExternalLink className="w-4 h-4 shrink-0" />
                {githubSucesso}
              </a>
              <Button className="w-full" onClick={() => setModalGithub(false)}>
                Fechar
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="repo-nome">Nome do Repositório</Label>
                <Input
                  id="repo-nome"
                  value={repoNome}
                  onChange={(e) => setRepoNome(e.target.value)}
                  placeholder="meu-projeto"
                  className="font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="repo-privado"
                  checked={repoPrivado}
                  onChange={(e) => setRepoPrivado(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="repo-privado" className="cursor-pointer font-normal">
                  Repositório privado
                </Label>
              </div>
              {githubErro && (
                <p className="text-sm text-destructive">{githubErro}</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalGithub(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={aoPublicarGithub}
                  disabled={publicarGithub.isPending || !repoNome.trim()}
                  className="gap-2"
                >
                  {publicarGithub.isPending ? (
                    <Activity className="w-4 h-4 animate-spin" />
                  ) : (
                    <Github className="w-4 h-4" />
                  )}
                  Publicar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
