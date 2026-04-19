import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { LegalKanban } from "@/components/juridico/LegalKanban";
import { loadActiveLegalCases } from "@/lib/legal-cases";

export const metadata = { title: "Jurídico · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireRole(["ADMIN"]);
  const cases = await loadActiveLegalCases();

  return (
    <AppShell role="ADMIN" userName={user.name}>
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Back-office · visão admin
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          Jurídico · <span className="text-gold-400">Kanban</span>
        </h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          Supervisione contratos em andamento. Admin pode finalizar ou negar em nome do jurídico.
        </p>
      </header>

      <LegalKanban cases={cases} role="ADMIN" />
    </AppShell>
  );
}
