import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service | Primetrex",
  description: "Terms and conditions for the Primetrex affiliate program.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By registering for and using the Primetrex affiliate platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not register or use the Service. Primetrex reserves the right to update these terms at any time. Continued use after changes constitutes acceptance of the updated terms.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 18 years of age and a resident of Nigeria to participate in the Primetrex affiliate program. By registering, you confirm that all information provided is accurate and complete.`,
  },
  {
    title: "3. One-Time Signup Fee",
    body: `To activate your affiliate account, a one-time non-refundable signup fee of ₦${siteConfig.signupFee.toLocaleString("en-NG")} is required. This fee covers account setup, access to your referral dashboard, and onboarding support. The signup fee is not a subscription and is not recurrent. Primetrex does not offer refunds on the signup fee once your account has been activated.`,
  },
  {
    title: "4. Affiliate Commissions",
    body: `Approved affiliates earn commissions as follows:\n\n• Tier 1 (Direct Referrals): ${siteConfig.commission.tier1Rate}% of the subscription fee paid by every person who signs up using your affiliate link and subscribes to the Primetrex copy trading service.\n\n• Tier 2 (Sub-Referrals): ${siteConfig.commission.tier2Rate}% of the subscription fee paid by people referred by your direct referrals.\n\nCommissions are credited to your account balance after successful payment confirmation. Primetrex reserves the right to adjust commission rates with 30 days' written notice to existing affiliates.`,
  },
  {
    title: "5. Withdrawals",
    body: `The minimum withdrawal amount is ₦${siteConfig.minWithdrawal.toLocaleString("en-NG")}. Withdrawals are processed to your registered Nigerian bank account within 3–5 business days. Primetrex is not responsible for delays caused by your financial institution. You are responsible for ensuring your bank details are accurate. Withdrawals made to incorrect account details are the affiliate's sole responsibility.`,
  },
  {
    title: "6. Prohibited Conduct",
    body: `Affiliates must not:\n\n• Make false or misleading claims about Primetrex or its services.\n• Use spam, unsolicited messaging, or deceptive advertising to drive referrals.\n• Create fake accounts or self-refer to earn commissions fraudulently.\n• Offer any form of kickback, cashback, or payment to referred users in exchange for signing up.\n• Engage in any activity that brings Primetrex into disrepute.\n\nViolation of any prohibited conduct may result in immediate account termination and forfeiture of any pending commissions.`,
  },
  {
    title: "7. Account Termination",
    body: `Primetrex reserves the right to suspend or terminate your affiliate account at any time, with or without cause, including but not limited to: fraudulent activity, violation of these terms, or prolonged inactivity. Upon termination, any unpaid commissions earned through legitimate means will be reviewed and paid out at Primetrex's discretion within 30 days.`,
  },
  {
    title: "8. Disclaimer of Warranties",
    body: `The Primetrex affiliate platform is provided "as is" without warranty of any kind. Primetrex does not guarantee uninterrupted service, specific commission earnings, or the continued availability of the program. Past commission performance is not indicative of future results.`,
  },
  {
    title: "9. Limitation of Liability",
    body: `To the fullest extent permitted by law, Primetrex and its directors, employees, or agents shall not be liable for any indirect, incidental, or consequential damages arising from your use of or inability to use the Service, including loss of profits or commissions.`,
  },
  {
    title: "10. Governing Law",
    body: `These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes shall be subject to the exclusive jurisdiction of the courts of Nigeria.`,
  },
  {
    title: "11. Contact",
    body: `For any questions regarding these terms, please contact us through the Contact page on our website.`,
  },
];

export default function TermsPage() {
  const lastUpdated = "February 2026";

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      {/* Header */}
      <div className="mb-12">
        <span className="text-sm font-semibold uppercase tracking-wider text-primary">
          Legal
        </span>
        <h1 className="mt-3 text-3xl font-bold font-heading text-foreground md:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-muted-foreground">
          Last updated: {lastUpdated}
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Please read these Terms of Service carefully before using the
          Primetrex affiliate platform. By creating an account, you agree to be
          bound by these terms.
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
