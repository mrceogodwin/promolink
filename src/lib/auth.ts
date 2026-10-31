import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { neon } from "@neondatabase/serverless";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "promolink_session";
const SESSION_DAYS = 14;

export type UserRole = "audience_owner" | "advertiser" | "admin";
export type SessionUser = { id: string; name: string; email: string; role: UserRole; status: string };

function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");
  return neon(url);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function consumeRateLimit(scope: string, identifier: string, maxAttempts: number, windowSeconds: number) {
  const sql = database();
  const bucketKey = createHash("sha256").update(scope + ":" + identifier).digest("hex");
  const rows = await sql`
    INSERT INTO auth_rate_limits (bucket_key, window_started_at, attempts, updated_at)
    VALUES (${bucketKey}, now(), 1, now())
    ON CONFLICT (bucket_key) DO UPDATE SET
      attempts = CASE WHEN auth_rate_limits.window_started_at <= now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE auth_rate_limits.attempts + 1 END,
      window_started_at = CASE WHEN auth_rate_limits.window_started_at <= now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE auth_rate_limits.window_started_at END,
      updated_at = now()
    RETURNING attempts
  `;
  return Number(rows[0]?.attempts ?? maxAttempts + 1) <= maxAttempts;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, expectedHex] = stored.split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const sql = database();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await sql`INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (${userId}, ${hashToken(token)}, ${expiresAt.toISOString()})`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const sql = database();
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.role, u.status
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > now()
    LIMIT 1
  `;
  const user = rows[0] as SessionUser | undefined;
  return user?.status === "active" ? user : null;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const sql = database();
    await sql`DELETE FROM sessions WHERE token_hash = ${hashToken(token)}`;
  }
  cookieStore.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}
