"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Payment = {
  id: string; provider: string; provider_reference: string; campaign_id: string | null;
  user_id: string; amount_minor: string; currency: string; status: string;
  created_at: string; updated_at: string; campaign_title: string | null; advertiser_email: string | null;
};
const money = (amount: string, currency: string) => new Intl.NumberFormat("en-NG", {
  style: "currency", currency: currency.trim(), maximumFractionDigits: 2
}).format(Number(amount) / 100);

export default function PaymentReviewPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/payment-review", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load payment exceptions.");
      setItems(data.payments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load payment exceptions.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/dashboard" className="text-sm font-semibold text-[#08794e] hover:underline">← Back to workspace</Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Super Admin control</p>
          <h1 className="mt-2 text-3xl font-extrabold">Payment exceptions</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#61746a]">Successful provider charges that did not match the expected amount or currency. Verify each transaction directly with Paystack before taking any financial action.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-[#d6e5da] bg-white px-4 py-2.5 text-sm font-bold text-[#08794e] disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>
      </div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        This screen is intentionally read-only. Do not mark a charge funded, failed or refunded based only on this record. Confirm the provider transaction, settlement and campaign state first; a dedicated audited resolution workflow is still required.
      </div>
      <section className="mt-6 space-y-3">
        {loading ? <p className="rounded-2xl border border-[#e0ebe3] bg-white p-6 text-sm text-[#61746a]">Loading payment exceptions…</p>
          : items.length === 0 ? <p className="rounded-2xl border border-dashed border-[#cddfd2] bg-white p-8 text-center text-sm text-[#61746a]">No payment exceptions are awaiting review.</p>
          : items.map(item => <article key={item.id} className="rounded-2xl border border-amber-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-wide text-amber-700">Manual review required</p><h2 className="mt-1 text-lg font-extrabold">{item.campaign_title || "Campaign payment"}</h2><p className="mt-1 text-xs text-[#718176]">{item.advertiser_email || item.user_id}</p></div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">Needs review</span>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div><dt className="text-xs text-[#718176]">Recorded amount</dt><dd className="mt-1 font-bold">{money(item.amount_minor, item.currency)}</dd></div>
              <div><dt className="text-xs text-[#718176]">Provider</dt><dd className="mt-1 font-semibold">{item.provider}</dd></div>
              <div><dt className="text-xs text-[#718176]">Created</dt><dd className="mt-1">{new Date(item.created_at).toLocaleString()}</dd></div>
              <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs text-[#718176]">Provider reference</dt><dd className="mt-1 break-all font-mono text-xs">{item.provider_reference}</dd></div>
              <div><dt className="text-xs text-[#718176]">Payment event</dt><dd className="mt-1 break-all font-mono text-xs">{item.id}</dd></div>
              <div><dt className="text-xs text-[#718176]">Campaign ID</dt><dd className="mt-1 break-all font-mono text-xs">{item.campaign_id || "—"}</dd></div>
            </dl>
          </article>)}
      </section>
    </div>
  </main>;
}
