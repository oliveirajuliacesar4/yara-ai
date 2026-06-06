import { useLocation } from "wouter";
import { useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Terminal, ArrowRight } from "lucide-react";

const esquemaProjeto = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  techStack: z.string().optional(),
});

export default function NovoProjeto() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof esquemaProjeto>>({
    resolver: zodResolver(esquemaProjeto),
    defaultValues: {
      name: "",
      description: "",
      techStack: "react-node",
    },
  });

  const criarProjeto = useCreateProject({
    mutation: {
      onSuccess: (dados) => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setLocation(`/projetos/${dados.id}`);
      },
    }
  });

  const aoEnviar = (dados: z.infer<typeof esquemaProjeto>) => {
    criarProjeto.mutate({ data: dados });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Terminal className="w-8 h-8 text-primary" />
          Novo Projeto
        </h1>
        <p className="text-muted-foreground mt-2">Defina os parâmetros e requisitos do seu novo sistema gerado por IA.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(aoEnviar)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Sistema de Gestão de Estoque" {...field} data-testid="input-nome-projeto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tecnologias</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-tecnologias">
                          <SelectValue placeholder="Selecione as tecnologias" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="react-node">React + Node.js (Express)</SelectItem>
                        <SelectItem value="nextjs">Next.js (App Router)</SelectItem>
                        <SelectItem value="python-fastapi">React + Python (FastAPI)</SelectItem>
                        <SelectItem value="go-react">React + Go (Fiber)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>As tecnologias principais que a IA deve utilizar.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Sistema</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o sistema em detalhes. Quais são as funcionalidades principais? Modelos de dados? Fluxos de trabalho?"
                        className="min-h-[200px] font-mono text-sm"
                        {...field}
                        data-testid="input-descricao-projeto"
                      />
                    </FormControl>
                    <FormDescription>Seja o mais específico possível para melhores resultados.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/painel")}
                  data-testid="btn-cancelar"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={criarProjeto.isPending}
                  className="gap-2"
                  data-testid="btn-criar-projeto"
                >
                  {criarProjeto.isPending ? "Criando..." : "Criar Projeto"}
                  {!criarProjeto.isPending && <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
