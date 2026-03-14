import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Primetrex",
  description: "How Primetrex collects, uses, and protects your personal data.",
};

const sections = [
  {
    title: "1. Introduction",
    body: `Primetrex ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data. By using our platform, you consent to the practices described here.`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect the following categories of personal information:\n\n• Identity Data: First name, last name, email address.\n• Payment Data: Bank account number, bank name, and account holder name (for withdrawal processing). We do not store card details — payments are processed securely by Korapay.\n• Account Data: Referral code, referral history, commission earnings, withdrawal records.\n• Technical Data: IP address, browser type, device type, access timestamps.\n• Communication Data: Messages sent via our contact form.`,
  },
  {
    title: "3. How We Use Your Information",
    body: `We use your personal data to:\n\n• Create and manage your affiliate account.\n• Process payments and payouts.\n• Track referrals and calculate commissions.\n• Send transactional emails (account verification, payment confirmation, commission notifications).\n• Respond to your enquiries and support requests.\n• Comply with legal and regulatory obligations.\n• Detect and prevent fraud or misuse.`,
  },
  {
    title: "4. Third-Party Services",
    body: `We work with trusted third-party services that process your data on our behalf:\n\n• Korapay: Processes all payments and payouts. Governed by Korapay's own Privacy Policy.\n• Resend: Delivers transactional emails.\n• MongoDB Atlas: Stores your account data securely in encrypted cloud databases.\n• Vercel: Hosts our platform infrastructure.\n\nWe do not sell your personal data to any third party.`,
  },
  {
    title: "5. Data Retention",
    body: `We retain your account data for as long as your account is active. If your account is closed, we may retain records for up to 7 years to comply with financial regulations and resolve disputes. Anonymised, aggregated analytics data may be kept indefinitely.`,
  },
  {
    title: "6. Cookies",
    body: `We use essential session cookies to keep you logged in and to secure your account. We do not use advertising or tracking cookies. Our site uses Google reCAPTCHA on the registration form to prevent spam, which may set its own cookies subject to Google's Privacy Policy.`,
  },
  {
    title: "7. Your Rights",
    body: `You have the right to:\n\n• Access the personal data we hold about you.\n• Request correction of inaccurate data.\n• Request deletion of your account and associated data (subject to legal retention obligations).\n• Withdraw consent for non-essential communications at any time.\n\nTo exercise any of these rights, contact us through our Contact page.`,
  },
  {
    title: "8. Data Security",
    body: `We implement industry-standard security measures including encrypted data storage, HTTPS-only connections, hashed passwords (bcrypt), and access controls. While we take all reasonable steps to protect your data, no internet transmission is 100% secure.`,
  },
  {
    title: "9. Children's Privacy",
    body: `Our Service is not directed at anyone under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has registered, please contact us and we will remove the account.`,
  },
  {
    title: "10. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify registered users of material changes via email. Continued use of the platform after updates constitutes acceptance of the revised policy.`,
  },
  {
    title: "11. Contact",
    body: `If you have any questions about this Privacy Policy or how your data is handled, please contact us through the Contact page on our website.`,
  },
];

export default function PrivacyPage() {
  const lastUpdated = "February 2026";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      {/* Header */}
      <div className="mb-12">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">
          Legal
        </span>
        <h1 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Your privacy matters to us. This policy explains how Primetrex
          collects, uses, and safeguards your personal information.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold font-heading text-foreground mb-3">
              {section.title}
            </h2>
            <div className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
              {section.body}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Primetrex. All rights reserved.
      </div>
    </div>
  );
}
