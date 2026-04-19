/**
 * Fachada do service layer da VAI.
 *
 * IMPORTANTE: os paths abaixo (ex. "/v1/contacts") são PLACEHOLDERS
 * baseados em convenção REST. Ao obter acesso à documentação oficial
 * (https://api.vaicrm.com.br/docs#), ajuste apenas aqui — o resto do
 * sistema consome essa fachada e não precisa mudar.
 */

import { vaiRequest } from "./client";
import type {
  VaiContact,
  VaiConversation,
  VaiMessage,
  VaiSendTextInput,
  VaiSendMediaInput,
  VaiWebhookEvent
} from "./types";

export * from "./types";
export { VaiApiError, vaiRequest } from "./client";

export const vai = {
  contacts: {
    async create(input: { name: string; phone: string; email?: string }): Promise<VaiContact> {
      return vaiRequest<VaiContact>("/v1/contacts", { method: "POST", body: input });
    },
    async get(contactId: string): Promise<VaiContact> {
      return vaiRequest<VaiContact>(`/v1/contacts/${contactId}`);
    },
    async update(contactId: string, patch: Partial<VaiContact>): Promise<VaiContact> {
      return vaiRequest<VaiContact>(`/v1/contacts/${contactId}`, { method: "PATCH", body: patch });
    }
  },

  conversations: {
    async list(params: { contactId?: string; status?: string; page?: number } = {}): Promise<VaiConversation[]> {
      return vaiRequest<VaiConversation[]>("/v1/conversations", { query: params });
    },
    async get(conversationId: string): Promise<VaiConversation> {
      return vaiRequest<VaiConversation>(`/v1/conversations/${conversationId}`);
    },
    async updateStatus(conversationId: string, status: "open" | "closed" | "paused"): Promise<VaiConversation> {
      return vaiRequest<VaiConversation>(`/v1/conversations/${conversationId}`, {
        method: "PATCH",
        body: { status }
      });
    }
  },

  messages: {
    async listByConversation(conversationId: string, params: { page?: number; limit?: number } = {}): Promise<VaiMessage[]> {
      return vaiRequest<VaiMessage[]>(`/v1/conversations/${conversationId}/messages`, { query: params });
    },
    async sendText(input: VaiSendTextInput): Promise<VaiMessage> {
      return vaiRequest<VaiMessage>("/v1/messages", {
        method: "POST",
        body: { ...input, type: "text" }
      });
    },
    async sendMedia(input: VaiSendMediaInput): Promise<VaiMessage> {
      return vaiRequest<VaiMessage>("/v1/messages", {
        method: "POST",
        body: { ...input, type: input.mediaType }
      });
    }
  },

  webhooks: {
    /** Parse inbound event — adapte conforme payload real da VAI. */
    parseEvent(raw: unknown): VaiWebhookEvent | null {
      if (!raw || typeof raw !== "object") return null;
      const obj = raw as Record<string, unknown>;
      const type = obj.type ?? obj.event;
      if (type === "message_received" || type === "message.received") {
        return {
          type: "message_received",
          conversationId: String(obj.conversationId ?? obj.conversation_id ?? ""),
          contactId: String(obj.contactId ?? obj.contact_id ?? ""),
          message: obj.message as VaiMessage
        };
      }
      if (type === "message_status" || type === "message.status") {
        return {
          type: "message_status",
          messageId: String(obj.messageId ?? obj.message_id ?? ""),
          status: (obj.status as VaiMessage["status"]) ?? "sent"
        };
      }
      if (type === "conversation_updated" || type === "conversation.updated") {
        return {
          type: "conversation_updated",
          conversationId: String(obj.conversationId ?? obj.conversation_id ?? ""),
          status: obj.status as VaiConversation["status"]
        };
      }
      return null;
    }
  }
};
