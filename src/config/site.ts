export const siteConfig = {
  name: "Primetrex",
  tagline: "Let the Experts Trade, You Build the Business",
  description:
    "Earn money by affiliate Primetrex copy trading. Pay a one-time ₦10,000 signup fee, get your unique affiliate link, and earn 40% commissions every month.",
  url: "https://primetrexaffiliates.com",
  signupFee: 10_000,
  subscription: {
    price: 50_000,
    currency: "NGN",
  },
  commission: {
    // Earned when a referred person joins as an affiliate (pays the signup fee)
    tier1Rate: 40,
    // Earned on bot subscription payments (initial 50K and 35K renewals)
    subscriptionRate: 40,
    tier2Rate: 10,
  },
  minWithdrawal: 10_000,
  links: {
    telegram: "https://t.me/primetrex",
    affiliateCommunity: "https://t.me/Primetrexaffiliates",
    twitter: "https://x.com/_primetrex",
    instagram: "https://www.instagram.com/_primetrex?igsh=Y2ZvMHhjbW5zcGs=",
  },
} as const;
