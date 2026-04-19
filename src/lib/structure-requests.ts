import { db } from "@/lib/db";

export type StructureRequestRow = {
  id: string;
  type: "PLANE" | "VEHICLE" | "APARTMENT" | "ACCOMPANIED_VISIT";
  status: "REQUESTED" | "REVIEWING" | "APPROVED" | "DENIED" | "RESCHEDULE" | "COMPLETED";
  requestedDate: string;
  requestedTime: string | null;
  city: string;
  justification: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  notes: string | null;
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  brokerName: string;
  brokerId: string;
};

type Where = Record<string, unknown>;

export async function listStructureRequests(where: Where = {}): Promise<StructureRequestRow[]> {
  const rows = await db.structureRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      broker: { select: { id: true, user: { select: { name: true } } } }
    }
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    status: r.status,
    requestedDate: r.requestedDate.toISOString(),
    requestedTime: r.requestedTime,
    city: r.city,
    justification: r.justification,
    urgency: r.urgency,
    notes: r.notes,
    adminResponse: r.adminResponse,
    respondedAt: r.respondedAt ? r.respondedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    brokerName: r.broker.user.name,
    brokerId: r.broker.id
  }));
}

export const STRUCTURE_TYPE_LABEL: Record<StructureRequestRow["type"], string> = {
  PLANE: "Avião",
  VEHICLE: "Veículo",
  APARTMENT: "Apartamento",
  ACCOMPANIED_VISIT: "Visita acompanhada"
};

export const STRUCTURE_STATUS_LABEL: Record<StructureRequestRow["status"], string> = {
  REQUESTED: "Solicitada",
  REVIEWING: "Em análise",
  APPROVED: "Aprovada",
  DENIED: "Negada",
  RESCHEDULE: "Reagendar",
  COMPLETED: "Concluída"
};

export const URGENCY_LABEL: Record<StructureRequestRow["urgency"], string> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta"
};
