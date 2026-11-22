import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const VERSION = 1;

export function assertAudienceContactCryptoConfigured() {
  decodeKey("AUDIENCE_CONTACT_ENCRYPTION_KEY");
  const lookupKey = process.env.AUDIENCE_CONTACT_LOOKUP_KEY;
  if (!lookupKey || Buffer.byteLength(lookupKey, "utf8") < 32) {
    throw new Error("AUDIENCE_CONTACT_LOOKUP_KEY must be configured with at least 32 characters");
  }
}

function decodeKey(name: string): Buffer {
  const encoded = process.env[name];
  if (!encoded) throw new Error(`${name} is not configured`);
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) throw new Error(`${name} must be a base64-encoded 32-byte key`);
  return key;
}

export function normalizeE164(value: unknown): string {
  if (typeof value !== "string") throw new Error("Phone number must be text");
  const normalized = value.trim().replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error("Phone numbers must use international E.164 format, for example +2348012345678");
  }
  return normalized;
}

export function hashAudiencePhone(phone: string): string {
  const key = process.env.AUDIENCE_CONTACT_LOOKUP_KEY;
  if (!key || Buffer.byteLength(key, "utf8") < 32) {
    throw new Error("AUDIENCE_CONTACT_LOOKUP_KEY must be configured with at least 32 characters");
  }
  return createHmac("sha256", key).update(phone).digest("hex");
}

export function encryptAudiencePhone(phone: string): { ciphertext: string; keyVersion: number } {
  const key = decodeKey("AUDIENCE_CONTACT_ENCRYPTION_KEY");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(phone, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join("."),
    keyVersion: VERSION,
  };
}

export function decryptAudiencePhone(ciphertext: string, keyVersion: number): string {
  if (keyVersion !== VERSION) throw new Error("Unsupported audience contact encryption key version");
  const parts = ciphertext.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted audience contact");
  const [ivPart, tagPart, encryptedPart] = parts;
  const iv = Buffer.from(ivPart, "base64url");
  const tag = Buffer.from(tagPart, "base64url");
  const encrypted = Buffer.from(encryptedPart, "base64url");
  if (iv.length !== 12 || tag.length !== 16 || encrypted.length === 0) {
    throw new Error("Invalid encrypted audience contact");
  }
  const decipher = createDecipheriv("aes-256-gcm", decodeKey("AUDIENCE_CONTACT_ENCRYPTION_KEY"), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
