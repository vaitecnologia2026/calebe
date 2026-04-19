import { requireRole } from "@/lib/rbac";
import { AppShell } from "@/components/app/AppShell";
import { db } from "@/lib/db";
import { PropertiesAdminList } from "@/components/admin/PropertiesAdminList";

export const metadata = { title: "Imóveis · Admin — Calebe" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const admin = await requireRole(["ADMIN"]);

  const properties = await db.property.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { sales: true, visits: true } }
    }
  });

  const data = properties.map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    description: p.description,
    city: p.city,
    neighborhood: p.neighborhood,
    addressFull: p.addressFull,
    price: Number(p.price),
    commissionPct: Number(p.commissionPct),
    status: p.status,
    type: p.type,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    parkingSpots: p.parkingSpots,
    areaM2: p.areaM2 != null ? Number(p.areaM2) : null,
    salesCount: p._count.sales,
    visitsCount: p._count.visits,
    createdAt: p.createdAt.toISOString()
  }));

  return (
    <AppShell role="ADMIN" userName={admin.name}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-2">
            Portfólio
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.028em]">Imóveis</h1>
          <p className="text-sand-100/65 mt-2 max-w-xl">
            Catálogo de imóveis disponíveis para os corretores afiliados.
          </p>
        </div>
      </header>

      <PropertiesAdminList properties={data} />
    </AppShell>
  );
}
