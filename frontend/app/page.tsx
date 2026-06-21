import { Nav } from "@/components/ui/Nav";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { StatsBand } from "@/components/landing/StatsBand";
import { ThreeBooks } from "@/components/landing/ThreeBooks";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Performance } from "@/components/landing/Performance";
import { Cta } from "@/components/landing/Cta";
import { Footer } from "@/components/landing/Footer";

const links = [
  { label: "The books", href: "#books" },
  { label: "How it works", href: "#how" },
  { label: "Performance", href: "#performance" },
];

export default function LandingPage() {
  return (
    <main className="relative">
      <Nav links={links} cta={{ label: "Launch app", href: "/app" }} />
      <Hero />
      <Marquee />
      <StatsBand />
      <ThreeBooks />
      <HowItWorks />
      <Performance />
      <Cta />
      <Footer />
    </main>
  );
}
