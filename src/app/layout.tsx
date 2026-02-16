import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Primetrex | Affiliate Marketing Platform",
    template: "%s | Primetrex",
  },
  description:
    "Earn money by referring others to Primetrex copy trading. Get your unique referral link, share it, and earn commissions every month.",
  keywords: [
    "affiliate marketing",
    "copy trading",
    "referral program",
    "earn money",
    "Primetrex",
    "forex",
    "passive income",
  ],
  icons: {
    icon: "/favicon/SVG/Vector-1.svg",
    apple: "/favicon/PNG/Vector-1.png",
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
