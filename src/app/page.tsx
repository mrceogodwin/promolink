"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

const channels = [
  { name: "WhatsApp", mark: "W", tone: "green" },
  { name: "Telegram", mark: "↗", tone: "blue" },
  { name: "Facebook", mark: "f", tone: "blue" },
  { name: "Instagram", mark: "◎", tone: "pink" },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
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
          <Link href="/" className="pl-brand" aria-label="PromoLink home">
            <Logo />
          </Link>
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
                    <div className="pl-sidebar-mark">P</div>
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
            <div className="pl-section-intro">
              <SectionLabel>THE PROMOLINK WAY</SectionLabel>
              <h2>Less chasing.<br /><span>More connecting.</span></h2>
              <p>A clearer way to bring brands and communities together—with transparent campaign workflows and control where it matters.</p>
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
            <div className="pl-final-cta"><div className="pl-final-glow" /><div className="pl-final-cta-content"><SectionLabel>YOUR NEXT MOVE</SectionLabel><h2>Make your audience<br /><span>mean more.</span></h2><p>Join the marketplace built to connect attention with opportunity.</p><div className="pl-hero-actions"><Link href="/register?role=audience_owner" className="pl-button pl-button-yellow pl-button-large">I own an audience <Arrow diagonal /></Link><Link href="/register?role=advertiser" className="pl-button pl-button-outline pl-button-large">I’m a brand <Arrow diagonal /></Link></div></div><div className="pl-final-watermark">P</div></div>
          </div>
        </section>
      </main>

      <footer className="pl-footer">
        <div className="pl-container">
          <div className="pl-footer-main"><div className="pl-footer-brand"><Link href="/" aria-label="PromoLink home"><Logo /></Link><p>Your audience. Your opportunity.</p></div><div className="pl-footer-links"><div><span>EXPLORE</span><a href="#how-it-works">How it works</a><a href="#for-owners">For creators</a><a href="#for-advertisers">For brands</a></div><div><span>YOUR ACCOUNT</span><Link href="/login">Log in</Link><Link href="/register">Get started</Link></div></div><div className="pl-footer-note"><span className="pl-live-dot" /> A new way to connect audiences and opportunity.</div></div>
          <div className="pl-footer-bottom"><span>© {new Date().getFullYear()} PromoLink</span><span>Built for meaningful reach.</span></div>
        </div>
      </footer>
    </div>
  );
}
