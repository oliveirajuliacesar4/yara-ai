import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Plus, Activity } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  const navegacao = [
    { nome: "Painel", href: "/painel", icone: Home },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Barra lateral */}
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <span className="font-mono font-bold text-foreground tracking-tight">GSI<span className="text-primary">.ia</span></span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navegacao.map((item) => {
            const ativo = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.nome} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    ativo
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.nome.toLowerCase()}`}
                >
                  <item.icone className="w-4 h-4" />
                  {item.nome}
                </div>
              </Link>
            );
          })}

          <div className="pt-4 mt-4 border-t border-border">
            <Link href="/projetos/novo">
              <Button className="w-full justify-start gap-2" variant="outline" data-testid="nav-novo-projeto">
                <Plus className="w-4 h-4" />
                Novo Projeto
              </Button>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-4">
          <div className="text-sm">
            <div className="text-muted-foreground">Conectado como</div>
            <div className="font-mono font-medium truncate" data-testid="usuario-email">{user.email}</div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
            data-testid="btn-sair"
          >
            <LogOut className="w-4 h-4 mr-2" />
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
