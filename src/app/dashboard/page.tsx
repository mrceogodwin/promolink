import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./logout-button";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";

const navItems = [
  { mark: "⌂", label: "Overview", href: "/dashboard", active: true },
  { mark: "▤", label: "My listings", href: "/dashboard/listings", active: false },
  { mark: "↗", label: "Campaigns", href: "/dashboard/campaigns", active: false },
  { mark: "⚙", label: "Settings", href: "/dashboard/settings", active: false },
  { mark: "◷", label: "Activity", href: "/dashboard/activity", active: false },
  { mark: "✓", label: "Review queue", href: "/dashboard/admin/review", active: false, adminOnly: true },
  { mark: "♙", label: "User management", href: "/dashboard/admin/users", active: false, adminOnly: true },
];

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const roleLabel = user.role === "audience_owner" ? "Audience owner" : user.role === "advertiser" ? "Advertiser" : "Administrator";
  const isOwner = user.role === "audience_owner";
  const isAdmin = user.role === "admin";
  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const initial = (user.name.trim()[0] || "P").toUpperCase();

  return (
    <main className="min-h-screen bg-[#f7faf7] text-[#11251b]">
      <header className="sticky top-0 z-30 border-b border-black/[.08] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Logo />
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden rounded-full border border-[#dcebe0] bg-[#f0f8f2] px-3 py-1.5 text-xs font-semibold text-[#5f7568] sm:inline-flex">{roleLabel}</span>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d9f5e3] text-sm font-bold text-[#075638]" title={user.name}>{initial}</div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12 lg:py-10">
        <aside className="hidden lg:block">
          <p className="mb-4 px-3 text-[10px] font-extrabold uppercase tracking-[.19em] text-[#7b8f82]">Workspace</p>
          <nav className="space-y-1" aria-label="Dashboard navigation">
            {navItems.filter((item) => !("adminOnly" in item) || (item as {adminOnly?: boolean}).adminOnly === isAdmin).map((item) => (
              <Link key={item.label} href={item.href} aria-current={item.active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${item.active ? "bg-[#075638] text-white shadow-sm" : "text-[#61746a] hover:bg-[#e5f7eb] hover:text-[#075638]"}`}>
                <span className={`grid h-7 w-7 place-items-center rounded-lg text-base ${item.active ? "bg-[#c8f169] text-[#075638]" : "bg-white text-[#aaa99f]"}`}>{item.mark}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-10 rounded-2xl border border-[#e0ebe3] bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f7eb] text-lg text-[#08794e]">✳</span>
            <h3 className="mt-4 text-sm font-bold">Need a hand?</h3>
            <p className="mt-2 text-xs leading-5 text-[#61746a]">We’re building the marketplace in clear, reviewable stages.</p>
            <Link href="/" className="mt-3 inline-flex text-xs font-bold text-[#08794e] hover:underline">Explore PromoLink ↗</Link>
          </div>
        </aside>
        <section className="min-w-0">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#08794e]"><span className="h-1.5 w-1.5 rounded-full bg-[#c8f169]" /> Your workspace</p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-[-1.6px] sm:text-[42px]">Good to have you, {firstName}.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73736a]">Your PromoLink account, in one place. Start with the next step for your role.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#d6e5da] bg-white px-3 py-2 text-xs font-semibold text-[#5f7568]"><span className="h-2 w-2 rounded-full bg-[#10a568]" /> Account active</span>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl bg-[#075638] text-white shadow-[0_18px_50px_rgba(20,20,12,.10)]">
            <div className="grid gap-7 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#c8f169]">{isAdmin ? "Platform overview" : isOwner ? "For audience owners" : "For advertisers"}</p>
                <h2 className="mt-3 max-w-xl text-2xl font-extrabold leading-tight tracking-[-.8px] sm:text-3xl">{isAdmin ? "Keep the marketplace trustworthy." : isOwner ? "Your audience can become an opportunity." : "Find the right audience for your next campaign."}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">{isAdmin ? "Review submitted audience listings and keep the marketplace trustworthy." : isOwner ? "Prepare a clear listing, set expectations and retain approval over every campaign request." : "Define your goals first. Campaigns should only move forward after the owner agrees to the brief."}</p>
              </div>
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl border border-[#c8f169]/25 bg-[#c8f169]/10 text-4xl text-[#c8f169]" aria-hidden="true">{isAdmin ? "⌘" : isOwner ? "◉" : "↗"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 px-6 py-4 text-xs text-white/65 sm:px-8">
              <span className="inline-flex items-center gap-2"><span className="text-[#c8f169]">✓</span> Owner approval first</span>
              <span className="inline-flex items-center gap-2"><span className="text-[#c8f169]">✓</span> Private audience data stays private</span>
            </div>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-[#e0ebe3] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#61746a]">Account type</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f7eb] text-[#08794e]">◈</span></div><p className="mt-5 text-xl font-extrabold tracking-tight">{roleLabel}</p><p className="mt-2 text-xs leading-5 text-[#718176]">Your workspace is tailored to this account role.</p></article>
            <article className="rounded-2xl border border-[#e0ebe3] bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#61746a]">Email address</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f7eb] text-[#08794e]">@</span></div><p className="mt-5 break-all text-base font-bold tracking-tight">{user.email}</p><p className="mt-2 text-xs leading-5 text-[#718176]">Used for your account sign-in.</p></article>
            <article className="rounded-2xl border border-[#e0ebe3] bg-white p-5 sm:p-6 sm:col-span-2 xl:col-span-1"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#61746a]">Marketplace status</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f7eb] text-[#08794e]">◷</span></div><p className="mt-5 text-xl font-extrabold tracking-tight">In development</p><p className="mt-2 text-xs leading-5 text-[#718176]">Listings, campaigns and payment workflows are not presented as live until verified.</p></article>
          </div>
          <div className="mt-7"><div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-lg font-extrabold tracking-tight">Your next steps</h2><p className="mt-1 text-xs text-[#61746a]">A simple guide to what comes next.</p></div><span className="hidden text-[10px] font-bold uppercase tracking-[.15em] text-[#7b8f82] sm:block">Getting started</span></div>
            <div className="grid gap-3 md:grid-cols-2">
              <Link href={isAdmin ? "/dashboard/admin/review" : isOwner ? "/dashboard/listings" : "/dashboard/campaigns"} className="flex gap-4 rounded-2xl border border-[#e0ebe3] bg-white p-5 transition hover:border-[#a8d5b7]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e5f7eb] font-extrabold text-[#08794e]">01</span><div><h3 className="text-sm font-bold">{isAdmin ? "Review platform listings" : isOwner ? "Prepare your audience listing" : "Prepare your campaign brief"}</h3><p className="mt-2 text-xs leading-5 text-[#61746a]">{isAdmin ? "Open the review queue to approve or reject audience listings before advertisers can see them." : isOwner ? "Create a listing for review. Never upload private contact lists." : "Choose an approved audience and submit a campaign request. Payment is not collected here."}</p><span className="mt-3 inline-flex rounded-full bg-[#e5f7eb] px-2.5 py-1 text-[10px] font-bold text-[#426c55]">Open workspace ↗</span></div></Link>
              <Link href="/dashboard/settings" className="flex gap-4 rounded-2xl border border-[#e0ebe3] bg-white p-5 transition hover:border-[#a8d5b7]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e5f7eb] font-extrabold text-[#08794e]">02</span><div><h3 className="text-sm font-bold">Account & security settings</h3><p className="mt-2 text-xs leading-5 text-[#61746a]">Review your account details and update your password. Password changes sign out existing sessions.</p><span className="mt-3 inline-flex rounded-full bg-[#dcf6e5] px-2.5 py-1 text-[10px] font-bold text-[#08794e]">Open settings ↗</span></div></Link>
            </div>
          </div>
          <footer className="mt-10 flex flex-col gap-2 border-t border-[#e0ebe3] pt-5 text-[11px] text-[#7b8f82] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} PromoLink</span><Link href="/" className="font-semibold text-[#61746a] hover:text-[#08794e]">Back to homepage ↗</Link></footer>
        </section>
      </div>
    </main>
  );
}
