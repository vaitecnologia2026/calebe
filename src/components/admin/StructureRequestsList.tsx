"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  STRUCTURE_STATUS_LABEL,
  STRUCTURE_TYPE_LABEL,
  URGENCY_LABEL,
  type StructureRequestRow
} from "@/lib/structure-requests";

const TYPE_ICONS: Record<StructureRequestRow["type"], string> = {
  PLANE: "✈️",
  VEHICLE: "🚗",
  APARTMENT: "🏢",
  ACCOMPANIED_VISIT: "👥"
};

const STATUS_CLASS: Record<StructureRequestRow["status"], string> = {
  REQUESTED: "status-pending",
  REVIEWING: "status-pending",
  APPROVED: "status-approved",
  DENIED: "status-denied",
  RESCHEDULE: "status-gold",
  COMPLETED: "status-approved"
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function StructureRequestsList({ requests }: { requests: StructureRequestRow[] }) {
  const [filter, setFilter] = useState<StructureRequestRow["status"] | "ALL" | "OPEN">("OPEN");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filter === "OPEN") return ["REQUESTED", "REVIEWING", "RESCHEDULE"].includes(r.status);
      if (filter === "ALL") return true;
      return r.status === filter;
    });
  }, [requests, filter]);

  const current = requests.find((r) => r.id === openId) ?? null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="OPEN">Em aberto</option>
          <option value="ALL">Todas</option>
          <option value="REQUESTED">Solicitada</option>
          <option value="REVIEWING">Em análise</option>
          <option value="APPROVED">Aprovada</option>
          <option value="DENIED">Negada</option>
          <option value="RESCHEDULE">Reagendar</option>
          <option value="COMPLETED">Concluída</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            Nenhuma solicitação nesta visão.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">#</th>
                <th className="text-left p-4">Corretor</th>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Quando</th>
                <th className="text-left p-4">Cidade</th>
                <th className="text-left p-4">Urgência</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-t hairline hover:bg-app-subtle/40 cursor-pointer"
                  onClick={() => setOpenId(r.id)}
                >
                  <td className="p-4 text-xs font-mono text-gold-400">{r.id.slice(0, 8)}</td>
                  <td className="p-4 font-medium">{r.brokerName}</td>
                  <td className="p-4">
                    {TYPE_ICONS[r.type]} {STRUCTURE_TYPE_LABEL[r.type]}
                  </td>
                  <td className="p-4 text-sand-100/75">
                    {fmtDate(r.requestedDate)}
                    {r.requestedTime && ` · ${r.requestedTime}`}
                  </td>
                  <td className="p-4 text-sand-100/75">{r.city}</td>
                  <td className="p-4">
                    <span
                      className={`status ${
                        r.urgency === "HIGH"
                          ? "status-denied"
                          : r.urgency === "MEDIUM"
                            ? "status-pending"
                            : "status-new"
                      }`}
                    >
                      {URGENCY_LABEL[r.urgency]}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[r.status]}`}>
                      {STRUCTURE_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {current && <RequestDrawer request={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

function RequestDrawer({
  request: r,
  onClose
}: {
  request: StructureRequestRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [response, setResponse] = useState(r.adminResponse ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canAct = r.status !== "APPROVED" && r.status !== "DENIED" && r.status !== "COMPLETED";

  async function decide(outcome: "APPROVED" | "DENIED" | "RESCHEDULE" | "REVIEWING") {
    if (!canAct && outcome !== "REVIEWING") return;
    if ((outcome === "DENIED" || outcome === "RESCHEDULE") && !response.trim()) {
      setError("Preencha a resposta antes de " + (outcome === "DENIED" ? "negar" : "reagendar"));
      return;
    }
    if (
      !confirm(
        `${
          { APPROVED: "Aprovar", DENIED: "Negar", RESCHEDULE: "Pedir reagendamento", REVIEWING: "Mover para análise" }[
            outcome
          ]
        } esta solicitação?`
      )
    )
      return;

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/structure-requests/${r.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: outcome, adminResponse: response || null })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao atualizar.");
      }
      setSuccess("Atualizado.");
      startTransition(() => {
        router.refresh();
        if (outcome !== "REVIEWING") onClose();
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
              Solicitação
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.024em]">
              {TYPE_ICONS[r.type]} {STRUCTURE_TYPE_LABEL[r.type]}
            </h2>
            <p className="text-sm text-sand-100/65 mt-1">Por {r.brokerName}</p>
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
            <Field label="Data" value={fmtDate(r.requestedDate)} />
            <Field label="Horário" value={r.requestedTime ?? "—"} />
            <Field label="Cidade" value={r.city} />
            <Field label="Urgência" value={URGENCY_LABEL[r.urgency]} />
            <Field label="Status atual" value={STRUCTURE_STATUS_LABEL[r.status]} />
            <Field label="Solicitada em" value={fmtDateTime(r.createdAt)} />
          </section>

          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-gold-300 mb-2 inline-flex items-center gap-1.5">
              📝 Justificativa do corretor
            </p>
            <div className="card p-4 bg-gold-400/5 border-gold-400/20">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.justification}</p>
            </div>
          </div>

          {r.notes && (
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
                Observações
              </p>
              <p className="text-sm text-sand-100/85 leading-relaxed">{r.notes}</p>
            </div>
          )}

          <div className="divider-gold my-2" />

          <div>
            <label className="field-label">Resposta ao corretor</label>
            <textarea
              className="field-input"
              rows={3}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Condições, limites, instruções, motivo da negativa..."
              disabled={pending || !canAct}
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
            {r.status === "REQUESTED" && (
              <button
                className="btn-base btn-outline"
                style={{ padding: ".55rem 1rem" }}
                onClick={() => decide("REVIEWING")}
                disabled={pending}
              >
                Mover p/ análise
              </button>
            )}
            <button
              className="btn-base btn-outline"
              style={{ padding: ".55rem 1rem" }}
              onClick={() => decide("RESCHEDULE")}
              disabled={pending}
            >
              Pedir reagendamento
            </button>
            <button
              className="btn-base btn-outline"
              style={{
                padding: ".55rem 1rem",
                borderColor: "rgba(184,50,50,.4)",
                color: "#E88888"
              }}
              onClick={() => decide("DENIED")}
              disabled={pending}
            >
              Negar
            </button>
            <button
              className="btn-base btn-gold"
              style={{ padding: ".55rem 1.25rem" }}
              onClick={() => decide("APPROVED")}
              disabled={pending}
            >
              Aprovar
            </button>
          </footer>
        )}
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
