import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["PENDING", "REVIEWING", "APPROVED", "PAID", "BLOCKED"]),
  notes: z.string().max(2000).nullable().optional(),
  receiptUrl: z.string().max(500).nullable().optional(),
  dueDate: z.string().nullable().optional()
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
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 422 });
  }

  const existing = await db.commission.findUnique({
    where: { id },
    select: { id: true, status: true }
  });
  if (!existing) {
    return NextResponse.json({ error: "Comissão não encontrada." }, { status: 404 });
  }
  if (existing.status === "PAID" && body.status !== "PAID") {
    return NextResponse.json(
      { error: "Comissão já paga não pode ser alterada." },
      { status: 409 }
    );
  }

  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  const dueDate = body.dueDate ? new Date(body.dueDate) : null;

  await db.$transaction(async (tx) => {
    await tx.commission.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes === undefined ? undefined : body.notes,
        receiptUrl: body.receiptUrl === undefined ? undefined : body.receiptUrl,
        dueDate: body.dueDate === undefined ? undefined : dueDate,
        paidAt:
          body.status === "PAID"
            ? existing.status === "PAID"
              ? undefined
              : new Date()
            : null
      }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: `COMMISSION_${body.status}`,
        entityType: "Commission",
        entityId: id,
        metadata: { from: existing.status, to: body.status },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true });
}
