import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyHmac, sha256Hex, encrypt, maskPhone, normalizePhone } from "@/lib/crypto";
import { distributeLead } from "@/server/leads/distribute";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Payload genérico de lead externo (ajustável por provider).
 * Campos mínimos: source, name, phone.
 */
const leadSchema = z.object({
  source: z.string().min(1).max(80),
  external_id: z.string().max(120).optional(),
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  city: z.string().max(80).optional(),
  budget: z.string().max(60).optional(),
  interest_type: z.string().max(60).optional(),
  campaign: z.string().max(120).optional(),
  campaign_id: z.string().max(120).optional(),
  utm_source: z.string().max(80).optional(),
  utm_medium: z.string().max(80).optional(),
  utm_campaign: z.string().max(120).optional(),
  raw: z.record(z.string(), z.unknown()).optional()
});

/**
 * POST /api/webhooks/leads
 *
 * Headers esperados:
 *   X-Webhook-Signature: sha256 hex do body raw usando WEBHOOK_LEADS_SECRET
 *   Content-Type: application/json
 *
 * Responde 202 Accepted (RECEIVED) ou 422 (payload inválido) / 401 (assinatura).
 * Processamento é síncrono no MVP; mover para queue se volume crescer.
 */
export async function POST(req: Request) {
  const secret = process.env.WEBHOOK_LEADS_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook desabilitado." }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  if (!verifyHmac(raw, signature, secret)) {
    await db.webhookInboundLog.create({
      data: {
        source: "unknown",
        endpoint: "/api/webhooks/leads",
        rawPayload: safeParse(raw) as never,
        signature,
        ipAddress: ip,
        status: "REJECTED",
        errorMessage: "HMAC inválido"
      }
    });
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    await db.webhookInboundLog.create({
      data: {
        source: "unknown",
        endpoint: "/api/webhooks/leads",
        rawPayload: body as never,
        signature,
        ipAddress: ip,
        status: "REJECTED",
        errorMessage: "Schema inválido"
      }
    });
    return NextResponse.json({ error: "Payload inválido.", issues: parsed.error.issues }, { status: 422 });
  }

  const data = parsed.data;
  const idempotencyKey = sha256Hex(`${data.source}::${data.external_id ?? normalizePhone(data.phone)}`);

  // Já processado antes? (deduplication)
  const existing = await db.webhookInboundLog.findUnique({
    where: { idempotencyKey },
    select: { id: true, resultingLeadId: true }
  });
  if (existing) {
    return NextResponse.json(
      { accepted: true, deduplicated: true, leadId: existing.resultingLeadId },
      { status: 200 }
    );
  }

  // 1) Salva raw em log (append-only)
  const log = await db.webhookInboundLog.create({
    data: {
      source: data.source,
      endpoint: "/api/webhooks/leads",
      rawPayload: body as never,
      signature,
      ipAddress: ip,
      idempotencyKey,
      status: "PROCESSING"
    }
  });

  try {
    const phoneNorm = normalizePhone(data.phone);
    const phoneHash = sha256Hex(phoneNorm);
    const phoneEncrypted = encrypt(phoneNorm);
    const phoneMasked = maskPhone(phoneNorm);

    // Upsert lead por phoneHash (dedup natural)
    const lead = await db.lead.upsert({
      where: { idempotencyKey },
      create: {
        idempotencyKey,
        fullName: data.name,
        maskedName: buildMaskedName(data.name),
        phoneEncrypted,
        phoneHash,
        phoneMasked,
        email: data.email,
        source: data.source,
        city: data.city,
        budgetRange: data.budget,
        interestType: data.interest_type,
        campaign: data.campaign,
        campaignId: data.campaign_id,
        utmSource: data.utm_source,
        utmMedium: data.utm_medium,
        utmCampaign: data.utm_campaign,
        externalSource: data.source,
        webhookLogId: log.id
      },
      update: {} // idempotência — não atualiza se já existe
    });

    // 2) Distribui
    const assignment = await distributeLead(lead.id);

    // 3) Auditoria
    await db.auditEvent.create({
      data: {
        action: "LEAD_WEBHOOK_PROCESSED",
        entityType: "Lead",
        entityId: lead.id,
        metadata: {
          source: data.source,
          assignedBrokerId: assignment.brokerId ?? null,
          campaign: data.campaign ?? null
        },
        ipAddress: ip
      }
    });

    await db.webhookInboundLog.update({
      where: { id: log.id },
      data: { status: "PROCESSED", processedAt: new Date(), resultingLeadId: lead.id }
    });

    return NextResponse.json(
      {
        accepted: true,
        leadId: lead.id,
        assignedBrokerId: assignment.brokerId,
        queued: assignment.brokerId == null
      },
      { status: 202 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    await db.webhookInboundLog.update({
      where: { id: log.id },
      data: { status: "FAILED", errorMessage: msg, processedAt: new Date() }
    });
    return NextResponse.json({ error: "Falha no processamento.", detail: msg }, { status: 500 });
  }
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { _raw: raw.slice(0, 2000) };
  }
}

function buildMaskedName(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  return `${parts[0]} ${last[0]}.`;
}
