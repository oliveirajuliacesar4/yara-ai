import { createContext, useContext, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetMe, useLogin, useRegister, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

type ContextoAutenticacao = {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutateAsync"];
  register: ReturnType<typeof useRegister>["mutateAsync"];
  logout: ReturnType<typeof useLogout>["mutateAsync"];
};

const ContextoAuth = createContext<ContextoAutenticacao | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false }
  });

  const mutacaoLogin = useLogin({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Bem-vindo de volta!" });
      },
      onError: (err: any) => {
        toast({
          title: "Falha ao entrar",
          description: err?.error || "Erro desconhecido",
          variant: "destructive",
        });
      },
    },
  });

  const mutacaoCadastro = useRegister({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Conta criada com sucesso!" });
      },
      onError: (err: any) => {
        toast({
          title: "Falha no cadastro",
          description: err?.error || "Erro desconhecido",
          variant: "destructive",
        });
      },
    },
  });

  const mutacaoSair = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        toast({ title: "Sessão encerrada com sucesso." });
      },
    },
  });

  return (
    <ContextoAuth.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: mutacaoLogin.mutateAsync,
        register: mutacaoCadastro.mutateAsync,
        logout: mutacaoSair.mutateAsync,
      }}
    >
      {children}
    </ContextoAuth.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(ContextoAuth);
  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return contexto;
}
