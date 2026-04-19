"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PropertyStatus } from "@prisma/client";

type Property = {
  id: string;
  code: string;
  title: string;
  description: string;
  city: string;
  neighborhood: string | null;
  addressFull: string | null;
  price: number;
  commissionPct: number;
  status: PropertyStatus;
  type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpots: number | null;
  areaM2: number | null;
  salesCount: number;
  visitsCount: number;
  createdAt: string;
};

const STATUS_LABEL: Record<PropertyStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  OFF_MARKET: "Fora do mercado"
};

const STATUS_CLASS: Record<PropertyStatus, string> = {
  AVAILABLE: "status-approved",
  RESERVED: "status-gold",
  SOLD: "status-denied",
  OFF_MARKET: "status-pending"
};

function fmtBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function PropertiesAdminList({ properties }: { properties: Property[] }) {
  const [status, setStatus] = useState<PropertyStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((p) => {
      if (status !== "ALL" && p.status !== status) return false;
      if (q && !`${p.code} ${p.title} ${p.city}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [properties, status, search]);

  const editing = properties.find((p) => p.id === openEdit) ?? null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        <select
          className="field-input py-2 text-sm"
          style={{ width: "auto" }}
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="ALL">Todos status</option>
          <option value="AVAILABLE">Disponível</option>
          <option value="RESERVED">Reservado</option>
          <option value="SOLD">Vendido</option>
          <option value="OFF_MARKET">Fora do mercado</option>
        </select>
        <input
          className="field-input py-2 text-sm"
          style={{ width: 260 }}
          placeholder="Buscar por código, título, cidade..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn-base btn-gold"
          style={{ padding: ".55rem 1.25rem" }}
          onClick={() => setOpenNew(true)}
        >
          + Novo imóvel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full card p-10 text-center text-sand-100/55">
            Nenhum imóvel corresponde aos filtros.
          </div>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              className="card p-5 text-left hover:border-gold-400/50 transition-colors"
              onClick={() => setOpenEdit(p.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono text-gold-400">{p.code}</span>
                <span className={`status ${STATUS_CLASS[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
              <h3 className="text-base font-bold tracking-[-0.01em] leading-tight">{p.title}</h3>
              <p className="text-xs text-sand-100/70 mt-1">
                {p.neighborhood ? `${p.neighborhood} · ` : ""}
                {p.city}
              </p>
              <div className="flex justify-between text-sm mt-4 pt-4 border-t hairline">
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.14em] text-sand-100/50">
                    Valor
                  </p>
                  <p className="font-semibold">{fmtBRL(p.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.62rem] uppercase tracking-[0.14em] text-sand-100/50">
                    Comissão
                  </p>
                  <p className="text-gold-400 font-semibold">{p.commissionPct}%</p>
                </div>
              </div>
              {(p.salesCount > 0 || p.visitsCount > 0) && (
                <p className="text-[0.7rem] text-sand-100/55 mt-3">
                  {p.salesCount > 0 && `${p.salesCount} venda${p.salesCount === 1 ? "" : "s"}`}
                  {p.salesCount > 0 && p.visitsCount > 0 && " · "}
                  {p.visitsCount > 0 && `${p.visitsCount} visita${p.visitsCount === 1 ? "" : "s"}`}
                </p>
              )}
            </button>
          ))
        )}
      </div>

      {openNew && <PropertyModal onClose={() => setOpenNew(false)} />}
      {editing && (
        <PropertyModal property={editing} onClose={() => setOpenEdit(null)} />
      )}
    </>
  );
}

function PropertyModal({
  property,
  onClose
}: {
  property?: Property;
  onClose: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!property;

  const [form, setForm] = useState({
    code: property?.code ?? "",
    title: property?.title ?? "",
    description: property?.description ?? "",
    type: property?.type ?? "Apartamento",
    city: property?.city ?? "",
    neighborhood: property?.neighborhood ?? "",
    addressFull: property?.addressFull ?? "",
    price: property?.price.toString() ?? "",
    commissionPct: property?.commissionPct.toString() ?? "2.5",
    bedrooms: property?.bedrooms?.toString() ?? "",
    bathrooms: property?.bathrooms?.toString() ?? "",
    parkingSpots: property?.parkingSpots?.toString() ?? "",
    areaM2: property?.areaM2?.toString() ?? "",
    status: property?.status ?? "AVAILABLE"
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/properties/${property!.id}`
        : "/api/admin/properties";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: form.code || undefined,
          title: form.title,
          description: form.description || form.title,
          type: form.type,
          city: form.city,
          neighborhood: form.neighborhood || null,
          addressFull: form.addressFull || null,
          price: Number(form.price.replace(/[^0-9,.]/g, "").replace(",", ".")),
          commissionPct: Number(form.commissionPct.replace(",", ".")),
          bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
          parkingSpots: form.parkingSpots ? Number(form.parkingSpots) : null,
          areaM2: form.areaM2 ? Number(form.areaM2.replace(",", ".")) : null,
          status: form.status
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Falha ao salvar.");
      }
      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleStatus(target: PropertyStatus) {
    if (!confirm(`Mudar status para ${STATUS_LABEL[target]}?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/properties/${property!.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: target })
      });
      if (!res.ok) throw new Error();
      startTransition(() => {
        router.refresh();
        onClose();
      });
    } catch {
      setError("Falha ao alterar status.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-app-elevated border hairline rounded-[6px] p-6 md:p-8 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 h-10 w-10 inline-flex items-center justify-center text-sand-100/60 hover:text-sand-50 hover:bg-white/5 rounded-[4px]"
          aria-label="Fechar"
        >
          ✕
        </button>
        <div className="mb-6">
          <p className="text-[0.7rem] uppercase tracking-[0.18em] font-medium text-gold-400/80 mb-1">
            Portfólio
          </p>
          <h2 className="text-2xl font-bold tracking-[-0.024em]">
            {isEdit ? `Editar ${property!.code}` : "Novo imóvel"}
          </h2>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="field-label">Código</label>
              <input
                className="field-input"
                placeholder="Auto-gerado se vazio"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={isEdit}
              />
            </div>
            <div className="md:col-span-2">
              <label className="field-label">Título *</label>
              <input
                className="field-input"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <label className="field-label">Descrição</label>
              <textarea
                className="field-input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Tipo</label>
              <select
                className="field-input"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Apartamento</option>
                <option>Cobertura</option>
                <option>Casa</option>
                <option>Terreno</option>
                <option>Comercial</option>
              </select>
            </div>
            <div>
              <label className="field-label">Cidade *</label>
              <input
                className="field-input"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Bairro</label>
              <input
                className="field-input"
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <label className="field-label">Endereço completo</label>
              <input
                className="field-input"
                value={form.addressFull}
                onChange={(e) => setForm({ ...form, addressFull: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Valor (R$) *</label>
              <input
                className="field-input"
                required
                placeholder="1500000"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Comissão (%)</label>
              <input
                className="field-input"
                placeholder="2.5"
                value={form.commissionPct}
                onChange={(e) => setForm({ ...form, commissionPct: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Status</label>
              <select
                className="field-input"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as PropertyStatus })
                }
              >
                <option value="AVAILABLE">Disponível</option>
                <option value="RESERVED">Reservado</option>
                <option value="SOLD">Vendido</option>
                <option value="OFF_MARKET">Fora do mercado</option>
              </select>
            </div>
            <div>
              <label className="field-label">Suítes</label>
              <input
                className="field-input"
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Banheiros</label>
              <input
                className="field-input"
                type="number"
                min={0}
                value={form.bathrooms}
                onChange={(e) => setForm({ ...form, bathrooms: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Vagas</label>
              <input
                className="field-input"
                type="number"
                min={0}
                value={form.parkingSpots}
                onChange={(e) => setForm({ ...form, parkingSpots: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Área (m²)</label>
              <input
                className="field-input"
                value={form.areaM2}
                onChange={(e) => setForm({ ...form, areaM2: e.target.value })}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-[2px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            {isEdit && property!.status === "AVAILABLE" && (
              <button
                type="button"
                className="btn-base btn-outline"
                style={{ padding: ".65rem 1rem" }}
                onClick={() => toggleStatus("OFF_MARKET")}
              >
                Tirar do mercado
              </button>
            )}
            {isEdit && property!.status === "OFF_MARKET" && (
              <button
                type="button"
                className="btn-base btn-outline"
                style={{ padding: ".65rem 1rem" }}
                onClick={() => toggleStatus("AVAILABLE")}
              >
                Reativar
              </button>
            )}
            <button
              type="button"
              className="btn-base btn-outline"
              style={{ padding: ".65rem 1.1rem" }}
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-base btn-gold"
              style={{ padding: ".65rem 1.25rem" }}
              disabled={submitting}
            >
              {submitting ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar imóvel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
