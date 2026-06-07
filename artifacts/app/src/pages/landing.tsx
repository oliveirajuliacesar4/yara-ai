import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, MessageSquare, FolderOpen, Zap } from "lucide-react";
import { yaraLogo, yaraAvatar } from "@/lib/images";

const esquemaLogin = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const esquemaCadastro = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function PaginaInicial() {
  const { user, login, register } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation("/chat");
  }, [user, setLocation]);

  const formLogin = useForm<z.infer<typeof esquemaLogin>>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: "", password: "" },
  });

  const formCadastro = useForm<z.infer<typeof esquemaCadastro>>({
    resolver: zodResolver(esquemaCadastro),
    defaultValues: { name: "", email: "", password: "" },
  });

  const aoEntrar = async (dados: z.infer<typeof esquemaLogin>) => {
    await login({ data: dados });
  };

  const aoCadastrar = async (dados: z.infer<typeof esquemaCadastro>) => {
    await register({ data: dados });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(222 47% 2%)" }}
    >
      {/* ── TOP BAR ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderBottomColor: "hsl(210 100% 56% / 0.12)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden avatar-glow">
            <img src={yaraLogo} alt="YARA" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-wide yara-gradient-text">GPT YARA</div>
            <div className="text-[9px] font-mono tracking-widest text-muted-foreground/50">SUA INTELIGÊNCIA. SEM LIMITES.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 yara-pulse" />
          <span className="text-xs text-muted-foreground hidden sm:block">Sistema Online</span>
        </div>
      </header>

      {/* ── CORPO PRINCIPAL ── */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 px-4 py-10 max-w-7xl mx-auto w-full">

        {/* ── LADO ESQUERDO — Avatar + Info ── */}
        <div className="flex flex-col items-center lg:items-start gap-6 flex-1 max-w-xl">

          {/* Avatar YARA grande */}
          <div className="relative flex flex-col items-center lg:flex-row lg:items-end gap-6">
            <div className="relative">
              {/* Glow de fundo */}
              <div
                className="absolute inset-0 rounded-full blur-3xl opacity-30"
                style={{ background: "hsl(210 100% 56%)", transform: "scale(1.3)" }}
              />
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden avatar-glow-animate">
                <img
                  src={yaraAvatar}
                  alt="YARA — Inteligência Artificial"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Badge online */}
              <div
                className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "hsl(222 40% 8%)", border: "1px solid hsl(210 100% 56% / 0.3)", color: "hsl(210 100% 70%)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 yara-pulse" />
                Online
              </div>
            </div>

            <div className="text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-none mb-2">
                <span className="yara-gradient-text">YARA</span>
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-xs">
                Sua assistente de IA com memória, gerador de sistemas e chat inteligente.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {[
              { icone: MessageSquare, titulo: "Chat com IA",      desc: "Converse com a YARA em tempo real com respostas em streaming" },
              { icone: Brain,         titulo: "Memória Real",     desc: "A YARA lembra de você e aprende com cada conversa" },
              { icone: FolderOpen,    titulo: "Seus Projetos",    desc: "Gerencie e gere sistemas completos com IA" },
              { icone: Zap,           titulo: "Sem Limites",      desc: "Código, análises, resumos e muito mais em segundos" },
            ].map(({ icone: Icon, titulo, desc }) => (
              <div
                key={titulo}
                className="p-4 rounded-2xl border transition-all group"
                style={{ background: "hsl(222 40% 5%)", borderColor: "hsl(220 25% 12%)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(210 100% 56% / 0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(220 25% 12%)"; }}
              >
                <Icon className="w-5 h-5 mb-2" style={{ color: "hsl(210 100% 60%)" }} />
                <h3 className="font-semibold text-sm mb-1">{titulo}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── LADO DIREITO — Formulário ── */}
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "hsl(222 40% 6%)", border: "1px solid hsl(210 100% 56% / 0.15)" }}
          >
            {/* Header do card */}
            <div
              className="flex flex-col items-center py-6 px-6 border-b"
              style={{ borderBottomColor: "hsl(210 100% 56% / 0.1)", background: "hsl(222 40% 5%)" }}
            >
              <div className="w-16 h-16 rounded-full overflow-hidden avatar-glow mb-3">
                <img src={yaraAvatar} alt="YARA" className="w-full h-full object-cover" />
              </div>
              <div className="text-lg font-bold yara-gradient-text">Bem-vindo ao GPT YARA</div>
              <div className="text-xs text-muted-foreground mt-0.5">Entre ou crie sua conta para começar</div>
            </div>

            <div className="p-6">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-5" style={{ background: "hsl(222 40% 8%)" }}>
                  <TabsTrigger value="login" data-testid="tab-login">Entrar</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Cadastrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...formLogin}>
                    <form onSubmit={formLogin.handleSubmit(aoEntrar)} className="space-y-4">
                      <FormField
                        control={formLogin.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">E-mail</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                {...field}
                                data-testid="input-login-email"
                                style={{ background: "hsl(222 40% 8%)", borderColor: "hsl(220 25% 16%)" }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formLogin.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••"
                                {...field}
                                data-testid="input-login-senha"
                                style={{ background: "hsl(222 40% 8%)", borderColor: "hsl(220 25% 16%)" }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full font-semibold btn-neon"
                        data-testid="button-entrar"
                        style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)", border: "none" }}
                      >
                        Acessar Plataforma
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...formCadastro}>
                    <form onSubmit={formCadastro.handleSubmit(aoCadastrar)} className="space-y-4">
                      <FormField
                        control={formCadastro.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">Nome completo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="João Silva"
                                {...field}
                                data-testid="input-cadastro-nome"
                                style={{ background: "hsl(222 40% 8%)", borderColor: "hsl(220 25% 16%)" }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formCadastro.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">E-mail</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="seu@email.com"
                                {...field}
                                data-testid="input-cadastro-email"
                                style={{ background: "hsl(222 40% 8%)", borderColor: "hsl(220 25% 16%)" }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={formCadastro.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-muted-foreground">Senha</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••"
                                {...field}
                                data-testid="input-cadastro-senha"
                                style={{ background: "hsl(222 40% 8%)", borderColor: "hsl(220 25% 16%)" }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full font-semibold btn-neon"
                        data-testid="button-cadastrar"
                        style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)", border: "none" }}
                      >
                        Criar Conta Grátis
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
