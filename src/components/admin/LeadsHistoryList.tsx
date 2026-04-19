"use client";

import { useMemo, useState } from "react";

type HistLead = {
  id: string;
  fullName: string;
  phoneMasked: string;
  email: string | null;
  source: string;
  channel: string | null;
  city: string | null;
  status: "WON" | "LOST" | string;
  brokerId: string | null;
  brokerName: string | null;
  createdAt: string;
  closedAt: string;
  notes: string | null;
};

type Broker = { id: string; name: string };

function fmt(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function daysBetween(a: string, b: string): number {
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}

export function LeadsHistoryList({
  leads,
  brokers
}: {
  leads: HistLead[];
  brokers: Broker[];
}) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WON" | "LOST">("ALL");
  const [brokerFilter, setBrokerFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
      if (brokerFilter !== "ALL" && l.brokerId !== brokerFilter) return false;
      if (q) {
        const hay = `${l.fullName} ${l.email ?? ""} ${l.source} ${l.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, statusFilter, brokerFilter, search]);

  function exportCsv() {
    const header = [
      "id",
      "fullName",
      "phoneMasked",
      "source",
      "city",
      "status",
      "brokerName",
      "createdAt",
      "closedAt",
      "ciclo_dias"
    ].join(",");
    const rows = filtered.map((l) =>
      [
        l.id,
        `"${l.fullName.replace(/"/g, '""')}"`,
        l.phoneMasked,
        `"${l.source.replace(/"/g, '""')}"`,
        `"${(l.city ?? "").replace(/"/g, '""')}"`,
        l.status,
        `"${(l.brokerName ?? "").replace(/"/g, '""')}"`,
        l.createdAt,
        l.closedAt,
        daysBetween(l.createdAt, l.closedAt)
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-historico-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="ALL">Todos</option>
          <option value="WON">Ganhos</option>
          <option value="LOST">Perdidos</option>
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
        <input
          className="field-input py-2 text-sm"
          style={{ width: 260 }}
          placeholder="Buscar por nome, e-mail, cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
            {leads.length === 0
              ? "Nenhum lead fechado ainda. Leads ganhos/perdidos aparecem aqui."
              : "Nenhum lead corresponde aos filtros."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Origem</th>
                <th className="text-left p-4">Cidade</th>
                <th className="text-left p-4">Corretor</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Ciclo</th>
                <th className="text-left p-4">Fechado em</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t hairline hover:bg-app-subtle/40">
                  <td className="p-4">
                    <p className="font-medium">{l.fullName}</p>
                    <p className="text-xs text-sand-100/60">🔒 {l.phoneMasked}</p>
                  </td>
                  <td className="p-4 text-sand-100/85">
                    {l.source}
                    {l.channel && (
                      <span className="text-xs text-sand-100/55"> · {l.channel}</span>
                    )}
                  </td>
                  <td className="p-4 text-sand-100/85">{l.city ?? "—"}</td>
                  <td className="p-4">
                    {l.brokerName ?? (
                      <span className="text-sand-100/45 italic">não atribuído</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`status ${
                        l.status === "WON" ? "status-approved" : "status-denied"
                      }`}
                    >
                      {l.status === "WON" ? "Ganho" : "Perdido"}
                    </span>
                  </td>
                  <td className="p-4 text-sand-100/70 text-xs">
                    {daysBetween(l.createdAt, l.closedAt)}d
                  </td>
                  <td className="p-4 text-sand-100/70 text-xs">{fmt(l.closedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
