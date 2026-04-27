import { AiSection } from "@/components/homepage/ai-section";
import { FeaturesSection } from "@/components/homepage/features-section";
import { FinalCtaSection } from "@/components/homepage/final-cta-section";
import { HomepageFooter } from "@/components/homepage/homepage-footer";
import { HomepageHero } from "@/components/homepage/homepage-hero";
import { HomepageNav } from "@/components/homepage/homepage-nav";
import { PricingSection } from "@/components/homepage/pricing-section";
import type { HomepageAction } from "@/components/homepage/homepage-data";

const primaryAction: HomepageAction = { href: "/register", label: "Get Started" };
const secondaryAction: HomepageAction = { href: "/sign-in", label: "Sign In" };

export default function Page() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05060f] text-zinc-50 [background-image:radial-gradient(circle_at_16%_8%,rgba(95,126,234,0.2),transparent_31rem),radial-gradient(circle_at_82%_4%,rgba(141,107,232,0.18),transparent_29rem),radial-gradient(circle_at_52%_42%,rgba(231,213,173,0.06),transparent_32rem),linear-gradient(180deg,#05060f_0%,#090b18_44%,#05060f_100%)]">
      <HomepageNav primaryAction={primaryAction} secondaryAction={secondaryAction} />
      <main>
        <HomepageHero primaryAction={primaryAction} />
        <FeaturesSection />
        <AiSection />
        <PricingSection />
        <FinalCtaSection primaryAction={primaryAction} />
      </main>
      <HomepageFooter />
    </div>
  );
}
