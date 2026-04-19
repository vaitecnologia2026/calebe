import { createHmac, timingSafeEqual, randomBytes, createCipheriv, createDecipheriv, createHash } from "crypto";

/**
 * Verifica assinatura HMAC-SHA256 enviada no header de webhook.
 * Formato esperado: hex lowercase.
 * Uso:
 *   if (!verifyHmac(raw, signature, secret)) return 401;
 */
export function verifyHmac(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/**
 * Criptografia simétrica AES-256-GCM para dados sensíveis (telefone, tokens).
 * Key: DATA_ENCRYPTION_KEY (base64, 32 bytes).
 * Output: base64("{iv}{authTag}{ciphertext}")
 */
function getKey(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) throw new Error("DATA_ENCRYPTION_KEY não configurada.");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("DATA_ENCRYPTION_KEY deve ter 32 bytes (base64).");
  return key;
}

export function encrypt(plain: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]);
}

export function decrypt(buf: Buffer): string {
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length < 8) return "****";
  const ddd = d.slice(0, 2);
  const last2 = d.slice(-2);
  return `(${ddd}) 9****-**${last2}`;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
