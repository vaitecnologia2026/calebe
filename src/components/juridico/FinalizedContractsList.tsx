"use client";

import { useState } from "react";

type FinalizedCase = {
  id: string;
  saleId: string;
  propertyCode: string;
  propertyTitle: string;
  brokerName: string;
  saleValue: number;
  saleStatus: string;
  completedAt: string | null;
  legalNotes: string | null;
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function FinalizedContractsList({ cases }: { cases: FinalizedCase[] }) {
  const [tab, setTab] = useState<"APPROVED" | "DENIED">("APPROVED");
  const approved = cases.filter((c) => c.saleStatus === "COMPLETED");
  const denied = cases.filter((c) => c.saleStatus === "CANCELLED");
  const active = tab === "APPROVED" ? approved : denied;

  return (
    <>
      <div className="flex gap-1 p-1 bg-app-subtle rounded-[4px] border hairline w-fit mb-4">
        <button
          onClick={() => setTab("APPROVED")}
          className={`px-4 py-2 text-[0.72rem] uppercase tracking-[0.1em] font-semibold rounded-[2px] transition-colors ${
            tab === "APPROVED"
              ? "bg-gold-400/15 text-gold-300"
              : "text-sand-100/60 hover:text-sand-50"
          }`}
        >
          ✓ Aprovados{" "}
          <span className="ml-1 text-[0.62rem] px-1.5 py-0.5 rounded-full bg-app-subtle/60">
            {approved.length}
          </span>
        </button>
        <button
          onClick={() => setTab("DENIED")}
          className={`px-4 py-2 text-[0.72rem] uppercase tracking-[0.1em] font-semibold rounded-[2px] transition-colors ${
            tab === "DENIED"
              ? "bg-red-400/15 text-red-300"
              : "text-sand-100/60 hover:text-sand-50"
          }`}
        >
          ✕ Negados{" "}
          <span className="ml-1 text-[0.62rem] px-1.5 py-0.5 rounded-full bg-app-subtle/60">
            {denied.length}
          </span>
        </button>
      </div>

      <div className="card overflow-hidden">
        {active.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            Nenhum contrato nesta categoria ainda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Imóvel</th>
                <th className="text-left p-3">Valor</th>
                <th className="text-left p-3">Corretor</th>
                <th className="text-left p-3">Finalizado em</th>
                <th className="text-left p-3">Observação</th>
              </tr>
            </thead>
            <tbody>
              {active.map((c) => (
                <tr key={c.id} className="border-t hairline hover:bg-app-subtle/40">
                  <td className="p-3 font-mono text-xs text-gold-400">{c.saleId.slice(0, 8)}</td>
                  <td className="p-3">
                    {c.propertyCode} · {c.propertyTitle}
                  </td>
                  <td className="p-3 text-gold-400 font-semibold">{fmtBRL(c.saleValue)}</td>
                  <td className="p-3 text-sand-100/75">{c.brokerName}</td>
                  <td className="p-3 text-sand-100/60 text-xs">{fmtDate(c.completedAt)}</td>
                  <td className="p-3 text-xs text-sand-100/70">{c.legalNotes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
