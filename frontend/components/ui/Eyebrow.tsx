import { cn } from "@/lib/cn";
import { ReactNode } from "react";

export function Eyebrow({
  children,
  className,
  dot = true,
  dotColor = "#2DD4BF",
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
  dotColor?: string;
}) {
  return (
    <span className={cn("eyebrow", className)}>
      {dot && (
        <span
          className="relative flex h-1.5 w-1.5"
          aria-hidden
        >
          <span
            className="absolute inline-flex h-full w-full rounded-full animate-pulse-ring"
            style={{ backgroundColor: dotColor }}
          />
          <span
            className="relative inline-flex h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        </span>
      )}
      {children}
    </span>
  );
}
