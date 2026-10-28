import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

const navItems = [
  { mark: "⌂", label: "Overview", href: "/dashboard", active: true },
  { mark: "▤", label: "My listings", href: "/dashboard/listings", active: false },
  { mark: "↗", label: "Campaigns", href: "/dashboard/campaigns", active: false },
  { mark: "◷", label: "Activity", href: "/dashboard/activity", active: false },
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
    <main className="min-h-screen bg-[#f7f7f3] text-[#191914]">
      <header className="sticky top-0 z-30 border-b border-black/[.08] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="PromoLink home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#11110e] text-base font-black text-[#d6bd69]">P</span>
            <span className="text-xl font-extrabold tracking-[-.8px]">Promo<span className="text-[#a58b3c]">Link</span></span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden rounded-full border border-[#e6e4d8] bg-[#faf9f4] px-3 py-1.5 text-xs font-semibold text-[#6e6b5e] sm:inline-flex">{roleLabel}</span>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e9dfbd] text-sm font-bold text-[#554720]" title={user.name}>{initial}</div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12 lg:py-10">
        <aside className="hidden lg:block">
          <p className="mb-4 px-3 text-[10px] font-extrabold uppercase tracking-[.19em] text-[#929187]">Workspace</p>
          <nav className="space-y-1" aria-label="Dashboard navigation">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} aria-current={item.active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${item.active ? "bg-[#171711] text-white shadow-sm" : "text-[#68685f] hover:bg-white hover:text-[#171711]"}`}>
                <span className={`grid h-7 w-7 place-items-center rounded-lg text-base ${item.active ? "bg-[#d6bd69] text-[#171711]" : "bg-white text-[#77766b]"}`}>{item.mark}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-10 rounded-2xl border border-[#e7e4d7] bg-white p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f2ecd7] text-lg text-[#927b38]">✳</span>
            <h3 className="mt-4 text-sm font-bold">Need a hand?</h3>
            <p className="mt-2 text-xs leading-5 text-[#77766d]">We’re building the marketplace in clear, reviewable stages.</p>
            <Link href="/" className="mt-3 inline-flex text-xs font-bold text-[#8a7330] hover:underline">Explore PromoLink ↗</Link>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#8a7330]"><span className="h-1.5 w-1.5 rounded-full bg-[#c4a94f]" /> Your workspace</p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-[-1.6px] sm:text-[42px]">Good to have you, {firstName}.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#73736a]">Your PromoLink account, in one place. Start with the next step for your role.</p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dcd8c8] bg-white px-3 py-2 text-xs font-semibold text-[#6e6b5e]"><span className="h-2 w-2 rounded-full bg-[#b7a052]" /> Account active</span>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl bg-[#11110e] text-white shadow-[0_18px_50px_rgba(20,20,12,.10)]">
            <div className="grid gap-7 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#d6bd69]">{isAdmin ? "Platform overview" : isOwner ? "For audience owners" : "For advertisers"}</p>
                <h2 className="mt-3 max-w-xl text-2xl font-extrabold leading-tight tracking-[-.8px] sm:text-3xl">{isAdmin ? "Keep the marketplace trustworthy." : isOwner ? "Your audience can become an opportunity." : "Find the right audience for your next campaign."}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">{isAdmin ? "Administrative tools are being built separately and access remains restricted." : isOwner ? "Prepare a clear listing, set expectations and retain approval over every campaign request." : "Define your goals first. Campaigns should only move forward after the owner agrees to the brief."}</p>
              </div>
              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-2xl border border-[#d6bd69]/25 bg-[#d6bd69]/10 text-4xl text-[#d6bd69]" aria-hidden="true">{isAdmin ? "⌘" : isOwner ? "◉" : "↗"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 px-6 py-4 text-xs text-white/65 sm:px-8">
              <span className="inline-flex items-center gap-2"><span className="text-[#d6bd69]">✓</span> Owner approval first</span>
              <span className="inline-flex items-center gap-2"><span className="text-[#d6bd69]">✓</span> Private audience data stays private</span>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-2xl border border-[#e7e5dc] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#6e6e64]">Account type</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f0e5] text-[#8d7738]">◈</span></div>
              <p className="mt-5 text-xl font-extrabold tracking-tight">{roleLabel}</p>
              <p className="mt-2 text-xs leading-5 text-[#85847a]">Your workspace is tailored to this account role.</p>
            </article>
            <article className="rounded-2xl border border-[#e7e5dc] bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#6e6e64]">Email address</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f0e5] text-[#8d7738]">@</span></div>
              <p className="mt-5 break-all text-base font-bold tracking-tight">{user.email}</p>
              <p className="mt-2 text-xs leading-5 text-[#85847a]">Used for your account sign-in.</p>
            </article>
            <article className="rounded-2xl border border-[#e7e5dc] bg-white p-5 sm:p-6 sm:col-span-2 xl:col-span-1">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-[#6e6e64]">Marketplace status</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f3f0e5] text-[#8d7738]">◷</span></div>
              <p className="mt-5 text-xl font-extrabold tracking-tight">In development</p>
              <p className="mt-2 text-xs leading-5 text-[#85847a]">Listings, campaigns and payment workflows are not presented as live until verified.</p>
            </article>
          </div>

          <div className="mt-7">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><h2 className="text-lg font-extrabold tracking-tight">Your next steps</h2><p className="mt-1 text-xs text-[#77766d]">A simple guide to what comes next.</p></div>
              <span className="hidden text-[10px] font-bold uppercase tracking-[.15em] text-[#96958b] sm:block">Getting started</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <article className="flex gap-4 rounded-2xl border border-[#e7e5dc] bg-white p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1ebd5] font-extrabold text-[#8a7330]">01</span>
                <div><h3 className="text-sm font-bold">{isAdmin ? "Review platform requirements" : isOwner ? "Prepare your audience listing" : "Prepare your campaign brief"}</h3><p className="mt-2 text-xs leading-5 text-[#77766d]">{isAdmin ? "Admin moderation and management tools are not yet available in this workspace." : isOwner ? "Listing creation and review are still being built. Private contact lists should never be uploaded into public fields." : "Audience discovery and campaign creation are still being built. No payment has been taken through this dashboard."}</p><span className="mt-3 inline-flex rounded-full bg-[#f4f2ea] px-2.5 py-1 text-[10px] font-bold text-[#77715d]">Not available yet</span></div>
              </article>
              <article className="flex gap-4 rounded-2xl border border-[#e7e5dc] bg-white p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1ebd5] font-extrabold text-[#8a7330]">02</span>
                <div><h3 className="text-sm font-bold">Keep your account secure</h3><p className="mt-2 text-xs leading-5 text-[#77766d]">Use a unique password and sign out when you finish on a shared device.</p><span className="mt-3 inline-flex rounded-full bg-[#e8f1e7] px-2.5 py-1 text-[10px] font-bold text-[#3f7044]">Available now</span></div>
              </article>
            </div>
          </div>

          <footer className="mt-10 flex flex-col gap-2 border-t border-[#e4e2d8] pt-5 text-[11px] text-[#8a897f] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} PromoLink</span><Link href="/" className="font-semibold text-[#69685e] hover:text-[#8a7330]">Back to homepage ↗</Link></footer>
        </section>
      </div>
    </main>
  );
}
