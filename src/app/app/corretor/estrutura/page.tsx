import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { listStructureRequests } from "@/lib/structure-requests";
import { CorretorStructure } from "@/components/corretor/CorretorStructure";

export const metadata = { title: "Estrutura Premium · Corretor — Calebe" };
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
        <div className="card p-10 text-center">
          <p className="text-sand-100/70">
            Seu cadastro de corretor ainda não foi vinculado. Fale com a administração.
          </p>
        </div>
      </AppShell>
    );
  }

  const requests = await listStructureRequests({ brokerId: broker.id });

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2 inline-flex items-center gap-1.5">
          ✨ Diferencial Calebe
        </p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-[-0.024em] mt-1">
          Estrutura <span className="text-gold-400">Premium</span>
        </h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          Agende recursos exclusivos da Calebe para fortalecer visitas e fechamentos de alto valor.
        </p>
      </header>

      <CorretorStructure requests={requests} />
    </AppShell>
  );
}
