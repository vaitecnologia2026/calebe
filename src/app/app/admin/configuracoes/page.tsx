import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { DistributionRules } from "@/components/admin/config/DistributionRules";
import { UsersTable } from "@/components/admin/config/UsersTable";

export const metadata = { title: "Configurações · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);

  const [rules, users] = await Promise.all([
    db.leadDistributionRule.findMany({ orderBy: { category: "asc" } }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        cpf: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true
      }
    })
  ]);

  const usersData = users.map((u) => ({
    ...u,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString()
  }));

  const rulesData = rules.map((r) => ({
    category: r.category,
    leadsPerDay: r.leadsPerDay,
    isActive: r.isActive
  }));

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <header className="mb-8">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Sistema
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Configurações</h1>
      </header>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <DistributionRules initialRules={rulesData} />
      </div>

      <div className="mb-6">
        <UsersTable initialUsers={usersData} />
      </div>
    </AppShell>
  );
}
