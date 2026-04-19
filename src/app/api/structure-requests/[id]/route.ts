import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["REVIEWING", "APPROVED", "DENIED", "RESCHEDULE", "COMPLETED"]),
  adminResponse: z.string().max(4000).nullable().optional()
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

  const existing = await db.structureRequest.findUnique({
    where: { id },
    select: { id: true, status: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "Solicitação não encontrada." }, { status: 404 });
  }
  if (
    (existing.status === "APPROVED" || existing.status === "DENIED") &&
    body.status !== "COMPLETED"
  ) {
    return NextResponse.json(
      { error: "Solicitação já finalizada — só pode ser concluída." },
      { status: 409 }
    );
  }

  const actorId = session.user.id as string;
  const actorRole = session.user.role as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await db.$transaction(async (tx) => {
    await tx.structureRequest.update({
      where: { id },
      data: {
        status: body.status,
        adminResponse:
          body.adminResponse === undefined ? undefined : body.adminResponse,
        respondedById: actorId,
        respondedAt: new Date()
      }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: actorId,
        actorRole,
        action: `STRUCTURE_${body.status}`,
        entityType: "StructureRequest",
        entityId: id,
        metadata: { from: existing.status, to: body.status },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true });
}
