"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Listing = { id:string; title:string; channel:string; estimated_reach:number; currency:string; price_amount:string|number; pricing_model:string; status:string; created_at:string };

export default function ListingsPage() {
  const [items,setItems] = useState<Listing[]>([]);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [form,setForm] = useState({title:"",description:"",category:"",channel:"whatsapp",country_code:"NG",estimated_reach:"",currency:"NGN",price_amount:"",pricing_model:"fixed_post"});
  async function load() {
    setLoading(true);
    try { const r=await fetch("/api/audience-lists"); const d=await r.json(); if(!r.ok) throw new Error(d.error||"Could not load listings."); setItems(d.listings||[]); }
    catch(e){setError(e instanceof Error?e.message:"Could not load listings.");} finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  function update(key:string,value:string){setForm(old=>({...old,[key]:value}));}
  async function submit(e:React.FormEvent){e.preventDefault();setSaving(true);setError("");setNotice("");
    try {const r=await fetch("/api/audience-lists",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,estimated_reach:Number(form.estimated_reach),price_amount:Number(form.price_amount)})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not submit listing.");setItems(old=>[d.listing,...old]);setNotice("Listing submitted for review. It will not appear in the marketplace until approved.");setForm(old=>({...old,title:"",description:"",category:"",estimated_reach:"",price_amount:""}));}
    catch(e){setError(e instanceof Error?e.message:"Could not submit listing.");}finally{setSaving(false);}
  }
  const input="w-full rounded-xl border border-[#d6e5da] bg-white px-3.5 py-3 text-sm text-[#11251b] outline-none focus:border-[#08794e] focus:ring-2 focus:ring-[#08794e]/10";
  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/dashboard" className="text-sm font-semibold text-[#08794e] hover:underline">← Back to workspace</Link>
    <div className="mt-6"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Audience owner workspace</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Your audience listings</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#61746a]">Describe your channel and reach. Listings enter review first; raw contact lists are never requested here.</p></div>
    <section className="mt-8 rounded-2xl border border-[#e0ebe3] bg-white p-5 shadow-sm sm:p-7"><h2 className="text-lg font-extrabold">Create a listing</h2><form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Listing title<input className={input+" mt-1.5"} required minLength={3} maxLength={140} value={form.title} onChange={e=>update("title",e.target.value)} placeholder="e.g. Benin City lifestyle community"/></label>
      <label className="text-sm font-semibold">Category<input className={input+" mt-1.5"} required minLength={2} maxLength={80} value={form.category} onChange={e=>update("category",e.target.value)} placeholder="Lifestyle, technology, entertainment"/></label>
      <label className="text-sm font-semibold">Channel<select className={input+" mt-1.5"} value={form.channel} onChange={e=>update("channel",e.target.value)}><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option></select></label>
      <label className="text-sm font-semibold">Estimated reach<input className={input+" mt-1.5"} type="number" min="1" max="1000000000" required value={form.estimated_reach} onChange={e=>update("estimated_reach",e.target.value)} placeholder="e.g. 2500"/></label>
      <label className="text-sm font-semibold">Price (NGN)<input className={input+" mt-1.5"} type="number" min="0" step="0.01" required value={form.price_amount} onChange={e=>update("price_amount",e.target.value)} placeholder="e.g. 5000"/></label>
      <label className="text-sm font-semibold">Pricing model<select className={input+" mt-1.5"} value={form.pricing_model} onChange={e=>update("pricing_model",e.target.value)}><option value="fixed_post">Fixed post</option><option value="per_verified_delivery">Per verified delivery</option><option value="performance">Performance-based</option></select></label>
      <label className="text-sm font-semibold sm:col-span-2">Description<textarea className={input+" mt-1.5"} rows={4} maxLength={2000} value={form.description} onChange={e=>update("description",e.target.value)} placeholder="Describe the audience and the promotion format. Do not paste phone numbers or private member data."/></label>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-3"><button disabled={saving} className="rounded-xl bg-[#08794e] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{saving?"Submitting…":"Submit for review"}</button><span className="text-xs text-[#61746a]">New listings start as pending review.</span></div>
    </form>{error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="mt-4 rounded-lg bg-[#e5f7eb] p-3 text-sm text-[#075638]">{notice}</p>}</section>
    <section className="mt-8"><div className="flex items-end justify-between"><div><h2 className="text-xl font-extrabold">Your submitted listings</h2><p className="mt-1 text-sm text-[#61746a]">Review status updates here.</p></div><button onClick={()=>void load()} className="text-sm font-bold text-[#08794e] hover:underline">Refresh</button></div>
    {loading?<p className="mt-4 text-sm text-[#61746a]">Loading listings…</p>:items.length===0?<div className="mt-4 rounded-2xl border border-dashed border-[#cddfd2] bg-white p-8 text-center text-sm text-[#61746a]">No listings yet. Use the form above to submit your first one.</div>:<div className="mt-4 grid gap-3">{items.map(item=><article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e0ebe3] bg-white p-5"><div><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-xs text-[#61746a]">{item.channel} · Estimated reach {Number(item.estimated_reach).toLocaleString()} · {item.currency} {Number(item.price_amount).toLocaleString()}</p></div><span className="rounded-full bg-[#f0f8f2] px-3 py-1.5 text-xs font-bold text-[#08794e]">{item.status.replaceAll("_"," ")}</span></article>)}</div>}
    </section></div></main>;
}
