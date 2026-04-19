import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { CommissionsList } from "@/components/admin/CommissionsList";

export const metadata = { title: "Financeiro · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);

  const commissions = await db.commission.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sale: { select: { id: true, property: { select: { code: true, title: true } } } },
      broker: { select: { id: true, user: { select: { name: true } } } }
    }
  });

  const data = commissions.map((c) => ({
    id: c.id,
    saleId: c.saleId,
    propertyCode: c.sale.property.code,
    propertyTitle: c.sale.property.title,
    brokerId: c.brokerId,
    brokerName: c.broker.user.name,
    grossValue: Number(c.grossValue),
    netValue: Number(c.netValue),
    status: c.status,
    dueDate: c.dueDate ? c.dueDate.toISOString() : null,
    paidAt: c.paidAt ? c.paidAt.toISOString() : null,
    receiptUrl: c.receiptUrl,
    notes: c.notes,
    createdAt: c.createdAt.toISOString()
  }));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const ofMonth = data.filter((c) => new Date(c.createdAt) >= monthStart);

  const aPagar = ofMonth
    .filter((c) => c.status === "APPROVED" || c.status === "PENDING")
    .reduce((acc, c) => acc + c.netValue, 0);
  const pago = ofMonth.filter((c) => c.status === "PAID").reduce((acc, c) => acc + c.netValue, 0);
  const emConferencia = ofMonth
    .filter((c) => c.status === "REVIEWING")
    .reduce((acc, c) => acc + c.netValue, 0);
  const bloqueadas = ofMonth
    .filter((c) => c.status === "BLOCKED")
    .reduce((acc, c) => acc + c.netValue, 0);

  const brokers = Array.from(
    new Map(data.map((c) => [c.brokerId, c.brokerName])).entries()
  ).map(([id, name]) => ({ id, name }));

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Comissões
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Financeiro</h1>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Kpi label="A pagar (mês)" value={fmtBRL(aPagar)} />
        <Kpi label="Pago (mês)" value={fmtBRL(pago)} />
        <Kpi label="Em conferência" value={fmtBRL(emConferencia)} />
        <Kpi label="Bloqueadas" value={fmtBRL(bloqueadas)} />
      </section>

      <CommissionsList commissions={data} brokers={brokers} />
    </AppShell>
  );
}

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-[0.68rem] uppercase tracking-[0.14em] font-medium text-sand-100/55">
        {label}
      </p>
      <p className="text-2xl md:text-3xl font-bold tracking-[-0.032em] mt-2">{value}</p>
    </div>
  );
}
