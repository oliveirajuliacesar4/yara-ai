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
import { Cpu, Code2, Terminal } from "lucide-react";

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
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg">
          <Terminal className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-5xl md:text-6xl font-sans font-bold tracking-tighter text-foreground">
          Gerador de Sistemas <span className="text-primary">IA</span>
        </h1>
        <p className="text-xl text-muted-foreground font-mono">
          Descreva seu sistema. Receba código pronto para produção. Uma fábrica de software completa ao seu comando.
        </p>

        <div className="grid grid-cols-2 gap-4 pt-8">
          <div className="p-4 rounded-lg bg-card border border-border">
            <Cpu className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-bold mb-1">Arquitetura</h3>
            <p className="text-sm text-muted-foreground">Design inteligente de sistemas e estruturação de componentes.</p>
          </div>
          <div className="p-4 rounded-lg bg-card border border-border">
            <Code2 className="w-6 h-6 text-primary mb-3" />
            <h3 className="font-bold mb-1">Implementação</h3>
            <p className="text-sm text-muted-foreground">Geração de código limpo, tipado e documentado.</p>
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
