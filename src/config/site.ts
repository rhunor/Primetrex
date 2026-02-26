export const siteConfig = {
  name: "Primetrex",
  tagline: "Let the Experts Trade, You Build the Business",
  description:
    "Earn money by referring others to Primetrex copy trading. Pay a one-time ₦15,000 signup fee, get your unique referral link, and earn 50% commissions every month.",
  url: "https://primetrexaffiliates.com",
  signupFee: 15_000,
  subscription: {
    price: 50_000,
    currency: "NGN",
  },
  commission: {
    tier1Rate: 50,
    tier2Rate: 10,
  },
  minWithdrawal: 10_000,
  links: {
    telegram: "https://t.me/primetrex",
    twitter: "https://x.com/_primetrex",
    instagram: "https://www.instagram.com/_primetrex?igsh=Y2ZvMHhjbW5zcGs=",
  },
} as const;
