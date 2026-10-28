import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const roleLabel = user.role === "audience_owner" ? "Audience Owner" : user.role === "advertiser" ? "Advertiser" : "Administrator";
  return (
    <main className="min-h-screen bg-[#0b0b09] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-xl font-extrabold tracking-tight">Promo<span className="text-[#d6bd69]">Link</span></Link>
          <LogoutButton />
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#d6bd69]">{roleLabel} workspace</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Welcome, {user.name.split(" ")[0]}.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">Your account is signed in. We’re building the marketplace workflows in stages; actions will appear here as they become available.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><p className="text-sm text-white/55">Account email</p><p className="mt-2 break-all font-semibold">{user.email}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><p className="text-sm text-white/55">Account type</p><p className="mt-2 font-semibold">{roleLabel}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6"><p className="text-sm text-white/55">Account status</p><p className="mt-2 font-semibold text-[#d6bd69]">Active</p></div>
        </div>
        <div className="mt-8 rounded-2xl border border-[#d6bd69]/25 bg-[#d6bd69]/[.06] p-6">
          <h2 className="text-lg font-bold">Next steps</h2>
          <p className="mt-2 text-sm leading-6 text-white/65">{user.role === "audience_owner" ? "Audience listing creation and review tools are still being built. No audience is published until it is reviewed." : user.role === "advertiser" ? "Campaign creation, audience browsing and verified checkout are still being built. No payment has been taken." : "Admin moderation and account management tools are still being built."}</p>
        </div>
      </section>
    </main>
  );
}
