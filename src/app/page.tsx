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
                  Your Social Audience Can Open New Earning Opportunities.
                </h1>
                <p className="mt-6 text-lg text-white/75 leading-relaxed max-w-lg">
                  Connect your WhatsApp TV, WhatsApp groups, Telegram channels and other social communities with brands looking to promote their products. Discover advertising opportunities and manage promotions through one platform.
                </p>
                <div className="mt-9 flex flex-col sm:flex-row gap-3">
                  <a href="#cta" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3.5 text-base font-semibold text-primary-deep shadow-lg hover:bg-primary-light transition-colors">Start Earning</a>
                  <a href="#for-advertisers" className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors">Advertise With Us</a>
                </div>
                <p className="mt-6 text-sm text-white/50">One platform. Two opportunities. Better connections.</p>
              </div>

              <div className="relative hidden lg:block h-[420px]">
                <div className="absolute top-1/2 right-8 -translate-y-1/2 w-72 h-72 rounded-full bg-teal-400/20 blur-2xl" />
                <div className="absolute top-8 right-0 w-72 bg-white rounded-2xl shadow-2xl p-5 float-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#25D366]/15 flex items-center justify-center">
                        <span className="text-[#25D366] font-bold text-xs">W</span>
                      </div>
                      <span className="text-sm font-semibold text-near-black">WhatsApp TV</span>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-light text-primary">Illustrative</span>
                  </div>
                  <p className="text-sm font-medium text-near-black mb-1">Lifestyle & City Updates</p>
                  <p className="text-xs text-muted mb-4">Primary location · Nigeria</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-muted">Audience</p><p className="font-semibold text-near-black mt-0.5">14k – 18k</p></div>
                    <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-muted">Format</p><p className="font-semibold text-near-black mt-0.5">Status + Broadcast</p></div>
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
                  <p className="text-xs text-muted mt-0.5 mb-3">Telegram · Tech & Gadgets</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Status</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Open for booking</span>
                  </div>
                </div>
                <div className="absolute top-36 left-4 w-48 bg-white rounded-xl shadow-xl p-3.5 float-card">
                  <p className="text-[10px] font-medium text-muted mb-2">Listing Activity</p>
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
                      <p className="text-white font-medium text-sm">WhatsApp TV · Lifestyle</p>
                      <p className="text-white/60 text-xs">Illustrative listing preview</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-lg p-3"><p className="text-white/60 text-xs">Audience</p><p className="text-white font-semibold text-sm">14k–18k</p></div>
                    <div className="bg-white/10 rounded-lg p-3"><p className="text-white/60 text-xs">Format</p><p className="text-white font-semibold text-sm">Broadcast</p></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SUPPORTED PLATFORMS */}
        <section className="py-14 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-muted mb-8">Built for the platforms where real conversations happen</p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
              {[{"name":"WhatsApp","color":"#25D366"},{"name":"Telegram","color":"#0088cc"},{"name":"Facebook","color":"#1877F2"},{"name":"Other communities","color":"#6D28D9"}].map((p) => (
                <div key={p.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-sm font-medium text-near-black">{p.name}</span>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-muted max-w-lg mx-auto">PromoLink is an independent marketplace. We are not affiliated with or endorsed by Meta, WhatsApp, Telegram, or any other platform.</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-20 sm:py-24 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">How PromoLink Works</h2>
              <p className="mt-4 text-muted text-lg">A simple path for audience owners and advertisers.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-6">For Audience Owners</p>
                <div className="space-y-6">
                  {[{"step":"1","title":"List your audience","desc":"Submit details about your WhatsApp TV, group, Telegram channel or Facebook Page."},{"step":"2","title":"Discover opportunities","desc":"Make your audience discoverable to brands looking for the right promotional channel."},{"step":"3","title":"Earn from promotions","desc":"Work with advertisers on agreed campaigns and earn according to completed terms."}].map((item) => (
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
                  {[{"step":"1","title":"Discover audiences","desc":"Browse listings by platform, niche, size and location to find suitable channels."},{"step":"2","title":"Choose your opportunity","desc":"Compare available listings, formats and campaign requirements."},{"step":"3","title":"Launch your campaign","desc":"Agree on terms, coordinate delivery and receive evidence of completion."}].map((item) => (
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
                <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">Your Audience Has More Potential.</h2>
                <p className="mt-4 text-muted text-lg leading-relaxed">You already built a real community. PromoLink gives you a professional way to showcase that audience and connect with brands looking for authentic promotional reach.</p>
                <ul className="mt-8 space-y-3.5">
                  {["Showcase your WhatsApp TV, groups, Telegram channels and Facebook Pages","Present clear audience information to interested brands","Discover promotional opportunities that match your community","Manage campaign enquiries in one place","Track agreed campaign requirements and delivery"].map((b) => (
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
                      <p className="font-semibold text-near-black">WhatsApp TV · Lifestyle</p>
                      <p className="text-xs text-muted">City updates & daily content</p>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><p className="text-muted text-xs">Audience size</p><p className="font-semibold text-near-black mt-0.5">12k – 18k</p></div>
                    <div><p className="text-muted text-xs">Primary location</p><p className="font-semibold text-near-black mt-0.5">Nigeria</p></div>
                    <div><p className="text-muted text-xs">Format</p><p className="font-semibold text-near-black mt-0.5">Status + Broadcast</p></div>
                    <div><p className="text-muted text-xs">Indicative rate</p><p className="font-semibold text-near-black mt-0.5">Negotiable</p></div>
                  </div>
                  <p className="text-xs text-muted pt-1">Sample data for illustration. Real listings will show reviewed details.</p>
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
                {[{"platform":"Telegram","name":"Tech & Gadgets Channel","size":"8.5k members"},{"platform":"WhatsApp","name":"Business Owners Group","size":"3.2k members"},{"platform":"Facebook","name":"Fashion & Lifestyle Page","size":"24k followers"}].map((item) => (
                  <div key={item.name} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><span className="text-primary font-bold text-xs">{item.platform[0]}</span></div>
                      <div>
                        <p className="font-medium text-near-black text-sm">{item.name}</p>
                        <p className="text-xs text-muted">{item.size}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary-light text-primary">Illustrative</span>
                  </div>
                ))}
                <p className="text-xs text-muted pt-1">Sample cards only. Live listings will include review status and clear delivery terms.</p>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">Find the Right Audience for Your Brand.</h2>
                <p className="mt-4 text-muted text-lg leading-relaxed">Reach highly engaged communities that traditional ads often miss. Discover audience owners who already have the attention of your ideal customers.</p>
                <ul className="mt-8 space-y-3.5">
                  {["Discover relevant social audiences by platform and niche","Compare listing information and delivery formats","Identify suitable promotional channels quickly","Communicate clear campaign requirements","Organise advertising opportunities in one place"].map((b) => (
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

        {/* MARKETPLACE PREVIEW */}
        <section className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">A Glimpse of the Marketplace</h2>
              <p className="mt-4 text-muted text-lg">Illustrative examples of how listings and campaign opportunities may appear.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[{"platform":"Telegram","category":"Tech","size":"8.5k","format":"Channel post"},{"platform":"WhatsApp","category":"Business","size":"3.2k","format":"Group broadcast"},{"platform":"Facebook","category":"Fashion","size":"24k","format":"Page post"},{"platform":"WhatsApp","category":"Lifestyle","size":"15k","format":"TV status"},{"platform":"Telegram","category":"Education","size":"6.1k","format":"Channel post"},{"platform":"Facebook","category":"Food","size":"11k","format":"Page story"}].map((card, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-primary/15 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-semibold text-primary">{card.platform}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-muted">Illustrative</span>
                  </div>
                  <p className="font-semibold text-near-black">{card.category} Community</p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div><p className="text-muted">Audience</p><p className="font-medium text-near-black mt-0.5">{card.size}</p></div>
                    <div><p className="text-muted">Format</p><p className="font-medium text-near-black mt-0.5">{card.format}</p></div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-muted">All cards above use sample data for demonstration purposes only.</p>
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
              {[{"title":"Clear listing information","desc":"Audience owners provide accurate details about their properties so advertisers can make informed decisions."},{"title":"Transparent campaign requirements","desc":"Advertisers share clear briefs. Owners accept only what they can deliver. Terms are agreed up front."},{"title":"Evidence-based completion","desc":"Completed campaigns require proof of delivery. This protects both sides and builds long-term trust."}].map((item) => (
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
              {[{"q":"What is PromoLink?","a":"PromoLink is a marketplace designed to connect owners of social audiences (WhatsApp TV, groups, Telegram channels, Facebook Pages and more) with advertisers looking for promotional opportunities."},{"q":"Who can list an audience?","a":"Anyone who owns or manages an eligible social property and can provide clear information about it. Listings will go through a review process before appearing in the marketplace."},{"q":"Which social platforms can I list?","a":"Currently we support WhatsApp TV pages and groups, Telegram channels and groups, and Facebook Pages. Additional platforms may be added over time."},{"q":"How do advertisers find suitable audiences?","a":"Advertisers will be able to browse and filter listings by platform, niche, audience size, location and other relevant details."},{"q":"How do audience owners earn?","a":"Earnings depend on available campaign opportunities and the terms agreed with each advertiser. PromoLink does not guarantee any specific income."},{"q":"Does PromoLink guarantee earnings?","a":"No. Earnings depend on demand, the quality of your listing, and the campaigns you successfully complete. We focus on creating a clear and organised connection process."},{"q":"How are promotional campaigns agreed upon?","a":"Advertisers and audience owners discuss requirements, formats, timing and compensation. Once both sides agree, the campaign proceeds with clear deliverables."},{"q":"Is PromoLink available to everyone yet?","a":"We are currently building the full marketplace experience. You can join the early list below to be notified when listings and campaigns open."}].map((item) => (
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
            <p className="mt-4 text-white/75 text-lg max-w-xl mx-auto">Be part of a more organised way for social audiences and brands to connect.</p>
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
            <p>Independent marketplace. Not affiliated with Meta, WhatsApp or Telegram.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
