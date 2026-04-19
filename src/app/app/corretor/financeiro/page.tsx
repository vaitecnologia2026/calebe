import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";

export const metadata = { title: "Financeiro · Corretor — Calebe" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Em análise",
  REVIEWING: "Em conferência",
  APPROVED: "Aprovada p/ pagar",
  PAID: "Paga",
  BLOCKED: "Bloqueada"
};
const STATUS_CLASS: Record<string, string> = {
  PENDING: "status-pending",
  REVIEWING: "status-pending",
  APPROVED: "status-gold",
  PAID: "status-approved",
  BLOCKED: "status-denied"
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR");
}

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

  const commissions = await db.commission.findMany({
    where: { brokerId: broker.id },
    orderBy: { createdAt: "desc" },
    include: {
      sale: { select: { id: true, property: { select: { code: true, title: true } } } }
    }
  });

  const aReceber = commissions
    .filter((c) => c.status === "PENDING" || c.status === "APPROVED")
    .reduce((acc, c) => acc + Number(c.netValue), 0);
  const year = new Date().getFullYear();
  const recebidoAno = commissions
    .filter((c) => c.status === "PAID" && c.paidAt && c.paidAt.getFullYear() === year)
    .reduce((acc, c) => acc + Number(c.netValue), 0);
  const paidCount = commissions.filter((c) => c.status === "PAID").length;
  const ticketMedio = paidCount
    ? commissions
        .filter((c) => c.status === "PAID")
        .reduce((acc, c) => acc + Number(c.netValue), 0) / paidCount
    : 0;

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Comissões
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Financeiro</h1>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Kpi label="A receber" value={fmtBRL(aReceber)} />
        <Kpi label={`Recebido em ${year}`} value={fmtBRL(recebidoAno)} />
        <Kpi label="Ticket médio" value={fmtBRL(ticketMedio)} />
      </section>

      <div className="card overflow-hidden">
        {commissions.length === 0 ? (
          <div className="p-10 text-center text-sand-100/55">
            Nenhuma comissão ainda. São geradas quando o jurídico aprova uma venda.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
              <tr>
                <th className="text-left p-4">#</th>
                <th className="text-left p-4">Venda</th>
                <th className="text-left p-4">Imóvel</th>
                <th className="text-left p-4">Bruto</th>
                <th className="text-left p-4">Líquido</th>
                <th className="text-left p-4">Vencimento</th>
                <th className="text-left p-4">Paga em</th>
                <th className="text-left p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id} className="border-t hairline hover:bg-app-subtle/40">
                  <td className="p-4 text-xs font-mono text-gold-400">{c.id.slice(0, 8)}</td>
                  <td className="p-4 text-xs font-mono">{c.sale.id.slice(0, 8)}</td>
                  <td className="p-4">
                    {c.sale.property.code}
                    <p className="text-xs text-sand-100/60">{c.sale.property.title}</p>
                  </td>
                  <td className="p-4">{fmtBRL(Number(c.grossValue))}</td>
                  <td className="p-4 font-semibold text-gold-400">
                    {fmtBRL(Number(c.netValue))}
                  </td>
                  <td className="p-4 text-sand-100/70 text-xs">{fmtDate(c.dueDate)}</td>
                  <td className="p-4 text-sand-100/70 text-xs">{fmtDate(c.paidAt)}</td>
                  <td className="p-4">
                    <span className={`status ${STATUS_CLASS[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
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
