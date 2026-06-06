import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PaginaNaoEncontrada() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 border-border bg-card">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground">404 — Página não encontrada</h1>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            A página que você está procurando não existe ou foi removida.
          </p>
          <Button className="mt-6 w-full" onClick={() => setLocation("/painel")}>
            Voltar ao Painel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
