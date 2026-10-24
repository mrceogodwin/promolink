import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromoLink — Your Audience. Your Opportunity.",
  description:
    "PromoLink connects owners of WhatsApp TV pages, groups, Telegram channels, and Facebook Pages with advertisers looking to promote products and services.",
  openGraph: {
    title: "PromoLink — Your Audience. Your Opportunity.",
    description:
      "Connect your social audience with brands. List your properties, get discovered, and earn from approved promotions.",
    type: "website",
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
