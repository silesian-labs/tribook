import { partners } from "@/lib/mock";

export function Marquee() {
  const row = [...partners, ...partners];
  return (
    <section className="relative py-10">
      <p className="mb-6 text-center text-[11px] uppercase tracking-eyebrow text-white/30">
        Built on the full DeepBook stack
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex w-max animate-marquee gap-12 pr-12">
          {row.map((p, i) => (
            <span
              key={i}
              className="font-display text-lg font-medium tracking-tight text-white/35 transition-colors duration-300 hover:text-white/70"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
