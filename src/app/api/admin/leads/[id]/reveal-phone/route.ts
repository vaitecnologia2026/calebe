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

  const lead = await db.lead.findUnique({
    where: { id },
    select: { id: true, phoneEncrypted: true, phoneMasked: true }
  });
  if (!lead) return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });

  const adminId = session.user.id as string;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;
  const userAgent = req.headers.get("user-agent") ?? null;

  let phone: string;
  try {
    phone = decrypt(Buffer.from(lead.phoneEncrypted));
  } catch (e) {
    await db.auditEvent.create({
      data: {
        actorUserId: adminId,
        actorRole: "ADMIN",
        action: "LEAD_PHONE_DECRYPT_FAILED",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { reason: e instanceof Error ? e.message : "unknown" },
        ipAddress,
        userAgent
      }
    });
    return NextResponse.json(
      {
        error:
          "Não foi possível descriptografar. Configure DATA_ENCRYPTION_KEY (32 bytes base64) nas env vars do Vercel."
      },
      { status: 500 }
    );
  }

  await db.auditEvent.create({
    data: {
      actorUserId: adminId,
      actorRole: "ADMIN",
      action: "LEAD_PHONE_DECRYPTED",
      entityType: "Lead",
      entityId: lead.id,
      metadata: { masked: lead.phoneMasked },
      ipAddress,
      userAgent
    }
  });

  return NextResponse.json({ phone });
}
