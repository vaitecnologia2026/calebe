"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Conv = {
  id: string;
  leadId: string;
  leadName: string;
  leadPhoneMasked: string;
  leadStatus: string;
  leadSource: string;
  status: string;
  lastMessageAt: string | null;
  openedAt: string;
};

type Msg = {
  id: string;
  direction: "IN" | "OUT";
  type: string;
  contentText: string | null;
  createdAt: string;
};

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function dateOf(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

const LEAD_STATUS_SHORT: Record<string, string> = {
  NEW: "Novo",
  IN_CONTACT: "Em contato",
  QUALIFIED: "Qualificado",
  VISIT_SCHEDULED: "Visita",
  PROPOSAL: "Proposta",
  WON: "Ganho",
  LOST: "Perdido"
};

export function ChatPane({
  conversations,
  activeId,
  messages
}: {
  conversations: Conv[];
  activeId: string | null;
  messages: Msg[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const filteredConvs = conversations.filter((c) => {
    const q = filter.trim().toLowerCase();
    return !q || c.leadName.toLowerCase().includes(q);
  });

  async function send() {
    const text = input.trim();
    if (!text || !active || sending) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/corretor/conversations/${active.id}/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contentText: text })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao enviar.");
      }
      setInput("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setSending(false);
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="card p-10 text-center text-sand-100/55">
        Nenhuma conversa ainda. Conversas são criadas automaticamente quando você recebe um lead.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden flex" style={{ height: "calc(100vh - 280px)", minHeight: 480 }}>
      {/* Lista de conversas */}
      <aside className="w-72 shrink-0 border-r hairline overflow-y-auto">
        <div className="p-3 border-b hairline">
          <input
            className="field-input py-2 text-sm"
            placeholder="Buscar conversa..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div>
          {filteredConvs.map((c) => (
            <a
              key={c.id}
              href={`/app/corretor/conversas?c=${c.id}`}
              className={`flex items-center gap-3 p-3 text-left w-full border-b hairline ${
                c.id === activeId ? "bg-gold-400/10" : "hover:bg-app-subtle/40"
              }`}
            >
              <div className="h-9 w-9 rounded-full bg-gold-400/15 flex items-center justify-center text-gold-400 font-bold text-sm">
                {c.leadName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-semibold truncate">{c.leadName}</p>
                  {c.lastMessageAt && (
                    <span className="text-[0.62rem] text-sand-100/55 shrink-0">
                      {timeOf(c.lastMessageAt)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-sand-100/55 truncate">
                  {LEAD_STATUS_SHORT[c.leadStatus] ?? c.leadStatus} · {c.leadSource}
                </p>
              </div>
            </a>
          ))}
        </div>
      </aside>

      {/* Pane de mensagens */}
      <div className="flex-1 flex flex-col min-w-0">
        {!active ? (
          <div className="flex-1 flex items-center justify-center text-sand-100/50">
            Selecione uma conversa
          </div>
        ) : (
          <>
            <header className="px-5 py-3 border-b hairline flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gold-400/15 flex items-center justify-center text-gold-400 font-bold">
                {active.leadName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{active.leadName}</p>
                <p className="text-xs text-sand-100/60 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-gold-400">
                    🔒 {active.leadPhoneMasked}
                  </span>
                  <span>·</span>
                  <span>{active.leadSource}</span>
                </p>
              </div>
              <span className="status status-gold">{LEAD_STATUS_SHORT[active.leadStatus]}</span>
            </header>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-2">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sand-100/45 text-sm">
                  Sem mensagens ainda. Envie a primeira para iniciar a conversa.
                </div>
              ) : (
                messages.map((m, i) => {
                  const prev = messages[i - 1];
                  const showDate =
                    !prev || dateOf(prev.createdAt) !== dateOf(m.createdAt);
                  return (
                    <div key={m.id} className={m.direction === "OUT" ? "self-end" : "self-start"}>
                      {showDate && (
                        <p className="text-[0.6rem] uppercase tracking-[0.12em] text-sand-100/45 text-center mb-1">
                          {dateOf(m.createdAt)}
                        </p>
                      )}
                      <div
                        className={
                          m.direction === "OUT"
                            ? "px-3 py-2 rounded-[14px] rounded-tr-[2px] max-w-md text-sm text-navy-950"
                            : "px-3 py-2 rounded-[14px] rounded-tl-[2px] max-w-md text-sm bg-app-subtle border hairline"
                        }
                        style={
                          m.direction === "OUT"
                            ? {
                                background:
                                  "linear-gradient(135deg,#DEB96D,#C9A961)"
                              }
                            : undefined
                        }
                      >
                        {m.contentText ?? "[mídia]"}
                      </div>
                      <p
                        className={`text-[0.6rem] text-sand-100/45 mt-0.5 ${
                          m.direction === "OUT" ? "text-right" : ""
                        }`}
                      >
                        {timeOf(m.createdAt)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t hairline">
              {error && (
                <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 mb-2">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-3 bg-app-subtle border hairline rounded-[4px] px-3 py-2.5">
                <input
                  type="text"
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="Digite sua mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  disabled={sending}
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="text-gold-400 hover:text-gold-300 transition-colors text-sm font-semibold"
                >
                  {sending ? "..." : "Enviar →"}
                </button>
              </div>
              <p className="text-[0.65rem] text-sand-100/45 mt-2 text-center flex items-center justify-center gap-1.5">
                🔒 Telefone real nunca exibido · Conversa auditada
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
