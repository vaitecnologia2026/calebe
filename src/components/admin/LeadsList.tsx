"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LeadStatus } from "@prisma/client";

type Lead = {
  id: string;
  fullName: string;
  maskedName: string;
  phoneMasked: string;
  email: string | null;
  source: string;
  channel: string | null;
  city: string | null;
  budgetRange: string | null;
  interestType: string | null;
  status: LeadStatus;
  assignedBrokerId: string | null;
  assignedBrokerName: string | null;
  assignedAt: string | null;
  notes: string | null;
  campaign: string | null;
  utmSource: string | null;
  createdAt: string;
};

type BrokerOption = { id: string; label: string };

const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: "Novo",
  IN_CONTACT: "Em contato",
  QUALIFIED: "Qualificado",
  VISIT_SCHEDULED: "Visita agendada",
  PROPOSAL: "Proposta",
  WON: "Ganho",
  LOST: "Perdido"
};

const STATUS_CLASS: Record<LeadStatus, string> = {
  NEW: "status-new",
  IN_CONTACT: "status-pending",
  QUALIFIED: "status-gold",
  VISIT_SCHEDULED: "status-gold",
  PROPOSAL: "status-gold",
  WON: "status-approved",
  LOST: "status-denied"
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function LeadsList({
  leads,
  brokers
}: {
  leads: Lead[];
  brokers: BrokerOption[];
}) {
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL" | "UNASSIGNED">("ALL");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter === "UNASSIGNED" && l.assignedBrokerId) return false;
      if (
        statusFilter !== "ALL" &&
        statusFilter !== "UNASSIGNED" &&
        l.status !== statusFilter
      )
        return false;
      if (q) {
        const hay =
          `${l.fullName} ${l.maskedName} ${l.phoneMasked} ${l.email ?? ""} ${l.source}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, search]);

  const current = leads.find((l) => l.id === openId) ?? null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="ALL">Todos os status</option>
          <option value="UNASSIGNED">Sem corretor</option>
          <option value="NEW">Novo</option>
          <option value="IN_CONTACT">Em contato</option>
          <option value="QUALIFIED">Qualificado</option>
          <option value="VISIT_SCHEDULED">Visita agendada</option>
          <option value="PROPOSAL">Proposta</option>
          <option value="WON">Ganho</option>
          <option value="LOST">Perdido</option>
        </select>
        <input
          className="field-input py-2 text-sm"
          style={{ width: 260 }}
          placeholder="Buscar por nome, e-mail, telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            {leads.length === 0
              ? "Nenhum lead recebido ainda. Webhook em /api/webhooks/leads alimenta esta fila."
              : "Nenhum lead corresponde aos filtros."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">Lead</th>
                <th className="text-left p-4">Telefone</th>
                <th className="text-left p-4">Origem</th>
                <th className="text-left p-4">Corretor</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Entrada</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr
                  key={l.id}
                  className="border-t hairline hover:bg-app-subtle/40 cursor-pointer"
                  onClick={() => setOpenId(l.id)}
                >
                  <td className="p-4">
                    <p className="font-medium">{l.fullName}</p>
                    {l.email && <p className="text-xs text-sand-100/70">{l.email}</p>}
                  </td>
                  <td className="p-4 text-xs text-sand-100/75">🔒 {l.phoneMasked}</td>
                  <td className="p-4">
                    <span className="text-sand-100/80">{l.source}</span>
                    {l.channel && (
                      <span className="text-xs text-sand-100/55"> · {l.channel}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {l.assignedBrokerName ?? (
                      <span className="text-sand-100/45 italic">não atribuído</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[l.status]}`}>
                      {STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className="p-4 text-sand-100/70 text-xs">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {current && (
        <LeadDrawer lead={current} brokers={brokers} onClose={() => setOpenId(null)} />
      )}
    </>
  );
}

function LeadDrawer({
  lead,
  brokers,
  onClose
}: {
  lead: Lead;
  brokers: BrokerOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [reassignTo, setReassignTo] = useState<string>(lead.assignedBrokerId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function reveal() {
    setError(null);
    setRevealing(true);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/reveal-phone`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao revelar telefone.");
      setRevealedPhone(data.phone);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setRevealing(false);
    }
  }

  async function applyAssignment(target: string | null, action: "assign" | "unassign") {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}/assign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brokerId: target })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao atualizar atribuição.");
      }
      setSuccess(action === "unassign" ? "Lead devolvido ao pool." : "Lead reatribuído.");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    }
  }

  const canAssign = reassignTo && reassignTo !== lead.assignedBrokerId;

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto h-full w-full md:w-[620px] lg:w-[720px] bg-app-elevated border-l hairline flex flex-col overflow-hidden">
        <header className="px-6 py-5 border-b hairline flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
              Lead
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.024em]">{lead.fullName}</h2>
            <p className="text-sm text-sand-100/65 mt-1">
              {lead.source}
              {lead.channel && ` · ${lead.channel}`} · entrou em {fmtDate(lead.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 inline-flex items-center justify-center text-sand-100/60 hover:text-sand-50 hover:bg-white/5 rounded-[4px]"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
              Telefone
            </p>
            {revealedPhone ? (
              <p className="text-sm">
                <span className="font-mono text-gold-300">{revealedPhone}</span>{" "}
                <span className="text-xs text-sand-100/55">· revelação auditada</span>
              </p>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <span className="font-mono text-sand-100/75">🔒 {lead.phoneMasked}</span>
                <button
                  className="text-xs uppercase tracking-[0.12em] font-semibold text-gold-300 hover:text-gold-200"
                  onClick={reveal}
                  disabled={revealing}
                >
                  {revealing ? "Revelando..." : "Revelar telefone real →"}
                </button>
              </div>
            )}
          </div>

          <section className="grid grid-cols-2 gap-4 text-sm">
            <Field label="E-mail" value={lead.email ?? "—"} />
            <Field label="Cidade" value={lead.city ?? "—"} />
            <Field label="Interesse" value={lead.interestType ?? "—"} />
            <Field label="Faixa de orçamento" value={lead.budgetRange ?? "—"} />
            <Field label="Campanha" value={lead.campaign ?? "—"} />
            <Field label="UTM source" value={lead.utmSource ?? "—"} />
            <Field
              label="Atribuído a"
              value={lead.assignedBrokerName ?? "—"}
            />
            <Field
              label="Atribuído em"
              value={lead.assignedAt ? fmtDate(lead.assignedAt) : "—"}
            />
          </section>

          {lead.notes && (
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
                Notas
              </p>
              <p className="text-sm text-sand-100/85 leading-relaxed whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}

          <div className="divider-gold my-2" />

          <div>
            <label className="field-label">Atribuir ou reatribuir a corretor</label>
            <div className="flex gap-2">
              <select
                className="field-input flex-1"
                value={reassignTo}
                onChange={(e) => setReassignTo(e.target.value)}
                disabled={pending}
              >
                <option value="">— selecionar corretor —</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
              <button
                className="btn-base btn-gold"
                style={{ padding: ".55rem 1rem" }}
                onClick={() => applyAssignment(reassignTo, "assign")}
                disabled={!canAssign || pending}
              >
                Atribuir
              </button>
            </div>
            {lead.assignedBrokerId && (
              <button
                className="mt-2 text-[0.72rem] uppercase tracking-[0.12em] font-semibold text-red-300 hover:text-red-200"
                onClick={() => applyAssignment(null, "unassign")}
                disabled={pending}
              >
                Devolver ao pool (remover atribuição)
              </button>
            )}
          </div>

          {error && (
            <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-[2px] border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {success}
            </div>
          )}
        </div>

        <footer className="px-6 py-4 border-t hairline flex gap-2 justify-end">
          <button
            className="btn-base btn-outline"
            style={{ padding: ".65rem 1.1rem" }}
            onClick={onClose}
            disabled={pending}
          >
            Fechar
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
        {label}
      </p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
