import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { LeadsList } from "@/components/admin/LeadsList";

export const metadata = { title: "Leads · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);

  const [leads, brokers] = await Promise.all([
    db.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        fullName: true,
        maskedName: true,
        phoneMasked: true,
        email: true,
        source: true,
        channel: true,
        city: true,
        budgetRange: true,
        interestType: true,
        status: true,
        assignedBrokerId: true,
        assignedAt: true,
        notes: true,
        campaign: true,
        utmSource: true,
        createdAt: true,
        assignedBroker: {
          select: {
            id: true,
            user: { select: { name: true } }
          }
        }
      }
    }),
    db.broker.findMany({
      where: { approvalStatus: "APPROVED", user: { isActive: true } },
      orderBy: [{ category: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        category: true,
        user: { select: { name: true } }
      }
    })
  ]);

  const totalHoje = leads.filter(
    (l) => new Date(l.createdAt).toDateString() === new Date().toDateString()
  ).length;
  const distribuidos = leads.filter((l) => l.assignedBrokerId != null).length;
  const naoAtribuidos = leads.filter((l) => l.assignedBrokerId == null).length;
  const emAtendimento = leads.filter((l) =>
    ["IN_CONTACT", "QUALIFIED", "VISIT_SCHEDULED", "PROPOSAL"].includes(l.status)
  ).length;

  const data = leads.map((l) => ({
    id: l.id,
    fullName: l.fullName,
    maskedName: l.maskedName,
    phoneMasked: l.phoneMasked,
    email: l.email,
    source: l.source,
    channel: l.channel,
    city: l.city,
    budgetRange: l.budgetRange,
    interestType: l.interestType,
    status: l.status,
    assignedBrokerId: l.assignedBrokerId,
    assignedBrokerName: l.assignedBroker?.user.name ?? null,
    assignedAt: l.assignedAt ? l.assignedAt.toISOString() : null,
    notes: l.notes,
    campaign: l.campaign,
    utmSource: l.utmSource,
    createdAt: l.createdAt.toISOString()
  }));

  const brokerOptions = brokers.map((b) => ({
    id: b.id,
    label: `${b.user.name} · ${b.category}`
  }));

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Rastreabilidade
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Leads</h1>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Hoje" value={totalHoje} />
        <Kpi label="Distribuídos" value={distribuidos} />
        <Kpi label="Em atendimento" value={emAtendimento} />
        <Kpi label="Não atribuídos" value={naoAtribuidos} />
      </section>

      <LeadsList leads={data} brokers={brokerOptions} />

      <p className="text-xs text-sand-100/55 mt-3 flex items-center gap-1.5">
        🔒 Telefone real nunca exibido por padrão. Cada revelação gera AuditEvent LEAD_PHONE_DECRYPTED com IP e timestamp.
      </p>
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
