import { NextResponse } from "next/server";

/**
 * Reject browser-originated mutations from a different origin.
 * The Paystack webhook intentionally does not use this helper; it authenticates
 * provider requests with the signed raw-body HMAC instead.
 */
export function sameOriginError(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return NextResponse.json({ error: "A valid same-origin request is required." }, { status: 403 });
  try {
    const requestOrigin = new URL(request.url).origin;
    if (new URL(origin).origin !== requestOrigin) {
      return NextResponse.json({ error: "Cross-origin requests are not allowed." }, { status: 403 });
    }
    return null;
  } catch {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
}
