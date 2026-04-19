import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";

export const metadata = { title: "Jurídico — Calebe" };

export default async function JuridicoDashboard() {
  const user = await requireRole(["LEGAL", "ADMIN"]);
  return (
    <AppShell role="LEGAL" userName={user.name}>
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Back-office
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          Fila <span className="text-gold-400">jurídica</span>
        </h1>
        <p className="mt-2 text-sand-100/65 max-w-xl">
          Contratos, documentação e andamento de vendas. Acesso restrito.
        </p>
      </header>
      <section className="grid grid-cols-2 md:grid-cols-4 tv:grid-cols-8 gap-3 lg:gap-4 tv:gap-5">
        {[
          { label: "Recebido", value: "2" },
          { label: "Em análise", value: "3" },
          { label: "Elaboração", value: "2" },
          { label: "Assinatura", value: "1" }
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
              {k.label}
            </p>
            <p className="text-3xl font-bold tracking-[-0.032em] mt-2">{k.value}</p>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
