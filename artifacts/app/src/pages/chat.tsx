import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare, Plus, Trash2, Send, User, Loader2, X, Brain, Settings
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
  const [sidebarAberta, setSidebarAberta] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const carregarConversas = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      if (res.ok) setConversations(await res.json());
    } catch { }
  }, []);

  useEffect(() => { carregarConversas(); }, [carregarConversas]);

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
    setSidebarAberta(false);
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
      if (conversationId === id) navigate("/chat");
    } catch {
      toast({ title: "Erro ao deletar conversa", variant: "destructive" });
    }
  };

  const enviarMensagem = async () => {
    if (!input.trim() || enviando || !conversationId) return;

    const textoUsuario = input.trim();
    setInput("");
    setEnviando(true);

    const msgUsuario: StreamingMessage = { role: "user", content: textoUsuario };
    setMessages((prev) => [...prev, msgUsuario]);

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
              setConversations((prev) =>
                prev.map((c) => c.id === conversationId ? { ...c, title: evento.title } : c)
              );
              setConversa((prev) => prev ? { ...prev, title: evento.title } : prev);
            } else if (evento.type === "done") {
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
          } catch { }
        }
      }

      carregarConversas();
    } catch (err: any) {
      if (err.name === "AbortError") return;
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
    <div className="flex h-full overflow-hidden relative" style={{ background: "hsl(222 47% 2%)" }}>

      {/* SIDEBAR OVERLAY MOBILE */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-30 md:hidden bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:relative z-40 md:z-auto
          flex-shrink-0 flex flex-col
          border-r h-full
          transition-all duration-300 ease-in-out
          ${sidebarAberta ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 w-72 md:w-64"}
        `}
        style={{
          background: "hsl(222 40% 4%)",
          borderRightColor: "hsl(210 100% 56% / 0.12)",
        }}
      >
        {/* Header sidebar */}
        <div className="p-3 border-b flex items-center gap-2" style={{ borderBottomColor: "hsl(210 100% 56% / 0.12)" }}>
          <button
            onClick={novaConversa}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "hsl(210 100% 56% / 0.1)",
              border: "1px solid hsl(210 100% 56% / 0.2)",
              color: "hsl(210 100% 70%)",
            }}
          >
            <Plus className="w-4 h-4" />
            Nova Conversa
          </button>
          <button
            className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground"
            onClick={() => setSidebarAberta(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Links rápidos */}
        <div className="px-3 py-2 border-b" style={{ borderBottomColor: "hsl(210 100% 56% / 0.08)" }}>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-2 mb-1">Menu</div>
          <button
            onClick={() => { navigate("/memoria"); setSidebarAberta(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Brain className="w-4 h-4" />
            Memória
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </button>
        </div>

        {/* Lista de conversas */}
        <div className="px-2 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 px-2 mb-1">Conversas</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
          {conversations.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs px-4 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              Nenhuma conversa ainda.
            </div>
          ) : (
            conversations.map((conv) => {
              const ativa = conv.id === conversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => { navigate(`/chat/${conv.id}`); setSidebarAberta(false); }}
                  className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm`}
                  style={ativa ? {
                    background: "hsl(210 100% 56% / 0.12)",
                    border: "1px solid hsl(210 100% 56% / 0.2)",
                    color: "hsl(210 100% 70%)",
                  } : {}}
                >
                  {!ativa && (
                    <style>{`.conv-${conv.id}:hover { background: hsl(222 30% 9%); }`}</style>
                  )}
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium text-xs leading-tight">
                      {conv.title}
                    </div>
                    <div className="text-[10px] opacity-40 mt-0.5">{formatarData(conv.updatedAt)}</div>
                  </div>
                  <button
                    onClick={(e) => deletarConversa(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400"
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Sub-header do chat */}
        <div
          className="h-12 flex items-center px-4 gap-3 shrink-0 border-b"
          style={{
            background: "hsl(222 40% 4%)",
            borderBottomColor: "hsl(210 100% 56% / 0.12)",
          }}
        >
          {/* Botão menu mobile */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            onClick={() => setSidebarAberta(true)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Avatar YARA + título */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 avatar-glow">
              <img
                src="/images/yara-avatar.png"
                alt="YARA"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">
                {conversa ? conversa.title : "Chat com a YARA"}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block yara-pulse" />
                Online · Powered by Gemini
              </div>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto">
          {!conversationId ? (
            /* Tela inicial */
            <div className="h-full flex flex-col items-center justify-center gap-6 p-6 text-center">
              {/* Avatar grande */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden avatar-glow">
                  <img
                    src="/images/yara-avatar.png"
                    alt="YARA Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-background flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-green-300 yara-pulse" />
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Olá! Sou a <span className="yara-gradient-text">YARA</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Sua inteligência sem limites. Tire dúvidas, peça código, análises e muito mais.
                </p>
              </div>

              {/* Sugestões */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg w-full">
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
                      setTimeout(() => setInput(sugestao), 100);
                    }}
                    className="text-left p-3.5 rounded-xl border text-sm transition-all group"
                    style={{
                      background: "hsl(222 40% 5%)",
                      borderColor: "hsl(210 100% 56% / 0.15)",
                      color: "hsl(210 15% 70%)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(210 100% 56% / 0.35)";
                      (e.currentTarget as HTMLElement).style.background = "hsl(210 100% 56% / 0.06)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(210 100% 56% / 0.15)";
                      (e.currentTarget as HTMLElement).style.background = "hsl(222 40% 5%)";
                    }}
                  >
                    {sugestao}
                  </button>
                ))}
              </div>

              <button
                onClick={novaConversa}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: "hsl(210 100% 56%)",
                  color: "hsl(222 47% 2%)",
                }}
              >
                <Plus className="w-4 h-4" />
                Iniciar conversa
              </button>
            </div>
          ) : carregando ? (
            <div className="h-full flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando conversa...</span>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-12">
                  <div className="w-12 h-12 rounded-full overflow-hidden mx-auto mb-3 opacity-40">
                    <img src="/images/yara-avatar.png" alt="YARA" className="w-full h-full object-cover" />
                  </div>
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
          <div
            className="border-t p-4 shrink-0"
            style={{
              background: "hsl(222 40% 4%)",
              borderTopColor: "hsl(210 100% 56% / 0.12)",
            }}
          >
            <div className="max-w-3xl mx-auto">
              <div
                className="relative flex items-end gap-2 rounded-2xl p-2 transition-all input-neon"
                style={{
                  background: "hsl(222 40% 6%)",
                  border: "1px solid hsl(220 25% 14%)",
                }}
              >
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mensagem para a YARA... (Enter para enviar)"
                  className="flex-1 min-h-[44px] max-h-[180px] resize-none border-0 bg-transparent p-2 focus-visible:ring-0 text-sm placeholder:text-muted-foreground/50"
                  disabled={enviando}
                  rows={1}
                />
                <button
                  onClick={enviarMensagem}
                  disabled={enviando || !input.trim()}
                  className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                  style={{
                    background: "hsl(210 100% 56%)",
                    color: "hsl(222 47% 2%)",
                  }}
                >
                  {enviando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
                YARA · Powered by Google Gemini · Respostas podem conter erros — sempre revise
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
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

      {/* Avatar */}
      {isUser ? (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs"
          style={{
            background: "hsl(210 100% 56% / 0.15)",
            border: "1px solid hsl(210 100% 56% / 0.3)",
            color: "hsl(210 100% 70%)",
          }}
        >
          <User className="w-4 h-4" />
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5 avatar-glow">
          <img
            src="/images/yara-avatar.png"
            alt="YARA"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Balão */}
      <div
        className="max-w-[82%] rounded-2xl px-4 py-3 text-sm"
        style={isUser ? {
          background: "hsl(210 100% 56%)",
          color: "hsl(222 47% 2%)",
          borderTopRightRadius: "4px",
        } : {
          background: "hsl(222 40% 7%)",
          border: "1px solid hsl(220 25% 12%)",
          borderTopLeftRadius: "4px",
        }}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
            {msg.content ? (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }: any) {
                    const isBlock = className?.includes("language-");
                    return isBlock ? (
                      <pre
                        className="overflow-x-auto my-2 rounded-xl p-3 text-xs"
                        style={{ background: "hsl(222 47% 3%)", border: "1px solid hsl(220 25% 12%)" }}
                      >
                        <code className={`${className}`} {...props}>{children}</code>
                      </pre>
                    ) : (
                      <code
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{ background: "hsl(222 47% 3%)", color: "hsl(210 100% 70%)" }}
                        {...props}
                      >
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
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{
                      background: "hsl(210 100% 56%)",
                      animation: `typing-dot 1.2s ease-in-out ${delay}ms infinite`,
                    }}
                  />
                ))}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
