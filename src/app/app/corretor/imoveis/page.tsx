import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";

export const metadata = { title: "Imóveis · Corretor — Calebe" };
export const dynamic = "force-dynamic";

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default async function Page() {
  const user = await requireRole(["BROKER", "ADMIN"]);

  const properties = await db.property.findMany({
    where: { status: { in: ["AVAILABLE", "RESERVED"] } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell role="BROKER" userName={user.name}>
      <header className="mb-6">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
          Portfólio
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">
          Imóveis disponíveis
        </h1>
        <p className="text-sand-100/65 mt-2 max-w-xl">
          Ofereça estes imóveis aos seus leads. Clique em &quot;Registrar venda&quot; quando fechar.
        </p>
      </header>

      {properties.length === 0 ? (
        <div className="card p-10 text-center text-sand-100/55">
          Nenhum imóvel disponível. Admin adiciona em Admin · Imóveis.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <article key={p.id} className="card p-5 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono text-gold-400">{p.code}</span>
                {p.status === "RESERVED" && (
                  <span className="status status-gold">Reservado</span>
                )}
              </div>
              <h3 className="text-lg font-bold tracking-[-0.02em] leading-tight">{p.title}</h3>
              <p className="text-xs text-sand-100/70 mt-1">
                {p.neighborhood ? `${p.neighborhood} · ` : ""}
                {p.city}
              </p>
              <p className="text-xs text-sand-100/75 mt-3 line-clamp-3 leading-relaxed">
                {p.description}
              </p>
              {(p.bedrooms || p.bathrooms || p.parkingSpots || p.areaM2) && (
                <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
                  {p.bedrooms != null && (
                    <div>
                      <p className="text-sand-100/55">Suítes</p>
                      <p className="font-semibold">{p.bedrooms}</p>
                    </div>
                  )}
                  {p.bathrooms != null && (
                    <div>
                      <p className="text-sand-100/55">Banh.</p>
                      <p className="font-semibold">{p.bathrooms}</p>
                    </div>
                  )}
                  {p.parkingSpots != null && (
                    <div>
                      <p className="text-sand-100/55">Vagas</p>
                      <p className="font-semibold">{p.parkingSpots}</p>
                    </div>
                  )}
                  {p.areaM2 != null && (
                    <div>
                      <p className="text-sand-100/55">Área</p>
                      <p className="font-semibold">{Number(p.areaM2)}m²</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center mt-4 pt-4 border-t hairline text-sm">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.14em] text-sand-100/50">
                    Valor
                  </p>
                  <p className="font-semibold">{fmtBRL(Number(p.price))}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.62rem] uppercase tracking-[0.14em] text-sand-100/50">
                    Comissão
                  </p>
                  <p className="text-gold-400 font-semibold">{Number(p.commissionPct)}%</p>
                </div>
              </div>
              <Link
                href={`/app/corretor/vendas/nova?property=${p.code}`}
                className="btn-base btn-gold mt-4 text-[0.78rem]"
                style={{ padding: ".55rem 1rem" }}
              >
                Registrar venda
              </Link>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
