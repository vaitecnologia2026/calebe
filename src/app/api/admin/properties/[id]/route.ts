import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(3).max(2000).optional(),
  type: z.string().min(2).max(30).optional(),
  city: z.string().min(2).max(80).optional(),
  neighborhood: z.string().max(80).nullable().optional(),
  addressFull: z.string().max(300).nullable().optional(),
  price: z.number().positive().optional(),
  commissionPct: z.number().min(0).max(100).optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().int().min(0).nullable().optional(),
  parkingSpots: z.number().int().min(0).nullable().optional(),
  areaM2: z.number().positive().nullable().optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "OFF_MARKET"]).optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const { id } = await params;

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message ?? "Dados inválidos." },
        { status: 422 }
      );
    }
    return NextResponse.json({ error: "Payload inválido." }, { status: 422 });
  }

  const existing = await db.property.findUnique({
    where: { id },
    select: { id: true, code: true, status: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "Imóvel não encontrado." }, { status: 404 });
  }

  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await db.$transaction(async (tx) => {
    await tx.property.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        city: body.city,
        neighborhood: body.neighborhood === undefined ? undefined : body.neighborhood,
        addressFull: body.addressFull === undefined ? undefined : body.addressFull,
        price: body.price,
        commissionPct: body.commissionPct,
        bedrooms: body.bedrooms === undefined ? undefined : body.bedrooms,
        bathrooms: body.bathrooms === undefined ? undefined : body.bathrooms,
        parkingSpots: body.parkingSpots === undefined ? undefined : body.parkingSpots,
        areaM2: body.areaM2 === undefined ? undefined : body.areaM2,
        status: body.status
      }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: body.status ? `PROPERTY_${body.status}` : "PROPERTY_UPDATED",
        entityType: "Property",
        entityId: id,
        metadata: {
          code: existing.code,
          from: existing.status,
          to: body.status ?? existing.status
        },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true });
}
