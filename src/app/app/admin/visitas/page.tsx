import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { listVisits } from "@/lib/visits";
import { VisitsList } from "@/components/visits/VisitsList";

export const metadata = { title: "Visitas · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireRole(["ADMIN"]);
  const visits = await listVisits();

  return (
    <AppShell role="ADMIN" userName={user.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Operação
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Visitas</h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          Confirme se a visita ocorreu — impacta ranking e evolução de categoria do corretor.
        </p>
      </header>

      <VisitsList visits={visits} canAct={true} scope="admin" />
    </AppShell>
  );
}
