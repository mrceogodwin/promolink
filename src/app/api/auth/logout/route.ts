import { sameOriginError } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const originError = sameOriginError(request);
    if (originError) return originError;
    await destroySession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Logout failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Could not end session." }, { status: 503 });
  }
}
