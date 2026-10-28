"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Activity = { id: string; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown>; created_at: string; actor_name?: string; actor_email?: string };
export default function ActivityPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/activity").then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Could not load activity.");
      if (active) setItems(data.activity || []);
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Could not load activity."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/dashboard" className="text-sm font-semibold text-[#08794e] hover:underline">← Back to workspace</Link>
    <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Workspace history</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Activity log</h1><p className="mt-3 text-sm leading-6 text-[#61746a]">A record of actions associated with your account. Administrators can review platform-wide audit events.</p>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#e0ebe3] bg-white">
      {loading ? <p className="p-6 text-sm text-[#61746a]">Loading activity…</p> : items.length === 0 ? <div className="p-8 text-center"><p className="font-bold">No activity recorded yet</p><p className="mt-2 text-sm text-[#61746a]">Actions will appear here as the workspace records them.</p></div> : <ol className="divide-y divide-[#e8efe9]">{items.map(item => <li key={item.id} className="flex gap-4 p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e5f7eb] text-[#08794e]">◷</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="break-words text-sm font-bold">{item.action.replaceAll(".", " ").replaceAll("_", " ")}</p><time className="text-xs text-[#7b8f82]" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div><p className="mt-1 text-xs text-[#61746a]">{item.entity_type}{item.entity_id ? " · " + item.entity_id : ""}{item.actor_email ? " · " + item.actor_email : ""}</p></div></li>)}</ol>}
    </section>
  </div></main>;
}
