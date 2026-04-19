import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { SalesList } from "@/components/admin/SalesList";

export const metadata = { title: "Vendas · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);

  const sales = await db.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      property: { select: { code: true, title: true, city: true } },
      broker: { select: { id: true, user: { select: { name: true } } } },
      legalCase: { select: { id: true, status: true } },
      commission: { select: { id: true, status: true, grossValue: true, netValue: true } }
    }
  });

  const data = sales.map((s) => ({
    id: s.id,
    propertyCode: s.property.code,
    propertyTitle: s.property.title,
    propertyCity: s.property.city,
    brokerId: s.broker.id,
    brokerName: s.broker.user.name,
    saleValue: Number(s.saleValue),
    negotiationType: s.negotiationType,
    status: s.status,
    submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
    createdAt: s.createdAt.toISOString(),
    notes: s.notes,
    legalCaseId: s.legalCase?.id ?? null,
    legalStatus: s.legalCase?.status ?? null,
    commissionStatus: s.commission?.status ?? null,
    commissionNet: s.commission ? Number(s.commission.netValue) : null
  }));

  const brokers = Array.from(
    new Map(data.map((s) => [s.brokerId, s.brokerName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const total = data.length;
  const concluidas = data.filter((s) => s.status === "COMPLETED").length;
  const emJuridico = data.filter((s) => s.status === "SUBMITTED" || s.status === "IN_LEGAL")
    .length;
  const valorTotal = data.reduce((acc, s) => acc + s.saleValue, 0);

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Pipeline
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Vendas</h1>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="Total" value={total} />
        <Kpi label="Em jurídico" value={emJuridico} />
        <Kpi label="Concluídas" value={concluidas} />
        <Kpi
          label="Valor total"
          value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            valorTotal
          )}
        />
      </section>

      <SalesList sales={data} brokers={brokers} />
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
