import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";

export const metadata = { title: "Jurídico · Corretor — Calebe" };
export const dynamic = "force-dynamic";

const LEGAL_STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Recebido",
  REVIEWING: "Em análise",
  DOCS_PENDING: "Documentação pendente",
  DRAFTING: "Em elaboração",
  READY_TO_SIGN: "Pronto para assinar",
  COMPLETED: "Concluído"
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
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

  const sales = await db.sale.findMany({
    where: {
      brokerId: broker.id,
      legalCase: { isNot: null }
    },
    orderBy: { createdAt: "desc" },
    include: {
      legalCase: true,
      property: { select: { code: true, title: true } }
    }
  });

  const active = sales.filter((s) => s.legalCase && s.legalCase.status !== "COMPLETED");
  const completed = sales.filter(
    (s) =>
      s.legalCase &&
      s.legalCase.status === "COMPLETED" &&
      (s.status === "COMPLETED" || s.status === "CANCELLED")
  );

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Back-office
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          Status jurídico das minhas vendas
        </h1>
      </header>

      <div className="space-y-3">
        {active.length === 0 ? (
          <div className="card p-10 text-center text-sand-100/55">
            Nenhum contrato em andamento. Vendas enviadas ao jurídico aparecem aqui.
          </div>
        ) : (
          active.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                <div>
                  <p className="font-semibold font-mono text-xs text-gold-400">
                    {s.id.slice(0, 8)}
                  </p>
                  <p className="text-sm">
                    {s.property.code} · {s.property.title}
                  </p>
                  <p className="text-xs text-sand-100/60 mt-1">
                    {fmtBRL(Number(s.saleValue))} · {s.negotiationType}
                  </p>
                </div>
                <span className="status status-gold">
                  {LEGAL_STATUS_LABEL[s.legalCase!.status]}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-[0.65rem] font-semibold uppercase tracking-[0.1em]">
                {(["RECEIVED", "REVIEWING", "DRAFTING", "READY_TO_SIGN", "COMPLETED"] as const).map(
                  (step, i) => {
                    const order = [
                      "RECEIVED",
                      "REVIEWING",
                      "DOCS_PENDING",
                      "DRAFTING",
                      "READY_TO_SIGN",
                      "COMPLETED"
                    ];
                    const cur = order.indexOf(s.legalCase!.status);
                    const stepIdx = i === 0 ? 0 : i === 1 ? 1 : i === 2 ? 3 : i === 3 ? 4 : 5;
                    const active = cur >= stepIdx;
                    return (
                      <div
                        key={step}
                        className={`py-2 rounded-[4px] ${
                          active
                            ? "bg-gold-400/15 text-gold-300"
                            : "bg-app-subtle text-sand-100/40"
                        }`}
                      >
                        {LEGAL_STATUS_LABEL[step]}
                      </div>
                    );
                  }
                )}
              </div>
              {s.legalCase?.legalNotes && (
                <p className="text-sm text-sand-100/75 mt-4 leading-relaxed italic border-t hairline pt-3">
                  &ldquo;{s.legalCase.legalNotes}&rdquo;
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {completed.length > 0 && (
        <div className="mt-8">
          <p className="text-[0.72rem] uppercase tracking-[0.14em] font-medium text-gold-400/80 mb-3">
            Finalizados
          </p>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-app-subtle/60 text-[0.7rem] uppercase tracking-[0.14em] font-medium text-sand-100/60">
                <tr>
                  <th className="text-left p-4">#</th>
                  <th className="text-left p-4">Imóvel</th>
                  <th className="text-left p-4">Valor</th>
                  <th className="text-left p-4">Finalizado em</th>
                  <th className="text-left p-4">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {completed.map((s) => (
                  <tr key={s.id} className="border-t hairline">
                    <td className="p-4 font-mono text-xs text-gold-400">{s.id.slice(0, 8)}</td>
                    <td className="p-4">
                      {s.property.code} · {s.property.title}
                    </td>
                    <td className="p-4">{fmtBRL(Number(s.saleValue))}</td>
                    <td className="p-4 text-sand-100/70 text-xs">
                      {fmtDate(s.legalCase?.completedAt ?? null)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`status ${
                          s.status === "COMPLETED" ? "status-approved" : "status-denied"
                        }`}
                      >
                        {s.status === "COMPLETED" ? "Aprovado" : "Negado"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
}
