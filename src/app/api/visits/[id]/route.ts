import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["SCHEDULED", "CONFIRMED", "REALIZED", "NO_SHOW", "RESCHEDULED"]),
  notes: z.string().max(2000).nullable().optional(),
  scheduledAt: z.string().optional()
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "SECRETARY")
  ) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const { id } = await params;

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 422 });
  }

  const existing = await db.visit.findUnique({
    where: { id },
    select: { id: true, status: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "Visita não encontrada." }, { status: 404 });
  }

  const actorId = session.user.id as string;
  const actorRole = session.user.role as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const isConfirmation = body.status === "CONFIRMED" || body.status === "REALIZED";

  await db.$transaction(async (tx) => {
    await tx.visit.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes === undefined ? undefined : body.notes,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        adminConfirmed: isConfirmation ? true : undefined,
        adminConfirmedById: isConfirmation ? actorId : undefined,
        adminConfirmedAt: isConfirmation ? new Date() : undefined
      }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: actorId,
        actorRole,
        action: `VISIT_${body.status}`,
        entityType: "Visit",
        entityId: id,
        metadata: { from: existing.status, to: body.status },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true });
}
