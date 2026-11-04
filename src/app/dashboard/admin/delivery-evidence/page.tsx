"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Evidence = {
  id: string; delivery_id: string; evidence_type: string; provider_reference: string | null;
  evidence_fingerprint: string; verification_status: string; created_at: string;
  campaign_id: string; channel: string; delivery_status: string; provider_name: string | null;
};

export default function DeliveryEvidencePage() {
  const [items, setItems] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/delivery-evidence", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load evidence.");
      setItems(data.evidence || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load evidence.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function review(item: Evidence, decision: "verified" | "rejected") {
    const prompt = decision === "verified"
      ? "Confirm that you independently checked this provider reference and the provider evidence proves delivery. This will mark the delivery as delivered."
      : "Confirm that this provider evidence is invalid or does not prove delivery.";
    if (!window.confirm(prompt)) return;
    setBusy(item.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/delivery-evidence", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidence_id: item.id, decision })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Evidence review failed.");
      setNotice(decision === "verified" ? (data.evidence?.delivery_marked_delivered ? "Evidence verified. Delivery marked delivered." : "Evidence verified and recorded.") : "Evidence rejected.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evidence review failed.");
    } finally { setBusy(""); }
  }

  async function settle(item: Evidence) {
    if (!window.confirm("Post the advertiser charge, publisher earning and platform fee for this verified delivery? This is a ledger action and cannot be casually reversed.")) return;
    setBusy(item.id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/publisher-settlements/post", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_id: item.delivery_id })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Settlement could not be posted.");
      setNotice("Settlement posted. Publisher earnings and platform fee were recorded in the ledger.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Settlement could not be posted.");
    } finally { setBusy(""); }
  }

  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard" className="text-sm font-semibold text-[#08794e] hover:underline">← Back to workspace</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Super Admin control</p>
          <h1 className="mt-2 text-3xl font-extrabold">Delivery evidence review</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#61746a]">Verify provider delivery evidence, then post publisher settlements when the configured fee policy and campaign reserve permit.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-[#d6e5da] bg-white px-4 py-2.5 text-sm font-bold text-[#08794e] disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl bg-[#e5f7eb] p-4 text-sm font-semibold text-[#075638]">{notice}</p>}
      <section className="mt-7 space-y-3">
        {loading ? <p className="rounded-2xl border border-[#e0ebe3] bg-white p-6 text-sm text-[#61746a]">Loading provider evidence…</p>
          : items.length === 0 ? <p className="rounded-2xl border border-dashed border-[#cddfd2] bg-white p-8 text-center text-sm text-[#61746a]">No provider evidence awaiting review or settlement.</p>
          : items.map(item => <article key={item.id} className="rounded-2xl border border-[#e0ebe3] bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-[#08794e]">{item.evidence_type.replaceAll("_", " ")}</p>
                <h2 className="mt-1 text-lg font-extrabold">{item.provider_name || "Delivery provider"} · {item.channel}</h2>
                <p className="mt-1 text-xs text-[#718176]">Campaign {item.campaign_id} · Delivery {item.delivery_id}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{item.delivery_status}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-[#718176]">Provider reference</dt><dd className="mt-1 break-all font-semibold">{item.provider_reference || "Not supplied"}</dd></div>
              <div><dt className="text-xs text-[#718176]">Evidence fingerprint</dt><dd className="mt-1 break-all font-mono text-xs">{item.evidence_fingerprint}</dd></div>
              <div><dt className="text-xs text-[#718176]">Received</dt><dd className="mt-1">{new Date(item.created_at).toLocaleString()}</dd></div>
            </dl>
            <p className="mt-4 rounded-xl bg-[#f7faf7] p-3 text-xs leading-5 text-[#61746a]">Before approving, independently confirm this reference against the provider’s authenticated dashboard or signed webhook record. Raw provider payloads are intentionally not displayed here.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.verification_status === "pending" && <>
                <button onClick={() => void review(item, "verified")} disabled={!!busy} className="rounded-xl bg-[#075638] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === item.id ? "Saving…" : "Verify delivery"}</button>
                <button onClick={() => void review(item, "rejected")} disabled={!!busy} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 disabled:opacity-50">Reject evidence</button>
              </>}
              {item.verification_status === "verified" && item.delivery_status === "delivered" && <button onClick={() => void settle(item)} disabled={!!busy} className="rounded-xl border border-[#b8d9c3] bg-[#e5f7eb] px-4 py-2.5 text-sm font-bold text-[#075638] disabled:opacity-50">{busy === item.id ? "Posting…" : "Post publisher settlement"}</button>}
            </div>
          </article>)}
      </section>
    </div>
  </main>;
}
