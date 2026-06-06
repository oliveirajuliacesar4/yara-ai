import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { useEffect } from "react";

// Páginas
import PaginaNaoEncontrada from "@/pages/not-found";
import PaginaInicial from "@/pages/landing";
import Painel from "@/pages/dashboard";
import NovoProjeto from "@/pages/project-new";
import DetalhesProjeto from "@/pages/project-detail";
import GerarProjeto from "@/pages/project-generate";
import Memoria from "@/pages/memoria";

const queryClient = new QueryClient();

function RotaProtegida({ component: Componente, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  if (!user) {
    return null;
  }

  return <Componente {...rest} />;
}

function Roteador() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={PaginaInicial} />
        <Route path="/painel"><RotaProtegida component={Painel} /></Route>
        <Route path="/projetos/novo"><RotaProtegida component={NovoProjeto} /></Route>
        <Route path="/projetos/:id/gerar"><RotaProtegida component={GerarProjeto} /></Route>
        <Route path="/projetos/:id"><RotaProtegida component={DetalhesProjeto} /></Route>
        <Route path="/memoria"><RotaProtegida component={Memoria} /></Route>
        <Route component={PaginaNaoEncontrada} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "")}>
          <AuthProvider>
            <Roteador />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
