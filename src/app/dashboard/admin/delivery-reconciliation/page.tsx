"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Item = {
  delivery_id: string; campaign_id: string; channel: string; delivery_status: string;
  lease_expires_at: string | null; updated_at: string; provider: string | null;
  provider_name: string | null; attempt_id: string; attempt_number: number;
  provider_reference: string | null; error_code: string | null; attempt_created_at: string; can_retry_safely: boolean;
};

export default function DeliveryReconciliationPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/delivery-reconciliation", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load reconciliation queue.");
      setItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reconciliation queue.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function reconcile(item: Item) {
    const note = notes[item.delivery_id]?.trim() || "";
    if (!checks[item.delivery_id] || note.length < 12) {
      setError("Check the provider records and enter a meaningful reconciliation note first.");
      return;
    }
    if (!window.confirm("Have you checked the provider dashboard/logs and confirmed that this attempt was NOT accepted or submitted? Only then should it be retried.")) return;
    setBusy(item.delivery_id); setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/delivery-reconciliation", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_id: item.delivery_id, attempt_id: item.attempt_id,
          decision: "confirm_not_submitted_retry", provider_checked: true, note
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Reconciliation failed.");
      setNotice("Reconciliation recorded. The delivery can now be claimed again; no message was sent by this action.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reconciliation failed.");
    } finally { setBusy(""); }
  }

  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard" className="text-sm font-semibold text-[#08794e] hover:underline">← Back to workspace</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Super Admin control</p>
          <h1 className="mt-2 text-3xl font-extrabold">Delivery reconciliation</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#61746a]">Resolve uncertain provider outcomes before any retry. An unknown result is never automatically resent.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-[#d6e5da] bg-white px-4 py-2.5 text-sm font-bold text-[#08794e] disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl bg-[#e5f7eb] p-4 text-sm font-semibold text-[#075638]">{notice}</p>}
      <section className="mt-7 space-y-4">
        {loading ? <p className="rounded-2xl border border-[#e0ebe3] bg-white p-6 text-sm text-[#61746a]">Loading uncertain deliveries…</p>
          : items.length === 0 ? <p className="rounded-2xl border border-dashed border-[#cddfd2] bg-white p-8 text-center text-sm text-[#61746a]">No unknown provider outcomes need reconciliation.</p>
          : items.map(item => <article key={item.delivery_id} className="rounded-2xl border border-amber-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Manual provider check required</p>
                <h2 className="mt-1 text-lg font-extrabold">{item.provider_name || item.provider || "Delivery provider"} · {item.channel}</h2>
                <p className="mt-1 text-xs text-[#718176]">Campaign {item.campaign_id} · Delivery {item.delivery_id}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">Unknown · Attempt {item.attempt_number}</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-[#718176]">Attempt ID</dt><dd className="mt-1 break-all font-mono text-xs">{item.attempt_id}</dd></div>
              <div><dt className="text-xs text-[#718176]">Provider reference</dt><dd className="mt-1 break-all font-semibold">{item.provider_reference || "Not returned"}</dd></div>
              <div><dt className="text-xs text-[#718176]">Last updated</dt><dd className="mt-1">{new Date(item.updated_at).toLocaleString()}</dd></div>
              <div><dt className="text-xs text-[#718176]">Lease expiry</dt><dd className="mt-1">{item.lease_expires_at ? new Date(item.lease_expires_at).toLocaleString() : "No active lease"}</dd></div>
            </dl>
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              Do not retry just because the worker timed out. First inspect the provider dashboard or logs using the campaign/attempt details. If the provider accepted the message, resolve it through authenticated provider evidence instead.
            </div>
            {!item.can_retry_safely && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">Retry is locked: wait for the worker lease to expire and ensure no provider reference was returned. Check the provider before proceeding.</p>}
            <label className="mt-4 flex items-start gap-3 text-sm font-semibold">
              <input type="checkbox" checked={!!checks[item.delivery_id]} onChange={e => setChecks(prev => ({ ...prev, [item.delivery_id]: e.target.checked }))} className="mt-1 h-4 w-4" />
              I checked the provider records and confirmed this attempt was not accepted or submitted.
            </label>
            <textarea value={notes[item.delivery_id] || ""} onChange={e => setNotes(prev => ({ ...prev, [item.delivery_id]: e.target.value }))} rows={3} maxLength={500} placeholder="Record what provider records you checked and why retry is safe…" className="mt-3 w-full rounded-xl border border-[#d6e5da] p-3 text-sm outline-none focus:border-[#08794e]" />
            <button onClick={() => void reconcile(item)} disabled={!!busy || !item.can_retry_safely || !checks[item.delivery_id] || (notes[item.delivery_id] || "").trim().length < 12} className="mt-3 rounded-xl bg-[#075638] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === item.delivery_id ? "Recording…" : "Confirm not submitted & allow retry"}</button>
          </article>)}
      </section>
    </div>
  </main>;
}
