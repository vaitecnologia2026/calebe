import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";

export const metadata = { title: "Dashboard · Admin — Calebe" };

export default async function AdminDashboard() {
  const user = await requireRole(["ADMIN"]);
  return (
    <AppShell role="ADMIN" userName={user.name}>
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Visão executiva
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          Dashboard <span className="text-gold-400">Calebe</span>
        </h1>
      </header>
      <section className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-4 tv:grid-cols-8 gap-3 lg:gap-4 tv:gap-5">
        {[
          { label: "Corretores ativos", value: "47" },
          { label: "Aprovações pendentes", value: "8" },
          { label: "Leads hoje", value: "142" },
          { label: "Conversão mês", value: "11,4%" },
          { label: "Visitas mês", value: "86" },
          { label: "Vendas mês", value: "14" },
          { label: "Comissão pendente", value: "R$ 412K" },
          { label: "Estrutura pendente", value: "6" }
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
              {k.label}
            </p>
            <p className="text-3xl font-bold tracking-[-0.032em] mt-2">{k.value}</p>
          </div>
        ))}
      </section>
      <p className="mt-10 text-sm text-sand-100/50">
        Os módulos de aprovação, leads, histórico de distribuição, imóveis, estrutura, visitas,
        vendas, jurídico, financeiro, auditoria e configurações estão acessíveis pelo menu lateral.
      </p>
    </AppShell>
  );
}
