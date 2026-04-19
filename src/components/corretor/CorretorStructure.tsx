"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  STRUCTURE_STATUS_LABEL,
  STRUCTURE_TYPE_LABEL,
  URGENCY_LABEL,
  type StructureRequestRow
} from "@/lib/structure-requests";

type Type = StructureRequestRow["type"];

const TYPE_ICONS: Record<Type, string> = {
  PLANE: "✈️",
  VEHICLE: "🚗",
  APARTMENT: "🏢",
  ACCOMPANIED_VISIT: "👥"
};

const TYPE_HINTS: Record<Type, string> = {
  PLANE: "Traslado aéreo para visitas estratégicas",
  VEHICLE: "Motorista ou carro para receber o cliente",
  APARTMENT: "Apoio e hospedagem durante atendimentos",
  ACCOMPANIED_VISIT: "Visita com assessor comercial Calebe"
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

export function CorretorStructure({ requests }: { requests: StructureRequestRow[] }) {
  const [openType, setOpenType] = useState<Type | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {(Object.keys(TYPE_ICONS) as Type[]).map((t) => (
          <button
            key={t}
            onClick={() => setOpenType(t)}
            className="card p-5 text-left hover:border-gold-400/50 transition-colors"
          >
            <div className="text-3xl mb-3">{TYPE_ICONS[t]}</div>
            <p className="font-bold text-lg">{STRUCTURE_TYPE_LABEL[t]}</p>
            <p className="text-xs text-sand-100/60 mt-1">{TYPE_HINTS[t]}</p>
            <p className="text-[0.7rem] uppercase tracking-[0.12em] font-semibold text-gold-300 mt-3">
              Solicitar →
            </p>
          </button>
        ))}
      </div>

      <p className="text-[0.72rem] uppercase tracking-[0.14em] font-medium text-gold-400/80 mb-3">
        Suas solicitações
      </p>
      <div className="card overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            Nenhuma solicitação ainda. Clique em um tipo acima para começar.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">Tipo</th>
                <th className="text-left p-4">Quando</th>
                <th className="text-left p-4">Cidade</th>
                <th className="text-left p-4">Urgência</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Resposta</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t hairline">
                  <td className="p-4">
                    {TYPE_ICONS[r.type]} {STRUCTURE_TYPE_LABEL[r.type]}
                  </td>
                  <td className="p-4">
                    {fmtDate(r.requestedDate)}
                    {r.requestedTime && ` · ${r.requestedTime}`}
                  </td>
                  <td className="p-4 text-sand-100/75">{r.city}</td>
                  <td className="p-4 text-sand-100/75">{URGENCY_LABEL[r.urgency]}</td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[r.status]}`}>
                      {STRUCTURE_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-sand-100/75 max-w-xs truncate">
                    {r.adminResponse ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {openType && <NewRequestModal type={openType} onClose={() => setOpenType(null)} />}
    </>
  );
}

function NewRequestModal({ type, onClose }: { type: Type; onClose: () => void }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    requestedDate: "",
    requestedTime: "",
    city: "Itapema",
    justification: "",
    urgency: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    notes: ""
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/corretor/structure-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, ...form })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao enviar solicitação.");
      }
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-app-elevated border hairline rounded-[6px] p-6 md:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-10 w-10 inline-flex items-center justify-center text-sand-100/60 hover:text-sand-50 hover:bg-white/5 rounded-[4px]"
          aria-label="Fechar"
        >
          ✕
        </button>
        <div className="mb-6">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-1">
            Diferencial Calebe
          </p>
          <h2 className="text-2xl font-bold tracking-[-0.024em]">
            {TYPE_ICONS[type]} Solicitar {STRUCTURE_TYPE_LABEL[type]}
          </h2>
          <p className="text-sm text-sand-100/65 mt-1">{TYPE_HINTS[type]}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Data *</label>
              <input
                className="field-input"
                type="date"
                required
                value={form.requestedDate}
                onChange={(e) => setForm({ ...form, requestedDate: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Horário</label>
              <input
                className="field-input"
                type="time"
                value={form.requestedTime}
                onChange={(e) => setForm({ ...form, requestedTime: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">Cidade / trecho *</label>
              <input
                className="field-input"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Urgência</label>
              <select
                className="field-input"
                value={form.urgency}
                onChange={(e) =>
                  setForm({
                    ...form,
                    urgency: e.target.value as "LOW" | "MEDIUM" | "HIGH"
                  })
                }
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>
          <div className="card p-4 bg-gold-400/5 border-gold-400/20">
            <label className="field-label text-gold-300 mb-2">
              📝 Justificativa — explique a negociação e o valor *
            </label>
            <p className="text-[0.72rem] text-sand-100/60 mb-3 leading-relaxed">
              Por que essa estrutura é necessária? Qual o valor da oportunidade? Qual o risco de
              não usar o recurso? O analista vai ler e decidir com base nisso.
            </p>
            <textarea
              className="field-input"
              rows={5}
              required
              value={form.justification}
              onChange={(e) => setForm({ ...form, justification: e.target.value })}
              placeholder="Ex: Cliente vindo de SP, proposta de R$ 4.9M. Sem avião perco janela. Comissão R$ 173K vs custo R$ 8K."
            />
          </div>
          <div>
            <label className="field-label">Observações (opcional)</label>
            <textarea
              className="field-input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {error && (
            <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              className="btn-base btn-outline"
              style={{ padding: ".65rem 1.1rem" }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-base btn-gold"
              style={{ padding: ".65rem 1.25rem" }}
              disabled={submitting}
            >
              {submitting ? "Enviando..." : "Enviar solicitação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
