"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BrokerCategory } from "@prisma/client";

type Rule = {
  category: BrokerCategory;
  leadsPerDay: number;
  isActive: boolean;
};

const CATEGORIES: BrokerCategory[] = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];
const LABEL: Record<BrokerCategory, string> = {
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  DIAMOND: "Diamante"
};

export function DistributionRules({ initialRules }: { initialRules: Rule[] }) {
  const router = useRouter();
  const [rules, setRules] = useState<Record<BrokerCategory, number>>(() => {
    const map = {} as Record<BrokerCategory, number>;
    for (const c of CATEGORIES) {
      const existing = initialRules.find((r) => r.category === c);
      map[c] = existing?.leadsPerDay ?? (c === "BRONZE" ? 1 : c === "SILVER" ? 2 : c === "GOLD" ? 3 : 5);
    }
    return map;
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/config/distribution-rules", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rules: CATEGORIES.map((c) => ({ category: c, leadsPerDay: rules[c] }))
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao salvar.");
      }
      setMessage("Regras atualizadas. Aplicam na próxima janela de distribuição.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5">
      <p className="text-[0.72rem] uppercase tracking-[0.14em] font-medium text-gold-400/80 mb-4 inline-flex items-center gap-2">
        📋 Regras de distribuição diária
      </p>
      <div className="space-y-3 text-sm">
        {CATEGORIES.map((c) => (
          <div key={c} className="flex justify-between items-center gap-3">
            <span>{LABEL[c]}</span>
            <input
              className="field-input w-24 text-center"
              type="number"
              min={0}
              max={50}
              value={rules[c]}
              onChange={(e) =>
                setRules((prev) => ({ ...prev, [c]: Math.max(0, Number(e.target.value) || 0) }))
              }
              disabled={saving}
            />
          </div>
        ))}
      </div>
      <p className="text-[0.7rem] text-sand-100/55 mt-3">
        Quantidade máxima de leads recebidos por dia por corretor, conforme categoria.
      </p>
      <button
        className="btn-base btn-gold w-full mt-4"
        style={{ padding: ".55rem 1rem" }}
        onClick={save}
        disabled={saving}
      >
        {saving ? "Salvando..." : "Salvar regras"}
      </button>
      {message && (
        <div className="rounded-[2px] border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200 mt-3">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 mt-3">
          {error}
        </div>
      )}
    </div>
  );
}
