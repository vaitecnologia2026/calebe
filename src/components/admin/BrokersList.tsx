"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BrokerCategory, BrokerApprovalStatus, CreciStatus } from "@prisma/client";

type Broker = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  category: BrokerCategory;
  creci: string;
  creciState: string;
  creciStatus: CreciStatus;
  city: string;
  currentAgency: string | null;
  yearsMarket: number | null;
  instagram: string | null;
  approvalStatus: BrokerApprovalStatus;
  hasAcceptedTerm: boolean;
};

const CATEGORY_LABEL: Record<BrokerCategory, string> = {
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  DIAMOND: "Diamante"
};

const CATEGORY_CLASS: Record<BrokerCategory, string> = {
  BRONZE: "cat-bronze",
  SILVER: "cat-silver",
  GOLD: "cat-gold",
  DIAMOND: "cat-diamond"
};

const CATEGORY_LEADS: Record<BrokerCategory, number> = {
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  DIAMOND: 5
};

function relativeTime(iso: string | null): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d}d`;
  const m = Math.floor(d / 30);
  return `há ${m} mês${m === 1 ? "" : "es"}`;
}

export function BrokersList({ brokers }: { brokers: Broker[] }) {
  const [filter, setFilter] = useState<BrokerCategory | "ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brokers.filter((b) => {
      if (filter === "ACTIVE" && !b.isActive) return false;
      if (filter === "INACTIVE" && b.isActive) return false;
      if (
        filter !== "ALL" &&
        filter !== "ACTIVE" &&
        filter !== "INACTIVE" &&
        b.category !== filter
      ) {
        return false;
      }
      if (q && !`${b.name} ${b.email} ${b.creci} ${b.city}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [brokers, filter, search]);

  const current = brokers.find((b) => b.id === openId) ?? null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
        >
          <option value="ALL">Todos</option>
          <option value="ACTIVE">Ativos</option>
          <option value="INACTIVE">Inativos</option>
          <option value="BRONZE">Categoria: Bronze</option>
          <option value="SILVER">Categoria: Prata</option>
          <option value="GOLD">Categoria: Ouro</option>
          <option value="DIAMOND">Categoria: Diamante</option>
        </select>
        <input
          className="field-input py-2 text-sm"
          style={{ width: 260 }}
          placeholder="Buscar por nome, e-mail, CRECI, cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            {brokers.length === 0
              ? "Nenhum corretor cadastrado. Aprove candidatos na fila de Aprovação."
              : "Nenhum corretor corresponde aos filtros."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">Nome</th>
                <th className="text-left p-4">Categoria</th>
                <th className="text-left p-4">CRECI</th>
                <th className="text-left p-4">Cidade</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Último acesso</th>
                <th className="text-right p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className="border-t hairline hover:bg-app-subtle/40 cursor-pointer"
                  onClick={() => setOpenId(b.id)}
                >
                  <td className="p-4">
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-sand-100/70">{b.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`cat-badge ${CATEGORY_CLASS[b.category]}`}>
                      {CATEGORY_LABEL[b.category]}
                    </span>
                  </td>
                  <td className="p-4 text-sand-100/75">
                    {b.creci}/{b.creciState}
                  </td>
                  <td className="p-4 text-sand-100/75">{b.city}</td>
                  <td className="p-4">
                    {b.isActive ? (
                      <span className="status status-approved">Ativo</span>
                    ) : (
                      <span className="status status-denied">Inativo</span>
                    )}
                  </td>
                  <td className="p-4 text-sand-100/70 text-xs">{relativeTime(b.lastLoginAt)}</td>
                  <td className="p-4 text-right">
                    <button
                      className="text-gold-400 text-xs uppercase tracking-[0.14em] font-medium hover:text-gold-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenId(b.id);
                      }}
                    >
                      Abrir →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {current && <BrokerDrawer broker={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

function BrokerDrawer({ broker, onClose }: { broker: Broker; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState<BrokerCategory>(broker.category);
  const [isActive, setIsActive] = useState(broker.isActive);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const categoryChanged = category !== broker.category;
  const statusChanged = isActive !== broker.isActive;
  const anyChange = categoryChanged || statusChanged;

  async function save() {
    setError(null);
    setSuccess(null);
    try {
      if (categoryChanged) {
        const res = await fetch(`/api/admin/brokers/${broker.id}/category`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ category })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Falha ao atualizar categoria.");
        }
      }
      if (statusChanged) {
        const res = await fetch(`/api/admin/brokers/${broker.id}/status`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ isActive })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Falha ao atualizar status.");
        }
      }
      setSuccess("Alterações salvas.");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto h-full w-full md:w-[600px] lg:w-[700px] bg-app-elevated border-l hairline flex flex-col overflow-hidden">
        <header className="px-6 py-5 border-b hairline flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
              Corretor cadastrado
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.024em]">{broker.name}</h2>
            <p className="text-sm text-sand-100/65 mt-1">{broker.email}</p>
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
            <Field label="Telefone" value={broker.phone ?? "—"} />
            <Field label="Cidade" value={broker.city} />
            <Field label="CRECI" value={`${broker.creci} / ${broker.creciState}`} />
            <Field label="Validação CRECI" value={creciStatusLabel(broker.creciStatus)} />
            <Field label="Imobiliária atual" value={broker.currentAgency ?? "—"} />
            <Field
              label="Tempo de mercado"
              value={broker.yearsMarket != null ? `${broker.yearsMarket} anos` : "—"}
            />
            <Field label="Instagram" value={broker.instagram ?? "—"} />
            <Field label="Aceitou termo" value={broker.hasAcceptedTerm ? "Sim" : "Não"} />
            <Field label="Cadastrado em" value={new Date(broker.createdAt).toLocaleDateString("pt-BR")} />
            <Field label="Último acesso" value={relativeTime(broker.lastLoginAt)} />
          </section>

          <div className="divider-gold my-2" />

          <div>
            <label className="field-label">Categoria</label>
            <select
              className="field-input"
              value={category}
              onChange={(e) => setCategory(e.target.value as BrokerCategory)}
              disabled={pending}
            >
              {(Object.keys(CATEGORY_LABEL) as BrokerCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]} · {CATEGORY_LEADS[c]} lead{CATEGORY_LEADS[c] === 1 ? "" : "s"}/dia
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Status da conta</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsActive(true)}
                disabled={pending}
                className={`flex-1 btn-base ${isActive ? "btn-gold" : "btn-outline"}`}
                style={{ padding: ".55rem 1rem" }}
              >
                Ativo
              </button>
              <button
                type="button"
                onClick={() => setIsActive(false)}
                disabled={pending}
                className={`flex-1 btn-base ${!isActive ? "btn-gold" : "btn-outline"}`}
                style={{
                  padding: ".55rem 1rem",
                  ...(isActive
                    ? {}
                    : {
                        background: "linear-gradient(135deg,#E88888,#B83232)",
                        color: "#FBF9F4"
                      })
                }}
              >
                Inativo
              </button>
            </div>
            {!isActive && (
              <p className="text-xs text-sand-100/60 mt-2">
                Corretor inativo não consegue logar nem recebe leads na distribuição.
              </p>
            )}
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

        <footer className="px-6 py-4 border-t hairline flex gap-2 justify-end">
          <button
            className="btn-base btn-outline"
            style={{ padding: ".65rem 1.1rem" }}
            onClick={onClose}
            disabled={pending}
          >
            Fechar
          </button>
          <button
            className="btn-base btn-gold"
            style={{ padding: ".65rem 1.25rem" }}
            onClick={save}
            disabled={pending || !anyChange}
          >
            {pending ? "Salvando..." : "Salvar alterações"}
          </button>
        </footer>
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

function creciStatusLabel(s: CreciStatus): string {
  return s === "VALID" ? "Apto" : s === "INVALID" ? "Inapto" : "Aguardando";
}
