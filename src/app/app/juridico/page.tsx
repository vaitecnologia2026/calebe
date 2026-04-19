import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { LegalKanban } from "@/components/juridico/LegalKanban";
import { loadActiveLegalCases } from "@/lib/legal-cases";

export const metadata = { title: "Jurídico — Calebe" };
export const dynamic = "force-dynamic";

export default async function JuridicoDashboard() {
  const user = await requireRole(["LEGAL", "ADMIN"]);
  const cases = await loadActiveLegalCases();

  const byStatus = {
    RECEIVED: cases.filter((c) => c.status === "RECEIVED").length,
    REVIEWING: cases.filter((c) => c.status === "REVIEWING" || c.status === "DOCS_PENDING")
      .length,
    DRAFTING: cases.filter((c) => c.status === "DRAFTING").length,
    READY_TO_SIGN: cases.filter((c) => c.status === "READY_TO_SIGN").length
  };

  return (
    <AppShell role="LEGAL" userName={user.name}>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Back-office
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
            Jurídico · <span className="text-gold-400">Kanban</span>
          </h1>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Recebido" value={byStatus.RECEIVED} />
        <Kpi label="Em análise" value={byStatus.REVIEWING} />
        <Kpi label="Elaboração" value={byStatus.DRAFTING} />
        <Kpi label="Assinatura" value={byStatus.READY_TO_SIGN} />
      </section>

      <LegalKanban cases={cases} role="LEGAL" />
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
        {label}
      </p>
      <p className="text-3xl font-bold tracking-[-0.032em] mt-2">{value}</p>
    </div>
  );
}
