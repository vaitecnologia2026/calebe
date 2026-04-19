import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { LeadsHistoryList } from "@/components/admin/LeadsHistoryList";

export const metadata = { title: "Histórico de Leads · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);

  const leads = await db.lead.findMany({
    where: { status: { in: ["WON", "LOST"] } },
    orderBy: { updatedAt: "desc" },
    take: 500,
    include: {
      assignedBroker: { select: { id: true, user: { select: { name: true } } } }
    }
  });

  const data = leads.map((l) => ({
    id: l.id,
    fullName: l.fullName,
    phoneMasked: l.phoneMasked,
    email: l.email,
    source: l.source,
    channel: l.channel,
    city: l.city,
    status: l.status,
    brokerId: l.assignedBrokerId,
    brokerName: l.assignedBroker?.user.name ?? null,
    createdAt: l.createdAt.toISOString(),
    closedAt: l.updatedAt.toISOString(),
    notes: l.notes
  }));

  const total = data.length;
  const won = data.filter((d) => d.status === "WON").length;
  const lost = data.filter((d) => d.status === "LOST").length;
  const convPct = total > 0 ? Math.round((won / total) * 100) : 0;

  const brokers = Array.from(
    new Map(
      data.filter((d) => d.brokerId).map((d) => [d.brokerId!, d.brokerName ?? "—"])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Histórico
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          Histórico de Leads
        </h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          Leads encerrados (ganhos ou perdidos). Use para análise de conversão.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Total fechados" value={total} />
        <Kpi label="Ganhos" value={won} />
        <Kpi label="Perdidos" value={lost} />
        <Kpi label="Conversão" value={`${convPct}%`} />
      </section>

      <LeadsHistoryList leads={data} brokers={brokers} />
    </AppShell>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-5">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
        {label}
      </p>
      <p className="text-3xl font-bold tracking-[-0.032em] mt-2">{value}</p>
    </div>
  );
}
