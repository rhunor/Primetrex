import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/config/site";

const footerLinks = {
  Platform: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Commission Tiers", href: "/how-it-works#tiers" },
    { label: "Get Started", href: "/register" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Support", href: "/contact" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary-dark text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Image
              src="/logos/SVG/light-comb.svg"
              alt="Primetrex"
              width={160}
              height={40}
            />
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              {siteConfig.description}
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-secondary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Primetrex. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href={siteConfig.links.telegram} className="text-white/40 hover:text-secondary transition-colors">
              Telegram
            </Link>
            <Link href={siteConfig.links.twitter} className="text-white/40 hover:text-secondary transition-colors">
              Twitter
            </Link>
            <Link href={siteConfig.links.instagram} className="text-white/40 hover:text-secondary transition-colors">
              Instagram
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
