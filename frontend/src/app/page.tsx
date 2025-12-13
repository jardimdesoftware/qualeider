"use client";

import { Roboto, Roboto_Slab } from "next/font/google";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";

// Font Configuration
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

const robotoSlab = Roboto_Slab({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-roboto-slab",
});

export default function LandingPage() {
  return (
    <div className={`${roboto.variable} ${robotoSlab.variable} font-sans text-slate-800`}>
      <LandingNavbar />
      <HeroSection />
      <BenefitsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
