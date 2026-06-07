import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  MessageSquare, Plus, Trash2, Send, Loader2, X,
  Brain, Settings, Star, FolderOpen, History,
  Search, MoreVertical, Paperclip, ChevronDown,
  Globe, LayoutDashboard, Database, Smartphone,
  MoreHorizontal, ChevronRight, Zap, LogOut, Sun,
  Code2, Cpu, PanelLeftClose, PanelLeftOpen,
  Download, Info, Trash, ChevronLeft
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { yaraAvatar, yaraLogo } from "@/lib/images";

/* ── Tipos ── */
type Conversation = { id: number; title: string; createdAt: string; updatedAt: string };
type ChatMessage = { id: number; conversationId: number; role: "user" | "model"; content: string; createdAt: string };
type ConversationWithMessages = Conversation & { messages: ChatMessage[] };
type StreamingMessage = { role: "user" | "model"; content: string; isStreaming?: boolean };

const TIPOS_SISTEMA = [
  { icone: Globe,           label: "Web App" },
  { icone: Code2,           label: "API REST" },
  { icone: LayoutDashboard, label: "Dashboard" },
  { icone: Database,        label: "Banco de Dados" },
  { icone: Smartphone,      label: "Mobile App" },
  { icone: MoreHorizontal,  label: "E muito mais" },
];

const ACOES_RAPIDAS = [
  { texto: "Me ajude a criar um projeto", icone: Cpu },
  { texto: "Analisar dados",              icone: Database },
  { texto: "Resumo inteligente",          icone: Brain },
];

/* ── Exportar conversa ── */
function exportarConversa(titulo: string, msgs: (ChatMessage | StreamingMessage)[]) {
  const linhas = [
    `YARA — Exportação de Conversa`,
    `Título: ${titulo}`,
    `Data: ${new Date().toLocaleString("pt-BR")}`,
    `${"─".repeat(50)}`,
    "",
    ...msgs.map((m) => {
      const autor = m.role === "user" ? "Você" : "YARA";
      return `[${autor}]\n${m.content}\n`;
    }),
  ];
  const blob = new Blob([linhas.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `yara-chat-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ════════════════════════════════════════════════ */
export default function Chat() {
  const [, params] = useRoute("/chat/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const conversationId = params?.id ? Number(params.id) : null;

  const [conversations,  setConversations]  = useState<Conversation[]>([]);
  const [conversa,       setConversa]        = useState<ConversationWithMessages | null>(null);
  const [messages,       setMessages]        = useState<(ChatMessage | StreamingMessage)[]>([]);
  const [input,          setInput]           = useState("");
  const [enviando,       setEnviando]        = useState(false);
  const [carregando,     setCarregando]      = useState(false);
  const [sidebarMobile,  setSidebarMobile]   = useState(false);
  const [sidebarAberta,  setSidebarAberta]   = useState(true);   // desktop collapse
  const [menuAberto,     setMenuAberto]      = useState(false);
  const [modalAberto,    setModalAberto]     = useState<"settings" | "about" | null>(null);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const menuRef      = useRef<HTMLDivElement>(null);

  /* scroll para baixo */
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  /* fechar menu ao clicar fora */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* ── API ── */
  const carregarConversas = useCallback(async () => {
    try {
      const r = await fetch("/api/chat/conversations", { credentials: "include" });
      if (r.ok) setConversations(await r.json());
    } catch { }
  }, []);

  useEffect(() => { carregarConversas(); }, [carregarConversas]);

  useEffect(() => {
    if (!conversationId) { setConversa(null); setMessages([]); return; }
    setCarregando(true);
    fetch(`/api/chat/conversations/${conversationId}`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) { navigate("/chat"); return; }
        const d: ConversationWithMessages = await r.json();
        setConversa(d); setMessages(d.messages);
      })
      .catch(() => navigate("/chat"))
      .finally(() => setCarregando(false));
  }, [conversationId, navigate]);

  const novaConversa = async () => {
    setSidebarMobile(false);
    try {
      const r = await fetch("/api/chat/conversations", { method: "POST", credentials: "include" });
      if (!r.ok) throw new Error();
      const nova: Conversation = await r.json();
      setConversations((p) => [nova, ...p]);
      navigate(`/chat/${nova.id}`);
    } catch {
      toast({ title: "Erro ao criar conversa", variant: "destructive" });
    }
  };

  const deletarConversa = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await fetch(`/api/chat/conversations/${id}`, { method: "DELETE", credentials: "include" });
      setConversations((p) => p.filter((c) => c.id !== id));
      if (conversationId === id) navigate("/chat");
    } catch {
      toast({ title: "Erro ao deletar", variant: "destructive" });
    }
  };

  /* enviar mensagem com suporte a ação rápida */
  const enviarMensagem = async (texto?: string) => {
    const conteudo = texto ?? input.trim();
    if (!conteudo || enviando) return;

    let convId = conversationId;
    if (!convId) {
      try {
        const r = await fetch("/api/chat/conversations", { method: "POST", credentials: "include" });
        if (!r.ok) throw new Error();
        const nova: Conversation = await r.json();
        setConversations((p) => [nova, ...p]);
        navigate(`/chat/${nova.id}`);
        convId = nova.id;
        await new Promise((res) => setTimeout(res, 60));
      } catch {
        toast({ title: "Erro ao criar conversa", variant: "destructive" });
        return;
      }
    }

    setInput("");
    setEnviando(true);
    setMessages((p) => [...p, { role: "user", content: conteudo }]);
    setMessages((p) => [...p, { role: "model", content: "", isStreaming: true }]);

    abortRef.current = new AbortController();

    try {
      const r = await fetch(`/api/chat/conversations/${convId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: conteudo }),
        signal: abortRef.current.signal,
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "Erro"); }

      const reader = r.body!.getReader();
      const dec = new TextDecoder();
      let buf = "", resp = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const linhas = buf.split("\n\n");
        buf = linhas.pop() || "";
        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(linha.slice(6));
            if (ev.type === "chunk") {
              resp += ev.content;
              setMessages((p) => {
                const n = [...p];
                const i = n.findLastIndex((m) => (m as StreamingMessage).isStreaming);
                if (i !== -1) n[i] = { role: "model", content: resp, isStreaming: true };
                return n;
              });
            } else if (ev.type === "title") {
              setConversations((p) => p.map((c) => c.id === convId ? { ...c, title: ev.title } : c));
              setConversa((p) => p ? { ...p, title: ev.title } : p);
            } else if (ev.type === "done") {
              setMessages((p) => {
                const n = [...p];
                const i = n.findLastIndex((m) => (m as StreamingMessage).isStreaming);
                if (i !== -1) n[i] = { role: "model", content: resp, isStreaming: false } as StreamingMessage;
                return n;
              });
            } else if (ev.type === "error") throw new Error(ev.message);
          } catch { }
        }
      }
      carregarConversas();
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages((p) => p.filter((m) => !(m as StreamingMessage).isStreaming));
      toast({ title: "Erro ao enviar mensagem", description: err.message, variant: "destructive" });
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem(); }
  };

  const limparConversa = () => { setMessages([]); setMenuAberto(false); };

  const exportarChat = () => {
    if (!messages.length) { toast({ title: "Nenhuma mensagem para exportar" }); return; }
    exportarConversa(conversa?.title ?? "Conversa", messages);
    setMenuAberto(false);
    toast({ title: "Chat exportado com sucesso!" });
  };

  const nomeUsuario   = user?.email?.split("@")[0] ?? "Usuário";
  const inicialUsuario = (user?.email?.[0] ?? "U").toUpperCase();

  /* ════ SIDEBAR ════ */
  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: "hsl(220 40% 5%)" }}>

      {/* Cabeçalho sidebar */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        {sidebarAberta && (
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground/40 uppercase">Menu</span>
        )}
        {/* Toggle desktop */}
        <button
          onClick={() => setSidebarAberta(!sidebarAberta)}
          className="hidden md:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground ml-auto"
          title={sidebarAberta ? "Recolher sidebar" : "Expandir sidebar"}
        >
          {sidebarAberta ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* Avatar + identidade */}
      <div className={`flex flex-col items-center py-4 px-3 border-b transition-all duration-300 ${sidebarAberta ? "px-4" : "px-2"}`}
        style={{ borderBottomColor: "hsl(210 100% 56% / 0.1)" }}>
        <div className={`rounded-full overflow-hidden avatar-glow-animate transition-all duration-300 ${sidebarAberta ? "w-20 h-20 mb-3" : "w-10 h-10 mb-1"}`}>
          <img src={yaraAvatar} alt="YARA" className="w-full h-full object-cover" />
        </div>
        {sidebarAberta && (
          <div className="text-center fade-in">
            <div className="font-bold text-lg yara-gradient-text tracking-wider">YARA</div>
            <div className="text-[9px] font-mono tracking-widest text-muted-foreground/60 mt-0.5">
              SUA INTELIGÊNCIA. <span style={{ color: "hsl(210 100% 60%)" }}>SEM LIMITES.</span>
            </div>
          </div>
        )}
      </div>

      {/* Botão Nova Conversa */}
      <div className={`p-3 ${sidebarAberta ? "" : "px-2"}`}>
        <button
          onClick={novaConversa}
          className="w-full flex items-center gap-2.5 rounded-xl font-semibold text-sm transition-all btn-neon"
          style={{
            background: "hsl(210 100% 56% / 0.14)",
            border: "1px solid hsl(210 100% 56% / 0.3)",
            color: "hsl(210 100% 70%)",
            padding: sidebarAberta ? "10px 14px" : "10px",
            justifyContent: sidebarAberta ? "flex-start" : "center",
          }}
          title={!sidebarAberta ? "Nova Conversa" : undefined}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {sidebarAberta && <span>Nova Conversa</span>}
        </button>
      </div>

      {/* Navegação */}
      <nav className={`flex-1 overflow-y-auto space-y-0.5 ${sidebarAberta ? "px-2" : "px-2"}`}>
        {[
          { label: "Memória",                icone: Brain,     href: "/memoria" },
          { label: "Gerador de Sistemas",    icone: Cpu,       href: "/painel" },
          { label: "Meus Projetos",          icone: FolderOpen, href: "/painel" },
          { label: "Histórico",              icone: History,   href: "/chat" },
          { label: "Favoritos",              icone: Star,      href: "/chat" },
          { label: "Configurações",          icone: Settings,  href: null, action: () => setModalAberto("settings") },
        ].map(({ label, icone: Icon, href, action }) => (
          <button
            key={label}
            onClick={() => action ? action() : href && navigate(href)}
            className="nav-item w-full flex items-center gap-3 rounded-xl text-sm text-left text-muted-foreground"
            style={{
              padding: sidebarAberta ? "10px 12px" : "10px",
              justifyContent: sidebarAberta ? "flex-start" : "center",
            }}
            title={!sidebarAberta ? label : undefined}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {sidebarAberta && <span className="truncate fade-in">{label}</span>}
          </button>
        ))}

        {/* Conversas recentes */}
        {sidebarAberta && conversations.length > 0 && (
          <div className="pt-3 fade-in">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-3 mb-1">Recentes</div>
            {conversations.slice(0, 8).map((conv) => {
              const ativa = conv.id === conversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => { navigate(`/chat/${conv.id}`); setSidebarMobile(false); }}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all nav-item"
                  style={ativa ? { background: "hsl(210 100% 56% / 0.1)", color: "hsl(210 100% 65%)" } : {}}
                >
                  <MessageSquare className="w-3 h-3 shrink-0 opacity-40" />
                  <span className="flex-1 truncate text-xs text-muted-foreground group-hover:text-foreground transition-colors">{conv.title}</span>
                  <button
                    onClick={(e) => deletarConversa(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 shrink-0"
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
      {sidebarAberta && (
        <div className="mx-3 mb-3 p-3 rounded-xl border fade-in" style={{ background: "hsl(220 40% 7%)", borderColor: "hsl(210 100% 56% / 0.15)" }}>
          <div className="flex items-start gap-2 mb-2">
            <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(210 100% 60%)" }} />
            <span className="text-xs text-muted-foreground leading-snug">Desbloqueie todo o potencial da YARA</span>
          </div>
          <button className="w-full py-1.5 rounded-lg text-xs font-semibold btn-neon"
            style={{ background: "hsl(210 100% 56% / 0.12)", border: "1px solid hsl(210 100% 56% / 0.3)", color: "hsl(210 100% 70%)" }}>
            Upgrade
          </button>
        </div>
      )}

      {/* Usuário */}
      <div className="border-t" style={{ borderTopColor: "hsl(210 100% 56% / 0.1)" }}>
        <div className={`flex items-center gap-2.5 p-3 hover:bg-secondary transition-colors cursor-pointer rounded-b-none ${!sidebarAberta ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: "hsl(210 100% 56% / 0.15)", color: "hsl(210 100% 70%)", border: "1px solid hsl(210 100% 56% / 0.25)" }}>
            {inicialUsuario}
          </div>
          {sidebarAberta && (
            <div className="flex-1 min-w-0 fade-in">
              <div className="text-xs font-semibold truncate capitalize">{nomeUsuario}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
            </div>
          )}
          {sidebarAberta && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        </div>
        <div className={`flex items-center px-3 pb-3 gap-1 ${sidebarAberta ? "justify-between" : "justify-center"}`}>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Tema">
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setModalAberto("about")} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Sobre">
            <Info className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => logout()} className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-red-400 transition-colors text-muted-foreground" title="Sair">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  /* ════ PAINEL DIREITO ════ */
  const PainelDireito = () => (
    <aside className="hidden xl:flex flex-col w-[260px] shrink-0 border-l overflow-y-auto"
      style={{ background: "hsl(220 40% 4%)", borderLeftColor: "hsl(210 100% 56% / 0.1)" }}>

      <div className="p-4 border-b" style={{ borderBottomColor: "hsl(210 100% 56% / 0.08)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm">Gerador de Sistemas</span>
          <button className="text-[11px] transition-colors hover:underline" style={{ color: "hsl(210 100% 65%)" }}
            onClick={() => navigate("/painel")}>Ver todos</button>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">Crie sistemas completos com IA em segundos.</p>
        <button
          onClick={() => navigate("/projetos/novo")}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all mb-3 btn-neon"
          style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)" }}>
          <Plus className="w-4 h-4" />
          Novo Sistema
        </button>
        <div className="grid grid-cols-3 gap-2">
          {TIPOS_SISTEMA.map(({ icone: Icon, label }) => (
            <button key={label} onClick={() => navigate("/projetos/novo")}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl text-center transition-all nav-item"
              style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(220 25% 12%)" }}>
              <Icon className="w-5 h-5" style={{ color: "hsl(210 100% 65%)" }} />
              <span className="text-[9px] text-muted-foreground leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b" style={{ borderBottomColor: "hsl(210 100% 56% / 0.08)" }}>
        <div className="font-semibold text-sm mb-3">Atalhos Rápidos</div>
        <div className="space-y-1">
          {[
            { label: "Meus Projetos",  icone: FolderOpen, href: "/painel" },
            { label: "Memória",        icone: Brain,      href: "/memoria" },
            { label: "Histórico",      icone: History,    href: "/chat" },
            { label: "Favoritos",      icone: Star,       href: "/chat" },
          ].map(({ label, icone: Icon, href }) => (
            <button key={label} onClick={() => navigate(href)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left nav-item text-muted-foreground">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate text-xs">{label}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <div className="p-3 rounded-xl border" style={{ background: "hsl(222 40% 6%)", borderColor: "hsl(210 100% 56% / 0.12)" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-400 yara-pulse" />
            <span className="text-sm font-semibold">YARA Online</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">Pronta para ajudar você</p>
          <div className="flex items-end gap-0.5 h-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-sm"
                style={{
                  background: "hsl(210 100% 56%)",
                  height: `${30 + Math.sin(i * 0.8) * 50}%`,
                  opacity: 0.4 + Math.abs(Math.sin(i * 0.5)) * 0.5,
                  animation: `wave ${1 + (i % 5) * 0.2}s ease-in-out ${i * 0.05}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );

  /* ════ MODAL SETTINGS ════ */
  const ModalSettings = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={() => setModalAberto(null)}>
      <div className="modal-content w-full max-w-md mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(222 40% 6%)", border: "1px solid hsl(210 100% 56% / 0.2)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderBottomColor: "hsl(210 100% 56% / 0.12)" }}>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" style={{ color: "hsl(210 100% 65%)" }} />
            <span className="font-semibold">Configurações</span>
          </div>
          <button onClick={() => setModalAberto(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">Conversa</div>
            <button
              onClick={() => { limparConversa(); setModalAberto(null); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all nav-item text-muted-foreground hover:text-destructive"
              style={{ background: "hsl(222 40% 8%)", border: "1px solid hsl(220 25% 12%)" }}>
              <Trash className="w-4 h-4 shrink-0" />
              Limpar conversa atual
            </button>
            <button
              onClick={() => { exportarChat(); setModalAberto(null); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all nav-item text-muted-foreground"
              style={{ background: "hsl(222 40% 8%)", border: "1px solid hsl(220 25% 12%)" }}>
              <Download className="w-4 h-4 shrink-0" />
              Exportar conversa (.txt)
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">Conta</div>
            <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "hsl(222 40% 8%)", border: "1px solid hsl(220 25% 12%)" }}>
              <div className="text-xs text-muted-foreground mb-1">E-mail</div>
              <div className="font-mono text-sm">{user?.email}</div>
            </div>
            <button
              onClick={() => { logout(); setModalAberto(null); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all hover:bg-destructive/10 hover:text-red-400 text-muted-foreground"
              style={{ background: "hsl(222 40% 8%)", border: "1px solid hsl(220 25% 12%)" }}>
              <LogOut className="w-4 h-4 shrink-0" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ════ MODAL ABOUT ════ */
  const ModalAbout = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={() => setModalAberto(null)}>
      <div className="modal-content w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(222 40% 6%)", border: "1px solid hsl(210 100% 56% / 0.2)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex flex-col items-center p-6 text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden avatar-glow-animate mb-4">
            <img src={yaraAvatar} alt="YARA" className="w-full h-full object-cover" />
          </div>
          <div className="text-2xl font-bold yara-gradient-text mb-1">GPT YARA</div>
          <div className="text-xs font-mono text-muted-foreground/60 tracking-widest mb-4">SUA INTELIGÊNCIA. SEM LIMITES.</div>
          <div className="text-sm text-muted-foreground text-center mb-4 leading-relaxed">
            Sistema de IA conversacional com memória persistente, gerador de sistemas e integração com Google Gemini.
          </div>
          <div className="w-full px-4 py-3 rounded-xl text-xs font-mono text-muted-foreground text-left space-y-1"
            style={{ background: "hsl(222 40% 8%)", border: "1px solid hsl(220 25% 12%)" }}>
            <div>🔷 Motor: Google Gemini</div>
            <div>🔷 Frontend: React + Tailwind</div>
            <div>🔷 Backend: Node.js + Express</div>
            <div>🔷 Banco: PostgreSQL</div>
          </div>
          <button onClick={() => setModalAberto(null)} className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold btn-neon"
            style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)" }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════ RENDER ══ */
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "hsl(222 47% 2%)" }}>

      {/* Modais */}
      {modalAberto === "settings" && <ModalSettings />}
      {modalAberto === "about"    && <ModalAbout />}

      {/* Overlay mobile */}
      {sidebarMobile && (
        <div className="fixed inset-0 z-30 md:hidden bg-black/70 backdrop-blur-sm"
          onClick={() => setSidebarMobile(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <div
        className={`
          sidebar-transition border-r shrink-0
          fixed md:relative z-40 md:z-auto h-full
          ${sidebarMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${sidebarAberta ? "w-[220px]" : "w-[60px]"}
        `}
        style={{ borderRightColor: "hsl(210 100% 56% / 0.1)" }}
      >
        <SidebarContent />
      </div>

      {/* ── ÁREA CENTRAL ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Sub-header */}
        <div className="h-12 flex items-center px-4 gap-3 shrink-0 border-b"
          style={{ background: "hsl(222 40% 4%)", borderBottomColor: "hsl(210 100% 56% / 0.1)" }}>

          {/* Hamburger mobile */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
            onClick={() => setSidebarMobile(true)}>
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Voltar (mobile) */}
          {conversationId && (
            <button onClick={() => navigate("/chat")}
              className="sm:hidden flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Título */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-semibold text-sm truncate">{conversa?.title ?? "Nova Conversa"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
              <Search className="w-4 h-4" />
            </button>
            <div className="relative" ref={menuRef}>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                onClick={() => setMenuAberto(!menuAberto)}>
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuAberto && (
                <div className="absolute right-0 top-full mt-1 w-52 rounded-xl shadow-2xl z-50 overflow-hidden py-1 fade-in"
                  style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(220 25% 14%)" }}>
                  {[
                    { label: "Configurações",    icone: Settings,  fn: () => { setModalAberto("settings"); setMenuAberto(false); } },
                    { label: "Limpar conversa",  icone: Trash,     fn: limparConversa },
                    { label: "Exportar chat",    icone: Download,  fn: exportarChat },
                    { label: "Sobre a YARA",     icone: Info,      fn: () => { setModalAberto("about"); setMenuAberto(false); } },
                  ].map(({ label, icone: Icon, fn }) => (
                    <button key={label} onClick={fn}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-left">
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto">
          {carregando ? (
            <div className="h-full flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Carregando...</span>
            </div>
          ) : messages.length === 0 ? (
            /* ── Tela inicial ── */
            <div className="h-full flex flex-col items-center justify-center gap-5 p-6 text-center fade-in">
              <div className="w-24 h-24 rounded-full overflow-hidden avatar-glow-animate">
                <img src={yaraAvatar} alt="YARA" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Olá{nomeUsuario !== "Usuário" ? `, ${nomeUsuario}` : ""}! 👋
                </h2>
                <p className="text-base text-muted-foreground">Como posso te ajudar hoje?</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {ACOES_RAPIDAS.map(({ texto, icone: Icon }) => (
                  <button key={texto} onClick={() => enviarMensagem(texto)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all btn-neon"
                    style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(210 100% 56% / 0.2)", color: "hsl(210 15% 72%)" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: "hsl(210 100% 60%)" }} />
                    {texto}
                  </button>
                ))}
              </div>
              <button onClick={novaConversa}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm btn-neon"
                style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)" }}>
                <Plus className="w-4 h-4" />
                Iniciar nova conversa
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">
              {/* Separador de data */}
              <div className="flex items-center justify-center">
                <div className="text-[11px] text-muted-foreground/50 px-3 py-1 rounded-full border"
                  style={{ borderColor: "hsl(220 25% 12%)", background: "hsl(222 40% 5%)" }}>
                  {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>

              {messages.map((msg, idx) => (
                <BolhaChat key={idx} msg={msg} />
              ))}

              {/* Ações rápidas pós-mensagem */}
              {!enviando && messages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {ACOES_RAPIDAS.map(({ texto, icone: Icon }) => (
                    <button key={texto} onClick={() => enviarMensagem(texto)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all btn-neon"
                      style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(210 100% 56% / 0.15)", color: "hsl(210 15% 62%)" }}>
                      <Icon className="w-3 h-3 opacity-60" />
                      {texto}
                    </button>
                  ))}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4 shrink-0"
          style={{ background: "hsl(222 40% 4%)", borderTopColor: "hsl(210 100% 56% / 0.1)" }}>
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 rounded-2xl px-3 py-2 transition-all input-neon"
              style={{ background: "hsl(222 40% 7%)", border: "1px solid hsl(220 25% 14%)" }}>
              <button className="mb-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0" title="Anexar arquivo">
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
                className="mb-1 w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-all disabled:opacity-40 btn-neon"
                style={{ background: "hsl(210 100% 56%)", color: "hsl(222 47% 2%)" }}>
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/30 text-center mt-2">
              YARA · Google Gemini · As respostas podem conter erros — revise antes de usar em produção
            </p>
          </div>
        </div>
      </div>

      {/* Painel direito */}
      <PainelDireito />
    </div>
  );
}

/* ── Bolha de chat ── */
function BolhaChat({ msg }: { msg: ChatMessage | StreamingMessage }) {
  const isUser      = msg.role === "user";
  const isStreaming = (msg as StreamingMessage).isStreaming;
  const hora        = (msg as ChatMessage).createdAt
    ? new Date((msg as ChatMessage).createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse msg-user" : "flex-row msg-ai"}`}>

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
          <img src={yaraAvatar} alt="YARA" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Bolha */}
      <div className="max-w-[78%] flex flex-col gap-1">
        <div className="rounded-2xl px-4 py-2.5 text-sm"
          style={isUser ? {
            background: "hsl(210 100% 50%)",
            color: "#fff",
            borderTopRightRadius: "4px",
          } : {
            background: "hsl(222 40% 9%)",
            border: "1px solid hsl(220 25% 14%)",
            borderTopLeftRadius: "4px",
          }}>
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
              {msg.content ? (
                <ReactMarkdown components={{
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
                }}>
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
            {hora}{isUser && <span className="opacity-60">✓✓</span>}
          </div>
        )}
      </div>
    </div>
  );
}
