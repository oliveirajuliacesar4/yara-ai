import { useListMemoria, getListMemoriaQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Database, Zap, BookOpen } from "lucide-react";

export default function Memoria() {
  const { data: memorias, isLoading } = useListMemoria({
    query: { queryKey: getListMemoriaQueryKey() },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Memória da YARA
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          A YARA aprende com cada geração e armazena padrões para melhorar os próximos sistemas.
        </p>
      </div>

      {/* Cards de stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Total de Memórias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">
              {isLoading ? "—" : memorias?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Categorias Aprendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {isLoading ? "—" : [...new Set(memorias?.map((m) => m.categoria) ?? [])].length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Total de Usos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              {isLoading ? "—" : memorias?.reduce((acc, m) => acc + m.usos, 0) ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de memórias */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Base de Conhecimento
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : memorias && memorias.length > 0 ? (
          <div className="grid gap-3">
            {memorias.map((memoria) => (
              <Card key={memoria.id} className="border-border hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Brain className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-mono text-sm font-medium truncate">
                        {memoria.chave}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {memoria.categoria}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {memoria.usos}× usado
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <p className="text-sm text-foreground/80">{memoria.valor}</p>
                  {memoria.contexto && (
                    <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                      {memoria.contexto}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono">
                    Salvo em {new Date(memoria.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-16 border border-dashed rounded-xl bg-card">
            <Brain className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-base font-medium mb-1">Memória vazia</h3>
            <p className="text-muted-foreground text-sm">
              A YARA aprenderá automaticamente após cada geração de sistema.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
