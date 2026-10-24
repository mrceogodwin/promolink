"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── NAVIGATION ─── */}
      <header className="sticky top-0 z-50">
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Logo />

              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
                <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
                <a href="#for-owners" className="hover:text-primary transition-colors">For Audience Owners</a>
                <a href="#for-advertisers" className="hover:text-primary transition-colors">For Advertisers</a>
              </nav>

              <div className="hidden md:flex items-center gap-3">
                <Link href="#cta" className="text-sm font-medium text-muted hover:text-primary transition-colors px-3 py-2">Log in</Link>
                <Link href="#cta" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors">Get Started</Link>
              </div>

              <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-near-black hover:bg-gray-50" aria-label="Toggle menu">
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </div>

            {mobileOpen && (
              <div className="md:hidden pb-4 border-t border-gray-100 pt-3 space-y-1">
                <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-near-black hover:bg-primary-light rounded-lg">How It Works</a>
                <a href="#for-owners" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-near-black hover:bg-primary-light rounded-lg">For Audience Owners</a>
                <a href="#for-advertisers" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm font-medium text-near-black hover:bg-primary-light rounded-lg">For Advertisers</a>
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="#cta" onClick={() => setMobileOpen(false)} className="block text-center px-3 py-2.5 text-sm font-medium text-muted border border-gray-200 rounded-lg">Log in</Link>
                  <Link href="#cta" onClick={() => setMobileOpen(false)} className="block text-center px-3 py-2.5 text-sm font-semibold text-white bg-primary rounded-lg">Get Started</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#3b1a7a] via-primary-deep to-[#2e1065]">
          <div className="absolute inset-0 hero-grid opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2e1065]/80 via-transparent to-transparent" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
              <div className="text-white">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-primary-light/90 mb-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Your Audience. Your Opportunity.
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold tracking-tight leading-[1.12]">
                  Turn Your WhatsApp Audience Into Earning Opportunities.
                </h1>
                <p className="mt-6 text-lg text-white/75 leading-relaxed max-w-lg">
                  PromoLink is a marketplace where owners of WhatsApp contact lists and groups can offer approved promotional campaigns to advertisers — and earn when messages are successfully delivered.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <a href="#cta" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-primary-deep shadow-lg hover:bg-primary-light transition-colors">Start Earning</a>
                  <a href="#for-advertisers" className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors">Advertise With Us</a>
                </div>
                <p className="mt-6 text-sm text-white/50">WhatsApp audiences. Approved campaigns. Clear delivery tracking.</p>
              </div>

              <div className="relative hidden lg:block h-[420px]">
                <div className="absolute top-1/2 right-8 -translate-y-1/2 w-72 h-72 rounded-full bg-teal-400/20 blur-2xl" />
                <div className="absolute top-8 right-0 w-72 bg-white rounded-2xl shadow-2xl p-5 float-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 flex items-center justify-center">
                        <span className="text-[#25D366] font-bold text-xs">W</span>
                      </div>
                      <span className="text-sm font-semibold text-near-black">WhatsApp Audience</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-light text-primary">Illustrative</span>
                  </div>
                  <p className="text-sm font-medium text-near-black mb-1">Lifestyle & City Updates</p>
                  <p className="text-xs text-muted mb-4">Primary location · Nigeria</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-muted">Audience size</p><p className="font-semibold text-near-black mt-0.5">14k – 18k</p></div>
                    <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-muted">Price / delivery</p><p className="font-semibold text-near-black mt-0.5">Set by owner</p></div>
                  </div>
                </div>
                <div className="absolute bottom-16 left-0 w-64 bg-white rounded-2xl shadow-2xl p-4 float-card-delay">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <span className="text-xs font-semibold text-near-black">Campaign Opportunity</span>
                  </div>
                  <p className="text-sm font-medium text-near-black">Product Launch Promo</p>
                  <p className="text-xs text-muted mt-0.5 mb-3">WhatsApp · Lifestyle audience</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Status</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Pending approval</span>
                  </div>
                </div>
                <div className="absolute top-36 left-4 w-48 bg-white rounded-xl shadow-xl p-3.5 float-card">
                  <p className="text-[10px] font-medium text-muted mb-2">Delivery tracking</p>
                  <div className="flex items-end gap-1 h-12">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="flex-1 rounded-sm bg-primary/20" style={{ height: `${h}%` }}>
                        <div className="w-full rounded-sm bg-primary" style={{ height: `${Math.min(h + 10, 100)}%` }} />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted mt-2">Illustrative data only</p>
                </div>
              </div>

              <div className="lg:hidden mt-4">
                <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/15 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center"><span className="text-[#25D366] font-bold text-sm">W</span></div>
                    <div>
                      <p className="text-white font-medium text-sm">WhatsApp Audience · Lifestyle</p>
                      <p className="text-white/60 text-xs">Illustrative listing preview</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-lg p-3"><p className="text-white/60 text-xs">Audience</p><p className="text-white font-semibold text-sm">14k–18k</p></div>
                    <div className="bg-white/10 rounded-lg p-3"><p className="text-white/60 text-xs">Price / delivery</p><p className="text-white font-semibold text-sm">Set by owner</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOCUS */}
        <section className="py-14 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-medium text-muted mb-3">Built for WhatsApp audiences</p>
            <p className="text-near-black font-medium max-w-2xl mx-auto">
              PromoLink focuses on WhatsApp contact lists and groups — the channels where real conversations and high open rates already exist.
            </p>
            <p className="mt-4 text-xs text-muted max-w-lg mx-auto">
              PromoLink is an independent marketplace. We are not affiliated with or endorsed by Meta or WhatsApp.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 sm:py-24 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">How PromoLink Works</h2>
              <p className="mt-4 text-muted text-lg">A clear path for audience owners and advertisers.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-6">For Audience Owners</p>
                <div className="space-y-6">
                  {[
                    { step: "1", title: "List your WhatsApp audience", desc: "Describe your contact list or group, set a price per successful delivery, and submit for review." },
                    { step: "2", title: "Approve campaigns", desc: "Review advertiser messages and approve only the promotions you want to run." },
                    { step: "3", title: "Earn from deliveries", desc: "Track successful deliveries and earnings according to the agreed campaign terms." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">{item.step}</div>
                      <div>
                        <h3 className="font-semibold text-near-black">{item.title}</h3>
                        <p className="text-sm text-muted mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-6">For Advertisers</p>
                <div className="space-y-6">
                  {[
                    { step: "1", title: "Discover audiences", desc: "Browse approved WhatsApp audience lists by category, location and price." },
                    { step: "2", title: "Create a campaign", desc: "Write your message, set a budget and delivery target, then submit for owner approval." },
                    { step: "3", title: "Track results", desc: "Monitor delivery status, spending and remaining budget in one place." },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">{item.step}</div>
                      <div>
                        <h3 className="font-semibold text-near-black">{item.title}</h3>
                        <p className="text-sm text-muted mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOR OWNERS */}
        <section id="for-owners" className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">Your WhatsApp Audience Has More Potential.</h2>
                <p className="mt-4 text-muted text-lg leading-relaxed">
                  You already built a real WhatsApp contact list or group. PromoLink gives you a professional way to offer approved promotional campaigns and earn from successful deliveries.
                </p>
                <ul className="mt-8 space-y-3.5">
                  {[
                    "List eligible WhatsApp contact lists and groups",
                    "Set your own price per successful delivery",
                    "Approve or reject every campaign message",
                    "Track deliveries and earnings clearly",
                    "Keep control of what reaches your audience",
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                      <span className="text-near-black text-[15px]">{b}</span>
                    </li>
                  ))}
                </ul>
                <a href="#cta" className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-deep transition-colors">Start Earning With PromoLink</a>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Listing Preview</p>
                  <span className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary-light text-primary">Illustrative only</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#25D366]/15 flex items-center justify-center"><span className="text-[#25D366] font-bold">W</span></div>
                    <div>
                      <p className="font-semibold text-near-black">WhatsApp · Lifestyle Audience</p>
                      <p className="text-xs text-muted">City updates & daily content</p>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted text-xs">Audience size</p><p className="font-semibold text-near-black mt-0.5">12k – 18k</p></div>
                    <div><p className="text-muted text-xs">Primary location</p><p className="font-semibold text-near-black mt-0.5">Nigeria</p></div>
                    <div><p className="text-muted text-xs">Price per delivery</p><p className="font-semibold text-near-black mt-0.5">Set by owner</p></div>
                    <div><p className="text-muted text-xs">Status</p><p className="font-semibold text-near-black mt-0.5">Pending review</p></div>
                  </div>
                  <p className="text-xs text-muted pt-1">Sample data for illustration only. Real listings will show reviewed details after approval.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOR ADVERTISERS */}
        <section id="for-advertisers" className="py-20 sm:py-24 bg-primary-light/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-3">
                {[
                  { name: "Lifestyle & City Updates", size: "14k–18k contacts", tag: "Illustrative" },
                  { name: "Business Owners Group", size: "3.2k contacts", tag: "Illustrative" },
                  { name: "Fashion & Deals Audience", size: "9k contacts", tag: "Illustrative" },
                ].map((item) => (
                  <div key={item.name} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#25D366]/15 flex items-center justify-center"><span className="text-[#25D366] font-bold text-xs">W</span></div>
                      <div>
                        <p className="font-medium text-near-black text-sm">{item.name}</p>
                        <p className="text-xs text-muted">{item.size}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-light text-primary">{item.tag}</span>
                  </div>
                ))}
                <p className="text-xs text-muted pt-1">Sample cards only. Live listings will appear after review and approval.</p>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">Reach WhatsApp Audiences That Already Listen.</h2>
                <p className="mt-4 text-muted text-lg leading-relaxed">
                  Find approved WhatsApp contact lists and groups, create campaigns, and pay according to successful deliveries — with clear tracking and owner approval on every message.
                </p>
                <ul className="mt-8 space-y-3.5">
                  {[
                    "Browse approved WhatsApp audiences by category and location",
                    "Set budget and delivery targets for each campaign",
                    "Messages require audience-owner approval before sending",
                    "Track delivery results and remaining budget",
                    "Contact details stay private — you never receive the list",
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </span>
                      <span className="text-near-black text-[15px]">{b}</span>
                    </li>
                  ))}
                </ul>
                <a href="#cta" className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-deep transition-colors">Explore Advertising Opportunities</a>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="py-20 sm:py-24 bg-near-black text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Trust & Transparency</h2>
              <p className="mt-4 text-gray-300 text-lg">Principles we intend to follow as the platform grows.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: "Owner approval on every message", desc: "Audience owners review and approve campaign messages before anything is sent to their contacts." },
                { title: "Clear delivery tracking", desc: "Campaigns are measured against defined delivery events so both sides can see what was successfully delivered." },
                { title: "Private contact lists", desc: "Advertisers never receive the underlying phone numbers or contact database. Lists stay with the audience owner." },
              ].map((item) => (
                <div key={item.title} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: "What is PromoLink?", a: "PromoLink is a WhatsApp audience advertising marketplace. Audience owners list eligible contact lists and groups; advertisers create campaigns and pay according to successful deliveries." },
                { q: "Who can list an audience?", a: "Anyone who owns or manages an eligible WhatsApp contact list or group and can provide clear information about it. Listings go through review before appearing in the marketplace." },
                { q: "Do advertisers get my contact list?", a: "No. Contact details stay private. Advertisers never receive the underlying phone numbers." },
                { q: "How do audience owners earn?", a: "Earnings depend on approved campaigns and successful deliveries according to the terms of each campaign. PromoLink does not guarantee any specific income." },
                { q: "Is PromoLink available yet?", a: "We are currently building the full marketplace. You can join the early list below to be notified when listings and campaigns open." },
                { q: "Is PromoLink affiliated with WhatsApp or Meta?", a: "No. PromoLink is an independent marketplace and is not affiliated with or endorsed by Meta or WhatsApp." },
              ].map((item) => (
                <div key={item.q} className="border border-gray-100 rounded-xl p-5 sm:p-6">
                  <h3 className="font-semibold text-near-black">{item.q}</h3>
                  <p className="mt-2 text-muted text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section id="cta" className="py-20 sm:py-24 bg-gradient-to-br from-primary-deep to-[#2e1065] text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Your Audience. Your Opportunity.</h2>
            <p className="mt-4 text-white/75 text-lg max-w-xl mx-auto">
              Be among the first to list your WhatsApp audience or reach high-engagement WhatsApp contacts through approved campaigns.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:hello@promolink.ng?subject=I%20want%20to%20Start%20Earning" className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-primary-deep shadow-lg hover:bg-primary-light transition-colors">Start Earning</a>
              <a href="mailto:hello@promolink.ng?subject=I%20want%20to%20Advertise" className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/5 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors">Advertise With Us</a>
            </div>
            <p className="mt-6 text-sm text-white/50">No account required yet. Tell us how you’d like to use PromoLink.</p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-near-black text-gray-300 py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-1">
              <Logo dark />
              <p className="text-sm text-gray-400 leading-relaxed mt-4">Your Audience. Your Opportunity.</p>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-4">Product</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#for-owners" className="hover:text-white transition-colors">For Audience Owners</a></li>
                <li><a href="#for-advertisers" className="hover:text-white transition-colors">For Advertisers</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-4">Company</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="mailto:hello@promolink.ng" className="hover:text-white transition-colors">Contact</a></li>
                <li><span className="text-gray-500">Privacy Policy (coming soon)</span></li>
                <li><span className="text-gray-500">Terms of Service (coming soon)</span></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white text-sm mb-4">Get started</p>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#cta" className="hover:text-white transition-colors">Start Earning</a></li>
                <li><a href="#cta" className="hover:text-white transition-colors">Advertise With Us</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} PromoLink. All rights reserved.</p>
            <p>Independent marketplace. Not affiliated with Meta or WhatsApp.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
