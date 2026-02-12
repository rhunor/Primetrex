import { HeroSection } from "@/components/features/home/hero-section";
import { FeaturesSection } from "@/components/features/home/features-section";
import { HowItWorksSection } from "@/components/features/home/how-it-works-section";
import { TrustSection } from "@/components/features/home/trust-section";
import { CommissionSection } from "@/components/features/home/commission-section";
import { SocialProofSection } from "@/components/features/home/social-proof-section";
import { CTASection } from "@/components/features/home/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TrustSection />
      <CommissionSection />
      <SocialProofSection />
      <CTASection />
    </>
  );
}
