"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { LegalStatus, Role } from "@prisma/client";

export type LegalCaseCard = {
  id: string;
  saleId: string;
  status: LegalStatus;
  legalNotes: string | null;
  receivedAt: string;
  brokerName: string;
  propertyCode: string;
  propertyTitle: string;
  saleValue: number;
  negotiationType: string;
};

type Column = {
  key: LegalStatus[];
  label: string;
};

const COLUMNS: Column[] = [
  { key: ["RECEIVED"], label: "Recebido" },
  { key: ["REVIEWING", "DOCS_PENDING"], label: "Em análise" },
  { key: ["DRAFTING"], label: "Elaboração" },
  { key: ["READY_TO_SIGN"], label: "Assinatura" }
];

const STATUS_LABEL: Record<LegalStatus, string> = {
  RECEIVED: "Recebido",
  REVIEWING: "Em análise",
  DOCS_PENDING: "Doc. pendente",
  DRAFTING: "Em elaboração",
  READY_TO_SIGN: "Pronto p/ assinar",
  COMPLETED: "Concluído"
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDateTime(iso: string): string {
  return new Date(iso)
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
    .replace(",", " ·");
}

export function LegalKanban({ cases, role }: { cases: LegalCaseCard[]; role: Role }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const byColumn = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      items: cases.filter((c) => col.key.includes(c.status))
    }));
  }, [cases]);

  const current = cases.find((c) => c.id === openId) ?? null;

  return (
    <>
      <p className="text-xs text-sand-100/55 mb-3 flex items-center gap-1.5">
        💡 Clique em um card para abrir a ficha e mover entre colunas
      </p>

      <div className="grid md:grid-cols-4 gap-3 overflow-x-auto">
        {byColumn.map((col) => (
          <div key={col.label} className="card p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/70">
                {col.label}
              </p>
              <span className="text-xs font-bold text-sand-100/60">{col.items.length}</span>
            </div>
            <div className="min-h-[200px] space-y-2">
              {col.items.length === 0 ? (
                <div className="text-[0.7rem] text-sand-100/40 italic px-2 py-6 text-center">
                  — vazio —
                </div>
              ) : (
                col.items.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setOpenId(c.id)}
                    className="card p-3 text-left w-full hover:border-gold-400/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-gold-400">
                        {c.saleId.slice(0, 8)}
                      </span>
                      {c.status === "DOCS_PENDING" && (
                        <span className="text-[0.62rem] uppercase tracking-[0.12em] font-bold text-red-300">
                          Docs
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold mt-1 leading-tight">
                      {c.propertyCode} · {c.propertyTitle}
                    </p>
                    <p className="text-xs text-gold-400/90 mt-1">{fmtBRL(c.saleValue)}</p>
                    <p className="text-xs text-sand-100/60 mt-2">{c.brokerName}</p>
                    {c.legalNotes && (
                      <p className="text-xs text-sand-100/55 mt-2 italic leading-relaxed border-t hairline pt-2">
                        {c.legalNotes}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {current && (
        <LegalDrawer
          caseData={current}
          role={role}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

function LegalDrawer({
  caseData: c,
  role,
  onClose
}: {
  caseData: LegalCaseCard;
  role: Role;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newStatus, setNewStatus] = useState<LegalStatus>(c.status);
  const [notes, setNotes] = useState(c.legalNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [clientData, setClientData] = useState<Record<string, unknown> | null>(null);

  const canAct = role === "LEGAL" || role === "ADMIN";
  const changed = newStatus !== c.status || (notes ?? "") !== (c.legalNotes ?? "");

  async function reveal() {
    setError(null);
    setRevealing(true);
    try {
      const res = await fetch(`/api/legal/cases/${c.id}/reveal-client`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao revelar dados.");
      setClientData(data.client);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setRevealing(false);
    }
  }

  async function save() {
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/legal/cases/${c.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus, legalNotes: notes })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao salvar.");
      }
      setSuccess("Alterações salvas.");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    }
  }

  async function finalize(outcome: "approve" | "deny") {
    const label = outcome === "approve" ? "aprovar" : "negar";
    if (!confirm(`Confirmar ${label} o contrato ${c.saleId.slice(0, 8)}?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/legal/cases/${c.id}/finalize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcome, notes })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao finalizar.");
      }
      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto h-full w-full md:w-[620px] lg:w-[720px] bg-app-elevated border-l hairline flex flex-col overflow-hidden">
        <header className="px-6 py-5 border-b hairline flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
              Processo jurídico
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.024em] font-mono">
              {c.saleId.slice(0, 8)}
            </h2>
            <p className="text-sm text-sand-100/65 mt-1">
              {c.propertyCode} · {c.propertyTitle}
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
          <section className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Corretor" value={c.brokerName} />
            <Field label="Valor" value={fmtBRL(c.saleValue)} gold />
            <Field label="Tipo de negociação" value={c.negotiationType} />
            <Field label="Recebido em" value={fmtDateTime(c.receivedAt)} />
          </section>

          <div className="divider-gold my-2" />

          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-2">
              Dados do cliente (criptografados)
            </p>
            {clientData ? (
              <pre className="text-xs bg-app-subtle/60 p-4 rounded-[2px] overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(clientData, null, 2)}
              </pre>
            ) : (
              <button
                className="btn-base btn-outline"
                style={{ padding: ".55rem 1rem" }}
                onClick={reveal}
                disabled={revealing}
              >
                {revealing ? "Revelando..." : "🔒 Revelar dados do cliente"}
              </button>
            )}
          </div>

          <div className="divider-gold my-2" />

          {canAct && (
            <>
              <div>
                <label className="field-label">Status no kanban</label>
                <select
                  className="field-input"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as LegalStatus)}
                  disabled={pending}
                >
                  <option value="RECEIVED">Recebido</option>
                  <option value="REVIEWING">Em análise</option>
                  <option value="DOCS_PENDING">Documentação pendente</option>
                  <option value="DRAFTING">Em elaboração</option>
                  <option value="READY_TO_SIGN">Pronto para assinar</option>
                </select>
              </div>
              <div>
                <label className="field-label">Observações jurídicas</label>
                <textarea
                  className="field-input"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={pending}
                />
              </div>
            </>
          )}

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

        {canAct && (
          <footer className="px-6 py-4 border-t hairline flex gap-2 justify-end flex-wrap">
            <button
              className="btn-base btn-outline"
              style={{ padding: ".65rem 1rem" }}
              onClick={() => finalize("deny")}
              disabled={pending}
            >
              Negar contrato
            </button>
            <button
              className="btn-base btn-outline"
              style={{ padding: ".65rem 1rem" }}
              onClick={save}
              disabled={pending || !changed}
            >
              {pending ? "Salvando..." : "Salvar"}
            </button>
            <button
              className="btn-base btn-gold"
              style={{ padding: ".65rem 1.25rem" }}
              onClick={() => finalize("approve")}
              disabled={pending}
            >
              Finalizar aprovado
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}

function Field({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
        {label}
      </p>
      <p className={`mt-1 ${gold ? "text-gold-400 font-semibold text-lg" : ""}`}>{value}</p>
    </div>
  );
}

export { STATUS_LABEL as LEGAL_STATUS_LABEL };
