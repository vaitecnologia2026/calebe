import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().min(2).max(30).optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(3).max(2000),
  type: z.string().min(2).max(30),
  city: z.string().min(2).max(80),
  neighborhood: z.string().max(80).nullable().optional(),
  addressFull: z.string().max(300).nullable().optional(),
  price: z.number().positive(),
  commissionPct: z.number().min(0).max(100),
  bedrooms: z.number().int().min(0).nullable().optional(),
  bathrooms: z.number().int().min(0).nullable().optional(),
  parkingSpots: z.number().int().min(0).nullable().optional(),
  areaM2: z.number().positive().nullable().optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "OFF_MARKET"]).default("AVAILABLE")
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

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
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const code =
    body.code && body.code.length >= 2
      ? body.code
      : `CAL-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const existing = await db.property.findUnique({ where: { code }, select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: `Código ${code} já existe.` },
      { status: 409 }
    );
  }

  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const created = await db.$transaction(async (tx) => {
    const p = await tx.property.create({
      data: {
        code,
        title: body.title,
        description: body.description,
        type: body.type,
        city: body.city,
        neighborhood: body.neighborhood ?? null,
        addressFull: body.addressFull ?? null,
        price: body.price,
        commissionPct: body.commissionPct,
        bedrooms: body.bedrooms ?? null,
        bathrooms: body.bathrooms ?? null,
        parkingSpots: body.parkingSpots ?? null,
        areaM2: body.areaM2 ?? null,
        status: body.status
      },
      select: { id: true, code: true }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "PROPERTY_CREATED",
        entityType: "Property",
        entityId: p.id,
        metadata: { code: p.code, price: body.price, city: body.city },
        ipAddress,
        userAgent
      }
    });
    return p;
  });

  return NextResponse.json({ ok: true, id: created.id, code: created.code }, { status: 201 });
}
