import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { loadFinalizedLegalCases } from "@/lib/legal-cases";
import { FinalizedContractsList } from "@/components/juridico/FinalizedContractsList";

export const metadata = { title: "Contratos · Jurídico — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireRole(["LEGAL", "ADMIN"]);
  const cases = await loadFinalizedLegalCases();

  return (
    <AppShell role="LEGAL" userName={user.name}>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Histórico
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
            Contratos finalizados
          </h1>
          <p className="text-sand-100/65 mt-2 max-w-xl">
            Contratos aprovados e negados, separados por aba.
          </p>
        </div>
      </header>

      <FinalizedContractsList cases={cases} />
    </AppShell>
  );
}
