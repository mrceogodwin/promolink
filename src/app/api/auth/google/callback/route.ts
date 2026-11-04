import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createSession, normalizeEmail } from "@/lib/auth";
export const runtime = "nodejs";
function fail(request: Request, code: string, path = "/login") {
  return NextResponse.redirect(new URL(path + "?error=" + encodeURIComponent(code), request.url));
}
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const store = await cookies();
  const stateCookie = store.get("promolink_google_state")?.value || "";
  const verifier = store.get("promolink_google_pkce")?.value || "";
  store.delete("promolink_google_state");
  store.delete("promolink_google_pkce");
  if (oauthError) return fail(request, "google_cancelled");
  if (!code || !returnedState || !stateCookie || !verifier) return fail(request, "google_invalid_response");
  const [expectedState, requestedRole] = stateCookie.split(":");
  if (!expectedState || returnedState.length !== expectedState.length || returnedState !== expectedState) return fail(request, "google_state_invalid");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret || !process.env.DATABASE_URL) return fail(request, "google_not_configured");
  try {
    const origin = process.env.NEXT_PUBLIC_APP_URL || url.origin;
    const redirectUri = new URL("/api/auth/google/callback", origin).toString();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: verifier }),
      cache: "no-store"
    });
    if (!tokenResponse.ok) return fail(request, "google_token_exchange_failed");
    const tokenData = await tokenResponse.json() as { access_token?: string; token_type?: string };
    if (!tokenData.access_token || tokenData.token_type?.toLowerCase() !== "bearer") return fail(request, "google_token_invalid");
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: "Bearer " + tokenData.access_token }, cache: "no-store"
    });
    if (!profileResponse.ok) return fail(request, "google_profile_failed");
    const profile = await profileResponse.json() as { id?: string; email?: string; verified_email?: boolean; name?: string };
    const googleSub = typeof profile.id === "string" ? profile.id : "";
    const email = typeof profile.email === "string" ? normalizeEmail(profile.email) : "";
    const name = typeof profile.name === "string" ? profile.name.trim().slice(0,120) : "";
    if (!googleSub || !email || profile.verified_email !== true || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(request, "google_email_unverified");
    const sql = neon(process.env.DATABASE_URL);
    let rows = await sql`SELECT id,role,status FROM users WHERE google_sub=${googleSub} LIMIT 1`;
    let user = rows[0] as {id:string;role:string;status:string}|undefined;
    if (!user) {
      const existing = await sql`SELECT id,role,status,google_sub FROM users WHERE email=${email} LIMIT 1`;
      if (existing.length) {
        const account = existing[0] as {id:string;role:string;status:string;google_sub:string|null};
        if (account.google_sub && account.google_sub !== googleSub) return fail(request,"google_account_conflict");
        const linked = await sql`UPDATE users SET google_sub=${googleSub}, updated_at=now() WHERE id=${account.id} AND (google_sub IS NULL OR google_sub=${googleSub}) RETURNING id,role,status`;
        user = linked[0] as typeof user;
      } else {
        if (requestedRole !== "advertiser" && requestedRole !== "audience_owner") return fail(request,"google_account_not_found","/register");
        const created = await sql`INSERT INTO users(name,email,password_hash,google_sub,role) VALUES(${name || email.split("@")[0]},${email},NULL,${googleSub},${requestedRole}) ON CONFLICT(email) DO NOTHING RETURNING id,role,status`;
        user = created[0] as typeof user;
        if (!user) {
          const raced = await sql`SELECT id,role,status,google_sub FROM users WHERE email=${email} LIMIT 1`;
          const account = raced[0] as {id:string;role:string;status:string;google_sub:string|null}|undefined;
          if (!account || (account.google_sub && account.google_sub !== googleSub)) return fail(request,"google_account_conflict");
          const linked = await sql`UPDATE users SET google_sub=${googleSub},updated_at=now() WHERE id=${account.id} AND (google_sub IS NULL OR google_sub=${googleSub}) RETURNING id,role,status`;
          user = linked[0] as typeof user;
        }
      }
    }
    if (!user || user.status !== "active") return fail(request,"account_unavailable");
    await createSession(user.id);
    return NextResponse.redirect(new URL("/dashboard", origin));
  } catch (error) {
    console.error("Google authentication failed", error instanceof Error ? error.message : "unknown error");
    return fail(request,"google_auth_failed");
  }
}
