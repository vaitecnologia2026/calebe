import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { decrypt } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (
    !session?.user ||
    (session.user.role !== "LEGAL" && session.user.role !== "ADMIN")
  ) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }
  const { id } = await params;

  const legalCase = await db.legalCase.findUnique({
    where: { id },
    select: {
      id: true,
      sale: {
        select: { id: true, clientDataEncrypted: true }
      }
    }
  });
  if (!legalCase) {
    return NextResponse.json({ error: "Processo não encontrado." }, { status: 404 });
  }

  const actorId = session.user.id as string;
  const actorRole = session.user.role as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let clientJson: unknown;
  try {
    const decrypted = decrypt(Buffer.from(legalCase.sale.clientDataEncrypted));
    clientJson = JSON.parse(decrypted);
  } catch (e) {
    await db.auditEvent.create({
      data: {
        actorUserId: actorId,
        actorRole,
        action: "LEGAL_CLIENT_DECRYPT_FAILED",
        entityType: "LegalCase",
        entityId: id,
        metadata: { reason: e instanceof Error ? e.message : "unknown" },
        ipAddress,
        userAgent
      }
    });
    return NextResponse.json(
      {
        error:
          "Não foi possível descriptografar. DATA_ENCRYPTION_KEY mudou entre a criação e agora?"
      },
      { status: 500 }
    );
  }

  await db.auditEvent.create({
    data: {
      actorUserId: actorId,
      actorRole,
      action: "LEGAL_CLIENT_REVEALED",
      entityType: "LegalCase",
      entityId: id,
      metadata: { saleId: legalCase.sale.id },
      ipAddress,
      userAgent
    }
  });

  return NextResponse.json({ client: clientJson });
}
