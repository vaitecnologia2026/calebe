import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";

export const metadata = { title: "Secretaria — Calebe" };

export default async function SecretariaDashboard() {
  const user = await requireRole(["SECRETARY", "ADMIN"]);
  return (
    <AppShell role="SECRETARY" userName={user.name}>
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Operação
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          Secretaria <span className="text-gold-400">Calebe</span>
        </h1>
        <p className="mt-2 text-sand-100/65 max-w-xl">
          Solicitações de estrutura, confirmação de visitas e apoio operacional.
        </p>
      </header>
      <section className="grid grid-cols-2 md:grid-cols-4 tv:grid-cols-8 gap-3 lg:gap-4 tv:gap-5">
        {[
          { label: "Estrutura pendente", value: "6" },
          { label: "Visitas hoje", value: "12" },
          { label: "A confirmar", value: "5" },
          { label: "Reagendamentos", value: "2" }
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
              {k.label}
            </p>
            <p className="text-3xl font-bold tracking-[-0.032em] mt-2">{k.value}</p>
          </div>
        ))}
      </section>
      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/app/secretaria/estrutura" className="card p-6 hover:border-gold-400/40 transition-colors">
          <p className="text-[0.7rem] uppercase tracking-[0.14em] font-medium text-gold-400/80 mb-2">
            Fila operacional
          </p>
          <h2 className="text-2xl font-bold tracking-[-0.02em]">Solicitações de estrutura</h2>
          <span className="inline-flex items-center gap-1.5 mt-4 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-gold-300">
            Abrir fila <ArrowRight size={14} />
          </span>
        </Link>
        <Link href="/app/secretaria/visitas" className="card p-6 hover:border-gold-400/40 transition-colors">
          <p className="text-[0.7rem] uppercase tracking-[0.14em] font-medium text-gold-400/80 mb-2">
            Agenda
          </p>
          <h2 className="text-2xl font-bold tracking-[-0.02em]">Visitas & confirmações</h2>
          <span className="inline-flex items-center gap-1.5 mt-4 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-gold-300">
            Ver agenda <ArrowRight size={14} />
          </span>
        </Link>
      </section>
    </AppShell>
  );
}
