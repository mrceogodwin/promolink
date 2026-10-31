"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type User = { id:string; name:string; email:string; role:string; status:string; created_at:string };
export default function AdminUsersPage() {
  const [users,setUsers]=useState<User[]>([]);
  const [query,setQuery]=useState("");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  async function load() {
    setLoading(true); setError("");
    try { const response=await fetch("/api/admin/users"); const data=await response.json(); if(!response.ok) throw new Error(data.error||"Could not load users."); setUsers(data.users||[]); }
    catch(reason) { setError(reason instanceof Error?reason.message:"Could not load users."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{void load();},[]);
  async function update(user:User) {
    const status=user.status==="suspended"?"active":"suspended";
    setBusy(user.id);setError("");setNotice("");
    try { const response=await fetch("/api/admin/users",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:user.id,status})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Could not update user.");setUsers(old=>old.map(item=>item.id===user.id?data.user:item));setNotice(status==="suspended"?"Account suspended and existing sessions revoked.":"Account reactivated."); }
    catch(reason) { setError(reason instanceof Error?reason.message:"Could not update user."); }
    finally { setBusy(""); }
  }
  const visible=useMemo(()=>users.filter(user=>(user.name+" "+user.email+" "+user.role).toLowerCase().includes(query.toLowerCase())),[users,query]);
  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/dashboard" className="text-sm font-semibold text-[#08794e] hover:underline">← Back to workspace</Link>
    <div className="mt-6"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Administrator workspace</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">User management</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#61746a]">Review account roles and status. Suspending an account revokes its active sessions. Administrator accounts are protected from changes here.</p></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#e0ebe3] bg-white p-5"><p className="text-xs font-semibold text-[#61746a]">Total accounts</p><p className="mt-2 text-3xl font-extrabold">{users.length}</p></div><div className="rounded-2xl border border-[#e0ebe3] bg-white p-5"><p className="text-xs font-semibold text-[#61746a]">Active</p><p className="mt-2 text-3xl font-extrabold">{users.filter(user=>user.status==="active").length}</p></div><div className="rounded-2xl border border-[#e0ebe3] bg-white p-5"><p className="text-xs font-semibold text-[#61746a]">Suspended</p><p className="mt-2 text-3xl font-extrabold">{users.filter(user=>user.status==="suspended").length}</p></div></div>
    {error&&<p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="mt-4 rounded-xl bg-[#e5f7eb] p-3 text-sm text-[#075638]">{notice}</p>}
    <section className="mt-6 rounded-2xl border border-[#e0ebe3] bg-white p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-lg font-extrabold">Platform accounts</h2><p className="mt-1 text-xs text-[#61746a]">Showing up to 200 most recently created accounts.</p></div><div className="flex gap-2"><input aria-label="Search users" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search name, email or role" className="min-w-0 rounded-xl border border-[#d6e5da] px-3 py-2.5 text-sm outline-none focus:border-[#08794e]"/><button onClick={()=>void load()} className="rounded-xl border border-[#d6e5da] px-3 py-2 text-sm font-bold text-[#08794e]">Refresh</button></div></div>
    {loading?<p className="py-8 text-sm text-[#61746a]">Loading accounts…</p>:visible.length===0?<p className="py-8 text-center text-sm text-[#61746a]">No matching accounts.</p>:<div className="mt-5 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b border-[#e8efe9] text-xs text-[#61746a]"><th className="px-3 py-3 font-bold">Account</th><th className="px-3 py-3 font-bold">Role</th><th className="px-3 py-3 font-bold">Status</th><th className="px-3 py-3 font-bold">Joined</th><th className="px-3 py-3 text-right font-bold">Action</th></tr></thead><tbody>{visible.map(user=><tr key={user.id} className="border-b border-[#f0f4f1]"><td className="px-3 py-4"><p className="font-bold">{user.name}</p><p className="mt-1 text-xs text-[#718176]">{user.email}</p></td><td className="px-3 py-4 capitalize">{user.role.replaceAll("_"," ")}</td><td className="px-3 py-4"><span className={user.status==="active"?"rounded-full bg-[#e5f7eb] px-2.5 py-1 text-xs font-bold text-[#08794e]":"rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"}>{user.status.replaceAll("_"," ")}</span></td><td className="px-3 py-4 text-xs text-[#61746a]">{new Date(user.created_at).toLocaleDateString()}</td><td className="px-3 py-4 text-right">{user.role==="admin"?<span className="text-xs text-[#718176]">Protected</span>:<button disabled={busy===user.id} onClick={()=>void update(user)} className={user.status==="suspended"?"rounded-lg bg-[#08794e] px-3 py-2 text-xs font-bold text-white disabled:opacity-50":"rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"}>{busy===user.id?"Saving…":user.status==="suspended"?"Reactivate":"Suspend"}</button>}</td></tr>)}</tbody></table></div>}</section>
  </div></main>;
}
