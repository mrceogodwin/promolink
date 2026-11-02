"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

const channels = [
  { name: "WhatsApp", mark: "W", tone: "green" },
  { name: "Telegram", mark: "↗", tone: "mint" },
  { name: "Facebook", mark: "f", tone: "mint" },
  { name: "Instagram", mark: "◎", tone: "lime" },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}


function CreatorCutout() {
  return (
    <div className="pl-creator-cutout" aria-label="PromoLink creator holding a phone">
      <svg viewBox="0 0 360 460" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="creator-skin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#9b573b"/><stop offset=".55" stopColor="#713a2d"/><stop offset="1" stopColor="#4a2925"/></linearGradient>
          <linearGradient id="creator-shirt" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d8ff8d"/><stop offset="1" stopColor="#72d79a"/></linearGradient>
          <linearGradient id="creator-phone" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#24352c"/><stop offset="1" stopColor="#071b13"/></linearGradient>
        </defs>
        <ellipse cx="183" cy="438" rx="125" ry="14" fill="#063d2b" opacity=".13"/>
        <path d="M73 460c4-80 24-130 74-150h73c52 18 75 76 78 150Z" fill="url(#creator-shirt)"/>
        <path d="M119 322c16-21 35-31 66-31 30 0 54 12 70 34l-29 39-44-24-42 24Z" fill="#f3c6a7"/>
        <path d="M119 152c-8-54 18-99 68-104 57-6 88 34 84 94l-7 81c-5 48-37 78-75 77-42-1-69-37-72-82Z" fill="url(#creator-skin)"/>
        <path d="M112 168c-20-70 3-136 65-148 45-9 87 13 104 55 10 26 7 66-4 94l-17-38-8-49c-23 15-56 24-95 24-7 24-20 45-45 62Z" fill="#171411"/>
        <path d="M117 120c-13 30-16 73-7 105-19-12-28-34-24-57 3-21 14-39 31-48Zm154-18c19 18 27 47 20 73-4 15-13 27-25 34l5-52Z" fill="#171411"/>
        <path d="M147 178c9-7 21-8 31-2m35 0c10-6 22-5 31 2" fill="none" stroke="#2d1915" strokeWidth="5" strokeLinecap="round"/>
        <path d="M163 216c13 11 30 11 43 0" fill="none" stroke="#45221c" strokeWidth="4" strokeLinecap="round"/>
        <path d="M190 188l-5 17 9 3" fill="none" stroke="#5a3027" strokeWidth="3" strokeLinecap="round"/>
        <path d="M151 258c20 15 51 17 73 0l-4 48c-20 21-48 21-67 0Z" fill="url(#creator-skin)"/>
        <path d="M103 350c13-25 30-42 51-49l31 33 33-33c32 11 53 33 65 65l-24 94H99Z" fill="url(#creator-shirt)"/>
        <path d="M183 332c-16 21-29 44-39 72l-21 56h-45c13-54 26-98 50-126 14-16 31-26 50-31Z" fill="#baf17b"/>
        <path d="M230 308c26 7 48 29 62 62l24 90h-48l-25-76-35-37Z" fill="#8ce0a0"/>
        <path d="M239 211c19 5 30 19 35 40l15 66-28 11-27-72Z" fill="url(#creator-skin)"/>
        <g transform="rotate(-9 276 236)">
          <rect x="247" y="157" width="69" height="125" rx="13" fill="url(#creator-phone)" stroke="#d8ff8d" strokeWidth="3"/>
          <rect x="253" y="166" width="57" height="106" rx="8" fill="#e9f8ed"/>
          <rect x="263" y="178" width="37" height="5" rx="2.5" fill="#08794e"/>
          <rect x="263" y="192" width="29" height="24" rx="5" fill="#c8f169"/>
          <path d="M266 207l7-8 7 6 8-9" fill="none" stroke="#08794e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="263" y="224" width="37" height="4" rx="2" fill="#a9c9b2"/>
          <rect x="263" y="234" width="27" height="4" rx="2" fill="#a9c9b2"/>
          <circle cx="281" cy="261" r="3" fill="#08794e"/>
        </g>
        <path d="M245 232c-12-4-21 1-24 12l-8 29c-3 10 3 18 13 19 9 1 17-5 20-14l10-28Z" fill="url(#creator-skin)"/>
        <path d="M90 382c-9 15-16 35-20 59h40l14-38Z" fill="#78d99a"/>
        <circle cx="132" cy="183" r="4" fill="#171411"/><circle cx="239" cy="183" r="4" fill="#171411"/>
        <path d="M142 137c-3 21-13 37-28 48m147-51c6 19 17 32 31 39" fill="none" stroke="#171411" strokeWidth="13" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span className="section-label-dot" />
      {children}
    </div>
  );
}

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="pl-site">
      <header className="pl-header">
        <div className="pl-nav-wrap">
          <div className="pl-brand"><Logo dark /></div>
          <nav className="pl-nav-links" aria-label="Main navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#for-owners">For creators</a>
            <a href="#for-advertisers">For brands</a>
          </nav>
          <div className="pl-nav-actions">
            <Link href="/login" className="pl-login">Log in</Link>
            <Link href="/register" className="pl-button pl-button-yellow pl-nav-cta">Get started <Arrow diagonal /></Link>
          </div>
          <button className="pl-menu-toggle" aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>
            <span /><span />
          </button>
        </div>
        {mobileOpen && (
          <nav className="pl-mobile-nav" aria-label="Mobile navigation">
            <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
            <a href="#for-owners" onClick={() => setMobileOpen(false)}>For creators</a>
            <a href="#for-advertisers" onClick={() => setMobileOpen(false)}>For brands</a>
            <Link href="/login" onClick={() => setMobileOpen(false)}>Log in</Link>
            <Link href="/register" className="pl-button pl-button-yellow" onClick={() => setMobileOpen(false)}>Get started <Arrow diagonal /></Link>
          </nav>
        )}
      </header>

      <main>
        <section className="pl-hero">
          <div className="pl-hero-glow" />
          <div className="pl-hero-grid" />
          <div className="pl-container pl-hero-layout">
            <div className="pl-hero-copy">
              <div className="pl-eyebrow"><span className="pl-live-dot" /> THE AUDIENCE COMMERCE PLATFORM</div>
              <h1>Your audience is<br />an <span>opportunity.</span></h1>
              <p className="pl-hero-description">The place where audience owners meet brands ready to reach the right people. Make your reach valuable. Make every campaign count.</p>
              <div className="pl-hero-actions">
                <Link href="/register?role=audience_owner" className="pl-button pl-button-yellow pl-button-large">Monetise your audience <Arrow diagonal /></Link>
                <Link href="/register?role=advertiser" className="pl-button pl-button-outline pl-button-large">Find your audience <Arrow /></Link>
              </div>
              <div className="pl-trust-note"><span className="pl-check">✓</span> Owners stay in control. Campaigns need approval.</div>
            </div>

            <div className="pl-product-visual" aria-label="Illustration of the PromoLink campaign workspace">
              <div className="pl-orbit pl-orbit-one" />
              <div className="pl-orbit pl-orbit-two" />
              <div className="pl-app-window">
                <div className="pl-app-topbar">
                  <div className="pl-window-dots"><i /><i /><i /></div>
                  <span>YOUR PROMOLINK WORKSPACE</span>
                  <span className="pl-topbar-menu">•••</span>
                </div>
                <div className="pl-app-content">
                  <div className="pl-app-sidebar">
                    <div className="pl-sidebar-mark">↗</div>
                    <span className="active">▦</span><span>◉</span><span>↗</span><span>⌘</span>
                    <div className="pl-sidebar-bottom">?</div>
                  </div>
                  <div className="pl-app-main">
                    <div className="pl-app-heading">
                      <div><span className="pl-small-overline">OVERVIEW</span><h3>Campaign workspace</h3></div>
                      <span className="pl-avatar">PL</span>
                    </div>
                    <div className="pl-app-welcome"><div><span>YOUR NEXT MOVE STARTS HERE</span><strong>Make your reach work.</strong></div><span className="pl-welcome-icon">↗</span></div>
                    <div className="pl-stat-grid">
                      <div className="pl-stat-card"><span>Campaigns</span><strong>—</strong><small>Track your activity</small></div>
                      <div className="pl-stat-card"><span>Audience reach</span><strong>—</strong><small>Across your channels</small></div>
                      <div className="pl-stat-card"><span>Campaign status</span><strong className="pl-status-text">Ready when you are</strong><small>Start by setting up your account</small></div>
                    </div>
                    <div className="pl-app-list">
                      <div className="pl-list-heading"><strong>Choose your channel</strong><span>Channel options</span></div>
                      <div className="pl-channel-list">
                        {channels.map((channel) => <div className="pl-channel-row" key={channel.name}><span className={"pl-channel-icon " + channel.tone}>{channel.mark}</span><span>{channel.name}</span><span className="pl-channel-arrow">↗</span></div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pl-float-card pl-float-card-top"><span className="pl-float-icon">✳</span><div><strong>Built around trust</strong><small>Owners approve campaigns</small></div></div>
              <div className="pl-float-card pl-float-card-bottom"><span className="pl-float-icon pl-float-icon-dark">↗</span><div><strong>One connected marketplace</strong><small>Audiences meet opportunity</small></div></div>
            </div>
          </div>
          <div className="pl-hero-bottom"><span>BUILT FOR AUDIENCE OWNERS</span><span className="pl-bottom-line" /><span>MADE FOR AMBITIOUS BRANDS</span><span className="pl-bottom-line" /><span>DESIGNED TO SCALE</span></div>
        </section>

        <section className="pl-channel-strip" aria-label="Supported and planned social channels">
          <div className="pl-container pl-channel-strip-inner">
            <span className="pl-channel-strip-label">AUDIENCE CHANNELS</span>
            {channels.map((channel) => <div className="pl-strip-channel" key={channel.name}><span className={"pl-channel-icon " + channel.tone}>{channel.mark}</span>{channel.name}</div>)}
            <span className="pl-channel-strip-note">Availability depends on channel access and permissions.</span>
          </div>
        </section>

        <section className="pl-section pl-light-section" id="how-it-works">
          <div className="pl-container">
            <div className="pl-intro-layout">
              <div className="pl-section-intro">
                <SectionLabel>THE PROMOLINK WAY</SectionLabel>
                <h2>Less chasing.<br /><span>More connecting.</span></h2>
                <p>A clearer way to bring brands and communities together—with transparent campaign workflows and control where it matters.</p>
              </div>
              <div className="pl-dashboard-preview" aria-label="Preview of the PromoLink dashboard">
                <div className="pl-preview-glow" />
                <div className="pl-preview-window">
                  <div className="pl-preview-topbar"><div className="pl-window-dots"><i /><i /><i /></div><span>PROMOLINK / WORKSPACE</span><b>•••</b></div>
                  <div className="pl-preview-body">
                    <aside className="pl-preview-sidebar"><span className="pl-preview-logo">P</span><i className="selected">▦</i><i>◉</i><i>↗</i><i>⌘</i><small>?</small></aside>
                    <div className="pl-preview-main">
                      <div className="pl-preview-heading"><div><small>OVERVIEW</small><strong>Your workspace</strong></div><span>PL</span></div>
                      <div className="pl-preview-welcome"><small>YOUR NEXT MOVE STARTS HERE</small><strong>Make your reach work.</strong><span>↗</span></div>
                      <div className="pl-preview-stats"><div><small>Campaigns</small><b>12</b><em>+3 this month</em></div><div><small>Audience reach</small><b>48.2k</b><em>Across channels</em></div></div>
                      <div className="pl-preview-chart"><div><strong>Campaign activity</strong><small>Last 30 days</small></div><div className="pl-chart-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div>
                      <div className="pl-preview-bottom"><strong>Recent campaigns</strong><span>View all ↗</span></div>
                      <div className="pl-preview-row"><i/><span>Summer product launch</span><b>In review</b></div>
                      <div className="pl-preview-row"><i/><span>Community spotlight</span><b className="live">Active</b></div>
                    </div>
                  </div>
                </div>
                <div className="pl-preview-float"><span>✓</span><div><b>Owner approved</b><small>Campaign workflow</small></div></div>
                <CreatorCutout />
              </div>
            </div>
            <div className="pl-steps-grid">
              <article className="pl-step-card"><div className="pl-step-top"><span>01 / LIST</span><span className="pl-step-symbol">↗</span></div><div className="pl-step-graphic pl-graphic-list"><div className="pl-mini-profile"><span>AO</span><div><b>Your audience</b><small>Channel · Category · Reach</small></div><i>✓</i></div><div className="pl-mini-bars"><i /><i /><i /></div></div><h3>Put your audience on the map.</h3><p>Present your channel or promotional opportunity with the details brands need to evaluate a fit.</p></article>
              <article className="pl-step-card"><div className="pl-step-top"><span>02 / MATCH</span><span className="pl-step-symbol">⌕</span></div><div className="pl-step-graphic pl-graphic-match"><div className="pl-match-card"><span className="pl-match-spark">✳</span><div><b>Campaign brief</b><small>Audience · Goal · Budget</small></div><span className="pl-match-arrow">→</span></div><div className="pl-match-line" /><div className="pl-match-card pl-match-card-dark"><span className="pl-match-spark">◉</span><div><b>Right-fit audience</b><small>Review the opportunity</small></div><span>✓</span></div></div><h3>Find the right fit.</h3><p>Advertisers discover relevant audience opportunities and agree on the campaign before it goes live.</p></article>
              <article className="pl-step-card"><div className="pl-step-top"><span>03 / GROW</span><span className="pl-step-symbol">↗</span></div><div className="pl-step-graphic pl-graphic-grow"><div className="pl-grow-ring"><span>↗</span></div><div className="pl-grow-caption"><b>Campaign progress</b><small>Evidence &amp; results</small><div className="pl-grow-track"><i /></div></div></div><h3>Keep the process clear.</h3><p>Follow campaign status and available performance evidence, with the owner and advertiser aligned.</p></article>
            </div>
          </div>
        </section>

        <section className="pl-section pl-dark-section" id="for-owners">
          <div className="pl-container pl-split-layout">
            <div className="pl-split-copy">
              <SectionLabel>FOR AUDIENCE OWNERS</SectionLabel>
              <h2>Your reach took work.<br /><span>Let it create value.</span></h2>
              <p>Turn your audience-building effort into a professional advertising opportunity. Set expectations, review campaign requests and keep control of what you accept.</p>
              <ul className="pl-feature-list"><li><span>✓</span> Present your audience on your terms</li><li><span>✓</span> Review campaigns before accepting</li><li><span>✓</span> Keep private contact data private</li><li><span>✓</span> Track campaign status and agreed deliverables</li></ul>
              <Link href="/register?role=audience_owner" className="pl-button pl-button-yellow pl-button-large">Become an audience owner <Arrow diagonal /></Link>
            </div>
            <div className="pl-owner-visual">
              <div className="pl-owner-card">
                <div className="pl-owner-card-top"><span>YOUR LISTING</span><span className="pl-review-pill"><i /> REVIEW-LED</span></div>
                <div className="pl-owner-profile"><div className="pl-owner-avatar">A</div><div><strong>Your audience, your rules.</strong><span>Promotional opportunity</span></div></div>
                <div className="pl-owner-divider" />
                <div className="pl-owner-field"><span>Channel</span><strong>Connected social audience</strong></div>
                <div className="pl-owner-field"><span>Campaign permissions</span><strong>Owner approval required</strong></div>
                <div className="pl-owner-field"><span>Private contacts</span><strong className="pl-private-status">Never publicly listed <span>✓</span></strong></div>
                <div className="pl-owner-footer"><span>YOUR AUDIENCE STAYS YOURS</span><span>↗</span></div>
              </div>
              <div className="pl-owner-sticker"><span>✳</span> Your audience.<br />Your decision.</div>
            </div>
          </div>
        </section>

        <section className="pl-section pl-light-section pl-advertiser-section" id="for-advertisers">
          <div className="pl-container pl-split-layout pl-advertiser-layout">
            <div className="pl-advertiser-visual">
              <div className="pl-campaign-panel">
                <div className="pl-campaign-panel-top"><span>CAMPAIGN BRIEF</span><span className="pl-campaign-status">● DRAFT</span></div>
                <h3>Start with the right audience.</h3>
                <p>Define what you want to promote and agree on the deliverables before a campaign begins.</p>
                <div className="pl-brief-row"><span>01</span><div><strong>Choose a channel</strong><small>Explore eligible opportunities</small></div><span>↗</span></div>
                <div className="pl-brief-row"><span>02</span><div><strong>Set your campaign brief</strong><small>Goal, creative and budget</small></div><span>↗</span></div>
                <div className="pl-brief-row"><span>03</span><div><strong>Get owner approval</strong><small>Agree before launch</small></div><span>✓</span></div>
                <div className="pl-brief-note"><span>✳</span> Clear expectations. More accountable campaigns.</div>
              </div>
            </div>
            <div className="pl-split-copy pl-advertiser-copy">
              <SectionLabel>FOR ADVERTISERS</SectionLabel>
              <h2>Reach people.<br /><span>Not just numbers.</span></h2>
              <p>Discover promotional opportunities that fit your brand, set a clear brief and work directly through a structured approval process.</p>
              <ul className="pl-feature-list pl-feature-list-dark"><li><span>✓</span> Explore audience opportunities by channel</li><li><span>✓</span> Define campaign goals and deliverables</li><li><span>✓</span> Get owner approval before campaigns run</li><li><span>✓</span> Review available campaign evidence</li></ul>
              <Link href="/register?role=advertiser" className="pl-button pl-button-dark pl-button-large">Start a campaign <Arrow diagonal /></Link>
            </div>
          </div>
        </section>

        <section className="pl-privacy-band">
          <div className="pl-container pl-privacy-inner"><div className="pl-privacy-icon">⌑</div><div><span>BUILT ON A SIMPLE PRINCIPLE</span><h2>Your reach is valuable.<br />Your privacy is non-negotiable.</h2></div><p>PromoLink is designed to keep private audience contact details out of public listings. Campaign access and metrics depend on channel permissions and verified evidence.</p></div>
        </section>

        <section className="pl-section pl-final-cta-section">
          <div className="pl-container">
            <div className="pl-final-cta"><div className="pl-final-glow" /><div className="pl-final-cta-content"><SectionLabel>YOUR NEXT MOVE</SectionLabel><h2>Make your audience<br /><span>mean more.</span></h2><p>Join the marketplace built to connect attention with opportunity.</p><div className="pl-hero-actions"><Link href="/register?role=audience_owner" className="pl-button pl-button-yellow pl-button-large">I own an audience <Arrow diagonal /></Link><Link href="/register?role=advertiser" className="pl-button pl-button-outline pl-button-large">I’m a brand <Arrow diagonal /></Link></div></div><div className="pl-final-watermark">↗</div></div>
          </div>
        </section>
      </main>

      <footer className="pl-footer">
        <div className="pl-container">
          <div className="pl-footer-main"><div className="pl-footer-brand"><div><Logo dark /></div><p>Your audience. Your opportunity.</p></div><div className="pl-footer-links"><div><span>EXPLORE</span><a href="#how-it-works">How it works</a><a href="#for-owners">For creators</a><a href="#for-advertisers">For brands</a></div><div><span>YOUR ACCOUNT</span><Link href="/login">Log in</Link><Link href="/register">Get started</Link></div></div><div className="pl-footer-note"><span className="pl-live-dot" /> A new way to connect audiences and opportunity.</div></div>
          <div className="pl-footer-bottom"><span>© {new Date().getFullYear()} PromoLink</span><span>Built for meaningful reach.</span></div>
        </div>
      </footer>
    </div>
  );
}
