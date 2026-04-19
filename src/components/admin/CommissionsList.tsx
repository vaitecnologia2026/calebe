"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CommissionStatus } from "@prisma/client";

type Commission = {
  id: string;
  saleId: string;
  propertyCode: string;
  propertyTitle: string;
  brokerId: string;
  brokerName: string;
  grossValue: number;
  netValue: number;
  status: CommissionStatus;
  dueDate: string | null;
  paidAt: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdAt: string;
};

type Broker = { id: string; name: string };

const STATUS_LABEL: Record<CommissionStatus, string> = {
  PENDING: "Pendente",
  REVIEWING: "Em conferência",
  APPROVED: "Aprovada p/ pagar",
  PAID: "Paga",
  BLOCKED: "Bloqueada"
};

const STATUS_CLASS: Record<CommissionStatus, string> = {
  PENDING: "status-pending",
  REVIEWING: "status-pending",
  APPROVED: "status-gold",
  PAID: "status-approved",
  BLOCKED: "status-denied"
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function CommissionsList({
  commissions,
  brokers
}: {
  commissions: Commission[];
  brokers: Broker[];
}) {
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | "ALL">("ALL");
  const [brokerFilter, setBrokerFilter] = useState("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      commissions.filter((c) => {
        if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
        if (brokerFilter !== "ALL" && c.brokerId !== brokerFilter) return false;
        return true;
      }),
    [commissions, statusFilter, brokerFilter]
  );

  function exportCsv() {
    const header = [
      "id",
      "saleId",
      "brokerName",
      "propertyCode",
      "grossValue",
      "netValue",
      "status",
      "dueDate",
      "paidAt"
    ].join(",");
    const rows = filtered.map((c) =>
      [
        c.id,
        c.saleId,
        `"${c.brokerName.replace(/"/g, '""')}"`,
        c.propertyCode,
        c.grossValue.toFixed(2),
        c.netValue.toFixed(2),
        c.status,
        c.dueDate ?? "",
        c.paidAt ?? ""
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comissoes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const current = commissions.find((c) => c.id === openId) ?? null;

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
          <option value="PENDING">Pendente</option>
          <option value="REVIEWING">Em conferência</option>
          <option value="APPROVED">Aprovada p/ pagar</option>
          <option value="PAID">Paga</option>
          <option value="BLOCKED">Bloqueada</option>
        </select>
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={brokerFilter}
          onChange={(e) => setBrokerFilter(e.target.value)}
        >
          <option value="ALL">Todos corretores</option>
          {brokers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          className="btn-base btn-outline"
          style={{ padding: ".55rem 1rem" }}
          onClick={exportCsv}
        >
          ⬇ Exportar CSV
        </button>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            {commissions.length === 0
              ? "Nenhuma comissão ainda. Comissões são criadas automaticamente quando o jurídico finaliza uma venda como aprovada."
              : "Nenhuma comissão corresponde aos filtros."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">#</th>
                <th className="text-left p-4">Corretor</th>
                <th className="text-left p-4">Venda</th>
                <th className="text-left p-4">Bruto</th>
                <th className="text-left p-4">Líquido</th>
                <th className="text-left p-4">Vencimento</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-t hairline hover:bg-app-subtle/40 cursor-pointer"
                  onClick={() => setOpenId(c.id)}
                >
                  <td className="p-4 text-xs font-mono text-gold-400">{c.id.slice(0, 8)}</td>
                  <td className="p-4">{c.brokerName}</td>
                  <td className="p-4 text-xs">
                    {c.saleId.slice(0, 8)}
                    <p className="text-sand-100/60">{c.propertyCode}</p>
                  </td>
                  <td className="p-4">{fmtBRL(c.grossValue)}</td>
                  <td className="p-4 font-semibold text-gold-400">{fmtBRL(c.netValue)}</td>
                  <td className="p-4 text-sand-100/70 text-xs">{fmtDate(c.dueDate)}</td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {current && <CommissionDrawer commission={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

function CommissionDrawer({
  commission: c,
  onClose
}: {
  commission: Commission;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(c.notes ?? "");
  const [receiptUrl, setReceiptUrl] = useState(c.receiptUrl ?? "");
  const [dueDate, setDueDate] = useState(c.dueDate ? c.dueDate.slice(0, 10) : "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function transition(newStatus: CommissionStatus) {
    const confirmMsg = {
      REVIEWING: "Mover para conferência?",
      APPROVED: "Aprovar para pagamento?",
      PAID: "Confirmar pagamento? (irreversível)",
      BLOCKED: "Bloquear esta comissão?",
      PENDING: "Voltar para pendente?"
    }[newStatus];
    if (!confirm(confirmMsg)) return;

    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/commissions/${c.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || null,
          receiptUrl: receiptUrl || null,
          dueDate: dueDate || null
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao atualizar.");
      }
      setSuccess(`Status atualizado para ${STATUS_LABEL[newStatus]}.`);
      startTransition(() => router.refresh());
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
              Comissão
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.024em] font-mono">
              {c.id.slice(0, 8)}
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
            <Field
              label="Status"
              value={STATUS_LABEL[c.status]}
              pill={STATUS_CLASS[c.status]}
            />
            <Field label="Valor bruto" value={fmtBRL(c.grossValue)} />
            <Field label="Valor líquido" value={fmtBRL(c.netValue)} gold />
            <Field label="Venda" value={c.saleId.slice(0, 8)} />
            <Field label="Paga em" value={fmtDate(c.paidAt)} />
          </section>

          <div className="divider-gold my-2" />

          <div>
            <label className="field-label">Vencimento</label>
            <input
              type="date"
              className="field-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="field-label">URL do comprovante / nota</label>
            <input
              className="field-input"
              placeholder="https://..."
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              disabled={pending}
            />
          </div>
          <div>
            <label className="field-label">Observações internas</label>
            <textarea
              className="field-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={pending}
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

        <footer className="px-6 py-4 border-t hairline flex flex-wrap gap-2 justify-end">
          {c.status === "PENDING" && (
            <>
              <button
                className="btn-base btn-outline"
                style={{ padding: ".55rem 1rem" }}
                onClick={() => transition("REVIEWING")}
                disabled={pending}
              >
                → Conferência
              </button>
              <button
                className="btn-base btn-gold"
                style={{ padding: ".55rem 1rem" }}
                onClick={() => transition("APPROVED")}
                disabled={pending}
              >
                Aprovar p/ pagar
              </button>
            </>
          )}
          {c.status === "REVIEWING" && (
            <button
              className="btn-base btn-gold"
              style={{ padding: ".55rem 1rem" }}
              onClick={() => transition("APPROVED")}
              disabled={pending}
            >
              Aprovar p/ pagar
            </button>
          )}
          {c.status === "APPROVED" && (
            <button
              className="btn-base btn-gold"
              style={{ padding: ".55rem 1rem" }}
              onClick={() => transition("PAID")}
              disabled={pending}
            >
              💰 Confirmar pagamento
            </button>
          )}
          {c.status !== "PAID" && c.status !== "BLOCKED" && (
            <button
              className="btn-base btn-outline"
              style={{
                padding: ".55rem 1rem",
                borderColor: "rgba(184,50,50,.4)",
                color: "#E88888"
              }}
              onClick={() => transition("BLOCKED")}
              disabled={pending}
            >
              Bloquear
            </button>
          )}
          {c.status === "BLOCKED" && (
            <button
              className="btn-base btn-outline"
              style={{ padding: ".55rem 1rem" }}
              onClick={() => transition("PENDING")}
              disabled={pending}
            >
              Desbloquear
            </button>
          )}
          <button
            className="btn-base btn-outline"
            style={{ padding: ".55rem 1rem" }}
            onClick={onClose}
          >
            Fechar
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  gold,
  pill
}: {
  label: string;
  value: string;
  gold?: boolean;
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
        <p className={`mt-1 ${gold ? "text-gold-400 font-semibold text-lg" : ""}`}>{value}</p>
      )}
    </div>
  );
}
