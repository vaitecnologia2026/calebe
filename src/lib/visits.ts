import { db } from "@/lib/db";

export type VisitRow = {
  id: string;
  scheduledAt: string;
  status: "SCHEDULED" | "CONFIRMED" | "REALIZED" | "NO_SHOW" | "RESCHEDULED";
  adminConfirmed: boolean;
  notes: string | null;
  brokerId: string;
  brokerName: string;
  leadName: string;
  leadPhoneMasked: string;
  propertyCode: string;
  propertyTitle: string;
};

export async function listVisits(where: Record<string, unknown> = {}): Promise<VisitRow[]> {
  const rows = await db.visit.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      broker: { select: { id: true, user: { select: { name: true } } } },
      lead: { select: { fullName: true, phoneMasked: true } },
      property: { select: { code: true, title: true } }
    }
  });

  return rows.map((v) => ({
    id: v.id,
    scheduledAt: v.scheduledAt.toISOString(),
    status: v.status,
    adminConfirmed: v.adminConfirmed,
    notes: v.notes,
    brokerId: v.brokerId,
    brokerName: v.broker.user.name,
    leadName: v.lead.fullName,
    leadPhoneMasked: v.lead.phoneMasked,
    propertyCode: v.property.code,
    propertyTitle: v.property.title
  }));
}

export const VISIT_STATUS_LABEL: Record<VisitRow["status"], string> = {
  SCHEDULED: "Agendada",
  CONFIRMED: "Confirmada",
  REALIZED: "Realizada",
  NO_SHOW: "Não compareceu",
  RESCHEDULED: "Reagendada"
};

export const VISIT_STATUS_CLASS: Record<VisitRow["status"], string> = {
  SCHEDULED: "status-pending",
  CONFIRMED: "status-gold",
  REALIZED: "status-approved",
  NO_SHOW: "status-denied",
  RESCHEDULED: "status-new"
};
