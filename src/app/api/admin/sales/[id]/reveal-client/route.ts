import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const { id } = await params;

  const sale = await db.sale.findUnique({
    where: { id },
    select: { id: true, clientDataEncrypted: true }
  });
  if (!sale) return NextResponse.json({ error: "Venda não encontrada." }, { status: 404 });

  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let clientJson: unknown;
  try {
    clientJson = JSON.parse(decrypt(Buffer.from(sale.clientDataEncrypted)));
  } catch (e) {
    await db.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "ADMIN_SALE_CLIENT_DECRYPT_FAILED",
        entityType: "Sale",
        entityId: sale.id,
        metadata: { reason: e instanceof Error ? e.message : "unknown" },
        ipAddress,
        userAgent
      }
    });
    return NextResponse.json(
      { error: "Não foi possível descriptografar. DATA_ENCRYPTION_KEY configurada?" },
      { status: 500 }
    );
  }

  await db.auditEvent.create({
    data: {
      actorUserId: adminId,
      actorRole: "ADMIN",
      action: "ADMIN_SALE_CLIENT_REVEALED",
      entityType: "Sale",
      entityId: sale.id,
      metadata: {},
      ipAddress,
      userAgent
    }
  });

  return NextResponse.json({ client: clientJson });
}
