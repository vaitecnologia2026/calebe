"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  cpf: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  BROKER: "Corretor",
  LEGAL: "Jurídico",
  SECRETARY: "Secretaria"
};

function fmt(iso: string | null): string {
  if (!iso) return "nunca";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `há ${days}d`;
  return d.toLocaleDateString("pt-BR");
}

export function UsersTable({ initialUsers }: { initialUsers: AppUser[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim().toLowerCase(),
      role: fd.get("role") as Role,
      phone: String(fd.get("phone") ?? "").trim() || null
    };
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao criar usuário.");
      setCreated({ email: data.email, password: data.tempPassword });
      startTransition(() => router.refresh());
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  async function toggleActive(user: AppUser) {
    if (
      !confirm(
        `${user.isActive ? "Desativar" : "Reativar"} ${user.name}? ${
          user.isActive
            ? "Usuário não conseguirá logar até ser reativado."
            : "Volta a conseguir logar."
        }`
      )
    )
      return;
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setError("Falha ao alterar status.");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(user: AppUser) {
    if (!confirm(`Gerar nova senha para ${user.name}? A senha atual será invalidada.`)) return;
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao resetar senha.");
      setCreated({ email: data.email, password: data.tempPassword });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[0.72rem] uppercase tracking-[0.14em] font-medium text-gold-400/80 inline-flex items-center gap-2">
          👥 Usuários do sistema
        </p>
        <button
          className="btn-base btn-gold"
          style={{ padding: ".4rem 1rem", fontSize: "0.78rem" }}
          onClick={() => {
            setCreating((v) => !v);
            setCreated(null);
          }}
        >
          {creating ? "Cancelar" : "+ Novo usuário"}
        </button>
      </div>

      {creating && (
        <form onSubmit={submitNew} className="card p-4 mb-4 bg-app-subtle/40">
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <div>
              <label className="field-label">Nome</label>
              <input className="field-input" name="name" required />
            </div>
            <div>
              <label className="field-label">E-mail</label>
              <input className="field-input" type="email" name="email" required />
            </div>
            <div>
              <label className="field-label">Perfil</label>
              <select className="field-input" name="role" defaultValue="SECRETARY" required>
                <option value="ADMIN">Admin</option>
                <option value="LEGAL">Jurídico</option>
                <option value="SECRETARY">Secretaria</option>
                <option value="BROKER">Corretor (use fluxo de Aprovação)</option>
              </select>
            </div>
            <div>
              <label className="field-label">Telefone (opcional)</label>
              <input className="field-input" name="phone" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button type="submit" className="btn-base btn-gold" style={{ padding: ".5rem 1rem" }}>
              Criar + gerar senha temp
            </button>
          </div>
        </form>
      )}

      {created && (
        <div className="card p-4 mb-4 bg-gold-400/5 border-gold-400/40">
          <p className="text-[0.72rem] uppercase tracking-[0.14em] font-semibold text-gold-300 mb-2">
            Credenciais geradas — copie e envie
          </p>
          <div className="space-y-1 text-sm font-mono bg-app-subtle/60 p-3 rounded-[2px]">
            <div>
              <span className="text-sand-100/55">E-mail:</span> {created.email}
            </div>
            <div>
              <span className="text-sand-100/55">Senha:</span>{" "}
              <strong className="text-gold-300">{created.password}</strong>
            </div>
          </div>
          <button
            className="mt-3 text-[0.72rem] uppercase tracking-[0.12em] font-semibold text-gold-300 hover:text-gold-200"
            onClick={() => {
              navigator.clipboard?.writeText(
                `E-mail: ${created.email}\nSenha: ${created.password}`
              );
            }}
          >
            Copiar credenciais →
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-3">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">E-mail</th>
              <th className="text-left p-3">Perfil</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Último acesso</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {initialUsers.map((u) => (
              <tr key={u.id} className="border-t hairline hover:bg-app-subtle/40">
                <td className="p-3">{u.name}</td>
                <td className="p-3 text-sand-100/75 break-all">{u.email}</td>
                <td className="p-3">
                  <span className="status status-gold">{ROLE_LABEL[u.role]}</span>
                </td>
                <td className="p-3">
                  {u.isActive ? (
                    <span className="status status-approved">Ativo</span>
                  ) : (
                    <span className="status status-denied">Inativo</span>
                  )}
                </td>
                <td className="p-3 text-xs text-sand-100/70">{fmt(u.lastLoginAt)}</td>
                <td className="p-3 text-right space-x-3">
                  <button
                    className="text-gold-400 text-xs uppercase tracking-[0.12em] font-semibold hover:text-gold-300"
                    onClick={() => resetPassword(u)}
                    disabled={busyId === u.id}
                  >
                    Resetar senha
                  </button>
                  <button
                    className="text-xs uppercase tracking-[0.12em] font-semibold text-sand-100/70 hover:text-sand-50"
                    onClick={() => toggleActive(u)}
                    disabled={busyId === u.id}
                  >
                    {u.isActive ? "Desativar" : "Reativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
