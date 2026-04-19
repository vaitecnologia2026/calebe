import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { BrokersList } from "@/components/admin/BrokersList";

export const metadata = { title: "Corretores · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);

  const brokers = await db.broker.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isActive: true,
          lastLoginAt: true
        }
      }
    }
  });

  const data = brokers.map((b) => ({
    id: b.id,
    userId: b.userId,
    name: b.user.name,
    email: b.user.email,
    phone: b.user.phone,
    isActive: b.user.isActive,
    lastLoginAt: b.user.lastLoginAt ? b.user.lastLoginAt.toISOString() : null,
    createdAt: b.createdAt.toISOString(),
    category: b.category,
    creci: b.creci,
    creciState: b.creciState,
    creciStatus: b.creciStatus,
    city: b.city,
    currentAgency: b.currentAgency,
    yearsMarket: b.yearsMarket,
    instagram: b.instagram,
    approvalStatus: b.approvalStatus,
    hasAcceptedTerm: b.hasAcceptedTerm
  }));

  const active = data.filter((b) => b.isActive).length;
  const inactive = data.length - active;

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Time
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Corretores</h1>
        <p className="text-sand-100/65 mt-2">
          {data.length} cadastrado{data.length === 1 ? "" : "s"} · {active} ativo
          {active === 1 ? "" : "s"} · {inactive} inativo{inactive === 1 ? "" : "s"}
        </p>
      </header>

      <BrokersList brokers={data} />
    </AppShell>
  );
}
