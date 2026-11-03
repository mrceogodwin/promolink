"use client";

import { useEffect, useState } from "react";

type Data = {
  role: string;
  listings?: { total: number; pending: number; approved: number; rejected?: number };
  campaigns?: { total: number; awaiting_review?: number; awaiting_approval?: number; approved?: number; running: number; completed?: number; cancelled?: number };
  audiences?: { available: number };
  users?: { total: number; active: number };
  payments?: { successful: number; pending: number };
  recent: Array<{ action: string; entity_type: string; created_at: string }>;
};

const label = (s: string) => s.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
const date = (s: string) => new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export default function DashboardOverview() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/dashboard/overview", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not load workspace metrics.");
      setData(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load workspace metrics."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  const cards = !data ? [] : data.role === "audience_owner" ? [
    ["Total listings", data.listings?.total ?? 0], ["Awaiting review", data.listings?.pending ?? 0],
    ["Approved listings", data.listings?.approved ?? 0], ["Campaign requests", data.campaigns?.total ?? 0],
    ["Need your approval", data.campaigns?.awaiting_review ?? 0], ["Running campaigns", data.campaigns?.running ?? 0]
  ] : data.role === "advertiser" ? [
    ["Approved audiences", data.audiences?.available ?? 0], ["Your campaigns", data.campaigns?.total ?? 0],
    ["Awaiting owner approval", data.campaigns?.awaiting_approval ?? 0], ["Approved campaigns", data.campaigns?.approved ?? 0],
    ["Running campaigns", data.campaigns?.running ?? 0], ["Completed campaigns", data.campaigns?.completed ?? 0]
  ] : [
    ["Total accounts", data.users?.total ?? 0], ["Active accounts", data.users?.active ?? 0],
    ["Audience listings", data.listings?.total ?? 0], ["Listings awaiting review", data.listings?.pending ?? 0],
    ["Campaigns", data.campaigns?.total ?? 0], ["Campaigns awaiting approval", data.campaigns?.awaiting_approval ?? 0],
    ["Successful payment records", data.payments?.successful ?? 0], ["Pending payment records", data.payments?.pending ?? 0]
  ];

  return <section className="mt-8">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><h2 className="text-lg font-extrabold">Live workspace activity</h2><p className="mt-1 text-xs text-[#718176]">Numbers are read from your PromoLink database.</p></div>
      <button onClick={() => void load()} disabled={loading} className="rounded-lg border border-[#d6e5da] bg-white px-3 py-2 text-xs font-bold text-[#08794e] disabled:opacity-50">{loading ? "Refreshing…" : "Refresh data"}</button>
    </div>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading && !data ? <p className="mt-4 text-sm text-[#718176]">Loading live workspace data…</p> : data && <>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{cards.map(([name, value]) =>
        <article key={name} className="rounded-2xl border border-[#e0ebe3] bg-white p-5">
          <p className="text-xs font-semibold text-[#61746a]">{name}</p>
          <p className="mt-3 text-3xl font-extrabold tracking-tight">{Number(value).toLocaleString()}</p>
        </article>
      )}</div>
      <div className="mt-6 rounded-2xl border border-[#e0ebe3] bg-white p-5">
        <h3 className="font-extrabold">Recent activity</h3>
        {data.recent.length ? <ul className="mt-3 divide-y divide-[#edf2ee]">{data.recent.map((item, i) =>
          <li key={item.action + item.created_at + i} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
            <span className="font-semibold text-[#243c2d]">{label(item.action)}</span>
            <time className="text-xs text-[#718176]">{date(item.created_at)}</time>
          </li>
        )}</ul> : <p className="mt-3 text-sm text-[#718176]">No activity recorded yet. Actions you take will appear here.</p>}
      </div>
      {data.role === "admin" && <p className="mt-3 text-xs leading-5 text-[#718176]">Payment records reflect provider event statuses, not proof of bank settlement. Use the reconciliation workspace for investigation.</p>}
    </>}
  </section>;
}
