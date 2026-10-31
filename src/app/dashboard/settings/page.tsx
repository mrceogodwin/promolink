"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { name: string; email: string; role: string };

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Please sign in again.");
      if (active) { setUser(data.user); setProfileName(data.user.name || ""); }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load account details.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setProfileSaving(true);
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: profileName }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update profile.");
      setUser(data.user);
      setProfileName(data.user.name);
      setNotice(data.message || "Profile updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not change password.");
      setNotice(data.message || "Password updated. Please sign in again.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => { window.location.assign("/login"); }, 1200);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  const input = "mt-1.5 w-full rounded-xl border border-[#d6e5da] bg-white px-3.5 py-3 text-sm text-[#11251b] outline-none focus:border-[#08794e] focus:ring-2 focus:ring-[#08794e]/10";
  const roleLabel = user?.role === "audience_owner" ? "Audience owner" : user?.role === "advertiser" ? "Advertiser" : user?.role === "admin" ? "Administrator" : "Account";

  return <main className="min-h-screen bg-[#f7faf7] px-4 py-8 text-[#11251b] sm:px-8">
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="text-sm font-semibold text-[#08794e] hover:underline">← Back to workspace</Link>
      <div className="mt-6"><p className="text-xs font-extrabold uppercase tracking-[.18em] text-[#08794e]">Workspace configuration</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Account settings</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#61746a]">Manage your account details and sign-in security. Sensitive changes require your current password.</p></div>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-xl bg-[#e5f7eb] p-3 text-sm text-[#075638]">{notice}</p>}
      <section className="mt-7 rounded-2xl border border-[#e0ebe3] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e5f7eb] text-lg text-[#08794e]">◎</span><div><h2 className="font-extrabold">Profile</h2><p className="mt-1 text-xs text-[#61746a]">Your current PromoLink identity</p></div></div>
        {loading ? <p className="mt-5 text-sm text-[#61746a]">Loading account…</p> : user ? <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-[#f7faf7] p-4"><dt className="text-xs font-semibold text-[#61746a]">Full name</dt><dd className="mt-2 break-words text-sm font-bold">{user.name}</dd></div>
          <div className="rounded-xl bg-[#f7faf7] p-4"><dt className="text-xs font-semibold text-[#61746a]">Email address</dt><dd className="mt-2 break-all text-sm font-bold">{user.email}</dd></div>
          <div className="rounded-xl bg-[#f7faf7] p-4"><dt className="text-xs font-semibold text-[#61746a]">Account role</dt><dd className="mt-2 text-sm font-bold">{roleLabel}</dd></div>
          <div className="rounded-xl bg-[#f7faf7] p-4"><dt className="text-xs font-semibold text-[#61746a]">Email verification</dt><dd className="mt-2 text-sm font-bold">Not yet available</dd><p className="mt-1 text-xs leading-5 text-[#61746a]">Email verification requires an email delivery provider and token workflow.</p></div>
        </dl> : <p className="mt-5 text-sm text-[#61746a]">Sign in to view your account details.</p>}
        {user && <form onSubmit={saveProfile} className="mt-5 border-t border-[#e8efe9] pt-5 sm:max-w-xl"><label className="block text-sm font-semibold">Edit display name<input className={input} value={profileName} onChange={event=>setProfileName(event.target.value)} minLength={2} maxLength={120} required /></label><button disabled={profileSaving || loading || profileName.trim() === user.name} className="mt-3 rounded-xl border border-[#cddfd2] bg-white px-4 py-2.5 text-sm font-bold text-[#075638] disabled:opacity-50">{profileSaving ? "Saving…" : "Save profile"}</button></form>}
      </section>
      <section className="mt-5 rounded-2xl border border-[#e0ebe3] bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e5f7eb] text-lg text-[#08794e]">⌑</span><div><h2 className="font-extrabold">Change password</h2><p className="mt-1 text-xs text-[#61746a]">Use at least 10 characters. All active sessions will be signed out.</p></div></div>
        <form onSubmit={changePassword} className="mt-6 grid gap-4 sm:max-w-xl">
          <label className="text-sm font-semibold">Current password<input className={input} type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={event=>setCurrentPassword(event.target.value)} /></label>
          <label className="text-sm font-semibold">New password<input className={input} type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={newPassword} onChange={event=>setNewPassword(event.target.value)} /></label>
          <label className="text-sm font-semibold">Confirm new password<input className={input} type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} /></label>
          <div><button disabled={saving || loading || !user} className="rounded-xl bg-[#08794e] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? "Updating…" : "Update password"}</button></div>
        </form>
      </section>
      <section className="mt-5 rounded-2xl border border-[#e0ebe3] bg-white p-5 sm:p-7"><h2 className="font-extrabold">Platform configuration</h2><p className="mt-2 text-sm leading-6 text-[#61746a]">Payments, payout setup, email verification, password recovery, and delivery integrations are not enabled yet. They will only be shown as active after provider credentials and end-to-end tests are in place.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">
        {["Payment provider · Not configured","Payout account · Not configured","Email delivery · Not configured","Campaign delivery · Not configured"].map(item=><div key={item} className="rounded-xl border border-dashed border-[#d6e5da] px-4 py-3 text-sm font-semibold text-[#61746a]">{item}</div>)}
      </div></section>
    </div>
  </main>;
}
