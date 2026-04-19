"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BrokerApprovalStatus, BrokerCategory, CreciStatus } from "@prisma/client";

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
  rg: string;
  creci: string;
  creciState: string;
  city: string;
  currentAgency: string | null;
  yearsMarket: number | null;
  instagram: string | null;
  credentialFileUrl: string | null;
  notes: string | null;
  status: BrokerApprovalStatus;
  creciValidated: CreciStatus;
  submittedAt: Date | string;
};

const STATUS_LABEL: Record<BrokerApprovalStatus, string> = {
  PENDING: "Pendente",
  REVIEWING: "Em análise",
  APPROVED: "Aprovado",
  DENIED: "Negado",
  INCOMPLETE: "Doc. incompleta",
  CRECI_INVALID: "CRECI inválido"
};

const STATUS_CLASS: Record<BrokerApprovalStatus, string> = {
  PENDING: "status-pending",
  REVIEWING: "status-pending",
  APPROVED: "status-approved",
  DENIED: "status-denied",
  INCOMPLETE: "status-denied",
  CRECI_INVALID: "status-denied"
};

function relativeTime(d: Date | string): string {
  const t = new Date(d).getTime();
  const diff = Date.now() - t;
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  return `há ${days}d`;
}

export function ApprovalList({ applications }: { applications: Application[] }) {
  const [filter, setFilter] = useState<BrokerApprovalStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return applications.filter((a) => {
      if (filter !== "ALL" && a.status !== filter) return false;
      if (q && !`${a.fullName} ${a.email} ${a.creci}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [applications, filter, search]);

  const current = applications.find((a) => a.id === openId) ?? null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as BrokerApprovalStatus | "ALL")}
        >
          <option value="ALL">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="REVIEWING">Em análise</option>
          <option value="INCOMPLETE">Doc. incompleta</option>
          <option value="CRECI_INVALID">CRECI inválido</option>
        </select>
        <input
          className="field-input py-2 text-sm"
          style={{ width: 260 }}
          placeholder="Buscar por nome, e-mail, CRECI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            {applications.length === 0
              ? "Nenhum cadastro pendente no momento."
              : "Nenhum cadastro corresponde aos filtros."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">Corretor</th>
                <th className="text-left p-4">CRECI</th>
                <th className="text-left p-4">Cidade</th>
                <th className="text-left p-4">Recebido</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  className="border-t hairline hover:bg-app-subtle/40 cursor-pointer"
                  onClick={() => setOpenId(a.id)}
                >
                  <td className="p-4">
                    <p className="font-medium">{a.fullName}</p>
                    <p className="text-xs text-sand-100/70">{a.email}</p>
                  </td>
                  <td className="p-4">
                    {a.creci}
                    <br />
                    <span className="text-xs text-sand-100/70">{a.creciState}</span>
                  </td>
                  <td className="p-4">{a.city}</td>
                  <td className="p-4 text-sand-100/70">{relativeTime(a.submittedAt)}</td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      className="text-gold-400 text-xs uppercase tracking-[0.14em] font-medium hover:text-gold-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenId(a.id);
                      }}
                    >
                      Abrir ficha →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {current && <ApprovalDrawer application={current} onClose={() => setOpenId(null)} />}
    </>
  );
}

function ApprovalDrawer({
  application: a,
  onClose
}: {
  application: Application;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creciRadio, setCreciRadio] = useState<CreciStatus>(a.creciValidated);
  const [category, setCategory] = useState<BrokerCategory>("BRONZE");
  const [notes, setNotes] = useState("");
  const [denyReason, setDenyReason] = useState("");
  const [mode, setMode] = useState<"idle" | "deny">("idle");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setError(null);
    const res = await fetch(`/api/admin/applications/${a.id}/approve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ creciStatus: creciRadio, category, notes })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao aprovar.");
      return;
    }
    const data = await res.json();
    setTempPassword(data.tempPassword);
    startTransition(() => router.refresh());
  }

  async function deny() {
    setError(null);
    if (!denyReason.trim()) {
      setError("Informe o motivo da negativa.");
      return;
    }
    const res = await fetch(`/api/admin/applications/${a.id}/deny`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason: denyReason, notes })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Falha ao negar.");
      return;
    }
    startTransition(() => {
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto h-full w-full md:w-[600px] lg:w-[720px] bg-app-elevated border-l hairline flex flex-col overflow-hidden">
        <header className="px-6 py-5 border-b hairline flex items-start justify-between">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
              Ficha do candidato
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.024em]">{a.fullName}</h2>
            <p className="text-sm text-sand-100/65 mt-1">{a.email}</p>
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
          {tempPassword ? (
            <div className="card p-5 border-gold-400/40 bg-gold-400/5">
              <p className="text-[0.72rem] uppercase tracking-[0.16em] font-semibold text-gold-300 mb-2">
                Aprovado com sucesso
              </p>
              <p className="text-sm text-sand-100/80 mb-4">
                Envie estes dados ao corretor (WhatsApp ou e-mail):
              </p>
              <div className="space-y-2 text-sm font-mono bg-app-subtle/60 p-4 rounded-[2px]">
                <div>
                  <span className="text-sand-100/55">E-mail:</span> {a.email}
                </div>
                <div>
                  <span className="text-sand-100/55">Senha temporária:</span>{" "}
                  <strong className="text-gold-300">{tempPassword}</strong>
                </div>
                <div>
                  <span className="text-sand-100/55">URL:</span>{" "}
                  <strong className="text-gold-300">/login</strong>
                </div>
              </div>
              <p className="text-xs text-sand-100/55 mt-4">
                No primeiro login o corretor será solicitado a trocar a senha.
              </p>
              <button
                className="btn-base btn-gold w-full mt-5"
                onClick={() => {
                  startTransition(() => {
                    router.refresh();
                    onClose();
                  });
                }}
              >
                Fechar e atualizar fila
              </button>
            </div>
          ) : (
            <>
              <section className="grid grid-cols-2 gap-4 text-sm">
                <Field label="CPF" value={a.cpf} />
                <Field label="RG" value={a.rg} />
                <Field label="Telefone" value={a.phone} />
                <Field label="Cidade" value={a.city} />
                <Field label="CRECI" value={`${a.creci} / ${a.creciState}`} />
                <Field label="Imobiliária atual" value={a.currentAgency ?? "—"} />
                <Field
                  label="Tempo de mercado"
                  value={a.yearsMarket != null ? `${a.yearsMarket} anos` : "—"}
                />
                <Field label="Instagram" value={a.instagram ?? "—"} />
              </section>

              {a.notes && (
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-1">
                    Observações do candidato
                  </p>
                  <p className="text-sm text-sand-100/85 leading-relaxed whitespace-pre-wrap">
                    {a.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] font-medium text-sand-100/55 mb-2">
                  Credencial CRECI
                </p>
                {a.credentialFileUrl ? (
                  <a
                    href={a.credentialFileUrl}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-2 text-sm text-gold-300 hover:text-gold-200 underline"
                  >
                    Abrir arquivo enviado →
                  </a>
                ) : (
                  <p className="text-sm text-sand-100/60 italic">
                    Não anexado — solicite ao candidato por WhatsApp antes de aprovar.
                  </p>
                )}
              </div>

              <div className="divider-gold my-2" />

              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.14em] font-semibold text-gold-300 mb-3">
                  Validação manual do CRECI
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {(["VALID", "INVALID", "NOT_VERIFIED"] as CreciStatus[]).map((v) => (
                    <label key={v} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="creci-valid"
                        className="accent-gold-400"
                        checked={creciRadio === v}
                        onChange={() => setCreciRadio(v)}
                      />
                      {v === "VALID" ? "Apto" : v === "INVALID" ? "Inapto" : "Aguardando"}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Categoria inicial</label>
                <select
                  className="field-input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BrokerCategory)}
                >
                  <option value="BRONZE">Bronze · 1 lead/dia</option>
                  <option value="SILVER">Prata · 2 leads/dia</option>
                  <option value="GOLD">Ouro · 3 leads/dia</option>
                  <option value="DIAMOND">Diamante · 5 leads/dia</option>
                </select>
              </div>

              <div>
                <label className="field-label">Observações internas (só admin)</label>
                <textarea
                  className="field-input"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anotações sobre o perfil, pendências, decisões..."
                />
              </div>

              {mode === "deny" && (
                <div>
                  <label className="field-label text-red-300">Motivo da negativa *</label>
                  <textarea
                    className="field-input"
                    rows={3}
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    placeholder="Ex: CRECI inativo, documentação incompleta, perfil fora do target..."
                  />
                </div>
              )}

              {error && (
                <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {!tempPassword && (
          <footer className="px-6 py-4 border-t hairline flex gap-2 justify-end">
            {mode === "deny" ? (
              <>
                <button
                  className="btn-base btn-outline"
                  style={{ padding: ".65rem 1.1rem" }}
                  onClick={() => {
                    setMode("idle");
                    setDenyReason("");
                    setError(null);
                  }}
                  disabled={pending}
                >
                  Cancelar
                </button>
                <button
                  className="btn-base btn-gold"
                  style={{
                    padding: ".65rem 1.25rem",
                    background: "linear-gradient(135deg,#E88888,#B83232)",
                    color: "#FBF9F4"
                  }}
                  onClick={deny}
                  disabled={pending}
                >
                  {pending ? "Enviando..." : "Confirmar negativa"}
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-base btn-outline"
                  style={{ padding: ".65rem 1.1rem" }}
                  onClick={() => setMode("deny")}
                  disabled={pending}
                >
                  Negar
                </button>
                <button
                  className="btn-base btn-gold"
                  style={{ padding: ".65rem 1.25rem" }}
                  onClick={approve}
                  disabled={pending}
                >
                  {pending ? "Aprovando..." : "Aprovar e criar corretor"}
                </button>
              </>
            )}
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
