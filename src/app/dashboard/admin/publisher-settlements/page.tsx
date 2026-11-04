"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Summary = { currency: string; settlement_count: number; gross_minor: string; platform_fee_minor: string; publisher_amount_minor: string };
type Row = { id: string; delivery_id: string; campaign_id: string; gross_amount_minor: string; platform_fee_minor: string; publisher_amount_minor: string; currency: string; fee_policy_bps: number; created_at: string; publisher_email: string };
type Data = { policy: { platform_fee_bps: number | null; currency: string; enabled: boolean; updated_at: string } | null; totals: Summary[]; recent: Row[] };
const amount = (minor: string, currency: string) => new Intl.NumberFormat("en-NG", { style: "currency", currency: currency.trim(), maximumFractionDigits: 2 }).format(Number(minor) / 100);

export default function PublisherSettlementsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/publisher-settlements", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Could not load settlements.");
      setData(json);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load settlements."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/dashboard" className="text-sm font-semibold text-[#08794e]">← Back to workspace</Link>
    <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Super Admin finance</p><h1 className="mt-2 text-3xl font-extrabold">Publisher settlements</h1><p className="mt-2 text-sm text-[#61746a]">Read-only settlement ledger and platform fee policy status.</p></div><button onClick={() => void load()} disabled={loading} className="rounded-xl border border-[#d6e5da] bg-white px-4 py-2.5 text-sm font-bold text-[#08794e] disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button></div>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    {loading ? <p className="mt-8 text-sm text-[#61746a]">Loading settlement records…</p> : data && <>
      <section className="mt-6 rounded-2xl border border-[#e0ebe3] bg-white p-5"><h2 className="font-extrabold">Commission policy</h2><div className="mt-3 flex flex-wrap items-center gap-3"><span className={data.policy?.enabled ? "rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800"}>{data.policy?.enabled ? "Enabled" : "Disabled"}</span><span className="text-sm text-[#61746a]">{data.policy?.platform_fee_bps == null ? "No commission configured" : (data.policy.platform_fee_bps / 100) + "% platform fee"}{data.policy ? " · " + data.policy.currency : ""}</span></div><p className="mt-3 text-xs leading-5 text-[#718176]">This page does not change the commission or initiate payouts. Fee policy changes require a separately audited admin action.</p></section>
      <section className="mt-8"><h2 className="mb-4 text-lg font-extrabold">Settlement totals</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.totals.map(item => <article key={item.currency} className="rounded-2xl border border-[#e0ebe3] bg-white p-5"><p className="text-xs font-bold text-[#61746a]">{item.currency} · {item.settlement_count} settlements</p><p className="mt-4 text-xs text-[#718176]">Gross campaign spend</p><p className="mt-1 text-xl font-extrabold">{amount(item.gross_minor, item.currency)}</p><p className="mt-3 text-xs text-[#718176]">Platform fees</p><p className="mt-1 font-bold">{amount(item.platform_fee_minor, item.currency)}</p><p className="mt-3 text-xs text-[#718176]">Publisher earnings</p><p className="mt-1 font-bold">{amount(item.publisher_amount_minor, item.currency)}</p></article>)}</div>{data.totals.length === 0 && <p className="rounded-xl border border-dashed border-[#cddfd2] bg-white p-6 text-sm text-[#61746a]">No settlements have been posted.</p>}</section>
      <section className="mt-8"><h2 className="mb-4 text-lg font-extrabold">Recent settlements</h2><div className="overflow-x-auto rounded-2xl border border-[#e0ebe3] bg-white"><table className="w-full min-w-[780px] text-left text-sm"><thead><tr className="border-b border-[#e8efe9] text-xs text-[#61746a]"><th className="px-4 py-3">Publisher</th><th className="px-4 py-3">Gross</th><th className="px-4 py-3">Platform fee</th><th className="px-4 py-3">Publisher amount</th><th className="px-4 py-3">Fee rate</th><th className="px-4 py-3">Date</th></tr></thead><tbody>{data.recent.map(row => <tr key={row.id} className="border-b border-[#f0f4f1]"><td className="px-4 py-3">{row.publisher_email}</td><td className="px-4 py-3">{amount(row.gross_amount_minor, row.currency)}</td><td className="px-4 py-3">{amount(row.platform_fee_minor, row.currency)}</td><td className="px-4 py-3 font-bold">{amount(row.publisher_amount_minor, row.currency)}</td><td className="px-4 py-3">{(row.fee_policy_bps / 100).toFixed(2)}%</td><td className="px-4 py-3">{new Date(row.created_at).toLocaleString()}</td></tr>)}</tbody></table>{data.recent.length === 0 && <p className="p-5 text-sm text-[#61746a]">No settlement records yet.</p>}</div></section>
    </>}
  </div></main>;
}
