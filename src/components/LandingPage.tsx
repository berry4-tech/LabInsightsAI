import { Hero } from "./Hero";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { CTASection } from "./CTASection";

export function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <CTASection />
    </>
  );
}