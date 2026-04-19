"use client";

import { useMemo, useState } from "react";
import type { SaleStatus, LegalStatus } from "@prisma/client";

type Sale = {
  id: string;
  propertyCode: string;
  propertyTitle: string;
  propertyCity: string;
  brokerId: string;
  brokerName: string;
  saleValue: number;
  negotiationType: string;
  status: SaleStatus;
  submittedAt: string | null;
  createdAt: string;
  notes: string | null;
  legalCaseId: string | null;
  legalStatus: LegalStatus | null;
  commissionStatus: string | null;
  commissionNet: number | null;
};

type Broker = { id: string; name: string };

const STATUS_LABEL: Record<SaleStatus, string> = {
  DRAFT: "Rascunho",
  SUBMITTED: "Enviada",
  IN_LEGAL: "Em jurídico",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada"
};

const STATUS_CLASS: Record<SaleStatus, string> = {
  DRAFT: "status-pending",
  SUBMITTED: "status-gold",
  IN_LEGAL: "status-gold",
  COMPLETED: "status-approved",
  CANCELLED: "status-denied"
};

const LEGAL_LABEL: Record<LegalStatus, string> = {
  RECEIVED: "Recebido",
  REVIEWING: "Em análise",
  DOCS_PENDING: "Doc. pendente",
  DRAFTING: "Elaboração",
  READY_TO_SIGN: "Assinatura",
  COMPLETED: "Concluído"
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso)
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
    .replace(",", " ·");
}

export function SalesList({ sales, brokers }: { sales: Sale[]; brokers: Broker[] }) {
  const [statusFilter, setStatusFilter] = useState<SaleStatus | "ALL">("ALL");
  const [brokerFilter, setBrokerFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (brokerFilter !== "ALL" && s.brokerId !== brokerFilter) return false;
      if (q) {
        const hay =
          `${s.propertyCode} ${s.propertyTitle} ${s.brokerName} ${s.propertyCity}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [sales, statusFilter, brokerFilter, search]);

  const current = sales.find((s) => s.id === openId) ?? null;

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
          <option value="DRAFT">Rascunho</option>
          <option value="SUBMITTED">Enviada</option>
          <option value="IN_LEGAL">Em jurídico</option>
          <option value="COMPLETED">Concluída</option>
          <option value="CANCELLED">Cancelada</option>
        </select>
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={brokerFilter}
          onChange={(e) => setBrokerFilter(e.target.value)}
        >
          <option value="ALL">Todos os corretores</option>
          {brokers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className="field-input py-2 text-sm"
          style={{ width: 260 }}
          placeholder="Buscar por imóvel, corretor, cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            {sales.length === 0
              ? "Nenhuma venda registrada ainda."
              : "Nenhuma venda corresponde aos filtros."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">#</th>
                <th className="text-left p-4">Imóvel</th>
                <th className="text-left p-4">Corretor</th>
                <th className="text-left p-4">Valor</th>
                <th className="text-left p-4">Criada</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Jurídico</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-t hairline hover:bg-app-subtle/40 cursor-pointer"
                  onClick={() => setOpenId(s.id)}
                >
                  <td className="p-4 text-xs font-mono text-gold-400">{s.id.slice(0, 8)}</td>
                  <td className="p-4">
                    <p className="font-medium">{s.propertyCode}</p>
                    <p className="text-xs text-sand-100/70">{s.propertyTitle}</p>
                  </td>
                  <td className="p-4 text-sand-100/85">{s.brokerName}</td>
                  <td className="p-4 font-semibold">{fmtBRL(s.saleValue)}</td>
                  <td className="p-4 text-sand-100/70 text-xs">{fmtDate(s.createdAt)}</td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[s.status]}`}>
                      {STATUS_LABEL[s.status]}
                    </span>
                  </td>
                  <td className="p-4 text-xs">
                    {s.legalStatus ? (
                      <span className="text-sand-100/75">{LEGAL_LABEL[s.legalStatus]}</span>
                    ) : (
                      <span className="text-sand-100/45">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {current && <SaleDrawer sale={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

function SaleDrawer({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const [revealing, setRevealing] = useState(false);
  const [clientData, setClientData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setError(null);
    setRevealing(true);
    try {
      const res = await fetch(`/api/admin/sales/${sale.id}/reveal-client`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao revelar.");
      setClientData(data.client);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setRevealing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto h-full w-full md:w-[620px] lg:w-[720px] bg-app-elevated border-l hairline flex flex-col overflow-hidden">
        <header className="px-6 py-5 border-b hairline flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
              Venda
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.024em] font-mono">
              {sale.id.slice(0, 8)}
            </h2>
            <p className="text-sm text-sand-100/65 mt-1">
              {sale.propertyCode} · {sale.propertyTitle}
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
            <Field label="Corretor" value={sale.brokerName} />
            <Field label="Cidade" value={sale.propertyCity} />
            <Field label="Valor da venda" value={fmtBRL(sale.saleValue)} gold />
            <Field label="Tipo de negociação" value={sale.negotiationType} />
            <Field
              label="Status"
              value={STATUS_LABEL[sale.status]}
              pill={STATUS_CLASS[sale.status]}
            />
            <Field
              label="Jurídico"
              value={sale.legalStatus ? LEGAL_LABEL[sale.legalStatus] : "—"}
            />
            <Field label="Criada em" value={fmtDate(sale.createdAt)} />
            <Field label="Enviada em" value={fmtDate(sale.submittedAt)} />
            {sale.commissionStatus && (
              <>
                <Field
                  label="Comissão"
                  value={sale.commissionStatus}
                  pill={
                    sale.commissionStatus === "PAID"
                      ? "status-approved"
                      : sale.commissionStatus === "APPROVED"
                        ? "status-gold"
                        : "status-pending"
                  }
                />
                <Field
                  label="Valor líquido"
                  value={sale.commissionNet != null ? fmtBRL(sale.commissionNet) : "—"}
                />
              </>
            )}
          </section>

          {sale.notes && (
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
                Observações
              </p>
              <p className="text-sm text-sand-100/85 leading-relaxed whitespace-pre-wrap">
                {sale.notes}
              </p>
            </div>
          )}

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
            <p className="text-[0.66rem] text-sand-100/55 mt-2">
              Cada revelação gera AuditEvent ADMIN_SALE_CLIENT_REVEALED.
            </p>
          </div>

          {error && (
            <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <footer className="px-6 py-4 border-t hairline flex gap-2 justify-end">
          <button
            className="btn-base btn-outline"
            style={{ padding: ".65rem 1.1rem" }}
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
