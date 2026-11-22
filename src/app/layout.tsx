import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://promolink.ng";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "PromoLink — Your Audience. Your Opportunity.",
  description:
    "PromoLink connects owners of WhatsApp communities and social channels with advertisers looking to reach relevant audiences through permission-led campaign workflows.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "PromoLink — Your Audience. Your Opportunity.",
    description:
      "Connect your social audience with brands. List your properties, get discovered, and earn from approved promotions.",
    type: "website",
    url: siteUrl,
    siteName: "PromoLink",
  },
  twitter: {
    card: "summary_large_image",
    title: "PromoLink — Your Audience. Your Opportunity.",
    description: "Connect audience owners and advertisers through approval-led campaign workflows.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
