import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { ApprovalList } from "@/components/admin/ApprovalList";

export const metadata = { title: "Aprovação · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const user = await requireRole(["ADMIN"]);

  const applications = await db.brokerApplication.findMany({
    where: {
      status: { in: ["PENDING", "REVIEWING", "INCOMPLETE", "CRECI_INVALID"] }
    },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      cpf: true,
      rg: true,
      creci: true,
      creciState: true,
      city: true,
      currentAgency: true,
      yearsMarket: true,
      instagram: true,
      credentialFileUrl: true,
      notes: true,
      status: true,
      creciValidated: true,
      submittedAt: true
    }
  });

  return (
    <AppShell role="ADMIN" userName={user.name}>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Fila de aprovação
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
            {applications.length} cadastro{applications.length === 1 ? "" : "s"} pendente
            {applications.length === 1 ? "" : "s"}
          </h1>
        </div>
      </header>

      <ApprovalList applications={applications} />
    </AppShell>
  );
}
