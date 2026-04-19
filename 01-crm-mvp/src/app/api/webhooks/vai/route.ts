import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyHmac } from "@/lib/crypto";
import { vai } from "@/lib/vai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/vai
 * Recebe eventos da VAI (mensagens recebidas, status, etc.)
 * Assinatura via VAI_WEBHOOK_SECRET (HMAC-SHA256 do body).
 */
export async function POST(req: Request) {
  const secret = process.env.VAI_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "VAI webhook desabilitado." }, { status: 503 });

  const raw = await req.text();
  const signature = req.headers.get("x-vai-signature") ?? req.headers.get("x-webhook-signature") ?? "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  if (!verifyHmac(raw, signature, secret)) {
    await db.webhookInboundLog.create({
      data: {
        source: "vai",
        endpoint: "/api/webhooks/vai",
        rawPayload: safeJson(raw),
        signature,
        ipAddress: ip,
        status: "REJECTED",
        errorMessage: "HMAC inválido"
      }
    });
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let body: unknown;
  try { body = JSON.parse(raw); } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const event = vai.webhooks.parseEvent(body);
  if (!event) {
    return NextResponse.json({ error: "Evento não reconhecido." }, { status: 400 });
  }

  const log = await db.webhookInboundLog.create({
    data: {
      source: "vai",
      endpoint: "/api/webhooks/vai",
      rawPayload: body as never,
      signature,
      ipAddress: ip,
      status: "PROCESSING"
    }
  });

  try {
    if (event.type === "message_received") {
      const conversation = await db.conversation.findFirst({
        where: { externalConversationId: event.conversationId }
      });
      if (conversation) {
        await db.message.create({
          data: {
            conversationId: conversation.id,
            externalMessageId: event.message.id,
            direction: "IN",
            type: toMessageType(event.message.type),
            contentText: event.message.content ?? null,
            mediaUrl: event.message.mediaUrl ?? null,
            mediaMimeType: event.message.mediaMimeType ?? null
          }
        });
        await db.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date(), lastSyncAt: new Date() }
        });
      }
    }
    // outros tipos de eventos tratados conforme mapeamento

    await db.webhookInboundLog.update({
      where: { id: log.id },
      data: { status: "PROCESSED", processedAt: new Date() }
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "erro";
    await db.webhookInboundLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: msg, processedAt: new Date() }
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function toMessageType(t: string): "TEXT" | "AUDIO" | "IMAGE" | "VIDEO" | "SYSTEM" {
  switch (t) {
    case "image": return "IMAGE";
    case "audio": return "AUDIO";
    case "video": return "VIDEO";
    case "document": return "SYSTEM";
    default: return "TEXT";
  }
}

function safeJson(s: string): Record<string, unknown> {
  try { return JSON.parse(s) as Record<string, unknown>; } catch { return { _raw: s.slice(0, 2000) }; }
}
