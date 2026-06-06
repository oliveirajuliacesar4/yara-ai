import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Plus, Brain, Cpu } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  const navegacao = [
    { nome: "Painel", href: "/painel", icone: Home },
    { nome: "Memória", href: "/memoria", icone: Brain },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Barra lateral */}
      <aside className="w-full md:w-60 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center yara-glow">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <span className="font-mono font-bold text-lg tracking-tight">
            <span className="yara-gradient-text">YARA</span>
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navegacao.map((item) => {
            const ativo = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.nome} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer text-sm ${
                    ativo
                      ? "bg-primary/10 text-primary font-medium border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.nome.toLowerCase()}`}
                >
                  <item.icone className="w-4 h-4 shrink-0" />
                  {item.nome}
                </div>
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-border">
            <Link href="/projetos/novo">
              <Button
                className="w-full justify-start gap-2 text-sm font-medium bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 hover:text-primary"
                variant="outline"
                size="sm"
                data-testid="nav-novo-projeto"
              >
                <Plus className="w-4 h-4" />
                Novo Projeto
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="text-xs">
            <div className="text-muted-foreground mb-0.5">Conectado como</div>
            <div className="font-mono font-medium truncate text-foreground/80" data-testid="usuario-email">
              {user.email}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-xs"
            onClick={() => logout()}
            data-testid="btn-sair"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
