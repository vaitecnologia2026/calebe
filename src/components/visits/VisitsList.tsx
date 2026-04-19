"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  VISIT_STATUS_CLASS,
  VISIT_STATUS_LABEL,
  type VisitRow
} from "@/lib/visits";

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function VisitsList({
  visits,
  canAct,
  scope
}: {
  visits: VisitRow[];
  canAct: boolean;
  scope: "admin" | "secretary" | "corretor";
}) {
  const [statusFilter, setStatusFilter] = useState<VisitRow["status"] | "ALL" | "UPCOMING">(
    "UPCOMING"
  );
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const now = Date.now();
    return visits.filter((v) => {
      if (statusFilter === "UPCOMING") {
        return (
          new Date(v.scheduledAt).getTime() >= now - 3600_000 &&
          (v.status === "SCHEDULED" || v.status === "CONFIRMED")
        );
      }
      if (statusFilter === "ALL") return true;
      return v.status === statusFilter;
    });
  }, [visits, statusFilter]);

  const current = visits.find((v) => v.id === openId) ?? null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="UPCOMING">Próximas</option>
          <option value="ALL">Todas</option>
          <option value="SCHEDULED">Agendada</option>
          <option value="CONFIRMED">Confirmada</option>
          <option value="REALIZED">Realizada</option>
          <option value="NO_SHOW">Não compareceu</option>
          <option value="RESCHEDULED">Reagendada</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">Nenhuma visita.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                {scope !== "corretor" && <th className="text-left p-4">Corretor</th>}
                <th className="text-left p-4">Lead</th>
                <th className="text-left p-4">Imóvel</th>
                <th className="text-left p-4">Quando</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className="border-t hairline hover:bg-app-subtle/40 cursor-pointer"
                  onClick={() => setOpenId(v.id)}
                >
                  {scope !== "corretor" && <td className="p-4">{v.brokerName}</td>}
                  <td className="p-4">
                    <p className="font-medium">{v.leadName}</p>
                    <p className="text-xs text-sand-100/70">🔒 {v.leadPhoneMasked}</p>
                  </td>
                  <td className="p-4 text-sand-100/85">
                    {v.propertyCode}
                    <p className="text-xs text-sand-100/60">{v.propertyTitle}</p>
                  </td>
                  <td className="p-4 text-sand-100/85">{fmtDateTime(v.scheduledAt)}</td>
                  <td className="p-4">
                    <span className={`status ${VISIT_STATUS_CLASS[v.status]}`}>
                      {VISIT_STATUS_LABEL[v.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {current && (
        <VisitDrawer
          visit={current}
          canAct={canAct}
          scope={scope}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

function VisitDrawer({
  visit: v,
  canAct,
  scope,
  onClose
}: {
  visit: VisitRow;
  canAct: boolean;
  scope: "admin" | "secretary" | "corretor";
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(v.notes ?? "");
  const [newScheduledAt, setNewScheduledAt] = useState(v.scheduledAt.slice(0, 16));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function transition(newStatus: VisitRow["status"]) {
    if (
      !confirm(
        {
          CONFIRMED: "Confirmar esta visita?",
          REALIZED: "Marcar como realizada? (impacta ranking do corretor)",
          NO_SHOW: "Marcar que o cliente não compareceu?",
          RESCHEDULED: "Reagendar esta visita?",
          SCHEDULED: "Voltar para agendada?"
        }[newStatus]
      )
    )
      return;

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/visits/${v.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes,
          scheduledAt: newScheduledAt
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao atualizar.");
      }
      setSuccess("Atualizado.");
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
      <aside className="relative ml-auto h-full w-full md:w-[560px] lg:w-[640px] bg-app-elevated border-l hairline flex flex-col overflow-hidden">
        <header className="px-6 py-5 border-b hairline flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
              Visita
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.024em]">{v.leadName}</h2>
            <p className="text-sm text-sand-100/65 mt-1">
              {v.propertyCode} · {v.propertyTitle}
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
            <Field label="Corretor" value={v.brokerName} />
            <Field
              label="Status"
              value={VISIT_STATUS_LABEL[v.status]}
              pill={VISIT_STATUS_CLASS[v.status]}
            />
            <Field label="Telefone" value={`🔒 ${v.leadPhoneMasked}`} />
            <Field
              label="Confirmada pelo admin"
              value={v.adminConfirmed ? "Sim" : "Não"}
            />
          </section>

          <div>
            <label className="field-label">Data e horário</label>
            <input
              type="datetime-local"
              className="field-input"
              value={newScheduledAt}
              onChange={(e) => setNewScheduledAt(e.target.value)}
              disabled={!canAct || pending}
            />
          </div>

          <div>
            <label className="field-label">Observações</label>
            <textarea
              className="field-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canAct || pending}
            />
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

        {canAct && (
          <footer className="px-6 py-4 border-t hairline flex flex-wrap gap-2 justify-end">
            {(v.status === "SCHEDULED" || v.status === "RESCHEDULED") && scope !== "corretor" && (
              <button
                className="btn-base btn-gold"
                style={{ padding: ".55rem 1rem" }}
                onClick={() => transition("CONFIRMED")}
                disabled={pending}
              >
                Confirmar
              </button>
            )}
            {(v.status === "CONFIRMED" || v.status === "SCHEDULED") && scope !== "corretor" && (
              <>
                <button
                  className="btn-base btn-outline"
                  style={{ padding: ".55rem 1rem" }}
                  onClick={() => transition("REALIZED")}
                  disabled={pending}
                >
                  Marcar realizada
                </button>
                <button
                  className="btn-base btn-outline"
                  style={{
                    padding: ".55rem 1rem",
                    borderColor: "rgba(184,50,50,.4)",
                    color: "#E88888"
                  }}
                  onClick={() => transition("NO_SHOW")}
                  disabled={pending}
                >
                  Não compareceu
                </button>
              </>
            )}
            {v.status !== "REALIZED" && v.status !== "NO_SHOW" && (
              <button
                className="btn-base btn-outline"
                style={{ padding: ".55rem 1rem" }}
                onClick={() => transition("RESCHEDULED")}
                disabled={pending}
              >
                Reagendar
              </button>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  pill
}: {
  label: string;
  value: string;
  pill?: string;
}) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
        {label}
      </p>
      {pill ? (
        <p className="mt-1">
          <span className={`status ${pill}`}>{value}</span>
        </p>
      ) : (
        <p className="mt-1">{value}</p>
      )}
    </div>
  );
}
