/**
 * Espelhos mínimos dos tipos expostos pela VAI.
 * Atualize conforme a spec real em https://api.vaicrm.com.br/docs#
 */

export type VaiContact = {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type VaiConversation = {
  id: string;
  contactId: string;
  status?: "open" | "closed" | "paused";
  lastMessageAt?: string;
  metadata?: Record<string, unknown>;
};

export type VaiMessageDirection = "incoming" | "outgoing";
export type VaiMessageType = "text" | "image" | "audio" | "video" | "document";

export type VaiMessage = {
  id: string;
  conversationId: string;
  contactId?: string;
  direction: VaiMessageDirection;
  type: VaiMessageType;
  content?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  status?: "sent" | "delivered" | "read" | "failed";
  timestamp?: string;
};

export type VaiSendTextInput = {
  conversationId?: string;
  contactId?: string;
  phone?: string;
  text: string;
};

export type VaiSendMediaInput = {
  conversationId?: string;
  contactId?: string;
  phone?: string;
  mediaUrl: string;
  mediaType: "image" | "audio" | "video" | "document";
  caption?: string;
};

export type VaiWebhookEvent =
  | { type: "message_received"; conversationId: string; contactId: string; message: VaiMessage }
  | { type: "message_status"; messageId: string; status: VaiMessage["status"] }
  | { type: "conversation_updated"; conversationId: string; status: VaiConversation["status"] };
