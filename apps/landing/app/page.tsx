import Nav from "@/components/landing/Nav";
import Hero from "@/components/landing/Hero";
import PainPoint from "@/components/landing/PainPoint";
import HowItWorks from "@/components/landing/HowItWorks";
import FeatureGrid from "@/components/landing/FeatureGrid";
import Pricing from "@/components/landing/Pricing";
import Testimonials from "@/components/landing/Testimonials";
import FooterCTA from "@/components/landing/FooterCTA";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <PainPoint />
      <HowItWorks />
      <FeatureGrid />
      <Pricing />
      <Testimonials />
      <FooterCTA />
    </main>
  );
}
