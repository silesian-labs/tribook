import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Vault", href: "/app" },
      { label: "Risk", href: "/app/risk" },
      { label: "The books", href: "#books" },
      { label: "Performance", href: "#performance" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { label: "DeepBook", href: "https://docs.sui.io/standards/deepbook" },
      { label: "Predict", href: "https://blog.sui.io" },
      { label: "Block Scholes", href: "https://blockscholes.com" },
      { label: "Pyth", href: "https://pyth.network" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Docs", href: "#" },
      { label: "GitHub", href: "#" },
      { label: "Twitter", href: "#" },
      { label: "Discord", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-4 pb-12 pt-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-white/45">
              The first vault that reads all three of DeepBook&apos;s books.
              Spot. Margin. Predict. Composed in one PTB.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/40">
              <span className="h-1.5 w-1.5 rounded-full bg-predict" />
              Sui Testnet · not financial advice
            </div>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[11px] uppercase tracking-eyebrow text-white/40">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-white/55 transition-colors duration-200 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="hairline-x mt-12" />
        <div className="mt-6 flex flex-col items-center justify-between gap-3 text-[12px] text-white/35 sm:flex-row">
          <p>© 2026 Tribook · Three books, one strategy.</p>
          <p className="font-mono">Built on Sui · DeepBook V3</p>
        </div>
      </div>
    </footer>
  );
}
