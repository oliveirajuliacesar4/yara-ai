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
import { Code2, Brain, ShieldCheck, Github } from "lucide-react";

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
    if (user) {
      setLocation("/painel");
    }
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row items-center justify-center p-4 gap-12">
      <div className="flex-1 max-w-lg space-y-6">
        {/* Logo YARA */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 avatar-glow">
            <img src="/images/logo-yara.png" alt="YARA Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-bold text-2xl tracking-wide yara-gradient-text">GPT YARA</span>
            <div className="text-[11px] text-muted-foreground font-mono tracking-widest">SUA INTELIGÊNCIA. SEM LIMITES.</div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-sans font-bold tracking-tight text-foreground leading-tight">
          Sua engenheira de software<br />
          <span className="yara-gradient-text">movida a IA</span>
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Descreva o sistema que precisa. A YARA gera backend, frontend, banco de dados, testes e documentação — tudo pronto para produção.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
            <Code2 className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm mb-1">7 Etapas de Validação</h3>
            <p className="text-xs text-muted-foreground">Código revisado e validado automaticamente antes de entrar em produção.</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
            <Brain className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm mb-1">Memória Persistente</h3>
            <p className="text-xs text-muted-foreground">A YARA aprende com cada projeto e melhora continuamente.</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
            <ShieldCheck className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm mb-1">Código Seguro</h3>
            <p className="text-xs text-muted-foreground">Validação de segurança, autenticação JWT e boas práticas.</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
            <Github className="w-5 h-5 text-primary mb-2" />
            <h3 className="font-semibold text-sm mb-1">Publicação GitHub</h3>
            <p className="text-xs text-muted-foreground">Cria o repositório e faz push de todos os arquivos automaticamente.</p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md bg-card border border-border rounded-xl p-6 shadow-2xl">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
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
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} data-testid="input-login-email" />
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
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} data-testid="input-login-senha" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" data-testid="button-entrar">
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
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} data-testid="input-cadastro-nome" />
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
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} data-testid="input-cadastro-email" />
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
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} data-testid="input-cadastro-senha" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" data-testid="button-cadastrar">
                  Criar Conta
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
