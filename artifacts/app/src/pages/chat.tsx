import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  MessageSquare, Plus, Trash2, Send, Loader2, X,
  Brain, Settings, Star, FolderOpen, History,
  Search, MoreVertical, Paperclip, ChevronDown,
  Monitor, Globe, LayoutDashboard, Database, Smartphone,
  MoreHorizontal, ChevronRight, Zap, LogOut, Sun, Moon,
  Code2, Cpu
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

const TIPOS_SISTEMA = [
  { icone: Globe, label: "Web App" },
  { icone: Code2, label: "API REST" },
  { icone: LayoutDashboard, label: "Dashboard" },
  { icone: Database, label: "Banco de Dados" },
  { icone: Smartphone, label: "Mobile App" },
  { icone: MoreHorizontal, label: "E muito mais" },
];

const ACOES_RAPIDAS = [
  "Me ajude a criar um projeto",
  "Analisar dados",
  "Resumo inteligente",
];

export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const conversationId = params?.id ? Number(params.id) : null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversa, setConversa] = useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<(ChatMessage | StreamingMessage)[]>([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

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
      const res = await fetch("/api/chat/conversations", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
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
      await fetch(`/api/chat/conversations/${id}`, { method: "DELETE", credentials: "include" });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) navigate("/chat");
    } catch {
      toast({ title: "Erro ao deletar", variant: "destructive" });
    }
  };

  const enviarMensagem = async (texto?: string) => {
    const conteudo = texto ?? input.trim();
    if (!conteudo || enviando) return;

    // Se não há conversa, cria uma
    let convId = conversationId;
    if (!convId) {
      try {
        const res = await fetch("/api/chat/conversations", { method: "POST", credentials: "include" });
        if (!res.ok) throw new Error();
        const nova: Conversation = await res.json();
        setConversations((prev) => [nova, ...prev]);
        navigate(`/chat/${nova.id}`);
        convId = nova.id;
        await new Promise(r => setTimeout(r, 50));
      } catch {
        toast({ title: "Erro ao criar conversa", variant: "destructive" });
        return;
      }
    }

    setInput("");
    setEnviando(true);
    setMessages((prev) => [...prev, { role: "user", content: conteudo }]);
    setMessages((prev) => [...prev, { role: "model", content: "", isStreaming: true }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: conteudo }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao enviar");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let resposta = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n\n");
        buffer = linhas.pop() || "";

        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(linha.slice(6));
            if (ev.type === "chunk") {
              resposta += ev.content;
              setMessages((prev) => {
                const n = [...prev];
                const idx = n.findLastIndex((m) => (m as StreamingMessage).isStreaming);
                if (idx !== -1) n[idx] = { role: "model", content: resposta, isStreaming: true };
                return n;
              });
            } else if (ev.type === "title") {
              setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, title: ev.title } : c));
              setConversa((prev) => prev ? { ...prev, title: ev.title } : prev);
            } else if (ev.type === "done") {
              setMessages((prev) => {
                const n = [...prev];
                const idx = n.findLastIndex((m) => (m as StreamingMessage).isStreaming);
                if (idx !== -1) n[idx] = { role: "model", content: resposta, isStreaming: false } as StreamingMessage;
                return n;
              });
            } else if (ev.type === "error") {
              throw new Error(ev.message);
            }
          } catch { }
        }
      }

      carregarConversas();
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages((prev) => prev.filter((m) => !(m as StreamingMessage).isStreaming));
      toast({ title: "Erro ao enviar mensagem", description: err.message, variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem(); }
  };

  const formatHora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const formatData = (iso: string) => {
    const d = new Date(iso);
    const hoje = new Date();
    const diff = Math.floor((hoje.getTime() - d.getTime()) / 86400000);
    if (diff === 0) return formatHora(iso);
    if (diff === 1) return "Ontem";
    if (diff < 7) return d.toLocaleDateString("pt-BR", { weekday: "short" });
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  const nomeUsuario = user?.email?.split("@")[0] ?? "Usuário";
  const inicialUsuario = (user?.email?.[0] ?? "U").toUpperCase();

  // ── SIDEBAR ESQUERDA ───────────────────────────────────────────────────
  const Sidebar = () => (
    <aside
      className="flex flex-col h-full w-[220px] shrink-0 border-r"
      style={{ background: "hsl(220 40% 5%)", borderRightColor: "hsl(210 100% 56% / 0.1)" }}
    >
      {/* Avatar YARA */}
      <div className="flex flex-col items-center pt-6 pb-4 px-4 border-b" style={{ borderBottomColor: "hsl(210 100% 56% / 0.1)" }}>
        <div className="w-20 h-20 rounded-full overflow-hidden mb-3 avatar-glow">
          <img src="/images/yara-avatar.png" alt="YARA" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <div className="font-bold text-lg yara-gradient-text tracking-wider">YARA</div>
          <div className="text-[9px] font-mono tracking-widest text-muted-foreground/60 mt-0.5">
            SUA INTELIGÊNCIA. <span style={{ color: "hsl(210 100% 60%)" }}>SEM LIMITES.</span>
          </div>
        </div>
      </div>

      {/* Botão Nova Conversa */}
      <div className="p-3">
        <button
          onClick={novaConversa}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{ background: "hsl(210 100% 56% / 0.15)", border: "1px solid hsl(210 100% 56% / 0.3)", color: "hsl(210 100% 70%)" }}
        >
          <MessageSquare className="w-4 h-4" />
          Nova Conversa
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {[
          { label: "Memória", icone: Brain, href: "/memoria" },
          { label: "Gerador de Sistemas", icone: Cpu, href: "/painel" },
          { label: "Meus Projetos", icone: FolderOpen, href: "/painel" },
          { label: "Histórico de Conversas", icone: History, href: "/chat" },
          { label: "Favoritos", icone: Star, href: "/chat" },
          { label: "Configurações", icone: Settings, href: "/chat" },
        ].map(({ label, icone: Icon, href }) => {
          const ativo = label === "Histórico de Conversas" && window.location.pathname.includes("/chat");
          return (
            <button
              key={label}
              onClick={() => { navigate(href); setSidebarAberta(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${ativo ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              style={ativo ? { background: "hsl(210 100% 56% / 0.12)", border: "1px solid hsl(210 100% 56% / 0.2)" } : {}}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}

        {/* Conversas recentes */}
        {conversations.length > 0 && (
          <div className="pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-3 mb-1">Recentes</div>
            {conversations.slice(0, 6).map((conv) => {
              const ativa = conv.id === conversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => { navigate(`/chat/${conv.id}`); setSidebarAberta(false); }}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                  style={ativa ? { background: "hsl(210 100% 56% / 0.1)", color: "hsl(210 100% 65%)" } : {}}
                >
                  <MessageSquare className="w-3 h-3 shrink-0 opacity-40" />
                  <span className="flex-1 truncate text-xs text-muted-foreground group-hover:text-foreground transition-colors">{conv.title}</span>
                  <button
                    onClick={(e) => deletarConversa(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </nav>

      {/* Card Upgrade */}
      <div className="mx-3 mb-3 p-3 rounded-xl border" style={{ background: "hsl(220 40% 7%)", borderColor: "hsl(210 100% 56% / 0.15)" }}>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 shrink-0" style={{ color: "hsl(210 100% 60%)" }} />
          <span className="text-xs text-muted-foreground">Desbloqueie todo o potencial da YARA</span>
        </div>
        <button
          className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "hsl(210 100% 56% / 0.15)", border: "1px solid hsl(210 100% 56% / 0.3)", color: "hsl(210 100% 70%)" }}
        >
          Upgrade
        </button>
      </div>

      {/* Usuário */}
      <div className="border-t p-3" style={{ borderTopColor: "hsl(210 100% 56% / 0.1)" }}>
        <div className="flex items-center gap-2.5 px-1 py-1 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "hsl(210 100% 56% / 0.15)", color: "hsl(210 100% 70%)", border: "1px solid hsl(210 100% 56% / 0.25)" }}
          >
            {inicialUsuario}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate capitalize">{nomeUsuario}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-red-400 transition-colors text-muted-foreground"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );

  // ── PAINEL DIREITO ─────────────────────────────────────────────────────
  const PainelDireito = () => (
    <aside
      className="hidden xl:flex flex-col w-[260px] shrink-0 border-l overflow-y-auto"
      style={{ background: "hsl(220 40% 4%)", borderLeftColor: "hsl(210 100% 56% / 0.1)" }}
    >
      {/* Gerador de Sistemas */}
      <div className="p-4 border-b" style={{ borderBottomColor: "hsl(210 100% 56% / 0.08)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">Gerador de Sistemas</span>
          <button className="text-[11px] transition-colors" style={{ color: "hsl(210 100% 65%)" }}>Ver todos</button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Crie sistemas completos com IA em segundos.</p>

        <button
          onClick={() => navigate("/projetos/novo")}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all mb-3"
          style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)" }}
        >
          <Plus className="w-4 h-4" />
          Novo Sistema
        </button>

        <div className="grid grid-cols-3 gap-2">
          {TIPOS_SISTEMA.map(({ icone: Icon, label }) => (
            <button
              key={label}
              onClick={() => navigate("/projetos/novo")}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-center transition-all group"
              style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(220 25% 12%)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(210 100% 56% / 0.3)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(220 25% 12%)"; }}
            >
              <Icon className="w-5 h-5" style={{ color: "hsl(210 100% 65%)" }} />
              <span className="text-[9px] text-muted-foreground leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="p-4 border-b" style={{ borderBottomColor: "hsl(210 100% 56% / 0.08)" }}>
        <div className="font-semibold text-sm mb-3">Atalhos Rápidos</div>
        <div className="space-y-1">
          {[
            { label: "Meus Projetos", icone: FolderOpen, href: "/painel" },
            { label: "Memória", icone: Brain, href: "/memoria" },
            { label: "Histórico de Conversas", icone: History, href: "/chat" },
            { label: "Favoritos", icone: Star, href: "/chat" },
          ].map(({ label, icone: Icon, href }) => (
            <button
              key={label}
              onClick={() => navigate(href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all text-left"
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate text-xs">{label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </button>
          ))}
        </div>
      </div>

      {/* Status YARA */}
      <div className="p-4">
        <div className="p-3 rounded-xl border" style={{ background: "hsl(222 40% 6%)", borderColor: "hsl(210 100% 56% / 0.12)" }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-400 yara-pulse" />
            <span className="text-sm font-semibold">YARA Online</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">Pronta para ajudar você</p>
          {/* Waveform SVG */}
          <svg viewBox="0 0 220 30" className="w-full h-6 opacity-60">
            <polyline
              points="0,15 15,8 25,20 35,5 45,22 55,10 65,18 75,6 85,20 95,12 105,18 115,7 125,21 135,11 145,17 155,6 165,22 175,9 185,19 195,12 205,18 220,15"
              fill="none"
              stroke="hsl(210 100% 56%)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(222 47% 2%)" }}>

      {/* OVERLAY MOBILE SIDEBAR */}
      {sidebarAberta && (
        <div className="fixed inset-0 z-30 md:hidden bg-black/70 backdrop-blur-sm" onClick={() => setSidebarAberta(false)} />
      )}

      {/* SIDEBAR ESQUERDA — desktop sempre visível, mobile overlay */}
      <div className={`
        fixed md:relative z-40 md:z-auto h-full
        transition-transform duration-300 ease-in-out
        ${sidebarAberta ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <Sidebar />
      </div>

      {/* CONTEÚDO CENTRAL */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* SUB-HEADER do chat */}
        <div
          className="h-12 flex items-center px-4 gap-3 shrink-0 border-b"
          style={{ background: "hsl(222 40% 4%)", borderBottomColor: "hsl(210 100% 56% / 0.1)" }}
        >
          {/* Hambúrguer mobile */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            onClick={() => setSidebarAberta(true)}
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Título da conversa */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-semibold text-sm truncate">
              {conversa?.title ?? "Nova Conversa"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </div>

          {/* Ações direita */}
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <Search className="w-4 h-4" />
            </button>
            <div className="relative">
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                onClick={() => setMenuAberto(!menuAberto)}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuAberto && (
                <div
                  className="absolute right-0 top-full mt-1 w-52 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                  style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(220 25% 12%)" }}
                >
                  {[
                    { label: "Configurações", icone: Settings },
                    { label: "Limpar chat", icone: Trash2 },
                    { label: "Exportar conversa", icone: FolderOpen },
                    { label: "Sobre", icone: Star },
                  ].map(({ label, icone: Icon }) => (
                    <button
                      key={label}
                      onClick={() => setMenuAberto(false)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MENSAGENS */}
        <div className="flex-1 overflow-y-auto">
          {carregando ? (
            <div className="h-full flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : messages.length === 0 ? (
            /* Tela inicial vazia */
            <div className="h-full flex flex-col items-center justify-center gap-5 p-6 text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden avatar-glow">
                <img src="/images/yara-avatar.png" alt="YARA" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">
                  Olá, <span className="capitalize">{nomeUsuario}</span>! 👋
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Sou a YARA, sua inteligência sem limites. Como posso te ajudar hoje?
                </p>
              </div>
              {/* Ações rápidas */}
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {ACOES_RAPIDAS.map((acao) => (
                  <button
                    key={acao}
                    onClick={() => enviarMensagem(acao)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: "hsl(222 40% 7%)",
                      border: "1px solid hsl(210 100% 56% / 0.2)",
                      color: "hsl(210 15% 70%)",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(210 100% 56% / 0.5)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsl(210 100% 56% / 0.2)"; }}
                  >
                    <Zap className="w-3 h-3" style={{ color: "hsl(210 100% 60%)" }} />
                    {acao}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
              {/* Separador de data */}
              {messages.length > 0 && (
                <div className="flex items-center justify-center">
                  <div className="text-[11px] text-muted-foreground/50 px-3 py-1 rounded-full border" style={{ borderColor: "hsl(220 25% 12%)", background: "hsl(222 40% 5%)" }}>
                    {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <BolhaChat key={idx} msg={msg} />
              ))}

              {/* Ações rápidas no final */}
              {!enviando && messages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {ACOES_RAPIDAS.map((acao) => (
                    <button
                      key={acao}
                      onClick={() => enviarMensagem(acao)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(210 100% 56% / 0.15)", color: "hsl(210 15% 65%)" }}
                    >
                      <Zap className="w-3 h-3 opacity-60" />
                      {acao}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* INPUT */}
        <div
          className="border-t p-4 shrink-0"
          style={{ background: "hsl(222 40% 4%)", borderTopColor: "hsl(210 100% 56% / 0.1)" }}
        >
          <div className="max-w-3xl mx-auto">
            <div
              className="flex items-end gap-2 rounded-2xl px-3 py-2 transition-all input-neon"
              style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(220 25% 14%)" }}
            >
              <button className="mb-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0">
                <Paperclip className="w-4 h-4" />
              </button>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="flex-1 min-h-[40px] max-h-[160px] resize-none border-0 bg-transparent p-1 focus-visible:ring-0 text-sm placeholder:text-muted-foreground/40"
                disabled={enviando}
                rows={1}
              />
              <button
                onClick={() => enviarMensagem()}
                disabled={enviando || !input.trim()}
                className="mb-1 w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)" }}
              >
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/30 text-center mt-2">
              YARA · Google Gemini · As respostas podem conter erros — revise antes de usar
            </p>
          </div>
        </div>
      </div>

      {/* PAINEL DIREITO */}
      <PainelDireito />
    </div>
  );
}

function BolhaChat({ msg }: { msg: ChatMessage | StreamingMessage }) {
  const isUser = msg.role === "user";
  const isStreaming = (msg as StreamingMessage).isStreaming;
  const hora = (msg as ChatMessage).createdAt
    ? new Date((msg as ChatMessage).createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs"
          style={{ background: "hsl(210 100% 56% / 0.15)", border: "1px solid hsl(210 100% 56% / 0.3)", color: "hsl(210 100% 70%)" }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      ) : (
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 mt-0.5 avatar-glow">
          <img src="/images/yara-avatar.png" alt="YARA" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Bolha */}
      <div className="max-w-[78%] flex flex-col gap-1">
        <div
          className="rounded-2xl px-4 py-2.5 text-sm"
          style={isUser ? {
            background: "hsl(210 100% 50%)",
            color: "#fff",
            borderTopRightRadius: "4px",
          } : {
            background: "hsl(222 40% 9%)",
            border: "1px solid hsl(220 25% 14%)",
            borderTopLeftRadius: "4px",
          }}
        >
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
                        <pre className="overflow-x-auto my-2 rounded-xl p-3 text-xs"
                          style={{ background: "hsl(222 47% 3%)", border: "1px solid hsl(220 25% 12%)" }}>
                          <code className={className} {...props}>{children}</code>
                        </pre>
                      ) : (
                        <code className="px-1.5 py-0.5 rounded text-xs font-mono"
                          style={{ background: "hsl(222 47% 3%)", color: "hsl(210 100% 70%)" }} {...props}>
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
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: "hsl(210 100% 56%)", animation: `typing-dot 1.2s ease-in-out ${d}ms infinite` }} />
                  ))}
                </span>
              )}
            </div>
          )}
        </div>
        {hora && (
          <div className={`text-[10px] text-muted-foreground/40 flex items-center gap-1 ${isUser ? "justify-end" : "justify-start"}`}>
            {hora}
            {isUser && <span className="opacity-60">✓✓</span>}
          </div>
        )}
      </div>
    </div>
  );
}
