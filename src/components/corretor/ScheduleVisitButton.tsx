"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; label: string };

export function ScheduleVisitButton({
  leads,
  properties
}: {
  leads: Option[];
  properties: Option[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-base btn-gold"
        style={{ padding: ".55rem 1.25rem" }}
      >
        + Agendar visita
      </button>
      {open && (
        <ScheduleVisitModal
          leads={leads}
          properties={properties}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function ScheduleVisitModal({
  leads,
  properties,
  onClose
}: {
  leads: Option[];
  properties: Option[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    leadId: leads[0]?.id ?? "",
    propertyId: properties[0]?.id ?? "",
    scheduledAt: "",
    notes: ""
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/corretor/visits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao agendar.");
      }
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  const noLeads = leads.length === 0;
  const noProperties = properties.length === 0;

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
            Nova visita
          </p>
          <h2 className="text-2xl font-bold tracking-[-0.024em]">Agendar visita</h2>
        </div>

        {noLeads || noProperties ? (
          <div className="rounded-[2px] border border-gold-400/30 bg-gold-400/5 px-4 py-3 text-sm text-sand-100/80 mb-4">
            {noLeads
              ? "Você ainda não tem leads atribuídos. Peça ao admin para distribuir leads ou aguarde o webhook."
              : "Nenhum imóvel disponível no catálogo."}
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="field-label">Lead *</label>
            <select
              className="field-input"
              required
              value={form.leadId}
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              disabled={submitting || noLeads}
            >
              <option value="">— selecionar —</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Imóvel *</label>
            <select
              className="field-input"
              required
              value={form.propertyId}
              onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              disabled={submitting || noProperties}
            >
              <option value="">— selecionar —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Data e horário *</label>
            <input
              type="datetime-local"
              className="field-input"
              required
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div>
            <label className="field-label">Observações</label>
            <textarea
              className="field-input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              disabled={submitting}
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
              disabled={submitting || noLeads || noProperties}
            >
              {submitting ? "Agendando..." : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
