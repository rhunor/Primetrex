import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Primetrex | Affiliate Program — Earn Commissions with Copy Trading",
    template: "%s | Primetrex",
  },
  description:
    "Primetrex is a copy trading affiliate platform where you earn up to 40% commission every month. Share your referral link, grow your network, and earn passive income.",
  keywords: [
    "Primetrex",
    "Primetrex affiliates",
    "Primetrex affiliate program",
    "primetrexaffiliates.com",
    "affiliate marketing Nigeria",
    "copy trading affiliate",
    "referral program Nigeria",
    "earn commissions online",
    "forex affiliate",
    "passive income Nigeria",
    "make money online Nigeria",
  ],
  metadataBase: new URL("https://primetrexaffiliates.com"),
  alternates: {
    canonical: "https://primetrexaffiliates.com",
  },
  openGraph: {
    type: "website",
    url: "https://primetrexaffiliates.com",
    siteName: "Primetrex",
    title: "Primetrex | Affiliate Program — Earn Commissions with Copy Trading",
    description:
      "Join Primetrex Affiliates and earn up to 40% commission every month. Share your referral link, grow your network, and earn passive income through our copy trading platform.",
    images: [
      {
        url: "/logos/PNG/Light Comb.png",
        width: 1200,
        height: 630,
        alt: "Primetrex Affiliates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Primetrex Affiliates | Earn Commissions with Copy Trading",
    description:
      "Join Primetrex Affiliates and earn up to 40% commission every month. Share your referral link and earn passive income.",
    images: ["/logos/PNG/Light Comb.png"],
  },
  icons: {
    icon: "/favicon/SVG/Vector-1.svg",
    apple: "/favicon/PNG/Vector-1.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
