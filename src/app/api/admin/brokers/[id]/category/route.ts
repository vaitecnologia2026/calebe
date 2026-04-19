import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  category: z.enum(["BRONZE", "SILVER", "GOLD", "DIAMOND"])
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const { id } = await params;

  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 422 });
  }

  const broker = await db.broker.findUnique({ where: { id }, select: { id: true, category: true } });
  if (!broker) return NextResponse.json({ error: "Corretor não encontrado." }, { status: 404 });
  if (broker.category === body.category) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  await db.$transaction(async (tx) => {
    await tx.broker.update({
      where: { id },
      data: { category: body.category }
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "BROKER_CATEGORY_CHANGED",
        entityType: "Broker",
        entityId: id,
        metadata: { from: broker.category, to: body.category },
        ipAddress,
        userAgent
      }
    });
  });

  return NextResponse.json({ ok: true });
}
