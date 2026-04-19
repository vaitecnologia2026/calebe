"use client";

import { Fragment, useMemo, useState } from "react";

type Row = {
  id: string;
  quando: string;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
    .replace(",", " ·");
}

export function AuditLogList({ rows, actions }: { rows: Row[]; actions: string[] }) {
  const [action, setAction] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (action !== "ALL" && r.action !== action) return false;
      if (!q) return true;
      const hay = `${r.actorLabel} ${r.action} ${r.entityType} ${r.entityId ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, action, search]);

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <input
          className="field-input py-2 text-sm"
          style={{ width: 280 }}
          placeholder="Buscar ação, entidade, usuário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={action}
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="ALL">Todas as ações</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            {rows.length === 0
              ? "Nenhum evento registrado ainda."
              : "Nenhum evento corresponde aos filtros."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">Quando</th>
                <th className="text-left p-4">Ator</th>
                <th className="text-left p-4">Ação</th>
                <th className="text-left p-4">Entidade</th>
                <th className="text-left p-4">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const open = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr
                      className="border-t hairline hover:bg-app-subtle/40 cursor-pointer"
                      onClick={() => setExpanded(open ? null : r.id)}
                    >
                      <td className="p-4 text-sand-100/70 text-xs">{fmtDateTime(r.quando)}</td>
                      <td className="p-4">{r.actorLabel}</td>
                      <td className="p-4">
                        <span className="text-xs text-gold-400">{r.action}</span>
                      </td>
                      <td className="p-4 text-xs">
                        {r.entityType}
                        {r.entityId && (
                          <span className="text-sand-100/60">:{r.entityId.slice(0, 8)}…</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-sand-100/70">{r.ipAddress ?? "—"}</td>
                    </tr>
                    {open && r.metadata && Object.keys(r.metadata).length > 0 && (
                      <tr className="border-t hairline bg-app-subtle/30">
                        <td colSpan={5} className="p-4">
                          <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-2">
                            Metadata
                          </p>
                          <pre className="text-xs bg-app-subtle/60 p-3 rounded-[2px] overflow-x-auto">
                            {JSON.stringify(r.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
