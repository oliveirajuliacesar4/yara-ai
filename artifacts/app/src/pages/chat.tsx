import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Plus, Trash2, Send, Bot, User, Loader2, ChevronLeft, Menu, X
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type Conversation = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type ChatMessage = {
  id: number;
  conversationId: number;
  role: "user" | "model";
  content: string;
  createdAt: string;
};

type ConversationWithMessages = Conversation & { messages: ChatMessage[] };

// Streaming message (ainda não salva no banco)
type StreamingMessage = {
  role: "user" | "model";
  content: string;
  isStreaming?: boolean;
};

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const conversationId = params?.id ? Number(params.id) : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversa, setConversa] = useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<(ChatMessage | StreamingMessage)[]>([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Rolar para o final ao receber mensagens
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Carregar lista de conversas
  const carregarConversas = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      if (res.ok) setConversations(await res.json());
    } catch { /* ignorar */ }
  }, []);

  useEffect(() => { carregarConversas(); }, [carregarConversas]);

  // Carregar conversa específica
  useEffect(() => {
    if (!conversationId) {
      setConversa(null);
      setMessages([]);
      return;
    }
    setCarregando(true);
    fetch(`/api/chat/conversations/${conversationId}`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) { navigate("/chat"); return; }
        const data: ConversationWithMessages = await res.json();
        setConversa(data);
        setMessages(data.messages);
      })
      .catch(() => navigate("/chat"))
      .finally(() => setCarregando(false));
  }, [conversationId, navigate]);

  const novaConversa = async () => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Falha ao criar conversa");
      const nova: Conversation = await res.json();
      setConversations((prev) => [nova, ...prev]);
      navigate(`/chat/${nova.id}`);
    } catch {
      toast({ title: "Erro ao criar conversa", variant: "destructive" });
    }
  };

  const deletarConversa = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/chat/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        navigate("/chat");
      }
    } catch {
      toast({ title: "Erro ao deletar conversa", variant: "destructive" });
    }
  };

  const enviarMensagem = async () => {
    if (!input.trim() || enviando || !conversationId) return;

    const textoUsuario = input.trim();
    setInput("");
    setEnviando(true);

    // Adicionar mensagem do usuário imediatamente
    const msgUsuario: StreamingMessage = { role: "user", content: textoUsuario };
    setMessages((prev) => [...prev, msgUsuario]);

    // Placeholder da resposta da IA com streaming
    const msgIA: StreamingMessage = { role: "model", content: "", isStreaming: true };
    setMessages((prev) => [...prev, msgIA]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: textoUsuario }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao enviar mensagem");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let respostaCompleta = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n\n");
        buffer = linhas.pop() || "";

        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          try {
            const evento = JSON.parse(linha.slice(6));

            if (evento.type === "chunk") {
              respostaCompleta += evento.content;
              setMessages((prev) => {
                const novo = [...prev];
                const idx = novo.findLastIndex((m) => (m as StreamingMessage).isStreaming);
                if (idx !== -1) {
                  novo[idx] = { role: "model", content: respostaCompleta, isStreaming: true };
                }
                return novo;
              });
            } else if (evento.type === "title") {
              // Atualizar título da conversa na sidebar
              setConversations((prev) =>
                prev.map((c) => c.id === conversationId ? { ...c, title: evento.title } : c)
              );
              setConversa((prev) => prev ? { ...prev, title: evento.title } : prev);
            } else if (evento.type === "done") {
              // Finalizar streaming
              setMessages((prev) => {
                const novo = [...prev];
                const idx = novo.findLastIndex((m) => (m as StreamingMessage).isStreaming);
                if (idx !== -1) {
                  novo[idx] = { role: "model", content: respostaCompleta, isStreaming: false } as StreamingMessage;
                }
                return novo;
              });
            } else if (evento.type === "error") {
              throw new Error(evento.message);
            }
          } catch (parseErr) { /* ignorar parse errors parciais */ }
        }
      }

      // Recarregar conversas para atualizar a ordem (updatedAt)
      carregarConversas();
    } catch (err: any) {
      if (err.name === "AbortError") return;
      // Remover o placeholder de streaming em caso de erro
      setMessages((prev) => prev.filter((m) => !(m as StreamingMessage).isStreaming));
      toast({
        title: "Erro ao enviar mensagem",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const formatarData = (iso: string) => {
    const d = new Date(iso);
    const hoje = new Date();
    const diff = Math.floor((hoje.getTime() - d.getTime()) / 1000 / 60 / 60 / 24);
    if (diff === 0) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (diff === 1) return "Ontem";
    if (diff < 7) return d.toLocaleDateString("pt-BR", { weekday: "short" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`
          flex-shrink-0 flex flex-col border-r border-border bg-card/50
          transition-all duration-200
          ${sidebarAberta ? "w-64" : "w-0 overflow-hidden"}
          md:w-64
        `}
      >
        {/* Header sidebar */}
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Button
            onClick={novaConversa}
            className="flex-1 justify-start gap-2 text-sm"
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Nova Conversa
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8"
            onClick={() => setSidebarAberta(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Lista de conversas */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs px-4 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhuma conversa ainda.<br />Clique em "Nova Conversa"
            </div>
          ) : (
            conversations.map((conv) => {
              const ativa = conv.id === conversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`
                    group relative flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer
                    transition-colors text-sm
                    ${ativa
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }
                  `}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-xs leading-tight">
                      {conv.title}
                    </div>
                    <div className="text-[10px] opacity-50 mt-0.5">{formatarData(conv.updatedAt)}</div>
                  </div>
                  <button
                    onClick={(e) => deletarConversa(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-12 border-b border-border flex items-center px-4 gap-3 bg-background/80 backdrop-blur shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setSidebarAberta(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <Bot className="w-4 h-4 text-primary shrink-0" />
            <span className="font-medium text-sm truncate">
              {conversa ? conversa.title : "Chat com a YARA"}
            </span>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto">
          {!conversationId ? (
            /* Tela inicial */
            <div className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center yara-glow">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  <span className="yara-gradient-text">YARA</span> — Sua engenheira de IA
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Tire dúvidas sobre código, peça revisões de arquitetura, debug de erros ou explicações técnicas em português.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                {[
                  "Como criar uma API REST com Node.js e TypeScript?",
                  "Explique o padrão de arquitetura MVC",
                  "Revise este código e sugira melhorias",
                  "Qual banco de dados usar para meu projeto?",
                ].map((sugestao) => (
                  <button
                    key={sugestao}
                    onClick={async () => {
                      const res = await fetch("/api/chat/conversations", {
                        method: "POST", credentials: "include",
                      });
                      if (!res.ok) return;
                      const nova = await res.json();
                      setConversations((prev) => [nova, ...prev]);
                      navigate(`/chat/${nova.id}`);
                      // Pequeno delay para a navegação acontecer
                      setTimeout(() => setInput(sugestao), 100);
                    }}
                    className="text-left p-3 rounded-lg border border-border bg-card hover:bg-secondary hover:border-primary/30 transition-all text-sm text-muted-foreground"
                  >
                    {sugestao}
                  </button>
                ))}
              </div>
              <Button onClick={novaConversa} className="gap-2">
                <Plus className="w-4 h-4" />
                Iniciar conversa
              </Button>
            </div>
          ) : carregando ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Envie uma mensagem para começar a conversa
                </div>
              )}
              {messages.map((msg, idx) => (
                <MensagemBolha key={idx} msg={msg} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        {conversationId && (
          <div className="border-t border-border bg-background/80 backdrop-blur p-4 shrink-0">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-2 bg-card border border-border rounded-xl p-2 focus-within:border-primary/50 transition-colors">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem para a YARA... (Enter para enviar, Shift+Enter para nova linha)"
                  className="flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-2 focus-visible:ring-0 text-sm"
                  disabled={enviando}
                  rows={1}
                />
                <Button
                  onClick={enviarMensagem}
                  disabled={enviando || !input.trim()}
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg"
                >
                  {enviando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                YARA usa Google Gemini · Respostas podem conter erros — sempre revise o código
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MensagemBolha({ msg }: { msg: ChatMessage | StreamingMessage }) {
  const isUser = msg.role === "user";
  const isStreaming = (msg as StreamingMessage).isStreaming;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5
        ${isUser
          ? "bg-primary text-primary-foreground"
          : "bg-primary/10 border border-primary/20 text-primary"
        }
      `}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Balão */}
      <div className={`
        max-w-[80%] rounded-2xl px-4 py-3 text-sm
        ${isUser
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-card border border-border rounded-tl-sm"
        }
      `}>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
            {msg.content ? (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }: any) {
                    const isBlock = className?.includes("language-");
                    return isBlock ? (
                      <pre className="bg-background/50 border border-border rounded-lg p-3 overflow-x-auto my-2">
                        <code className={`${className} text-xs`} {...props}>{children}</code>
                      </pre>
                    ) : (
                      <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {msg.content}
              </ReactMarkdown>
            ) : null}
            {isStreaming && (
              <span className="inline-flex gap-1 ml-1 align-middle">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
