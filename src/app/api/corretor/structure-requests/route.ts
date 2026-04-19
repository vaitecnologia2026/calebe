import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  type: z.enum(["PLANE", "VEHICLE", "APARTMENT", "ACCOMPANIED_VISIT"]),
  requestedDate: z.string().min(8, "Data obrigatória"),
  requestedTime: z.string().optional(),
  city: z.string().min(2),
  justification: z.string().min(20, "Justificativa precisa ter ao menos 20 caracteres"),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  notes: z.string().optional()
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "BROKER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const broker = await db.broker.findFirst({
    where: { userId: session.user.id },
    select: { id: true }
  });
  if (!broker) {
    return NextResponse.json(
      { error: "Usuário não está vinculado a um cadastro de corretor." },
      { status: 409 }
    );
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

  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const requested = await db.$transaction(async (tx) => {
    const created = await tx.structureRequest.create({
      data: {
        brokerId: broker.id,
        type: body.type,
        requestedDate: new Date(body.requestedDate),
        requestedTime: body.requestedTime || null,
        city: body.city,
        justification: body.justification,
        urgency: body.urgency,
        notes: body.notes || null,
        status: "REQUESTED"
      },
      select: { id: true }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: session.user.id as string,
        actorRole: session.user.role as string,
        action: "STRUCTURE_REQUESTED",
        entityType: "StructureRequest",
        entityId: created.id,
        metadata: { type: body.type, urgency: body.urgency, city: body.city },
        ipAddress,
        userAgent
      }
    });
    return created;
  });

  return NextResponse.json({ ok: true, id: requested.id }, { status: 201 });
}
