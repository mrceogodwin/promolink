import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="font-semibold text-lg text-near-black tracking-tight">
                PromoLink
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
              <a href="#how-it-works" className="hover:text-primary transition-colors">
                How It Works
              </a>
              <a href="#for-owners" className="hover:text-primary transition-colors">
                For Audience Owners
              </a>
              <a href="#for-advertisers" className="hover:text-primary transition-colors">
                For Advertisers
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="#cta"
                className="hidden sm:inline-flex text-sm font-medium text-muted hover:text-primary transition-colors"
              >
                Log in
              </Link>
              <Link
                href="#cta"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-light/40 to-white pointer-events-none" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-4">
                Your Audience. Your Opportunity.
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-near-black leading-[1.1]">
                Your Social Audience Can Open New Earning Opportunities.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed max-w-2xl">
                PromoLink helps owners of WhatsApp TV pages, groups, Telegram
                channels, and Facebook Pages connect with brands looking to
                promote products and services — so you can earn from the audience
                you already built.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <a
                  href="#cta"
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
                >
                  Start Earning
                </a>
                <a
                  href="#for-advertisers"
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-near-black hover:border-primary hover:text-primary transition-colors"
                >
                  Advertise With Us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="py-16 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-muted mb-8">
              Built for the platforms where real conversations happen
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              {["WhatsApp", "Telegram", "Facebook", "More coming"].map(
                (platform) => (
                  <div
                    key={platform}
                    className="flex items-center gap-2 text-near-black font-medium"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span>{platform}</span>
                  </div>
                )
              )}
            </div>
            <p className="mt-6 text-center text-xs text-muted max-w-xl mx-auto">
              PromoLink is an independent marketplace. We are not affiliated with
              or endorsed by Meta, WhatsApp, Telegram, or any other platform.
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">
                How PromoLink Works
              </h2>
              <p className="mt-4 text-muted text-lg">
                A simple, transparent process designed for both audience owners
                and advertisers.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  step: "01",
                  title: "List your properties",
                  description:
                    "Create a profile and submit your WhatsApp TV, group, Telegram channel, or Facebook Page for review. Share accurate audience details so brands can find the right fit.",
                },
                {
                  step: "02",
                  title: "Get discovered",
                  description:
                    "Advertisers browse verified listings by platform, size, location, and niche. They reach out or book campaigns that match their goals.",
                },
                {
                  step: "03",
                  title: "Deliver & earn",
                  description:
                    "Agree on terms, deliver the promotion, and provide clear evidence of delivery. Get paid for completed, approved campaigns.",
                },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="text-5xl font-bold text-primary-light mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-near-black mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Audience Owners */}
        <section id="for-owners" className="py-20 sm:py-24 bg-primary-light/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">
                  Built for Audience Owners
                </h2>
                <p className="mt-4 text-muted text-lg leading-relaxed">
                  You already spent time growing a real community. PromoLink gives
                  you a professional way to turn that attention into income without
                  spammy DMs or unclear deals.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "List WhatsApp TV pages, groups, Telegram channels, and Facebook Pages",
                    "Set your rates and availability clearly",
                    "Get discovered by brands looking for exactly your audience",
                    "Keep control of what you promote",
                    "Receive structured campaign briefs and delivery requirements",
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      <span className="text-near-black">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">
                  Example listing preview
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-near-black">
                      WhatsApp TV · Lifestyle
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary-light text-primary font-medium">
                      Illustrative
                    </span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted">Audience size</p>
                      <p className="font-semibold text-near-black">12k–18k</p>
                    </div>
                    <div>
                      <p className="text-muted">Primary location</p>
                      <p className="font-semibold text-near-black">Nigeria</p>
                    </div>
                    <div>
                      <p className="text-muted">Format</p>
                      <p className="font-semibold text-near-black">Status + Broadcast</p>
                    </div>
                    <div>
                      <p className="text-muted">Typical rate</p>
                      <p className="font-semibold text-near-black">Negotiable</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted pt-2">
                    This is sample data for illustration only. Real listings will
                    show verified details after review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* For Advertisers */}
        <section id="for-advertisers" className="py-20 sm:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-4">
                  Marketplace preview
                </p>
                <div className="space-y-3">
                  {[
                    { name: "Telegram Channel · Tech", size: "8.5k members", tag: "Illustrative" },
                    { name: "WhatsApp Group · Business", size: "3.2k members", tag: "Illustrative" },
                    { name: "Facebook Page · Fashion", size: "24k followers", tag: "Illustrative" },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:border-primary/20 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-near-black text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted">{item.size}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-medium">
                        {item.tag}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted mt-4">
                  Sample cards only. Live listings will include review status and
                  clear delivery terms.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">
                  Built for Advertisers
                </h2>
                <p className="mt-4 text-muted text-lg leading-relaxed">
                  Reach highly engaged communities that traditional ads often miss.
                  Find audience owners who already have the attention of your ideal
                  customers.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    "Browse listings by platform, niche, size, and location",
                    "See clear audience descriptions and delivery formats",
                    "Request campaigns with structured briefs",
                    "Receive evidence of delivery for every campaign",
                    "Work with owners who understand their communities",
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      <span className="text-near-black">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Transparency */}
        <section className="py-20 sm:py-24 bg-near-black text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Trust & Transparency
              </h2>
              <p className="mt-4 text-gray-300 text-lg">
                We designed PromoLink so both sides know what to expect.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Listing review",
                  description:
                    "Every property goes through a review process before it appears in the marketplace. We look for clear ownership signals and accurate audience information.",
                },
                {
                  title: "Campaign requirements",
                  description:
                    "Advertisers provide clear briefs. Owners accept only what they can deliver. Terms, formats, and timing are agreed up front.",
                },
                {
                  title: "Evidence-based delivery",
                  description:
                    "Completed campaigns require proof of delivery. This protects advertisers and builds long-term reputation for reliable audience owners.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 sm:py-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: "What platforms can I list?",
                  a: "Currently we support WhatsApp TV pages, WhatsApp groups, Telegram channels, and Facebook Pages. Additional platforms may be added later.",
                },
                {
                  q: "Is PromoLink affiliated with WhatsApp, Telegram, or Meta?",
                  a: "No. PromoLink is an independent marketplace. We are not affiliated with, endorsed by, or partnered with Meta, WhatsApp, Telegram, or any other platform.",
                },
                {
                  q: "How do I get paid?",
                  a: "Payment terms will be agreed between you and the advertiser for each campaign. PromoLink focuses on clear delivery requirements and evidence so both sides can complete transactions confidently.",
                },
                {
                  q: "Do I need a large audience to join?",
                  a: "Quality and engagement matter more than raw size. Smaller, well-defined communities are often more valuable to the right advertisers.",
                },
                {
                  q: "When can I start listing or advertising?",
                  a: "We are building the full marketplace experience. You can join the waitlist below to be notified when listings and campaigns open.",
                },
              ].map((item) => (
                <div
                  key={item.q}
                  className="border border-gray-100 rounded-xl p-6"
                >
                  <h3 className="font-semibold text-near-black mb-2">{item.q}</h3>
                  <p className="text-muted leading-relaxed text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="cta" className="py-20 sm:py-24 bg-primary-light/40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-near-black tracking-tight">
              Ready to turn attention into opportunity?
            </h2>
            <p className="mt-4 text-muted text-lg max-w-xl mx-auto">
              Whether you own an audience or want to reach one, PromoLink is being
              built for you. Join the early list and be first to know when we open.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@promolink.ng?subject=I%20want%20to%20Start%20Earning"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-primary-deep transition-colors"
              >
                Start Earning
              </a>
              <a
                href="mailto:hello@promolink.ng?subject=I%20want%20to%20Advertise"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-8 py-3.5 text-base font-semibold text-near-black hover:border-primary hover:text-primary transition-colors"
              >
                Advertise With Us
              </a>
            </div>
            <p className="mt-6 text-sm text-muted">
              No account required yet. Just tell us how you’d like to use PromoLink.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-near-black text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="font-semibold text-white text-lg">PromoLink</span>
              </div>
              <p className="text-sm max-w-xs">
                Your Audience. Your Opportunity.
              </p>
            </div>
            <div className="flex flex-wrap gap-8 text-sm">
              <div>
                <p className="font-semibold text-white mb-3">Product</p>
                <ul className="space-y-2">
                  <li>
                    <a href="#how-it-works" className="hover:text-white transition-colors">
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a href="#for-owners" className="hover:text-white transition-colors">
                      For Audience Owners
                    </a>
                  </li>
                  <li>
                    <a href="#for-advertisers" className="hover:text-white transition-colors">
                      For Advertisers
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-white mb-3">Company</p>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="mailto:hello@promolink.ng"
                      className="hover:text-white transition-colors"
                    >
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} PromoLink. All rights reserved.</p>
            <p>
              Independent marketplace. Not affiliated with Meta, WhatsApp, or
              Telegram.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
