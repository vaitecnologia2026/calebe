import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { listVisits } from "@/lib/visits";
import { VisitsList } from "@/components/visits/VisitsList";

export const metadata = { title: "Agenda · Corretor — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireRole(["BROKER", "ADMIN"]);
  const broker = await db.broker.findFirst({
    where: { userId: user.id },
    select: { id: true }
  });

  if (!broker) {
    return (
      <AppShell role="BROKER" userName={user.name}>
        <div className="card p-10 text-center text-sand-100/70">
          Seu cadastro de corretor ainda não foi vinculado.
        </div>
      </AppShell>
    );
  }

  const visits = await listVisits({ brokerId: broker.id });

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Agenda
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Minhas visitas</h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          Confirmação de visitas é feita pelo admin/secretaria após a realização.
        </p>
      </header>

      <VisitsList visits={visits} canAct={false} scope="corretor" />
    </AppShell>
  );
}
