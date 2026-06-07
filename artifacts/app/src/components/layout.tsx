import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Plus, Brain, MessageSquare, X, Menu, Settings } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);

  if (!user) {
    return <>{children}</>;
  }

  const navegacao = [
    { nome: "Painel", href: "/painel", icone: Home },
    { nome: "Chat YARA", href: "/chat", icone: MessageSquare },
    { nome: "Memória", href: "/memoria", icone: Brain },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ background: "hsl(222 47% 2%)" }}>

      {/* HEADER TOPO */}
      <header className="h-14 border-b border-border/60 bg-[hsl(222_40%_4%)] flex items-center px-4 gap-4 shrink-0 sticky top-0 z-50 yara-glow-strong"
        style={{ borderBottomColor: "hsl(210 100% 56% / 0.15)" }}>

        {/* Botão menu mobile */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg hover:bg-primary/10 transition-colors text-muted-foreground hover:text-primary"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo + Nome */}
        <Link href="/painel">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 avatar-glow">
              <img
                src="/images/logo-yara.png"
                alt="YARA Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-wide yara-gradient-text">GPT YARA</span>
              <span className="hidden sm:block text-[10px] font-mono text-muted-foreground/60 mt-0.5 border border-border/60 rounded px-1 py-0.5">
                v2.0
              </span>
            </div>
          </div>
        </Link>

        {/* Linha separadora decorativa */}
        <div className="hidden md:block h-6 w-px bg-border/60 mx-1" />

        {/* Navegação desktop */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navegacao.map((item) => {
            const ativo = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.nome} href={item.href}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-sm font-medium ${
                    ativo
                      ? "bg-primary/15 text-primary border border-primary/25"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icone className="w-4 h-4 shrink-0" />
                  {item.nome}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Ações direita */}
        <div className="ml-auto flex items-center gap-2">
          <Link href="/projetos/novo">
            <Button
              size="sm"
              className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 hidden sm:flex"
              style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)" }}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Projeto
            </Button>
          </Link>

          {/* Avatar + user */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-secondary transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="hidden md:block text-xs text-muted-foreground max-w-[120px] truncate">
                {user.email}
              </span>
            </button>
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-border">
                <div className="text-xs text-muted-foreground">Conectado como</div>
                <div className="text-xs font-medium text-foreground truncate mt-0.5">{user.email}</div>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Linha neon decorativa */}
      <div className="yara-neon-line shrink-0 opacity-40" />

      {/* MENU MOBILE OVERLAY */}
      {menuAberto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMenuAberto(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[hsl(222_40%_4%)] border-r border-border flex flex-col shadow-2xl">

            {/* Header do menu */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-border/60"
              style={{ borderBottomColor: "hsl(210 100% 56% / 0.15)" }}>
              <div className="flex items-center gap-2">
                <img src="/images/logo-yara.png" alt="YARA" className="w-8 h-8 rounded-lg object-cover" />
                <span className="font-bold yara-gradient-text">GPT YARA</span>
              </div>
              <button
                onClick={() => setMenuAberto(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navegação mobile */}
            <nav className="flex-1 p-3 space-y-1">
              {navegacao.map((item) => {
                const ativo = location === item.href || location.startsWith(item.href + "/");
                return (
                  <Link key={item.nome} href={item.href}>
                    <div
                      onClick={() => setMenuAberto(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer text-sm font-medium ${
                        ativo
                          ? "bg-primary/15 text-primary border border-primary/25"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <item.icone className="w-5 h-5 shrink-0" />
                      {item.nome}
                    </div>
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-border/60 mt-2">
                <Link href="/projetos/novo">
                  <div
                    onClick={() => setMenuAberto(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <Plus className="w-5 h-5 shrink-0" />
                    Novo Projeto
                  </div>
                </Link>
              </div>
            </nav>

            {/* Footer do menu */}
            <div className="p-4 border-t border-border/60">
              <div className="text-xs text-muted-foreground mb-1">Conectado como</div>
              <div className="text-xs font-medium text-foreground truncate mb-3">{user.email}</div>
              <button
                onClick={() => { logout(); setMenuAberto(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-auto flex flex-col min-h-0">
        <div className={`flex-1 ${location.startsWith("/chat") ? "flex flex-col min-h-0 h-full" : "max-w-6xl mx-auto p-4 md:p-6 w-full"}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
