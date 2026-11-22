"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

type Audience = { id: string; title: string; channel: string; status: string };
type Summary = { total_contacts: number; consented_contacts: number; withdrawn_contacts: number };

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell.trim()); cell = ""; }
    else if (char === "\n") { row.push(cell.trim()); rows.push(row); row = []; cell = ""; }
    else if (char !== "\r") cell += char;
  }
  if (cell.length || row.length) { row.push(cell.trim()); rows.push(row); }
  if (rows.length < 2) throw new Error("CSV must include a header and at least one contact row.");
  const headers = rows.shift()!.map(x => x.toLowerCase().replace(/^\uFEFF/, ""));
  if (!headers.includes("phone") || !headers.includes("consent_obtained_at") || !headers.includes("consent_evidence_ref")) throw new Error("CSV needs phone, consent_obtained_at and consent_evidence_ref columns.");
  return rows.filter(r => r.some(Boolean)).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
}

export default function AudienceContactsPage() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [audienceId, setAudienceId] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [optOutPhone, setOptOutPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(() => audiences.find(a => a.id === audienceId), [audiences, audienceId]);

  async function loadAudiences() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/audience-lists");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load your audience listings.");
      const rows = (data.listings || []) as Audience[];
      setAudiences(rows);
      if (!audienceId && rows[0]) setAudienceId(rows[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load listings."); }
    finally { setLoading(false); }
  }

  async function loadSummary(id: string) {
    if (!id) { setSummary(null); return; }
    try {
      const response = await fetch(`/api/audience-lists/${id}/contacts`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load contact totals.");
      setSummary(data.contacts);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load contact totals."); }
  }

  useEffect(() => { void loadAudiences(); }, []);
  useEffect(() => { void loadSummary(audienceId); }, [audienceId]);

  async function importContacts() {
    if (!file || !audienceId || !source.trim() || !confirmed) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const contacts = parseCsv(await file.text());
      if (contacts.length > 500) throw new Error("Please split your CSV into batches of 500 contacts or fewer.");
      const response = await fetch(`/api/audience-lists/${audienceId}/contacts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent_confirmed: true,
          consent_source: source.trim(),
          contacts: contacts.map(row => ({
            phone: row.phone,
            consent_obtained_at: row.consent_obtained_at || new Date().toISOString(),
            consent_evidence_ref: row.consent_evidence_ref || null
          }))
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Import failed.");
      setNotice(`Import complete: ${data.inserted} added, ${data.duplicates} duplicates, ${data.suppressed} suppressed, ${data.invalid} invalid.`);
      setFile(null); setConfirmed(false);
      const input = document.getElementById("contacts-csv") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadSummary(audienceId);
    } catch (e) { setError(e instanceof Error ? e.message : "Import failed."); }
    finally { setBusy(false); }
  }

  async function applyOptOut() {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/audience-contacts/opt-out", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: optOutPhone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not apply opt-out.");
      setNotice(`Number suppressed. Removed from ${data.withdrawn_from_lists} active audience list(s).`);
      setOptOutPhone("");
      await loadSummary(audienceId);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not apply opt-out."); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8">
    <div className="mx-auto max-w-5xl">
      <Link href="/dashboard" className="text-sm font-semibold text-[#08794e]">← Back to workspace</Link>
      <p className="mt-6 text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Audience owner workspace</p>
      <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Private audience contacts</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#61746a]">Import only people who explicitly agreed to receive marketing messages. Phone numbers are encrypted before storage and are never shown to advertisers or returned by this page.</p>

      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section className="mt-7 rounded-2xl border border-[#e0ebe3] bg-white p-5 sm:p-7">
        <h2 className="text-lg font-extrabold">Choose an audience listing</h2>
        {loading ? <p className="mt-3 text-sm text-[#61746a]">Loading your listings…</p> : audiences.length === 0 ? <p className="mt-3 text-sm text-[#61746a]">Create an audience listing first.</p> :
          <select value={audienceId} onChange={e => setAudienceId(e.target.value)} className="mt-3 w-full rounded-xl border border-[#dce8df] bg-white px-3 py-3 text-sm outline-none focus:border-[#08794e]">
            {audiences.map(a => <option key={a.id} value={a.id}>{a.title} · {a.channel} · {a.status}</option>)}
          </select>}
        {summary && <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#f5f8f5] p-3"><p className="text-xs text-[#61746a]">Stored</p><p className="mt-1 text-xl font-extrabold">{summary.total_contacts.toLocaleString()}</p></div>
          <div className="rounded-xl bg-[#f5f8f5] p-3"><p className="text-xs text-[#61746a]">Opted in</p><p className="mt-1 text-xl font-extrabold">{summary.consented_contacts.toLocaleString()}</p></div>
          <div className="rounded-xl bg-[#f5f8f5] p-3"><p className="text-xs text-[#61746a]">Withdrawn</p><p className="mt-1 text-xl font-extrabold">{summary.withdrawn_contacts.toLocaleString()}</p></div>
        </div>}
      </section>

      <section className="mt-5 rounded-2xl border border-[#e0ebe3] bg-white p-5 sm:p-7">
        <h2 className="text-lg font-extrabold">Import consented contacts</h2>
        <p className="mt-2 text-sm leading-6 text-[#61746a]">Upload a CSV with required columns: <code>phone</code>, <code>consent_obtained_at</code> (ISO date/time), and <code>consent_evidence_ref</code> (a reference to the opt-in record). Use international E.164 numbers such as +2348012345678. Maximum 500 per import.</p>
        <label className="mt-5 block text-sm font-bold" htmlFor="contacts-csv">CSV file</label>
        <input id="contacts-csv" type="file" accept=".csv,text/csv" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)} className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#e5f7eb] file:px-4 file:py-2 file:font-bold file:text-[#08794e]" />
        <label className="mt-4 block text-sm font-bold" htmlFor="consent-source">How was consent collected?</label>
        <input id="consent-source" value={source} onChange={e => setSource(e.target.value)} maxLength={120} placeholder="e.g. WhatsApp opt-in form, event registration" className="mt-2 w-full rounded-xl border border-[#dce8df] px-3 py-3 text-sm outline-none focus:border-[#08794e]" />
        <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#33483b]">
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-[#08794e]" />
          I confirm every person in this file explicitly opted in to receive WhatsApp marketing messages, and the consent source and dates are accurate.
        </label>
        <button onClick={() => void importContacts()} disabled={busy || !file || !audienceId || !source.trim() || !confirmed} className="mt-5 rounded-xl bg-[#08794e] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Working…" : "Import consented contacts"}</button>
      </section>

      <section className="mt-5 rounded-2xl border border-[#f0dfd9] bg-white p-5 sm:p-7">
        <h2 className="text-lg font-extrabold">Apply an opt-out</h2>
        <p className="mt-2 text-sm leading-6 text-[#61746a]">If someone withdraws consent, add their number here. It will be suppressed across all of your audience lists and the encrypted number will be erased from active contact records.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input value={optOutPhone} onChange={e => setOptOutPhone(e.target.value)} placeholder="+2348012345678" className="min-w-0 flex-1 rounded-xl border border-[#dce8df] px-3 py-3 text-sm outline-none focus:border-[#08794e]" />
          <button onClick={() => void applyOptOut()} disabled={busy || !optOutPhone.trim()} className="rounded-xl border border-[#b85b46] px-5 py-3 text-sm font-bold text-[#9e4634] disabled:opacity-50">Suppress number</button>
        </div>
      </section>
      <p className="mt-6 text-xs leading-5 text-[#718176]">This is an initial owner-operated consent workflow. It does not yet provide a recipient-facing unsubscribe link or enable WhatsApp campaign sending. Do not upload contacts without valid consent.</p>
    </div>
  </main>;
}
