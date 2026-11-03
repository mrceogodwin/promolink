"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Entry = { id:string; campaign_id:string|null; entry_type:string; amount_minor:string; currency:string; reference:string; metadata:Record<string,unknown>; created_at:string };
type Summary = { currency:string; net_minor:string; deposits_minor:string; earnings_minor:string; reserved_minor:string; withdrawn_minor:string };

const title=(value:string)=>value.replaceAll("_"," ").replace(/\\b\\w/g,c=>c.toUpperCase());
const money=(minor:string,currency:string)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:currency.trim(),maximumFractionDigits:2}).format(Number(minor)/100);

export default function WalletPage(){
 const [entries,setEntries]=useState<Entry[]>([]); const [summary,setSummary]=useState<Summary[]>([]);
 const [error,setError]=useState(""); const [loading,setLoading]=useState(true);
 async function load(){setLoading(true);setError("");try{const r=await fetch("/api/wallet",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Unable to load transactions.");setEntries(d.entries||[]);setSummary(d.summary||[]);}catch(e){setError(e instanceof Error?e.message:"Unable to load transactions.");}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8"><div className="mx-auto max-w-6xl">
 <Link href="/dashboard" className="text-sm font-semibold text-[#08794e] hover:underline">← Back to workspace</Link>
 <div className="mt-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Financial activity</p><h1 className="mt-2 text-3xl font-extrabold">Wallet & transactions</h1><p className="mt-2 text-sm text-[#61746a]">A read-only view of posted ledger entries. Pending payments are not spendable balances.</p></div><button onClick={()=>void load()} disabled={loading} className="rounded-xl border border-[#d6e5da] bg-white px-4 py-2.5 text-sm font-bold text-[#08794e] disabled:opacity-50">{loading?"Refreshing…":"Refresh"}</button></div>
 {error&&<p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
 <div className="mt-7 grid gap-3 sm:grid-cols-2">{summary.length?summary.map(s=><article key={s.currency} className="rounded-2xl border border-[#e0ebe3] bg-white p-5"><p className="text-xs font-bold text-[#61746a]">{s.currency.trim()} net ledger position</p><p className="mt-3 text-3xl font-extrabold">{money(s.net_minor,s.currency.trim())}</p><p className="mt-2 text-xs text-[#718176]">Calculated from posted ledger entries; not a bank or withdrawal guarantee.</p></article>):<article className="rounded-2xl border border-dashed border-[#cddfd2] bg-white p-6 sm:col-span-2"><p className="font-bold">No posted ledger balance yet</p><p className="mt-2 text-sm text-[#61746a]">Your financial activity will appear here after a verified transaction is posted.</p></article>}</div>
 <section className="mt-7 overflow-hidden rounded-2xl border border-[#e0ebe3] bg-white"><div className="border-b border-[#edf2ee] p-5"><h2 className="font-extrabold">Transaction history</h2><p className="mt-1 text-xs text-[#718176]">Latest 100 ledger entries.</p></div>
 {loading?<p className="p-6 text-sm text-[#61746a]">Loading ledger…</p>:entries.length===0?<p className="p-8 text-center text-sm text-[#61746a]">No transactions recorded yet.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#f7faf7] text-xs text-[#61746a]"><tr><th className="px-5 py-3">Transaction</th><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Amount</th></tr></thead><tbody>{entries.map(e=><tr key={e.id} className="border-t border-[#edf2ee]"><td className="px-5 py-4 font-semibold">{title(e.entry_type)}</td><td className="max-w-[180px] truncate px-5 py-4 text-xs text-[#718176]">{e.reference}</td><td className="px-5 py-4 text-xs text-[#718176]">{new Date(e.created_at).toLocaleString()}</td><td className="px-5 py-4 text-right font-bold">{money(e.amount_minor,e.currency.trim())}</td></tr>)}</tbody></table></div>}</section>
 <p className="mt-4 text-xs leading-5 text-[#718176]">This page does not initiate deposits or withdrawals. Those controls will only be enabled when the corresponding provider and approval workflows are fully implemented.</p>
 </div></main>;
}
