import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { listStructureRequests } from "@/lib/structure-requests";
import { StructureRequestsList } from "@/components/admin/StructureRequestsList";

export const metadata = { title: "Estrutura · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);
  const requests = await listStructureRequests();

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Infraestrutura Calebe
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          Solicitações de estrutura
        </h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          Reservas de avião, veículo, apartamento e visita acompanhada dos corretores afiliados.
        </p>
      </header>

      <StructureRequestsList requests={requests} />
    </AppShell>
  );
}
