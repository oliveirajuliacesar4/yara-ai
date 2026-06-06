import { useListProjects, useGetProjectStats, getListProjectsQueryKey, getGetProjectStatsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Terminal, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Painel() {
  const { data: estatisticas, isLoading: carregandoEstatisticas } = useGetProjectStats({
    query: { queryKey: getGetProjectStatsQueryKey() }
  });

  const { data: projetos, isLoading: carregandoProjetos } = useListProjects({
    query: { queryKey: getListProjectsQueryKey() }
  });

  const obterIconeStatus = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "generating": return <Activity className="w-4 h-4 text-primary animate-pulse" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel</h1>
          <p className="text-muted-foreground">Visão geral dos seus sistemas gerados.</p>
        </div>
        <Link href="/projetos/novo">
          <Button data-testid="btn-novo-projeto">
            <Plus className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        </Link>
      </div>

      {carregandoEstatisticas ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : estatisticas ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Projetos</CardDescription>
              <CardTitle className="text-4xl font-mono">{estatisticas.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Concluídos</CardDescription>
              <CardTitle className="text-4xl font-mono text-green-500">{estatisticas.completed}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Em Geração</CardDescription>
              <CardTitle className="text-4xl font-mono text-primary">{estatisticas.generating}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Com Falha</CardDescription>
              <CardTitle className="text-4xl font-mono text-destructive">{estatisticas.failed}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : null}

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Projetos Recentes</h2>

        {carregandoProjetos ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
        ) : projetos && projetos.length > 0 ? (
          <div className="grid gap-4">
            {projetos.map((projeto) => (
              <Link key={projeto.id} href={`/projetos/${projeto.id}`}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer group" data-testid={`card-projeto-${projeto.id}`}>
                  <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Terminal className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        {projeto.name}
                      </CardTitle>
                      <CardDescription className="line-clamp-1">{projeto.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs font-medium">
                        {obterIconeStatus(projeto.status)}
                        {traduzirStatus(projeto.status)}
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">
                        {format(new Date(projeto.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed rounded-xl bg-card">
            <Terminal className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhum projeto ainda</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro sistema gerado por IA para começar.</p>
            <Link href="/projetos/novo">
              <Button variant="outline">Criar Projeto</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
