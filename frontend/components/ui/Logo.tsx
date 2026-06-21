import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-7 w-7", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="13" y="17" width="38" height="5.2" rx="2.6" fill="#2DD4BF" />
      <rect x="13" y="29.4" width="38" height="5.2" rx="2.6" fill="#8B5CF6" />
      <rect x="13" y="41.8" width="38" height="5.2" rx="2.6" fill="#F5A524" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="font-display text-[19px] font-semibold tracking-tight text-white">
        Tribook
      </span>
    </span>
  );
}
