import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Plus, Brain, MessageSquare, X, Menu, Settings } from "lucide-react";
import { yaraLogo } from "@/lib/images";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) {
    return <>{children}</>;
  }

  // Chat page has its own full layout
  if (location.startsWith("/chat")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ background: "hsl(222 47% 2%)" }}>
      {/* HEADER TOPO */}
      <header
        className="h-14 border-b flex items-center px-4 gap-4 shrink-0 sticky top-0 z-50"
        style={{
          background: "hsl(222 40% 4%)",
          borderBottomColor: "hsl(210 100% 56% / 0.15)",
        }}
      >
        <Link href="/painel">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 avatar-glow">
              <img src={yaraLogo} alt="YARA Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-wide yara-gradient-text">GPT YARA</span>
            </div>
          </div>
        </Link>

        <div className="hidden md:block h-6 w-px bg-border/60 mx-1" />

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {[
            { nome: "Painel", href: "/painel", icone: Home },
            { nome: "Chat YARA", href: "/chat", icone: MessageSquare },
            { nome: "Memória", href: "/memoria", icone: Brain },
          ].map((item) => {
            const ativo = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.nome} href={item.href}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer text-sm font-medium ${ativo ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                  <item.icone className="w-4 h-4 shrink-0" />
                  {item.nome}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/projetos/novo">
            <Button size="sm" className="gap-1.5 text-xs font-semibold hidden sm:flex"
              style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)" }}>
              <Plus className="w-3.5 h-3.5" />
              Novo Projeto
            </Button>
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground text-xs"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="yara-neon-line shrink-0 opacity-40" />

      <main className="flex-1 overflow-auto flex flex-col min-h-0">
        <div className="flex-1 max-w-6xl mx-auto p-4 md:p-6 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
