"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return <button onClick={logout} disabled={busy} className="rounded-lg border border-[#cbded1] bg-[#f0f8f2] px-4 py-2 text-sm font-bold text-[#075638] hover:border-[#08794e] hover:bg-[#e5f7eb] disabled:opacity-50">{busy ? "Signing out…" : "Log out"}</button>;
}
